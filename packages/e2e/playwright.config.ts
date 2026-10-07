import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as path from 'path'

import { apiUrl, assertE2eDatabaseUrl, databaseUrl, LOCAL, mailApiUrl, repoRoot, webUrl } from './e2e-local'

dotenv.config({ path: path.resolve(__dirname, '.env') })

// `pnpm test:e2e:local` runs the suite against its own database, API, web app,
// and mail inbox, so it never touches the dev stack. CI leaves E2E_LOCAL unset
// and starts its own services.
const local = process.env.E2E_LOCAL === '1'
if (local) {
  assertE2eDatabaseUrl(databaseUrl)
  process.env.E2E_BASE_URL = webUrl
  process.env.E2E_API_URL = apiUrl
  process.env.E2E_MAIL_API_URL = mailApiUrl
}

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

// Reset the database first (drop it, apply every migration), then build the API
// into its own folder so the dev watcher's `dist` stays untouched, then start it.
const apiCommand = [
  'pnpm --filter api exec prisma migrate reset --force --skip-seed --skip-generate',
  'pnpm --filter api exec tsc -p tsconfig.build.json --outDir dist-e2e --tsBuildInfoFile dist-e2e/tsconfig.build.tsbuildinfo',
  'cd apps/api && node dist-e2e/main.js',
].join(' && ')

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // One worker in CI and in the isolated local run: some account specs are not
  // stable in parallel. Plain `pnpm test:e2e` against your own servers keeps the default.
  workers: process.env.CI || local ? 1 : undefined,
  // CI: one line per test in the log, failure annotations on the PR, and the
  // HTML report for the uploaded artifact. Locally: the HTML report only.
  reporter: process.env.CI ? [['list'], ['github'], ['html', { open: 'never' }]] : 'html',
  timeout: 30_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  globalSetup: local ? './global-setup.ts' : undefined,
  webServer: local
    ? [
        {
          command: apiCommand,
          cwd: repoRoot,
          url: `${apiUrl}/`,
          timeout: 180_000,
          reuseExistingServer: false,
          env: {
            DATABASE_URL: databaseUrl,
            PORT: String(LOCAL.apiPort),
            CLIENT_URL: webUrl,
            SMTP_HOST: 'localhost',
            SMTP_PORT: String(LOCAL.smtpPort),
          },
        },
        {
          // A production build, as in CI: `next dev` compiles pages on demand and
          // is slow and flaky under load. It builds into its own folder, so
          // the dev web server's `.next` stays untouched.
          command: `pnpm --filter web exec next build && pnpm --filter web exec next start -p ${LOCAL.webPort}`,
          cwd: repoRoot,
          url: webUrl,
          timeout: 180_000,
          reuseExistingServer: false,
          env: {
            NEXT_BUILD_DIR: '.next-e2e',
            NEXT_PUBLIC_BASE_URL: apiUrl,
          },
        },
      ]
    : undefined,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})

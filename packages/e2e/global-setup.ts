import { spawnSync } from 'child_process'
import { apiUrl, assertE2eDatabaseUrl, databaseUrl, repoRoot } from './e2e-local'

// Local runs only. By now Playwright has started the E2E API on an empty,
// freshly migrated database, so the seed (the same one CI runs) goes through
// that API. The admin account matches the one the admin tests log in with.
export default async function globalSetup() {
  if (process.env.E2E_LOCAL !== '1') return

  assertE2eDatabaseUrl(databaseUrl)

  const result = spawnSync('pnpm', ['--filter', 'api', 'seed:api'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      SEED_API_URL: `${apiUrl}/api`,
      SEED_ADMIN_EMAIL: process.env.E2E_ADMIN_EMAIL ?? 'seed-admin@dionis-store.local',
      SEED_ADMIN_PASSWORD: process.env.E2E_ADMIN_PASSWORD ?? 'seed-admin-password',
    },
  })
  if (result.status !== 0) {
    throw new Error('Seeding the E2E database failed')
  }
}

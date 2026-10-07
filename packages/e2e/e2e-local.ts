import * as path from 'path'

// Settings for the isolated local E2E run (`pnpm test:e2e:local`). CI does not
// read this file: it starts its own services and sets the E2E_* variables.

export const repoRoot = path.resolve(__dirname, '../..')

export const LOCAL = {
  webPort: 3001,
  apiPort: 3501,
  smtpPort: 1026,
  mailApiPort: 8026,
  databaseUrl: 'postgresql://postgres@localhost:5433/dionis_store_e2e',
}

export const databaseUrl = process.env.E2E_DATABASE_URL ?? LOCAL.databaseUrl
export const webUrl = `http://localhost:${LOCAL.webPort}`
export const apiUrl = `http://localhost:${LOCAL.apiPort}`
export const mailApiUrl = `http://localhost:${LOCAL.mailApiPort}`

// The run resets this database (drops it and applies every migration), so it
// must never be the dev database. A database name that ends in `_e2e` is the
// one thing every E2E database in this repo shares.
export function assertE2eDatabaseUrl(url: string) {
  const name = new URL(url).pathname.slice(1)
  if (!name.endsWith('_e2e')) {
    throw new Error(
      `Refusing to reset the database "${name}": an E2E database name must end in "_e2e". ` +
        'Check E2E_DATABASE_URL.',
    )
  }
}

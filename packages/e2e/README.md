# @repo/e2e

This package holds Playwright end-to-end tests for the Dionis Store web app.
The tests drive the app through a real browser. They do not mock the front end
or the back end. `pnpm test:e2e:local` starts its own copies, and `pnpm test:e2e`
runs against the ones that you start yourself.

## Isolated local run

`pnpm test:e2e:local` (from the repo root or this package) runs the whole suite on its own stack, so it never touches your dev servers or your dev database. It starts `docker-compose.e2e.yml` (Postgres on port 5433 and Mailpit on ports 1026 and 8026), resets the database (`prisma migrate reset`), builds the API into `apps/api/dist-e2e`, and builds the web app into `apps/web/.next-e2e`. The API runs on port 3501 and the web app on port 3001. The seed runs in `global-setup.ts`. The settings are in `e2e-local.ts`.

The reset refuses to run unless the database name ends in `_e2e`. The database stays up after the run, and the next run resets it. `pnpm e2e:down` removes it.

## Prerequisites

The sections below describe a run against servers that you start yourself, which is how CI runs (`pnpm test:e2e`).

Start the app stack yourself first, from the repo root:

```sh
pnpm dev:api   # apps/api on http://localhost:3500 (needs its DB running, see apps/api/docker-compose.yml)
pnpm dev:web   # apps/web on http://localhost:3000
```

The receipt email tests also need Mailpit, and the API must send to it. See "Receipt emails" in the root `README.md`.

The game-library tests also need games in the database. Seed the database once:

```sh
pnpm --filter api build:mock
pnpm --filter api insert:mock
```

## Configuration

If your local front end or API runs on a non-default port, copy `.env.example` to `.env` and edit the values:

```sh
cp .env.example .env
```

- `E2E_BASE_URL`: the running web app. Default value: `http://localhost:3000`.
- `E2E_API_URL`: the running API. Default value: `http://localhost:3500`. Specs that call the API directly can use this value.

## Running

```sh
pnpm install
npx playwright install chromium   # first time only
pnpm test:e2e             # headless
pnpm test:e2e:ui          # Playwright UI mode
pnpm test:e2e:headed      # headed browser
pnpm test:e2e:report      # open the last HTML report
```

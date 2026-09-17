# @repo/e2e

This package holds Playwright end-to-end tests for the Dionis Store web app.
The tests drive the app through a real browser. They run against your local
front end and local back end. They do not start or mock either one.

## Prerequisites

Start the app stack yourself first, from the repo root:

```sh
pnpm dev:api   # apps/api on http://localhost:8080 (needs its DB running, see apps/api/docker-compose.yml)
pnpm dev:web   # apps/web on http://localhost:3000
```

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
- `E2E_API_URL`: the running API. Default value: `http://localhost:8080`. Specs that call the API directly can use this value.

## Running

```sh
pnpm install
npx playwright install chromium   # first time only
pnpm test:e2e             # headless
pnpm test:e2e:ui          # Playwright UI mode
pnpm test:e2e:headed      # headed browser
pnpm test:e2e:report      # open the last HTML report
```

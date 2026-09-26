# Dionis Store

Dionis Store is an online store for PC games. The project has two applications: a web storefront and an API. Both live in this pnpm and Turborepo monorepo.

## Apps and packages

- `apps/web`: the storefront, built with Next.js. It shows the game catalog, cart, and wishlist.
- `apps/api`: the backend, built with NestJS. It handles authentication, users, and games, and stores data in a PostgreSQL database through Prisma.
- `packages/dionis-api`: a typed API client for the web app. Orval generates it from the API.
- `packages/e2e`: end-to-end tests, built with Playwright. The tests run against a live web app and API.
- `packages/ui`: shared React components for the web app.
- `packages/eslint-config`, `packages/prettier-config`, `packages/typescript-config`: shared lint, format, and TypeScript settings.

## Prerequisites

Install Node.js 18 or later. Install pnpm 8.9.0. Set up a local PostgreSQL database and note its connection URL.

## Setup

Run the following command from the repository root to install dependencies for every app and package.

```sh
pnpm install
```

Copy `apps/api/.env.example` to `apps/api/.env`, then fill in `DATABASE_URL` and the other values. Copy `apps/web/.env.example` to `apps/web/.env`, then fill in `NEXT_PUBLIC_BASE_URL`. If you plan to run the end-to-end tests, copy `packages/e2e/.env.example` to `packages/e2e/.env` too. The root `.env.example` lists every variable from all three files in one place, for reference.

Run the following command from `apps/api` to apply database migrations.

```sh
pnpm migrate
```

## Development

Run the following command from the repository root to start both the web app and the API together.

```sh
pnpm dev
```

The API listens on the port set in `apps/api/.env` (`3500` if `PORT` is not set) and serves routes under `/api`. The web app listens on port 3000.

To start only one app, run one of the following commands instead.

```sh
pnpm dev:api
pnpm dev:web
```

## Stripe webhook

The API creates an order when Stripe reports a successful payment, even if the browser closes before checkout finishes. Stripe delivers that event to `POST /api/orders/webhook`. To receive it locally, install the Stripe CLI and run the following command while the API runs.

```sh
stripe listen --events payment_intent.succeeded --forward-to localhost:3500/api/orders/webhook
```

The command prints a signing secret that starts with `whsec_`. Put it in `apps/api/.env` as `STRIPE_WEBHOOK_SECRET`, then restart the API. Without it, checkout still works through the browser, but the webhook route returns `500`.

## Seed data

To seed sample games into a running API, run the following command from `apps/api`.

```sh
pnpm seed:api
```

This command reads `SEED_API_URL`, `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD` from `apps/api/.env`.

## Testing

Run the following command from the repository root to run unit tests across all apps.

```sh
pnpm test
```

Run the following command from the repository root to run the Playwright end-to-end tests. Before you run it, start the web app and the API.

```sh
pnpm test:e2e
```

## Build and lint

Run the following command from the repository root to build all apps and packages.

```sh
pnpm build
```

Run the following command from the repository root to lint all apps and packages.

```sh
pnpm lint
```

Run the following command from the repository root to typecheck all apps.

```sh
pnpm typecheck
```

## Continuous integration

The workflow at `.github/workflows/pr-workflow.yml` runs on every pull request into `main`. It has two jobs.

- `checks`: runs lint, the typecheck, the build, and the unit tests for `apps/web` and `apps/api`.
- `e2e`: starts a Postgres container, applies the migrations, starts the API and the web app, seeds the games, and runs the Playwright suite.

The `e2e` job needs two repository secrets: `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Use Stripe test-mode keys only. If a test fails, the job uploads the Playwright report and the server logs as an artifact.

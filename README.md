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

## Receipt emails

After an order is created, the API emails a receipt with the activation codes. It sends the email through SMTP. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM` in `apps/api/.env`. If `SMTP_HOST` is empty, the API starts and sends no email.

For local development, run Mailpit, a mail catcher. It accepts SMTP on port 1025 and shows every email at `http://localhost:8025`. No email leaves your machine.

```sh
docker compose -f apps/api/docker-compose.yml up -d mailpit
```

## Admin panel

A user with the Admin role (`500`) can open `/admin` from the account menu. There, the user manages games and their physical editions and sees every customer's order. `pnpm seed:api` creates an admin with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`, so after seeding you can log in with those values. The admin panel E2E tests log in with `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`, which default to the same account.

## Rate limiting

The API allows 300 requests a minute per client IP, and 10 a minute on login, register, and password change. It answers `429` after that. Behind a reverse proxy, set `TRUST_PROXY` to the number of proxies (the production compose file sets it to 1), or all users share one limit. Set `RATE_LIMIT=off` only for tests, because they sign up many users from one address. To exempt chosen client IPs, list them in `RATE_LIMIT_SKIP_IPS`, separated by commas. Those IPs have no limit on any route, login included.

## Seed data

To seed sample games into a running API, run the following command from `apps/api`.

```sh
pnpm seed:api
```

This command reads `SEED_API_URL`, `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD` from `apps/api/.env`. `SEED_ADMIN_PASSWORD` has no default, and the seed stops if it is not set. The seed creates the admin account directly in the database. If an account with `SEED_ADMIN_EMAIL` already exists without the admin role, the seed stops and does not promote it. On a public deployment, set a long random password.

## Testing

Run the following command from the repository root to run unit tests across all apps.

```sh
pnpm test
```

Run the following command from the repository root to run the Playwright end-to-end tests on their own stack. It needs Docker and the Stripe test keys in `apps/api/.env` and `apps/web/.env`. It does not use your dev servers or your dev database.

```sh
pnpm test:e2e:local
```

The command starts a Postgres database on port 5433 (kept in RAM) and Mailpit on ports 1026 and 8026. Then it resets the database, applies the migrations, and starts its own API on port 3501 and web app on port 3001. After the servers are up, it seeds the games. The database stays up after the run, so you can inspect it, and the next run resets it. To remove it, run the following command.

```sh
pnpm e2e:down
```

To run one spec, add its path to the command, for example `pnpm test:e2e:local tests/payment.spec.ts`. The command runs the specs one at a time, because some account specs are not stable in parallel. To try parallel runs, add `--workers=4`.

`pnpm test:e2e` runs the same tests against the web app and API that you start yourself. CI uses it.

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

## Single-host deployment

`docker-compose.prod.yml` runs Postgres, the API, and the web app on one machine, for example one EC2 instance. Copy the variables listed under `docker-compose.prod.yml` in `.env.example` into `.env.prod`. Set `DOMAIN` to your host name, with a DNS A record that points to the server and ports 80 and 443 open. Caddy then serves the site on `https://<DOMAIN>` and gets its certificate. Only Caddy publishes ports (80 and 443). The web app and the API are reachable only inside the Docker network, and they run as a non-root user. Caddy adds the security headers. Set `CLIENT_URL` and `NEXT_PUBLIC_BASE_URL` to that `https://` address. Only if the site has no HTTPS, set `COOKIE_SECURE=false`. Without it, browsers drop the refresh cookie and every page load logs the user out. Set `NEXT_PUBLIC_BASE_URL` to the public API origin and `CLIENT_URL` to the public web origin.

```sh
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm api pnpm exec prisma migrate deploy
```

## Continuous integration

The workflow at `.github/workflows/pr-workflow.yml` runs on every pull request into `main`. It has two jobs.

- `checks`: runs lint, the typecheck, the build, and the unit tests for `apps/web` and `apps/api`.
- `e2e`: starts a Postgres container, applies the migrations, starts the API and the web app, seeds the games, and runs the Playwright suite.

The `e2e` job needs two repository secrets: `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Use Stripe test-mode keys only. If a test fails, the job uploads the Playwright report and the server logs as an artifact.

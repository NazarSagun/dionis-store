# Dionis Store — Repo Rules

Dionis Store is a pnpm and Turborepo monorepo. It has two apps and several shared packages. `apps/web` is a Next.js storefront. `apps/api` is a NestJS backend. The shared packages are `packages/dionis-api`, `packages/ui`, `packages/e2e`, `packages/eslint-config`, `packages/prettier-config`, and `packages/typescript-config`.

Package-specific rules live in `apps/web/CLAUDE.md` and `apps/api/CLAUDE.md`. This file holds the rules that apply everywhere.

## CI gates

The workflow at `.github/workflows/pr-workflow.yml` runs on every pull request into `main`. The `checks` job runs lint, the typecheck, the build, and the unit tests for `apps/web` and `apps/api`. The `e2e` job runs the Playwright suite in `packages/e2e` against a Postgres container, a built API, and a built web app.

Run the same checks locally before you push, because a CI run is slow feedback.

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm test --filter web
pnpm test --filter api
```

If your change touches the UI, also run the affected Playwright specs in `packages/e2e`. Do this while the local API and web app both run.

## Reuse the shared package instead of writing it again

If you need typed API calls from the web app, use the generated `packages/dionis-api` client. It exposes React Query hooks such as `useGetGames`. Do not call `fetch` or axios directly from `apps/web` code. No file in the app does this today. Keep it that way.

If you need persisted client state, follow the pattern in `useCartStore`, `useWishlistStore`, and `useAuthStore` under `apps/web/modules/*/core/store.ts`. Each one combines `zustand`'s `create` with the `persist` middleware and a `partialize` option. Do not write your own `localStorage.getItem` and `setItem` calls inside a store.

If you need a shared lint, Prettier, or TypeScript configuration, point the app's configuration at `packages/eslint-config`, `packages/prettier-config`, or `packages/typescript-config`. Do not inline a duplicate copy of these rules. `apps/web/tsconfig.json` extends `nextjs.json` and `apps/api/tsconfig.json` extends `nestjs.json`. An app keeps only the options that must be relative to its own folder, such as `outDir`, `rootDir`, `include`, and `paths`. A new app extends the shared file that matches its framework, or `base.json` if none matches.

## Configuration

Application code must never hardcode a port, a hostname, or an API base URL. Every port and URL already comes from an environment variable. Examples are `PORT`, `NEXT_PUBLIC_BASE_URL`, `SEED_API_URL`, and `E2E_API_URL`. The root `.env.example` file lists the full set. If you add a new environment variable, add its default value to `.env.example` in the same commit. Do not add it only to your local `.env` file.

## Keep docs in sync with the code

If you change a default value, such as a port or a command, update every place that records it in the same change. Examples of such a place are `.env.example` files, `README.md`, and any `CLAUDE.md` file. A wrong default in a doc causes more harm than a missing doc.

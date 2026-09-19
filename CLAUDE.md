# Dionis Store — Repo Rules

Dionis Store is a pnpm and Turborepo monorepo. It has two apps and several shared packages. `apps/web` is a Next.js storefront. `apps/api` is a NestJS backend. The shared packages are `packages/dionis-api`, `packages/ui`, `packages/e2e`, `packages/eslint-config`, `packages/prettier-config`, and `packages/typescript-config`.

Package-specific rules live in `apps/web/CLAUDE.md` and `apps/api/CLAUDE.md`. This file holds the rules that apply everywhere.

## CI does not gate everything

The workflow at `.github/workflows/pr-workflow.yml` runs on every pull request into `main`. It runs `pnpm install`, `pnpm build`, and `pnpm test --filter web`. It does not run lint. It does not run a typecheck. It does not run the `apps/api` test suite. It does not run the Playwright suite in `packages/e2e`.

A green pull request does not prove that lint, the typecheck, or the API tests pass. Before you call a change done, run these checks yourself.

```sh
pnpm lint
pnpm build
pnpm test --filter web
pnpm test --filter api
```

If your change touches the UI, also run the affected Playwright specs in `packages/e2e`. Do this while the local API and web app both run.

## Reuse the shared package instead of writing it again

If you need typed API calls from the web app, use the generated `packages/dionis-api` client. It exposes React Query hooks such as `useGetGames`. Do not call `fetch` or axios directly from `apps/web` code. No file in the app does this today. Keep it that way.

If you need persisted client state, follow the pattern in `useCartStore` and `useWishlistStore` under `apps/web/features/*/store`. Both combine `zustand`'s `create` with the `persist` middleware and a `partialize` option. Do not write your own `localStorage.getItem` and `setItem` calls inside a store. `useAuthStore` does this today. Treat it as a known inconsistency, not a pattern to copy.

If you need a shared lint, Prettier, or TypeScript configuration, point the app's configuration at `packages/eslint-config`, `packages/prettier-config`, or `packages/typescript-config`. Do not inline a duplicate copy of these rules. Today, `apps/web` and `apps/api` each inline their own `tsconfig.json` configuration instead of extending `packages/typescript-config/base.json`. Do not add a third inline copy. If you touch either tsconfig, wire it to the shared configuration instead.

## Configuration

Application code must never hardcode a port, a hostname, or an API base URL. Every port and URL already comes from an environment variable. Examples are `PORT`, `NEXT_PUBLIC_BASE_URL`, `SEED_API_URL`, and `E2E_API_URL`. The root `.env.example` file lists the full set. If you add a new environment variable, add its default value to `.env.example` in the same commit. Do not add it only to your local `.env` file.

## Keep docs in sync with the code

If you change a default value, such as a port or a command, update every place that records it in the same change. Examples of such a place are `.env.example` files, `README.md`, and any `CLAUDE.md` file. A wrong default in a doc causes more harm than a missing doc.

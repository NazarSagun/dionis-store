# apps/web — Frontend Rules

This file extends the root `CLAUDE.md`. It holds rules specific to the Next.js storefront in `apps/web`.

## Feature folder shape

Each feature lives under `features/<name>`. A feature can have a `components/` folder, a `store/` folder, a `helpers.ts` file, and a `hooks/` folder. Each component gets its own folder with an `index.ts` that re-exports it. Each feature has its own `index.ts` at its root that re-exports its components, store, helpers, and hooks.

Import a feature's state through that feature's root `index.ts`, not through the store file's internal path. `GameCard.tsx` imports `useWishlistStore` through the internal path today. Treat this as debt to clean up, not a pattern to copy.

## Client state

A store that must survive a page reload uses `zustand`'s `create` together with the `persist` middleware and a `partialize` option. `useCartStore` and `useWishlistStore` follow this pattern. Use them as the template for a new store.

`useAuthStore` breaks this pattern. It calls `localStorage.getItem`, `setItem`, and `removeItem` by hand instead of using `persist`. Do not copy this. If you touch `useAuthStore`, prefer migrating it to `persist` over adding more hand-rolled storage calls.

## Data fetching

Fetch data only through the generated client in `packages/dionis-api`. It exposes React Query hooks such as `useGetGames` and `useGetGamesTopDeals`. Do not call `fetch` or axios directly from a component, a hook, or a store in `apps/web`. If the generated client is missing an endpoint you need, add it to the OpenAPI source that Orval reads from. Then regenerate the client. Do not work around a missing endpoint with a manual request.

## Design tokens

Use the tokens defined in `apps/web/tailwind.config.ts` and `apps/web/app/globals.css`. The tokens for this product's own look are:

- `ink`
- `panel-alt`
- `neon-magenta`, `neon-cyan`, `neon-amber`, `neon-green`
- `retro` and `retro-sm` for shadows

The tokens for general layout are the standard semantic set:

- `border`, `input`, `ring`
- `background`, `foreground`
- `primary`, `secondary`, `destructive`, `muted`, `accent`
- `popover`, `card`

Do not write a raw hex value in a component's class name. `CartNavigation.tsx` and `GameCard.tsx` each have one raw hex value today. Treat these as debt to clean up, not examples to copy. A raw hex value inside a Storybook `backgrounds` decorator in a `.stories.tsx` file is tooling configuration, not app UI. This rule does not apply to it.

## Tests

Use Vitest and React Testing Library. Put a component's test in a `__tests__` folder next to the component, named `Component.test.tsx`. Put a store's test in a `__tests__` folder next to the store, named `useXStore.test.ts`.

Use the `render` helper from `apps/web/test-utils/utils.tsx` instead of React Testing Library's own `render`. This helper wraps the tree in a `QueryClientProvider` and connects the MSW mock server.

A store that other tests can mutate needs a reset. Add its reset call to the global `afterEach` in the test setup, next to the existing `useAuthStore` and `useCartStore` resets.

## Test IDs for end-to-end coverage

Give a `data-testid` to each container. Give one to each interactive or verifiable element inside it, such as a card, a badge, or a toggle. Use a plain lowercase name with hyphens between words, such as `wishlist-toggle` or `discount-badge`. Do not build a `data-testid` from a template string with a dynamic value inside it.

## Lint

Run `pnpm lint` inside `apps/web` before you call a change done. It runs with `--max-warnings 0`, so a warning fails the same way an error does. The `simple-import-sort` rule enforces one fixed import group order. If you see an import-order warning, run `pnpm lint --fix` first, instead of reordering the lines by hand.

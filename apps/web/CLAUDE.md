# apps/web — Frontend Rules

This file extends the root `CLAUDE.md`. It holds rules specific to the Next.js storefront in `apps/web`.

## Module folder shape

Each module lives under `modules/<name>` (`account`, `auth`, `cart`, `games`, `wishlist`). This follows `.claude/rules/frontennd-architecture.md`. A module can have four folders. `domain/` holds types and pure business logic. `core/` holds `store.ts` for the zustand store and `facade.ts` for the selector and trigger hooks that components use. `integration/` holds `repository.ts`, a thin re-export seam around `packages/dionis-api` hooks and DTO types. `presentation/` holds one folder per component.

A module with no client state, such as `games`, has no `core/` folder.

There are no barrel files in `apps/web`. No folder has an `index.ts` that re-exports its contents, at the module root or inside `presentation/`. Import each piece from the file that defines it, such as `@/modules/cart/core/facade` or `@/modules/cart/presentation/summary/Summary`. This applies inside a module's own `presentation/` folder too. `ShoppingCart.tsx` imports `Summary` from `../summary/Summary`, not from `../summary` or from `..`.

Import a module's state through its facade (`core/facade.ts`). Use hooks such as `useCartItems` or `useIsAuthenticated`. Do not call the store's selector directly from a component. Import a module's API calls through its own `integration/repository.ts`. Do not import `@repo/dionis-api` directly from a component. This way, a component reaches only one file deep into another module.

One case is an exception to this rule. Test setup sometimes needs to reset a whole store. That code can import the store itself, such as `useCartStore` or `useAuthStore`. Import it from the module's own `core/store.ts`.

## Client state

A store that must survive a page reload uses `zustand`'s `create` together with the `persist` middleware and a `partialize` option. `useCartStore`, `useWishlistStore`, and `useAuthStore` follow this pattern. Use them as the template for a new store.

## Data fetching

Fetch data only through the generated client in `packages/dionis-api`. It exposes React Query hooks such as `useGetGames` and `useGetGamesTopDeals`. Do not call `fetch` or axios directly from a component, a hook, or a store in `apps/web`. If the generated client is missing an endpoint you need, add it to the OpenAPI source that Orval reads from. Then regenerate the client. Do not work around a missing endpoint with a manual request.

Inside a module, import these hooks through that module's own `integration/repository.ts`, not directly from `packages/dionis-api`. `app/*` route files sit outside every module. A route file can still call `packages/dionis-api` hooks directly, for a flow such as login or checkout that spans more than one module.

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

Use Vitest and React Testing Library. Put a component's test in a `__tests__` folder next to the component, named `Component.test.tsx`. Put a store's test in the module's root `__tests__` folder, named `store.test.ts`.

Use the `render` helper from `apps/web/test-utils/utils.tsx` instead of React Testing Library's own `render`. This helper wraps the tree in a `QueryClientProvider` and connects the MSW mock server.

A store that other tests can mutate needs a reset. Add its reset call to the global `afterEach` in the test setup, next to the existing `useAuthStore` and `useCartStore` resets.

## Test IDs for end-to-end coverage

Give a `data-testid` to each container. Give one to each interactive or verifiable element inside it, such as a card, a badge, or a toggle. Use a plain lowercase name with hyphens between words, such as `wishlist-toggle` or `discount-badge`. Do not build a `data-testid` from a template string with a dynamic value inside it.

## Lint

Run `pnpm lint` inside `apps/web` before you call a change done. It runs with `--max-warnings 0`, so a warning fails the same way an error does. The `simple-import-sort` rule enforces one fixed import group order. If you see an import-order warning, run `pnpm lint --fix` first, instead of reordering the lines by hand.

# apps/web — Frontend Rules

This file extends the root `CLAUDE.md`. It holds the conventions of the Next.js storefront that no config enforces. `pnpm lint` enforces the rest (see "Lint").

## Module shape

Each module lives under `modules/<name>` and follows `.claude/rules/frontennd-architecture.md`. A module has up to four folders:

- `domain/` holds types and pure business logic.
- `core/` holds `store.ts` (zustand) and `facade.ts` (the selector and trigger hooks that components use). A module with no client state, such as `games`, has no `core/`.
- `integration/` holds `repository.ts`, a thin re-export seam around `packages/dionis-api` hooks and DTO types.
- `presentation/` holds one folder per component.

A component reaches another module through two files. Use its `core/facade.ts` for state, such as `useCartItems` and `useIsAuthenticated`. Use its `integration/repository.ts` for API calls. That keeps every cross-module import one file deep. Tests can import a store from its own `core/store.ts` to reset it.

Import each piece from the file that defines it, such as `@/modules/cart/presentation/summary/Summary`. That holds inside a module's own `presentation/` folder too: `ShoppingCart.tsx` imports `Summary` from `../summary/Summary`.

## Client state

State that must survive a reload follows `useCartStore`, `useWishlistStore`, and `useAuthStore`: zustand `create` with the `persist` middleware and a `partialize` option. `useAuthStore` keeps the access token out of `partialize`, so the token stays in memory.

## Data fetching

Fetch through the generated client in `packages/dionis-api` (`useGetGames`, `useGetGamesTopDeals`). If an endpoint is missing, add it to the OpenAPI source that Orval reads, then regenerate the client. `app/*` route files sit outside every module, so they call `packages/dionis-api` hooks directly for flows that span modules, such as login or checkout.

## Styling

Take colors and shadows from the tokens in `apps/web/tailwind.config.ts` and `apps/web/app/globals.css`. A raw hex value is fine only inside a Storybook `backgrounds` decorator in a `.stories.tsx` file.

## Tests

- Use Vitest and React Testing Library, with the `render` helper from `apps/web/test-utils/utils.tsx`. It wraps the tree in a `QueryClientProvider` and connects the MSW mock server.
- A component's test goes in a `__tests__` folder next to it, named `Component.test.tsx`. A store's test goes in the module's root `__tests__` folder, named `store.test.ts`.
- Add the reset call of a store that other tests can mutate to the global `afterEach` of the test setup, next to the `useAuthStore` and `useCartStore` resets.

## Test IDs for end-to-end coverage

Give a `data-testid` to each container, and to each interactive or verifiable element inside it, such as a card, a badge, or a toggle. Write it in lowercase with hyphens, such as `wishlist-toggle` or `discount-badge`.

## Lint

Run `pnpm lint` inside `apps/web` before you call a change done. It runs with `--max-warnings 0`, so a warning fails like an error. For an import-order warning, run `pnpm lint --fix` first. The shared rules live in `packages/eslint-config/next.js` and `packages/eslint-config/shared-rules.js`. Read them to see what lint enforces.

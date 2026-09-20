# Home Page Features Spec: Search, Top Deals, and Wishlist

## Purpose

Today the home page shows only a paginated game grid. A user cannot search or filter the list, cannot see discounted games without paging through the catalog, and cannot save a game to revisit later. This spec defines three additions: a search and filter toolbar, a Top Deals section, and a Wishlist section.

## Design reference

Figma frame name: Home: Search, Deals & Wishlist (proposal). Link:
https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=17-176

This frame is a proposal. It does not replace the original "Home" frame in the file.

## Assumptions and dependencies

The `useGetGames` hook (`packages/dionis-api`) accepts only a `page` number. It returns a fixed page size with no search, filter, sort, or discount-only query support.

Each feature below needs a backend change before it can work across the full game catalog. Without that change, a feature can only act on the games already loaded on the current page, which gives incomplete and misleading results. List the required API change as a blocking dependency for each feature, not an implementation detail to skip.

## Feature 1: Search, Filter, and Sort Toolbar

### Description

A toolbar above the game grid lets the user narrow and reorder the game list. It has a search field, a platform filter, and a sort control.

### Requirements

1. The search field must filter games by title. The match must ignore letter case.
2. The platform filter must let the user pick one platform (for example PC, PS5, Xbox, Switch) or "All."
3. The sort control must offer at least: price (low to high), price (high to low), and rating (high to low).
4. The toolbar must combine search, filter, and sort. For example, a search term and a platform filter must both apply to the same result set.
5. The result set must update the pagination control so the page count matches the filtered result, not the full catalog.
6. Blocking dependency: the games API must accept `search`, `platform`, and `sort` query parameters and apply them before pagination. Client-side filtering of a single loaded page does not meet requirement 5.

### Acceptance criteria

- A user types a title fragment in the search field. The grid shows only games whose title contains that fragment.
- A user picks a platform. The grid shows only games available on that platform.
- A user picks a sort option. The grid order changes to match it.
- A user clears the search field. The grid returns to the unfiltered, default-sorted list.

### Out of scope

- Saved or shareable filter combinations (for example a URL with query parameters).
- Filtering by genre, price range, or release date.

## Feature 2: Top Deals Section

### Description

A row above the game grid highlights games with the highest discount.

### Requirements

1. The section must show only games with `discount > 0`.
2. The section must order games by discount, highest first.
3. The section must show at most 10 games. If fewer than 10 games have a discount, the section shows only those.
4. If no game has a discount, the section must not render (no empty heading, no empty row).
5. Blocking dependency: the games API must support fetching games sorted by discount across the full catalog, not only the current page.

### Acceptance criteria

- Every card in the Top Deals section shows a discount badge.
- The first card in the section has the highest discount value in the catalog.
- When the catalog has zero discounted games, the Top Deals heading and row are both absent from the page.

### Out of scope

- Countdown timers or deal expiry dates.
- Per-user or per-region deal pricing.

## Feature 3: Wishlist Section

### Description

A user can mark a game as a favorite from any game card. The home page shows a Wishlist section listing those games.

### Requirements

1. Each game card (grid, Top Deals, and the game details page) must show a toggle control to add or remove the game from the wishlist.
2. The wishlist must persist in the browser's local storage. Use the same pattern the cart store already uses (`packages/apps/web/features/cart/store/useCartStore.ts`), so the list survives closing and reopening the tab.
3. The wishlist must work for a guest (not logged in) user, matching the cart's current guest-friendly behavior.
4. The Wishlist section on the home page must show every saved game, most recently added first.
5. If the wishlist is empty, the section must not render.
6. Removing a game from the wishlist (from any card) must update the Wishlist section without a page reload.

### Acceptance criteria

- A user toggles the wishlist control on a game card. The game appears in the Wishlist section.
- A user closes and reopens the browser tab. The Wishlist section still shows the saved game.
- A user removes a game from the Wishlist section. The section updates immediately and the toggle control on that game's card (wherever shown) reflects the removed state.
- A guest user with an empty wishlist does not see the Wishlist heading on the home page.

### Design gap

The current `GameCard` component in Figma exposes no wishlist toggle (no icon, no component property for it). Design must add a heart-icon toggle state to `GameCard` before this feature can reach the same design fidelity as Feature 1 and Feature 2.

### Out of scope

- Syncing the wishlist to a user account or across devices.
- Wishlist sharing or export.

## Cross-feature requirements

- Each new section (Toolbar, Top Deals, Wishlist) must expose a `data-testid` on its container and on each game card. Follow the existing `card` test ID pattern used in `packages/e2e/tests/home.spec.ts`. This lets QA write Playwright coverage without new test infrastructure.
- All three sections must degrade gracefully while data loads (existing `Loader` component) and on API error (no broken layout, no unhandled exception).

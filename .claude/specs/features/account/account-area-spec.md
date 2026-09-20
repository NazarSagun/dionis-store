# Account Area Spec

## Purpose

`MainNavigation.tsx` already renders an account icon that links to `/account`. No route exists at `apps/web/app/account` today, so the link 404s. `checkout-payment-activation-spec.md` (Feature 2) and `progress.md` both name this gap directly. `progress.md`'s "Current problems" section says: "No account or order-history page. The data model supports one. Building it is out of scope for this work, by design." This spec is that page.

The data the page needs already exists. `Order` and `OrderItem` (`apps/api/prisma/schema.prisma`) store, per purchased game, its `activationCode`, `activated` flag, and `activatedAt` timestamp. Each row is keyed to a user through `Order.userId`. The wishlist also already exists as a full feature: `useWishlistStore` (`apps/web/features/wishlist/store`) and `WishlistSection` (`apps/web/features/wishlist/components/wishlist-section`). Today it renders only on the home page (`apps/web/app/page.tsx`).

This spec adds an `/account` page with two sections. The first is a purchased-games library that shows each game's activation code and activation status. The second is the existing wishlist. This spec adds no new data model. It adds one new backend endpoint (see Assumptions), because no endpoint today lists every order for a user.

## Design reference

Figma frame: "Account" (draft, pending review). Same file as the Home and Checkout redesigns:
https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=89-481

Covers all 8 features on one page: greeting header, a Library/Wishlist/Order History/Settings tab row, and all five sections stacked below it. The Library section's rows are cloned from the existing "Cart: Game Activation (proposal)" frame, per this spec's Assumptions section. The Wishlist section reuses the existing `Home — Search, Deals & Wishlist (proposal)` frame's wishlist row.

## Assumptions and dependencies

`apps/api` has `POST orders/payment-intent`, `POST orders/confirm`, `GET orders/:orderId`, and `PATCH orders/:orderId/items/:itemId/activate` (`apps/api/src/features/orders`). None of these lists every order for a user. This spec needs a new `GET orders` route that returns every order for the requesting user, each with its items and games, newest first. The route reuses the existing `JwtAuthGuard`. It also reuses the existing `OrdersService` Prisma query shape (`findFirst` with `include: { items: { include: { game: true } } }`), widened to `findMany` with no `orderId` filter.

`useAuthStore.user` (`apps/web/features/auth/store/useAuthStore.ts`) only holds `{ name: string }`. It carries no email and no id. The backend does not need either from the client: `JwtAuthGuard` already resolves the user from the token on every existing `orders` route, and the new route follows the same pattern.

`/account`'s icon link in `MainNavigation.tsx` renders unconditionally today, for both auth states. Feature 1 below closes that gap. If a user is not authenticated, a visit to `/account` redirects to `/login`. This matches the guard `Summary.tsx` already applies to its "Go to payment" button, and the guard Feature 1 of `checkout-payment-activation-spec.md` applies to the Payment step.

The library section reuses the activation row UI and its `data-testid`s from `GameActivation.tsx`: `activation-row`, `activation-code`, `activation-status`, `activation-mark-button`. It does not invent new ones. The underlying data and the "mark as activated" action are the same. Only the scope differs. `GameActivation.tsx` shows the items of one just-placed order. This page shows items across every past order, grouped by order.

The wishlist section reuses the existing `WishlistSection` component unchanged, through the feature's own `index.ts` (`apps/web/features/wishlist`), not through its internal store path. The home page's own `WishlistSection` instance stays as it is, out of scope for this pass. A later pass can decide whether it moves or stays.

Both sections must reuse existing tokens and components: `ink`, `panel-alt`, `neon-magenta`, `neon-cyan`, `neon-green`, `shadow-retro`, `shadow-retro-sm`, and `Button` from `@repo/ui`. Do not add a new hardcoded color.

The five items under "Proposed additions" in the earlier draft of this spec are now in scope, as Features 4 through 8 below. `Game_pc` has no stock or inventory field. This store sells digital, unlimited-copy games. Feature 8 covers a price-drop alert only. It drops the restock half of the original proposal, because there is no stock data to alert on.

`UsersController` (`apps/api/src/features/users`) applies `JwtAuthGuard` and `RolesGuard` with `@RequireRole(Roles.Admin)` at the controller level. This fits its current admin-only routes. Feature 5 adds self-service routes: a user changing their own name or password. Those routes must not require the Admin role. Once Feature 5 adds its routes, apply guards per route instead of per controller for this module. Keep the admin routes exactly as strict as they are today.

## Feature 1: Account page shell and route guard

### Description

The `/account` route, its two-section layout (Library, Wishlist), and the auth guard on the route itself.

### Requirements

1. Add `apps/web/app/account/page.tsx`. Render two labeled sections in order: "My Games" (Feature 2), then "Wishlist" (Feature 3).
2. Check `useAuthStore.isAuthenticated` on mount. If it is false, redirect to `/login` with `next/navigation`'s `useRouter`, the same router `apps/web/app/(shop)/login/page.tsx` already uses. Do not render either section before the guard resolves.
3. Show the signed-in user's name from `useAuthStore.user.name` at the top of the page, for example "Hi, {name}". Match the greeting `MainNavigation.tsx` already shows.

### Acceptance criteria

- A logged-out user goes to `/account`. The app redirects them to `/login`.
- A logged-in user clicks the account icon in `MainNavigation.tsx`. The app shows the account page with both sections and the user's name.

### Out of scope

- Editing the account name, email, or password.
- A dedicated account layout shared with other future account subpages. One page is enough for this pass.

## Feature 2: Purchased games library

### Description

Every game the user has ever bought, across every order, with that game's activation code and activation status. A user can mark a still-unactivated code as activated from here. This uses the same action `GameActivation.tsx` already offers right after checkout.

### Requirements

1. On mount, fetch every order for the signed-in user through a new generated hook, for example `useGetOrders`. Add it to `packages/dionis-api` from the new `GET orders` backend route. Do not call `fetch` directly.
2. Group rows by order. Show each order's placement date and total above its rows.
3. Render one `activation-row` per `OrderItem`. Reuse `GameActivation.tsx`'s row layout: thumbnail, title, platform, the code in the clear (`activation-code`), a "Copy code" control, a redemption link, and the activation state (`activation-status`).
4. For a row where `activated` is false, show an enabled `activation-mark-button`. When a user clicks it, call the existing `PATCH orders/:orderId/items/:itemId/activate` route (`useActivateOrderItem`), then update that row to the Activated state on success.
5. For a row where `activated` is true, show the Activated state directly, with the `activation-mark-button` disabled. Do not require a second click for a code already activated during checkout.
6. If the user has no orders, show an empty state ("You have not bought any games yet") instead of an empty list. Add a link to browse games.
7. If the orders fetch fails, show an inline error message in the library section. Keep the rest of the page, the Wishlist section, intact.

### Acceptance criteria

- A user completed checkout for two games earlier and already marked one of them activated during the Game Activation step. They open `/account`. Both games appear: one already in the Activated state, one still showing an enabled "Mark as activated" button.
- A user clicks "Copy code" on a row. The exact displayed code goes on the clipboard.
- A user clicks "Mark as activated" on a still-unactivated row. That row switches to the Activated state and its button becomes disabled, with no page reload.
- A user with zero past orders sees the empty state, not an empty section.
- A user placed two separate orders. They see both orders' games, each grouped under its own order.

### Out of scope

- Re-checking a code against Steam or any outside platform. This spec keeps the trust model of `checkout-payment-activation-spec.md` Feature 2.
- Refunds, cancellations, or any order change other than marking an item activated.
- Pagination. All orders load in one request for this pass.

## Feature 3: Wishlist section

### Description

The existing wishlist, shown on the account page so a user does not need to scroll the home page to find it.

### Requirements

1. Render the existing `WishlistSection` component unchanged, imported from `apps/web/features/wishlist`.
2. If the wishlist is empty, use `WishlistSection`'s own existing empty state. Do not add a second one.

### Acceptance criteria

- A user has two games in their wishlist, added from any game card's `wishlist-toggle`. They open `/account`. Both appear in the Wishlist section, the same way they appear on the home page today.
- A user removes a game from the wishlist on the account page. It also disappears from the home page's wishlist section. Both read the same `useWishlistStore`.

### Out of scope

- A change to `WishlistSection`'s layout, sorting, or empty state, other than the "Add to cart" button Feature 6 adds.
- Removing or changing the home page's existing wishlist section.

## Feature 4: Order history

### Description

A read-only, order-centered view next to the game-centered Library. Library (Feature 2) groups games by order already, for the activation workflow. Order history answers a different question: what did the user pay, and when, without needing to scan every game row.

### Requirements

1. Add an "Order history" tab or section on the account page, alongside "My Games" and "Wishlist".
2. List every order from the same `useGetOrders` fetch Feature 2 already makes. Reuse that data. Do not add a second fetch for the same orders.
3. Show one row per order: its `createdAt` date, its `totalPrice`, and its item count.
4. Let a user expand an order row to see that order's games. Reuse the read-only parts of the Library's row layout: thumbnail, title, platform. Leave out the activation controls.

### Acceptance criteria

- A user with three past orders opens the "Order history" section. Three rows appear, each with a date, a total, and an item count.
- A user expands one order row. That order's games appear beneath it, with no "Mark as activated" button in this view.

### Out of scope

- Refund or cancellation actions from this view.
- Exporting or printing a receipt as a file.

## Feature 5: Account settings

### Description

A user changes their own display name or password from the account page. Both fields already exist on `User` (`name`, `password`).

### Requirements

1. Add a "Settings" section on the account page with two forms: change name, change password.
2. Add `PATCH users/me` to `apps/api/src/features/users`, guarded by `JwtAuthGuard` only (no `RolesGuard`, no Admin role). It updates the requesting user's `name`.
3. Add `PATCH users/me/password` to the same module, guarded the same way. It takes the current password and a new password. It checks the current password with `bcrypt.compareSync`, the same check `auth.service.ts` already uses for login. If the current password does not match, it throws a `CustomError` with a 400 status. On success, it hashes the new password with `bcrypt.hashSync`, matching signup's hashing, and saves it.
4. Regenerate `packages/dionis-api`'s client for both new routes. Do not hand-roll the requests.
5. Show a success message after each form submits. When a submission fails, for example on a wrong current password, show the server's error message instead.

### Acceptance criteria

- A user changes their display name and submits. The new name appears in the account page's greeting and in `MainNavigation.tsx`, without a manual page reload.
- A user enters their correct current password and a new password and submits. The next login succeeds with the new password.
- A user enters the wrong current password. The form shows an error and the password stays unchanged.

### Out of scope

- Changing the account email.
- Two-factor authentication or a password-strength meter beyond basic length validation.
- An admin editing another user's name or password from this page. `UsersController`'s existing admin routes already cover admin actions, unchanged.

## Feature 6: Wishlist quick actions

### Description

An "Add to cart" button on each wishlist row, so a user can buy a wishlisted game without a trip to its own page first.

### Requirements

1. Add an "Add to cart" button to `WishlistSection`'s row, next to the existing remove control.
2. On click, call `useCartStore`'s existing add-item action with that game's id, price, and discount, the same data `GameCard.tsx` passes today.
3. Give the button a `data-testid` of `wishlist-add-to-cart`.
4. When a game is added to the cart, keep it in the wishlist too. Wishlisting and owning a cart item are independent.

### Acceptance criteria

- A user clicks "Add to cart" on a wishlist row. The cart's item count increases by one, and the game stays in the wishlist.

### Out of scope

- A quantity selector on the wishlist row. Quantity stays a cart-only concept.

## Feature 7: Recently viewed games

### Description

A short strip of games the user looked at recently, shown on the account page.

### Requirements

1. Add `useRecentlyViewedStore`, a new `zustand` store with `persist` and `partialize`, following the same pattern as `useWishlistStore`. It holds up to 10 game ids, newest first, with no duplicates.
2. Record a view from `apps/web/app/(shop)/game/[id]/page.tsx`, on mount, for the game that page shows.
3. On the account page, show a "Recently viewed" strip using `GameCard`, fed by the ids in `useRecentlyViewedStore`. Fetch each game's current data the same way the Library section does.
4. If the store is empty, hide the strip. Do not show an empty-state message for this one.

### Acceptance criteria

- A user visits three different game pages, then opens `/account`. All three appear in "Recently viewed", most recent first.
- A user visits the same game twice. It appears once in the strip, at the most-recent position.

### Out of scope

- Tracking a view for a logged-out user. This store only needs to work for a signed-in user visiting their own account page.
- A server-side record of views. Client-side `persist` is enough for this pass.

## Feature 8: Wishlist price-drop alerts

### Description

A badge on a wishlist row, once that game's discount has grown since it was added. This is the price-drop half of the original "price-drop or restock" proposal. `Game_pc` has no stock or inventory field today, so this spec drops the restock half for now. A separate physical-copy spec can add a stock field. A restock alert can extend this feature once that field exists.

### Requirements

1. `WishlistItem` (`useWishlistStore`) already stores a `discount` snapshot from the moment a game was added. Keep that as the comparison baseline.
2. On the account page, for each wishlist item, fetch that game's current data through the existing `GET game/:gameId` route (`useGetGame`). Do not add a new backend endpoint for this.
3. If the current `discount` is greater than the stored snapshot, show a "Price dropped" badge on that row.
4. After showing the badge once, update the stored snapshot to the current discount. The same drop must not show the badge again on a later visit.
5. If the current discount is equal to or lower than the snapshot, show no badge.

### Acceptance criteria

- A user wishlists a game at a 10% discount. The store's discount later changes to 30%. The user opens `/account`. That row shows a "Price dropped" badge.
- The user reloads the account page a second time, with no further discount change. The badge no longer shows on that row.
- A wishlisted game whose discount has not changed shows no badge.

### Out of scope

- A restock alert. No stock or inventory field exists on `Game_pc` yet for this pass to read.
- Email or push delivery. In-app only, checked on page view.
- Alerting for a price drop that happens while the user is not on the account page. This spec checks on page load, not in the background.

## Cross-feature requirements

- Add a `data-testid` to the page shell: `account-page`. Add one to each section container too: `account-library`, `account-order-history`, `account-settings`, `wishlist` (already existing), `recently-viewed`. For Library rows, reuse `activation-row`, `activation-code`, `activation-status`, `activation-mark-button`, `activation-copy`, and `activation-redeem-link`. Per the Assumptions section above, do not add parallel names.
- Add `data-testid`s to Feature 1's four tab buttons: `account-tab-library`, `account-tab-wishlist`, `account-tab-order-history`, `account-tab-settings`. Add `account-library-empty` to Feature 2's empty state.
- Add `data-testid`s `order-history-row` and `order-history-toggle` to Feature 4's rows and expand control.
- Add `data-testid`s `settings-name-input`, `settings-name-save`, `settings-current-password`, `settings-new-password`, and `settings-password-save` to Feature 5's two forms.
- Add `data-testid` `wishlist-price-drop-badge` to Feature 8's badge.
- Every new API call must degrade gracefully. Catch every error. Keep the layout intact. Allow no unhandled exception. This matches the existing cross-feature rule in `checkout-payment-activation-spec.md`.

# Store Roadmap Spec

## Purpose

This spec lists the next features for Dionis Store and gives an implementation plan for each one. It collects the items that earlier specs put in "Out of scope", plus gaps found in the current code. It is a roadmap, not a single feature spec. Before you build a feature, write its own spec from its section here through the `feature-pipeline` skill. That spec adds the Figma design, the `data-testid` names, and the E2E tests.

The features are in three phases. Each phase depends on the phase before it. Inside a phase, the order is the recommended build order.

## Current state

This section records the facts that the plans below depend on.

- The web app calls `POST /api/orders/confirm` after `stripe.confirmPayment` succeeds. Since Feature 1.1, the Stripe webhook also creates the order, so a closed tab no longer loses a paid order.
- The PaymentIntent is created when the Payment step mounts, before the shipping form is filled.
- `confirmOrder` is idempotent (safe to run twice) on `stripePaymentIntentId`, because that column is `@unique`.
- `Roles` has `User = 101`, `Editor = 233`, and `Admin = 500`. `RolesGuard` and `@Roles` exist. The only write route for the catalog is `POST /api/games`.
- `GameEdition.stock` exists and `confirmOrder` reduces it inside a transaction.
- The recently-viewed list lives only in `localStorage`, through zustand `persist`. Since Feature 1.2, a signed-in user's wishlist is stored on the account.
- `User.refreshToken` is one column, so a login ends the user's session in any other browser on its next page load. A user can be signed in on one browser at a time.
- `GET /api/games/:page` already pages the catalog. `GET /api/orders` returns every order in one response.
- CI runs only `pnpm install`, `pnpm build`, and `pnpm test --filter web`.

## Phase 0: Engineering foundations

Do these items first or alongside Phase 1. They are small and they protect every later feature.

### 0.1 CI gates

Add these steps to `.github/workflows/pr-workflow.yml`: `pnpm lint`, a typecheck (`pnpm exec tsc --noEmit` in each app, or a `typecheck` Turbo task), and `pnpm test --filter api`. Add the Playwright suite as a separate job with a Postgres service container, `pnpm migrate`, and `pnpm seed:api`. Align the pnpm version in the workflow (`8.5.0`) with the README (`8.9.0`).

Done when a pull request with a lint error, a type error, or a failing API test shows a red check.

### 0.2 CORS origin from the environment

Replace `ALLOWED_ORIGINS` in `apps/api/src/main.ts` with the existing `CLIENT_URL` environment variable. `CLIENT_URL` was already in both `.env.example` files, but nothing read it. The value is a comma-separated list. The API refuses to start if the value is empty. Add the default `http://localhost:3000` to `apps/api/.env.example` and the root `.env.example` in the same commit.

### 0.3 Config cleanup

Move `useAuthStore` to the `create` + `persist` + `partialize` pattern that `useCartStore` uses. Point `apps/web/tsconfig.json` and `apps/api/tsconfig.json` at `packages/typescript-config/base.json`. These items have no user-facing change. The existing unit and E2E tests must pass without edits.

## Phase 1: Close the gaps in existing flows

### 1.1 Stripe webhook for order creation

#### Description

The API creates the order when Stripe reports a successful payment, even if the browser never calls `confirm`. The confirm call stays, so the Game Activation step still gets the order at once.

#### Acceptance criteria

- If a payment succeeds and the browser closes before `confirm`, the order exists in the account's Order History after the webhook arrives.
- If both the webhook and `confirm` run, exactly one order exists.
- If the webhook signature is not valid, the API returns `400` and writes nothing.
- A physical order created by the webhook has its shipping address.

#### Implementation plan

1. Store the shipping address on the PaymentIntent through `POST /api/orders/payment-intent/:id/shipping`, called just before `stripe.confirmPayment`. The intent already exists when the form is filled, so the address cannot go with `payment-intent`. Use one `metadata` key per field, not the Stripe `shipping` field: `shipping` requires an ISO country code, and the form takes free text. `confirmOrder` reads the address from the PaymentIntent and no longer accepts it in the body.
2. Add `constructWebhookEvent(rawBody, signature)` to `StripeService`. It calls `stripe.webhooks.constructEvent` with a new `STRIPE_WEBHOOK_SECRET` environment variable. Add the variable to both `.env.example` files.
3. Create the app with `NestFactory.create(AppModule, { rawBody: true })` so that the signature check gets the raw body.
4. Add `POST /api/orders/webhook` with no JWT guard. It handles `payment_intent.succeeded` only. It reads the user email from `metadata.userEmail` and calls the same order-creation code as `confirmOrder`.
5. Extract the shared code from `confirmOrder` into `createOrderFromPaymentIntent(paymentIntent)`. Both routes call it.
6. Handle the race between the webhook and `confirm`. If a Prisma `P2002` error occurs on `stripePaymentIntentId`, return the existing order.
7. Unit tests in `orders.service.spec.ts`: the webhook creates the order, confirm after the webhook returns the same order, and a bad signature throws. For local runs, document `stripe listen --forward-to` in the README.

#### Out of scope

- Refund, dispute, and failed-payment events. Feature 3.3 adds refunds.

### 1.2 Wishlist saved to the account

#### Description

A signed-in user's wishlist is stored on the server and is the same on every device. A guest keeps the current `localStorage` wishlist.

#### Acceptance criteria

- A game added on one browser shows in the wishlist on a second browser after sign-in.
- When a guest signs in, the API merges the guest wishlist into the account wishlist and removes duplicates.
- Logout clears the wishlist from the browser. The next login loads it from the account.
- The price-drop alerts from `account-area-spec.md` Feature 8 still work.

#### Implementation plan

1. Add the model `WishlistItem { userId, gameId, discountSnapshot, createdAt }` with `@@unique([userId, gameId])` and cascade deletes. `discountSnapshot` is what Feature 8's badge compares against. Run a migration.
2. Add a `wishlist` feature in `apps/api/src/features`. All routes use the JWT guard and return the whole list:
   - `GET /api/wishlist` lists the items, newest first, joined with current game data.
   - `PUT /api/wishlist/:gameId` adds a game. The server takes the snapshot from the game's current discount.
   - `DELETE /api/wishlist/:gameId` removes a game.
   - `PATCH /api/wishlist/:gameId` moves the snapshot to the current discount, after the badge showed.
   - `POST /api/wishlist/merge` adds guest items with their snapshots and skips games already on the account.
3. Regenerate `packages/dionis-api` with Orval.
4. In `apps/web/modules/wishlist`, keep the zustand store as the one thing the UI reads. The facade applies each change to the store, then calls the server when the user is signed in, and undoes the change if the call fails. A `WishlistSync` component loads the account list on a signed-in page load, merges the guest list on login, and clears the list on logout.

### 1.3 Filters in the URL and more filters

#### Description

The catalog search, filters, and sort live in the URL query string. A user can share a filtered view, and the back button restores the earlier filters. Two new filters are added: genre and price range.

#### Acceptance criteria

- If a user opens `/?genre=Shooter&maxPrice=20`, the page loads with those filters applied.
- A filter change updates the URL without a full page reload, and Back restores the earlier filters.
- The price filter compares the discounted price that a card shows, not the list price.
- An unknown value in the URL is ignored, and the page still shows games.
- The "Clear filters" button also clears the URL.

#### Implementation plan

1. Add `genre` (exact match), `minPrice`, and `maxPrice` (whole euros) to `GamesQueryDto` and `GamesService.fetchGames`. Prisma cannot filter on a computed value, so one raw query finds the ids whose discounted price is in range first.
2. Add `GET /api/games/genres`, which returns each genre with its game count. Declare it before `games/:page`.
3. In the games module, read and write the filter state from the URL through `useGamesFilters` (`core/facade.ts`). A dropdown or page change pushes a history entry. Search replaces the current one. Do not add a second copy of the state in the store.
4. The price dropdown offers fixed ranges. The URL holds the numbers, so a hand-written range also works.

The genre values are not clean: "Card" and "Card Game", "MMO" and "MMORPG" are separate values. The dropdown lists them as they are, and the admin panel (2.1) can merge them later.

#### Out of scope

- Saved searches.

### 1.4 Order history pagination

`GET /api/orders` accepts `page` and `pageSize` and returns `{ items, total }`. The Order History section shows a "Load more" button. The catalog already has paging, so this item covers orders only.

## Phase 2: Store operations

### 2.1 Admin panel

#### Description

A user with the `Admin` or `Editor` role manages the catalog from the storefront. Today, only the seed script and `POST /api/games` change the catalog.

#### Acceptance criteria

- An admin can create, edit, and delete a game, and can set its price and discount.
- An admin can create and edit editions, including stock.
- An admin can see all orders and filter them by status.
- A user with the `User` role gets `403` on every admin route and cannot open `/admin`.

#### Implementation plan

1. API: add `PATCH /api/games/:id`, `DELETE /api/games/:id`, `POST /api/games/:id/editions`, `PATCH /api/editions/:id`, and `GET /api/admin/orders`. Use `@Roles(Roles.Admin, Roles.Editor)` for the catalog routes and `@Roles(Roles.Admin)` for orders.
2. A game with orders cannot be deleted, because `OrderItem` references it. Add an `archived Boolean @default(false)` field to `Game_pc` and exclude archived games from the storefront queries.
3. Web: add an `app/admin` route group and a new `modules/admin` module. Guard the route group in its layout with the role from the auth store. Use tables and forms from `@repo/ui`.
4. The web role check is a convenience only. The API guard is the real check.

#### Out of scope

- Image upload. Admins enter a thumbnail URL, as the seed does.
- Audit logs.

### 2.2 Email receipts and activation codes

#### Description

After an order is created, the user gets an email with the receipt. A digital item's activation code is in the email.

#### Implementation plan

1. Choose a provider (Resend, Postmark, or SMTP with `nodemailer`). Add its key and the sender address as environment variables in `.env.example`.
2. Add a `MailService` in `apps/api/src/common`. It sends a plain HTML template.
3. Send the email from `createOrderFromPaymentIntent` (Feature 1.1), after the transaction commits. Record `receiptSentAt` on `Order` so that a webhook retry does not send a second email.
4. A failed send must not fail the order. Log the error and leave `receiptSentAt` empty so that a later job can retry.

#### Dependencies

Feature 1.1.

### 2.3 Reviews and ratings from owners

#### Description

A user who owns a game can give it a rating from 1 to 5 and a short text review. The game detail page shows the average rating and the reviews.

#### Implementation plan

1. Add the model `Review { userId, gameId, rating, body, createdAt }` with `@@unique([userId, gameId])`.
2. Add `GET /api/games/:id/reviews` (public) and `PUT /api/games/:id/review` (JWT guard). The `PUT` route reuses the ownership check from commit `b1cb57f`, and returns `403` if the user does not own the game.
3. Return `averageRating` and `reviewCount` from `GET /api/game/:gameId`. The existing `rating` string comes from the seed source. Keep it until the store has its own reviews, then remove it.
4. Add a reviews section and a review form to the game detail page.

#### Out of scope

- Moderation, replies, and helpful votes.

### 2.4 Restock alerts

#### Description

On an edition that is out of stock, a user can click "Notify me". When stock goes above zero, the user sees an in-app alert. After Feature 2.2 exists, the alert is also sent by email.

#### Implementation plan

1. Add the model `StockAlert { userId, editionId, createdAt, notifiedAt }`.
2. When an admin raises stock from 0 through Feature 2.1, mark the alerts for that edition as ready.
3. Show ready alerts on the account page, next to the price-drop alerts.

#### Dependencies

Feature 2.1. Feature 2.2 for email.

### 2.5 Shipping status for physical orders

#### Description

A physical order has a status: `PENDING`, `SHIPPED`, or `DELIVERED`. An admin sets the status and an optional tracking number. The user sees the status in Order History.

#### Implementation plan

1. Add an `OrderStatus` enum, a `status` field with the default `PENDING`, and a nullable `trackingNumber` to `Order`. A digital-only order is set to `DELIVERED` when it is created.
2. Add `PATCH /api/admin/orders/:id` with `@Roles(Roles.Admin)`.
3. Show the status and the tracking number in Order History.

#### Dependencies

Feature 2.1.

## Phase 3: Growth

Each item here needs its own spec before work starts. The plans are short on purpose.

### 3.1 Promo codes

Add the model `PromoCode { code, percentOff, expiresAt, maxUses, uses }`. The Payment step has a code field. `createPaymentIntent` applies the code on the server, and `priceOrderItems` stays the only place that calculates prices. An admin manages codes through Feature 2.1.

### 3.2 Gifting

At checkout, a user can mark a digital item as a gift and enter an email address. The activation code goes to that address through Feature 2.2 and does not show in the buyer's Library. The recipient's ownership needs a decision. The simplest option is that the recipient owns nothing in the store until they register with that email address.

### 3.3 Refunds and cancellations

An admin refunds an order through Feature 2.1. The API calls `stripe.refunds.create`, handles the `charge.refunded` webhook event from Feature 1.1, restores edition stock, and sets a `REFUNDED` status. An activated digital item cannot be refunded.

### 3.4 Recommendations

Add a "Because you viewed" strip on the account page and the game detail page. The first version uses the genres of recently viewed and owned games and needs no new table. Do not add a machine-learning service until this simple version shows a result.

### 3.5 Deferred

Leave these items out until there is a clear need: deal countdowns, bundles, multiple currencies, saved addresses, and address validation.

## Recommended order

1. Phase 0 (all items).
2. 1.1 Stripe webhook.
3. 2.1 Admin panel.
4. 2.2 Email.
5. 1.2 to 1.4, 2.3 to 2.5, in any order.
6. Phase 3, one spec at a time.

## Cross-feature requirements

- Every new environment variable goes into `.env.example` in the same commit.
- Every new web call goes through the generated `packages/dionis-api` client. Regenerate it after each API change.
- Every new web module follows `.claude/rules/frontennd-architecture.md`.
- Every schema change gets a Prisma migration and an update to the seed script, if the seed needs the new data.
- Before you mark a feature done, run `pnpm lint`, `pnpm build`, `pnpm test --filter web`, `pnpm test --filter api`, and the affected Playwright specs.

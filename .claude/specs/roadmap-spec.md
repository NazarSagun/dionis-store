# Store Roadmap Spec

## Purpose

This spec lists the features that Dionis Store does not have yet, with an implementation plan for each one. It is a roadmap, not a single feature spec. Before you build a feature, write its own spec from its section here through the `feature-pipeline` skill. That spec adds the Figma design, the `data-testid` names, and the E2E tests.

Phase 0, Phase 1, and Features 2.1 and 2.2 are built, so this spec no longer lists them. The remaining features keep their old numbers, because other specs refer to them by number.

## Current state

This section records the facts that the plans below depend on. It was checked against `main` at `5ca685b` on 2026-10-07.

### Checkout and orders

- The PaymentIntent is created when the Payment step mounts, before the shipping form is filled. `POST /api/orders/payment-intent/:id/shipping` stores the address as six metadata keys on the PaymentIntent. It writes no other key.
- The web app calls `POST /api/orders/confirm` after `stripe.confirmPayment` succeeds. The Stripe webhook (`POST /api/orders/webhook`) also creates the order, so a closed tab does not lose a paid order. Production does not have the webhook endpoint in the Stripe dashboard yet.
- Both routes call `createOrderFromPaymentIntent`. It is idempotent (safe to run twice) on `stripePaymentIntentId`, because that column is `@unique`. `/confirm` returns an existing order only to the user who placed it.
- `priceOrderItems` is the only place that calculates prices. It rejects an edition that does not belong to the cart line's game.
- `GameEdition.stock` goes down inside the order transaction, through a conditional `updateMany`.
- `Order` has no status field. Every order is final, and nothing tracks shipping or refunds.
- After an order commits, `MailService` sends one receipt email. `Order.receiptSentAt` records the send, and a failed send leaves it empty.
- `GET /api/orders` returns one page of orders. `GET /api/orders/owned` answers the ownership check. `findOwnedItem` in `apps/api/src/features/orders/order-ownership.util.ts` checks whether a user owns a `(gameId, editionId)` pair.

### Catalog and admin

- `Roles` has `User = 101`, `Editor = 233`, and `Admin = 500`. `RolesGuard` reads the role from `@RequireRole(...)`. `Editor` is unused.
- The admin panel at `/admin` creates, edits, and deletes games and their physical editions, and lists every order with search by email. The API routes are `POST /api/games`, `PATCH` and `DELETE /api/games/:id`, `POST /api/games/:id/editions`, `PATCH` and `DELETE /api/editions/:id`, and `GET /api/admin/orders`.
- `Game_pc.rating` is a string from the seed source. The store has no reviews of its own.
- The catalog search, filters, and sort live in the URL. `GET /api/games/genres` lists the genres.

### Accounts

- A signed-in user's wishlist is stored on the account (`WishlistItem`). The recently-viewed list lives only in `localStorage`, through zustand `persist`.
- `User.refreshToken` is one column, so a login ends the user's session in any other browser on its next page load. A password change replaces the token.
- Passwords must be 8 to 72 characters. Login, register, and password change are rate-limited per IP address.

### Engineering

- CI runs lint, typecheck, build, and the web and API unit tests on every pull request. A second job runs the Playwright suite against Postgres, the built API, and the built web app.
- Production is one EC2 instance in `eu-north-1` with Caddy, at `https://dioniss.com`. A deploy is a manual `git pull` and `docker compose` build on the server.

## Phase 2: Store operations

### 2.3 Reviews and ratings from owners

#### Description

A user who owns a game can give it a rating from 1 to 5 and a short text review. The game detail page shows the average rating and the reviews.

#### Implementation plan

1. Add the model `Review { userId, gameId, rating, body, createdAt }` with `@@unique([userId, gameId])`.
2. Add `GET /api/games/:id/reviews` (public) and `PUT /api/games/:id/review` (JWT guard). The `PUT` route checks ownership with `findOwnedItem`, and returns `403` if the user does not own the game.
3. Return `averageRating` and `reviewCount` from `GET /api/game/:gameId`. The existing `rating` string comes from the seed source. Keep it until the store has its own reviews, then remove it.
4. Add a reviews section and a review form to the game detail page.

#### Out of scope

- Moderation, replies, and helpful votes.

### 2.4 Restock alerts

#### Description

On an edition that is out of stock, a user can click "Notify me". When stock goes above zero, the user sees an in-app alert and gets an email through `MailService`.

#### Implementation plan

1. Add the model `StockAlert { userId, editionId, createdAt, notifiedAt }`.
2. When an admin raises stock from 0 in the admin panel (`PATCH /api/editions/:id`), mark the alerts for that edition as ready.
3. Send one email per ready alert through `MailService`, and set `notifiedAt`.
4. Show ready alerts on the account page, next to the price-drop alerts.

#### Dependencies

Feature 2.1 and Feature 2.2. Both are built.

### 2.5 Shipping status for physical orders

#### Description

A physical order has a status: `PENDING`, `SHIPPED`, or `DELIVERED`. An admin sets the status and an optional tracking number. The user sees the status in Order History.

#### Implementation plan

1. Add an `OrderStatus` enum, a `status` field with the default `PENDING`, and a nullable `trackingNumber` to `Order`. A digital-only order is set to `DELIVERED` when it is created.
2. Add `PATCH /api/admin/orders/:id` with `@RequireRole(Roles.Admin)`.
3. Show the status and the tracking number in Order History.

#### Dependencies

Feature 2.1, which is built.

## Phase 3: Growth

Each item here needs its own spec before work starts. The plans are short on purpose.

### 3.1 Promo codes

Add the model `PromoCode { code, percentOff, expiresAt, maxUses, uses }`. The Payment step has a code field. `createPaymentIntent` applies the code on the server, and `priceOrderItems` stays the only place that calculates prices. An admin manages codes through Feature 2.1.

### 3.2 Gifting

At checkout, a user can mark a digital item as a gift and enter an email address. The activation code goes to that address through Feature 2.2 and does not show in the buyer's Library. The recipient's ownership needs a decision. The simplest option is that the recipient owns nothing in the store until they register with that email address.

### 3.3 Refunds and cancellations

An admin refunds an order through Feature 2.1. The API calls `stripe.refunds.create`, handles the `charge.refunded` event in the existing Stripe webhook, restores edition stock, and sets a `REFUNDED` status. An activated digital item cannot be refunded.

### 3.4 Recommendations

Add a "Because you viewed" strip on the account page and the game detail page. The first version uses the genres of recently viewed and owned games and needs no new table. Do not add a machine-learning service until this simple version shows a result.

### 3.5 Deferred

Leave these items out until there is a clear need: deal countdowns, bundles, multiple currencies, saved addresses, and address validation.

## Recommended order

1. 2.5 Shipping status. Feature 3.3 needs its status field.
2. 2.3 Reviews and 2.4 Restock alerts, in any order.
3. Phase 3, one spec at a time.

## Cross-feature requirements

- Every new environment variable goes into `.env.example` in the same commit.
- Every new web call goes through the generated `packages/dionis-api` client. Regenerate it after each API change.
- Every new web module follows `.claude/rules/frontennd-architecture.md`.
- Every schema change gets a Prisma migration and an update to the seed script, if the seed needs the new data.
- Before you mark a feature done, run `pnpm lint`, `pnpm build`, `pnpm test --filter web`, `pnpm test --filter api`, and the affected Playwright specs.

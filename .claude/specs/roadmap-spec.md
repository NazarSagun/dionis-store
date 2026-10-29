# Store Roadmap Spec

## Purpose

This spec lists the next features for Dionis Store, with a short plan for each one. It is a roadmap, not a single feature spec. Before you build a feature, write its own spec from its section here through the `feature-pipeline` skill. That spec adds the Figma design, the `data-testid` names, and the E2E tests.

This roadmap replaces an older one. The older roadmap used the numbers 1.1 to 3.5, and some specs and E2E tests still refer to those numbers. Git history holds that file. All of its features are built, except 3.2 Gifting and 3.3 Refunds, which are dropped. The features here start at 4.1, so that no number has two meanings.

## Current state

This section records the facts that the plans below depend on. It was checked against `main` at `9d959b2` on 2026-10-29.

- `User` has one `refreshToken` and one `previousRefreshToken`. A login in a second browser ends the session in the first browser.
- A user can change the password while signed in (`PATCH /api/users/me/password`). No route resets a forgotten password.
- `MailService` sends the order receipt. The bell (`Notification`) shows review replies, shipping changes, and restock alerts.
- `Roles` has `User = 101`, `Editor = 233`, and `Admin = 500`. Nothing uses `Editor`.
- The admin panel at `/admin` manages games, editions, orders, shipments, and promo codes. It shows no sales totals.
- The seed reads 332 games from `apps/api/src/db-seed/games/games.json`. Each game has one `thumbnail` hotlinked from `www.freetogame.com` and one `short_description`. The store calls no game API at run time.
- Owners can rate and review a game, and any signed-in user can reply. No route deletes a review or a reply.
- The Shipping step asks for the full address on every order. Nothing stores it on the account.
- Production is one EC2 instance with Caddy, at `https://dioniss.com`. The `Content-Security-Policy` header is still in report-only mode.

## Phase 4: Game content

### 4.1 Rich game details

The game detail page shows an image gallery, a YouTube trailer, and a long description with several sections. The catalog shrinks to 50 games with full content, across several genres and platforms, because the current 332 games have one thumbnail and one sentence each.

1. Keep the seed in a local file, as today. Replace `games/games.json` with a curated file of 50 games.
2. Add the model `GameImage { gameId, url, alt, position }`. The first image is the cover, and `thumbnail` stays for the card.
3. Add `trailerYoutubeId String?` to `Game_pc`. The web app builds the embed URL from the ID, with `youtube-nocookie.com`, so the API never stores a full URL.
4. Add `GameSection { gameId, kind, title, body, position }` for the long description. `kind` is one of `about`, `story`, and `features`. `body` is plain text with paragraphs and `- ` list items, so the web app renders it without raw HTML. `.claude/specs/rich-game-details-spec.md` holds the full plan.
5. `GET /api/game/:gameId` returns the images, the trailer ID, and the sections, ordered by `position`.
6. The admin game form can edit the trailer ID, the image list, and the sections.
7. Update the Caddy `Content-Security-Policy` with `frame-src https://www.youtube-nocookie.com` and the image host in `img-src`. Update `remotePatterns` in `apps/web/next.config.js` the same way.

The content comes from IGDB (the Twitch game database API), through a one-time import script. The script downloads the images into an S3 bucket that CloudFront serves, so the store does not hotlink IGDB at run time. IGDB is free only for non-commercial use.

Dependency: the reviews, orders, and E2E helpers that use game IDs from the old seed need new IDs.

## Phase 5: Accounts

### 5.1 Password reset

A user who forgets the password asks for a reset link on the login page. The link arrives by email and works once.

1. Add the model `PasswordResetToken { userId, tokenHash, expiresAt, usedAt }`. Store only a hash of the token.
2. `POST /api/auth/forgot-password` takes an email address. It always returns `204`, so the response does not tell whether the account exists. It sends the link through `MailService`.
3. `POST /api/auth/reset-password` takes the token and the new password. It sets `usedAt`, replaces the password, and clears the refresh tokens, so every old session ends.
4. Rate-limit both routes per IP address, as login is.
5. Add the "Forgot password" link on `/login` and a new page that sets the password.

### 5.2 Sessions on more than one device

A login in a second browser no longer ends the first session. The settings section lists the active sessions and can end each one.

1. Add the model `Session { id, userId, refreshTokenHash, previousRefreshTokenHash, userAgent, createdAt, lastUsedAt }`. Move the token columns from `User` to this model.
2. Login creates a session. Refresh rotates the token of that session only. Logout deletes that session only.
3. A password change and a password reset (5.1) delete every session of the user.
4. Add `GET /api/users/me/sessions` and `DELETE /api/users/me/sessions/:id`.

Dependency: 5.1 is easier to build first, because 5.2 changes where it clears the tokens.

### 5.3 Saved addresses

A signed-in user can save shipping addresses and pick one on the Shipping step.

1. Add the model `Address { userId, name, line1, line2, city, postalCode, country, isDefault }`.
2. Add create, list, update, and delete routes under `/api/users/me/addresses`.
3. The Shipping step fills the form from the default address. A check box saves a new address.
4. The order keeps its own copy of the address in the PaymentIntent metadata, as today. A later edit of a saved address does not change an old order.

## Phase 6: Admin

### 6.1 Review moderation

An admin can remove a review or a reply that breaks the rules.

1. Add `DELETE /api/admin/reviews/:id` and `DELETE /api/admin/replies/:id`, with `@RequireRole(Roles.Admin)`.
2. A deleted review no longer counts in `averageRating` and `reviewCount`.
3. Add a reviews table to the admin panel, with a search by game title.
4. Send the author a bell notification when an admin removes their text.

### 6.2 Sales overview

The admin panel opens on a page with sales totals.

1. Add `GET /api/admin/stats?from=&to=`. It returns revenue, the order count, the top ten games by revenue, and the promo code discount total for the period.
2. Calculate the numbers in SQL from `Order` and `OrderItem`. Add no new table.
3. Show the numbers as stat tiles and one table. Add a chart only if the tiles are not enough.

### 6.3 Editor role

A user with the `Editor` role manages the catalog but cannot see orders, customers, or promo codes.

1. Allow `Roles.Editor` on the game and edition routes.
2. Keep `Roles.Admin` only on orders, shipments, promo codes, stats, and moderation.
3. The admin shell hides the sections that the role cannot open.
4. An admin sets the role of a user. Add `PATCH /api/admin/users/:id/role`.

## Phase 7: Growth

Each item here needs its own spec before work starts. The plans are short on purpose.

### 7.1 Bundles

An admin groups two or more games into a bundle with one price. The cart treats the bundle as one line, and the order creates one `OrderItem` per game. `priceOrderItems` stays the only place that calculates prices.

### 7.2 Deal countdowns

A discount gets an optional end date. The game card and the detail page show the time left. When the date passes, the price goes back without an admin action, because the API reads the end date at price time.

### 7.3 Deferred

Leave these items out until there is a clear need: multiple currencies, address validation, a machine-learning recommendation service, gifting, and refunds.

## Recommended order

1. 4.1 Rich game details.
2. 5.1 Password reset, because a user who forgets the password has no way back today.
3. 6.1 Review moderation, because buyer text shows publicly with no way to remove it.
4. 5.2 Sessions, then 5.3 Saved addresses.
5. 6.2 Sales overview, then 6.3 Editor role.
6. Phase 7, one spec at a time.

## Cross-feature requirements

- Every new environment variable goes into `.env.example` in the same commit.
- Every new web call goes through the generated `packages/dionis-api` client. Regenerate it after each API change.
- Every new web module follows `.claude/rules/frontennd-architecture.md`.
- Every schema change gets a Prisma migration and an update to the seed script, if the seed needs the new data.
- Before you mark a feature done, run `pnpm lint`, `pnpm build`, `pnpm test --filter web`, `pnpm test --filter api`, and the affected Playwright specs.

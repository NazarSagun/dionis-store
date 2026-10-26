# Restock Alerts Spec

## Purpose

Feature 2.4 of `.claude/specs/roadmap-spec.md` lets a user ask to hear when an out-of-stock edition is back. Today the game detail page (`apps/web/modules/games/presentation/game-details/GameDetails.tsx`) shows an out-of-stock edition as a disabled button with the text `Out of stock`. The user has no way to act on it. When an admin raises the stock in the admin panel, nobody learns about it. `GamesService.updateEdition` in `apps/api/src/features/games/games.service.ts` writes the new stock and clears the cache, and does nothing else.

This spec adds a "Notify me" control on an out-of-stock edition. When an admin raises the stock of that edition above zero, each subscribed user gets a notification in the bell and one email through `MailService`.

## Design reference

The design lives in the Figma file "Dionis Store — Retro Redesign". Every page has its own section, and each state has a Desktop, Tablet, and Mobile frame.

- Section "Game Details", the "Notify me" row, holds the code-based frames "Game Details — Notify me (code, 1440)", the tablet frame, and "Game Details — Notify me (code, mobile 390)". "Notify me — States" shows the tile states: default, notifying, saving, and error.
- Section "Game Details", the notification rows, holds "Game Details — Notification panel (restock, 3 unread)" and the restock panel frames for tablet and mobile.
- Section "Emails" holds "Email — Restock alert (600)" and its 375px mobile frame. The email has no tablet layout.

Design decisions that differ from the current code:

- A sold-out edition is a tile in the same slot and size as the buy buttons, not a disabled red button. The tile shows the edition name, the muted `Out of stock` label, and the "Notify me" button inside it. The tile has no extra row, so nothing stretches the buy buttons.
- On mobile the edition buttons need a minimum width of about 140px, so they wrap. The current code puts all of them in one row at 390px.

## Assumptions and dependencies

- Feature 2.1 (admin panel) and Feature 2.2 (receipt email and `MailService`) are built. Feature 2.5 is built too. It added the `Notification` model and the bell, and this spec extends both.
- The roadmap plan shows ready alerts on the account page, next to the price-drop alerts. The bell now exists, and it is the place where the user already sees review replies and shipment changes. So the in-app alert is a bell notification and not an account page block. See Open decision 1.
- Stock goes above zero through one path today, `PATCH /api/editions/:id`. Order creation only lowers stock. Feature 3.3 (refunds) will restore stock later. It must call the same service method, so it triggers alerts too. This spec does not build refunds.
- A user who already owns an edition cannot buy it again. The edition shows `Already in Library`, so it has no "Notify me" control.
- A new web call goes through the generated `packages/dionis-api` client. Add the routes and the new notification type to `packages/dionis-api/dionis.yaml` and regenerate.
- The web changes stay inside the existing `games` and `notifications` modules and follow `.claude/rules/frontennd-architecture.md`.
- No new environment variable is needed. The email uses the existing `SMTP_*`, `MAIL_FROM`, and `CLIENT_URL` variables.

## Open decisions

Each item has a default that this spec already uses. Change the default before phase 2 if you disagree.

1. Where does the in-app alert show? Default: in the bell, as a new notification type `restock`. The account page gets no new block. The bell already has a read state, a poll, and a link per item, so this costs far less than a new account block. The roadmap plan names the account page, and the bell replaces it.
2. Does a user keep the alert after it fires? Default: no. One alert fires once. After the user is notified, the edition shows "Notify me" again if it is out of stock again.
3. Can a guest subscribe? Default: no. A guest who clicks "Notify me" goes to the login page. The alert needs an account, because the email and the bell belong to an account.
4. Does the alert fire on every increase? Default: no. It fires only when the stock goes from `0` to a value above `0`. Going from 3 to 10 does not fire.
5. Does the user see the list of the editions they watch? Default: no. The "Notify me" control on the edition shows the state, and that is the only place. A watch list is a follow-up if users ask for one.

## Feature 1: Restock alert API

### Description

The API stores one alert per user and edition. It fires the alerts of an edition when an admin raises its stock from zero.

### Requirements

1. Add the Prisma model `StockAlert { id, userId, editionId, createdAt, notifiedAt }` with `@@unique([userId, editionId])`. Both relations use `onDelete: Cascade`. Add the back-relations on `User` and `GameEdition`.
2. Add `editionId Int?` to `Notification`, with a relation to `GameEdition` and `onDelete: Cascade`. A restock notification has `editionId`. Add one Prisma migration for both changes.
3. Add `PUT /api/editions/:id/stock-alert` and `DELETE /api/editions/:id/stock-alert`. Both need `JwtAuthGuard`. `PUT` creates the alert for the signed-in user, and `DELETE` removes it. Both return `204` and are safe to run twice.
4. `PUT` returns `409` when the edition has stock above zero, because there is nothing to wait for. It returns `409` when the user already owns the edition (use `findOwnedItem` in `order-ownership.util.ts`). It returns `404` for an unknown edition and `400` for a non-numeric id.
5. `GET /api/game/:gameId` stays public and shared. It has no auth guard, the service caches it under `gameDetailKey` for all users, and the controller sends `Cache-Control: public, no-cache`. So it cannot carry a per-user field, and this spec adds none. Its edition `stock` stays correct because every stock change already drops the cached copy: `updateEdition` calls `clearCache()`, and order creation deletes `gameDetailKey`. Add `GET /api/games/:gameId/stock-alerts` with `JwtAuthGuard`. It returns `{ editionIds: number[] }`, the editions of that game on which the signed-in user has an alert. The web app uses it to show the button state. It is never cached and is not sent with a `public` header.
6. In `GamesService.updateEdition`, when the stored stock is `0` and the new stock is above `0`, call a new `StockAlertsService.fire(editionId)` after the update. It does nothing in any other case.
7. `fire` runs in one transaction. It reads the alerts of the edition with `notifiedAt` empty, sets `notifiedAt` on them with a conditional `updateMany`, and creates one `Notification` row per user. Only the rows that the conditional update claimed get a notification, so two admin saves at the same moment never notify a user twice.
8. After the transaction, `fire` sends one email per claimed alert through `MailService.sendRestockAlert`. A failed or skipped send logs the error and never fails the admin request. The in-app notification stays, because the user still needs to know.
9. `MailService.sendRestockAlert(to, { gameTitle, editionName, gameUrl })` skips a reserved test domain on a real SMTP server and returns `false` when mail is off, the same way `sendOrderReceipt` does. The `gameUrl` is `<first CLIENT_URL origin>/game/<gameId>`. Put the template in its own file next to `receipt-template.ts`.
10. `GET /api/notifications` returns the new type. A restock item has `type` `restock`, `gameId`, `gameTitle`, `editionName`, and `createdAt`. It returns no email address.
11. Deleting an edition removes its alerts and notifications through the cascade.
12. A unit test next to each changed service and controller covers the cases in the acceptance criteria below.

### Acceptance criteria

- A signed-in user sends `PUT /api/editions/:id/stock-alert` for an edition with stock `0`. The response is `204`, and `GET /api/games/:gameId/stock-alerts` lists that edition id.
- A second user, or a guest, loads `GET /api/game/:gameId` right after. The response has no per-user data and is the same for both.
- An admin raises the stock of an edition. The next `GET /api/game/:gameId` shows the new stock, not a cached value.
- `GET /api/games/:gameId/stock-alerts` without a token returns `401`.
- The same user sends `PUT` again. The response is `204`, and there is still one alert.
- The user sends `DELETE`. The edition id is gone from `GET /api/games/:gameId/stock-alerts`.
- `PUT` for an edition with stock above zero returns `409`. `PUT` for an edition the user owns returns `409`. An unknown edition returns `404`. A request without a token returns `401`.
- An admin sets the stock of an edition from `0` to `5`. Each user with an open alert gets one bell notification of type `restock` and one email. `notifiedAt` is set on each alert.
- An admin sets the stock from `5` to `10`, or from `0` to `0`, or from `5` to `0`. No notification and no email goes out.
- An admin sets the stock from `0` to `5` twice in quick succession, or sets it to `0` and then to `5` again with no new subscriber. The second raise notifies nobody.
- A user subscribes again after being notified and the edition is at `0` again. The next raise from `0` notifies the user again.
- The SMTP server is down. The admin request still returns `200`, and the bell notification exists.

### Out of scope

- An alert for a game with no edition. Digital games have unlimited copies and never go out of stock.
- An alert on a price drop of an edition. The wishlist badge covers the game discount only.
- A daily digest, a retry job for failed emails, and an unsubscribe link in the email.
- A watch list page.

## Feature 2: "Notify me" on the game detail page

### Description

An out-of-stock edition on the game detail page lets a signed-in user subscribe to a restock alert and cancel it again.

### Requirements

1. An edition with `stock <= 0` that the user does not own shows as a tile with a "Notify me" button inside it. An edition in stock, and an edition the user owns, shows no such button.
2. While the user has an alert (the edition id is in `GET /api/games/:gameId/stock-alerts`), the button reads `Notifying you` and a click removes the alert. While there is no alert, the button reads `Notify me` and a click creates it.
3. While the request runs, the button is disabled. After a success, the button shows the new state without a page reload. After a failure, the button keeps its old state and a short error message shows next to it.
4. A guest who clicks "Notify me" goes to the login page. After a login, the user returns to the game page.
5. The out-of-stock edition option stays disabled for the cart, as it is today.
6. The button takes its colors from the existing design tokens. It adds no raw hex value.

### Acceptance criteria

- A signed-in user opens a game with an edition at stock `0`. The edition shows the `Out of stock` label and a `Notify me` button.
- The user clicks `Notify me`. The button reads `Notifying you`. After a reload, it still reads `Notifying you`.
- The user clicks `Notifying you`. The button reads `Notify me` again.
- An edition in stock shows no notify button. An owned edition shows no notify button.
- A guest clicks `Notify me` and lands on the login page.
- The request fails. The button keeps its old text, and an error message shows.

### Out of scope

- A notify control on the catalog cards or the cart.
- A toast on subscribe. The button text is the confirmation.

## Feature 3: Restock notification in the bell and the email

### Description

The bell lists a restock item. The email tells the user that the edition is back.

### Requirements

1. A restock item in the bell reads `<Game title> (<edition name>) is back in stock`. The game title and the edition name are bold, like the other items.
2. A click on the item goes to `/game/<gameId>` and marks the item as read, the same way the review reply item does.
3. The bell badge count, the poll, "Mark as read", and "Mark all as read" work for the new type with no change to their behavior.
4. The email has the subject `<Game title> (<edition name>) is back in stock`, a short line, and a link to the game page. It has an HTML part and a text part.
5. One alert gives one bell item and one email. The email never contains the stock count.

### Acceptance criteria

- After the admin raises the stock from `0`, the subscribed user sees the bell badge go up by one. The item text matches requirement 1.
- The user clicks the item. The page is `/game/<gameId>`, and the item no longer shows in the bell.
- The e2e mail catcher has one email for the user. Its subject matches requirement 4, and its body has the game page link.
- A user who did not subscribe gets no notification and no email.

### Out of scope

- A push notification outside the site.
- A different wording per edition type.

## Cross-feature requirements

- Test IDs follow `apps/web/CLAUDE.md` (lowercase, hyphens):
  - `edition-notify` for the "Notify me" or "Notifying you" button on an edition.
  - `edition-notify-error` for the error message next to it.
  - `notification-item` for each bell item. The restock item reuses it, so a test tells the type by its text.
- The button text is exactly `Notify me` or `Notifying you`, so tests can assert on it.
- Every API error goes through `CustomError` and `toHttpException`. The web app shows a short message for a failed request and never shows a raw error.
- `GamesService.updateEdition` is the one place that decides that stock went from zero to above zero. Feature 3.3 calls it when it restores stock.
- Every schema change gets a Prisma migration. The seed script needs no change unless a test needs seeded alerts.
- Before you mark the feature done, run `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test --filter web`, `pnpm test --filter api`, and the new Playwright spec.

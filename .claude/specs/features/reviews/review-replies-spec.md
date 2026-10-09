# Review Replies and Notifications Spec

## Purpose

The reviews feature (`.claude/specs/features/reviews/reviews-spec.md`) lets an owner of a game rate it and write one review. Today nobody can answer a review. The reviews spec and roadmap item 2.3 list replies as out of scope. This spec adds them.

An owner of a game can reply to any review of that game. Replies form a flat thread under the review. A user who takes part in a thread gets an in-app notification when someone else replies. The notification shows as a bell with a number in the main navigation. The user marks a notification as read, and it leaves the list.

## Design reference

Figma section name: Review replies and notifications (proposal). It lives in the same file and on the same page as the reviews frames. Link:
https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=345-369

The section holds five frames:

- "Game Details — Review thread (owner)" (`node-id=345-370`, 1440 px): the nav bar with the bell and a badge, a review that a notification links to (`review-linked`) with its thread open and the reply form, and three reviews with a collapsed `Replies` toggle.
- "Game Details — Notification panel (3 unread)" (`node-id=347-422`, 1440 px): the bell in its open state and the panel with three notifications.
- "Replies and notifications — States" (`node-id=348-587`): collapsed thread, open thread with no replies, more replies to load, signed out, signed in without the game, send failed with the text kept, sending, replies failed to load, the bell with no unread, 3, and 9+, the empty panel, and the panel with more than 20 unread.
- "Game Details — Review thread (mobile 390)" (`node-id=349-379`) and "Game Details — Notification panel (mobile 390)" (`node-id=349-427`): the same thread and panel in one column.

The frames use the file's `Color`, `Spacing`, and `Radius` variables, the `Redesign/*` text styles, and the `Button/Primary`, `Button/Secondary`, and `NavBar` components. The bell is a 20 px line icon. The badge uses `accent-cta` with `on-accent` text, so the section adds no new color. The thread sits inside the review card, behind a 2 px `border-default` rule on its left side. A review that a notification links to has a `ring-focus` border. On a 390 px screen, the `Mark as read` buttons and the `Replies` toggle are 44 px high.

## Assumptions and dependencies

- The reviews feature is built and live. This spec builds on `Review`, `ReviewsSection`, `ReviewItem`, and `findOwnedGame` in `apps/api/src/features/orders/order-ownership.util.ts`.
- Ownership has the same meaning as in the reviews spec. A user owns a game when the user has at least one `OrderItem` for it, in any edition or as a digital copy.
- A reply is plain text. The web app renders it as text and never as HTML.
- The thread is flat. A reply answers the review, not another reply. There is no nesting and no mention syntax.
- A reply cannot be edited or deleted in this pass. See open decision 3.
- The web app does not use websockets. The notification count refreshes through React Query with a 60 second poll and a refetch when the window gets focus.
- New web calls go through the generated `packages/dionis-api` client. Add the endpoints to `packages/dionis-api/dionis.yaml` and regenerate.
- The web app follows `.claude/rules/frontennd-architecture.md`. Replies extend the module `apps/web/modules/reviews`. Notifications are a new module at `apps/web/modules/notifications`. The API adds replies to `apps/api/src/features/reviews` and adds a new module `apps/api/src/features/notifications`.
- No email is sent. No new environment variable is needed.

## Open decisions

Each item has a default that this spec already uses. Change the default before phase 2 if you disagree.

1. Can an Admin reply without owning the game? Default: no. Only owners reply, so the store has no special voice. An admin who wants to answer must own the game.
2. Who gets a notification? Default: the author of the review, and every other user who already replied in that thread. The user who writes the reply never gets one for it.
3. Can an author edit or delete a reply? Default: no, to match the reviews spec, where a review cannot be deleted. Public threads between users raise the risk of abuse. A small admin `DELETE` is the cheapest first step if abuse appears.
4. Is the reply text required? Default: yes. A reply has 1 to 500 characters after trimming.
5. Does a notification stay after the user reads it? Default: no. The row keeps a `readAt` date, and the list returns only unread rows.

## Feature 1: Replies API

### Description

The API stores replies to a review, lists them, and adds a reply count to each review.

### Requirements

1. Add the Prisma model `ReviewReply` with `id`, `reviewId`, `userId`, `body` (String), and `createdAt`. Add `@@index([reviewId, createdAt])`. Both relations use `onDelete: Cascade`. Add the Prisma migration.
2. `GET /api/reviews/:reviewId/replies` is public. It accepts a `page` query value, starts at 1, and returns 10 replies per page, oldest first. The response is `{ totalPages, replies }`. Each reply has `id`, `body`, `authorName`, and `createdAt`. It never returns an email address or a user id. An unknown review returns `404`.
3. `POST /api/reviews/:reviewId/replies` uses `JwtAuthGuard`. A DTO validates the body. `body` is a string of 1 to 500 characters after trimming. The route returns the saved reply with status `201`.
4. `POST` returns `403` with a clear message when the user does not own the game of the review. It returns `404` for an unknown review and `400` for an invalid body. The author of the review can reply to the own review if the author owns the game.
5. `GET /api/reviews/:reviewId` is public. It returns one review in the same shape as an item of `GET /api/games/:id/reviews`, with `gameId`. The notification link uses it to show the review that a reply belongs to. An unknown review returns `404`.
6. Each review in `GET /api/games/:id/reviews` and in `GET /api/reviews/:reviewId` adds `replyCount`, a number. The `reviews.spec.ts` test that lists the keys of a review includes `replyCount`.
7. The service throws `CustomError`, and the controller rethrows it through `toHttpException`. Validate `:reviewId` by hand in the controller, like the other id routes.
8. A unit test next to each service and controller covers the cases in the acceptance criteria below.

### Acceptance criteria

- A signed-in owner sends `POST` with text. The response is `201`, and `GET /api/reviews/:reviewId/replies` lists that reply.
- The same owner sends `POST` twice. The list holds two replies in the order of creation.
- A signed-in user who does not own the game sends `POST`. The response is `403`, and no reply is stored.
- A request without a token gets `401` on `POST`.
- A body that is empty, only spaces, or longer than 500 characters returns `400`.
- An unknown review id returns `404` on `GET` and on `POST`.
- A review with 11 replies shows 10 on page 1 and 1 on page 2.
- A review with three replies shows `replyCount` 3 in the reviews list.
- The replies response holds no `email` and no `userId` field.

### Out of scope

- Editing and deleting a reply, moderation, reporting, and nested replies.
- Reply counts on the game card or the home page.

## Feature 2: Notifications API

### Description

The API creates a notification for each person who takes part in a thread when someone else replies. A user lists the unread notifications and marks them as read.

### Requirements

1. Add the Prisma model `Notification` with `id`, `userId` (the recipient), `replyId`, `readAt` (nullable date), and `createdAt`. Add `@@unique([userId, replyId])` and `@@index([userId, readAt])`. Both relations use `onDelete: Cascade`. Add the Prisma migration.
2. When `POST /api/reviews/:reviewId/replies` saves a reply, the same transaction creates one `Notification` for the author of the review and one for each other user who already replied to that review. Each user gets one notification per reply. The user who writes the reply gets none.
3. `GET /api/notifications` uses `JwtAuthGuard`. It returns `{ unreadCount, notifications }` for the current user. The list holds unread rows only, newest first, with a maximum of 20. `unreadCount` counts all unread rows, also those beyond 20. Each notification has `id`, `type` (the fixed value `review_reply`), `gameId`, `gameTitle`, `reviewId`, `actorName`, and `createdAt`. `actorName` is `User.name`, or `Anonymous` when the name is empty. It never returns an email address.
4. `POST /api/notifications/:id/read` uses `JwtAuthGuard`. It sets `readAt` and returns `204`. A notification of another user returns `404`. A notification that is already read returns `204`.
5. `POST /api/notifications/read-all` uses `JwtAuthGuard`. It sets `readAt` on every unread notification of the current user and returns `204`.
6. The service throws `CustomError`, and the controller rethrows it through `toHttpException`. Validate `:id` by hand in the controller.
7. A unit test next to each service and controller covers the cases in the acceptance criteria below.

### Acceptance criteria

- User A reviews a game. Owner B replies. User A has one notification with B as `actorName`. B has none.
- Owner C then replies in the same thread. A and B each get one notification for the reply of C. C gets none.
- A replies to the own review. A gets no notification.
- User A has 25 unread notifications. The list holds 20, and `unreadCount` is 25.
- User A marks one notification as read. The next `GET` no longer lists it, and `unreadCount` drops by 1.
- User A sends `read-all`. The next `GET` returns an empty list and `unreadCount` 0.
- User A sends `read` for a notification of user B. The response is `404`, and the notification of B stays unread.
- A request without a token gets `401` on every notification route.
- The notifications response holds no `email` and no `userId` field.

### Out of scope

- Email, push, and websocket delivery.
- Notification types other than `review_reply`. The stock and price alerts keep their own places.
- A page with the full history of read notifications.
- Settings that turn notifications off.

## Feature 3: Replies on the game detail page

### Description

Each review on the game detail page shows its reply count and opens its thread. An owner of the game writes a reply inline.

### Requirements

1. Each `review-item` shows a `Replies` toggle button (`review-replies-toggle`) with the count, for example `Replies (3)`. When the count is 0 and the user can reply, the toggle reads `Reply`. When the count is 0 and the user cannot reply, the toggle does not render. The chevron points down when the thread is closed and up when it is open.
2. The toggle opens the thread (`review-thread`) under the review. The thread loads `GET /api/reviews/:reviewId/replies` when it opens, and not before. It lists the replies oldest first. Each reply shows the author name, the date, and the text.
3. The thread has `Load more replies` (`review-replies-more`) when `totalPages` is above the loaded page. The button adds the next page below the loaded replies.
4. A thread with no replies shows `No replies yet. Start the conversation.` (`reply-empty`) to a user who can reply. A signed-in user who owns the game sees a reply form at the end of the thread. It has a text area with a counter for the 500-character limit and a `Reply` button (`reply-submit`). The button stays disabled while the text is empty after trimming. While the request runs, the button reads `Sending…`, looks disabled, and ignores more clicks.
5. After a successful submit, the new reply shows in the thread, the reply count grows by one, and the text area clears, without a page reload. A failed submit shows the API error above the button (`reply-error`) and keeps the typed text.
6. A signed-out user sees a `Log in to reply` link (`reply-login-prompt`) inside an open thread. The link is `/login?next=<current path>`, with the same rules for `next` as in the reviews spec. A signed-in user who does not own the game sees the text `Buy this game to reply` (`reply-owner-required`) and no form.
7. A thread load that fails shows `reply-load-error` and a `Try again` button (`reply-retry`). The rest of the page stays intact.
8. When the page URL has `?review=<reviewId>`, the section loads that review with `GET /api/reviews/:reviewId` and shows it first, above the list, with its thread open (`review-linked`). The review scrolls into view. It has a `LINKED FROM YOUR NOTIFICATION` label (`review-linked-label`) above its stars. If the review belongs to another game or does not exist, the section ignores the value and shows the normal list. The linked review does not show a second time in the list when it is on the current page.
9. The module `apps/web/modules/reviews` holds the new components, each in its own folder under `presentation/`. It keeps no client store. React Query caches the replies.
10. Take colors and shadows from the design tokens. Do not use a raw hex value.

### Acceptance criteria

- An owner opens a review with no replies, opens the thread, types a text, and submits. The reply shows in the thread, and the toggle reads `Replies (1)`.
- The owner reloads the page and opens the thread. The reply is still there.
- A user who did not buy the game opens a thread and sees `Buy this game to reply` and no form.
- A signed-out user opens a thread and sees `Log in to reply` and no form.
- The `Reply` button is disabled until the text has a visible character.
- A review with 11 replies shows 10 after the thread opens. `Load more replies` adds the last one.
- A reply text such as `<b>hi</b>` shows as the literal characters and does not render bold text.
- No reply shows the author email address anywhere on the page.
- A user opens `/game/<id>?review=<reviewId>` for a review that is not on page 1. The linked review shows first with its thread open.
- A user opens `/game/<id>?review=<unknown id>`. The page shows the normal list with no error.

### Out of scope

- Editing and deleting a reply from the page.
- Replying from the account page.
- Sorting replies.

## Feature 4: Notification bell in the main navigation

### Description

A signed-in user sees a bell in the main navigation. A number on the bell shows how many unread notifications exist. The bell opens a list. Each item opens its review, and the user marks items as read.

### Requirements

1. `apps/web/components/main-navigation/MainNavigation.tsx` renders `NotificationBell` for a signed-in user, next to the existing account controls. A signed-out user sees no bell. The component comes from the entry of `apps/web/modules/notifications/presentation`.
2. The bell button (`notification-bell`) has an `aria-label` such as `Notifications, 3 unread`. A badge (`notification-count`) shows `unreadCount`. The badge shows `9+` above 9. The badge does not render when the count is 0.
3. The bell loads `GET /api/notifications` when the user is signed in. It refetches every 60 seconds and when the window gets focus. A failed refetch keeps the last known list and count.
4. The bell opens a panel (`notification-panel`). The panel lists the notifications (`notification-item`). Each item shows the text `<actorName> replied to a review of <gameTitle>` and the relative time. An empty list shows `You are all caught up` with the line `New replies to your reviews show up here.` (`notification-empty`). When `unreadCount` is above the number of listed items, the panel ends with the line `Showing the latest 20 of <unreadCount> unread` (`notification-more`).
5. A click on an item (`notification-link`) goes to `/game/<gameId>?review=<reviewId>` and marks that notification as read. The item leaves the list and the count drops by one, without waiting for the page load. If the request fails, the item returns and the count goes back.
6. Each item has a `Mark as read` button (`notification-read`). It marks the notification as read and removes the item without going to the page.
7. The panel has a `Mark all as read` button (`notification-read-all`) when the list is not empty. It clears the list and sets the count to 0. If the request fails, the list returns.
8. The panel closes on `Escape`, on a click outside, and when the user goes to another page. The bell, the panel, and every button work with the keyboard. Focus returns to the bell when the panel closes.
9. The module `apps/web/modules/notifications` holds `domain/`, `integration/` (`repository.ts` and a mapper), and `presentation/` with one folder per component. It keeps no client store. React Query caches the list. When the user signs out, the bell clears its cached list.
10. Take colors and shadows from the design tokens. The badge uses an existing token. Do not use a raw hex value.

### Acceptance criteria

- Owner B replies to a review of user A. A signs in and sees the bell with the number 1.
- A opens the panel and sees `<B> replied to a review of <game>`. A clicks the item. The page opens on that game with the review first and its thread open, and the bell count is 0.
- A has three notifications and clicks `Mark as read` on one. The panel lists two, and the count is 2. A stays on the same page.
- A clicks `Mark all as read`. The panel shows `You are all caught up`, and the badge is gone.
- A has 10 unread notifications. The badge shows `9+`.
- A has 25 unread notifications. The panel lists 20 and ends with `Showing the latest 20 of 25 unread`.
- A stays signed in on another tab while B replies. Within about 60 seconds, or when the window of A gets focus, the count grows.
- A signed-out visitor sees no bell.
- The bell badge never shows an email address.

### Out of scope

- A sound, a desktop notification, or a toast when a notification arrives.
- A notification page and the history of read notifications.
- Notifications for other events.

## Cross-feature requirements

- Follow the `data-testid` rule in `apps/web/CLAUDE.md`. Use these names:
  - `review-replies-toggle`: the toggle on a review, with the reply count.
  - `review-thread`: the open thread of one review.
  - `reply-item`: each listed reply.
  - `reply-author`, `reply-date`, `reply-body`: parts of one `reply-item`.
  - `review-replies-more`: the `Load more replies` button.
  - `reply-form`: the reply form container.
  - `reply-body-input`: the reply text area.
  - `reply-submit`: the submit button.
  - `reply-error`: the error message above the button.
  - `reply-login-prompt`: the signed-out prompt.
  - `reply-owner-required`: the `Buy this game to reply` text.
  - `reply-load-error` and `reply-retry`: the thread load failure and its `Try again` button.
  - `review-linked`: the container of the review that the `?review=` value selects. It holds the same parts as a `review-item` (`review-author`, `review-stars`, `review-date`, `review-body`, `review-replies-toggle`, `review-thread`), but it is not a `review-item`, so the list count does not include it.
  - `notification-bell`: the bell button.
  - `notification-count`: the badge.
  - `notification-panel`: the open panel.
  - `notification-item`: each listed notification.
  - `notification-link`: the link inside an item.
  - `notification-read`: the `Mark as read` button of an item.
  - `notification-read-all`: the `Mark all as read` button.
  - `notification-empty`: the empty message.
  - `notification-more`: the line that shows when more unread notifications exist than the panel lists.
  - `review-linked-label`: the label above the linked review.
  - `reply-empty`: the text of a thread with no replies.
- The bell, the panel, the toggle, and the reply form must work with the keyboard. The reply text area has an accessible label that contains the word `reply`. The toggle sets `aria-expanded` to `true` or `false`. The bell has an `aria-label` that starts with `Notifications`, and it ends with `, <count> unread` when the count is above 0.
- The existing rate limit applies to the new routes. No route needs a custom limit in this pass.
- The seed script needs no reply or notification data. The E2E tests create their own users, purchases, reviews, and replies through the API, with the helper in `packages/e2e/tests/helpers/checkout.ts`.
- `.claude/specs/roadmap-spec.md` item 2.3 lists replies as out of scope. After this spec is approved, update that line to point to this spec.
- Before the feature counts as done, run `pnpm lint`, `pnpm build`, `pnpm test --filter web`, `pnpm test --filter api`, and `pnpm --filter @repo/e2e test:e2e -- tests/review-replies.spec.ts`.

# Reviews and Ratings Spec

## Purpose

Feature 2.3 of `.claude/specs/roadmap-spec.md` adds reviews. Today the store has no reviews of its own. `Game_pc.rating` is a string such as `"4.42"` that comes from the seed source. `RatingBadge` shows it on the game card and the wishlist, and the `rating_desc` sort orders by it. The game detail page (`apps/web/modules/games/presentation/game-details/GameDetails.tsx`) shows no rating and no opinions from other buyers.

This spec lets a user who bought a game rate it from 1 to 5 and write a short review. The game detail page shows the average rating and the list of reviews.

## Design reference

Figma section name: Reviews: Game Details (proposal). It lives in the same file and on the same page as the other redesign frames. Link:
https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=327-353

The section holds three frames:

- "Game Details — Reviews (owner)" (`node-id=327-354`, 1440 px): the average rating and count, the review form, the review list, and the page controls.
- "Game Details — Reviews (mobile 390)" (`node-id=328-366`): the same section in one column.
- "Reviews — States" (`node-id=327-480`): no reviews, signed out, not an owner, edit mode, a failed submit that keeps the text, and a failed load.

The frames use the file's `Color`, `Spacing`, and `Radius` variables, the `Redesign/*` text styles, and the `Button/Primary`, `Button/Secondary`, and `NavBar` components. The average rating uses Space Grotesk 56 Bold. Stars are white when filled and `border-default` when empty, so the section adds no new color. The owner frame shows only the game title as context. The existing "Game Details — Physical Editions" frame covers the part of the page above the reviews, and the section sits below its edition list.

## Assumptions and dependencies

- Ownership means the user has at least one `OrderItem` for the game, in any edition or as a digital copy. A buyer of only the physical edition can review. `findOwnedItem` in `apps/api/src/features/orders/order-ownership.util.ts` matches one exact `(gameId, editionId)` pair, so it does not answer this question. The implementation adds one small helper next to it that matches on `gameId` alone.
- A user has one review per game. A second submit edits the first one.
- The seed `rating` column stays in this pass. The game card, the wishlist, and the `rating_desc` sort keep using it. The roadmap says to remove it once the store has its own reviews. That removal is a separate change, after enough real reviews exist.
- Refunds do not exist yet (roadmap 3.3). A review stays after a future refund unless that feature decides otherwise.
- The review body is plain text. The web app renders it as text and never as HTML.
- A new web call goes through the generated `packages/dionis-api` client. Add the endpoints to `packages/dionis-api/dionis.yaml` and regenerate.
- The web module follows `.claude/rules/frontennd-architecture.md` as a new module at `apps/web/modules/reviews`. The API follows `apps/api/CLAUDE.md` as a new module at `apps/api/src/features/reviews`.
- No new environment variable is needed.

## Open decisions

Each item has a default that this spec already uses. Change the default before phase 2 if you disagree.

1. Can a user delete their own review? Default: no. The roadmap lists only `PUT`. A user can edit but not remove.
2. Can an admin remove an abusive review? Default: no, because the roadmap puts moderation out of scope. Text from any buyer shows publicly, so a small `DELETE` for admins is the cheapest first step if abuse appears.
3. Is the review text required? Default: no. A rating alone is valid. The text is optional with a maximum of 1000 characters.
4. What name does a review show? Default: `User.name`, and `Anonymous` when the name is empty. The email address never shows.

## Feature 1: Reviews API

### Description

The API stores one review per user and game, lists reviews of a game, and adds the average rating to the game response.

### Requirements

1. Add the Prisma model `Review` with `id`, `userId`, `gameId`, `rating` (Int), `body` (String, default empty), `createdAt`, and `updatedAt`. Add `@@unique([userId, gameId])`. Both relations use `onDelete: Cascade`, like `WishlistItem`. Add the Prisma migration.
2. `GET /api/games/:id/reviews` is public. It accepts a `page` query value, starts at 1, and returns 10 reviews per page, newest first. The response is `{ totalPages, reviews }`. Each review has `id`, `rating`, `body`, `authorName`, and `createdAt`. It never returns an email address or a user id. An unknown game returns the same error as `GET /api/game/:gameId`.
3. `PUT /api/games/:id/review` uses `JwtAuthGuard`. A DTO validates the body: `rating` is an integer from 1 to 5, and `body` is an optional string of at most 1000 characters. The route creates the review, or replaces the rating and text of the existing one. It returns the saved review with status 200.
4. `PUT` returns `403` with a clear message when the user has no `OrderItem` for the game. It returns `400` for an invalid rating or body.
5. `GET /api/games/:id/review` uses `JwtAuthGuard`. It returns the review of the current user for that game, or `404` when there is none. The review form uses it to fill in the saved values.
6. `GET /api/game/:gameId` adds `averageRating` and `reviewCount`. `averageRating` is a number rounded to one decimal, or `null` when `reviewCount` is `0`. The `rating` string stays in the response.
7. The service throws `CustomError`, and the controller rethrows it through `toHttpException`. The path parameter `:id` is validated by hand in the controller, like the other game routes.
8. A unit test next to each service and controller covers the cases in the acceptance criteria below.

### Acceptance criteria

- A signed-in user who bought a game sends `PUT` with rating 4 and text. The response is 200, and `GET /api/games/:id/reviews` lists that review.
- The same user sends `PUT` again with rating 2. The list still holds one review from that user, and its rating is 2.
- A signed-in user who did not buy the game sends `PUT`. The response is 403, and no review is stored.
- A request without a token gets 401 on `PUT` and on `GET /api/games/:id/review`.
- `rating` of 0, 6, or 3.5 returns 400. A body longer than 1000 characters returns 400.
- After two reviews with ratings 5 and 4, `GET /api/game/:gameId` returns `averageRating` 4.5 and `reviewCount` 2. A game with no review returns `averageRating` `null` and `reviewCount` 0.
- The reviews response holds no `email` and no `userId` field.
- A user who bought only the physical edition of a game can review it.

### Out of scope

- Deleting a review, moderation, replies, and helpful votes.
- Sorting or filtering reviews.
- Changing the `rating_desc` sort or the `rating` string on the game card.

## Feature 2: Reviews on the game detail page

### Description

The game detail page shows the average rating, the list of reviews, and a review form for users who bought the game.

### Requirements

1. Below the information panel on the game detail page, add a reviews section. It shows the average rating with one decimal (`reviews-average`, for example `4.5`) and the review count (`reviews-count`, `1 review` or `12 reviews`). When there is no review, it shows the empty state of requirement 11 in place of the average card.
2. The section lists the reviews of the current page. Each item shows the stars, the author name, the date, and the text. A review without text shows the stars only.
3. The list has previous and next page controls when `totalPages` is above 1. The list uses the existing pagination pattern in the games module, where it fits.
4. A signed-in user who owns the game sees a review form. It has five star buttons and a text area with a counter for the 1000-character limit. When the user already has a review, the form opens with the saved values and the button reads `Update review`. Otherwise the button reads `Submit review`.
5. The submit button stays disabled until the user picks a rating. While the request runs, it shows a loading state and ignores more clicks.
6. After a successful submit, the average rating, the count, and the list refresh without a page reload. A failed submit shows the error message from the API above the button and keeps the typed text.
7. A signed-out user sees a short prompt with a link to the login page instead of the form. A signed-in user who does not own the game sees the text `Buy this game to review it` instead of the form. The ownership check for the display uses the existing owned items list. The API still enforces the rule.
8. The reviews section degrades on an API error. It shows a short message (`reviews-load-error`) with a `Try again` button (`reviews-retry`) that loads the list again, and keeps the rest of the page intact.
9. The module `apps/web/modules/reviews` holds `domain/` (types), `integration/` (`repository.ts` and a mapper), and `presentation/` (one folder per component). It has no `core/` store, because the server owns the state and React Query caches it. The game detail page imports the section through the module's `presentation/` entry.
10. Take colors and shadows from the design tokens. Do not use a raw hex value.
11. While the game has no review, an empty state (`reviews-empty`) replaces the average card. It has the heading `No reviews yet` and one action that depends on the visitor:
    - A signed-out visitor sees a `Log in` link (inside `review-login-prompt`). The link is `/login?next=<current path>`, and login returns the user to that page. The `next` value must be a path on this site. A full URL, `//host`, and a backslash all fall back to the home page.
    - A signed-in user who does not own the game sees the text `Buy this game to review it` (`review-owner-required`) and no button or link, because the edition buttons are already on the page.
    - An owner sees `You own this game. Be the first to review it.` and a `Write the first review` button (`review-write-first`). The button scrolls to the review form and focuses its first star. The form shows below the empty state.
      The login and purchase messages show once, in the empty state, and not again in a card below it. The `Log in` link of the review prompt on a game with reviews uses the same `next` path. When the first review is saved, the empty state gives way to the average card, and the form stays mounted.

### Acceptance criteria

- A signed-in user who bought a game opens its detail page, picks 5 stars, types a text, and submits. The new review shows in the list, and the average rating shows 5.0 with `1 review`.
- The same user reloads the page. The form shows 5 stars and the saved text, and the button reads `Update review`.
- The user changes the rating to 3 and submits. The list still holds one review from them, with 3 stars.
- A signed-in user who did not buy the game sees `Buy this game to review it` and no form.
- A signed-out user sees the login prompt and no form.
- The submit button is disabled until a star is picked.
- A game with 11 reviews shows 10 on page 1 and 1 on page 2.
- A game with no review shows the empty state. A signed-out visitor sees `Log in`, logs in, and lands on the same game page. A `next` value that points to another site lands on the home page. A non-owner sees the text `Buy this game to review it` and no button. An owner clicks `Write the first review` and the first star has focus.
- A review text such as `<b>hi</b>` shows as the literal characters and does not render bold text.
- No review shows the author email address anywhere on the page.

### Out of scope

- Showing the new average on the game card, the wishlist, or the home page.
- Editing or deleting a review from the account page.
- Reporting a review.

## Feature 3: Store score on the featured deal

### Description

The featured deal on the home page (the first game of `Top Deals`) shows the store's own average rating next to the seed rating badge.

### Requirements

1. `GET /api/games/top-deals` adds `averageRating` and `reviewCount` to each game, with the same meaning as on `GET /api/game/:gameId`. The API reads the summaries of all deals with one grouped query.
2. The featured deal shows the stars (hidden below the `sm` breakpoint), the average with one decimal (`featured-average`), and the count in brackets (`featured-count`), inside `featured-reviews`. When the game has no review, the element does not render.
3. The score sits in the same row as the rating badge and the price. It adds no height, so the home page does not shift. The skeleton heights of `TopDealsSkeleton` stay valid.
4. The `Next Up` rows and the game cards show no store score in this pass.

### Acceptance criteria

- With a review summary of 4.5 and 12 reviews, the featured deal shows `4.5` and `(12)`.
- With no review, the featured deal shows no store score.
- Every game in the `top-deals` response has `averageRating` and a numeric `reviewCount`.
- The featured slab is 568 px high when stacked and 268 px high from the `md` breakpoint, with or without a score.

### Out of scope

- Replacing the seed `rating` badge.
- A store score on the `Next Up` rows, the game cards, and the wishlist.

## Cross-feature requirements

- Follow the `data-testid` rule in `apps/web/CLAUDE.md`. Use these names:
  - `reviews-section`: the whole section.
  - `reviews-average`: the average rating text.
  - `reviews-count`: the review count text.
  - `reviews-empty`: the `No reviews yet` text.
  - `review-item`: each listed review.
  - `review-author`, `review-stars`, `review-date`, `review-body`: parts of one `review-item`. `review-stars` has an `aria-label` such as `4 out of 5 stars`, so a test can read the rating.
  - `reviews-load-error` and `reviews-retry`: the load failure message and its `Try again` button.
  - `review-write-first`: the owner action of the empty state.
  - `featured-reviews`, `featured-stars`, `featured-average`, `featured-count`: the score on the featured deal.
  - `review-form`: the form container.
  - `review-star`: each of the five star buttons.
  - `review-body-input`: the text area.
  - `review-submit`: the submit button.
  - `review-error`: the error message above the button.
  - `review-login-prompt`: the signed-out prompt.
  - `review-owner-required`: the `Buy this game to review it` text.
  - `reviews-next-page` and `reviews-prev-page`: the page controls.
- The star buttons need an `aria-label` such as `Rate 4 out of 5`, and the form must work with the keyboard.
- The seed script needs no review data. The E2E tests create their own reviews through the API after a test purchase, with the helper in `packages/e2e/tests/helpers/checkout.ts`.
- Before the feature counts as done, run `pnpm lint`, `pnpm build`, `pnpm test --filter web`, `pnpm test --filter api`, and `pnpm --filter @repo/e2e test:e2e -- tests/reviews.spec.ts`.

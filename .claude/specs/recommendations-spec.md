# Recommendations Spec

## Purpose

Feature 3.4 of `.claude/specs/roadmap-spec.md` adds a "Because you viewed" strip of games. Today a user finds a new game only through the catalog, search, and top deals. The account page shows the games the user viewed (`RecentlyViewedSection`), and the game detail page shows nothing related.

This spec adds one strip on the account page and one on the game detail page. The first version ranks games by genre. It needs no new table and no machine-learning service, as the roadmap says.

## Design reference

Placeholder. Phase 2 fills this in with the Figma section and frame names.

## Assumptions and dependencies

- The recently-viewed list lives only in `localStorage`, in `useRecentlyViewedStore` (`apps/web/modules/account/core/store.ts`). It holds at most 10 game ids. The server cannot read it, so the web app sends the ids with the request.
- `Game_pc.genre` is one string per game. `GamesService` already groups games by it for `GET /api/games/genres`.
- A signed-in user's owned games come from the existing `GET /api/orders/owned`. The web app already has a hook for it in the `games` module. The recommendation endpoint stays public and stateless, and the web app sends the owned ids as seeds and as exclusions.
- The game detail page records a view through `useRecentlyViewedStore`. The strip reads the same store.
- A new web call goes through the generated `packages/dionis-api` client. Add the route to `packages/dionis-api/dionis.yaml` and regenerate.
- The web changes follow `.claude/rules/frontennd-architecture.md`. The strip is a component in the `games` module, and the account page and the game detail page import it.
- No new environment variable and no Prisma migration are needed.

## Open decisions

Each item has a default that this spec already uses. Change the default before phase 2 if you disagree.

1. How does the API rank games? Default: count the genres of the seed games. A game from the most common genre ranks first. Games in the same genre sort by title, so the order is stable. A rating-based tie-break is a follow-up, because `rating` is a string from the seed source.
2. What does the detail page use as seeds? Default: the game on the page plus the recently viewed ids. The game on the page is never in the result.
3. What does the account page show when the user has no recent views? Default: a strip titled "Based on your library" that seeds from the owned games only. With no views and no owned games, the strip does not render.
4. Does the result cache? Default: no. One indexed lookup of seed genres and one query for candidates is cheap, and the inputs differ for each user.
5. How many games show? Default: 6, and the API allows at most 12.

## Feature 1: Recommendations API

### Description

The API returns games from the genres of the seed games, without the games the caller excludes.

### Requirements

1. Add `GET /api/games/recommendations` with the query `seedGameIds`, `excludeGameIds`, and `limit`. It is public, like `GET /api/games`, and it has no auth guard. Declare it before the `:id` style routes in the controller, so the word `recommendations` is not read as an id.
2. A DTO with `class-validator` decorators validates the query. `seedGameIds` is required, and holds 1 to 30 comma-separated positive integers. `excludeGameIds` is optional and holds up to 60 of them. `limit` is an optional integer from 1 to 12 and defaults to 6. An invalid value returns `400`.
3. The service reads the genre of each seed game. It ignores a seed id that does not match a game. When no seed matches a game, it returns an empty list.
4. The service ranks genres by how many seed games have them, then returns games from those genres in that order. Within one genre, games sort by title ascending. A game whose id is in `seedGameIds` or `excludeGameIds` is never returned.
5. The response is a list of the same game summary shape that `GET /api/games` returns for one item, so the web app can render a `GameCard` from it. It has no per-user field.
6. The route sends the header `Cache-Control: no-store`, because the result depends on the query.
7. A unit test next to the service, the controller, and the DTO covers the cases in the acceptance criteria below.

### Acceptance criteria

- Seeds with two Action games and one RPG game return Action games first, then RPG games.
- A seed game and an excluded game never appear in the result.
- A seed id that does not exist is ignored. Only unknown seed ids return an empty list.
- `limit=3` returns at most 3 games. `limit=13` returns `400`.
- A missing `seedGameIds`, a non-numeric id, and more than 30 ids each return `400`.
- A request without a token works.

### Out of scope

- Ranking by rating, price, release date, or popularity.
- Collaborative filtering and any model that learns from other users.
- Storing the seeds on the server.

## Feature 2: "Because you viewed" strip

### Description

A strip of game cards, shown on the account page and on the game detail page.

### Requirements

1. Add a presentation component in the `games` module. It takes the seed ids and the excluded ids as props, calls the generated client for the API of Feature 1, and renders up to 6 `GameCard` components. Each card links to `/game/<id>`, like `RecentlyViewedSection` does.
2. On the game detail page, render the strip below the game information. The seeds are the game on the page plus the recently viewed ids. The excluded ids are the game on the page, and the owned games when the user is signed in. The heading is "Because you viewed".
3. On the account page, render the strip on the "My Games" tab below Recently Viewed. The seeds are the recently viewed ids. When there are none, the seeds are the owned game ids and the heading is "Based on your library". The excluded ids are the seeds and the owned games.
4. The strip renders nothing when the result is empty, when there are no seeds, or when the request fails. A failed request does not show an error, because the strip is optional content.
5. While the request runs, the strip shows a skeleton row, so the page does not jump.
6. A view that the user records while on the page does not change the strip until the next visit.

### Acceptance criteria

- A guest views two games of one genre, then opens a third game page. The strip shows other games of that genre and not the game on the page.
- A signed-in user who owns a game does not see that game in either strip.
- A user with no recent views and no owned games sees no strip on the account page.
- A user with owned games and no recent views sees "Based on your library" on the account page.
- Clicking a card opens that game's page.
- The strip shows at most 6 cards.

### Out of scope

- A strip on the home page, the cart, or the order page.
- A "dismiss" control and a user setting that turns the strip off.
- Syncing the recently-viewed list to the account on the server.

## Cross-feature requirements

- Test ids follow the lowercase-hyphen rule of `apps/web/CLAUDE.md`. Use `recommendations`, `recommendations-title`, `recommendations-skeleton`, and `recommendation-card`.
- The web app reads the recently-viewed ids through the facade in the account module, not through the store file.
- Seed data: the E2E tests need at least two games in one genre and one game in another. Check the seed before phase 3, and add a game to the seed script only if it lacks them.

# Showdown Spec: Pick a Game Through a Bracket

## Purpose

A user who does not know what to play has two tools today. The `games-toolbar` filters narrow the list by platform, genre, price, sort, and edition. The AI search palette (`AiSearchPalette.tsx`) turns a sentence into those same filters. Both tools still end on a list of up to 20 games per page. The user must compare them alone.

This spec adds a Showdown. A Showdown is a knockout bracket of games from genres the user picks. The user sees two games at a time and keeps one. The other game leaves the bracket. Round by round, the bracket shrinks until one game wins. The store then offers that game for the cart or the wishlist.

The feature has four parts: an entry prompt on the home page, a setup screen, the bracket itself, and a winner screen.

## Design reference

Figma page name: Showdown. It is a separate page in the same file as the Home, Checkout, and AI Search sections.

The page holds five sections. Each section has a desktop frame (1440 wide) and a phone frame (390 wide), except the animation section.

- "Showdown: 1 Entry prompt": frames "Showdown: Home prompt — Desktop" and "Showdown: Home prompt — Mobile". These are copies of the Home frames with the "Can't decide?" button and the prompt card added.
- "Showdown: 2 Setup": frames "Showdown: Setup — Desktop" and "Showdown: Setup — Mobile".
- "Showdown: 3 Bracket": frames "Showdown: Bracket — Desktop" and "Showdown: Bracket — Mobile".
- "Showdown: 3b Pick animation": four desktop keyframes, "Pick animation 01 PICK", "02 CRACK", "03 SHATTER", and "04 NEXT MATCH". Each keyframe states its timing.
- "Showdown: 4 Winner": frames "Showdown: Winner — Desktop" and "Showdown: Winner — Mobile".

The design adds two details to the requirements below. Each match card has a "Keep this one" button that does the same thing as a click on the card. On a phone, the setup screen keeps the summary and the "Start" button in a bar fixed to the bottom of the screen.

## Assumptions and dependencies

The API has no way to fetch games from more than one genre in one call. `GamesQueryDto.genre` takes one string with an exact match on `Game_pc.genre`. `GET games/:page` returns 20 games per page, but a bracket needs up to 32. This spec adds one new endpoint, `GET games/showdown`, described in Feature 3. Add it to `packages/dionis-api/dionis.yaml` and regenerate the client. Do not call it with `fetch`.

`Game_pc.genre` is one string per game. So a game belongs to exactly one genre. The number of games that match "any of" the chosen genres equals the sum of their counts from `GET games/genres` (`GenreCount`). The setup screen uses that sum and needs no extra request.

"Top-rated" means the order that the existing `rating_desc` sort gives (`SORT_TO_ORDER_BY` in `games.service.ts`), with `id` ascending as a tie-break. That sort compares `rating` as a string. The existing `ponytail:` comment on it records the limit. This spec does not change it.

The new web code lives in a new module, `apps/web/modules/showdown`, with the shape in `.claude/rules/frontennd-architecture.md`. The bracket page is a new route, `apps/web/app/(shop)/showdown/page.tsx`. A route gives the bracket a real URL and keeps the browser Back button predictable.

Reuse these pieces. Do not add a copy of any of them:

- `Dialog` and `Button` from `@repo/ui`.
- `useAddCartItem` and `useOpenCartDrawer` from `modules/cart/core/facade.ts`.
- `useToggleWishlistItem` and `useIsInWishlist` from `modules/wishlist/core/facade.ts`.
- `useGetGamesGenres` from `modules/games/integration/repository.ts`.
- The color and shadow tokens in `apps/web/tailwind.config.ts` and `apps/web/app/globals.css`, such as `ink`, `panel-alt`, `neon-magenta`, `neon-cyan`, `shadow-retro`, and `shadow-retro-sm`.

Out of scope for this pass:

- Saving a finished bracket to the user's account, or sharing a result by link.
- Keeping a bracket in progress across a page reload. A reload restarts at the setup screen.
- Platform, price, or edition filters inside the Showdown. Genre is the only filter.
- Any analytics on prompt views, starts, or finishes.

## Feature 1: Entry points

### Description

The home page invites the user to try the Showdown once, through a prompt. A permanent entry stays in the toolbar for a user who dismissed the prompt or wants to play again.

### Requirements

1. On the home page, show a prompt 3 seconds after the page loads. Its text is "Don't know what to play? Start a Showdown and figure it out."
2. Make the prompt a non-modal card in the bottom corner of the screen. It must not block the page, take focus, or hide the cart drawer. A modal dialog on first visit blocks a user who came to buy, and it blocks every existing Playwright test that opens the home page.
3. Give the prompt two buttons: "Try it" and "Not now". Give it a close icon that acts as "Not now".
4. "Try it" opens `/showdown`. Both "Try it" and "Not now" mark the prompt as seen.
5. Keep the "seen" flag in a new zustand store with the `persist` middleware and a `partialize` option, the same pattern as `useCartStore`. Once the flag is set, never show the prompt again in that browser.
6. Show the prompt on the home page only. Do not show it on a game page, in checkout, in the account area, or in the admin area.
7. Add a "Can't decide?" button to `games-toolbar`, next to the Filters controls. It opens `/showdown`. It is visible on phone, tablet, and desktop widths, whether or not the prompt was seen.

### Acceptance criteria

- A user opens the home page in a fresh browser. After 3 seconds, the prompt appears with the text "Don't know what to play? Start a Showdown and figure it out."
- A user clicks "Try it" on the prompt. The app opens `/showdown`.
- A user clicks "Not now", then reloads the home page. The prompt does not appear again.
- A user clicks "Can't decide?" in the toolbar. The app opens `/showdown`.

### Out of scope

- Showing the prompt again after a time period, or after a number of visits.
- A prompt on any page other than home.

## Feature 2: Setup screen

### Description

This is the first screen of `/showdown`. The user picks genres and a bracket size, then starts the bracket.

### Requirements

1. List every genre from `GET games/genres` as a toggle chip, with its game count.
2. Let the user select 1 to 3 genres. When 3 genres are selected, disable the other chips until the user clears one.
3. Match the selected genres with "any of". A game is in the pool if its genre is one of the selected genres.
4. Offer three bracket sizes: 8, 16, and 32 games. Select 16 by default.
5. Show the number of picks each size takes: 7 for 8 games, 15 for 16 games, 31 for 32 games.
6. Compute the pool size as the sum of the selected genres' counts. Disable each size that is larger than the pool, and show the real count on it, for example "32 (only 21 games)".
7. If the selected size becomes disabled after a genre change, select the largest size that is still enabled.
8. If the pool has fewer than 8 games, disable all sizes and show the message "Not enough games in these genres. Add another genre."
9. Disable "Start" until at least one genre is selected and one size is enabled.

### Acceptance criteria

- A user opens `/showdown`. The 16 size is selected, and "Start" is disabled.
- A user selects a genre with at least 16 games. "Start" becomes enabled.
- A user selects a genre with 21 games. The 32 size is disabled and shows "only 21 games". The 8 and 16 sizes stay enabled.
- A user selects 3 genres. Every other genre chip is disabled.

### Out of scope

- Bracket sizes other than 8, 16, and 32.
- "All of" genre matching. A game has one genre, so "all of" with two genres always gives an empty pool.

## Feature 3: Showdown endpoint

### Description

A new API endpoint returns the bracket's games in one call.

### Requirements

1. Add `GET games/showdown` to the `games` feature module. Declare it before `games/:page` in `games.controller.ts`, the same way `games/genres` is declared, so "showdown" is not read as a page number.
2. Accept two query parameters through a new DTO, `dto/showdown-query.dto.ts`:
   - `genres`: an array of 1 to 3 strings, each at most 50 characters. A single value in the query string still becomes an array.
   - `size`: one of 8, 16, or 32, checked with `@IsIn` against an exported `ALLOWED_SHOWDOWN_SIZES` const array.
3. Return the top-rated `size` games whose genre is one of `genres`, in the order from the "top-rated" assumption above.
4. Return a JSON array of games. Each item has the same fields as one game from `GET games/:page`.
5. If fewer than `size` games match, throw a `CustomError` with status 400 and the message "Not enough games for this bracket size". The controller rethrows it through `toHttpException`.
6. Keep the endpoint public, like the other game list routes. It needs no guard.
7. Give the endpoint a unit test in `games.service.spec.ts` for the genre filter, the order, the size limit, and the 400 error.

### Acceptance criteria

- `GET games/showdown?genres=Shooter&size=8` returns 8 games, every one with the genre Shooter, in top-rated order.
- `GET games/showdown?genres=Shooter&genres=RPG&size=16` returns 16 games, each with the genre Shooter or RPG.
- A request with `size=10`, with no `genres`, or with 4 genres returns 400.

### Out of scope

- Random selection of the pool. The pool is the top-rated games, and only their pairing order is random.
- Caching beyond what the `games` module already does.

## Feature 4: Bracket

### Description

The user plays through the bracket, one match at a time. A match shows two games. The user's pick goes to the next round.

### Requirements

1. When the user clicks "Start", fetch the pool from `GET games/showdown` and shuffle it on the client. Pair the games in that shuffled order for round 1.
2. Show one match at a time: two game cards side by side on tablet and desktop, stacked on a phone. Each card shows the cover, title, genre, platform, and rating. Do not show the price, so the user picks on the game and not on the deal.
3. The user picks a game by clicking or tapping its card. The picked game goes to the next round. The other game leaves the bracket.
4. Play the pick animation after each pick. It takes about 950 ms in four phases:
   - Pick (0 to 120 ms): the picked card scales from 1 to 1.03 and gets a red glow.
   - Crack (120 to 320 ms): cracks spread from the click point on the other card. That card shakes 4 px twice and dims to 85% opacity. On a keyboard pick, the cracks start at the center of the cover.
   - Shatter (320 to 700 ms): the other card breaks into 14 glass shards. The shards fly out from the click point, spin, fall, and fade to 0. At the same time, the picked card shrinks and flies to its segment in the progress bar.
   - Next match (700 to 950 ms): the progress segment fills red with a short pulse. The next two cards slide up 24 px and fade in, 40 ms apart.
5. Lock the cards, "Undo", and "Restart" while the animation plays.
6. Animate only `transform` and `opacity`. Build the shards from copies of the card cut with fixed `clip-path` polygons. Do not add an animation dependency.
7. If the user's system asks for reduced motion (`prefers-reduced-motion: reduce`), skip the crack and the shatter. Fade the other card out and the next match in, in 200 ms at most.
8. "Undo" does not replay the animation in reverse. It shows the previous match at once.
9. Show progress above the match, for example "Round 2 of 4 · Match 3 of 4". Name the last two rounds "Semifinal" and "Final".
10. Give each card a "Details" link that opens the game page in a new tab. Clicking the link does not pick the game.
11. Give the user an "Undo" button that reverts the last pick. Disable it before the first pick.
12. Give the user a "Restart" button that returns to the setup screen with the same genres and size selected.
13. Keep the bracket state in a zustand store in `modules/showdown/core/store.ts`, without `persist`. Put the pairing and round logic in pure functions in `modules/showdown/domain/`, with a unit test.
14. While the pool loads, show a skeleton for the two cards. If the request fails, show an error message and a "Back to setup" button. Keep the layout intact.

### Acceptance criteria

- A user starts an 8-game bracket. The first match shows "Round 1 of 3 · Match 1 of 4" and two different games.
- A user picks a game in every match of an 8-game bracket. After 7 picks, the app shows the winner screen.
- A user picks a game, then clicks "Undo". The same match appears again.
- The winner of each match appears again in a later round. The loser of a match never appears again.
- No match card shows a price.

### Out of scope

- A full bracket tree view of all rounds at once.
- Keyboard shortcuts for picking the left or right game.
- A timer on each match.
- Sound effects for the pick animation.

## Feature 5: Winner screen

### Description

The last screen shows the winning game and offers the next step.

### Requirements

1. Show the winner large, with its cover, title, genre, platform, rating, and price with its discount.
2. Give the winner an "Add to cart" button. It adds the game's base digital version with `useAddCartItem`, with `editionId` set to `null` and `quantity` set to 1, then opens the cart drawer. If the game is already in the cart, show "In cart" and disable the button.
3. Give the winner a wishlist toggle with `useToggleWishlistItem`. Its state matches `useIsInWishlist`.
4. Give the winner a "View game" link to its game page.
5. Show the runners-up under the winner: the Final loser first, then the two Semifinal losers. Each one links to its game page.
6. Give the screen a "Play again" button. It returns to the setup screen with the same genres and size selected.

### Acceptance criteria

- A user finishes a bracket and clicks "Add to cart". The cart drawer opens, and it holds the winning game.
- A user finishes a bracket and clicks the wishlist toggle. The winning game appears on the wishlist page.
- A user finishes a bracket. The screen shows 3 runners-up, and none of them is the winner.
- A user clicks "Play again". The setup screen appears with the previous genres and size selected.

### Out of scope

- Adding a runner-up to the cart from this screen. A user opens its game page instead.
- Choosing a physical edition from this screen.

## Cross-feature requirements

- Give a `data-testid` to each container and to every interactive or verifiable element, in lowercase with hyphens, per `apps/web/CLAUDE.md`. Use these names so phase 3 tests can select on them:
  - Entry: `showdown-prompt`, `showdown-prompt-try`, `showdown-prompt-dismiss`, `showdown-entry`.
  - Setup: `showdown-setup`, `showdown-genre-chip`, `showdown-size-option`, `showdown-start`, `showdown-pool-warning`.
  - Bracket: `showdown-bracket`, `showdown-progress`, `showdown-match-card`, `showdown-undo`, `showdown-restart`.
  - Winner: `showdown-winner`, `showdown-winner-add-to-cart`, `showdown-winner-wishlist`, `showdown-runner-up`, `showdown-play-again`.
- Mark the selected genre chips and the selected size option with `aria-pressed="true"`, and the others with `aria-pressed="false"`. List the size options in the order 8, 16, 32.
- Fetch the genres and the pool only through `modules/showdown/integration/repository.ts`, which re-exports the generated `packages/dionis-api` hooks.
- Add the reset call of the new persisted prompt store and the bracket store to the global `afterEach` in the web test setup, next to the `useCartStore` reset.
- Catch every API error on the setup and bracket screens. Show a message and keep the layout intact, with no unhandled exception.
- Run the Showdown Playwright specs with `reducedMotion: 'reduce'`. A 32-game bracket has 31 picks, and the full animation would add about 30 seconds to each run. A unit test covers the animation phases instead.

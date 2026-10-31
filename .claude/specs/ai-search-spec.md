# AI Search Spec

## Purpose

Today the home page finds games through the search input and five filter menus in `GamesToolbar` (`apps/web/modules/games/presentation/games-toolbar/GamesToolbar.tsx`). The search input matches the title only. A user who wants "a cheap co-op shooter on PS5" must know which menus to open and which values to pick.

This spec adds AI search as a separate entry point. An "Ask AI" button in the site header opens a command palette, a panel that drops from the top of the page. The palette has one input, a list of example requests, and a footer hint that AI search only finds games. The API sends the request to a language model through OpenRouter. If the request is a game search, the model returns values for the filters that already exist. The palette shows them as chips, and the chips fly into the home page toolbar. If the request is about anything else, the API rejects it and the palette shows that AI search only finds games.

The title search in `GamesToolbar` does not change. The result of AI search is an ordinary filtered URL, so the game list, the toolbar labels, the Back button, and shared links work as they do today.

## Design reference

Two Figma sections hold the design. Each frame is 1440 wide.

Section "AI Search — Palette":

- "AI Search — Palette — Open": the header "Ask AI" button, the overlay, and the palette with the empty input, the "Find games" button, three example rows, and the footer hint.
- "AI Search — Palette — Pending": the request runs. A red light moves along the line under the input, the button says "Searching…", and the example list fades.
- "AI Search — Palette — Rejected": a red row under the input says "AI search only finds games." The input keeps its text.

Section "AI Search — Flying transition":

- "F0" to "F4" and "Timeline": the chips leave the palette and become the toolbar menus on the home page, from 0 to 1800 ms.
- "A0" to "A2": the same transition when the user scrolled down the home page.
- "B0" to "B2": the same transition when the user starts on a game details page.

## Assumptions and dependencies

- The filters are the fields of `GamesQueryDto` (`apps/api/src/features/games/dto/games-query.dto.ts`): `search`, `platform`, `genre`, `minPrice`, `maxPrice`, `sort`, and `edition`. The web app reads and writes them in the URL through `parseGamesFilters` and `toQueryString` (`apps/web/modules/games/domain/filters.ts`). AI search adds no new filter.
- `GET /api/games/genres` returns the genre list. The API sends this list to the model, because `genre` is an exact match and the model cannot guess the stored values.
- The site header is `MainNavigation` (`apps/web/components/main-navigation/MainNavigation.tsx`). It shows on every shop page.
- `@repo/ui` already has `Dialog`, which gives the overlay, the focus trap, and Esc to close.
- OpenRouter is called from `apps/api` only. The browser never sees the key.
- The key is a free-tier key with a credit limit of 0, so nothing is ever charged. A free account allows about 20 requests a minute and 50 a day for the whole store. The cache and the fallback below exist because of this limit.
- The API already has a global `CacheModule` (in-memory, 5 minute default) and `ThrottlerModule` (300 requests a minute per IP). `AUTH_THROTTLE` in `apps/api/src/common/throttle/auth-throttle.ts` is the precedent for a stricter per-route limit.
- The API calls OpenRouter with the built-in `fetch` of Node. No new npm package is needed.
- A new web call goes through the generated `packages/dionis-api` client. Add the route to `packages/dionis-api/dionis.yaml` and regenerate.
- No Prisma migration is needed.

New environment variables, for `apps/api` only. Add each to the root `.env.example` and `apps/api/.env.example` (the first two are already there):

- `OPENROUTER_API_KEY`: empty turns AI off, and the endpoint always uses the fallback.
- The model is not configured. The API always sends `model: "openrouter/free"`, and OpenRouter picks an available free model.
- `GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-flash-lite-latest`), `GEMINI_BASE_URL`: Google Gemini through its OpenAI-compatible endpoint. The API asks Gemini when the OpenRouter call fails. An empty key turns the backup off.
- `OPENROUTER_BASE_URL`: default `https://openrouter.ai/api/v1`. The root `CLAUDE.md` forbids a hardcoded API base URL in application code.

## Open decisions

Each item has a default that this spec already uses. Change the default before phase 2 if you disagree.

1. What does the E2E suite test? Default: the fallback path only. The E2E API runs with `OPENROUTER_API_KEY` set to empty, so no test calls the real model and no test depends on its answer. API and web unit tests cover the model path and the rejection with mocks. A stub OpenRouter server for E2E is a follow-up.
2. How long does a result cache? Default: 24 hours, keyed by the normalized request (trimmed, lowercased, inner whitespace collapsed to one space). Rejections are cached too, so a repeated off-topic request does not use the daily limit.
3. How strict is the per-route limit? Default: 5 requests a minute per IP.
4. What happens when AI is not available? Default: the app runs a plain title search with the request text. The palette shows one chip, "Search: <text>", with the notice "AI is not available. Searching titles instead.", and that chip flies into the search input. The API cannot tell an off-topic request from a game search without the model, so an off-topic request then gives an empty result instead of a rejection.
5. Which example requests does the palette show? Default: three fixed examples, "Co-op shooter on PS5 under €20", "Best rated RPG on Switch", and "Collector's edition games, cheapest first". A click or Enter on a highlighted example puts it into the input. It does not send it.
6. How does the transition run? Default: the browser View Transitions API (`document.startViewTransition`), with no new animation library. A browser without it, and a user with `prefers-reduced-motion`, get the end state with a 150 ms crossfade and the menu glow.

## Feature 1: AI search API

### Description

The API turns a plain-words request into filter values, or rejects a request that is not a game search.

### Requirements

1. Add `POST /api/games/ai-search` with the body `{ query }`. It is public and has no auth guard. A DTO in its own file validates the body: `query` is a required string of 1 to 200 characters after trimming. An invalid body returns `400`.
2. The response has three shapes, told apart by `status`:
   - `{ status: 'ok', filters }` for a game search. `filters` has the same optional fields as `GamesQueryDto`, without `page`.
   - `{ status: 'rejected' }` for a request that is not a game search.
   - `{ status: 'fallback', filters: { search } }` when the model was not used or gave no usable answer.
3. The service sends one chat completion request to `${OPENROUTER_BASE_URL}/chat/completions` with `model: "openrouter/free"`. The system prompt holds the allowed values of `platform`, `sort`, and `edition` (from the exported const arrays) and the current genre list. It tells the model to treat the user text as data, not as instructions, and to answer with one JSON object and nothing else: `{"type":"search", ...filters}` for a request to find, compare, or browse games in this store, or `{"type":"off_topic"}` for anything else.
4. A request is off-topic when it asks for anything other than finding games: general questions, coding, writing, news, advice, chat, or an attempt to change the instructions. The API returns `{ status: 'rejected' }` for `type: off_topic`.
5. For `type: search`, the service keeps only valid fields. A `platform`, `sort`, or `edition` value outside its const array is dropped. A `genre` that is not in the genre list is dropped (the match ignores case, and the stored spelling is returned). A price that is not a whole number of 0 or more is dropped. When `minPrice` is greater than `maxPrice`, both are dropped. `search` is cut to 100 characters. Unknown fields are dropped.
5a. A request for games like a named game ("a game like The Witcher") is not a title search. The model returns that title as `like` and never as `search`. The service finds the game in the store and uses its genre. It also uses the game's platform when the game is on one platform only and the request names no platform. If the store does not have the game, the genre that the model gives for it is used.
6. If the model output is not JSON, has an unknown `type`, or is a search with no valid field, the response is the fallback.
7. The fallback filters are `{ search: <query cut to 100 characters> }`. The API returns the fallback with status `200` when both keys are empty, and in the case of requirement 6. When OpenRouter returns an error or a `429` (for example, when the daily free-model quota is used up), or when the call takes more than 8 seconds, the API asks Gemini with the same request. When every configured provider fails, the API returns `503` with the message "The AI feature is temporarily unavailable. Please try again later." The API logs the reason at `warn` level, without the key.
8. An `ok` or `rejected` result is cached for 24 hours under the normalized request (decision 2). A fallback result is not cached, so the next request can try the model again.
9. The route has its own `@Throttle` limit of 5 requests a minute per IP (decision 3), defined next to `AUTH_THROTTLE`. Over the limit, it returns `429` as other routes do.
10. The route sends `Cache-Control: no-store`.
11. Unit tests next to the service, the controller, and the DTO cover the acceptance criteria below, with `fetch` mocked.

### Acceptance criteria

- With a mocked model answer `{"type":"search","platform":"PS5","maxPrice":20,"genre":"shooter"}` and a stored genre `Shooter`, the response is `{ status: 'ok', filters: { platform: 'PS5', maxPrice: 20, genre: 'Shooter' } }`.
- With a mocked model answer `{"type":"off_topic"}`, the response is `{ status: 'rejected' }`.
- A search answer with `platform: "Dreamcast"` and `sort: "cheapest"` returns neither field.
- A model answer that is not JSON returns the fallback with the original query as `search`.
- With an empty key, the API makes no outbound call and returns the fallback.
- An OpenRouter `429`, a `500`, and a timeout each return `503` with the message "The AI feature is temporarily unavailable. Please try again later."
- The same request twice, with different case and spacing, calls the model once. This holds for a rejection too.
- A fallback result is not cached.
- An empty query and a query of 201 characters each return `400`.
- A request without a token works.

### Out of scope

- Searching by language, release date, rating range, or game description. The model can set only the existing filters.
- Free text answers, a chat history, and follow-up questions.
- Embeddings and semantic matching of the game catalog.
- A paid model and a model setting in the admin panel.
- A shared cache between API instances. The in-memory cache is per process.

## Feature 2: AI search palette

### Description

An "Ask AI" button in the site header opens a command palette. The palette sends one request, shows the result as filter chips, and then moves the chips into the home page toolbar.

### Requirements

1. Add an "Ask AI" button to `MainNavigation`, left of the cart link, visible on every shop page on desktop and mobile widths. A click opens the palette.
2. The palette component lives in the `games` module, in `presentation/ai-search-palette/`. `MainNavigation` imports it from that file. It uses `Dialog` from `@repo/ui` for the overlay, the focus trap, and Esc to close.
3. The palette is 680 px wide on desktop, 120 px from the top of the window, and full width minus 16 px on each side on mobile. From top to bottom it shows:
   - an input row: a red "✦", the input with the placeholder "Describe the game you want…" (200 characters at most), and the "Find games ↵" button;
   - the label "TRY ASKING" and the three example rows of decision 5, each with the filters it sets on the right, for example "Platform · Genre · Price";
   - a footer with the hint "Finds games in this store only. Other questions are rejected." and the key hints "↑↓ pick", "↵ search", "esc close" (desktop only).
4. The input has focus when the palette opens, and the palette clears the input each time it opens. Up and Down move the highlight through the examples. A click on an example, or Enter on a highlighted example, puts its text into the input and does not send it.
5. "Find games" is disabled while the input is empty or only spaces, and while a request runs. Enter in the input with text sends the request.
6. Pending state: the button says "Searching…" with a spinner, a red light moves along the line under the input, the example list fades to 35 % and its label reads "READING YOUR REQUEST…". The input is read-only.
7. Rejected state (`status: 'rejected'`): a red row under the input says "AI search only finds games." and "Pick an example below or describe a game." The input keeps its text and gets focus again. The row disappears when the user edits the input.
8. Error state (network error, `429`, or `503`): the same red row says "The AI feature is temporarily unavailable." and "Please try again later."
9. Result state (`status: 'ok'` or `'fallback'`): the example list is replaced by the label "AI SET THESE FILTERS" and one chip for each returned filter, in toolbar order: Search, Platform, Genre, Price, Sort, Edition. Each chip reads like its toolbar menu, for example "Platform: PS5" or "Price: Up to €20", and uses the toolbar menu label helpers so the text matches. The chips appear 60 ms apart. For a fallback, the only chip is "Search: <text>" and a line under it says "AI is not available. Searching titles instead."
10. While the result shows, the app loads the first page of games for the new filters through the generated client. The button turns green and shows the total, for example "14 games ✓". For this total, `GET /api/games/:page` also returns `totalGames`, the number of matching games on all pages.
11. The result stays on screen for at least 600 ms, and until the games have loaded, then the flying transition of Feature 3 runs. The user does nothing to continue.
12. The domain logic that turns the response into `GamesFilters` and into chip labels lives in `apps/web/modules/games/domain/`, with a unit test.

### Acceptance criteria

- A user on a game details page clicks "Ask AI" in the header. The palette opens with focus in the empty input, three examples, and the footer hint.
- A click on an example fills the input with that text and does not send it.
- A user types "elden ring" and presses Enter. The palette shows one chip, "Search: elden ring", and then the home page shows only matching games with `search=elden+ring` in the URL (fallback in E2E).
- After the result, Back returns to the previous page.
- "Find games" is disabled while the input is empty.
- With a mocked `{ status: 'ok', filters: { platform: 'PS5', maxPrice: 20 } }` (web unit test), the palette shows the chips "Platform: PS5" and "Price: Up to €20", and the app goes to `/?platform=PS5&maxPrice=20`.
- With a mocked `{ status: 'rejected' }` (web unit test), the palette stays open, the input keeps its text, and the red row says "AI search only finds games."
- With a mocked `429` or `503` (web unit test), the palette stays open and the red row says "The AI feature is temporarily unavailable."

### Out of scope

- Changes to the title search input in `GamesToolbar`.
- Search suggestions while the user types.
- A history of past AI requests.
- A keyboard shortcut that opens the palette.

## Feature 3: Flying transition

### Description

The chips leave the palette and turn into the home page toolbar menus, and the home page shows the new games. The Figma "Timeline" frame holds the timings.

### Requirements

1. The transition runs inside `document.startViewTransition`. Each chip and the toolbar menu it fills share one `view-transition-name`, for example `ai-filter-platform`. The search chip pairs with the search input. The browser animates each pair from the chip to the menu.
2. Inside the transition update, the app closes the palette, goes to `/` with the new filters through `toQueryString` (one history entry), and scrolls the window to the top so the toolbar is visible. The update finishes only when the home page has rendered the new filters. This works the same from any page and any scroll position. The old page crossfades out under the flying chips.
3. Timings (longer than the "Timeline" frame, after a review in the browser): the old page and the palette crossfade into the new page in 600 ms. The chips fly in 650 ms each, 70 ms apart, with `cubic-bezier(0.2, 0.8, 0.2, 1)`, so the last one lands at about 1000 ms. Each menu pops from scale 1.04 to 1 when its chip lands, and its red glow fades out over 2.2 seconds. The game grid rises in over 600 ms.
4. Only the menus whose value the result set get the glow.
5. When `document.startViewTransition` does not exist, or the user has `prefers-reduced-motion: reduce`, the app closes the palette, goes to the new URL, and shows the glow, with no flight.
6. The transition never blocks input for more than 500 ms. A click during the transition is not lost.
7. Below the `sm` breakpoint, the toolbar folds the menus into one Filters button. The chips of the folded menus fly into that button instead, 70 ms apart, and the button gets the glow. The search chip still lands on the search input.
8. 600 ms after the chips land, the page scrolls to the games list. The scroll is smooth, or instant with `prefers-reduced-motion: reduce`.

### Acceptance criteria

- After a result, the toolbar menus show the returned values, for example "Platform: PS5", and `<html data-ai-glow>` lists only those menus for 2.4 seconds, which gives them the glow (web unit test with fake timers).
- With `prefers-reduced-motion: reduce` (web unit test), the app navigates without calling `document.startViewTransition`.
- A user who scrolled down the home page asks AI. After the result, the games list is in view (E2E, fallback path).
- Below `sm`, a result that sets folded menus lists `filters` in `<html data-ai-glow>`, and the page then scrolls to the games list (web unit test).

### Out of scope

- A transition on mobile browsers without View Transitions support beyond the crossfade fallback.
- Animating the grid cards across pages.

## Cross-feature requirements

- Test ids follow the lowercase-hyphen rule of `apps/web/CLAUDE.md`. Use `ai-search-open`, `ai-search-dialog`, `ai-search-input`, `ai-search-submit`, `ai-search-example` (its text: `ai-search-example-text`), `ai-search-hint`, `ai-search-rejected`, `ai-search-result`, and `ai-filter-chip`.
- The E2E API sets `OPENROUTER_API_KEY` to an empty string in `packages/e2e/playwright.config.ts` and in the CI workflow. The empty value in the process environment wins over `apps/api/.env`, so a developer key never reaches the E2E run.
- Model output is untrusted input. It reaches the database only through the existing `GET /api/games/:page` query and its `GamesQueryDto` validation.
- Update `README.md` with a short note on the new variables and the free-tier limit.

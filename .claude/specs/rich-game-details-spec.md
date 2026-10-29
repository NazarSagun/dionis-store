# Rich Game Details Spec

## Purpose

Feature 4.1 of `.claude/specs/roadmap-spec.md` gives each game a gallery, a trailer, and a long description. Today the game detail page (`apps/web/modules/games/presentation/game-details/GameDetails.tsx`) shows one image (`thumbnail`), one sentence (`short_description`), and five facts. The seed reads 332 games from `apps/api/src/db-seed/games/games.json`. Each game has one thumbnail that the browser loads from `www.freetogame.com`, and nothing else.

This spec replaces the 332 games with 50 curated games that cover several genres and platforms. A one-time import script takes their content from IGDB (the Twitch game database API) and copies the images into our own S3 bucket. The game detail page then shows an image gallery, a YouTube trailer, and a description in several sections.

## Design reference

The design lives in the Figma file "Dionis Store — Retro Redesign". This feature updates existing frames. It adds none.

- Section "Game Details": "Game Details", "Game Details — Tablet", and "Game Details — Mobile" show the format picker, the gallery with the trailer as its first item, and the About, Story, and Features sections.
- Section "Admin": "Admin — Edit game" and its tablet and mobile frames show the trailer field, the read-only image strip, and the section text areas.

Design decisions that differ from the current code:

- The "Game URL" and "FreeToGame profile URL" fields are gone from the admin form, because the `drop_game_urls` migration removed those columns.
- The title column on desktop now sits 48px from the gallery. Today the image and the column touch.
- The purchase area follows the "format-picker" of the old Physical Editions design. The heart button sits next to the price, a "Choose a format" label sits above the options, and each option shows its name and its price on two lines, with 15px semibold text. The options sit in equal columns at least 230px wide, so every label fits on one line. A sold-out edition is a top-aligned tile with "Notify me".
- Section "Home": the `GameCard` component and the "All Games" grid show bigger cards. The grid has 4 columns from 1536px, 3 from 1024px, 2 from 640px, and 1 below. A card has a 16:9 image, an 18px title, short platform labels (PC, PS5, Xbox, Switch), and an 18px price at the bottom, so every card in a row has the same height.

## Assumptions and dependencies

- IGDB needs a Twitch developer application. Its client ID and secret are used only on a developer machine, by the import script. CI, the E2E suite, and production never call IGDB.
- IGDB is free only for non-commercial use. The store uses Stripe test mode today, so this holds. A store that takes real money needs an IGDB commercial agreement or another source.
- The game art belongs to the publishers. The store shows it as promotional art for the game on sale.
- The import script writes the curated content into a file in the repo. The seed reads that file, as it reads `games.json` today. So the seed stays offline and the same for CI, E2E, and production.
- The browser loads the images from CloudFront, not from IGDB. A CloudFront distribution in front of a private S3 bucket keeps the images available if IGDB changes its URLs.
- `GET /api/game/:gameId` stays public and cached under `gameDetailKey`. The new fields are the same for every user, so the cache rule does not change.
- A new web call goes through the generated `packages/dionis-api` client. Add the new fields to `packages/dionis-api/dionis.yaml` and regenerate.
- The web changes stay inside the existing `games` and `admin` modules and follow `.claude/rules/frontennd-architecture.md`.
- Several E2E specs depend on the seed. `games-toolbar.spec.ts` needs a second catalog page and a `Shooter` game priced at 20 or less. `insertGameEditions.ts` puts physical editions on the first 30 games by id. `account-pagination.spec.ts` buys six games from the home page. The curated set must keep these true.

## Open decisions

Each item has a default that this spec already uses. Change the default before phase 2 if you disagree.

1. Which 50 games? Default: 50 games picked in IGDB, not only from the current `games.json`, each with at least four images and one trailer. They get new ids from 1 to 50. The set follows the catalog mix rule in Feature 1, so every genre and platform filter has games to show.
2. Which sections does a game have? Default: `About` from the IGDB `summary`, `Story` from the IGDB `storyline`, and `Features` from the IGDB game modes, themes, and player perspectives as a list. A section with no source text is left out. System requirements are out of scope, because IGDB does not have them.
3. What format is a section body? Default: plain text. A blank line starts a new paragraph, and a line that starts with `- ` is a list item. The web app renders this without a Markdown library and without raw HTML.
4. Can an admin change the images? Default: no. The admin can edit the trailer ID and the section text. The import script owns the images. Image upload from the admin panel is a later feature.
5. What happens to the old games in production? Decided: a one-off script removes every old game, including games that users bought. Every order goes with them, because an order item cannot point to a deleted game. Users and promo codes stay. Production runs Stripe in test mode, so no real purchase is lost.
6. Where does the trailer show, and does it load with the page? Decided: the trailer is the first item of the gallery. The large slot shows the YouTube poster image and a play button. A click replaces it with the `youtube-nocookie.com` player. So a visit sends nothing to YouTube until the user asks for the trailer.

## Feature 1: IGDB import script and media bucket

### Description

A developer runs one script on their own machine. It reads the curated game list, gets the content from IGDB, uploads the images to S3, and writes the seed file.

### Requirements

1. Create the S3 bucket `dionis-store-media-060622564359` in `eu-north-1`. It blocks all public access. A CloudFront distribution reads it through origin access control. The bucket has no expiry rule.
2. Add `apps/api/src/db-seed/games/curated-games.json`. It lists the 50 curated games with the store id, the IGDB game id, the store genre, the price, and the discount. A developer edits this file to change the set. IGDB has no prices, so the file sets them.
3. Add the script `apps/api/src/db-seed/import-igdb.ts` and the package script `import:igdb`. It is a plain script, like the other seed scripts.
4. For each game, the script reads the IGDB `summary`, `storyline`, `game_modes`, `themes`, `player_perspectives`, `screenshots`, `artworks`, and `videos`.
5. The script takes up to seven images per game: artworks first, then screenshots. It skips an image whose width is less than 1.3 or more than 2 times its height, because a wide banner or a tall poster crops to almost nothing in a 16:9 frame. The first image is the card thumbnail. The trailer takes the eighth slot of the gallery. It downloads each one at the IGDB `t_1080p` size and uploads it to `games/<gameId>/<igdbImageId>.jpg`, so a changed image never reuses an old file. It skips an upload when the object already exists, so a second run is cheap.
6. The trailer is the first IGDB video whose name contains `Trailer`, else the first video. The script stores only its YouTube ID.
7. The script also reads the cover, the PEGI and ESRB age ratings, the languages, and the critic and user scores with their counts. It downloads the cover at the IGDB `t_cover_big_2x` size, next to the gallery images. It keeps only the PEGI and ESRB labels, such as `PEGI 12` and `ESRB T`. It turns the language list into one row per language, with a flag each for interface, audio, and subtitles. It rounds both scores to whole numbers from 0 to 100.
8. The script writes `apps/api/src/db-seed/games/games.json` in the new shape. `thumbnail` is the URL of the first landscape image, because the game card expects a wide image. Each image has an `alt` text such as `<title> screenshot 3`.
9. The script reads `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `MEDIA_BUCKET`, and `MEDIA_BASE_URL`. It uses the default AWS credentials of the developer machine. It stops with a clear message when a variable is missing.
10. The script maps the IGDB platforms to the store names `PC (Windows)`, `PS5`, `Xbox Series X`, and `Nintendo Switch`, and joins them with `, `. It ignores other platforms. `rating` is the IGDB `total_rating` divided by 20, with two decimals, as the current seed strings are.
11. The script checks the catalog mix rule before it writes anything:
    - Each platform filter (`PC`, `PS5`, `Xbox`, `Switch`) matches at least 8 games.
    - At least 8 genres have 3 or more games each. No genre has more than 10 games.
    - At least two `Shooter` games cost 20 or less, because `games-toolbar.spec.ts` filters on that.
    - Prices spread from 10 or less to 70, and at least 10 games have a discount above zero. No game costs 0, because Stripe cannot take a payment of 0.
    - The games come from at least 20 publishers, and the release years cover at least 15 different years.
12. The script fails and writes nothing when a curated game has fewer than four images, no trailer, or no store platform, or when the mix rule fails. It names the game or the broken rule in the error.

### Acceptance criteria

- A developer runs `pnpm --filter api import:igdb` with the variables set. `games.json` holds 50 games, and each game has at least four images, a trailer ID, and an `About` section.
- Each image URL in `games.json` starts with `MEDIA_BASE_URL` and returns `200` from CloudFront.
- The developer runs the script again. It uploads nothing new, and `games.json` does not change.
- The bucket refuses a direct `GET` that does not go through CloudFront.
- A developer removes enough `PS5` games from `curated-games.json` that fewer than 8 remain. The script stops, names the `PS5` rule, and leaves `games.json` unchanged.

### Out of scope

- A scheduled sync with IGDB. The script runs by hand when the curated list changes.
- Image resizing. `next/image` makes the sizes the page needs.

## Feature 2: Game content model and API

### Description

The database stores the images, the trailer ID, and the sections of a game. The game detail route returns them.

### Requirements

1. Add the Prisma model `GameImage { id, gameId, url, alt, position }` with `@@unique([gameId, position])`.
2. Add the Prisma model `GameSection { id, gameId, kind, title, body, position }` with `@@unique([gameId, kind])`. `kind` is one of `about`, `story`, and `features`. Export the list as a const array and validate it with `@IsIn`.
3. Add `trailerYoutubeId String?` to `Game_pc`. Validate it as 11 characters of `A-Z`, `a-z`, `0-9`, `-`, and `_`.
4. Add `coverUrl String?`, `ageRatings String[]`, `criticRating Int?`, `criticRatingCount Int?`, `userRating Int?`, and `userRatingCount Int?` to `Game_pc`. An age rating matches `PEGI <rating>` or `ESRB <rating>`. A score is from 0 to 100.
5. Add the Prisma model `GameLanguage { id, gameId, language, audio, subtitles, interface }` with `@@unique([gameId, language])`.
6. The new models use `onDelete: Cascade` on the game relation. Add the back-relations on `Game_pc`. Add one Prisma migration for all these changes.
7. `GET /api/game/:gameId` returns `images` and `sections` ordered by `position`, `languages` ordered by name, and every new field on `Game_pc`. The game list routes do not return them, so the catalog page stays small.
8. `POST /api/games` accepts `images`, `sections`, `languages`, and every new field on `Game_pc`, so the seed can create a full game in one call. Each is optional.
9. `PATCH /api/games/:id` accepts the same fields. An `images`, `sections`, or `languages` array replaces the old rows. The admin form sends only `sections` and `trailerYoutubeId`. A `sections` value replaces all sections of the game in one transaction. Send `trailerYoutubeId: null` to remove the trailer.
10. Every change clears the game cache through `clearCache()`, as the other game routes do.
11. A unit test next to each changed service, controller, and DTO covers the cases in the acceptance criteria below.

### Acceptance criteria

- `GET /api/game/:gameId` for a curated game returns at least four `images` in `position` order, a `trailerYoutubeId`, and an `about` section.
- An admin sends `PATCH /api/games/:id` with two sections. The next `GET /api/game/:gameId` returns exactly those two sections, not a cached copy.
- An admin sends `trailerYoutubeId: null`. The next `GET` has no trailer.
- A `trailerYoutubeId` of the wrong length, or a section `kind` that is not in the list, returns `400`.
- `GET /api/games/1` returns no `images` or `sections` field.
- Deleting a game removes its images and sections.

### Out of scope

- Images for an edition. An edition keeps its name and description only.

## Feature 3: Seed and production catalog

### Description

The seed creates the curated games with their full content. A one-off script empties the production catalog, so the seed can run there again.

### Requirements

1. `populate-via-api.ts` reads the new `games.json` and sends `images`, `sections`, and `trailerYoutubeId` with each `POST /api/games`. It still skips a game that exists.
2. `insertGameEditions.ts` keeps putting physical editions on the first 30 games by id.
3. Add the one-off script `apps/api/src/db-seed/reset-catalog.ts` and the package script `reset:catalog`. It runs in one transaction and deletes every order with its items, every game edition, every stock alert, and every game. Reviews, replies, wishlist entries, and notifications go through their existing cascades. It sets `uses` to `0` on every promo code, because the redemptions go with the orders. Users and promo codes stay.
4. The script refuses to run unless `RESET_CATALOG_CONFIRM` equals the database name, so nobody runs it by accident.
5. After the script, the operator restarts the `api` container to drop the cached game data, then runs `seed:api` as the deploy guide describes.
6. Update `.local/aws-deploy-guide.md` with the order of the one-time steps: backup, deploy with the migration, `reset:catalog`, restart `api`, `seed:api`. Add `RESET_CATALOG_CONFIRM` to `.env.example` with an empty value.

### Acceptance criteria

- A fresh database is seeded. The catalog has 50 games on three pages, and every game detail page has a gallery.
- Each platform filter on the home page shows at least 8 games.
- `GET /api/games/1?genre=Shooter&maxPrice=20` returns at least one game.
- `reset:catalog` runs against a database that holds the old 332 games, orders, reviews, and a promo code with uses. Afterwards no game, order, edition, or review exists, the users still exist, and the promo code has `uses` `0`. `seed:api` then creates the 50 curated games.
- `reset:catalog` without `RESET_CATALOG_CONFIRM`, or with the wrong value, changes nothing.

### Out of scope

- Keeping old orders, reviews, or wishlist entries. They go with the old games.

## Feature 4: Game detail page

### Description

The game detail page shows a gallery in place of the single image, with the trailer as its first item, and the description sections.

### Requirements

1. The gallery replaces the image at the top left of `GameDetails`, with a 48px gap to the title column on desktop. It shows one large slot, a counter such as `1 / 8`, and a strip of small items below it in rows of four. A click on a small item shows it in the large slot. Previous and next buttons move one item at a time and wrap around.
2. When the game has a trailer, it is the first item, and the page opens on it. Its small item shows the poster with a play badge. In the large slot it shows the poster from `https://i.ytimg.com/vi/<id>/hqdefault.jpg`, a "Play trailer" button, and the note `Plays from youtube-nocookie.com`.
3. A click on "Play trailer" replaces the poster with an `iframe` to `https://www.youtube-nocookie.com/embed/<id>?autoplay=1`, with a `title` of `<game title> trailer`. Moving to another item removes the `iframe`, so the video stops.
4. An image item uses `next/image` with the image `alt`. Only the large slot loads at full size. A game with no trailer starts on its first image. A game with no images and no trailer shows `thumbnail`, as today, and no strip.
5. The sections sit between the purchase area and the facts panel, in `position` order, each with its title as a heading. A blank line in the body starts a paragraph, and lines that start with `- ` form a list. The body renders as text, never as HTML.
6. `short_description` stays under the title. The cover shows at 72 by 96 pixels to the left of the title, and the age ratings show as small labels under the title.
7. A "Languages" table sits under the sections. It has one row per language, with a column each for interface, audio, and subtitles. A game with no languages shows no table.
8. A "Scores from IGDB" card sits right above the "Because you viewed" strip, with the critic score and the IGDB player score, each out of 100 with its count. A missing score is left out, and a game with neither shows no card.
9. Add the image host of `MEDIA_BASE_URL` and `i.ytimg.com` to `remotePatterns` in `apps/web/next.config.js`. Remove `www.freetogame.com` when no game uses it.
10. Update the `Content-Security-Policy-Report-Only` header in `Caddyfile`. Add the media host and `https://i.ytimg.com` to `img-src`, and `https://www.youtube-nocookie.com` to `frame-src`. Remove `https://www.freetogame.com`.
11. Update the loading skeleton to the new layout.
12. Add a component test for the gallery, the scores, the languages table, the trailer, and the section body parser.

### Acceptance criteria

- A user opens a curated game. The large slot shows the trailer poster and the play button, and the strip shows the trailer and every image.
- The user clicks the third small item. The large slot shows that image.
- The user clicks next on the last item. The large slot shows the trailer again.
- The user opens the page. No request goes to `youtube-nocookie.com` until the user clicks play.
- The user clicks play. The trailer `iframe` shows in the large slot, with the game's YouTube ID in its `src`.
- The user clicks next while the trailer plays. The `iframe` is gone, and the large slot shows the first image.
- The user sees the `About`, `Story`, and `Features` sections that the game has, in order, and the `Features` items as a list.
- A section body that contains `<b>hi</b>` shows that text, not bold text.
- The user sees the cover, the PEGI and ESRB labels, the critic and player scores, and one table row per language.

### Out of scope

- A full-screen image viewer.
- Swipe gestures on touch screens. The buttons and the strip work on touch.

## Feature 5: Admin content editing

### Description

The admin game form edits the trailer ID and the sections of a game.

### Requirements

1. The game form in `apps/web/modules/admin/presentation/game-form` gets a `Trailer YouTube ID` field and one text area per section kind.
2. An empty section text area removes that section on save. An empty trailer field removes the trailer.
3. The form shows the images of the game as a read-only strip, so the admin sees what the page shows.
4. The form validates the trailer ID with the same rule as the API before it sends the request.

### Acceptance criteria

- An admin opens the edit form of a game, changes the `About` text, and saves. The game detail page shows the new text.
- The admin clears the trailer field and saves. The game detail page shows no trailer block.

### Out of scope

- Uploading, removing, or reordering images.
- A Markdown preview.

## Cross-feature requirements

- `data-testid` names: `game-gallery`, `gallery-main-image`, `gallery-thumb`, `gallery-prev`, `gallery-next`, `gallery-counter`, `trailer-play`, `trailer-frame`, `game-section`, `game-section-title`, `game-section-body`, `admin-trailer-input`, `admin-section-input`, `admin-image-strip`, `game-cover`, `age-rating`, `external-scores`, `critic-score`, `user-score`, `game-languages`, and `language-row`. Each `game-section` has a `data-kind` attribute with its kind, and each `gallery-thumb` has a `data-kind` of `video` or `image`.
- New environment variables go into `.env.example` in the same commit: `MEDIA_BASE_URL` for the web build and the import script, `MEDIA_BUCKET`, `TWITCH_CLIENT_ID`, and `TWITCH_CLIENT_SECRET` for the import script only. Leave the two Twitch values empty in `.env.example`.
- `MEDIA_BASE_URL` is read at build time by `next.config.js`, so the web image needs it as a build argument in `docker-compose.prod.yml`. Caddy reads it through an environment placeholder in `Caddyfile`, so no host is hardcoded.
- The E2E suite does not wait for images. A test that opens a game page uses `waitUntil: 'domcontentloaded'`, as `account-pagination.spec.ts` does.
- An image that fails to load shows the image `alt`. It does not break the gallery.
- Before you mark this done, run `pnpm lint`, `pnpm build`, `pnpm test --filter web`, `pnpm test --filter api`, and the affected Playwright specs, including `games-toolbar.spec.ts`, `physical-editions.spec.ts`, and `account-pagination.spec.ts`.

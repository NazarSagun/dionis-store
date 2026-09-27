# Admin Panel Spec

## Purpose

Today the catalog changes only through the seed script (`apps/api/src/db-seed/populate-via-api.ts`) and `POST /api/games`, which no page calls. An admin cannot fix a price, change a discount, restock an edition, or remove a game without editing the database by hand. Orders are visible only to the customer who placed them.

This spec adds an admin area at `/admin` with three parts: a games list with create, edit, and delete, edition management on a game's edit page, and a read-only list of every order. It is roadmap-spec.md Feature 2.1. Restock alerts (2.4), shipping status (2.5), and refunds (3.3) build on it later.

## Design reference

Figma section "Admin Panel (proposal)" (draft, pending review), in the same file and on the same "Flat Precision" page as the Home, Cart, and Account frames:
https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=233-195

Four frames, built from the file's own `NavBar`, `Tab/Active`, `Button/Primary`, `Button/Secondary`, and `Input/Default` components and its `semantic/*` color variables:

- "Admin — Games" (Feature 2): [node 233-196](https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=233-196). Header with the "ADMIN" eyebrow and "New game", the Games and Orders tabs, the title search, the table with the first row in its hover state, and pagination.
- "Admin — Edit game" (Features 3, 4, 5): [node 233-217](https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=233-217). The two-column form. It shows two states at once: a field error on Discount with the form error summary above Save, and the "cannot be deleted" message above the form. "Delete game" is an outlined red button, apart from Save. Below the form are the Editions list, with an "Out of stock" badge, and the add-edition form open.
- "Admin — Orders" (Feature 6): [node 233-236](https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=233-236). The email search, the table with the first order expanded to its items and shipping address, and pagination.
- "Admin — Delete game dialog" (Feature 4): [node 239-286](https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=239-286). The Edit game frame behind a scrim, with the confirmation `Dialog`: "Cancel", and "Delete game" as a filled red button.

The account menu's "Admin" item (Feature 1) reuses the existing dropdown item style, so it has no frame of its own.

## Assumptions and dependencies

**Roles.** Only the `Admin` role (`500`) can use the admin area. `Editor` (`233`) stays unused in this pass. `RolesGuard` and `@RequireRole(Roles.Admin)` already exist and need no change. The API guard is the only real check. The web app hides admin pages from other users as a convenience.

**Role in the web app.** `POST /login`, `POST /register`, and `GET /refresh` already return `user.role`, but `useAuthStore` keeps only the token and the name. The store gains a `role` field, persisted with `partialize` like `accessToken`, and the auth facade gains `useIsAdmin`.

**Game ids.** `Game_pc.id` has no default, because the ids came from the FreeToGame import. A migration adds `@default(autoincrement())`. It creates a sequence and moves it past the highest existing id, so existing ids stay the same and new games get the next number. `CreateGameDto.id` becomes optional, so the seed script can keep sending FreeToGame ids.

**Deleting.** A game or edition that any `OrderItem` references cannot be deleted. The API returns `409` and names the number of orders. Deleting a game with no orders also deletes its editions and its wishlist rows, in one transaction. `WishlistItem` already cascades.

**No new DB table.** The only migration is the `Game_pc.id` default above.

**UI building blocks.** `@repo/ui` has `Button`, `Dialog`, `DropdownMenu`, `Input`, `Label`, `Pagination`, `Skeleton`, and `Toast`. It has no table, select, or textarea component. Use native `<table>`, `<select>`, and `<textarea>` elements styled with the design tokens from `apps/web/CLAUDE.md`. Do not add a raw hex value. A confirmation uses `Dialog`, never `window.confirm`.

**Admin user for E2E.** CI already creates an admin through `pnpm seed:api` (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`). The E2E suite gains `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`, with the same defaults as the seed values, in `packages/e2e/.env.example`, the root `.env.example`, and the workflow.

**Out of scope for this pass**

- The `Editor` role, and changing any user's role.
- Image upload. An admin enters a thumbnail URL, as the seed does.
- Bulk edits, CSV import, and an audit log.
- A tool to merge duplicate genre values. Editing a game's genre covers single fixes.
- Any order action: shipping status (2.5) and refunds (3.3) come later.

## Feature 1: Admin access

### Description

An admin sees an "Admin" item in the account menu and can open `/admin`. Nobody else can reach the admin pages or the admin API routes.

### Requirements

1. `useAuthStore` stores `role` from the login, register, and refresh responses, and clears it on logout.
2. The account menu shows an "Admin" item that links to `/admin/games`, only when `useIsAdmin` is true.
3. `/admin` redirects to `/admin/games`. Every page under `/admin` shares a layout with a small navigation: "Games" and "Orders".
4. A guest who opens any `/admin` page is redirected to `/login`. A signed-in user who is not an admin is redirected to `/`.
5. Every admin API route uses `JwtAuthGuard` and `RolesGuard` with `@RequireRole(Roles.Admin)`. A non-admin gets `403`, and a request without a token gets `401`.

### Acceptance criteria

- An admin logs in and opens the account menu. The menu shows "Admin". Clicking it opens `/admin/games`.
- A regular user logs in and opens the account menu. The menu shows no "Admin" item.
- A regular user opens `/admin/games` directly and lands on `/`.
- A guest opens `/admin/orders` directly and lands on `/login`.
- A regular user's token sent to `GET /api/admin/orders` gets `403`.

### Out of scope

- A dedicated admin login page. Admins use the normal login.

## Feature 2: Games list

### Description

`/admin/games` lists every game in a table, with search, pagination, and a button to create a game.

### Requirements

1. The table shows, per game: id, title, platform, genre, list price, discount, and the number of editions.
2. It pages through `GET /api/games/:page`, 20 games per page, the same route the storefront uses, and includes a title search box.
3. Clicking a row opens `/admin/games/:id`.
4. A "New game" button opens `/admin/games/new`.
5. `GET /api/games/:page` gains an `editionCount` on each game, so the table can show it without a request per row.

### Acceptance criteria

- An admin opens `/admin/games`. The first row shows the game with the lowest id, and 20 rows show.
- The admin types part of a title into the search box. Only games whose title contains it remain.
- The admin clicks a row. The URL becomes `/admin/games/<that game's id>`.

### Out of scope

- Sorting by column, and filters other than title.

## Feature 3: Create and edit a game

### Description

One form, used both to create a game and to edit one.

### Requirements

1. The fields are: title, thumbnail URL, short description, genre, platform, publisher, developer, release date, list price, rating, and discount. Every field is required, as it is in `CreateGameDto`.
2. Each field has a visible `<label>`, so a field can be found by its label.
3. Price is a whole number of euros, 0 or more. Discount is a whole number from 0 to 100. Rating is text, such as `4.42`, as it is stored today.
4. The API validates every field. The form shows the API's message for an invalid field or a duplicate title (`409`) above the Save button, and stays open.
5. Creating calls `POST /api/games` without an id. The database assigns the id. After saving, the admin lands on the new game's edit page, and a toast says "Game created".
6. Editing calls a new `PATCH /api/games/:id`, which accepts any subset of the fields. After saving, a toast says "Game saved", and the storefront shows the new values.

### Acceptance criteria

- An admin opens "New game", fills every field, and saves. The URL becomes `/admin/games/<new id>`, and the new id is higher than every seeded id.
- An admin creates a game with a title that already exists. The form shows "A game with this id or title already exists" and does not navigate.
- An admin changes a game's discount from its current value to 40 and saves. That game's page on the storefront shows `-40%`.
- An admin sets the discount to 150. The form shows an error for the discount and does not save.

### Out of scope

- Editing the id of an existing game.

## Feature 4: Delete a game

### Description

An admin can delete a game that nobody has bought.

### Requirements

1. The edit page has a "Delete game" button. It opens a `Dialog` that names the game and asks for confirmation.
2. Confirming calls a new `DELETE /api/games/:id`.
3. If any `OrderItem` references the game, the API returns `409` with the message "This game is in N orders and cannot be deleted." It says "1 order" for a count of one. The dialog closes, and the message shows on the page.
4. Otherwise, the API deletes the game, its editions, and its wishlist rows in one transaction. The admin lands on `/admin/games`, and a toast says "Game deleted".

### Acceptance criteria

- An admin creates a game, then deletes it. The admin lands on `/admin/games`, and searching for that title finds nothing.
- An admin tries to delete a game that a test order bought. The page shows "This game is in 1 order and cannot be deleted.", and the game still exists.
- An admin opens the delete dialog and cancels. Nothing is deleted.

### Out of scope

- Archiving or hiding a game from the storefront.

## Feature 5: Editions

### Description

A game's edit page lists its physical editions and lets an admin add, edit, and delete them.

### Requirements

1. Below the game form, an "Editions" section lists each edition: name, price, discount, stock, and description.
2. "Add edition" and each row's "Edit" open the same edition form: name, price, discount, stock, and description, with the same number rules as Feature 3 and stock as a whole number of 0 or more.
3. New routes: `POST /api/games/:id/editions`, `PATCH /api/editions/:id`, and `DELETE /api/editions/:id`, all Admin-only.
4. Deleting an edition asks for confirmation, and it is blocked with `409` if any `OrderItem` references it, using the same message pattern as Feature 4.
5. After a change, the list shows the new values, and the storefront's game page shows them too.

### Acceptance criteria

- An admin adds an edition "Deluxe Edition" with stock 3 to a game. The list shows it, and the game's storefront page shows a "Deluxe Edition" button.
- An admin changes that edition's stock to 0. The storefront shows it as out of stock.
- An admin deletes an edition that nobody bought. It disappears from the list.

### Out of scope

- Reordering editions.

## Feature 6: Orders

### Description

`/admin/orders` lists every customer's orders, read-only.

### Requirements

1. A new `GET /api/admin/orders?page=&pageSize=&email=` returns `{ items, total, page, pageSize }`, newest first, with 20 per page by default and 50 at most. `email` is a case-insensitive "contains" match on the customer's email.
2. The table shows, per order: id, date, customer email, item count, and total.
3. Expanding a row shows each item (game title, edition name or "Digital", quantity, price, and activated or not) and, for a physical order, the shipping address.
4. A search box filters by customer email, and pagination moves between pages.

### Acceptance criteria

- A test customer places an order. An admin opens `/admin/orders`, and the first row is that order, with that customer's email and the right total.
- The admin searches for that customer's email. Only that customer's orders remain.
- The admin expands the row and sees the game title and "Digital".

### Out of scope

- Changing an order in any way.

## Cross-feature requirements

- Every admin page lives under `apps/web/app/admin`, with its UI in a new `modules/admin` module that follows `.claude/rules/frontennd-architecture.md`. API calls go through `modules/admin/integration/repository.ts` and the generated client.
- API work stays in the existing features: game and edition routes in `features/games`, and the orders route in `features/orders`. Each route has a DTO class and a unit test.
- Every write shows a success toast. Every failure shows the API's message and keeps the form's values.
- Test ids. Per `apps/web/CLAUDE.md`, a test id is a fixed string, never built from a variable:
  - Layout: `admin-nav`, `admin-nav-games`, `admin-nav-orders`, `account-menu-admin`.
  - Games list: `admin-games-table`, `admin-game-row`, `admin-games-search`, `admin-game-new`.
  - Game form: `admin-game-form`, `admin-game-save`, `admin-form-error`, `admin-game-delete`, `admin-confirm-dialog`, `admin-confirm-button`, `admin-cancel-button`. The E2E tests find fields by their labels.
  - Editions: `admin-editions`, `admin-edition-row`, `admin-edition-add`, `admin-edition-edit`, `admin-edition-form`, `admin-edition-save`, `admin-edition-delete`.
  - Orders: `admin-orders-table`, `admin-order-row`, `admin-order-toggle`, `admin-order-items`, `admin-orders-search`.

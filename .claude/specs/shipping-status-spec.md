# Shipping Status Spec

## Purpose

Feature 2.5 of `.claude/specs/roadmap-spec.md` adds a shipping status to physical orders. Today `Order` in `apps/api/prisma/schema.prisma` has no status field. Every order is final, and nothing tracks whether a physical edition left the warehouse. The admin orders table (`apps/web/modules/admin/presentation/orders-table/OrdersTable.tsx`) shows the items and the shipping address of an order, but an admin cannot record a shipment. Order History (`apps/web/modules/account/presentation/order-history-section/OrderHistorySection.tsx`) shows the order number, date, item count, and total, but nothing about delivery.

This spec adds a status (`PENDING`, `SHIPPED`, or `DELIVERED`) and an optional tracking number to an order. An admin sets both in the admin panel. The user sees both in Order History. Feature 3.3 (refunds) builds on the status field later.

## Design reference

Figma section "Shipping Status (proposal)" (draft, pending review). It lives in the same file and on the same page as the Admin Panel and Account frames.

The section holds three frames:

- "Admin — Orders: Shipment" (`node-id=407-381`, 1440 px), Feature 2. It is a copy of "Admin — Orders" with a Status column between Customer and Items. The first order is expanded and shows a third column, "Shipment", next to the shipping address. The column has the status select, the tracking number input, and the "Save shipment" button.
- "Account — Order History: Status" (`node-id=407-520`, 1440 px), Feature 3. It is a copy of the Account frame with the Order History tab active. A status badge follows the order summary. The first order is expanded and shows its items and the line `Tracking number: TRK123`. The last order is digital-only and has no badge.
- "Shipping Status — States" (`node-id=407-642`): the saving state with a disabled button, a failed save with the error under the button and the entered values kept, and a digital-only order with no Shipment block.

The frames use the file's `Color`, `Spacing`, and `Radius` variables and the `Input/Default` and `Button/Primary` components. The badges copy the existing item badges, so the section adds no new color. `Pending` uses the neutral "Physical" badge style. `Shipped` uses `text-primary` for the border and the text. `Delivered` uses the `Badge/Success` style of `Activated`.

## Assumptions and dependencies

- A physical order is an order with at least one `OrderItem` that has an `editionId`. A digital-only order has none. A mixed order counts as physical, because its edition still ships.
- The status describes the shipment of the whole order. The store ships all physical items of one order together, so there is no status per item.
- The admin panel (Feature 2.1) and the admin orders route `GET /api/admin/orders` exist. This spec extends them. It adds no new admin page.
- The new route goes into `AdminOrdersController`, which already has `JwtAuthGuard`, `RolesGuard`, and `@RequireRole(Roles.Admin)` at the controller level.
- A new web call goes through the generated `packages/dionis-api` client. Add the route and the new fields to `packages/dionis-api/dionis.yaml` and regenerate.
- The web changes stay inside the existing `admin` and `account` modules and follow `.claude/rules/frontennd-architecture.md`.
- No new environment variable is needed.

## Open decisions

Each item has a default that this spec already uses. Change the default before phase 2 if you disagree.

1. Can an admin move a status backward, for example from `SHIPPED` to `PENDING`? Default: yes. An admin can set any of the three values, so a wrong click is easy to undo. The store has one admin, so a strict state machine adds code without a clear gain.
2. Does a status change send an email to the user? Default: no. The user sees the status in Order History. A "your order shipped" email through `MailService` is a small follow-up if users ask for it.
3. What status do existing orders get? Default: the migration sets digital-only orders to `DELIVERED` and physical orders to `PENDING`. The admin then updates the physical orders by hand.
4. Does Order History show a status on a digital-only order? Default: no. A digital order has nothing to ship, and its activation code already shows its state. The status badge shows only on physical orders.
5. Is the tracking number a link to a carrier site? Default: no. The store does not record the carrier, so the tracking number shows as plain text that the user can copy.

## Feature 1: Order status API

### Description

The API stores a status and a tracking number on each order, returns them in every order response, and lets an admin change them.

### Requirements

1. Add the Prisma enum `OrderStatus` with the values `PENDING`, `SHIPPED`, and `DELIVERED`. Add `status OrderStatus @default(PENDING)` and `trackingNumber String?` to `Order`. Add a Prisma migration that also sets the status of existing orders as Open decision 3 describes.
2. `createOrderFromPaymentIntent` in `apps/api/src/features/orders/orders.service.ts` sets `status` to `DELIVERED` when the order has no physical item. A physical or mixed order keeps the default `PENDING`.
3. `GET /api/orders`, `GET /api/orders/:id`, and `GET /api/admin/orders` return `status` and `trackingNumber` on each order. `trackingNumber` is `null` when it is not set.
4. Add `PATCH /api/admin/orders/:id` to `AdminOrdersController`. The body DTO has `status`, which must be one of the `OrderStatus` values through `@IsIn` against an exported const array, and an optional `trackingNumber` string of at most 64 characters. The route returns the updated order in the same shape as one item of `GET /api/admin/orders`.
5. The service trims `trackingNumber`. An empty string after the trim stores `null`, so an admin can clear the value. When the body has no `trackingNumber` field, the stored value does not change.
6. The route returns `404` for an unknown order id. It returns `400` for a non-numeric id, an invalid status, or a tracking number longer than 64 characters. It returns `400` when the order is digital-only, because a digital-only order has nothing to ship.
7. The path parameter `:id` is validated by hand in the controller, like the other order routes. The service throws `CustomError`, and the controller rethrows it through `toHttpException`.
8. A unit test next to the service and the controller covers the cases in the acceptance criteria below.

### Acceptance criteria

- A user buys a physical edition. The new order has `status` `PENDING` and `trackingNumber` `null`.
- A user buys only digital games. The new order has `status` `DELIVERED`.
- A user buys a digital game and a physical edition in one order. The new order has `status` `PENDING`.
- An admin sends `PATCH /api/admin/orders/:id` with `status` `SHIPPED` and `trackingNumber` `" TRK123 "`. The response is 200 with `status` `SHIPPED` and `trackingNumber` `TRK123`. `GET /api/orders` for the buyer returns the same values.
- An admin sends `PATCH` with `status` `DELIVERED` and no `trackingNumber`. The tracking number stays `TRK123`.
- An admin sends `PATCH` with `trackingNumber` `""`. The stored tracking number becomes `null`.
- A regular user sends `PATCH`. The response is 403. A request without a token gets 401.
- `status` `LOST` returns 400. A tracking number of 65 characters returns 400. An unknown order id returns 404. A digital-only order returns 400.

### Out of scope

- A status history or a timestamp per status change.
- A `REFUNDED` or `CANCELLED` status. Feature 3.3 adds `REFUNDED`.
- An email to the user when the status changes.
- A filter by status in `GET /api/admin/orders`.

## Feature 2: Status controls in the admin panel

### Description

The admin orders table shows the status of each order. The expanded order panel lets an admin change the status and the tracking number.

### Requirements

1. The admin orders table adds a "Status" column. Each row shows a status badge with the text `Pending`, `Shipped`, or `Delivered`.
2. The expanded panel of a physical order shows a "Shipment" block with a status select, a tracking number input, and a Save button. The status select is a native `<select>`. Its option values are the `OrderStatus` values and its option labels are the badge texts. The select and the input start with the stored values.
3. Save sends `PATCH /api/admin/orders/:id` with the selected status and the input value. While the request runs, the button is disabled. After a success, the row badge and the panel show the new values without a page reload.
4. After a failed save, the panel shows an error message and keeps the values that the admin entered.
5. The expanded panel of a digital-only order shows no "Shipment" block. Its row badge shows `Delivered`.
6. The tracking number input accepts at most 64 characters.

### Acceptance criteria

- An admin opens `/admin/orders`. Each order row shows a status badge.
- An admin expands a physical order with status `Pending`, selects `Shipped`, enters `TRK123`, and clicks Save. The row badge changes to `Shipped`. After a reload, the select shows `Shipped` and the input shows `TRK123`.
- An admin expands a digital-only order. The panel has no status select, and the row badge shows `Delivered`.
- The save request fails. The panel shows an error message, and the select and the input keep the values that the admin entered.

### Out of scope

- Changing the status of several orders at once.
- A filter or sort by status in the table.

## Feature 3: Status in Order History

### Description

Order History on the account page shows the shipping status and the tracking number of each physical order.

### Requirements

1. Each physical order row shows a status badge next to the order summary, with the text `Pending`, `Shipped`, or `Delivered`.
2. A digital-only order row shows no status badge.
3. When the order has a tracking number, the expanded row shows the line `Tracking number: <value>` as plain text.
4. The badge takes its colors from the existing design tokens. `Delivered` uses the success token that the admin panel already uses for `Activated`.

### Acceptance criteria

- A user with a physical order in status `PENDING` opens Order History. The row shows the badge `Pending`.
- An admin sets that order to `SHIPPED` with tracking number `TRK123`. The user reloads Order History. The row shows the badge `Shipped`, and the expanded row shows `Tracking number: TRK123`.
- A user with a digital-only order opens Order History. The row shows no status badge.
- A physical order with no tracking number shows no tracking line when it is expanded.

### Out of scope

- A separate order detail page.
- A link to a carrier tracking site.

## Cross-feature requirements

- Test IDs follow `apps/web/CLAUDE.md` (lowercase, hyphens):
  - `admin-order-status` for the status badge in an admin order row.
  - `admin-order-shipment` for the "Shipment" block in the expanded admin panel.
  - `admin-order-status-select` for the status select.
  - `admin-order-tracking-input` for the tracking number input.
  - `admin-order-shipment-save` for the Save button.
  - `admin-order-shipment-error` for the save error message.
  - `order-history-status` for the status badge in an Order History row.
  - `order-history-tracking` for the tracking number line in an expanded Order History row.
- The badge text is exactly `Pending`, `Shipped`, or `Delivered`, so tests can assert on it. One helper in the web app maps an `OrderStatus` value to its label, and both modules use it.
- Every API error goes through `CustomError` and `toHttpException`. The web app shows a short message for a failed request and never shows a raw error.
- Before you mark the feature done, run `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test --filter web`, `pnpm test --filter api`, and the new Playwright spec.

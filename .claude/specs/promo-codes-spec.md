# Promo Codes Spec

## Purpose

Feature 3.1 of `.claude/specs/roadmap-spec.md` lets a user enter a promo code on the Payment step and pay less. Today the price of an order comes from the per-game and per-edition `discount` only. `priceOrderItems` in `apps/api/src/features/orders/orders.service.ts` is the only place that calculates prices, and it has no input for a code. The Payment step (`apps/web/modules/cart/presentation/payment/Payment.tsx`) has no code field. An admin has no way to create a code.

This spec adds a `PromoCode` model, a code field on the Payment step, server-side application of the code to the Stripe PaymentIntent, and an admin page to manage codes.

## Design reference

Placeholder. Phase 2 fills this in with the Figma section and frame names.

## Assumptions and dependencies

- Feature 2.1 (admin panel) is built. Admin pages live under `apps/web/app/(shop)/admin/*` and the tabs live in `AdminShell.tsx`. This spec adds one tab.
- The PaymentIntent is created when the Payment step mounts, before the user can enter a code. So applying a code changes the amount of an existing PaymentIntent. `StripeService` has no method for that today. This spec adds `updatePaymentIntentAmount`. Stripe allows an amount change on an intent that is not yet confirmed.
- The order is created from the PaymentIntent by both `/confirm` and the Stripe webhook, and the order total is what Stripe charged. The code must therefore travel in the PaymentIntent metadata, like the shipping address does. Both paths then read the same value.
- A new web call goes through the generated `packages/dionis-api` client. Add the routes to `packages/dionis-api/dionis.yaml` and regenerate.
- The web changes stay inside the existing `cart` and `admin` modules and follow `.claude/rules/frontennd-architecture.md`.
- No new environment variable is needed.
- Feature 3.3 (refunds) will have to give a use back to the code when it refunds an order. This spec does not build refunds. It stores the code on the order so 3.3 can find it.

## Open decisions

Each item has a default that this spec already uses. Change the default before phase 2 if you disagree.

1. What does the percent apply to? Default: the items total after the existing game and edition discounts, never the shipping fee. A code stacks on top of a store discount.
2. Is there a limit per user? Decided: yes. A user can use each code once. `maxUses` and `expiresAt` still limit a code for all users. A code that an admin deletes and creates again with the same text stays used for the users who used it, because the redemption keeps the code text.
3. What happens when the code runs out between the time the user applies it and the time the order is created? Default: the order is still created and the code is still counted. The user already paid the discounted amount, and failing the order after a charge is worse than one use over the limit.
4. Does a guest see the code field? Default: no. Step 2 already needs a signed-in user.
5. Can an admin edit a code? Default: no edit. An admin creates a code and deletes it. This keeps the order history simple, because the order keeps its own copy of the code and the discount.

## Feature 1: Promo code API

### Description

The API stores promo codes, lets an admin manage them, and applies a code to a PaymentIntent.

### Requirements

1. Add the Prisma model `PromoCode { id, code, percentOff, expiresAt, maxUses, uses, createdAt }`. `code` is `@unique` and is stored in uppercase. `percentOff` is an integer from 1 to 100. `expiresAt` is nullable and means no expiry when empty. `maxUses` is nullable and means unlimited when empty. `uses` defaults to `0`.
2. Add `promoCode String?` and `promoDiscountCents Int?` to `Order`. Add the model `PromoRedemption { id, userId, code, orderId, createdAt }` with `@@unique([userId, code])`, a relation to `User` and one to `Order`, and `onDelete: Cascade` on both. Add one Prisma migration for all changes. `Order` and `PromoRedemption` keep a copy of the code string, not a relation to `PromoCode`, so an admin can delete a code without touching old orders or redemptions.
3. Add the admin routes `GET /api/admin/promo-codes`, `POST /api/admin/promo-codes`, and `DELETE /api/admin/promo-codes/:id`. All need `JwtAuthGuard` before `RolesGuard` with `@RequireRole(Roles.Admin)`. `POST` returns `409` for a code that exists and `400` for an invalid body. `DELETE` returns `204` and returns `404` for an unknown id. The list returns the codes newest first with `uses`.
4. A DTO validates the `POST` body: `code` is 3 to 32 characters of letters, digits, and hyphens, and is uppercased before it is stored. `percentOff` is an integer from 1 to 100. `expiresAt` is an optional date in the future. `maxUses` is an optional integer of 1 or more.
5. Add `PUT /api/orders/payment-intent/:id/promo` with body `{ code }` and `DELETE /api/orders/payment-intent/:id/promo`. Both need `JwtAuthGuard`. The signed-in user must be the user in the PaymentIntent metadata, like `setShippingAddress` checks today, or the response is `404`.
6. `PUT` reads the cart items from the PaymentIntent metadata, calls `priceOrderItems`, and applies the code there. It writes `promoCode` to the metadata, updates the PaymentIntent amount, and returns `{ amount, discountCents, code }` in cents. A second `PUT` with another code replaces the first. `DELETE` removes the metadata key, restores the full amount, and returns `{ amount }`.
7. `priceOrderItems` stays the only place that calculates prices. It takes an optional promo code row and returns `promoDiscountCents`. The discount is `Math.round(itemsTotal * percentOff / 100)`, and `totalPrice` is `itemsTotal - promoDiscountCents + shippingFee`.
8. `PUT` returns `400` with a plain message for an unknown code, an expired code, a code with `uses >= maxUses`, and a code that the signed-in user already used (a `PromoRedemption` exists for the user and the code). The four messages differ, so the user knows why. Matching ignores case. A PaymentIntent that already succeeded returns `409`.
9. `createPaymentIntent` and `createOrderFromPaymentIntent` read `promoCode` from the metadata when it exists. `createOrderFromPaymentIntent` stores `promoCode` and `promoDiscountCents` on the order , raises `uses` by one, and creates the `PromoRedemption` inside the same transaction as the order and the stock change. The redemption insert uses `createMany` with `skipDuplicates`, so a second order of the same user with the same code never fails or aborts the transaction. Neither the raise nor the redemption fails the order when a limit is reached (open decision 3). A code deleted after it was applied still lets the order complete, and the order stores the code as it was in the metadata.
10. `PUT` is rate-limited per IP address, with the same throttling setup as login, so a script cannot guess codes.
11. `MailService` receipt content shows one extra line, `Promo code <CODE>` with the discount, when the order has a code. An order without a code renders exactly as before.
12. A unit test next to each changed service and controller covers the cases in the acceptance criteria below.

### Acceptance criteria

- An admin creates `SAVE10` with 10 percent. A second `POST` with `save10` returns `409`. A user with the `User` role gets `403`, and a request without a token gets `401`.
- A signed-in user with a PaymentIntent for a digital cart of 50.00 EUR sends `PUT .../promo` with `save10`. The response has `amount` 4500 and `discountCents` 500, and Stripe shows the PaymentIntent at 4500.
- The cart has a physical edition. The 5.00 EUR shipping fee is not discounted.
- A second `PUT` with another valid code replaces the first. `DELETE` restores the full amount.
- A code with `expiresAt` in the past, a code with `uses` equal to `maxUses`, and an unknown code each return `400` and leave the PaymentIntent amount unchanged.
- A user sends `PUT` on a PaymentIntent that belongs to another user. The response is `404`.
- The order is created after payment. It has `promoCode` `SAVE10`, a `promoDiscountCents` of 500, and `totalPrice` equal to the Stripe amount. The code `uses` is 1.
- The browser closes before `/confirm`, and the Stripe webhook creates the order. The order still has the code and `uses` is still 1, not 2.
- Two orders race for the last use of a code with `maxUses` 1. Both orders exist and `uses` does not make an order fail.
- A user places an order with `SAVE10`. The same user sends `PUT .../promo` with `SAVE10` on a new PaymentIntent. The response is `400` with the "already used" message, and the amount does not change. A different user can still use `SAVE10`.
- A user applies `SAVE10` on two PaymentIntents before paying either. Both can pay. The user has one redemption, and `uses` is raised once for that user's first order and again for the second, because the second order skips the duplicate redemption but still counts as a use of the code.
- An admin deletes `SAVE10` and creates it again. A user who used it before still gets the "already used" message.
- The receipt email of an order with a code shows the code line. The receipt of an order without a code has no such line.
- An admin deletes a code. The old orders keep their `promoCode` and `promoDiscountCents`.

### Out of scope

- A fixed-amount discount. Only a percentage exists.
- A code for one game, one genre, or one platform.
- A per-user limit other than once, and a minimum cart value.
- Giving a redemption back when an order is refunded. Feature 3.3 decides that.
- Editing a code.
- Showing the code in the account order history. Only the receipt email shows it.

## Feature 2: Promo code field on the Payment step

### Description

The Payment step has a code field. The user enters a code, sees the new total, and can remove the code before paying.

### Requirements

1. Show a code field with an "Apply" button in the order summary on the Payment step. The field is hidden until the PaymentIntent exists, because `PUT .../promo` needs its id.
2. On "Apply", call the generated client for `PUT .../promo`. While the call runs, disable the button and show a loading state.
3. On success, show a "Promo code" line in the summary with the code and the discount, and show the new total. Replace the field with the applied code and a "Remove" control. The summary uses the amounts the API returned and does not recompute the discount in the browser. The existing `calculateCartSummary` stays for the lines it already shows.
4. On success, tell the Stripe element about the new amount (`elements.fetchUpdates()`) before the user can submit. The submit button stays disabled until that finishes.
5. On failure, show the API message under the field and leave the total unchanged. Do not clear the text the user typed.
6. "Remove" calls `DELETE .../promo` and restores the full total.
7. The code field state survives a failed card payment, because the user stays on step 2. It does not survive a page reload, because `currentStep` is not persisted and the PaymentIntent is created again.
8. The Payment step total must equal the amount Stripe charges.

### Acceptance criteria

- A user on step 2 enters a valid code and clicks "Apply". The summary shows the code line and a lower total, and the field becomes an applied state with "Remove".
- The user enters an invalid, expired, used-up, or already-used code. The matching message shows, and the total does not change.
- The user clicks "Remove". The total goes back to the full amount and the field is back.
- The user applies a code and pays with Stripe's test card 4242 4242 4242 4242. The order is created, and the Stripe test log shows the discounted amount.
- The user applies a code, then pays with the decline card 4000 0000 0000 0002. The error shows, the code stays applied, and the user stays on step 2.

### Out of scope

- A code field on step 1 or in the cart drawer.
- Remembering a code across a reload.

## Feature 3: Admin promo codes page

### Description

An admin lists, creates, and deletes promo codes in the admin panel.

### Requirements

1. Add a "Promo codes" tab to `AdminShell.tsx` and the route `/admin/promo-codes`. It follows the guards and the layout of the Games and Orders pages.
2. The page lists each code with its percent, expiry, uses, and max uses. An expired or used-up code shows an "Expired" or "Used up" label.
3. A form creates a code with the fields of Feature 1 requirement 4. A validation error from the API shows next to the form.
4. Each row has a delete control behind the existing `confirm-dialog`.
5. A signed-out user and a non-admin user cannot open the page, the same as the other admin pages.

### Acceptance criteria

- An admin creates a code and sees it in the list with 0 uses.
- An admin creates a code that exists. The conflict message shows.
- An admin deletes a code after confirming. The row is gone. Cancelling the dialog keeps the row.
- A non-admin user who opens `/admin/promo-codes` is sent away like on the other admin pages.

### Out of scope

- Editing a code, searching, and paging. A store has few codes, and the list is one page.

## Cross-feature requirements

- Test ids follow the lowercase-hyphen rule of `apps/web/CLAUDE.md`. Use `promo-code-field`, `promo-code-input`, `promo-code-apply`, `promo-code-error`, `promo-code-applied`, `promo-code-remove`, `summary-promo-line`, `admin-nav-promo-codes`, `promo-codes-table`, `promo-code-row`, `promo-code-form`, `promo-code-delete`, and `promo-code-status`. The admin form also uses `promo-percent-input`, `promo-expires-input`, `promo-max-uses-input`, `promo-code-create`, and `promo-form-error`. The Payment step shows the discounted total inside `payment-summary`, so the tests read the total from that element's text.
- The API errors use `CustomError` and `toHttpException`. Money values are integer cents.
- Add the new routes to `packages/dionis-api/dionis.yaml` and regenerate the client.
- Seed: add no promo code to the seed script. The E2E tests create their own codes through the admin API.

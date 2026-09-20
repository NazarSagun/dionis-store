# Physical Copy Editions Spec

## Purpose

Today `Game_pc` sells one thing per game: a digital key, delivered as an activation code through `checkout-payment-activation-spec.md` Feature 2. This spec adds a second purchase path: a physical copy. A game can offer one or more physical editions. Two examples are a standard edition and a collector's edition, each with its own price and its own stock count. A physical edition needs a shipping address at checkout. Once an order is placed, its stock must be checked and reduced too. A digital purchase needs neither.

This spec touches the game catalog, the cart, both checkout steps, and the `Order` model. It is a store-wide change, not an account-area change. It connects to `account-area-spec.md` Feature 8 (wishlist price-drop alerts): that feature dropped a restock alert because no stock field existed. This spec adds one, on `GameEdition`, so a later pass can add that alert back.

## Design reference

Placeholder. Phase 2 fills this in once the Figma design exists.

## Assumptions and dependencies

`apps/api/prisma/schema.prisma` gains a new model, `GameEdition`, linked to `Game_pc`. A game can have zero physical editions (digital only, today's behavior) or more than one. Each edition carries its own `name` (for example "Standard Physical Edition"), `price`, `discount`, and `stock`. This is a separate model rather than fields on `Game_pc`. A future edition can diverge from the digital listing on price and content, per the decision behind this spec.

`OrderItem` gains a nullable `editionId`. A null `editionId` means the item is the existing digital purchase: it still gets an `activationCode`, exactly as it does today. A non-null `editionId` means a physical purchase: it gets no activation code, because there is nothing to redeem on an external platform. Feature 5 below covers this split.

`Order` gains shipping address fields: `shippingName`, `shippingLine1`, `shippingLine2` (nullable), `shippingCity`, `shippingPostalCode`, `shippingCountry`. All are nullable at the schema level, because a digital-only order has no shipping address. A DTO enforces every required field for an order with at least one physical item. This check happens at the API boundary, not at the database level.

Shipping uses one flat fee for the whole order. The fee applies once, no matter how many physical items the order holds. There is no per-item, per-weight, or per-region calculation in this pass. The fee is a constant in `apps/api/src/features/orders`, not an environment variable. It is a product decision, not deployment configuration, unlike `STRIPE_PUBLISHABLE_KEY` or a port.

`CartItem` (`useCartStore`) gains an `editionId: number | null` field. Today, `CartItem.id` is a game id, and the store treats it as the unique key for `addItem`, `removeItem`, and `updateItemQuantity`. This spec widens that key to the pair `(id, editionId)`. A user can then hold both the digital version and a physical edition of the same game, as two separate cart lines.

`GameDetails.tsx` already has an "Add to Cart" button and a `buildCartItem` helper for the digital purchase. This spec adds a format picker next to it. It does not change `GameCard.tsx`, the grid card used on listing pages: format selection only happens on a game's own detail page, where there is room for it.

Both new checkout UI pieces (the format picker, the shipping address form) must reuse existing tokens and components: `ink`, `panel-alt`, `neon-magenta`, `neon-cyan`, `neon-green`, `shadow-retro`, `shadow-retro-sm`, and `Button` from `@repo/ui`. Do not add a new hardcoded color.

## Feature 1: Physical editions on the game detail page

### Description

A game's detail page shows its available physical editions, next to the existing digital purchase option. A game with no physical edition shows the digital option alone, as it does today.

### Requirements

1. Extend `GET game/{gameId}` to return an `editions` array on the game, each with `id`, `name`, `price`, `discount`, and `stock`. Regenerate `packages/dionis-api`'s client and model types.
2. On `GameDetails.tsx`, keep the existing digital "Add to Cart" button. Add one button per physical edition, labeled with that edition's name and price.
3. If an edition's `stock` is 0, disable its button and label it "Out of stock" instead of its price.
4. Clicking an edition's button adds it to the cart as its own `CartItem`, with that edition's `price`, `discount`, and `editionId` set. It does not affect the digital item's cart line.

### Acceptance criteria

- A game with one physical edition in stock shows two purchase buttons: "Add to Cart" (digital) and the edition's own labeled button.
- A game with an edition at zero stock shows that edition's button disabled, labeled "Out of stock".
- A user adds the digital version, then a physical edition, of the same game. The cart shows two separate lines for that game.

### Out of scope

- Editing or adding editions from the storefront. Editions are seeded or added directly, the same way `Game_pc` rows are today.
- Showing edition data on `GameCard.tsx`'s grid view.

## Feature 2: Cart support for editions

### Description

The cart stores a digital line and a physical-edition line as separate, independently removable items.

### Requirements

1. Add `editionId: number | null` to the `CartItem` type in `useCartStore`.
2. Change `addItem`, `removeItem`, and `updateItemQuantity` to key on the pair `(id, editionId)` instead of `id` alone.
3. On the cart page, show an edition's `name` under its title. This lets a user tell a physical line apart from the digital line for the same game.

### Acceptance criteria

- A user adds the digital and one physical edition of the same game, then removes only the physical line. The digital line stays in the cart.
- A user increases the quantity of a physical edition line. The digital line for the same game keeps its own quantity, unaffected.

### Out of scope

- A shared quantity or bundle price across a game's digital and physical lines.

## Feature 3: Shipping address at checkout

### Description

Once the cart holds at least one physical item, the Payment step collects a shipping address.

### Requirements

1. On `Payment.tsx`, check `useCartStore.items` for any item with a non-null `editionId`. If one exists, render a shipping address form above the payment element: recipient name, address line 1, address line 2 (optional), city, postal code, country.
2. Enforce every required field with a DTO on the backend, using `class-validator`, per `apps/api/CLAUDE.md`. Reject a physical order with a missing required field with a `CustomError` at 400.
3. If the cart holds only digital items, skip the form entirely. Do not show an empty address section.
4. Carry the address through `createPaymentIntent`'s metadata, the same way item data already travels through `PaymentIntent.metadata.items` today. Store it on the `Order` row in `confirmOrder`.

### Acceptance criteria

- A cart with only digital items reaches the Payment step with no address form.
- A cart with one physical item shows the address form. Submitting with a required field empty shows a validation error and does not create a PaymentIntent.
- A completed physical order, read back through `GET orders/:orderId`, includes the shipping address the user entered.

### Out of scope

- Address autocomplete, address book, or saved addresses across orders.
- Address validation against a real postal service.
- Multiple shipping addresses within one order.

## Feature 4: Delivery fee

### Description

A flat delivery fee, added once per order that contains a physical item.

### Requirements

1. Add a `SHIPPING_FEE_CENTS` constant to `apps/api/src/features/orders`.
2. `createPaymentIntent` and `confirmOrder` both check the request for any item with a non-null `editionId`. If one exists, both add this fee once to the order total. An order with only digital items pays no fee.
3. Show the fee as its own "Shipping" line in the Payment step's order summary, next to "Official price" and "Discount". When the fee applies, show this line. Otherwise leave it out.

### Acceptance criteria

- A cart with only digital items shows no "Shipping" line, and its total matches today's total exactly.
- A cart with one physical item shows a "Shipping" line, and the amount Stripe charges in its test log includes that fee.

### Out of scope

- A variable fee based on weight, distance, or carrier.
- Free-shipping thresholds or promotions.

## Feature 5: Stock check and order confirmation

### Description

Once an order with a physical item is placed, it reduces that edition's stock. If stock ran out first, the order is rejected instead.

### Requirements

1. In `confirmOrder`, for each item with a non-null `editionId`, make sure that `GameEdition.stock` is still at least the requested quantity. If it is not, throw a `CustomError` at 409 and create no order.
2. Once every item passes that check, create the `Order` and its `OrderItem` rows in the same transaction. That transaction also decrements each purchased edition's `stock` by the purchased quantity.
3. An `OrderItem` with a non-null `editionId` gets no `activationCode`. Leave that field empty for a physical item, since it is a digital-only concept.

### Acceptance criteria

- Two users race to buy the last unit of an edition with `stock` at 1. One order succeeds. The other fails with a 409 and creates no order.
- A completed physical order's `OrderItem` row has no activation code.
- After a physical order completes, that edition's `stock` in the database is reduced by the purchased quantity.

### Out of scope

- A waitlist or back-order flow for an out-of-stock edition.
- Restoring stock on a refund or cancellation. Refunds are out of scope for this spec, as they are for `checkout-payment-activation-spec.md`.

## Feature 6: Game Activation step for mixed orders

### Description

An order can now hold both digital and physical items. `GameActivation.tsx` must show each kind correctly, and its "Finish" gate must only depend on the digital ones.

### Requirements

1. For an `OrderItem` with a null `editionId` (digital), keep today's row: code, copy button, redeem link, "Mark as activated" button.
2. For an `OrderItem` with a non-null `editionId` (physical), show a row with the edition's name and a short note, for example "Ships to {shippingName}, {shippingCity}". Give it no code, no copy button, and no "Mark as activated" button.
3. The page-level "Finish" button's disabled state depends only on digital rows. An order made up entirely of physical items enables "Finish" immediately, since there is nothing left for the user to mark.

### Acceptance criteria

- An order with one digital and one physical item shows one `activation-row` with a code and one shipping-note row with no code.
- "Finish" stays disabled until the digital row is marked activated, regardless of the physical row.
- An order with only physical items shows "Finish" already enabled.

### Out of scope

- A shipped or delivered status for the physical row. This spec stops at "order placed, stock reduced." Fulfillment tracking is a separate, later feature.

## Cross-feature requirements

- Add a `data-testid` to each new interactive element. Use `edition-option` on each edition's purchase button, `edition-stock` on its stock or "Out of stock" label, and `shipping-address-form` on the address form's container. Add one more `data-testid` per address field: `shipping-name`, `shipping-line1`, `shipping-line2`, `shipping-city`, `shipping-postal-code`, `shipping-country`.
- Every new API call must degrade gracefully. Catch every error. Keep the layout intact. Allow no unhandled exception. This matches the existing cross-feature rule in `checkout-payment-activation-spec.md`.
- If you change the `SHIPPING_FEE_CENTS` default later, update every place that records it, per the root `CLAUDE.md`'s doc-sync rule.

## Connection to the account area

Once this spec ships, `account-area-spec.md` Feature 8 can add a restock alert alongside its price-drop alert, reading `GameEdition.stock` the same way it reads `discount` today. That change is not part of this spec.

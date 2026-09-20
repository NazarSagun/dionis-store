# Physical Copy Editions Spec

## Purpose

Today `Game_pc` sells one thing per game: a digital key, delivered as an activation code through `checkout-payment-activation-spec.md` Feature 2. This spec adds a second purchase path: a physical copy. A game can offer one or more physical editions. Two examples are a standard edition and a collector's edition, each with its own price and its own stock count. A physical edition needs a shipping address at checkout. Once an order is placed, its stock must be checked and reduced too. A digital purchase needs neither.

This spec touches the game catalog, the cart, both checkout steps, and the `Order` model. It is a store-wide change, not an account-area change. It connects to `account-area-spec.md` Feature 8 (wishlist price-drop alerts): that feature dropped a restock alert because no stock field existed. This spec adds one, on `GameEdition`, so a later pass can add that alert back.

## Design reference

Figma section: "Physical Editions (proposal)" (draft, pending review). Same file as the Home, Checkout, and Account redesigns:
https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=101-693

Four frames, one per touched screen, each cloned from its existing frame and extended rather than redrawn:
- "Game Details — Physical Editions (proposal)" (Feature 1): relabels "Add to Cart" as "Add Digital Copy" and resizes it down to match a new row of equally-sized `edition-option` buttons, one per physical edition, all using the Button component's Primary variant, with a dimmed Secondary variant for an out-of-stock edition. Each edition's own description (its bundled contents) shows under the game's description, above the buttons.
- "Cart — Physical Editions (proposal)" (Feature 2): adds an edition-name line under a cart row's title, for a game that has both a digital and a physical line.
- "Cart: Payment — Physical Editions (proposal)" (Features 3 and 4): adds a `shipping-address-form` above "CARD DETAILS", built from Input component instances, and a "Shipping" line in the order summary.
- "Cart: Game Activation — Physical Editions (proposal)" (Feature 6): turns one row into a shipping-note row with no code chip, copy button, or "Mark as activated" button.

A concept annotation frame ("Concept Annotation — Physical Editions") sits beside the section and explains the design thesis: every new element reuses an existing component or composition instead of introducing a new pattern.

## Assumptions and dependencies

`apps/api/prisma/schema.prisma` gains a new model, `GameEdition`, linked to `Game_pc`. A game can have zero physical editions (digital only, today's behavior) or more than one. Each edition carries its own `name` (for example "Standard Physical Edition"), `price`, `discount`, `stock`, and `description`. This is a separate model rather than fields on `Game_pc`. A future edition can diverge from the digital listing on price and content, per the decision behind this spec.

`GameEdition.description` holds what that edition physically adds, for example "Steelbook case, 80-page art book, 3 enamel pins, double-sided world map poster." A standard edition's description can be short (for example just the case), a collector's edition's is usually longer. This is separate from `Game_pc`'s own description, which stays the same for every purchase path.

`OrderItem` gains a nullable `editionId`. A null `editionId` means the item is the existing digital purchase: it still gets an `activationCode`, exactly as it does today. A non-null `editionId` means a physical purchase: it gets no activation code, because there is nothing to redeem on an external platform. Feature 5 below covers this split.

`Order` gains shipping address fields: `shippingName`, `shippingLine1`, `shippingLine2` (nullable), `shippingCity`, `shippingPostalCode`, `shippingCountry`. All are nullable at the schema level, because a digital-only order has no shipping address. A DTO enforces every required field for an order with at least one physical item. This check happens at the API boundary, not at the database level.

Shipping uses one flat fee for the whole order. The fee applies once, no matter how many physical items the order holds. There is no per-item, per-weight, or per-region calculation in this pass. The fee is a constant in `apps/api/src/features/orders`, not an environment variable. It is a product decision, not deployment configuration, unlike `STRIPE_PUBLISHABLE_KEY` or a port.

`CartItem` (`useCartStore`) gains an `editionId: number | null` field. Today, `CartItem.id` is a game id, and the store treats it as the unique key for `addItem`, `removeItem`, and `updateItemQuantity`. This spec widens that key to the pair `(id, editionId)`. A user can then hold both the digital version and a physical edition of the same game, as two separate cart lines.

`GameDetails.tsx` already has an "Add to Cart" button and a `buildCartItem` helper for the digital purchase. This spec adds a format picker next to it. It does not change `GameCard.tsx`, the grid card used on listing pages: format selection only happens on a game's own detail page, where there is room for it.

Both new checkout UI pieces (the format picker, the shipping address form) must reuse existing tokens and components: `ink`, `panel-alt`, `neon-magenta`, `neon-cyan`, `neon-green`, `shadow-retro`, `shadow-retro-sm`, and `Button` from `@repo/ui`. Do not add a new hardcoded color.

## Feature 1: Physical editions on the game detail page

### Description

A game's detail page shows one purchase button per format it is available in: digital, plus one per physical edition. No format is styled as the default; a shopper picks a format, not a game plus an upgrade. A game with no physical edition shows the digital button alone, as it does today.

### Requirements

1. Extend `GET game/{gameId}` to return an `editions` array on the game, each with `id`, `name`, `price`, `discount`, `stock`, and `description`. Regenerate `packages/dionis-api`'s client and model types.
2. On `GameDetails.tsx`, relabel the digital button "Add Digital Copy" - plain "Add to Cart" no longer says which format it buys once edition buttons sit next to it - and give it the same size and visual weight as the new edition buttons, so it no longer reads as the default. Add one button per physical edition, each labeled with its own format name and price, sized identically. Update every place that matched the old "Add to Cart" accessible name: `packages/e2e/tests/helpers/checkout.ts`'s `signUpAndAddGamesToCart` and `addDigitalCopyToCart`, and `packages/e2e/tests/account-area.spec.ts`'s `addGameToCartFromHome`.
3. If an edition's `stock` is 0, disable its button and label it "Out of stock" instead of its price.
4. Clicking an edition's button adds it to the cart as its own `CartItem`, with that edition's `price`, `discount`, and `editionId` set. It does not affect the digital item's cart line.
5. Below the game's own description, show each physical edition's `description` under its own name, separate from the game's description. A game with no physical editions shows no extra description block, as it does today.

### Acceptance criteria

- A game with one physical edition in stock shows two equally-styled purchase buttons: "Add Digital Copy" and the edition's own labeled button, the same size. Neither reads as the default.
- A game with an edition at zero stock shows that edition's button disabled, labeled "Out of stock".
- A user adds the digital version, then a physical edition, of the same game. The cart shows two separate lines for that game.
- A game with a collector's edition shows that edition's own description (for example its bundled maps, stickers, or art book) under the game's own description, labeled with the edition's name.

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
4. Give `CartItemRow.tsx`'s root element a `cart-item` `data-testid` and the edition-name line (Requirement 3) a `cart-item-edition` `data-testid`, present only on a physical line. `CartItemRow.tsx` has no `data-testid` today; add it as part of this change, per the root `CLAUDE.md`'s test-ID convention.

### Acceptance criteria

- A user adds the digital and one physical edition of the same game, then removes only the physical line. The digital line stays in the cart.
- A user increases the quantity of a physical edition line. The digital line for the same game keeps its own quantity, unaffected.

### Out of scope

- A shared quantity or bundle price across a game's digital and physical lines.

## Feature 3: Shipping address at checkout

### Description

Once the cart holds at least one physical item, the Payment step collects a shipping address.

### Requirements

1. On `Payment.tsx`, check `useCartStore.items` for any item with a non-null `editionId`. If one exists, render a shipping address form above the payment element: recipient name, address line 1, address line 2 (optional), city, postal code, country. `Payment.tsx` already requests the Stripe `clientSecret` once, on mount, before any address field exists (a `useRef` guard against Strict Mode's double-invoke, per `checkout-payment-activation-spec.md` Feature 1) - the address does not travel through that request. Lift the address fields' state in `Payment.tsx` and pass it down to `PaymentForm.tsx` as a prop.
2. Before calling `stripe.confirmPayment`, `PaymentForm.tsx` checks that every required address field is filled, when the cart holds a physical item. On a missing field, show the validation error in a `shipping-address-error` `data-testid`, and do not call `stripe.confirmPayment` or `confirmOrder`. This runs client-side, before the card is charged, so a shopper is never charged for an order that `confirmOrder` would then reject.
3. Send the address as a `shippingAddress` field on `confirmOrder`'s request body, only when the cart holds a physical item. Enforce its required fields with a nested DTO on the backend, using `class-validator`, per `apps/api/CLAUDE.md`. This is the boundary check behind the client-side one in Requirement 2, not a duplicate of it: `confirmOrder` rejects a physical order with `shippingAddress` missing or incomplete with a `CustomError` at 400, regardless of what the client already checked.
4. If the cart holds only digital items, skip the form entirely. Do not show an empty address section.
5. Store the address on the `Order` row in `confirmOrder`.

### Acceptance criteria

- A cart with only digital items reaches the Payment step with no address form.
- A cart with one physical item shows the address form. Submitting with a required field empty shows a validation error and does not call `confirmOrder`; the Game Activation step never appears.
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
3. Show the fee as its own "Shipping" line, `data-testid="shipping-fee"`, in the Payment step's order summary, next to "Official price" and "Discount". When the fee applies, show this line. Otherwise leave it out.

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

An order can now hold both digital and physical items. `GameActivation.tsx` must show each kind correctly. "Finish" keeps the behavior `checkout-payment-activation-spec.md` Feature 2 already shipped: it is never disabled by activation state, digital or physical, because activation happens on Steam, outside this store, and Finish must never force it.

### Requirements

1. For an `OrderItem` with a null `editionId` (digital), keep today's row: code, copy button, redeem link, "Mark as activated" button.
2. For an `OrderItem` with a non-null `editionId` (physical), show a row, `data-testid="shipping-row"`, with the edition's name and a short note, `data-testid="shipping-note"`, for example "Ships to {shippingName}, {shippingCity}". Give it no code, no copy button, and no "Mark as activated" button.
3. "Finish" stays enabled regardless of activation state, for every row kind. This matches the existing digital-only behavior; physical rows do not change it.

### Acceptance criteria

- An order with one digital and one physical item shows one `activation-row` with a code and one `shipping-row` with no code.
- "Finish" is enabled on page load for an order with one digital and one physical item, before the digital row is marked activated.
- An order with only physical items shows "Finish" already enabled.

### Out of scope

- A shipped or delivered status for the physical row. This spec stops at "order placed, stock reduced." Fulfillment tracking is a separate, later feature.

## Cross-feature requirements

- Add a `data-testid` to each new interactive element. Use `edition-option` on each edition's purchase button (also on the digital "Add Digital Copy" button, since Feature 1 makes it one of an equally-sized set), `edition-stock` on its stock or "Out of stock" label, `edition-description` on each edition's description block, `shipping-address-form` on the address form's container, `shipping-address-error` on its validation error, and `shipping-row` / `shipping-note` on a physical `OrderItem`'s row and its note in `GameActivation.tsx`. Add one more `data-testid` per address field, on the `<input>` itself, matching `AuthForm.tsx`'s convention: `shipping-name`, `shipping-line1`, `shipping-line2`, `shipping-city`, `shipping-postal-code`, `shipping-country`. Use `shipping-fee` on the Payment step's "Shipping" summary line.
- Every new API call must degrade gracefully. Catch every error. Keep the layout intact. Allow no unhandled exception. This matches the existing cross-feature rule in `checkout-payment-activation-spec.md`.
- If you change the `SHIPPING_FEE_CENTS` default later, update every place that records it, per the root `CLAUDE.md`'s doc-sync rule.

## Connection to the account area

Once this spec ships, `account-area-spec.md` Feature 8 can add a restock alert alongside its price-drop alert, reading `GameEdition.stock` the same way it reads `discount` today. That change is not part of this spec.

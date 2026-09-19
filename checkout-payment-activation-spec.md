# Checkout Spec: Payment and Game Activation Steps

## Purpose

`CartNavigation` already lists three checkout steps. The steps are Shopping cart, Payment, and Game activation. Only step 1 works today. Step 2 (`Payment.tsx`) is a static heading. It has no form and no logic. Step 3 does not exist. `apps/web/app/cart/page.tsx` has no branch for it. A user who reaches step 2 today cannot finish a purchase. This spec defines both missing steps.

## Design reference

Figma section name: Checkout: Payment & Game Activation (proposal). Link:
https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=58-481

The section holds two frames, "Cart: Payment (proposal)" and "Cart: Game Activation (proposal)." Both frames live in the same file as the Home redesign and the existing "Cart" frame. Neither frame replaces the existing "Cart" frame, which still covers step 1 only.

## Assumptions and dependencies

`apps/api` has no `Order`, `Payment`, or `ActivationKey` model today. `apps/api/prisma/schema.prisma` defines only `User` and `Game_pc`. Neither step below can connect to a real backend without new tables and endpoints. This spec covers each step's behavior and UI only. It does not design the backend. Each feature below names its blocking dependency. The later BE and FE implementation plan picks those up.

`useCartStore.currentStep` is not persisted. Only `items` survives a refresh, through `partialize`. A page refresh on step 2 or step 3 sends the user back to step 1 today, though their cart items stay. This spec does not fix that gap. The implementation plan must address it, because losing activated codes on step 3 costs the user more than losing a half-filled payment form.

Both steps must reuse existing tokens and components where the design allows it. Use `ink`, `panel-alt`, `neon-magenta`, `neon-cyan`, `neon-green`, `shadow-retro`, and `shadow-retro-sm`. Use `Button` from `@repo/ui`. Do not add a new hardcoded color. The Payment step is the one exception: its card field comes from Stripe's own hosted element, which only partly accepts this product's styling. See Feature 1.

This product uses Stripe in test mode only. Test mode needs a test publishable key and a test secret key from a Stripe account. It also needs a new Stripe dependency in both `apps/api` and `apps/web`. Add `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` to `.env.example` with empty values, per the root `CLAUDE.md` env var rule. No real card ever gets charged. Stripe's own test card numbers stand in for real ones.

## Feature 1: Payment step

### Description

This is step 2 of checkout. It collects payment for the cart total through Stripe, in Stripe's test mode. Once Stripe approves the payment, the store creates the order and moves the user to step 3.

### Requirements

1. Show an order summary that matches step 1: official price, discount, and subtotal. Compute each value the way `Summary.tsx` computes it today.
2. Mount a Stripe payment element for card entry. Do not create a hand-rolled card number, expiry, or CVC form field.
3. Use Stripe test-mode keys only. Blocking dependency: `apps/api` needs an endpoint that creates a Stripe PaymentIntent for the cart total and returns its client secret. No such endpoint, and no Stripe dependency, exists today.
4. When Stripe approves the payment, create the order and advance `currentStep` to 3. Blocking dependency: the order-creation step must also generate one redemption code per purchased game internally, for Feature 2.
5. While Stripe approves the payment, disable the submit button and show a loading state. If Stripe declines the payment or the approval step fails, show Stripe's own error message. Let the user try again without losing their place in checkout.
6. Block step 2 for two cases: an empty cart, and an unauthenticated user. `Summary.tsx` already applies this same guard to its "Go to payment" button.

### Acceptance criteria

- A user enters Stripe's test card number, 4242 4242 4242 4242, with a future expiry date and any three-digit CVC, and submits. The app moves the user to step 3.
- A user enters Stripe's test decline card number, 4000 0000 0000 0002, and submits. Stripe's error message appears, and the user stays on step 2.
- The total shown on step 2 matches the total on step 1 for the same cart contents. It also matches the amount Stripe charges in its test log.

### Out of scope

- A payment method other than a card, such as a wallet or a bank transfer.
- Live Stripe keys or a real charge. Test mode only, for the life of this feature.
- Saved payment methods, multiple currencies, and emailed receipts or invoices.
- Editing the cart from the Payment step. A user goes back to step 1 through the nav instead.

## Feature 2: Game Activation step

### Description

This is step 3 of checkout, and the final step. The store already generated one redemption code for each game in the order. Each code is meant for an external platform, such as Steam, not for this store. The store cannot see whether a user actually redeemed a code there. So each row carries its own "Mark as activated" button, for the user to click by hand once they redeem it.

### Requirements

1. List every game from the order the user just placed. Show one row per game, with its thumbnail, title, and platform.
2. Show each row's generated redemption code in the clear. Add a "Copy code" control next to it.
3. Show a short redemption instruction and link per row, pointing the user to the external platform, for example a "Redeem on Steam" link.
4. Give each row a "Mark as activated" button. When a user clicks it, mark that row Activated: show a green checkmark, and disable that row's button.
5. Keep a page-level "Finish" button disabled until every row is activated. Enable it once every row is activated.
6. Blocking dependency: `apps/api` needs to generate and store one redemption code per purchased game at order-creation time. Tie each code to that order and that game. Do not just hand it to the client and forget it. It also needs an endpoint that records a user's own activated mark for a given order and game. This does not compare the code to anything on Steam or any outside platform.
7. Store each code with its order and its game, keyed to the user who placed the order. A future account page will read a user's past orders, their games, and their codes from this same data. This step's storage must already hold everything that page will need. Building that page is out of scope for this spec.

### Acceptance criteria

- A user clicks "Copy code" on a row. The exact displayed code goes on the clipboard. A Playwright test can read this back directly, once it grants itself clipboard permission.
- A user clicks "Mark as activated" on a row. That row shows the Activated state, and its button becomes disabled.
- At least one row is not activated. The "Finish" button stays disabled.
- Every row is activated. The "Finish" button becomes enabled.

### Out of scope

- Knowing whether a user actually redeemed a code on Steam or any outside platform. The store trusts the user's own "Mark as activated" click.
- Emailing codes to the user.
- Redeeming a code from a different session, device, or account than the one that placed the order.
- Direct API integration with Steam or any other outside platform.
- A persistent "My Library" page beyond this step. Where a user's activated games live after checkout is a separate feature.

## Cross-feature requirements

- Add a `data-testid` to each step's container and to every interactive control: inputs, buttons, and each row's activation state. Follow the existing pattern in `packages/e2e/tests/cart.spec.ts` and in `cart-navigation-step` inside `CartNavigation.tsx`. This lets QA write Playwright coverage without new test infrastructure.
- `CartNavigation`'s back-navigation rule needs no change. A step becomes clickable once `activeStep` moves past it, and this rule already covers a third step.
- Once each step connects to a real endpoint, it must degrade gracefully on an API error. Keep the layout intact and catch every error, with no unhandled exception.

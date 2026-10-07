# Email Receipts and Activation Codes Spec

## Purpose

When a customer pays, the store creates an order, but it sends no message. The customer must open the account page to see the order and the activation codes. Feature 2.2 of `.claude/specs/roadmap-spec.md` adds one email per order. The email is a receipt, and it holds the activation code of each digital item.

Today `OrdersService.createOrderFromPaymentIntent` in `apps/api/src/features/orders/orders.service.ts` is the only place that creates an order. Both `confirmOrder` (the browser path) and `handlePaymentIntentSucceeded` (the Stripe webhook path) call it. The `Order` model has no field that records a sent email. `apps/api` has no mail code and no mail dependency.

## Design reference

Figma section name: Email: Order Receipt (proposal). It lives in the same file as the other redesign frames. Link:
https://www.figma.com/design/iENdx0LKoWPG4L8UtI4qq0/Dionis-Store-%E2%80%94-Retro-Redesign?node-id=255-353

The section holds two frames: "Email — Order receipt (600)" (`node-id=255-354`) and "Email — Order receipt (375 mobile)" (`node-id=255-403`). Both show one mixed order: two digital items with an activation code each, and one physical item with a shipping address. The frames use the file's own color variables, spacing, and text styles. This feature has no change to the web app. It adds a backend service and an email template.

Email clients do not load the web fonts or the CSS variables. The HTML template uses the hex values of the design tokens, written inline, and these font stacks: `'Space Grotesk', Arial, Helvetica, sans-serif` for headings, `Inter, Arial, Helvetica, sans-serif` for body text, and `'JetBrains Mono', Consolas, Menlo, monospace` for codes. The layout is a single column in nested tables with a maximum width of 600 px, and it fills the screen width below that. It has no shadows, no gradients, and no background images.

## Assumptions and dependencies

- Feature 1.1 (the Stripe webhook) is in the code. The email code runs in the shared order-creation path, so the webhook and the browser path both send it.
- The email goes to `order.user.email`. The store has no other address for a customer.
- The provider is any SMTP server, used through `nodemailer`. The configuration comes only from environment variables. Local development and CI use Mailpit, a free mail catcher that accepts SMTP on port 1025 and shows messages on port 8025. A deployed environment uses a real SMTP account.
- A new environment variable goes into `.env.example` in the same commit, as the root `CLAUDE.md` requires.
- The currency is euros. An `OrderItem.price` and `Order.totalPrice` are whole cents.

## Feature 1: Send the receipt email

### Description

After an order is saved, the API sends one email to the customer. The email lists the items, the total, and the activation codes. A physical order also shows its shipping address.

### Requirements

1. Add `MailService` in `apps/api/src/common/mail`. It wraps one `nodemailer` transport. It exposes `sendOrderReceipt(to, order)`. It returns `true` when it sent the email and `false` when mail is turned off.
2. Read the configuration from `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM`. `SMTP_USER` and `SMTP_PASS` can be empty, because Mailpit needs no login.
3. If `SMTP_HOST` is empty, the API still starts. `sendOrderReceipt` writes one log line and sends nothing. This matches how `STRIPE_WEBHOOK_SECRET` behaves when it is empty.
4. The email has a subject, an HTML body, and a plain-text body. The subject is `Your Dionis Store order #<id>`.
5. The body shows the order number, the order date, and one row per item with the game title, the edition name for a physical item, the quantity, and the price. It shows the total.
6. The email has a "View your order" button. It links to `<first CLIENT_URL origin>/account`. Page text under the button tells the customer to mark each code as activated after redeeming it.
7. For a digital item, the row shows the activation code. For a physical item, no code exists, so the row shows no code. A physical order shows the shipping address that the order stores.
8. Escape every value that comes from the database before it goes into the HTML body.
9. Add `receiptSentAt DateTime?` to `Order`, with a Prisma migration.
10. Send the email once per order. `createOrderFromPaymentIntent` sends it after the database transaction commits, in this order: claim, send, release on failure.
   - Claim: `order.updateMany({ where: { id, receiptSentAt: null }, data: { receiptSentAt: new Date() } })`. If the count is `0`, another call already claimed the order, so do not send.
   - Send: call `MailService.sendOrderReceipt`.
   - Release: if the send throws, or `sendOrderReceipt` returns `false`, set `receiptSentAt` back to `null`, and log the error. `receiptSentAt` is `null` exactly when no email went out.
11. The path that returns an existing order (`findOrderByPaymentIntent` or the `P2002` race) never sends an email.
12. A failed send must not fail the order. `confirmOrder` and the webhook still return the order.

### Acceptance criteria

- A signed-in user pays for a digital game. One email arrives at the user's address. It shows the order number, the game title, the price, the total, and the activation code that the Game Activation step shows.
- A user pays for a physical edition. The email shows the edition, the quantity, the total, and the shipping address. It shows no activation code.
- The webhook and `confirm` both run for one payment. Exactly one email arrives.
- The SMTP server is unreachable. The order is created, `confirm` returns `200`, and the `Order.receiptSentAt` value is `null`.
- `SMTP_HOST` is empty. The API starts, the order is created, and no email is sent.
- A game title that holds `<script>` appears in the email as text, not as an element.
- The "View your order" button in the email links to the account page of the first `CLIENT_URL` origin.

### Out of scope

- A job that retries a failed email. The empty `receiptSentAt` value is the marker that a later job can use.
- Email for a refund, a shipping status change, or a restock alert.
- A template engine, an unsubscribe link, and translations.
- A button in the account page to send the receipt again.

## Feature 2: Mail catcher for development and tests

### Description

Local development, the API unit tests, and the Playwright suite never send a real email. They use Mailpit or a mock.

### Requirements

1. Add a `mailpit` service (`axllent/mailpit`) to `apps/api/docker-compose.yml`, with ports `1025` and `8025` mapped from environment variables that already follow the repo pattern.
2. Add the same service to the `e2e` job in `.github/workflows/pr-workflow.yml`. The workflow sets `SMTP_HOST`, `SMTP_PORT`, and `MAIL_FROM` for the API process.
3. Add `SMTP_*`, `MAIL_FROM`, and `E2E_MAIL_API_URL` (the Mailpit HTTP address, `http://localhost:8025`) to `.env.example`, with these defaults: `SMTP_HOST=localhost`, `SMTP_PORT=1025`, `MAIL_FROM=Dionis Store <no-reply@dionis-store.local>`. Leave `SMTP_USER` and `SMTP_PASS` empty.
4. Pass the `SMTP_*` and `MAIL_FROM` variables through `docker-compose.prod.yml`, with an empty default, so that a single-host deploy can turn the email on by editing `.env.prod`.
5. Unit tests in `orders.service.spec.ts` replace `MailService` with a Jest mock.
6. Add a helper in `packages/e2e/tests/helpers/` that reads and clears messages through the Mailpit HTTP API.
7. Update `README.md` with the Mailpit command and the new variables.

### Acceptance criteria

- `pnpm test --filter api` passes with no SMTP server running.
- The Playwright spec for this feature reads the receipt from Mailpit and passes in CI.
- In a local run, a purchase shows its email at `http://localhost:8025`.

### Out of scope

- Ethereal and Mailtrap setup. Both work with the same variables, but the repo does not need them.
- A real provider account in CI.

## Cross-feature requirements

- Unit tests in `orders.service.spec.ts` cover the claim logic: a first call sends, a second call does not, a failed send resets `receiptSentAt`, and a failed send does not throw.
- A unit test in `mail.service.spec.ts` covers the escaping and the empty `SMTP_HOST` case, using the `nodemailer` `jsonTransport` option so that no network is used.
- The E2E spec is `packages/e2e/tests/email-receipt.spec.ts`. It has no `data-testid` requirement, because the feature has no UI.
- Error handling follows `apps/api/CLAUDE.md`. `MailService` throws a plain error, and `OrdersService` catches and logs it. No `HttpException` is built.
- Before you mark the feature done, run `pnpm lint`, `pnpm build`, `pnpm test --filter web`, `pnpm test --filter api`, and the new Playwright spec.

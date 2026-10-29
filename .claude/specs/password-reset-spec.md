# Password Reset Spec

## Purpose

A user who forgets the password has no way back into the account today. Feature 5.1 of `.claude/specs/roadmap-spec.md` adds a reset link that arrives by email and works once.

Today `apps/api/src/features/auth/auth.controller.ts` has `register`, `login`, `logout`, and `refresh`. `UsersService.changePassword` in `apps/api/src/features/users/users.service.ts` changes a password, but it needs the current password and a signed-in user. `MailService` in `apps/api/src/common/mail/mail.service.ts` sends the order receipt and the restock alert through SMTP, and it builds links from the first `CLIENT_URL` origin. The `/login` page uses `AuthForm` in `apps/web/modules/auth/presentation/auth-form/AuthForm.tsx`, and that form has no "Forgot password" link.

## Design reference

The Figma section "Auth" holds seven desktop frames (1440) and a mobile frame (390) for each, named with the suffix "— Mobile":

- "Login — Forgot password link": the login card with the "Forgot password?" link under the password field, aligned right.
- "Forgot password" and "Forgot password — Sent": the email form, and the "Check your inbox" card that replaces it.
- "Reset password" and "Reset password — Passwords differ": the two password fields, and the error under the confirm field.
- "Reset password — Invalid link": the card for a used, expired, or missing token. It has a "Get a new link" button that opens `/forgot-password` and a "Back to login" link.
- "Login — Password changed": the login page with the "Password changed" toast.

The "Emails" section holds "Email — Password reset (600)" and "Email — Password reset (375 mobile)". They reuse the layout of the restock alert email.

Each page shows one card of 420 px on desktop, centered on the page. On mobile, the card fills the width with a 16 px margin. The card uses the `bg-surface` fill, a 1 px `border-default` stroke, and 32 px padding (24 px on mobile). The pages reuse the existing `Input` and primary `Button`.

## Assumptions and dependencies

- The token lives in a new `PasswordResetToken` table, not on `User`. Feature 5.2 (Sessions) moves the refresh token columns out of `User`, so the reset code must not add more columns there.
- The reset ends every session of the user. Today a user has one session, so the reset clears `refreshToken`, `previousRefreshToken`, and `previousRefreshTokenAt`, as `changePassword` does. Feature 5.2 changes this step to delete every `Session` row.
- The link expires after 1 hour. This value is a constant in the code, not an environment variable.
- The email goes through `MailService`, with the same SMTP configuration as the receipt. Local development and the E2E stack use Mailpit. The feature adds no environment variable.
- The password rule is the same as on register: 8 to 72 characters.
- Out of scope for this pass: a reset started by an admin, a reset by SMS, a password strength meter, and an email that tells the user the password changed.

## Feature 1: Ask for a reset link

### Description

The user opens "Forgot password" from the login page, enters an email address, and gets a link by email. The page shows the same message for every address, so it does not tell a stranger which addresses have an account.

### Requirements

1. Add the Prisma model `PasswordResetToken { id, userId, tokenHash @unique, expiresAt, usedAt?, createdAt }`, with a relation to `User` and `onDelete: Cascade`. Add a migration.
2. Add `POST /api/forgot-password` with the body `{ email }`. A DTO validates the email with `@IsEmail`.
3. The route always returns `204` with no body, for a known email and for an unknown email.
4. For a known email, the service makes a token of 32 random bytes from `crypto.randomBytes`, encoded as base64url. It stores only the SHA-256 hash of the token. A token with this much entropy needs no salt and no slow hash.
5. A new request deletes every unused token of that user before it creates the new one. Only the newest link works.
6. The service sends the email through a new `MailService.sendPasswordReset(to, token)`. The link is `<first CLIENT_URL origin>/reset-password?token=<token>`.
7. The route does not wait for the email to be sent. A known email and an unknown email then take about the same time. A failed send writes a log line, and the route still returns `204`.
8. The email has the subject `Reset your Dionis Store password`, an HTML body, and a plain-text body. It shows a "Set a new password" button with the link, says that the link works once and expires in 1 hour, and says that the user can ignore the email if the user did not ask for it. The template follows the receipt template: inline hex colors, a single column of at most 600 px, and escaped values.
9. Apply `AUTH_THROTTLE` to the route, as on login.
10. Add a "Forgot password?" link under the password field on the login form. It opens `/forgot-password`. The cart modal login form shows the same link.
11. Add the page `/forgot-password`. It has one email field and a "Send reset link" button. After the request, the page replaces the form with the message "If an account uses this address, a reset link is on its way. Check your inbox." and a link back to `/login`.

### Acceptance criteria

- A user opens `/login` and selects "Forgot password?". The `/forgot-password` page opens.
- A user enters the email of an account and sends the form. The page shows the "check your inbox" message. One email arrives at that address with a link to `/reset-password?token=...`.
- A user enters an email that has no account. The API returns `204`, the page shows the same message, and no email is sent.
- A user asks for two links. Only the link in the second email works.
- An eleventh request from one IP address within one minute gets `429`.

### Out of scope

- A "resend" button with a countdown.
- A different message for an unknown email.

## Feature 2: Set a new password

### Description

The link opens a page with a new password field. After the user saves it, the old password and every old session stop working, and the user logs in with the new password.

### Requirements

1. Add `POST /api/reset-password` with the body `{ token, password }`. A DTO validates `token` as a non-empty string and `password` with `@Length(8, 72)`, as `RegisterDto` does.
2. The service hashes the token and claims it in one statement: `updateMany({ where: { tokenHash, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now } })`. If the count is `0`, it throws `CustomError('This reset link is invalid or expired', 400)`. Two requests with one token cannot both pass.
3. In the same transaction as the claim, the service sets the bcrypt hash of the new password, clears `refreshToken`, `previousRefreshToken`, and `previousRefreshTokenAt`, and deletes the other tokens of the user.
4. The route returns `204`. It does not log the user in and does not set a refresh cookie.
5. Apply `AUTH_THROTTLE` to the route.
6. Add the page `/reset-password`. It reads `token` from the query string. It has a "New password" field, a "Confirm password" field, and a "Save password" button.
7. The page checks in the browser that both fields match and that the password has 8 to 72 characters. It shows the error under the field and does not send the request.
8. After a `204`, the page opens `/login?passwordReset=1`. The login page shows the toast "Password changed. Log in with your new password." and removes the flag from the URL, as it does for `sessionExpired`.
9. After a `400`, the page replaces the form with the API message, a "Get a new link" button that opens `/forgot-password`, and a "Back to login" link.
10. If the URL has no `token`, the page shows the same invalid-link card, with no form.

### Acceptance criteria

- A user opens the link from the email, enters a new password twice, and saves. The login page opens with the "Password changed" toast. The user logs in with the new password.
- After the reset, a login with the old password fails with "Invalid email or password".
- After the reset, a browser that was signed in before the reset is logged out on its next refresh.
- A user opens the same link a second time and saves. The page shows "This reset link is invalid or expired".
- A link older than 1 hour gives the same message.
- The two password fields do not match. The page shows an error and sends no request.

### Out of scope

- A login straight after the reset.
- A rule that the new password must differ from the old one.

## Cross-feature requirements

- The API never stores or logs a raw token. Only the SHA-256 hash goes into the database.
- Both routes go through `AuthController`, and the service throws `CustomError`, which the controller rethrows through `toHttpException`.
- Add both routes and their DTO schemas to `packages/dionis-api/dionis.yaml`, and regenerate the client. The pages call the generated hooks.
- The new pages live in `apps/web/app/(shop)/forgot-password` and `apps/web/app/(shop)/reset-password`. Their components live in `apps/web/modules/auth/presentation`.
- `data-testid` values:
  - `forgot-password-link` on the login form link.
  - `forgot-email`, `forgot-submit`, and `forgot-sent` (the message after the request) on `/forgot-password`.
  - `reset-password`, `reset-confirm`, `reset-submit`, and `reset-error` on `/reset-password`.
- Unit tests in `apps/api` cover the token hash, the single-use claim, the expired token, the unknown email, and the cleared sessions. Unit tests in `apps/web` cover the field checks on the reset page.

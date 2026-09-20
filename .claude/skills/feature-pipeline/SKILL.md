---
name: feature-pipeline
description: Run this repo's full feature-development pipeline end to end - write a requirements spec, build the Figma design for it, write Playwright E2E tests against the spec's acceptance criteria, then implement the backend and frontend until those tests pass. Use this whenever the user asks to build, add, spec out, or ship a new feature, page, flow, or checkout step in this repo from scratch - phrases like "let's build X", "add a feature for Y", "spec out Z", "new page for...", or "let's do the same thing we did for payment/game-activation, but for...". Also use it for just one phase in isolation (e.g. "write the spec for X", "just do the E2E tests for the spec"), since each phase below is useful on its own. Do not use this for a small isolated bug fix, a copy/style tweak, or any change to code that already exists with no new user-facing requirement behind it - those don't need a spec.
---

# Feature Pipeline

This repo builds a feature in four phases, in order: spec, design, tests, implementation. `.claude/specs/features/cart/checkout-payment-activation-spec.md` and its `progress.md` are the working precedent - the Payment and Game Activation steps were built exactly this way, and `packages/e2e/tests/payment.spec.ts` / `game-activation.spec.ts` were written against that spec before the corresponding `apps/web` and `apps/api` code existed.

The four phases exist as separate steps, not one long unattended run, because each one produces something the user needs to look at before the next one can build on it correctly: a spec they haven't approved isn't safe to build a Figma screen from, and a screen that hasn't been approved isn't safe to write E2E tests against. **Stop and wait for the user's go-ahead after phase 1 and after phase 2, and again right before starting phase 4's implementation work.** If the user's request only wants one phase, do only that phase.

## Phase 1: Spec

Write a requirements spec as a new markdown file under `.claude/specs/`, matching the structure of `.claude/specs/features/cart/checkout-payment-activation-spec.md`. Mirror `apps/web`'s folder hierarchy to place it: a spec scoped to one `apps/web/features/<name>` folder goes at `.claude/specs/features/<name>/<feature-name>-spec.md`; a spec scoped to one route under `apps/web/app` goes at `.claude/specs/app/<feature-name>-spec.md`; a store-wide spec that touches more than one feature folder goes directly at `.claude/specs/<feature-name>-spec.md`.

- **Purpose** - what's missing today and what this spec adds, referencing the actual current code (read it, don't guess).
- **Design reference** - a placeholder for now; phase 2 fills this in once the Figma design exists.
- **Assumptions and dependencies** - what backend models/endpoints don't exist yet and are needed, what existing tokens/components must be reused, anything explicitly out of scope for this pass.
- **One "Feature N" section per distinct piece of functionality**, each with:
  - **Description**
  - **Requirements** (numbered)
  - **Acceptance criteria** - concrete, testable statements ("a user enters X and Y happens"), because phase 3 turns these directly into Playwright assertions
  - **Out of scope**
- **Cross-feature requirements** - `data-testid` conventions, error-handling expectations, anything spanning multiple features.

Before writing, check `apps/web/CLAUDE.md` and `apps/api/CLAUDE.md` for constraints the spec must respect (design tokens, feature-folder shape, the generated API client, module shape, error handling). If the request is ambiguous about scope, behavior, or which existing feature it extends, ask the user before writing rather than guessing - a wrong assumption here propagates through all three later phases.

Stop here and show the user the spec. Don't proceed to phase 2 until they've reviewed it.

## Phase 2: Figma design

Build the screens/views the spec describes, in Figma, using this repo's existing Figma skills together:

1. Load the `figma-use` skill first - it's a mandatory prerequisite for any `use_figma` call, per its own description.
2. Load `anti-ui-slop` to actually design the new screens. It works by extracting the design DNA from an **existing selected frame** and extending it - it does not design from nothing. Ask the user to select the closest existing frame in the product's Figma file (e.g. the existing "Cart" frame, for anything in the checkout flow) before starting, if they haven't already. Feed it the spec's Requirements and Acceptance criteria as the content/requirements source per its "Content Handling" step - it must use that content as source of truth, not invent copy.
3. Once the design is approved, update the spec's **Design reference** section with the resulting frame name(s) and link(s).

Stop here and show the user the design. Don't proceed to phase 3 until they've reviewed it.

## Phase 3: E2E tests

Write Playwright tests into `packages/e2e/tests/<feature-name>.spec.ts` (add shared setup to `packages/e2e/tests/helpers/` if more than one spec file will need it) that encode the spec's acceptance criteria one by one. Follow the conventions already in `packages/e2e/tests/payment.spec.ts`, `game-activation.spec.ts`, and `cart.spec.ts`:

- Select elements by the `data-testid`s the spec's cross-feature requirements call for - these tests are what forces phase 4 to actually add them.
- These tests are written **before the backend or frontend code exists**, and are expected to fail until phase 4 lands. That's the point: they're the executable definition of "done" for phase 4, not a check run after the fact.

Do not write or touch `apps/web` or `apps/api` source in this phase - only the test files.

## Phase 4: Implementation

Confirm with the user before starting - this is the longest phase and the one most worth a last check that the spec and design still look right.

Implement backend and frontend until the phase 3 tests pass:

**Backend** (`apps/api`, per `apps/api/CLAUDE.md`): a feature module under `src/features/<name>/` with a controller, a service, and a `dto/` folder (one class per file). Throw `CustomError` from the service, rethrow via `toHttpException` in the controller. Apply `JwtAuthGuard` (and `RolesGuard` if the spec needs role checks) per route or per controller, in that order. Put a unit test next to its source as `*.spec.ts`.

**Frontend** (`apps/web`, per `apps/web/CLAUDE.md`): a feature folder under `features/<name>/` with `components/`, `store/`, `hooks/`, `helpers.ts` as needed, each component in its own folder with an `index.ts` re-export, and the feature's own root `index.ts`. Fetch data only through the generated `packages/dionis-api` client - if an endpoint the frontend needs isn't in it yet, add it to `dionis.yaml` and regenerate (`pnpm build` in `packages/dionis-api`), don't hand-roll a request. Use the design tokens from `apps/web/tailwind.config.ts` / `globals.css`, never a raw hex value. Give every container and interactive element a `data-testid` matching what phase 3's tests select on.

Once the phase 3 E2E tests pass, run the checks the root `CLAUDE.md` requires before calling anything done - these are not covered by CI:

```sh
pnpm lint
pnpm build
pnpm test --filter web
pnpm test --filter api
pnpm --filter @repo/e2e test:e2e -- tests/<feature-name>.spec.ts
```

If you change a default value, a port, or a command along the way, update every place that records it (`.env.example`, `README.md`, any `CLAUDE.md`) in the same change, per the root `CLAUDE.md`'s doc-sync rule.

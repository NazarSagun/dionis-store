# `@repo/eslint-config`

Shared ESLint configurations for the repo.

- `next.js` is for `apps/web`.
- `node.js` is for `apps/api`.
- `react-internal.js` is for `packages/ui`.

Each file spreads the rules in `shared-rules.js`. Most TypeScript rules there need type information, so each config sets `parserOptions.project`. `eslint-plugin-only-warn` turns every error into a warning, and each package lints with `--max-warnings 0`, so any finding fails the run.

/*
 * Rules that every package in the repo shares. `next.js`, `node.js`, and
 * `react-internal.js` spread these objects into their own `rules`.
 */

// Any rule here can be raised to "error", but `only-warn` turns it into a
// warning, and `--max-warnings 0` then fails the lint run on it either way.
const base = {
  eqeqeq: ["error", "always", { null: "ignore" }],
  curly: ["error", "multi-line"],
  "no-console": ["error", { allow: ["warn", "error"] }],
  "no-debugger": "error",
  "no-eval": "error",
  "no-implied-eval": "error",
  "no-new-func": "error",
  "no-script-url": "error",
  "no-var": "error",
  "prefer-const": "error",
  "object-shorthand": "error",
  "no-param-reassign": ["error", { props: false }],
  "no-throw-literal": "error",
  "no-return-await": "off",
  "no-nested-ternary": "error",
  "no-else-return": ["error", { allowElseIf: false }],
};

// Rules that need type information. A config that uses them must set
// `parserOptions.project`.
const typescript = {
  "no-unused-vars": "off",
  "@typescript-eslint/no-unused-vars": [
    "error",
    { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
  ],
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-non-null-assertion": "error",
  "@typescript-eslint/ban-ts-comment": ["error", { "ts-expect-error": "allow-with-description" }],
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": [
    "error",
    { checksVoidReturn: { attributes: false } },
  ],
  "@typescript-eslint/await-thenable": "error",
  "@typescript-eslint/require-await": "error",
  "@typescript-eslint/switch-exhaustiveness-check": "error",
  "@typescript-eslint/prefer-optional-chain": "error",
  "@typescript-eslint/no-unnecessary-type-assertion": "error",
  "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
  "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
};

// A port, a hostname, or an API base URL comes from an environment variable.
// See "Configuration" in the root CLAUDE.md.
const noHardcodedHost = {
  selector:
    "Literal[value=/^(https?|wss?):[^a-z]{2}(localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0)/], TemplateElement[value.raw=/^(https?|wss?):[^a-z]{2}(localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0)/]",
  message:
    "Do not hardcode a host or a port. Read it from an environment variable and add its default to .env.example.",
};

module.exports = { base, typescript, noHardcodedHost };

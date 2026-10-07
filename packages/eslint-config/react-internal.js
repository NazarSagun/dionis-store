const { resolve } = require("node:path");
const { base, typescript, noHardcodedHost } = require("./shared-rules");

const project = resolve(process.cwd(), "tsconfig.json");

/*
 * This is a custom ESLint configuration for use with
 * internal (bundled by their consumer) libraries
 * that utilize React.
 *
 * This config extends the Vercel Engineering Style Guide.
 * For more information, see https://github.com/vercel/style-guide
 *
 */

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "prettier",
    require.resolve("@vercel/style-guide/eslint/react"),
    "eslint-config-turbo",
  ],
  plugins: ["only-warn"],
  rules: {
    ...base,
    // Style-only rules from the Vercel React preset. See next.js.
    "react/jsx-sort-props": "off",
    "react/function-component-definition": "off",
    "react/jsx-no-leaked-render": "off",
    "react/no-danger": "error",
    "no-restricted-syntax": ["error", noHardcodedHost],
  },
  env: {
    browser: true,
  },
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
  ignorePatterns: [
    // Ignore dotfiles
    ".*.js",
    "node_modules/",
    "dist/",
  ],
  overrides: [
    // Force ESLint to detect .tsx files
    { files: ["*.js?(x)", "*.ts?(x)"] },
    {
      files: ["*.ts", "*.tsx"],
      plugins: ["@typescript-eslint"],
      rules: typescript,
    },
  ],
};

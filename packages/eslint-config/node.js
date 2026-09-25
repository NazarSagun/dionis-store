const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/*
 * ESLint configuration for Node.js services, such as apps/api.
 */

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["eslint:recommended", "prettier", "eslint-config-turbo"],
  parser: require.resolve("@typescript-eslint/parser"),
  plugins: ["only-warn", "prettier"],
  env: {
    node: true,
    jest: true,
    es2021: true,
  },
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
  rules: {
    "prettier/prettier": "warn",
    // A server reads PORT, secrets, and seed values at runtime. They never
    // change build output, so they do not belong in turbo.json.
    "turbo/no-undeclared-env-vars": "off",
  },
  ignorePatterns: [
    // Ignore dotfiles
    ".*.js",
    "node_modules/",
    "dist/",
  ],
  overrides: [
    { files: ["*.js", "*.ts"] },
    {
      files: ["*.ts"],
      plugins: ["@typescript-eslint"],
      rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": "warn",
      },
    },
  ],
};

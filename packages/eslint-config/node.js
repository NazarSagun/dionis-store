const { resolve } = require("node:path");
const { base, typescript, noHardcodedHost } = require("./shared-rules");

const project = resolve(process.cwd(), "tsconfig.json");

/*
 * ESLint configuration for Node.js services, such as apps/api.
 */

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["eslint:recommended", "prettier", "eslint-config-turbo"],
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    project,
  },
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
    ...base,
    "prettier/prettier": "warn",
    // A server reads PORT, secrets, and seed values at runtime. They never
    // change build output, so they do not belong in turbo.json.
    "turbo/no-undeclared-env-vars": "off",
    "no-restricted-syntax": [
      "error",
      noHardcodedHost,
      {
        selector: "NewExpression[callee.name='PrismaClient']",
        message:
          "Inject PrismaService instead of calling new PrismaClient(). Only src/db-seed scripts may do this.",
      },
    ],
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
      rules: typescript,
    },
    {
      // A controller rethrows a CustomError through toHttpException. It never
      // builds an HttpException itself. See apps/api/CLAUDE.md.
      files: ["**/*.controller.ts"],
      rules: {
        "no-restricted-syntax": [
          "error",
          noHardcodedHost,
          {
            selector: "NewExpression[callee.name=/Exception$/]",
            message:
              "Throw a CustomError from the service and rethrow it with toHttpException.",
          },
        ],
      },
    },
    {
      files: ["**/db-seed/**"],
      rules: {
        "no-restricted-syntax": "off",
        "no-console": "off",
      },
    },
    {
      files: ["**/*.spec.ts", "**/*.test.ts"],
      rules: {
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/require-await": "off",
        "no-restricted-syntax": "off",
      },
    },
  ],
};

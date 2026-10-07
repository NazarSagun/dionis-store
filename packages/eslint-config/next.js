const { resolve } = require("node:path");
const { base, typescript, noHardcodedHost } = require("./shared-rules");

const project = resolve(process.cwd(), "tsconfig.json");

// The architecture rules below come from apps/web/CLAUDE.md.
const noHexInClassName = {
  selector:
    "JSXAttribute[name.name='className'] Literal[value=/#[0-9a-fA-F]{3,8}\\b/], JSXAttribute[name.name='className'] TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]",
  message: "Use a design token from tailwind.config.ts instead of a raw hex value.",
};
const noDynamicTestId = {
  selector: "JSXAttribute[name.name='data-testid'] > JSXExpressionContainer > TemplateLiteral",
  message: "Use a plain lowercase data-testid. Do not build it from a template string.",
};
const noDirectStorage = {
  selector: "MemberExpression[object.name=/^(localStorage|sessionStorage)$/]",
  message: "Persist client state with zustand's persist middleware and partialize, as useCartStore does.",
};
const noBarrel = {
  // esquery regexes cannot contain "/", so [^\\w.] stands in for the separator.
  selector: "ImportDeclaration[source.value=/^\\.\\.?([^\\w.]\\.\\.)*[^\\w.]?$|[^\\w.]index$/]",
  message: "There are no barrel files in apps/web. Import from the file that defines the export.",
};
const restrictedSyntax = [noHardcodedHost, noHexInClassName, noDynamicTestId, noDirectStorage, noBarrel];
const noHttpClient = {
  name: "axios",
  message: "Fetch data only through the generated hooks in @repo/dionis-api.",
};
const noApiOutsideIntegration = {
  group: ["@repo/dionis-api", "@repo/dionis-api/*"],
  message: "Import API hooks through the module's own integration/repository.ts.",
};
const noStoreOutsideCore = {
  group: ["**/core/store"],
  message: "Read and change state through the module's core/facade.ts, not the store.",
};

/** @param {Array<object>} patterns */
const restrictedImports = (patterns) => [
  "error",
  { paths: [noHttpClient], patterns },
];

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "prettier",
    require.resolve("@vercel/style-guide/eslint/react"),
    require.resolve("@vercel/style-guide/eslint/next"),
    "eslint-config-turbo",
  ],
  env: {
    node: true,
    browser: true,
  },
  plugins: ["only-warn", "simple-import-sort", "prettier"],
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
    // Style-only rules from the Vercel React preset. They would churn every
    // file without catching a bug, so they stay off.
    "react/jsx-sort-props": "off",
    "react/function-component-definition": "off",
    // Without type information this flags every boolean `&&`, not only the
    // number and string cases that leak into the output.
    "react/jsx-no-leaked-render": "off",
    "react/no-danger": "error",
    "react/jsx-no-target-blank": "error",
    "react/self-closing-comp": "error",
    "react/jsx-boolean-value": "error",
    "react/jsx-curly-brace-presence": ["error", { props: "never", children: "never" }],
    "react/no-array-index-key": "error",
    "react/jsx-no-useless-fragment": ["error", { allowExpressions: true }],
    "react-hooks/exhaustive-deps": "error",
    "no-restricted-globals": [
      "error",
      { name: "fetch", message: "Fetch data only through the generated hooks in @repo/dionis-api." },
    ],
    "no-restricted-syntax": ["error", ...restrictedSyntax],
    "no-restricted-imports": restrictedImports([noApiOutsideIntegration, noStoreOutsideCore]),
  },
  ignorePatterns: [
    // Ignore dotfiles
    ".*.js",
    "node_modules/",
  ],
  overrides: [
    { files: ["*.js?(x)", "*.ts?(x)"] },
    {
      files: ["*.ts", "*.tsx"],
      plugins: ["@typescript-eslint"],
      rules: {
        ...typescript,
        "simple-import-sort/imports": [
          "error",
          {
            "groups": [
              // Packages `react` and `next` related packages come first.
              ["^react", "^next", "^@?\\w"],
              // Internal packages.
              ["^(@|components)(/.*|$)", "^(@|providers)(/.*|$)", "^helpers"],
              // Side effect imports.
              ["^\\u0000"],
              // Parent imports. Put `..` last.
              ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
              // Other relative imports. Put same-folder imports and `.` last.
              ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
              // Style imports.
              ["^clsx", "^.+\\.?(scss)$"]
            ]
          }
        ]
      }
    },
    {
      // The repository is the one seam to the generated client. Route files
      // sit outside every module and may call it directly.
      files: ["**/integration/**", "app/**"],
      rules: {
        "no-restricted-imports": restrictedImports([noStoreOutsideCore]),
      },
    },
    {
      files: ["**/core/**"],
      rules: {
        "no-restricted-imports": restrictedImports([noApiOutsideIntegration]),
      },
    },
    {
      // Tests may reset a whole store and seed persisted state.
      files: ["**/__tests__/**", "**/*.test.ts?(x)", "**/*.stories.tsx", "test-utils/**", "jest.setup.ts"],
      rules: {
        "no-restricted-imports": restrictedImports([]),
        "no-restricted-syntax": ["error", noBarrel],
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/require-await": "off",
      },
    },
  ],
};

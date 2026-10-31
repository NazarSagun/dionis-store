/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['@repo/eslint-config/next.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
  },
  env: {
    jest: true,
  },
  ignorePatterns: ['public/**', '*.config.js'],
  overrides: [
    {
      // @react-three/fiber elements take three.js object props, which this rule reads as unknown DOM attributes.
      files: ['modules/showdown/presentation/dwarf/*.tsx'],
      rules: {
        'react/no-unknown-property': [
          'warn',
          { ignore: ['position', 'rotation', 'geometry', 'side', 'intensity', 'visible'] },
        ],
      },
    },
  ],
}

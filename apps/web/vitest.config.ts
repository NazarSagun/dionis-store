import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './test-utils/utils.tsx',
    coverage: {
      provider: 'istanbul',
      reporter: ['html', 'lcov', 'cobertura'],
      exclude: [
        'app/**',
        '**/*.stories.{tsx,ts}', // Covers both TSX and TS
        '**/*.test.{tsx,ts}', // Covers both TSX and TS
        '**/index.ts',
        '**/*.config.{js,ts}', // Covers both JS and TS config files
        '**/*.{eslintrc,prettierrc}.{js,ts}', // Handles eslint and prettier config files
        '**/.setup/**', // Exclude everything in .setup folder
        'public/**', // Exclude public directory and its content
        'lib/**', // Exclude lib directory and its content
        '.next/**', // Exclude .next directory and its content
        '.storybook/**',
      ],
    },
  },
  resolve: {
    alias: [{ find: /^@\/(.*)/, replacement: resolve(__dirname, './$1') }],
  },
})

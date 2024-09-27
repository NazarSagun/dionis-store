import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
 
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './test-utils/utils.tsx',
  },
  resolve: {
    alias: {
      '@/*': resolve(__dirname, './'),
      '@/lib': resolve(__dirname, './lib'),
      '@/test-utils': resolve(__dirname, './test-utils'),
      '@/providers': resolve(__dirname, './providers'),
      '@/ui': resolve(__dirname, './ui'),
    },
  },
})
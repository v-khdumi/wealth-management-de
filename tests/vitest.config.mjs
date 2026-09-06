import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: fileURLToPath(new URL('../', import.meta.url)),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../src', import.meta.url)),
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    pool: 'forks',
    maxWorkers: 1,
    fileParallelism: false,
    reporters: ['verbose'],
    environment: 'jsdom',
    include: ['tests/**/*.test.{jsx,mjs}'],
    setupFiles: ['tests/setup.mjs'],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 10000,
  },
})

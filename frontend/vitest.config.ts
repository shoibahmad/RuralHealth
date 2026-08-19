import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // The repository path contains spaces, which breaks the default forked
    // worker URLs on Windows; threads resolve modules in-process instead.
    pool: 'threads',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      // Floors enforced by `npm run test:coverage`, which CI runs. Raise them
      // as coverage improves; never lower them to make a build pass.
      thresholds: {
        lines: 55,
        functions: 55,
        branches: 70,
        statements: 55,
      },
    },
  },
})

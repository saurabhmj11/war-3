import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    // Default to node environment; per-file `// @vitest-environment jsdom`
    // directives opt specific component tests into jsdom.
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    globals: true,
    setupFiles: ['tests/setup.ts'],
    /**
     * Use a single forked worker process to avoid the Windows vitest-pool
     * timeout bug that occurs when spawning multiple jsdom workers in parallel.
     * This does not affect correctness — tests still run in isolated contexts.
     */
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    /**
     * Increase test timeout to 30 s to accommodate async AI engine tests that
     * simulate real latency (e.g. SimulatedGeminiEngine adds 350–650 ms delays).
     */
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/lib/**/*', 'src/components/**/*', 'src/app/api/**/*'],
      exclude: ['**/*.test.*', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

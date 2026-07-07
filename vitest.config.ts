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

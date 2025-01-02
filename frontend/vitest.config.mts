import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { config } from 'dotenv';

config({ path: './.env.local' });

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    env: {
      ...config().parsed
    },
    environment: 'jsdom',
    setupFiles: ['dotenv/config'],
    include: ['**/*.test.tsx', '**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/{git,.next}/**',
      '__tests__/**' // This is for old tests, new tests are declared next to the component
    ]
  }
});

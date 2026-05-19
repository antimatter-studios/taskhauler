import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Vitest config for the Taskhauler marketing site.
// DOM env is happy-dom — we don't run real layout/network in tests.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
});

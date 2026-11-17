import react from '@vitejs/plugin-react';
import {defineConfig} from 'vitest/config';

// Osobna konfiguracja testów, żeby nie uruchamiać wtyczki PWA z vite.config.ts.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    restoreMocks: true,
  },
});

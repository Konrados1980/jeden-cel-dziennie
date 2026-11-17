import {defineConfig} from 'vitest/config';

// Osobna konfiguracja testów, żeby nie uruchamiać wtyczki PWA z vite.config.ts.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    restoreMocks: true,
  },
});

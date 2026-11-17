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
    // Testy całego przepływu klikają i piszą jak człowiek; przy wielu plikach naraz
    // potrafią przekroczyć domyślne 5 s, więc dajemy im zapas.
    testTimeout: 20_000,
  },
});

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Każdy test zaczyna od pustego ekranu i pustej pamięci przeglądarki.
afterEach(() => {
  cleanup();
  localStorage.clear();
});

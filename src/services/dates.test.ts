import { afterEach, describe, expect, it, vi } from 'vitest';
import { capitalizeFirstLetter, formatPolishDate, getDaysAgo, getTodayDateString } from './dates';

afterEach(() => {
  vi.useRealTimers();
});

describe('getTodayDateString', () => {
  it('zwraca datę lokalną w formacie RRRR-MM-DD z zerami wiodącymi', () => {
    expect(getTodayDateString(new Date(2026, 0, 5, 12, 0))).toBe('2026-01-05');
  });

  it('tuż przed północą nadal zwraca dzisiejszą datę lokalną, a nie UTC', () => {
    expect(getTodayDateString(new Date(2026, 10, 13, 23, 59, 59))).toBe('2026-11-13');
  });
});

describe('getDaysAgo', () => {
  it('cofa się o podaną liczbę dni, także przez granicę miesiąca', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 1, 10, 0));
    expect(getDaysAgo(0)).toBe('2026-03-01');
    expect(getDaysAgo(1)).toBe('2026-02-28');
    expect(getDaysAgo(3)).toBe('2026-02-26');
  });
});

describe('formatPolishDate', () => {
  it('zwraca pełną datę po polsku z nazwą dnia tygodnia', () => {
    expect(formatPolishDate(new Date(2026, 10, 13))).toBe('piątek, 13 listopada 2026');
  });
});

describe('capitalizeFirstLetter', () => {
  it('zamienia pierwszą literę na wielką, także polską', () => {
    expect(capitalizeFirstLetter('środa, 23 września')).toBe('Środa, 23 września');
  });

  it('dla pustego tekstu zwraca pusty tekst', () => {
    expect(capitalizeFirstLetter('')).toBe('');
  });
});

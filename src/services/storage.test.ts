import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearCurrentGoal,
  deleteGoalFromHistory,
  getHistory,
  getStoredCurrentGoal,
  importBackup,
  saveCurrentGoal,
  saveGoalToHistory,
} from './storage';
import { makeGoal } from './testFactories';

// Klucze są częścią formatu danych użytkownika — test pilnuje, żeby się nie zmieniły.
const CURRENT_KEY = 'jeden_cel_dziennie_current';
const HISTORY_KEY = 'jeden_cel_dziennie_history';

function backupFile(content: unknown): File {
  const text = typeof content === 'string' ? content : JSON.stringify(content);
  return new File([text], 'kopia.json', { type: 'application/json' });
}

function failWrites() {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  return vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Brak miejsca', 'QuotaExceededError');
  });
}

beforeEach(() => {
  localStorage.clear();
});

describe('aktualny cel', () => {
  it('zapisuje i odczytuje cel pod stałym kluczem', () => {
    const goal = makeGoal();
    expect(saveCurrentGoal(goal)).toBe(true);
    expect(JSON.parse(localStorage.getItem(CURRENT_KEY)!)).toEqual(goal);
    expect(getStoredCurrentGoal()).toEqual(goal);
  });

  it('bez zapisanego celu zwraca null', () => {
    expect(getStoredCurrentGoal()).toBeNull();
  });

  it('uszkodzone dane nie wywracają aplikacji', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(CURRENT_KEY, '{nie-json');
    expect(getStoredCurrentGoal()).toBeNull();
  });

  it('usuwa cel', () => {
    saveCurrentGoal(makeGoal());
    expect(clearCurrentGoal()).toBe(true);
    expect(localStorage.getItem(CURRENT_KEY)).toBeNull();
  });

  it('przy braku miejsca zwraca false zamiast udawać sukces', () => {
    failWrites();
    expect(saveCurrentGoal(makeGoal())).toBe(false);
  });
});

describe('historia', () => {
  it('sortuje od najnowszego dnia', () => {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([
        makeGoal({ id: 'a', date: '2026-11-10' }),
        makeGoal({ id: 'b', date: '2026-11-12' }),
        makeGoal({ id: 'c', date: '2026-11-11' }),
      ]),
    );
    expect(getHistory().map((g) => g.id)).toEqual(['b', 'c', 'a']);
  });

  it('uszkodzona historia daje pustą listę', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(HISTORY_KEY, 'zepsute');
    expect(getHistory()).toEqual([]);
  });

  it('dopisuje nowy wpis i podmienia ten sam bez dublowania', () => {
    expect(saveGoalToHistory(makeGoal({ id: 'a', progress: 25 }))).toBe(true);
    saveGoalToHistory(makeGoal({ id: 'b', progress: 75 }));
    saveGoalToHistory(makeGoal({ id: 'a', progress: 100 }));
    const history = getHistory();
    expect(history).toHaveLength(2);
    expect(history.find((g) => g.id === 'a')?.progress).toBe(100);
  });

  it('dwa cele z tego samego dnia się nie nadpisują', () => {
    saveGoalToHistory(makeGoal({ id: 'rano', date: '2026-11-13' }));
    saveGoalToHistory(makeGoal({ id: 'po-poludniu', date: '2026-11-13' }));
    expect(getHistory()).toHaveLength(2);
  });

  it('usuwa tylko wskazany wpis', () => {
    saveGoalToHistory(makeGoal({ id: 'a' }));
    saveGoalToHistory(makeGoal({ id: 'b' }));
    expect(deleteGoalFromHistory('a')).toBe(true);
    expect(getHistory().map((g) => g.id)).toEqual(['b']);
  });

  it('przy braku miejsca usuwanie zwraca false, a wpis zostaje', () => {
    saveGoalToHistory(makeGoal({ id: 'a' }));
    failWrites();
    expect(deleteGoalFromHistory('a')).toBe(false);
    expect(getHistory().map((g) => g.id)).toEqual(['a']);
  });
});

describe('importBackup', () => {
  const history = [makeGoal({ id: 'h1', status: 'completed', achieved: true, progress: 100 })];
  const current = makeGoal({ id: 'c1' });

  it('wczytuje poprawną kopię w wersji 1', async () => {
    await importBackup(backupFile({ version: 1, currentGoal: current, history }));
    expect(getHistory()).toEqual(history);
    expect(getStoredCurrentGoal()).toEqual(current);
  });

  it('kopia bez aktualnego celu usuwa dotychczasowy cel', async () => {
    saveCurrentGoal(current);
    await importBackup(backupFile({ version: 1, currentGoal: null, history }));
    expect(getStoredCurrentGoal()).toBeNull();
  });

  const invalidCases: [string, unknown][] = [
    ['inna wersja', { version: 2, currentGoal: null, history }],
    ['brak historii', { version: 1, currentGoal: null }],
    ['postęp ponad 100', { version: 1, currentGoal: null, history: [makeGoal({ progress: 150 })] }],
    ['postęp ujemny', { version: 1, currentGoal: null, history: [makeGoal({ progress: -1 })] }],
    ['nieznany status', { version: 1, currentGoal: null, history: [{ ...makeGoal(), status: 'done' }] }],
    ['wpis bez treści celu', { version: 1, currentGoal: null, history: [{ ...makeGoal(), goal: 7 }] }],
    ['zły aktualny cel', { version: 1, currentGoal: { id: 'x' }, history }],
  ];

  it.each(invalidCases)('odrzuca kopię: %s, nie ruszając danych', async (_name, content) => {
    saveGoalToHistory(makeGoal({ id: 'stary' }));
    await expect(importBackup(backupFile(content))).rejects.toThrow('nieobsługiwany format');
    expect(getHistory().map((g) => g.id)).toEqual(['stary']);
  });

  it('odrzuca plik, który nie jest JSON-em', async () => {
    await expect(importBackup(backupFile('to nie jest json'))).rejects.toThrow();
  });

  it('przy błędzie zapisu przywraca poprzednie dane', async () => {
    saveGoalToHistory(makeGoal({ id: 'stary' }));
    saveCurrentGoal(makeGoal({ id: 'stary-cel' }));
    const before = { ...localStorage };

    // Pierwszy zapis (historia) się udaje, drugi (cel) kończy się brakiem miejsca.
    const realSetItem = Storage.prototype.setItem;
    let calls = 0;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      calls += 1;
      if (calls === 2) throw new DOMException('Brak miejsca', 'QuotaExceededError');
      realSetItem.call(this, key, value);
    });

    await expect(
      importBackup(backupFile({ version: 1, currentGoal: current, history })),
    ).rejects.toThrow('Brak miejsca');
    expect(localStorage.getItem(HISTORY_KEY)).toBe(before[HISTORY_KEY]);
    expect(localStorage.getItem(CURRENT_KEY)).toBe(before[CURRENT_KEY]);
  });
});

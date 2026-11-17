import { DayGoal } from '../types';
import { getDaysAgo } from './dates';

const STORAGE_KEYS = {
  CURRENT_GOAL: 'jeden_cel_dziennie_current',
  HISTORY: 'jeden_cel_dziennie_history',
};

// Nieczytelny zapis trafia pod klucz z tym dopiskiem, żeby nie zginął przy następnym zapisie.
const CORRUPTED_BACKUP_SUFFIX = '_corrupted_backup';

export type CorruptionNotice = 'backed_up' | 'backup_failed';
let corruptionNotice: CorruptionNotice | null = null;

/** Zwraca i czyści informację o uszkodzonych danych znalezionych przy ostatnich odczytach. */
export function takeCorruptionNotice(): CorruptionNotice | null {
  const notice = corruptionNotice;
  corruptionNotice = null;
  return notice;
}

function isValidGoal(goal: unknown): goal is DayGoal {
  if (!goal || typeof goal !== 'object') return false;
  const item = goal as Partial<DayGoal>;
  return typeof item.id === 'string' && typeof item.date === 'string' && typeof item.goal === 'string'
    && typeof item.progress === 'number' && item.progress >= 0 && item.progress <= 100
    && ['in_progress', 'completed', 'abandoned'].includes(item.status ?? '')
    && typeof item.createdAt === 'string';
}

/**
 * Odkłada surowy, nieczytelny zapis pod osobnym kluczem. Nie nadpisuje wcześniejszej kopii.
 * Zwraca true, gdy kopia jest bezpieczna i główny klucz można uporządkować.
 */
function backupCorrupted(key: string, raw: string): boolean {
  try {
    const backupKey = key + CORRUPTED_BACKUP_SUFFIX;
    const existing = localStorage.getItem(backupKey);
    if (existing === null) localStorage.setItem(backupKey, raw);
    else if (existing !== raw) localStorage.setItem(`${backupKey}_${Date.now()}`, raw);
    if (corruptionNotice !== 'backup_failed') corruptionNotice = 'backed_up';
    return true;
  } catch (e) {
    console.error(`Nie udało się zapisać kopii uszkodzonych danych "${key}"`, e);
    corruptionNotice = 'backup_failed';
    return false;
  }
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** Odczyt celu. writable = false, gdy uszkodzonego zapisu nie udało się odłożyć i nie wolno go nadpisać. */
function readCurrentGoal(): { goal: DayGoal | null; writable: boolean } {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEYS.CURRENT_GOAL);
  } catch (e) {
    console.error('Błąd odczytu aktualnego celu z localStorage', e);
    return { goal: null, writable: false };
  }
  if (!raw) return { goal: null, writable: true };

  const parsed = parseJson(raw);
  if (isValidGoal(parsed)) return { goal: parsed, writable: true };

  console.error('Aktualny cel w localStorage jest uszkodzony.');
  if (!backupCorrupted(STORAGE_KEYS.CURRENT_GOAL, raw)) return { goal: null, writable: false };
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_GOAL);
  } catch (e) {
    console.error('Nie udało się usunąć uszkodzonego celu', e);
  }
  return { goal: null, writable: true };
}

export function getStoredCurrentGoal(): DayGoal | null {
  return readCurrentGoal().goal;
}

export function saveCurrentGoal(goal: DayGoal): boolean {
  if (!readCurrentGoal().writable) return false;
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_GOAL, JSON.stringify(goal));
    return true;
  } catch (e) {
    console.error('Błąd zapisu aktualnego celu', e);
    return false;
  }
}

/**
 * Przywraca dane z kopii JSON (version: 1). Najpierw waliduje cały plik,
 * a jeśli zapis się nie powiedzie, przywraca poprzedni stan.
 */
export async function importBackup(file: File): Promise<void> {
  const parsed: unknown = JSON.parse(await file.text());
  if (!parsed || typeof parsed !== 'object') throw new Error('Nieprawidłowy plik kopii.');
  const data = parsed as { version?: number; currentGoal?: DayGoal | null; history?: DayGoal[] };
  if (data.version !== 1 || !Array.isArray(data.history) || !data.history.every(isValidGoal)
    || (data.currentGoal != null && !isValidGoal(data.currentGoal))) {
    throw new Error('Plik kopii ma nieobsługiwany format lub zawiera nieprawidłowe dane.');
  }
  const previousHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
  const previousCurrent = localStorage.getItem(STORAGE_KEYS.CURRENT_GOAL);
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
    if (data.currentGoal) localStorage.setItem(STORAGE_KEYS.CURRENT_GOAL, JSON.stringify(data.currentGoal));
    else localStorage.removeItem(STORAGE_KEYS.CURRENT_GOAL);
  } catch (error) {
    try {
      if (previousHistory === null) localStorage.removeItem(STORAGE_KEYS.HISTORY);
      else localStorage.setItem(STORAGE_KEYS.HISTORY, previousHistory);
      if (previousCurrent === null) localStorage.removeItem(STORAGE_KEYS.CURRENT_GOAL);
      else localStorage.setItem(STORAGE_KEYS.CURRENT_GOAL, previousCurrent);
    } catch (rollbackError) {
      console.error('Nie udało się przywrócić danych po błędzie importu kopii.', rollbackError);
    }
    throw error;
  }
}

export function clearCurrentGoal(): boolean {
  if (!readCurrentGoal().writable) return false;
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_GOAL);
    return true;
  } catch (e) {
    console.error('Błąd usuwania aktualnego celu', e);
    return false;
  }
}

/**
 * Odczyt historii. Uszkodzone wpisy są najpierw odkładane do kopii, potem usuwane z historii.
 * writable = false, gdy kopii nie udało się zapisać i historii nie wolno nadpisać.
 */
function readHistory(): { list: DayGoal[]; writable: boolean } {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
  } catch (e) {
    console.error('Błąd odczytu historii z localStorage', e);
    return { list: [], writable: false };
  }
  if (!raw) return { list: [], writable: true };

  const parsed = parseJson(raw);
  const items: unknown[] = Array.isArray(parsed) ? parsed : [];
  const list = items.filter(isValidGoal);
  let writable = true;

  if (!Array.isArray(parsed) || list.length !== items.length) {
    console.error('Historia w localStorage jest uszkodzona.');
    writable = backupCorrupted(STORAGE_KEYS.HISTORY, raw);
    if (writable) {
      try {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(list));
      } catch (e) {
        console.error('Nie udało się uporządkować historii', e);
        writable = false;
      }
    }
  }

  // Najnowsze dni na górze.
  list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return { list, writable };
}

export function getHistory(): DayGoal[] {
  return readHistory().list;
}

export function saveGoalToHistory(goal: DayGoal): boolean {
  try {
    const { list: history, writable } = readHistory();
    if (!writable) return false;
    // Podmieniamy tylko ten sam rekord, żeby kilka celów z jednego dnia się nie nadpisywało.
    const existingIndex = history.findIndex((h) => h.id === goal.id);
    if (existingIndex >= 0) {
      history[existingIndex] = goal;
    } else {
      history.unshift(goal);
    }
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    return true;
  } catch (e) {
    console.error('Błąd zapisu do historii', e);
    return false;
  }
}

export function deleteGoalFromHistory(id: string): boolean {
  try {
    const { list, writable } = readHistory();
    if (!writable) return false;
    const history = list.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    return true;
  } catch (e) {
    console.error('Błąd usuwania z historii', e);
    return false;
  }
}

/**
 * Wgrywa trzy przykładowe dni, jeśli historia jest pusta.
 */
export function seedSampleHistory(): boolean {
  const today = new Date();
  const sampleGoals: DayGoal[] = [
    {
      id: 'sample-1',
      date: getDaysAgo(1),
      formattedDate: 'Wczoraj',
      goal: 'Dokończyć projekt architektury systemu dla klienta',
      progress: 100,
      status: 'completed',
      achieved: true,
      helped: 'Wyłączony telefon i 2 sesje po 90 minut pracy w skupieniu (deep work).',
      hindered: 'Chwilowy spadek energii po obiedzie, pomógł krótki spacer.',
      createdAt: new Date(today.getTime() - 86400000 * 1.3).toISOString(),
      completedAt: new Date(today.getTime() - 86400000 * 0.9).toISOString(),
    },
    {
      id: 'sample-2',
      date: getDaysAgo(2),
      formattedDate: '2 dni temu',
      goal: 'Napisać i opublikować kluczowy artykuł techniczny',
      progress: 100,
      status: 'completed',
      achieved: true,
      helped: 'Przygotowany wcześniej zarys i brak sprawdzania poczty do 12:00.',
      hindered: 'Zbyt długie szukanie ilustracji.',
      createdAt: new Date(today.getTime() - 86400000 * 2.3).toISOString(),
      completedAt: new Date(today.getTime() - 86400000 * 1.9).toISOString(),
    },
    {
      id: 'sample-3',
      date: getDaysAgo(3),
      formattedDate: '3 dni temu',
      goal: 'Zrefaktoryzować moduł płatności w aplikacji',
      progress: 60,
      status: 'completed',
      achieved: false,
      helped: 'Dobre testy jednostkowe pozwoliły wyłapać ukryty błąd.',
      hindered: 'Nieoczekiwane pilne spotkanie z zespołem po południu, cel był zbyt szeroki.',
      createdAt: new Date(today.getTime() - 86400000 * 3.3).toISOString(),
      completedAt: new Date(today.getTime() - 86400000 * 2.9).toISOString(),
    },
  ];

  const { list, writable } = readHistory();
  if (!writable) return false;
  if (list.length > 0) return true;
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(sampleGoals));
    return true;
  } catch (e) {
    console.error('Błąd zapisu przykładowych danych', e);
    return false;
  }
}

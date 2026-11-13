import { DayGoal } from '../types';
import { getDaysAgo } from './dates';

const STORAGE_KEYS = {
  CURRENT_GOAL: 'jeden_cel_dziennie_current',
  HISTORY: 'jeden_cel_dziennie_history',
};

export function getStoredCurrentGoal(): DayGoal | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_GOAL);
    if (!raw) return null;
    return JSON.parse(raw) as DayGoal;
  } catch (e) {
    console.error('Błąd odczytu aktualnego celu z localStorage', e);
    return null;
  }
}

export function saveCurrentGoal(goal: DayGoal): boolean {
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
  const validGoal = (goal: unknown): goal is DayGoal => {
    if (!goal || typeof goal !== 'object') return false;
    const item = goal as Partial<DayGoal>;
    return typeof item.id === 'string' && typeof item.date === 'string' && typeof item.goal === 'string'
      && typeof item.progress === 'number' && item.progress >= 0 && item.progress <= 100
      && ['in_progress', 'completed', 'abandoned'].includes(item.status ?? '')
      && typeof item.createdAt === 'string';
  };
  if (data.version !== 1 || !Array.isArray(data.history) || !data.history.every(validGoal)
    || (data.currentGoal != null && !validGoal(data.currentGoal))) {
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
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_GOAL);
    return true;
  } catch (e) {
    console.error('Błąd usuwania aktualnego celu', e);
    return false;
  }
}

export function getHistory(): DayGoal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    const list = JSON.parse(raw) as DayGoal[];
    // Najnowsze dni na górze.
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (e) {
    console.error('Błąd odczytu historii z localStorage', e);
    return [];
  }
}

export function saveGoalToHistory(goal: DayGoal): boolean {
  try {
    const history = getHistory();
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
    const history = getHistory().filter((item) => item.id !== id);
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

  if (getHistory().length > 0) return true;
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(sampleGoals));
    return true;
  } catch (e) {
    console.error('Błąd zapisu przykładowych danych', e);
    return false;
  }
}

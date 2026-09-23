import { DayGoal } from '../types';

const STORAGE_KEYS = {
  CURRENT_GOAL: 'jeden_cel_dziennie_current',
  HISTORY: 'jeden_cel_dziennie_history',
  THEME: 'jeden_cel_dziennie_theme',
};

export function getTodayDateString(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatPolishDate(d = new Date()): string {
  try {
    return new Intl.DateTimeFormat('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

export function capitalizeFirstLetter(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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

export function saveCurrentGoal(goal: DayGoal): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_GOAL, JSON.stringify(goal));
  } catch (e) {
    console.error('Błąd zapisu aktualnego celu', e);
  }
}

export function clearCurrentGoal(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_GOAL);
  } catch (e) {
    console.error('Błąd usuwania aktualnego celu', e);
  }
}

export function getHistory(): DayGoal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    const list = JSON.parse(raw) as DayGoal[];
    // Sort descending by date
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (e) {
    console.error('Błąd odczytu historii z localStorage', e);
    return [];
  }
}

export function saveGoalToHistory(goal: DayGoal): void {
  try {
    const history = getHistory();
    // Check if goal with same id or date already exists in history
    const existingIndex = history.findIndex((h) => h.id === goal.id || h.date === goal.date);
    if (existingIndex >= 0) {
      history[existingIndex] = goal;
    } else {
      history.unshift(goal);
    }
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error('Błąd zapisu do historii', e);
  }
}

export function deleteGoalFromHistory(id: string): void {
  try {
    const history = getHistory().filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error('Błąd usuwania z historii', e);
  }
}

export function clearAllData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_GOAL);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (e) {
    console.error('Błąd czyszczenia danych', e);
  }
}

/**
 * Escapes fields for CSV according to RFC 4180
 */
function escapeCSVField(field: unknown): string {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  // If string contains comma, newline or quotes, wrap in quotes and escape internal quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Exports history list to a clean UTF-8 encoded CSV with BOM
 */
export function exportHistoryToCSV(goals: DayGoal[]): void {
  if (!goals || goals.length === 0) {
    return;
  }

  const headers = [
    'Data',
    'Dzień tygodnia',
    'Najważniejszy cel',
    'Czy cel osiągnięto?',
    'Postęp (%)',
    'Co pomogło?',
    'Co przeszkodziło?',
    'Status dnia',
    'Godzina utworzenia',
    'Godzina zakończenia',
  ];

  const rows = goals.map((item) => {
    let achievedText = 'W trakcie';
    if (item.achieved === true) achievedText = 'Tak';
    else if (item.achieved === false) achievedText = 'Nie';

    const dayName = item.formattedDate.split(',')[0] || '';
    const createdTime = item.createdAt ? new Date(item.createdAt).toLocaleTimeString('pl-PL') : '';
    const completedTime = item.completedAt ? new Date(item.completedAt).toLocaleTimeString('pl-PL') : '';

    return [
      escapeCSVField(item.date),
      escapeCSVField(dayName),
      escapeCSVField(item.goal),
      escapeCSVField(achievedText),
      escapeCSVField(`${item.progress}%`),
      escapeCSVField(item.helped || ''),
      escapeCSVField(item.hindered || ''),
      escapeCSVField(item.status === 'completed' ? 'Zakończony' : 'W toku'),
      escapeCSVField(createdTime),
      escapeCSVField(completedTime),
    ].join(';'); // Semicolon is the standard Excel delimiter for European/Polish locales
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCSVField).join(';'), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = getTodayDateString();
  link.setAttribute('download', `jeden-cel-dziennie-historia-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sample generator for testing and initial exploration
 */
export function seedSampleHistory(): void {
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

  const current = getHistory();
  if (current.length === 0) {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(sampleGoals));
  }
}

function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return getTodayDateString(d);
}

export function calculateStats(history: DayGoal[]) {
  const completed = history.filter((h) => h.status === 'completed');
  const achieved = completed.filter((h) => h.achieved === true);
  const totalDays = completed.length;
  const rate = totalDays > 0 ? Math.round((achieved.length / totalDays) * 100) : 0;

  return {
    totalDays,
    achievedCount: achieved.length,
    successRate: rate,
  };
}

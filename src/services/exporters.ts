import { DayGoal } from '../types';
import { getTodayDateString } from './dates';
import { getHistory, getStoredCurrentGoal } from './storage';

function downloadFile(content: string, type: string, filename: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Zamienia wartość na pole CSV zgodne z RFC 4180: zawsze w cudzysłowie,
 * z podwojonymi cudzysłowami wewnątrz.
 */
function escapeCSVField(field: unknown): string {
  if (field === null || field === undefined) return '""';
  let str = String(field);
  // Blokuje wykonanie formuły w arkuszu, gdy tekst zaczyna się od =, +, - lub @.
  if (/^[\u0000- ]*[=+@-]/.test(str)) str = `'${str}`;
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Pobiera historię jako plik CSV (UTF-8 z BOM, średnik jako separator),
 * który poprawnie otwiera się w polskim Excelu.
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

    const dayName = (item.formattedDate || item.date).split(',')[0] || '';
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
      escapeCSVField(item.status === 'completed' ? 'Zakończony' : item.status === 'abandoned' ? 'Przeniesiony' : 'W toku'),
      escapeCSVField(createdTime),
      escapeCSVField(completedTime),
    ].join(';');
  });

  const csvContent = '﻿' + [headers.map(escapeCSVField).join(';'), ...rows].join('\r\n');
  downloadFile(csvContent, 'text/csv;charset=utf-8;', `jeden-cel-dziennie-historia-${getTodayDateString()}.csv`);
}

/** Pobiera pełną kopię danych (historia i aktualny cel) jako plik JSON. */
export function exportBackup(currentGoal?: DayGoal | null): void {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    currentGoal: currentGoal ?? getStoredCurrentGoal(),
    history: getHistory(),
  };
  downloadFile(
    JSON.stringify(payload, null, 2),
    'application/json',
    `jeden-cel-dziennie-kopia-${getTodayDateString()}.json`,
  );
}

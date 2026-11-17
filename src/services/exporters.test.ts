import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportBackup, exportHistoryToCSV } from './exporters';
import { importBackup, getHistory, getStoredCurrentGoal, saveGoalToHistory } from './storage';
import { makeGoal } from './testFactories';

const BOM = '﻿';
const HEADERS =
  '"Data";"Dzień tygodnia";"Najważniejszy cel";"Czy cel osiągnięto?";"Postęp (%)";' +
  '"Co pomogło?";"Co przeszkodziło?";"Status dnia";"Godzina utworzenia";"Godzina zakończenia"';

interface Download {
  blob: Blob;
  filename: string;
}

// Przechwytuje plik, który aplikacja chce pobrać, zamiast go zapisywać.
function captureDownloads(): Download[] {
  const downloads: Download[] = [];
  const blobs: Blob[] = [];
  URL.createObjectURL = vi.fn((blob: Blob) => {
    blobs.push(blob);
    return `blob:test-${blobs.length}`;
  });
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push({ blob: blobs[blobs.length - 1], filename: this.getAttribute('download') ?? '' });
  });
  return downloads;
}

async function readText(blob: Blob): Promise<string> {
  // Blob.text() zdejmuje BOM przy dekodowaniu, więc czytamy surowe bajty.
  return new TextDecoder('utf-8', { ignoreBOM: true }).decode(await blob.arrayBuffer());
}

function splitRows(csv: string): string[] {
  return csv.split('\r\n');
}

beforeEach(() => {
  localStorage.clear();
});

describe('exportHistoryToCSV', () => {
  it('tworzy plik UTF-8 z BOM, polskimi nagłówkami, średnikami i końcami linii CRLF', async () => {
    const downloads = captureDownloads();
    exportHistoryToCSV([makeGoal()]);

    expect(downloads).toHaveLength(1);
    expect(downloads[0].blob.type).toBe('text/csv;charset=utf-8;');
    expect(downloads[0].filename).toMatch(/^jeden-cel-dziennie-historia-\d{4}-\d{2}-\d{2}\.csv$/);

    const csv = await readText(downloads[0].blob);
    expect(csv.startsWith(BOM)).toBe(true);
    const rows = splitRows(csv.slice(1));
    expect(rows[0]).toBe(HEADERS);
    expect(rows).toHaveLength(2);
  });

  it('zapisuje każdy wiersz jako 10 pól w cudzysłowach', async () => {
    const downloads = captureDownloads();
    exportHistoryToCSV([
      makeGoal({
        date: '2026-11-13',
        formattedDate: 'Piątek, 13 listopada 2026',
        goal: 'Cel',
        progress: 75,
        status: 'completed',
        achieved: true,
        helped: 'Cisza',
        hindered: 'Telefon',
      }),
    ]);
    const row = splitRows((await readText(downloads[0].blob)).slice(1))[1];
    const fields = row.split(';');
    expect(fields).toHaveLength(10);
    expect(fields.slice(0, 8)).toEqual([
      '"2026-11-13"',
      '"Piątek"',
      '"Cel"',
      '"Tak"',
      '"75%"',
      '"Cisza"',
      '"Telefon"',
      '"Zakończony"',
    ]);
  });

  it.each([
    [true, 'completed', '"Tak"', '"Zakończony"'],
    [false, 'completed', '"Nie"', '"Zakończony"'],
    [undefined, 'abandoned', '"W trakcie"', '"Przeniesiony"'],
    [undefined, 'in_progress', '"W trakcie"', '"W toku"'],
  ] as const)('achieved=%s, status=%s → %s i %s', async (achieved, status, achievedText, statusText) => {
    const downloads = captureDownloads();
    exportHistoryToCSV([makeGoal({ achieved, status })]);
    const fields = splitRows((await readText(downloads[0].blob)).slice(1))[1].split(';');
    expect(fields[3]).toBe(achievedText);
    expect(fields[7]).toBe(statusText);
  });

  it('bezpiecznie zapisuje cudzysłowy, średniki i nowe linie', async () => {
    const downloads = captureDownloads();
    exportHistoryToCSV([makeGoal({ goal: 'Powiedz "tak"; potem\nodpocznij' })]);
    const csv = await readText(downloads[0].blob);
    expect(csv).toContain('"Powiedz ""tak""; potem\nodpocznij"');
  });

  it.each(['=SUMA(A1:A2)', '+48 123', '-5', '@cmd', ' =ukryta'])(
    'blokuje formułę arkusza na początku tekstu: %s',
    async (text) => {
      const downloads = captureDownloads();
      exportHistoryToCSV([makeGoal({ goal: text })]);
      const fields = splitRows((await readText(downloads[0].blob)).slice(1))[1].split(';');
      expect(fields[2]).toBe(`"'${text}"`);
    },
  );

  it('nie zmienia zwykłego tekstu z myślnikiem w środku', async () => {
    const downloads = captureDownloads();
    exportHistoryToCSV([makeGoal({ goal: 'Plan A-B' })]);
    const fields = splitRows((await readText(downloads[0].blob)).slice(1))[1].split(';');
    expect(fields[2]).toBe('"Plan A-B"');
  });

  it('przy pustej historii nie pobiera żadnego pliku', () => {
    const downloads = captureDownloads();
    exportHistoryToCSV([]);
    expect(downloads).toHaveLength(0);
  });
});

describe('exportBackup', () => {
  it('zapisuje kopię w wersji 1 z historią i aktualnym celem', async () => {
    const history = makeGoal({ id: 'h1', status: 'completed', achieved: false });
    const current = makeGoal({ id: 'c1' });
    saveGoalToHistory(history);
    const downloads = captureDownloads();

    exportBackup(current);

    expect(downloads[0].blob.type).toBe('application/json');
    expect(downloads[0].filename).toMatch(/^jeden-cel-dziennie-kopia-\d{4}-\d{2}-\d{2}\.json$/);
    const payload = JSON.parse(await readText(downloads[0].blob));
    expect(Object.keys(payload)).toEqual(['version', 'exportedAt', 'currentGoal', 'history']);
    expect(payload.version).toBe(1);
    expect(payload.currentGoal).toEqual(current);
    expect(payload.history).toEqual([history]);
  });

  it('eksport, a potem import kopii przywraca te same dane', async () => {
    const history = [
      makeGoal({ id: 'h2', date: '2026-11-12', status: 'completed', achieved: true, progress: 100 }),
      makeGoal({ id: 'h1', date: '2026-11-11', status: 'abandoned', progress: 25 }),
    ];
    history.forEach(saveGoalToHistory);
    const current = makeGoal({ id: 'c1', helped: 'Kawa', hindered: 'Spotkania' });
    const downloads = captureDownloads();
    exportBackup(current);

    localStorage.clear();
    const json = await readText(downloads[0].blob);
    await importBackup(new File([json], 'kopia.json', { type: 'application/json' }));

    expect(getHistory()).toEqual(history);
    expect(getStoredCurrentGoal()).toEqual(current);
  });
});

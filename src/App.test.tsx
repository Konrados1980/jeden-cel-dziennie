import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { getDaysAgo } from './services/dates';
import { makeGoal } from './services/testFactories';

const CURRENT_KEY = 'jeden_cel_dziennie_current';
const HISTORY_KEY = 'jeden_cel_dziennie_history';

function storedHistory() {
  return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
}

// Przechwytuje pobierany plik CSV zamiast go zapisywać.
function captureDownloads(): Blob[] {
  const blobs: Blob[] = [];
  URL.createObjectURL = vi.fn((blob: Blob) => {
    blobs.push(blob);
    return 'blob:test';
  });
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  return blobs;
}

async function readCsvRows(blob: Blob): Promise<string[]> {
  const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(await blob.arrayBuffer());
  return text.slice(1).split('\r\n');
}

async function startDay(user: ReturnType<typeof userEvent.setup>, goal: string) {
  await user.type(screen.getByRole('textbox', { name: 'Najważniejszy cel na dziś' }), goal);
  await user.click(screen.getByRole('button', { name: 'Zaczynam dziś' }));
}

async function finishDay(
  user: ReturnType<typeof userEvent.setup>,
  { progress, answer, helped }: { progress: string; answer: 'Tak' | 'Nie'; helped?: string },
) {
  await user.click(screen.getByRole('button', { name: progress }));
  await user.click(screen.getByRole('button', { name: 'Podsumuj i zakończ dzień' }));
  await user.click(screen.getByRole('button', { name: answer }));
  if (helped) await user.type(screen.getByLabelText(/Co pomogło/), helped);
  await user.click(screen.getByRole('button', { name: 'Zakończ dzień' }));
}

function openHistory() {
  return within(screen.getByRole('banner')).getByRole('button', { name: /Historia/ });
}

describe('przepływ: cel → postęp → refleksja → historia → CSV', () => {
  it('„Tak” przy 75% zapisuje dzień jako osiągnięty na 100%', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Jaki jest Twój najważniejszy cel na dziś?' })).toBeTruthy();

    await startDay(user, 'Napisać testy przepływu');
    expect(screen.getByRole('heading', { name: 'Napisać testy przepływu' })).toBeTruthy();

    await finishDay(user, { progress: '75%', answer: 'Tak', helped: 'Wyłączony telefon' });
    expect(screen.getByRole('heading', { name: 'Cel osiągnięty! Świetna robota.' })).toBeTruthy();
    expect(screen.getByText('Postęp: 100%')).toBeTruthy();
    expect(screen.getByText('Wyłączony telefon')).toBeTruthy();

    const [day] = storedHistory();
    expect(day).toMatchObject({ goal: 'Napisać testy przepływu', status: 'completed', achieved: true, progress: 100 });
    expect(within(openHistory()).getByText('1')).toBeTruthy();
  });

  it('„Nie” przy 25% kończy dzień, a historia i CSV to pokazują', async () => {
    const user = userEvent.setup();
    const downloads = captureDownloads();
    render(<App />);

    await startDay(user, 'Zbyt szeroki cel');
    await finishDay(user, { progress: '25%', answer: 'Nie' });
    expect(screen.getByRole('heading', { name: 'Dzień zakończony.' })).toBeTruthy();
    expect(screen.getByText('Postęp: 25%')).toBeTruthy();

    await user.click(openHistory());
    const dialog = screen.getByRole('dialog', { name: 'Historia Twoich celów' });
    expect(within(dialog).getByRole('heading', { name: 'Zbyt szeroki cel' })).toBeTruthy();
    expect(within(dialog).getByText('Nieosiągnięty')).toBeTruthy();
    expect(within(dialog).getByText('Skuteczność').nextElementSibling?.textContent).toBe('0%');
    await user.click(within(dialog).getByRole('button', { name: 'Zamknij historię' }));

    await user.click(screen.getByRole('button', { name: 'Eksportuj historię do CSV' }));
    const rows = await readCsvRows(downloads[0]);
    expect(rows).toHaveLength(2);
    const fields = rows[1].split(';');
    expect(fields).toHaveLength(10);
    expect(fields.slice(2, 5)).toEqual(['"Zbyt szeroki cel"', '"Nie"', '"25%"']);
    expect(fields[7]).toBe('"Zakończony"');
  });

  it('po ponownym otwarciu aplikacja wraca do tego samego etapu', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await startDay(user, 'Cel na cały dzień');
    await user.click(screen.getByRole('button', { name: '50%' }));
    unmount();

    render(<App />);
    expect(screen.getByRole('heading', { name: 'Cel na cały dzień' })).toBeTruthy();
    expect(screen.getByText('50%', { selector: 'span' })).toBeTruthy();
  });

  it('pozwala zmienić treść celu bez utraty postępu', async () => {
    const user = userEvent.setup();
    render(<App />);
    await startDay(user, 'Pierwsza wersja');
    await user.click(screen.getByRole('button', { name: '75%' }));
    await user.click(screen.getByRole('button', { name: 'Zmień treść' }));

    const textbox = screen.getByRole('textbox', { name: 'Najważniejszy cel na dziś' });
    await user.clear(textbox);
    await user.type(textbox, 'Druga wersja{Enter}');
    expect(screen.getByRole('heading', { name: 'Druga wersja' })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(CURRENT_KEY)!)).toMatchObject({ goal: 'Druga wersja', progress: 75 });
  });

  it('„Ustaw nowy cel” wraca do wpisywania i zostawia historię', async () => {
    const user = userEvent.setup();
    render(<App />);
    await startDay(user, 'Pierwszy cel');
    await finishDay(user, { progress: '100%', answer: 'Tak' });
    await user.click(screen.getByRole('button', { name: 'Ustaw nowy cel' }));

    expect(screen.getByRole('heading', { name: 'Jaki jest Twój najważniejszy cel na dziś?' })).toBeTruthy();
    expect(localStorage.getItem(CURRENT_KEY)).toBeNull();
    expect(storedHistory()).toHaveLength(1);
  });

  it('niedokończony cel z wczoraj trafia do historii jako przeniesiony', () => {
    localStorage.setItem(CURRENT_KEY, JSON.stringify(makeGoal({ id: 'wczoraj', date: getDaysAgo(1), goal: 'Wczorajszy cel' })));
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Jaki jest Twój najważniejszy cel na dziś?' })).toBeTruthy();
    expect(storedHistory()).toMatchObject([{ id: 'wczoraj', status: 'abandoned' }]);
    expect(localStorage.getItem(CURRENT_KEY)).toBeNull();
  });

  it('szybki eksport bez danych otwiera historię', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(within(screen.getByRole('contentinfo')).getByRole('button', { name: 'Pobierz CSV' }));
    expect(screen.getByRole('dialog', { name: 'Historia Twoich celów' })).toBeTruthy();
  });

  it('gdy brakuje miejsca, pokazuje komunikat, który można zamknąć', async () => {
    const user = userEvent.setup();
    render(<App />);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Brak miejsca', 'QuotaExceededError');
    });

    await startDay(user, 'Cel bez miejsca');
    expect(screen.getByRole('alert').textContent).toContain('Nie udało się zapisać celu');
    await user.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Zamknij' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('uszkodzone dane trafiają do kopii, a użytkownik dostaje komunikat', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(HISTORY_KEY, 'zepsute[');
    render(<App />);

    expect(screen.getByRole('alert').textContent).toContain('Część zapisanych danych była nieczytelna');
    expect(localStorage.getItem(`${HISTORY_KEY}_corrupted_backup`)).toBe('zepsute[');
  });
});

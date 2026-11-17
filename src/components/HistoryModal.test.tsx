import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryModal } from './HistoryModal';
import { DayGoal } from '../types';
import { getHistory, saveGoalToHistory } from '../services/storage';
import { makeGoal } from '../services/testFactories';

function setup(history: DayGoal[], isOpen = true) {
  history.forEach(saveGoalToHistory);
  const onClose = vi.fn();
  const onRefresh = vi.fn();
  render(
    <HistoryModal isOpen={isOpen} onClose={onClose} history={getHistory()} currentGoal={null} onRefresh={onRefresh} />,
  );
  return { onClose, onRefresh, user: userEvent.setup() };
}

const days = [
  makeGoal({ id: 'a', date: '2026-11-15', goal: 'Osiągnięty dzień', status: 'completed', achieved: true, progress: 100, helped: 'Cisza' }),
  makeGoal({ id: 'b', date: '2026-11-14', goal: 'Nieosiągnięty dzień', status: 'completed', achieved: false, progress: 40 }),
  makeGoal({ id: 'c', date: '2026-11-13', goal: 'Przeniesiony dzień', status: 'abandoned', progress: 25 }),
];

describe('HistoryModal', () => {
  it('zamknięte okno nic nie pokazuje', () => {
    setup([], false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('pusta historia pokazuje wyjaśnienie', () => {
    setup([]);
    expect(screen.getByText('Brak zapisanych dni w historii')).toBeTruthy();
  });

  it('pokazuje wpisy, ich stan i statystyki', () => {
    setup(days);
    const dialog = screen.getByRole('dialog', { name: 'Historia Twoich celów' });
    expect(within(dialog).getAllByRole('heading', { level: 4 }).map((h) => h.textContent)).toEqual([
      'Osiągnięty dzień',
      'Nieosiągnięty dzień',
      'Przeniesiony dzień',
    ]);
    expect(within(dialog).getByText('Osiągnięty')).toBeTruthy();
    expect(within(dialog).getByText('Nieosiągnięty')).toBeTruthy();
    expect(within(dialog).getByText('Przeniesiony z poprzedniego dnia')).toBeTruthy();
    expect(within(dialog).getByText('Cisza')).toBeTruthy();
    // Statystyki liczą tylko zakończone dni: 2 dni, 1 osiągnięty, 50%.
    expect(within(dialog).getByText('Zapisane dni').nextElementSibling?.textContent).toBe('2');
    expect(within(dialog).getByText('Osiągnięte').nextElementSibling?.textContent).toBe('1');
    expect(within(dialog).getByText('Skuteczność').nextElementSibling?.textContent).toBe('50%');
  });

  it('usuwa wpis dopiero po potwierdzeniu', async () => {
    const { user, onRefresh } = setup(days);
    await user.click(screen.getAllByRole('button', { name: 'Usuń wpis' })[0]);
    await user.click(screen.getByRole('button', { name: 'Anuluj' }));
    expect(getHistory()).toHaveLength(3);

    await user.click(screen.getAllByRole('button', { name: 'Usuń wpis' })[0]);
    await user.click(screen.getByRole('button', { name: 'Usuń' }));
    expect(getHistory().map((g) => g.id)).toEqual(['b', 'c']);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('gdy usunięcie się nie uda, pokazuje komunikat i zostawia wpis', async () => {
    const { user } = setup(days);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Brak miejsca', 'QuotaExceededError');
    });
    await user.click(screen.getAllByRole('button', { name: 'Usuń wpis' })[0]);
    await user.click(screen.getByRole('button', { name: 'Usuń' }));
    expect(screen.getByRole('alert').textContent).toContain('Nie udało się usunąć wpisu');
    expect(getHistory()).toHaveLength(3);
  });

  it('odrzuca wadliwą kopię JSON z komunikatem i nie rusza danych', async () => {
    const { user, onRefresh } = setup(days);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const file = new File(['{"version":2}'], 'kopia.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Wybierz kopię zapasową JSON'), file);
    expect((await screen.findByRole('alert')).textContent).toContain('nieobsługiwany format');
    expect(getHistory()).toHaveLength(3);
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('rezygnacja z przywracania kopii niczego nie zmienia', async () => {
    const { user, onRefresh } = setup(days);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const backup = { version: 1, currentGoal: null, history: [] };
    const file = new File([JSON.stringify(backup)], 'kopia.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Wybierz kopię zapasową JSON'), file);
    expect(getHistory()).toHaveLength(3);
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('przywraca poprawną kopię po potwierdzeniu', async () => {
    const { user, onRefresh } = setup(days);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const backup = { version: 1, currentGoal: null, history: [days[1]] };
    const file = new File([JSON.stringify(backup)], 'kopia.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Wybierz kopię zapasową JSON'), file);
    await vi.waitFor(() => expect(onRefresh).toHaveBeenCalled());
    expect(getHistory().map((g) => g.id)).toEqual(['b']);
  });

  it('zamyka się przyciskiem i klawiszem Escape', async () => {
    const { user, onClose } = setup([]);
    await user.click(screen.getByRole('button', { name: 'Zamknij historię' }));
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

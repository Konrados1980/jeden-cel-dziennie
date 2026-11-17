import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DayCompleted } from './DayCompleted';
import { DayGoal } from '../types';
import { makeGoal } from '../services/testFactories';

function setup(overrides: Partial<DayGoal>) {
  const props = {
    goal: makeGoal({ status: 'completed', ...overrides }),
    onEditReview: vi.fn(),
    onStartNewDay: vi.fn(),
    onOpenHistory: vi.fn(),
    onExportCSV: vi.fn(),
  };
  render(<DayCompleted {...props} />);
  return { ...props, user: userEvent.setup() };
}

describe('DayCompleted', () => {
  it('gratuluje osiągniętego celu i pokazuje refleksję', () => {
    setup({ achieved: true, progress: 100, helped: 'Cisza', hindered: 'Telefon' });
    expect(screen.getByRole('heading', { name: 'Cel osiągnięty! Świetna robota.' })).toBeTruthy();
    expect(screen.getByText('Postęp: 100%')).toBeTruthy();
    expect(screen.getByText('Cisza')).toBeTruthy();
    expect(screen.getByText('Telefon')).toBeTruthy();
  });

  it('przy nieosiągniętym celu pokazuje spokojny komunikat', () => {
    setup({ achieved: false, progress: 25 });
    expect(screen.getByRole('heading', { name: 'Dzień zakończony.' })).toBeTruthy();
    expect(screen.getByText('Postęp: 25%')).toBeTruthy();
    expect(screen.queryByText('Co pomogło:')).toBeNull();
  });

  it('przyciski wywołują swoje akcje', async () => {
    const { user, onEditReview, onStartNewDay, onOpenHistory, onExportCSV } = setup({ achieved: true });
    await user.click(screen.getByRole('button', { name: 'Edytuj dzisiejsze podsumowanie' }));
    await user.click(screen.getByRole('button', { name: 'Ustaw nowy cel' }));
    await user.click(screen.getByRole('button', { name: 'Zobacz historię' }));
    await user.click(screen.getByRole('button', { name: 'Eksportuj historię do CSV' }));
    expect(onEditReview).toHaveBeenCalledOnce();
    expect(onStartNewDay).toHaveBeenCalledOnce();
    expect(onOpenHistory).toHaveBeenCalledOnce();
    expect(onExportCSV).toHaveBeenCalledOnce();
  });
});

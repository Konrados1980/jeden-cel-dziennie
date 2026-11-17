import { DayGoal } from '../types';

/** Rekord DayGoal do testów; nadpisz tylko pola istotne dla danego przypadku. */
export function makeGoal(overrides: Partial<DayGoal> = {}): DayGoal {
  return {
    id: 'goal-1',
    date: '2026-11-13',
    formattedDate: 'Piątek, 13 listopada 2026',
    goal: 'Napisać testy',
    progress: 50,
    status: 'in_progress',
    createdAt: '2026-11-13T08:00:00.000Z',
    ...overrides,
  };
}

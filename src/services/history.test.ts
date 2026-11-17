import { describe, expect, it } from 'vitest';
import { calculateStats, mergeCurrentGoal } from './history';
import { makeGoal } from './testFactories';

describe('calculateStats', () => {
  it('liczy tylko zakończone dni i zaokrągla skuteczność', () => {
    const history = [
      makeGoal({ id: 'a', status: 'completed', achieved: true }),
      makeGoal({ id: 'b', status: 'completed', achieved: false }),
      makeGoal({ id: 'c', status: 'completed', achieved: true }),
      makeGoal({ id: 'd', status: 'abandoned' }),
      makeGoal({ id: 'e', status: 'in_progress' }),
    ];
    expect(calculateStats(history)).toEqual({ totalDays: 3, achievedCount: 2, successRate: 67 });
  });

  it('dla pustej historii zwraca zera zamiast dzielenia przez zero', () => {
    expect(calculateStats([])).toEqual({ totalDays: 0, achievedCount: 0, successRate: 0 });
  });
});

describe('mergeCurrentGoal', () => {
  const history = [makeGoal({ id: 'a', goal: 'Stary' }), makeGoal({ id: 'b' })];

  it('bez bieżącego celu zwraca kopię historii', () => {
    const merged = mergeCurrentGoal(history, null);
    expect(merged).toEqual(history);
    expect(merged).not.toBe(history);
  });

  it('podmienia zapisaną wersję tego samego celu w miejscu', () => {
    const current = makeGoal({ id: 'a', goal: 'Nowy' });
    const merged = mergeCurrentGoal(history, current);
    expect(merged.map((g) => g.goal)).toEqual(['Nowy', history[1].goal]);
    expect(history[0].goal).toBe('Stary');
  });

  it('dopisuje nowy cel na początku', () => {
    const current = makeGoal({ id: 'z' });
    expect(mergeCurrentGoal(history, current).map((g) => g.id)).toEqual(['z', 'a', 'b']);
  });
});

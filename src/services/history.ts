import { DayGoal } from '../types';

/**
 * Zwraca historię z aktualnym celem: podmienia jego zapisaną wersję
 * albo dopisuje go na początku, jeśli dzień nie jest jeszcze zakończony.
 */
export function mergeCurrentGoal(history: DayGoal[], currentGoal: DayGoal | null): DayGoal[] {
  const merged = [...history];
  if (!currentGoal) return merged;

  const index = merged.findIndex((item) => item.id === currentGoal.id);
  if (index >= 0) merged[index] = currentGoal;
  else merged.unshift(currentGoal);
  return merged;
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

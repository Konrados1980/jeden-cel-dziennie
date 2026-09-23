export type DayStatus = 'in_progress' | 'completed' | 'abandoned';

export interface DayGoal {
  id: string; // YYYY-MM-DD or unique id
  date: string; // ISO date string YYYY-MM-DD
  formattedDate: string; // readable Polish date, e.g. "Środa, 23 września 2026"
  goal: string;
  progress: number; // 0 to 100
  status: DayStatus;
  achieved?: boolean; // true = Tak, false = Nie
  helped?: string; // Co pomogło
  hindered?: string; // Co przeszkodziło
  completedAt?: string; // ISO timestamp
  createdAt: string; // ISO timestamp
  notes?: string;
}

export type AppStage = 'setup' | 'active' | 'review' | 'completed';

export type DayStatus = 'in_progress' | 'completed' | 'abandoned';

export interface DayGoal {
  id: string; // unikalny identyfikator, np. "goal-1727078400000"
  date: string; // data lokalna w formacie RRRR-MM-DD
  formattedDate: string; // data po polsku, np. "Środa, 23 września 2026"
  goal: string;
  progress: number; // od 0 do 100
  status: DayStatus;
  achieved?: boolean; // true = Tak, false = Nie, brak = jeszcze bez podsumowania
  helped?: string; // Co pomogło
  hindered?: string; // Co przeszkodziło
  completedAt?: string; // znacznik czasu ISO
  createdAt: string; // znacznik czasu ISO
  notes?: string; // obecnie nieużywane; część formatu danych, nie usuwać bez migracji
}

export type AppStage = 'setup' | 'active' | 'review' | 'completed';

import { useState } from 'react';
import { useDayGoal } from './hooks/useDayGoal';
import { Header } from './components/Header';
import { GoalInput } from './components/GoalInput';
import { ActiveGoal } from './components/ActiveGoal';
import { DayReview } from './components/DayReview';
import { DayCompleted } from './components/DayCompleted';
import { HistoryModal } from './components/HistoryModal';

export default function App() {
  const {
    currentGoal,
    stage,
    history,
    editGoalMode,
    storageError,
    reload,
    setGoal,
    updateProgress,
    completeGoal,
    finishDay,
    startNewDay,
    exportCSV,
    startEditingGoal,
    startReview,
    backToGoal,
    dismissError,
  } = useDayGoal();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Gdy nie ma jeszcze danych do eksportu, pokazujemy historię z wyjaśnieniem.
  const handleQuickExport = () => {
    if (!exportCSV()) setIsHistoryOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onQuickExport={handleQuickExport}
        historyCount={history.length}
      />

      <main className="flex-1 flex flex-col justify-center px-4 sm:px-6">
        {storageError && (
          <div
            role="alert"
            className="mx-auto mt-4 max-w-xl rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
          >
            {storageError}
            <button type="button" onClick={dismissError} className="ml-3 underline">
              Zamknij
            </button>
          </div>
        )}
        {/* Etap 1: wpisanie lub edycja celu */}
        {(stage === 'setup' || editGoalMode) && (
          <GoalInput
            onSetGoal={setGoal}
            initialValue={currentGoal?.goal || ''}
          />
        )}

        {/* Etap 2: aktywny cel z suwakiem postępu */}
        {stage === 'active' && !editGoalMode && currentGoal && (
          <ActiveGoal
            goal={currentGoal}
            onUpdateProgress={updateProgress}
            onCompleteGoal={completeGoal}
            onStartReview={startReview}
            onEditGoalText={startEditingGoal}
          />
        )}

        {/* Etap 3: wieczorne podsumowanie */}
        {stage === 'review' && currentGoal && (
          <DayReview
            goal={currentGoal}
            onFinishDay={finishDay}
            onBackToGoal={backToGoal}
          />
        )}

        {/* Etap 4: dzień zakończony */}
        {stage === 'completed' && currentGoal && (
          <DayCompleted
            goal={currentGoal}
            onEditReview={startReview}
            onStartNewDay={startNewDay}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onExportCSV={handleQuickExport}
          />
        )}
      </main>

      <footer className="w-full border-t border-stone-200/60 py-4 px-6 text-center text-xs text-stone-600 bg-white/50">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Jeden cel dziennie • Skupienie i spokój dla twórców</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="hover:text-stone-900 cursor-pointer"
            >
              Historia celów
            </button>
            <span>•</span>
            <button
              onClick={handleQuickExport}
              className="hover:text-stone-900 cursor-pointer"
            >
              Pobierz CSV
            </button>
          </div>
        </div>
      </footer>

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        currentGoal={currentGoal}
        onRefresh={reload}
      />
    </div>
  );
}

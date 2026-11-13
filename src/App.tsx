import { useState, useEffect, useCallback } from 'react';
import { AppStage, DayGoal } from './types';
import {
  getStoredCurrentGoal,
  saveCurrentGoal,
  clearCurrentGoal,
  getHistory,
  saveGoalToHistory,
  exportHistoryToCSV,
  getTodayDateString,
  formatPolishDate,
  capitalizeFirstLetter,
} from './services/storage';
import { Header } from './components/Header';
import { GoalInput } from './components/GoalInput';
import { ActiveGoal } from './components/ActiveGoal';
import { DayReview } from './components/DayReview';
import { DayCompleted } from './components/DayCompleted';
import { HistoryModal } from './components/HistoryModal';

export default function App() {
  const [currentGoal, setCurrentGoal] = useState<DayGoal | null>(null);
  const [stage, setStage] = useState<AppStage>('setup');
  const [history, setHistory] = useState<DayGoal[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editGoalMode, setEditGoalMode] = useState(false);
  const [storageError, setStorageError] = useState('');

  // Wczytuje dane z localStorage i archiwizuje cel z poprzedniego dnia.
  const loadData = useCallback(() => {
    const storedGoal = getStoredCurrentGoal();
    if (storedGoal && storedGoal.date < getTodayDateString()) {
      const archivedGoal: DayGoal = storedGoal.status === 'completed'
        ? storedGoal
        : { ...storedGoal, status: 'abandoned', completedAt: new Date().toISOString() };
      const saved = saveGoalToHistory(archivedGoal);
      const cleared = clearCurrentGoal();
      if (!saved || !cleared) setStorageError('Nie udało się bezpiecznie zamknąć celu z poprzedniego dnia. Zrób kopię danych i sprawdź miejsce w przeglądarce.');
      setCurrentGoal(null);
      setStage('setup');
    } else if (storedGoal && storedGoal.date === getTodayDateString()) {
      setCurrentGoal(storedGoal);
      if (storedGoal.status === 'completed') {
        setStage('completed');
      } else {
        setStage('active');
      }
    } else {
      if (storedGoal) clearCurrentGoal();
      setCurrentGoal(null);
      setStage('setup');
    }
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const refresh = () => loadData();
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [loadData]);

  const handleSetGoal = (goalText: string) => {
    const now = new Date();
    const todayStr = getTodayDateString(now);

    const updatedGoal: DayGoal = {
      id: currentGoal?.id || `goal-${Date.now()}`,
      date: currentGoal?.date || todayStr,
      formattedDate: capitalizeFirstLetter(formatPolishDate(now)),
      goal: goalText,
      progress: currentGoal?.progress || 0,
      status: 'in_progress',
      createdAt: currentGoal?.createdAt || now.toISOString(),
    };

    setCurrentGoal(updatedGoal);
    if (!saveCurrentGoal(updatedGoal)) setStorageError('Nie udało się zapisać celu. Sprawdź wolne miejsce w przeglądarce.');
    setEditGoalMode(false);
    setStage('active');
  };

  const handleUpdateProgress = (progress: number) => {
    if (!currentGoal) return;
    const updated: DayGoal = {
      ...currentGoal,
      progress,
    };
    setCurrentGoal(updated);
    if (!saveCurrentGoal(updated)) setStorageError('Nie udało się zapisać postępu. Zmiany mogą zniknąć po zamknięciu strony.');
  };

  const handleCompleteGoal = () => {
    if (!currentGoal) return;
    const updated: DayGoal = {
      ...currentGoal,
      progress: 100,
      achieved: true,
    };
    setCurrentGoal(updated);
    if (!saveCurrentGoal(updated)) setStorageError('Nie udało się zapisać celu. Sprawdź wolne miejsce w przeglądarce.');
    // Od razu przechodzimy do wieczornego podsumowania.
    setStage('review');
  };

  const handleFinishDay = ({
    achieved,
    helped,
    hindered,
  }: {
    achieved: boolean;
    helped: string;
    hindered: string;
  }) => {
    if (!currentGoal) return;

    const completedGoal: DayGoal = {
      ...currentGoal,
      status: 'completed',
      achieved,
      progress: achieved ? 100 : currentGoal.progress,
      helped,
      hindered,
      completedAt: new Date().toISOString(),
    };

    setCurrentGoal(completedGoal);
    const currentSaved = saveCurrentGoal(completedGoal);
    const historySaved = saveGoalToHistory(completedGoal);
    if (!currentSaved || !historySaved) setStorageError('Nie udało się zapisać podsumowania. Zrób kopię danych i sprawdź wolne miejsce w przeglądarce.');

    setHistory(getHistory());
    setStage('completed');
  };

  const handleStartNewDay = () => {
    if (!clearCurrentGoal()) setStorageError('Nie udało się wyczyścić aktywnego celu.');
    setCurrentGoal(null);
    setStage('setup');
    setEditGoalMode(false);
  };

  const handleQuickExport = () => {
    let exportList = [...history];
    if (currentGoal) {
      const currentIndex = exportList.findIndex((item) => item.id === currentGoal.id);
      if (currentIndex >= 0) exportList[currentIndex] = currentGoal;
      else exportList.unshift(currentGoal);
    }
    if (exportList.length > 0) {
      exportHistoryToCSV(exportList);
    } else {
      setIsHistoryOpen(true);
    }
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
            <button type="button" onClick={() => setStorageError('')} className="ml-3 underline">
              Zamknij
            </button>
          </div>
        )}
        {/* Etap 1: wpisanie lub edycja celu */}
        {(stage === 'setup' || editGoalMode) && (
          <GoalInput
            onSetGoal={handleSetGoal}
            initialValue={currentGoal?.goal || ''}
          />
        )}

        {/* Etap 2: aktywny cel z suwakiem postępu */}
        {stage === 'active' && !editGoalMode && currentGoal && (
          <ActiveGoal
            goal={currentGoal}
            onUpdateProgress={handleUpdateProgress}
            onCompleteGoal={handleCompleteGoal}
            onStartReview={() => setStage('review')}
            onEditGoalText={() => setEditGoalMode(true)}
          />
        )}

        {/* Etap 3: wieczorne podsumowanie */}
        {stage === 'review' && currentGoal && (
          <DayReview
            goal={currentGoal}
            onFinishDay={handleFinishDay}
            onBackToGoal={() => setStage('active')}
          />
        )}

        {/* Etap 4: dzień zakończony */}
        {stage === 'completed' && currentGoal && (
          <DayCompleted
            goal={currentGoal}
            onEditReview={() => setStage('review')}
            onStartNewDay={handleStartNewDay}
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
        onRefresh={loadData}
      />
    </div>
  );
}

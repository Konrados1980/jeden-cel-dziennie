import React, { useState, useEffect, useCallback } from 'react';
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
import { CodexExportModal } from './components/CodexExportModal';

export default function App() {
  const [currentGoal, setCurrentGoal] = useState<DayGoal | null>(null);
  const [stage, setStage] = useState<AppStage>('setup');
  const [history, setHistory] = useState<DayGoal[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCodexModalOpen, setIsCodexModalOpen] = useState(false);
  const [editGoalMode, setEditGoalMode] = useState(false);

  // Initialize data from localStorage on load
  const loadData = useCallback(() => {
    const storedHistory = getHistory();
    setHistory(storedHistory);

    const storedGoal = getStoredCurrentGoal();
    if (storedGoal) {
      setCurrentGoal(storedGoal);
      if (storedGoal.status === 'completed') {
        setStage('completed');
      } else {
        setStage('active');
      }
    } else {
      setStage('setup');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler: Set new goal for today
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
    saveCurrentGoal(updatedGoal);
    setEditGoalMode(false);
    setStage('active');
  };

  // Handler: Update progress slider
  const handleUpdateProgress = (progress: number) => {
    if (!currentGoal) return;
    const updated: DayGoal = {
      ...currentGoal,
      progress,
    };
    setCurrentGoal(updated);
    saveCurrentGoal(updated);
  };

  // Handler: Click "Cel osiągnięty"
  const handleCompleteGoal = () => {
    if (!currentGoal) return;
    const updated: DayGoal = {
      ...currentGoal,
      progress: 100,
      achieved: true,
    };
    setCurrentGoal(updated);
    saveCurrentGoal(updated);
    // Transition straight to evening review to capture what helped/hindered
    setStage('review');
  };

  // Handler: Finish Day (save reflection to history & mark completed)
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
      helped,
      hindered,
      completedAt: new Date().toISOString(),
    };

    setCurrentGoal(completedGoal);
    saveCurrentGoal(completedGoal);
    saveGoalToHistory(completedGoal);

    // Refresh history in state
    setHistory(getHistory());
    setStage('completed');
  };

  // Handler: Start a fresh new day / goal
  const handleStartNewDay = () => {
    clearCurrentGoal();
    setCurrentGoal(null);
    setStage('setup');
    setEditGoalMode(false);
  };

  // Handler: Quick CSV Export
  const handleQuickExport = () => {
    let exportList = [...history];
    // If history is empty but currentGoal exists, export currentGoal
    if (exportList.length === 0 && currentGoal) {
      exportList = [currentGoal];
    }
    if (exportList.length > 0) {
      exportHistoryToCSV(exportList);
    } else {
      setIsHistoryOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Top Header */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenCodexModal={() => setIsCodexModalOpen(true)}
        onQuickExport={handleQuickExport}
        historyCount={history.length}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center px-4 sm:px-6">
        {/* Stage 1: Setup / Input or Edit Goal */}
        {(stage === 'setup' || editGoalMode) && (
          <GoalInput
            onSetGoal={handleSetGoal}
            initialValue={currentGoal?.goal || ''}
          />
        )}

        {/* Stage 2: Active Goal with Progress Slider */}
        {stage === 'active' && !editGoalMode && currentGoal && (
          <ActiveGoal
            goal={currentGoal}
            onUpdateProgress={handleUpdateProgress}
            onCompleteGoal={handleCompleteGoal}
            onStartReview={() => setStage('review')}
            onEditGoalText={() => setEditGoalMode(true)}
          />
        )}

        {/* Stage 3: Evening Review (Tak/Nie, co pomogło, co przeszkodziło) */}
        {stage === 'review' && currentGoal && (
          <DayReview
            goal={currentGoal}
            onFinishDay={handleFinishDay}
            onBackToGoal={() => setStage('active')}
          />
        )}

        {/* Stage 4: Day Completed Summary */}
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

      {/* Footer */}
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
            <span>•</span>
            <button
              onClick={() => setIsCodexModalOpen(true)}
              className="hover:text-stone-900 text-amber-700 font-medium cursor-pointer"
            >
              Do Codexa
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onRefresh={loadData}
      />

      <CodexExportModal
        isOpen={isCodexModalOpen}
        onClose={() => setIsCodexModalOpen(false)}
      />
    </div>
  );
}

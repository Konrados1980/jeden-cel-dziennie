import { useState, useEffect, useCallback } from 'react';
import { AppStage, DayGoal } from '../types';
import {
  getStoredCurrentGoal,
  saveCurrentGoal,
  clearCurrentGoal,
  getHistory,
  saveGoalToHistory,
  takeCorruptionNotice,
} from '../services/storage';
import { getTodayDateString, formatPolishDate, capitalizeFirstLetter } from '../services/dates';
import { exportHistoryToCSV } from '../services/exporters';
import { mergeCurrentGoal } from '../services/history';

interface DayReviewResult {
  achieved: boolean;
  helped: string;
  hindered: string;
}

/** Przepływ dnia: aktualny cel, etap, historia i akcje na nich. Bez UI. */
export function useDayGoal() {
  const [currentGoal, setCurrentGoal] = useState<DayGoal | null>(null);
  const [stage, setStage] = useState<AppStage>('setup');
  const [history, setHistory] = useState<DayGoal[]>([]);
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
      // Cel z wczoraj usuwamy dopiero wtedy, gdy na pewno trafił do historii.
      const cleared = saved && clearCurrentGoal();
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

    const notice = takeCorruptionNotice();
    if (notice === 'backed_up') {
      setStorageError('Część zapisanych danych była nieczytelna. Odłożyliśmy ją jako kopię w przeglądarce, żeby nie zginęła, a resztę wczytaliśmy normalnie.');
    } else if (notice === 'backup_failed') {
      setStorageError('Część zapisanych danych jest nieczytelna, a kopii nie udało się zapisać. Zwolnij miejsce w przeglądarce. Do tego czasu nie zapisujemy zmian, żeby niczego nie nadpisać.');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Odświeżenie co minutę i po powrocie do karty, żeby cel z wczoraj trafił do historii.
  useEffect(() => {
    const refresh = () => loadData();
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [loadData]);

  const setGoal = (goalText: string) => {
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

  const updateProgress = (progress: number) => {
    if (!currentGoal) return;
    const updated: DayGoal = {
      ...currentGoal,
      progress,
    };
    setCurrentGoal(updated);
    if (!saveCurrentGoal(updated)) setStorageError('Nie udało się zapisać postępu. Zmiany mogą zniknąć po zamknięciu strony.');
  };

  const completeGoal = () => {
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

  const finishDay = ({ achieved, helped, hindered }: DayReviewResult) => {
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

  const startNewDay = () => {
    if (!clearCurrentGoal()) setStorageError('Nie udało się wyczyścić aktywnego celu.');
    setCurrentGoal(null);
    setStage('setup');
    setEditGoalMode(false);
  };

  /** Pobiera CSV z historią i bieżącym celem; zwraca false, gdy nie ma czego eksportować. */
  const exportCSV = (): boolean => {
    const exportList = mergeCurrentGoal(history, currentGoal);
    if (exportList.length === 0) return false;
    exportHistoryToCSV(exportList);
    return true;
  };

  return {
    currentGoal,
    stage,
    history,
    editGoalMode,
    storageError,
    reload: loadData,
    setGoal,
    updateProgress,
    completeGoal,
    finishDay,
    startNewDay,
    exportCSV,
    startEditingGoal: () => setEditGoalMode(true),
    startReview: () => setStage('review'),
    // Z edycji podsumowania zakończonego dnia wracamy na ekran zakończenia, a nie do aktywnego celu.
    backToGoal: () => setStage(currentGoal?.status === 'completed' ? 'completed' : 'active'),
    dismissError: () => setStorageError(''),
  };
}

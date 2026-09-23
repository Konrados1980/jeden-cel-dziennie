import React from 'react';
import { CheckCircle2, XCircle, Download, RotateCcw, History, Edit2, Calendar } from 'lucide-react';
import { DayGoal } from '../types';

interface DayCompletedProps {
  goal: DayGoal;
  onEditReview: () => void;
  onStartNewDay: () => void;
  onOpenHistory: () => void;
  onExportCSV: () => void;
}

export const DayCompleted: React.FC<DayCompletedProps> = ({
  goal,
  onEditReview,
  onStartNewDay,
  onOpenHistory,
  onExportCSV,
}) => {
  const isAchieved = goal.achieved === true;

  return (
    <div className="w-full max-w-xl mx-auto py-8 sm:py-12 px-4 sm:px-0">
      {/* Top Banner */}
      <div
        className={`rounded-2xl p-6 sm:p-8 text-center border mb-6 ${
          isAchieved
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-stone-100 border-stone-200 text-stone-900'
        }`}
      >
        <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3">
          {isAchieved ? (
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          ) : (
            <XCircle className="w-12 h-12 text-stone-500" />
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {isAchieved ? 'Cel osiągnięty! Świetna robota.' : 'Dzień zakończony.'}
        </h2>

        <p className="mt-2 text-sm sm:text-base max-w-md mx-auto text-stone-600">
          {isAchieved
            ? 'Dowiozłeś najważniejszy cel na dziś do końca. Czas zamknąć pracę i odpocząć.'
            : 'Nie każdy dzień idzie zgodnie z planem. Najważniejsza jest refleksja i konsekwencja jutro.'}
        </p>

        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 border border-stone-200 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-stone-500" />
          <span>{goal.formattedDate}</span>
          <span className="text-stone-300">•</span>
          <span>Postęp: {goal.progress}%</span>
        </div>
      </div>

      {/* Goal & Reflection Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4 mb-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-stone-600">
            Zrealizowany cel:
          </span>
          <p className="text-lg font-medium text-stone-900 mt-1">{goal.goal}</p>
        </div>

        {(goal.helped || goal.hindered) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100 text-sm">
            {goal.helped && (
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-150">
                <span className="text-xs font-semibold text-emerald-800 block mb-1">
                  ✓ Co pomogło:
                </span>
                <p className="text-stone-700 leading-relaxed">{goal.helped}</p>
              </div>
            )}
            {goal.hindered && (
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-150">
                <span className="text-xs font-semibold text-amber-800 block mb-1">
                  ! Co przeszkodziło:
                </span>
                <p className="text-stone-700 leading-relaxed">{goal.hindered}</p>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={onEditReview}
            className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edytuj dzisiejsze podsumowanie</span>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <button
          onClick={onExportCSV}
          className="w-full py-3.5 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm sm:text-base transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <Download className="w-4 h-4 text-stone-300" />
          <span>Eksportuj historię do CSV</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onOpenHistory}
            className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <History className="w-4 h-4 text-stone-500" />
            <span>Zobacz historię</span>
          </button>

          <button
            onClick={onStartNewDay}
            className="py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>Ustaw nowy cel</span>
          </button>
        </div>
      </div>
    </div>
  );
};

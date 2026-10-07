import React from 'react';
import { Target, History, Download } from 'lucide-react';
import { formatPolishDate, capitalizeFirstLetter } from '../services/storage';

interface HeaderProps {
  onOpenHistory: () => void;
  onQuickExport: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onQuickExport,
  historyCount,
}) => {
  const todayFormatted = capitalizeFirstLetter(formatPolishDate());

  return (
    <header className="w-full border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-stone-50 flex items-center justify-center shadow-xs">
            <Target className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="font-semibold text-stone-900 text-sm sm:text-base tracking-tight flex items-center gap-1.5">
              Jeden cel dziennie
            </h1>
            <p className="text-xs text-stone-600 hidden sm:block">
              {todayFormatted}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {historyCount > 0 && (
            <button
              onClick={onQuickExport}
              title="Szybki eksport historii do pliku CSV"
              className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-stone-500" />
              <span className="hidden md:inline">Eksport CSV</span>
            </button>
          )}

          <button
            onClick={onOpenHistory}
            className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer relative"
          >
            <History className="w-4 h-4 text-stone-500" />
            <span>Historia</span>
            {historyCount > 0 && (
              <span className="bg-stone-200 text-stone-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                {historyCount}
              </span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { X, Download, Trash2, CheckCircle2, XCircle, Clock, PlusCircle, AlertCircle } from 'lucide-react';
import { DayGoal } from '../types';
import { exportHistoryToCSV, deleteGoalFromHistory, seedSampleHistory, calculateStats } from '../services/storage';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: DayGoal[];
  onRefresh: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onRefresh,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const stats = calculateStats(history);

  const handleExport = () => {
    exportHistoryToCSV(history);
  };

  const handleDelete = (id: string) => {
    deleteGoalFromHistory(id);
    setConfirmDeleteId(null);
    onRefresh();
  };

  const handleAddSample = () => {
    seedSampleHistory();
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:px-6 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/50">
          <div>
            <h3 className="font-semibold text-lg text-stone-900">
              Historia Twoich celów
            </h3>
            <p className="text-xs text-stone-600 mt-0.5">
              Przeglądaj swoje codzienne cele, wnioski i eksportuj dane do pliku CSV
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats bar */}
        {history.length > 0 && (
          <div className="grid grid-cols-3 border-b border-stone-100 bg-stone-50/30 px-6 py-3.5 text-center">
            <div>
              <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block">
                Zapisane dni
              </span>
              <span className="text-xl font-bold text-stone-900 font-mono">
                {stats.totalDays}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block">
                Osiągnięte
              </span>
              <span className="text-xl font-bold text-emerald-700 font-mono">
                {stats.achievedCount}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider block">
                Skuteczność
              </span>
              <span className="text-xl font-bold text-stone-900 font-mono">
                {stats.successRate}%
              </span>
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="p-4 sm:px-6 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <button
            onClick={handleExport}
            disabled={history.length === 0}
            className="py-2 px-3.5 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-stone-300" />
            <span>Eksportuj do CSV (Excel / Sheets)</span>
          </button>

          {history.length === 0 && (
            <button
              onClick={handleAddSample}
              className="py-2 px-3 text-xs font-medium text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-stone-500" />
              <span>Wgraj przykładowe dane (demo)</span>
            </button>
          )}
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <Clock className="w-10 h-10 mx-auto text-stone-300 mb-3" />
              <p className="font-medium text-stone-700 text-sm">
                Brak zapisanych dni w historii
              </p>
              <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
                Gdy zakończysz dzień i wypełnisz podsumowanie, pojawi się ono tutaj. Możesz też wgrać przykładowe dane, aby przetestować eksport CSV.
              </p>
              <button
                onClick={handleAddSample}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Wczytaj 3 przykładowe dni</span>
              </button>
            </div>
          ) : (
            history.map((item) => {
              const isAchieved = item.achieved === true;
              return (
                <div
                  key={item.id}
                  className="bg-white border border-stone-200/90 rounded-xl p-4 sm:p-5 hover:border-stone-300 transition-colors space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-stone-600">
                          {item.formattedDate || item.date}
                        </span>

                        {item.achieved !== undefined ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              isAchieved
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                : 'bg-stone-100 text-stone-600 border border-stone-200'
                            }`}
                          >
                            {isAchieved ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-stone-400" />
                            )}
                            {isAchieved ? 'Osiągnięty' : 'Nieosiągnięty'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                            W trakcie
                          </span>
                        )}

                        <span className="text-[11px] font-mono font-medium text-stone-600 bg-stone-50 border border-stone-200/60 px-1.5 py-0.2 rounded">
                          {item.progress}%
                        </span>
                      </div>

                      <h4 className="text-base font-medium text-stone-900 leading-snug">
                        {item.goal}
                      </h4>
                    </div>

                    {/* Delete entry */}
                    {confirmDeleteId === item.id ? (
                      <div className="flex items-center gap-1 text-xs">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-2 py-1 bg-rose-600 text-white rounded text-[11px] hover:bg-rose-700 cursor-pointer"
                        >
                          Usuń
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 bg-stone-100 text-stone-700 rounded text-[11px] hover:bg-stone-200 cursor-pointer"
                        >
                          Anuluj
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="text-stone-300 hover:text-rose-600 p-1 rounded transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                        title="Usuń wpis"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Reflection notes if present */}
                  {(item.helped || item.hindered) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs border-t border-stone-100">
                      {item.helped && (
                        <div className="bg-stone-50/80 p-2.5 rounded-lg border border-stone-100">
                          <span className="font-semibold text-emerald-800 block mb-0.5">
                            Co pomogło:
                          </span>
                          <span className="text-stone-700">{item.helped}</span>
                        </div>
                      )}
                      {item.hindered && (
                        <div className="bg-stone-50/80 p-2.5 rounded-lg border border-stone-100">
                          <span className="font-semibold text-amber-800 block mb-0.5">
                            Co przeszkodziło:
                          </span>
                          <span className="text-stone-700">{item.hindered}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};

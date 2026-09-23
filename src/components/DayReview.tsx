import React, { useState } from 'react';
import { Check, X, ArrowLeft, Send, Sparkles } from 'lucide-react';
import { DayGoal } from '../types';
import { playChime } from '../utils/sound';

interface DayReviewProps {
  goal: DayGoal;
  onFinishDay: (data: { achieved: boolean; helped: string; hindered: string }) => void;
  onBackToGoal: () => void;
}

export const DayReview: React.FC<DayReviewProps> = ({
  goal,
  onFinishDay,
  onBackToGoal,
}) => {
  // If progress was 100%, default achieved to true, otherwise check if already set
  const [achieved, setAchieved] = useState<boolean | null>(
    goal.achieved !== undefined ? goal.achieved : goal.progress >= 100
  );
  const [helped, setHelped] = useState(goal.helped || '');
  const [hindered, setHindered] = useState(goal.hindered || '');
  const [showValidation, setShowValidation] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (achieved === null) {
      setShowValidation(true);
      return;
    }

    playChime('complete');
    onFinishDay({
      achieved,
      helped: helped.trim(),
      hindered: hindered.trim(),
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto py-8 sm:py-12 px-4 sm:px-0">
      {/* Back button */}
      <button
        type="button"
        onClick={onBackToGoal}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Wróć do widoku celu</span>
      </button>

      <div className="mb-6">
        <span className="text-xs font-semibold tracking-wider text-stone-600 uppercase">
          Wieczorne podsumowanie
        </span>
        <h2 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight mt-1">
          Podsumuj dzisiejszy dzień
        </h2>
        <div className="mt-3 p-3.5 bg-stone-100/90 rounded-xl border border-stone-200/70 text-sm text-stone-800">
          <span className="text-xs text-stone-600 block mb-0.5">Twój cel:</span>
          <span className="font-medium text-stone-900">{goal.goal}</span>
          <span className="text-xs text-stone-600 block mt-1">
            Zarejestrowany postęp: <strong>{goal.progress}%</strong>
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question: Czy udało Ci się osiągnąć dzisiejszy cel? */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-sm">
          <label className="block text-base sm:text-lg font-medium text-stone-900 mb-4">
            Czy udało Ci się osiągnąć dzisiejszy cel?
          </label>

          <div className="grid grid-cols-2 gap-3">
            {/* TAK Button */}
            <button
              type="button"
              onClick={() => {
                setAchieved(true);
                setShowValidation(false);
                playChime('tick');
              }}
              className={`py-4 px-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                achieved === true
                  ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-xs'
                  : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white hover:bg-stone-50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  achieved === true
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-100 text-stone-400'
                }`}
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="font-semibold text-base">Tak</span>
            </button>

            {/* NIE Button */}
            <button
              type="button"
              onClick={() => {
                setAchieved(false);
                setShowValidation(false);
                playChime('tick');
              }}
              className={`py-4 px-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                achieved === false
                  ? 'border-stone-800 bg-stone-100 text-stone-900 shadow-xs'
                  : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white hover:bg-stone-50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  achieved === false
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-400'
                }`}
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="font-semibold text-base">Nie</span>
            </button>
          </div>

          {showValidation && achieved === null && (
            <p className="mt-3 text-xs text-rose-600 font-medium">
              Wybierz "Tak" lub "Nie", aby móc zapisać podsumowanie.
            </p>
          )}
        </div>

        {/* Two reflection fields */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-sm space-y-5">
          {/* Co pomogło */}
          <div>
            <label className="block text-sm font-medium text-stone-900 mb-1.5">
              Co pomogło? <span className="text-xs text-stone-600 font-normal">(opcjonalne)</span>
            </label>
            <textarea
              value={helped}
              onChange={(e) => setHelped(e.target.value)}
              rows={2}
              placeholder="np. wyłączone powiadomienia, 2 godziny rano bez maili, dobra playlista..."
              className="w-full rounded-xl border border-stone-200 p-3 text-stone-900 placeholder:text-stone-400 text-sm focus:outline-hidden focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
            />
          </div>

          {/* Co przeszkodziło */}
          <div>
            <label className="block text-sm font-medium text-stone-900 mb-1.5">
              Co przeszkodziło? <span className="text-xs text-stone-600 font-normal">(opcjonalne)</span>
            </label>
            <textarea
              value={hindered}
              onChange={(e) => setHindered(e.target.value)}
              rows={2}
              placeholder="np. nagłe spotkania z klientem, rozproszenie w sieci, zbyt szeroki cel..."
              className="w-full rounded-xl border border-stone-200 p-3 text-stone-900 placeholder:text-stone-400 text-sm focus:outline-hidden focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-4 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-base transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Zakończ dzień</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

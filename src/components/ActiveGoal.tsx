import React, { useState } from 'react';
import { CheckCircle2, Sliders, Edit3, ArrowRight, Sparkles, Check } from 'lucide-react';
import { DayGoal } from '../types';
import { playChime } from '../utils/sound';

interface ActiveGoalProps {
  goal: DayGoal;
  onUpdateProgress: (progress: number) => void;
  onCompleteGoal: () => void;
  onStartReview: () => void;
  onEditGoalText: () => void;
}

export const ActiveGoal: React.FC<ActiveGoalProps> = ({
  goal,
  onUpdateProgress,
  onCompleteGoal,
  onStartReview,
  onEditGoalText,
}) => {
  const [sliderValue, setSliderValue] = useState(goal.progress);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderValue(val);
    onUpdateProgress(val);
    if (val % 25 === 0) {
      playChime('tick');
    }
  };

  const handleQuickStep = (val: number) => {
    setSliderValue(val);
    onUpdateProgress(val);
    playChime('tick');
  };

  const handleMarkAchieved = () => {
    setSliderValue(100);
    onUpdateProgress(100);
    playChime('success');
    onCompleteGoal();
  };

  const getProgressLabel = (p: number) => {
    if (p === 0) return 'Dopiero zaczynasz';
    if (p < 30) return 'Pierwsze kroki wykonane';
    if (p < 60) return 'W trakcie głębokiej pracy';
    if (p < 90) return 'Półmetek za Tobą, finisz blisko';
    if (p < 100) return 'Ostatnie szlify';
    return 'Cel w 100% gotowy!';
  };

  return (
    <div className="w-full max-w-xl mx-auto py-8 sm:py-12 px-4 sm:px-0">
      {/* Category header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-md">
          Dzisiejszy priorytet
        </span>
        <button
          onClick={onEditGoalText}
          className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 hover:underline cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Zmień treść</span>
        </button>
      </div>

      {/* Main Goal Card */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 sm:p-8 mb-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-stone-900 leading-snug break-words">
          {goal.goal}
        </h2>

        {/* Progress Display */}
        <div className="mt-8 pt-6 border-t border-stone-100">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-stone-600 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-stone-400" />
              Postęp realizacji
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-mono">
                {sliderValue}%
              </span>
            </div>
          </div>

          <p className="text-xs text-stone-500 mb-4 italic">
            {getProgressLabel(sliderValue)}
          </p>

          {/* Interactive Range Slider */}
          <div className="space-y-3">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={sliderValue}
              onChange={handleSliderChange}
              aria-label="Regulacja postępu celu"
              className="w-full h-2.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900 transition-all focus:outline-hidden"
            />

            {/* Quick Milestone buttons */}
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              {[0, 25, 50, 75, 100].map((step) => {
                const isActive = sliderValue === step;
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => handleQuickStep(step)}
                    className={`flex-1 py-1.5 px-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                    }`}
                  >
                    {step}%
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="space-y-3">
        {/* Primary: Cel osiągnięty */}
        <button
          onClick={handleMarkAchieved}
          className="w-full py-4 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-base sm:text-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>Cel osiągnięty</span>
        </button>

        {/* Secondary: Podsumuj i zakończ dzień (review) */}
        <button
          onClick={onStartReview}
          className="w-full py-3.5 px-6 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-sm sm:text-base transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Podsumuj i zakończ dzień</span>
          <ArrowRight className="w-4 h-4 text-stone-500" />
        </button>
      </div>

      {/* Mindset tip */}
      <div className="mt-8 text-center">
        <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
          „Twórcza praca wymaga obrony uwagi. Gdy skończysz ten cel, zamknij laptopa z poczuciem dobrze wykonanego dnia.”
        </p>
      </div>
    </div>
  );
};

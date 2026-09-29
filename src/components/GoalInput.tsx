import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Lightbulb, Compass } from 'lucide-react';

interface GoalInputProps {
  onSetGoal: (goalText: string) => void;
  initialValue?: string;
}

const QUICK_INSPIRATIONS = [
  'Dokończyć kluczowy moduł projektu',
  'Napisać pierwszy szkic artykułu / rozdziału',
  'Zaprojektować makietę nowego ekranu',
  'Wysłać gotową ofertę do klienta',
  'Naprawić konkretny błąd w module płatności i dodać test regresyjny',
  'Przygotować scenariusz prezentacji',
];

export const GoalInput: React.FC<GoalInputProps> = ({ onSetGoal, initialValue = '' }) => {
  const [text, setText] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSetGoal(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto py-8 sm:py-14 px-4 sm:px-0">
      {/* Top philosophical badge */}
      <div className="flex items-center gap-2 justify-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
          <Compass className="w-3.5 h-3.5 text-amber-600" />
          Filozofia głębokiego skupienia
        </span>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-stone-900 leading-snug">
          Jaki jest Twój najważniejszy cel na dziś?
        </h2>
        <p className="mt-3 text-stone-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          Wybierz jeden konkretny, możliwy do sprawdzenia rezultat. Jeśli zrobisz dziś wyłącznie tę rzecz,
          Twój dzień będzie pełnym sukcesem.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative rounded-2xl bg-white border border-stone-200 shadow-sm focus-within:border-stone-900 focus-within:ring-2 focus-within:ring-stone-900/10 transition-all p-4 sm:p-5">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            aria-label="Najważniejszy cel na dziś"
            placeholder="np. Dokończyć formularz płatności i sprawdzić go na urządzeniu mobilnym"
            className="w-full resize-none border-0 p-0 text-stone-900 placeholder:text-stone-400 text-lg sm:text-xl font-normal focus:outline-hidden focus:ring-0 leading-relaxed bg-transparent"
          />
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 mt-2 text-xs text-stone-600">
            <span><kbd className="px-1.5 py-0.5 bg-stone-100 rounded text-stone-700 font-mono text-[11px]">Enter</kbd> zatwierdza · <kbd className="px-1.5 py-0.5 bg-stone-100 rounded text-stone-700 font-mono text-[11px]">Shift + Enter</kbd> nowa linia</span>
            <span>{text.length} znaków</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!text.trim()}
          className="w-full py-4 px-6 rounded-xl bg-stone-900 text-white font-medium text-base hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer group"
        >
          <span>Ustaw cel na dziś</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </form>

      {/* Quick inspirations */}
      <div className="mt-10 pt-8 border-t border-stone-200/70">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 uppercase tracking-wider mb-3">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Przykłady dla osób pracujących twórczo:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_INSPIRATIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setText(item)}
              className="text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-left"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

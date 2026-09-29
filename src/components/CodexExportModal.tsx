import React, { useRef, useState } from 'react';
import { X, Check, Copy, Code2, FolderTree, Terminal } from 'lucide-react';
import { useModalAccessibility } from '../hooks/useModalAccessibility';

interface CodexExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodexExportModal: React.FC<CodexExportModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility(dialogRef, isOpen, onClose);

  if (!isOpen) return null;

  const projectSummary = `Projekt: "Jeden cel dziennie"
Technologia: React 19 + TypeScript + Vite + Tailwind CSS
Baza danych: localStorage (w 100% po stronie przeglądarki, zero zewnętrznych zależności backendu)

Struktura plików projektu:
├── package.json               # Zależności i skrypty (npm run dev, build)
├── vite.config.ts             # Konfiguracja bundlera Vite + Tailwind
├── index.html                 # Główny szablon HTML z polskimi czcionkami
├── README_CODEX.md            # Szczegółowa dokumentacja do przeniesienia projektu
└── src/
    ├── main.tsx               # Punkt wejścia aplikacji React
    ├── App.tsx                # Główny komponent z zarządzaniem stanem (setup, active, review, completed)
    ├── index.css              # Style Tailwind CSS
    ├── types.ts               # Typy TypeScript (DayGoal, DayStatus, AppStage)
    ├── services/
    │   └── storage.ts         # Obsługa localStorage, eksportu CSV (z UTF-8 BOM dla Excela)
    ├── utils/
    │   └── sound.ts           # Dyskretne dźwięki ukończenia celu (Web Audio API)
    └── components/
        ├── Header.tsx         # Pasek nawigacyjny z datą i skrótami
        ├── GoalInput.tsx      # Ekran ustawiania jednego kluczowego celu
        ├── ActiveGoal.tsx     # Ekran aktywny z suwakiem postępu 0-100%
        ├── DayReview.tsx      # Wieczorne podsumowanie: Tak/Nie, co pomogło/przeszkodziło
        ├── DayCompleted.tsx   # Ekran po zakończeniu dnia
        ├── HistoryModal.tsx   # Modal historii celów i eksportu do CSV
        └── CodexExportModal.tsx # Niniejsza instrukcja dla OpenAI Codex`;

  const handleCopy = () => {
    navigator.clipboard.writeText(projectSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="codex-dialog-title" tabIndex={-1} className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:px-6 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h3 id="codex-dialog-title" className="font-semibold text-lg text-stone-900">
                Gotowość do przeniesienia do OpenAI Codex
              </h3>
              <p className="text-xs text-stone-600">
                Jak użyć tego kodu w Codexie lub dowolnym środowisku deweloperskim
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Zamknij okno"
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-sm text-stone-700">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-950">
            <h4 className="font-semibold text-emerald-900 flex items-center gap-1.5 mb-1 text-sm">
              <Check className="w-4 h-4 text-emerald-600" />
              Projekt przygotowany w standardowym formacie React + TypeScript
            </h4>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Kod nie wymaga żadnych zewnętrznych baz danych ani kluczy API. Całość działa w oparciu o czysty React 19, Vite i localStorage przeglądarki, dzięki czemu możesz bez żadnych modyfikacji wkleić lub zaimportować pliki do OpenAI Codex, VS Code, GitHuba lub dowolnego szablonu.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-stone-900 text-sm mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-stone-500" />
              Jak uruchomić projekt lokalnie:
            </h4>
            <div className="bg-stone-900 text-stone-100 rounded-xl p-3.5 font-mono text-xs space-y-1">
              <p className="text-stone-400"># 1. Zainstaluj standardowe pakiety</p>
              <p className="text-amber-300">npm install</p>
              <p className="text-stone-400 pt-2"># 2. Uruchom serwer developerski</p>
              <p className="text-amber-300">npm run dev</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-stone-500" />
                Podsumowanie architektury plików:
              </h4>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Skopiowano!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopiuj opis</span>
                  </>
                )}
              </button>
            </div>
            <pre className="bg-stone-100 rounded-xl p-3.5 text-xs text-stone-800 font-mono overflow-x-auto border border-stone-200 leading-relaxed">
              {projectSummary}
            </pre>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-xs text-stone-600 space-y-1.5">
            <p className="font-semibold text-stone-800">
              Dodatkowy plik w projekcie: <span className="font-mono text-amber-800">README_CODEX.md</span>
            </p>
            <p>
              W katalogu głównym projektu został zapisany plik <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800">README_CODEX.md</code> ze szczegółową dokumentacją wszystkich komponentów i instrukcją migracji do Codex.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            Rozumiem, zamknij
          </button>
        </div>
      </div>
    </div>
  );
};

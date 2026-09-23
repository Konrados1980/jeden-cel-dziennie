# Jeden cel dziennie (One Goal a Day)

Minimalistyczny prototyp aplikacji webowej stworzony specjalnie dla osób pracujących twórczo przy komputerze (programistów, projektantów, pisarzy, twórców cyfrowych).

## 🎯 Główne założenia
- **Jeden dzień = Jeden cel**: Wybór wyłącznie jednego najważniejszego zadania, które przesunie Twoją pracę do przodu.
- **Minimalistyczny, spokojny interfejs**: Brak rozpraszaczy, powiadomień, zbędnych list zadań i rozbudowanych tablic kanban.
- **Progresywny suwak postępu (0-100%)**: Szybka regulacja stanu realizacji z podziałem na etapy (0%, 25%, 50%, 75%, 100%).
- **Wieczorna autorefleksja**:
  1. *Czy udało Ci się osiągnąć dzisiejszy cel?* (Tak / Nie)
  2. *Co pomogło?*
  3. *Co przeszkodziło?*
- **Eksport do pliku CSV**: Gotowy do otwarcia w programach Excel, Numbers lub Arkuszach Google (z kodowaniem UTF-8 BOM, dzięki czemu polskie znaki wyświetlają się prawidłowo).
- **100% lokalnie w przeglądarce**: Brak zewnętrznych baz danych — wszystkie dane są bezpiecznie zapisywane w `localStorage`.

---

## 🚀 Jak uruchomić projekt lokalnie / przenieść do Codex

Projekt jest zbudowany w oparciu o czysty standardowy stack **React 19 + TypeScript + Vite + Tailwind CSS**.

### 1. Wymagania
- Node.js (wersja 18 lub nowsza)
- npm / yarn / pnpm

### 2. Instalacja i start
```bash
# 1. Instalacja zależności
npm install

# 2. Uruchomienie lokalnego serwera deweloperskiego
npm run dev

# 3. Zbudowanie wersji produkcyjnej
npm run build
```

---

## 📁 Architektura i struktura plików

```
├── package.json               # Zależności i konfiguracja skryptów npm
├── tsconfig.json              # Standardowa konfiguracja TypeScript
├── vite.config.ts             # Konfiguracja bundlera Vite z Tailwind CSS
├── index.html                 # Szablon HTML z polskimi fontami
├── README_CODEX.md            # Niniejszy plik dokumentacji
└── src/
    ├── main.tsx               # Główny punkt montowania aplikacji React
    ├── App.tsx                # Główny stan aplikacji (etapy: setup -> active -> review -> completed)
    ├── index.css              # Style Tailwind CSS oraz reguły typograficzne
    ├── types.ts               # Modele danych: DayGoal, DayStatus, AppStage
    ├── services/
    │   └── storage.ts         # Obsługa localStorage, formatowania dat po polsku oraz eksportu do CSV
    ├── utils/
    │   └── sound.ts           # Dźwięki mikro-interakcji (Web Audio API bez zewnętrznych plików mp3)
    └── components/
        ├── Header.tsx         # Górna belka z datą, skrótem do historii i eksportu
        ├── GoalInput.tsx      # Formularz wprowadzania celu z inspiracjami dla twórców
        ├── ActiveGoal.tsx     # Główny ekran roboczy z suwakiem i przyciskiem "Cel osiągnięty"
        ├── DayReview.tsx      # Formularz podsumowania: Tak/Nie, co pomogło / przeszkodziło
        ├── DayCompleted.tsx   # Ekran sukcesu/zamknięcia dnia z podsumowaniem
        ├── HistoryModal.tsx   # Przeglądarka historii dni, statystyki i pobieranie pliku CSV
        └── CodexExportModal.tsx # Wbudowane okno dialogowe z instrukcją migracji
```

---

## 📊 Format pliku eksportu CSV
Plik CSV generowany z poziomu aplikacji posiada polskie nagłówki i separator średnika (`;`), co zapewnia natychmiastowe i bezproblemowe otwarcie w polskiej wersji programu Microsoft Excel:
- `Data` (np. `2026-09-23`)
- `Dzień tygodnia` (np. `Środa`)
- `Najważniejszy cel` (np. `Zaprojektować architekturę nowego modułu`)
- `Czy cel osiągnięto?` (`Tak` / `Nie` / `W trakcie`)
- `Postęp (%)` (np. `100%`)
- `Co pomogło?`
- `Co przeszkodziło?`
- `Status dnia` (`Zakończony` / `W toku`)
- `Godzina utworzenia`
- `Godzina zakończenia`

---

## 💡 Przenoszenie do środowiska Codex
Jeśli chcesz przekazać ten projekt do Codexa w celu dalszej rozbudowy:
1. Wszystkie komponenty znajdują się w katalogu `src/components/`.
2. Stan logiki biznesowej jest scentralizowany w `src/App.tsx` oraz `src/services/storage.ts`.
3. Brak ukrytych zależności — kod jest w 100% jawny i zgodny z regułami TypeScript.

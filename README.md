# Jeden cel dziennie

Minimalistyczna aplikacja webowa dla osób pracujących twórczo przy komputerze (programistów, projektantów, pisarzy, twórców cyfrowych). Jeden dzień, jeden najważniejszy cel, bez rozpraszaczy.

## Funkcje

- **Jeden dzień = jeden cel**: wybierasz tylko to zadanie, które naprawdę przesunie Twoją pracę do przodu.
- **Suwak postępu (0–100%)** z etapami 0%, 25%, 50%, 75% i 100%.
- **Wieczorna autorefleksja**: czy cel został osiągnięty (tak/nie), co pomogło i co przeszkodziło.
- **Historia dni** ze statystykami skuteczności.
- **Eksport do CSV** z polskimi nagłówkami, średnikiem jako separatorem i kodowaniem UTF-8 z BOM, dzięki czemu plik poprawnie otwiera się w polskim Excelu.
- **Kopia zapasowa JSON**: eksport i import całej historii.
- **Dane tylko lokalnie**: wszystko zapisuje się w `localStorage` Twojej przeglądarki, bez serwera i bez kont.

Niedokończony cel z poprzedniego dnia trafia automatycznie do historii ze statusem „Przeniesiony".

## Uruchomienie

Wymagania: Node.js 18 lub nowszy.

```bash
npm install     # instalacja zależności
npm run dev     # serwer deweloperski na http://localhost:3000
npm run build   # build produkcyjny do katalogu dist/
npm run preview # podgląd zbudowanej wersji
npm run lint    # sprawdzenie typów (tsc --noEmit)
```

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, lucide-react.

## Struktura

```
src/
├── main.tsx          # punkt wejścia
├── App.tsx           # stan aplikacji: setup → active → review → completed
├── types.ts          # DayGoal, DayStatus, AppStage
├── services/
│   └── storage.ts    # localStorage, daty po polsku, eksport CSV i kopii JSON
├── components/       # Header, GoalInput, ActiveGoal, DayReview,
│                     # DayCompleted, HistoryModal
├── hooks/            # dostępność okien modalnych
└── utils/sound.ts    # dźwięki interakcji (Web Audio API)
```

## Format CSV

Kolumny: `Data`, `Dzień tygodnia`, `Najważniejszy cel`, `Czy cel osiągnięto?` (Tak / Nie / W trakcie), `Postęp (%)`, `Co pomogło?`, `Co przeszkodziło?`, `Status dnia` (Zakończony / Przeniesiony / W toku), `Godzina utworzenia`, `Godzina zakończenia`.

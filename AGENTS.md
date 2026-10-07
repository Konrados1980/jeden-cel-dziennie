# AGENTS.md

Instrukcja pracy dla agentów AI (Codex, Claude Code i innych) w projekcie **Jeden cel dziennie**.
To jest jedyny plik, który agent czyta zawsze. Jawne polecenia użytkownika mają pierwszeństwo.

## O projekcie

Mała aplikacja webowa: React 19 + TypeScript + Vite + Tailwind CSS 4. Bez serwera i bez kont.
Wszystkie dane trafiają do `localStorage` przeglądarki (`src/services/storage.ts`).

Trzy rzeczy, których nie wolno zepsuć po cichu, bo użytkownik traci dane:
- format rekordu `DayGoal` (`src/types.ts`) i klucze w `localStorage`,
- kopia zapasowa JSON (`exportBackup` / `importBackup`, `version: 1`),
- eksport CSV: 10 kolumn, separator `;`, UTF-8 z BOM, polskie nagłówki.

Zmiana któregokolwiek z nich wymaga jawnej zgody użytkownika i migracji starych danych.

## Sposób pracy

Pracuj od wyniku, nie od kodu:
1. jaki ma być wynik,
2. po czym poznamy, że działa,
3. jakie są ograniczenia i które pliki wolno zmienić,
4. jakie są dowody (kod, komunikaty błędów, zachowanie w przeglądarce),
5. jaka jest najmniejsza bezpieczna zmiana.

Jeśli brakuje danych do bezpiecznej zmiany, nie koduj. Najpierw zbierz dowody czytając kod, potem zapytaj użytkownika o to, czego nie da się ustalić samodzielnie.

## Tryby

- `FIX` – błąd lub drobna poprawka, najlepiej do 3 plików i około 50 linii.
- `FEATURE` – nowa funkcja. Najpierw krótki plan, potem kod.
- `AUDIT` – tylko diagnoza. Nic nie zapisuj ani nie zmieniaj.

Wybierz najmniejszy tryb, który pasuje. Użytkownik nie wypełnia żadnych formularzy.

## Zakres zmian

- Przed edycją wypisz pliki, które zamierzasz zmienić. Poza tą listą nic nie ruszaj.
- Nie refaktoruj przy okazji i nie dodawaj funkcji spoza zadania.
- Nie dodawaj nowych zależności ani nowej warstwy abstrakcji bez zgody.
- Nie przepisuj całego pliku, gdy wystarczy zmienić fragment.
- Jeśli zmiana rośnie (ponad 5 plików albo ponad 150 linii), zatrzymaj się i zrób nowy plan.
- Zachowaj styl i zakończenia linii istniejących plików.

## Weryfikacja

W projekcie nie ma testów automatycznych. Dowodem są:
- `npm run lint` (sprawdzenie typów) – bez błędów,
- `npm run build` – bez błędów,
- dla zmian widocznych w interfejsie: opis ręcznego sprawdzenia w `npm run dev` (http://localhost:3000), zwłaszcza przepływ cel → postęp → refleksja → historia → CSV.

Nie ogłaszaj, że coś działa, jeśli tego nie sprawdzono. Po zakończonym PASS nie powtarzaj tych samych kontroli bez nowej zmiany.

## Zakazy

- zgadywanie bez dowodu,
- ciche pochłanianie błędów zapisu (użytkownik ma zobaczyć komunikat),
- zapis niezweryfikowanych danych z importu (zawsze walidacja),
- usuwanie lub nadpisywanie danych użytkownika bez potwierdzenia.

## Raport po zmianie

Pisz krótko, prostym językiem, od wyniku:

- Zrobione:
- Pliki:
- Jak sprawdzono:
- Wynik: PASS / FAIL
- Czego nie ruszałem:
- Ryzyka i pomysły na później:

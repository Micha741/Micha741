# CircuitKit

Mobilní aplikace (React Native + Expo) pro elektroniky — databáze součástek, do budoucna
i návrh schémat obvodů a plošných spojů.

## Aktuální stav (MVP)

- **Databáze součástek** — lokální úložiště SQLite (`expo-sqlite`), běží celé na zařízení bez
  potřeby účtu nebo serveru.
  - Přidávání, úprava a mazání součástek
  - Pole: název, kategorie, výrobce, pouzdro, hodnota, počet kusů skladem, umístění,
    odkaz na datasheet, tagy, poznámky
  - Vyhledávání podle názvu / tagu / výrobce / hodnoty
  - Filtrování podle kategorie
  - **Výchozí knihovna běžných součástek** — při prvním spuštění se automaticky nahraje
    302 běžné součástky: 84 rezistorů (řada E12, 1 Ω – 8,2 MΩ), 39 kondenzátorů
    (keramické, elektrolytické, tantalové, fóliové), 67 diod (usměrňovací, spínací,
    Schottky, Zenerovy, LED včetně výkonových SMD LED LUXEON Rebel a OSLON SSL 80), 58 tranzistorů
    (bipolární NPN/PNP, Darlington, výkonové, MOSFET, JFET), 48 integrovaných obvodů
    (časovače, komparátory, op-zesilovače, regulátory, logická hradla, čítače,
    Wi-Fi mikrokontroléry ESP32, ESP32-C3, ESP8285, ESP8684, Wi-Fi adaptér ESP8089, 8bit AVR
    mikrokontroléry ATmega640/1280/1281/2560/2561 aj.), 5 Wi-Fi/BLE modulů (ESP32-C3-MINI-1,
    ESP32-C3-WROOM-02, Adafruit Feather HUZZAH ESP8266, ESP8684-MINI-1, ESP-12S) a
    1 konektor/přepěťová ochrana (Ethernet/PoE bleskojistka ESP-100-POE). Tlačítkem „Knihovna”
    v horní liště lze kdykoli doplnit chybějící položky (např. po smazání), aniž
    by se duplikovaly už existující.

## Plánováno dál

- Návrh schémat obvodů (schematic capture)
- Návrh plošných spojů (PCB)

## Spuštění

```bash
npm install
npm run start      # spustí Expo dev server, naskenuj QR kód v Expo Go
npm run android     # nebo spusť přímo v Android emulátoru/zařízení
```

## Struktura projektu

```
App.tsx                     — root komponenta, SQLite + navigace
src/db/schema.ts            — inicializace a migrace SQLite databáze
src/db/componentRepository.ts — CRUD operace nad tabulkou součástek
src/db/seedComponents.ts    — výchozí knihovna běžných součástek
src/types/component.ts      — typy a seznam kategorií součástek
src/navigation/             — React Navigation stack
src/screens/                — obrazovky (seznam, detail, formulář)
```

<!---
Micha741/Micha741 is a ✨ special ✨ repository because its `README.md` (this file) appears on your GitHub profile.
--->

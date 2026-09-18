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
    420 běžných součástek: 98 rezistorů (řada E12, 1 Ω – 8,2 MΩ; teplotní senzor Pt100; NTC
    termistory řady D-5 až D-25 pro omezení nárazového proudu; přesný tenkovrstvý SMD rezistor
    Yageo RT1206; a laserem in-circuit laditelná řada Susumu RT0603/RT0510/RT0816/RT1220),
    48 kondenzátorů (keramické,
    elektrolytické, tantalové, fóliové; vysokonapěťová 1000V keramická disková řada NTE 90000;
    přesná keramická disková řada Multicomp MCBU/MCFU; nízko/vysokonapěťová keramická
    disková řada Illinois Capacitor GMR/GQR; NP0 disk Meritek CCNPO101J50V5B1; a fóliová IGBT
    snubber řada Cornell Dubilier SCD), 98 diod
    (usměrňovací, spínací, Schottky, Zenerovy,
    LED včetně výkonových SMD LED LUXEON Rebel a OSLON SSL 80, obousměrné přepěťové ochrany
    TRISIL STMicroelectronics SMTPA62-320/SMP-0SCMC/SMP100MC/SMP75, tyristor SemiWell
    SCD4C60S),
    73 tranzistorů (bipolární NPN/PNP, Darlington, duální, komplementární páry, výkonové, VF,
    MOSFET, JFET, IR fototranzistory Lite-On LTR-306 a LTR-1650D), 85 integrovaných obvodů
    (časovače, komparátory, op-zesilovače, regulátory, logická hradla, čítače,
    Wi-Fi mikrokontroléry ESP32, ESP32-C3, ESP8285, ESP8684, Wi-Fi adaptér ESP8089, 8bit AVR
    mikrokontroléry ATmega640/1280/1281/2560/2561, rodina CAN mikrokontrolérů AT90CAN32/64/128
    (AVR) a T89C51CC01/02, AT89C51CC03 (8051), digitální teploměry DS18B20, DS1822, TC625,
    senzory vlhkosti a teploty DHT11, SHT71/SHT75, SHT85, CO2 senzory Sensirion SCD40/SCD41
    a kanálový (duct) senzor Belimo
    22DTH-51M, sériové flash paměti MX25L6406E a MX25L1026E, paralelní flash paměti řady
    MX29GL320E (T/B/H/L), USB-I2C most FT200XD, RS-485/RS-422 přijímače Renesas ISL32173E
    a příbuzné (ISL32175E/32177E/32273E/32275E/32277E), automotive TFT-LCD napájecí obvody
    Maxim MAX25220/MAX25221/MAX25221B/MAX25520, LCD-TV napájecí obvody Intersil/Renesas
    ISL97652 a ISL78010, TFT-LCD napájecí obvody E-CMOS EC9223 a Torex XC9516 aj.), 16 modulů
    (Wi-Fi/BLE: ESP32-C3-MINI-1, ESP32-C3-WROOM-02, Adafruit Feather
    HUZZAH ESP8266, ESP8684-MINI-1, ESP-12S; nízkonapěťové odpojovače baterie Alfatronix
    PowerTector PT10/PT20/PT40/PT60/PT100/PT200; LoRaWAN senzor LEO-S55 a brány USM-S67;
    solární bezdrátové senzory EnOcean ETHSA/ETHSU), 1 konektor/přepěťová ochrana (Ethernet/PoE
    bleskojistka ESP-100-POE) a 1 ostatní součástka (RF koaxiální směrový odbočovač SAGE
    Millimeter/Eravant SCD-0134032010-KF-SA). Tlačítkem „Knihovna”
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

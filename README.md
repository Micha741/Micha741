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
    602 běžných součástek: 106 rezistorů (řada E12, 1 Ω – 8,2 MΩ; teplotní senzor Pt100; NTC
    termistory řady D-5 až D-25 pro omezení nárazového proudu; PTC termistory EPCOS/TDK
    B590** pro nadproudovou ochranu telekom linek; přesný tenkovrstvý SMD rezistor Yageo
    RT1206; a laserem in-circuit laditelná řada Susumu RT0603/RT0510/RT0816/RT1220),
    48 kondenzátorů (keramické,
    elektrolytické, tantalové, fóliové; vysokonapěťová 1000V keramická disková řada NTE 90000;
    přesná keramická disková řada Multicomp MCBU/MCFU; nízko/vysokonapěťová keramická
    disková řada Illinois Capacitor GMR/GQR; NP0 disk Meritek CCNPO101J50V5B1; a fóliová IGBT
    snubber řada Cornell Dubilier SCD), 151 diodu
    (usměrňovací, spínací, Schottky, Zenerovy,
    LED včetně výkonových SMD LED LUXEON Rebel, OSLON SSL 80, OSRAM TOPLED Black LO T64F/LR
    T66F (černé pouzdro pro VMS displeje) a OSRAM Mini TOPLED LY M67K, ploché LED displeje
    ROHM LD-201, LD-001 a LD-701, 7segmentové LED displeje AND Optoelectronics AND-5610,
    16segmentové
    alfanumerické displeje AND-8010-B a Yellow Stone BS-AA21RD/BS-CA21RD, Texas Instruments
    TIL302/303/304, bargraf displeje QT Optoelectronics MV53164/MV54164/MV57164, modrý
    jednomístný displej Everlight ELS-512UBWA, 3místné displeje Yellow Stone
    BT-M511RD/BT-N511RD a Everlight ELT-511USOWA, velkoformátový 2,3" displej Everlight
    ELS-2326SYGWA, obousměrné přepěťové ochrany TRISIL
    STMicroelectronics
    SMTPA62-320/SMP-0SCMC/SMP100MC/SMP100LC/SMP75, tripolární TLP140/200/270 a aktivní
    přepěťová/nadproudová ochrana CLP200M, tyristor SemiWell SCD4C60S, laserové diody Roithner
    LaserTechnik QL85H6S-A/B/C, QL78I6S-A/B/C, QL78F6S-A/B/C, QL78J6S-A/B/C a QL85J6S-A/B/C-L),
    74 tranzistorů (bipolární NPN/PNP, Darlington, duální, komplementární páry, výkonové, VF,
    MOSFET, JFET, IR fototranzistory Lite-On LTR-306 a LTR-1650D, fototranzistor pro viditelné
    světlo (náhrada CdS) Kodenshi PT23GP11), 108 integrovaných obvodů
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
    ISL97652 a ISL78010, TFT-LCD napájecí obvody E-CMOS EC9223 a Torex XC9516, senzory
    vlhkosti/teploty HOPERF TH10, PIR pohybové senzory Murata IRA-S410ST03, IRA-S230ST01 a
    kvadrátní IRA-S510ST01, plynový (SnO2) senzor ozónu Hanwei MQ-131, I2C senzory LITE-ON
    LTR-706PS-01 (proximity s VCSEL emitorem) a LTR-329ALS-01 (okolní osvětlení, duální kanál),
    piezoelektrické rázové/vibrační senzory Murata PKGS-00LDP1-R,
    PKGS-25WXP1-R a automotive TPMS PKGS-45TAV-R, zesilovací IC pro rázový senzor ROHM
    BD3852MUZ-Z, 6osý MEMS akcelerometr/gyroskop STMicroelectronics LSM330DL, jednoosý
    analogový křemenný automotive gyroskop Epson Toyocom XV-8000CB, a galvanicky oddělené
    proudové senzory ZMC10 (magnetorezistivní) a Allegro ACS752SCA-050/ACS754xCB-050/
    ACS754xCB-150/ACS755xCB-050 (Hallův jev), reflexní optický senzor Honeywell
    HOA0709-011, optické PPG senzory OSRAM SFH 7051 (tepová frekvence), SFH7050
    (tepová frekvence + SpO2) a SFH7060 (5 emitorů, tepová frekvence + SpO2), a proudové
    senzory CUI CSXX05B series aj.), 104 modulů
    (Wi-Fi/BLE: ESP32-C3-MINI-1, ESP32-C3-WROOM-02, Adafruit Feather
    HUZZAH ESP8266, ESP8684-MINI-1, ESP-12S; nízkonapěťové odpojovače baterie Alfatronix
    PowerTector PT10/PT20/PT40/PT60/PT100/PT200; LoRaWAN senzor LEO-S55 a brány USM-S67;
    solární bezdrátové senzory EnOcean ETHSA/ETHSU; 6,86" IPS TFT LCD moduly AZ Displays
    ATM0680L2A-CT s kapacitním dotykem a ATM0680L2A bez dotyku; a polohové displeje vřetene
    Baumer IVO N 142/N 152; znakový LCD modul PICVUE PVC200403; křemenné tlakové senzory
    Seiko Epson TSU-20G/TSU-70G/TSU-100G; evaluační deska ROHM RPR-0521RS-EVK-001 pro
    kombinovaný senzor přiblížení/okolního osvětlení; optoelektronické snímače přiblížení SICK
    WTB250-2N1131/WTB250-2N1151; wearable zdravotní senzorový náramek Maxim MAXREFDES103#
    s optickým PPG biosenzorem; MEMS tlakový senzorový modul Hokuriku HPM-100GD-A01; a
    indukční přibližovací spínače TURCK BI1.5U-EG08-RP6X-H1341 (uprox Factor 1) a
    BI1-EG05K-AN6X-V1331 (klasický feritový); radarový senzor pohybu Banner R-GAGE
    Q130RA; a kapacitní přibližovací spínače TURCK BC10-PT30-AZ3X, BC10-Q14-VN4X2,
    BC10-QF5.5-RN6X2, BC20-Q20-RZ3X2, BC20-Q20-AN4X2/S400 (DC verze, kabel) a
    BC20-Q20-AN4X2-H1141 (DC verze, M12 konektor); a indukční přibližovací spínač Pepperl+Fuchs
    NBB1-4GM22-E0, NBB2-8GM25-E0-V3, NBB2-8GM25-E2-V3, NBB2-8GM40-E2-V1, NBB2-8GM50-E0,
    NBB2-8GM50-E2-5M, NBB2-8GS35-E2-V1, NBB2-8GS40-E2-5M-PUR, NBB2-12GM60-A2, NBB3-V3-Z4,
    NBB4-12GM30-E2-V3, NBB4-12GM30-E3, NBB4-12GM35-A2-V1-M1 (automotive),
    NBB4-12GM50-E2-3G-3D (ATEX), NBB4-12GM75-US, NBB5-18GM40-Z0-V1, NBB8-18GM50-E2,
    NBB10-30GM50-E0, NBB10-30GM50-E2-C3-V1, NBB20-L3M-A2-C3-V1 (svařovací "Weld Immune") a
    NBB20-U1-A2-T (otočná hlava, VariKont), NBN3-F31K-E8-K (dvoukanálová jednotka pro
    pneumatické pohony s výstupem pro solenoidový ventil), NEN6-8GM40-E2-PUR (nezápustný
    typ), NBB8-18GM50-A0-V1-M1 (automotive M18), NBB15-30GM50-E0-M-Y242746 (M30, NPN, E1
    homologace, -40 až +85 °C), NBN8-12GM50-E2-V1-Y323749 (nezápustný M12, konektor) a
    NBN40-U1-E0-M (otočná hlava VariKont, 40mm, nezápustný, E1, 10-60V) a kapacitní přibližovací
    spínače Pepperl+Fuchs CBB4-12GH60-E0-V1 (potravinářský, nerez 316L, NPN) a CBB4-12GH60-E2-V1
    (potravinářský, nerez 316L, PNP) a CBB8-18GS75-E2 (M18, nastavitelný rozsah 1-8mm, kabel);
    a fotoelektrická jednocestná závora
    (through-beam pár vysílač+přijímač) SICK GRSE18S-N2421V (GR18 Inox); a MIPI CSI-2 kamerový
    modul Leopard Imaging LI-OS05A20-MIPI-110H (OmniVision OS05A20, 5 Mpx); průmyslový vizuální
    senzor (smart kamera) Festo SBSC-U-AF-R2B (čtení kódů, OCR, Ethernet) a barevný vizuální
    senzor Festo SBSI-F-R3C-F6-W (integrovaná optika/osvětlení); a polohové snímače
    pístu pneumatického válce Festo SME-8M-DS-24V-K-5,0-OE (magnetický jazýčkový kontakt),
    SMT-8M-A-PS-24V-E-0,3-M8D, SMT-8M-A-PS-24V-E-2,5-OE, SMT-8M-A-PS-24V-E-0,3-M12
    (magnetorezistivní) a SMT-8M-A-ZS-24V-E-5,0-OE-EX2 (magnetorezistivní, ATEX, 2vodičové), a
    svařovací pole odolný Festo SDBT-BSW-1L-PU-W-0.3-N-M12 (magnetorezistivní, weld-resistant) a
    SME-8-K5-LED-24 (reed, podélné upnutí, otevřený konec kabelu) a SME-8-S-LED-24 (reed,
    podélné upnutí, M8 konektor), SMEO-8E-K-24-S6 (reed, vysokoteplotní -40 až +120 °C, montáž
    příslušenstvím), SMEO-8E-M12-LED-24 (reed, integrovaný konektor M12, hliníkové pouzdro) a
    SMEO-8E-M12-LED-230 (reed, integrovaný konektor M12, univerzální 3-230V AC/3-250V DC) a
    SMPO-8E (čistě pneumatický 3/2 ventil bez elektrického připojení, ATEX zóny 1/2/21/22) a
    SMTSO-8E-NS-M12-LED-24 (magnetoindukční, NPN, svařovací pole odolný) a
    SMT-10G-PS-24V-E-2,5Q-OE (magnetorezistivní, pro kruhovou drážku) a
    SME-10M-ZS-24V-E-2,5-Q-OE (reed, 2vodičové, pro kruhovou drážku) a Festo SIEH-3B-PS-S-L
    (obecný miniaturní indukční spínač Ø3 mm) a SPAN-B11R-M5F-PNLK-PNVBA-L1 (tlakový senzor s
    displejem, IO-Link), SPAN-B-B11R-R18M-PN-L1+2.5S (tlakový senzor s displejem, "Basic",
    1 výstup), SDE5-D10-C3-Q6E-P-K (tlakový spínač bez displeje, QS-6, integrovaný kabel) a
    SDE5-D10-C-Q4E-P-M8 (tlakový spínač bez displeje, QS-4, M8 konektor) a SDE5-D10-NF-Q6E-V-K
    (analogový tlakový snímač 0-10V, bez spínacího výstupu, integrovaný kabel) a
    SDE5-D10-NF-Q6E-V-M8 (analogový tlakový snímač 0-10V, M8 konektor), SDE5-D10-O-Q6E-P-M8
    (tlakový spínač bez displeje, N/O, QS-6, M8) a SDE5-V1-NF-Q6-V-M8 (analogový vakuový snímač
    0 až -1 bar, M8) a SPAN-B11R-M5F-PN-PN-L1 (tlakový senzor s displejem, 2 výstupy, bez
    analogu a IO-Link), SPAW-P100R-G12M-2N-M12 (vysokotlaký tenkovrstvý senzor 0-100 bar,
    celokovový), SPAW-B11R-G14F-2P-M12 (tenkovrstvý senzor -1 až 10 bar, celokovový) a
    SPAW-B2R-G12M-2P-M12 (piezorezistivní senzor -1 až 1 bar, celokovový) a
    SPAW-B11R-G14F-2N-M12 (tenkovrstvý senzor -1 až 10 bar, celokovový, NPN) a
    SPAW-P100R-G14F-2N-M12 (vysokotlaký tenkovrstvý senzor 0-100 bar, celokovový, G1/4) a
    SPAW-P50R-G12M-2N-M12 (vysokotlaký tenkovrstvý senzor 0-50 bar, celokovový) a optický senzor
    prachu/PM2.5 Winsen ZPH02), 2 konektory/přepěťové
    ochrany (Ethernet/PoE
    bleskojistka ESP-100-POE; kolíková lišta Foxconn HB12201) a 8 ostatních součástek (RF
    koaxiální směrový odbočovač SAGE
    Millimeter/Eravant SCD-0134032010-KF-SA; pasivní segmentové LCD panely AZ Displays
    GD-342AP, GD-458P a AND/Purdy FE0202W-EU; Fresnelovy čočky Murata IML-0637, IML-0638 a
    SMD IML-0662N000-T1 a IML-0660) a 1 cívku (proudový snímací transformátor MPS Industries
    P4100E5 series). Tlačítkem „Knihovna”
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

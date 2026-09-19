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
    794 běžných součástek: 117 rezistorů (řada E12, 1 Ω – 8,2 MΩ; teplotní senzor Pt100; NTC
    termistory řady D-5 až D-25 pro omezení nárazového proudu; PTC termistory EPCOS/TDK
    B590** pro nadproudovou ochranu telekom linek; přesný tenkovrstvý SMD rezistor Yageo
    RT1206; laserem in-circuit laditelná řada Susumu RT0603/RT0510/RT0816/RT1220; tenkovrstvá
    izolovaná rezistorová síť Vishay Dale TRA06E; kombinovaná rezistorová/kapacitní síť RCD
    Components RC0801-100J100J; a otočné potenciometry a trimry (lineární/logaritmické, THT/SMD)),
    51 kondenzátorů (keramické,
    elektrolytické, tantalové, fóliové; vysokonapěťová 1000V keramická disková řada NTE 90000;
    přesná keramická disková řada Multicomp MCBU/MCFU; nízko/vysokonapěťová keramická
    disková řada Illinois Capacitor GMR/GQR; NP0 disk Meritek CCNPO101J50V5B1; fóliová IGBT
    snubber řada Cornell Dubilier SCD; radiální tantalový kondenzátor RCD Components
    TRA10-103; vysokonapěťová 1250V fóliová řada Okaya HCPB; a širší vysokonapěťová fóliová řada
    Okaya HCP-S (450-1250V)), 207 diod
    (usměrňovací (včetně vysokonapěťové řady Diotec GP1120–GP1600, DO-41, 1200–6000V), spínací,
    Schottky (včetně extrémně malé 30V onsemi NSR01L30MX, pouzdro X3DFN2 0,62×0,32mm),
    Zenerovy (včetně SMD řady EIC SMZ25, SOD-123FL,
    3,0–200 V, 1,3 W, 46 hodnot),
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
    84 tranzistorů (bipolární NPN/PNP (včetně onsemi rodiny BC817-16L/25L/40L, SOT-23), Darlington, duální, komplementární páry, výkonové, VF,
    MOSFET (včetně vysokonapěťového 600V/20A ISC H5N6001P, TO-3P), JFET (včetně RF JFET rodiny
    Fairchild 2N5484/5485/5486 a SMD MMBF5484/5485/5486, SOT-23), IR fototranzistory Lite-On
    LTR-306 a LTR-1650D, fototranzistor pro viditelné
    světlo (náhrada CdS) Kodenshi PT23GP11), 140 integrovaných obvodů
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
    senzory CUI CSXX05B series aj.; izolovaný DC/DC měnič TRACO POWER TRA 1 Series; a plně
    digitální Class-D zesilovače reproduktoru s DSP ROHM BM28720MUV (20W+20W) a BM28723MUV
    (17W+17W, output feedback, bez snubberu); a digitální barometrický tlakový senzor Bosch
    BMP280 (I2C/SPI); kombinovaný digitální senzor vlhkosti/tlaku/teploty Bosch BME280
    (I2C/SPI, registrově kompatibilní s BMP280); neregulovaný izolovaný DC/DC měnič RECOM
    ECONOLINE REZ Series; trojitý single-supply video buffer s nábojovou pumpou Renesas/Intersil
    ISL59837 (16 Ld QSOP); 12dílná rodina LDO regulátorů NIKO-SEM L1117 (SOT-223/TO-220/TO-252/
    TO-263, pevné 2,5-5V i nastavitelné); 9dílná rodina nízkoproudých LDO regulátorů Fairchild
    KA78LXXA (TO-92, 5-24V); kompletní napájecí řadič pro DDR2/DDR3/DDR3L/LPDDR3 paměti Texas
    Instruments TPS51716 (buck + VTT LDO + VTTREF, 20-pin QFN); 1/4" SOC VGA NTSC/PAL CMOS
    obrazový senzor Micron MT9V135C12STC (48-pin CLCC, kompozitní video/LVDS/CCIR656); a
    kombinovaný PFC + half-bridge řadič předřadníku zářivek International Rectifier IRS2580DSPbF
    ("COMBO8", 8pin SOIC); a napájecí spínač (load switch) se soft-startem onsemi NCP330MUTBG
    (RDS(on) 26mΩ, 3A, UDFN4)),
    148 modulů
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
    BI1-EG05K-AN6X-V1331 (klasický feritový); radarové senzory pohybu Banner R-GAGE
    Q130RA (FMCW) a Pepperl+Fuchs RaDec-M, RAVE-D-NA, RMS-G-RC a RMS-M-RC (Dopplerovy, relé
    výstup(y), rozlišení osob/vozidel u RAVE-D-NA/RMS-G-RC); a kapacitní přibližovací
    spínače TURCK BC10-PT30-AZ3X, BC10-Q14-VN4X2,
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
    NBN40-U1-E0-M (otočná hlava VariKont, 40mm, nezápustný, E1, 10-60V) a
    NJ4-12GM-N-5M-Y123257 (NAMUR výstup, ATEX jiskrově bezpečný, zóna 20); a kapacitní přibližovací
    spínače Pepperl+Fuchs CBB4-12GH60-E0-V1 (potravinářský, nerez 316L, NPN) a CBB4-12GH60-E2-V1
    (potravinářský, nerez 316L, PNP) a CBB8-18GS75-E2 (M18, nastavitelný rozsah 1-8mm, kabel);
    a fotoelektrická jednocestná závora
    (through-beam pár vysílač+přijímač) SICK GRSE18S-N2421V (GR18 Inox); reflexní fotoelektrický
    senzory s IO-Link Pepperl+Fuchs OBG4000-R103-2EP-IO, OBG5000-R100-EP-IO-V3 a
    OBG5000-R101-2EP1-IO (detekce transparentních objektů); a MIPI CSI-2 kamerový
    modul Leopard Imaging LI-OS05A20-MIPI-110H (OmniVision OS05A20, 5 Mpx); průmyslový vizuální
    senzor (smart kamera) Festo SBSC-U-AF-R2B (čtení kódů, OCR, Ethernet), vizuální senzor pro
    polohování regálových zakladačů Pepperl+Fuchs PHA400-F200A-B17-V1D a PHA400-F200-B17-V1D
    (PROFINET, liší se jen orientací konektorů) a barevný vizuální
    senzory Festo SBSI-F-R3C-F6-W a SBSI-F-AF-R3C-F12-W (integrovaná optika/osvětlení, plná
    kapacita) a monochromní objektový senzor Festo SBSI-Q-AF-R2B-F12-W; a polohové snímače
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
    SPAW-P50R-G12M-2N-M12 (vysokotlaký tenkovrstvý senzor 0-50 bar, celokovový),
    SPAW-P25R-G12M-2NV-M12 (0-25 bar, spínací + analogový výstup současně), optický senzor
    prachu/PM2.5 Winsen ZPH02 a ATEX senzorová skříň polohy ventilu Festo
    SRBE-CA3-YR90-MW-22A-1W-C2M20-EX (mechanický přepínací spínač), RGB segment signálního
    majáku Banner SG-TL70-RGB14, programovatelný zvukový segment Banner SG-TL70-AP (MP3/WAV) a
    zvukový segment Moflash LED-TLM-AUD-02 (bzučák, pulzní tón), fiber optic zesilovač Banner
    D10 Series, a 26dílná řada AC-DC napájecích zdrojových modulů Integrated Power Designs
    REL-110 (110W, 1-4 výstupy, open-frame/chassis, univerzální vstup 85-264VAC, medicínská
    certifikace IEC 60601-1)), 5 konektorů/přepěťových
    ochran (Ethernet/PoE
    bleskojistka ESP-100-POE; kolíková lišta Foxconn HB12201; pouzdra průmyslového konektoru
    HARTING Han-Modular ECO 09 14 001 0722 (kabel-kabel, bez PE, IP20) a 09 14 001 0321
    (panelové, s PE, IP65); a miniaturní board-to-board/board-to-FPC konektorová řada Hirose
    BM28 Series (0,35mm rozteč, do 5A)) a 15 ostatních součástek (RF
    koaxiální směrový odbočovač SAGE
    Millimeter/Eravant SCD-0134032010-KF-SA; pasivní segmentové LCD panely AZ Displays
    GD-342AP, GD-458P a AND/Purdy FE0202W-EU; Fresnelovy čočky Murata IML-0637, IML-0638 a
    SMD IML-0662N000-T1 a IML-0660; dílenský rework modul pájecí stanice Weller WXair MODUL
    100-230V US/MX/J B; a křemenné krystaly (16/8/12 MHz HC-49/S, 32,768 kHz hodinkový) a
    keramické rezonátory (16/8 MHz))
    a 11 cívek (proudový snímací transformátor MPS Industries
    P4100E5 series, radiální a SMD výkonové tlumivky, a THT/SMD ferritové korálky) a 16
    spínačů/relé (tlačítkové mikrospínače, páčkové a posuvné přepínače, mikrospínač, DIP
    spínače, rotační enkodér EC11, otočný přepínač, výkonové elektromagnetické relé Tianbo
    TRA1, a 4dílná rodina PCB výkonových relé Omron G5LE — SPDT/SPST-NO, flux/fully sealed,
    10A/250VAC). Tlačítkem „Knihovna”
    v horní liště lze kdykoli doplnit chybějící položky (např. po smazání), aniž
    by se duplikovaly už existující.

- **Optický sken barevného kódu rezistoru** — plně automatická detekce barevných pásků
  z fotky pořízené kamerou telefonu (tlačítko 📷 na seznamu součástek), bez nutnosti ručně
  označovat polohu pásků:
  - `expo-camera` pořídí fotku, `expo-image-manipulator` ořízne a zmenší vodorovný pruh
    tělesa rezistoru podle vodicího rámečku na obrazovce
  - `jpeg-js` (čistě JS dekodér) načte pixelová data ořezaného pruhu bez nutnosti custom
    native modulu (funguje i v Expo Go)
  - sloupcové průměrování barev → vyhlazení → detekce hran v prostoru CIE Lab (percepční
    vzdálenost barev) → rozdělení na segmenty → tělo rezistoru (nejširší segment) se odfiltruje
    a zbylé segmenty se spárují s nejbližší barvou z EIA/IEC 60062 tabulky (12 barev pásků)
  - automatická korekce orientace (kovový pásek tolerance se očekává vpravo)
  - podpora 3 až 6 pásků včetně teplotního koeficientu (6. pásek)
  - rozpoznaná hodnota jde tlačítkem „Použít” rovnou do formuláře nové součástky
    (kategorie, hodnota, tolerance) s možností dodatečné ruční opravy jednotlivých pásků
  - ⚠️ přesnost detekce v reálných světelných podmínkách nebyla ověřena na fyzickém
    zařízení — mapování vodicího rámečku na ořez fotky a prahové hodnoty pro detekci hran
    mohou vyžadovat doladění

- **Kalkulačka kódu SMD rezistoru** — ruční zadání kódu vytištěného na pouzdře SMD
  rezistoru (tlačítko „#” na seznamu součástek), okamžitý přepočet na hodnotu:
  - **3místný kód** (tolerance 5 %) — první dvě číslice platné, třetí počet nul
  - **4místný kód** (tolerance 1 %) — první tři číslice platné, čtvrtá počet nul
  - **R-zápis** — písmeno R nahrazuje desetinnou čárku (např. „4R7” = 4,7 Ω)
  - **EIA-96 kód** — dvě číslice (01–96, tabulka řady E96) + písmeno násobitele
  - **0 / 000** — rozpozná se jako 0 Ω (propojka)
  - rozpoznaná hodnota jde tlačítkem „Použít” rovnou do formuláře nové součástky

- **Optický (OCR) sken SMD kódu** — automatické čtení kódu vytištěného na pouzdře SMD
  rezistoru z fotky (tlačítko 🔎 na seznamu součástek):
  - `expo-image-manipulator` ořízne a zvětší oblast s kódem podle vodicího rámečku
  - text čte `@react-native-ml-kit/text-recognition` (Google ML Kit **on-device** OCR,
    běží přímo na zařízení, offline, nic se nikam neodesílá)
  - z rozpoznaného textu se filtrují kandidáti odpovídající platnému formátu SMD kódu
    (3místný, 4místný, R-zápis, EIA-96); pokud je kandidátů víc, nabídnou se jako
    přepínatelné štítky, výchozí je automaticky vybraný nejlepší nález
  - rozpoznaný/kandidátní kód jde do editovatelného pole (ruční oprava, pokud OCR
    něco přečte špatně) a odtud tlačítkem „Použít” rovnou do formuláře nové součástky
  - ⚠️ **vyžaduje custom dev client** — na rozdíl od ostatních funkcí tahle používá
    nativní modul ML Kit, takže **od této chvíle appka neběží v čistém Expo Go**; je
    potřeba si sestavit vlastní dev client (`expo-dev-client`), viz sekce Spuštění
  - ⚠️ přesnost OCR na malém tištěném textu SMD součástek (typicky pod 1 mm výšku
    znaků) nebyla ověřena na fyzickém zařízení — může být potřeba lepší osvětlení,
    makro ostření nebo úprava vodicího rámečku

- **Kalkulačka kódu kondenzátoru** — ruční zadání kódu vytištěného na kondenzátoru
  (tlačítko „µF” na seznamu součástek), okamžitý přepočet na kapacitu:
  - **3místný kód** (v pF) — první dvě číslice platné, třetí počet nul; násobitel
    9 = ×0,1, násobitel 8 = ×0,01 (pro hodnoty pod 10 pF)
  - **R-zápis** — písmeno R nahrazuje desetinnou čárku u hodnot pod 10 pF (např.
    „4R7” = 4,7 pF)
  - **Písmeno tolerance** (EIA, jiná tabulka než u rezistorů) — B/C/D pro pF hodnoty,
    F/G/J/K/M/Z/P pro procentuální tolerance
  - **Kód napětí** (2 znaky, EIA) — např. 1C=16V, 1E=25V, 2A=100V
  - rozpoznaná hodnota jde tlačítkem „Použít” rovnou do formuláře nové součástky

- **Přehled pouzder IC** — rychlá vizuální reference běžných THT/SMD pouzder podle tvaru
  a typu vývodů (odkaz „Přehled pouzder IC” u pole „Pouzdro” ve formuláři součástky):
  DIP, SIP, SOIC, SOT-23, SOT-89, TO-92, TO-220, QFN, TSSOP, PLCC, LCCC, QFP, BQFP, BGA —
  pro každé typický počet vývodů, rozteč a popis tvaru/montáže.

## Plánováno dál

- Návrh schémat obvodů (schematic capture)
- Návrh plošných spojů (PCB)

## Spuštění

⚠️ Appka od zavedení OCR skenu SMD kódu obsahuje nativní modul
(`@react-native-ml-kit/text-recognition`), takže **už neběží v obyčejném Expo Go** —
je potřeba vlastní dev client (obsahuje `expo-dev-client`).

```bash
npm install

# první sestavení dev clientu (jen jednou / po přidání nativního modulu):
npx expo prebuild
npx expo run:android    # sestaví a nainstaluje dev client do emulátoru/zařízení
# (na iOS: npx expo run:ios, případně `eas build --profile development`)

# běžný vývoj poté:
npx expo start --dev-client   # naskenuj QR kód v už nainstalovaném dev clientu
```

Bez OCR skenu SMD kódu (jen barevný skener + ostatní funkce) by appka v Expo Go
fungovala i bez dev clientu — nativní modul se ale linkuje automaticky přes
autolinking, takže současný `npm run android`/`npm run start` (bez `--dev-client`)
už není spolehlivý postup.

## Struktura projektu

```
App.tsx                     — root komponenta, SQLite + navigace
src/db/schema.ts            — inicializace a migrace SQLite databáze
src/db/componentRepository.ts — CRUD operace nad tabulkou součástek
src/db/seedComponents.ts    — výchozí knihovna běžných součástek
src/types/component.ts      — typy a seznam kategorií součástek
src/utils/resistorColorCode.ts — tabulka barevného kódu rezistorů, dekódování pásků
src/utils/imageColorScan.ts — zpracování ořezané fotky (JPEG dekódování, segmentace pásků)
src/utils/smdResistorCode.ts — dekódování SMD kódů rezistorů (3místný, 4místný, EIA-96)
src/utils/capacitorCode.ts  — dekódování kódů kondenzátorů (3místný pF kód, tolerance, napětí)
src/utils/packageReference.ts — statická data přehledu pouzder IC (TSSOP, PLCC, LCCC, QFP, BQFP, BGA)
src/navigation/             — React Navigation stack
src/screens/                — obrazovky (seznam, detail, formulář, sken rezistoru,
                               SMD kalkulačka, OCR sken SMD kódu, kalkulačka kondenzátoru,
                               přehled pouzder IC)
```

<!---
Micha741/Micha741 is a ✨ special ✨ repository because its `README.md` (this file) appears on your GitHub profile.
--->

import type { ComponentInput } from '../types/component';

interface RelaySpec {
  name: string;
  packageType: string;
  value: string;
  notes: string;
  tags: string;
}

const RELAY_SPECS: RelaySpec[] = [
  {
    name: 'TRA1',
    packageType:
      'THT výkonové relé pro montáž do DPS, plastové pouzdro (volitelně utěsněné/sealed nebo ' +
      'průhledné utěsněné), 5 pinů, rozměry 29×20,4×12,7 mm (cca), hmotnost ~14 g',
    value:
      'Elektromagnetické výkonové relé, 1 přepínací (Form C) nebo 1 spínací (Form A) kontakt, ' +
      'cívka 3–48 V DC (dle objednacího kódu), kontakty 10 A/240 V AC nebo 10 A/30 V DC',
    notes:
      'Tianbo Electronics "TRA1 — Power Relay" katalogový datasheet — ⚠️ NOVÁ KATEGORIE v této ' +
      'knihovně: první elektromagnetické relé (kategorie "Spínač/Relé" dosud nevyužita) — na ' +
      'rozdíl od polovodičových přibližovacích senzorů s PNP/NPN výstupem (TURCK/Pepperl+Fuchs/ ' +
      'Festo aj. v kategorii Modul) jde o KLASICKÝ ELEKTROMECHANICKÝ SPÍNACÍ PRVEK s galvanicky ' +
      'odděleným kontaktem (cívka nemá žádné vodivé spojení s kontaktní částí) — cívka ovládá ' +
      'kotvu, která mechanicky sepne/rozepne kontakty ze stříbrné slitiny. Objednací kód TRA1 ' +
      '<D/L> - <napětí cívky> - <S> - <Z/H> - <(2)>: 2. pozice = výkon cívky (D=0,72 W, L=0,54 W), ' +
      '3. pozice = jmenovité napětí cívky (3/5/6/9/12/24/48 V DC), 4. pozice = volitelně "S" pro ' +
      'utěsněnou (sealed) verzi, 5. pozice = tvar kontaktu (Z=Form C/přepínací, H=Form A/spínací), ' +
      '6. pozice = volitelně "(2)" pro průhledný kryt. Např. štítek na vyobrazeném kuse ' +
      '"TRA1 L-12VDC-S-H" = cívka 0,54 W/12 V DC, utěsněná verze, Form A (spínací) kontakt. Cívka ' +
      '@12 V DC (třída 0,54 W): odpor 270 Ω ±10 %, jmenovitý proud 45 mA, max. ovládací napětí ' +
      '9,6 V DC, min. uvolňovací napětí 0,6 V DC; @12 V DC (třída 0,72 W): odpor 200 Ω ±10 %, ' +
      'proud 60 mA. Max. přípustné napětí cívky 130 % jmenovitého @70 °C / 170 % @23 °C. Kontakty: ' +
      'materiál stříbrná slitina, jmenovitá zátěž 10 A/240 V AC nebo 10 A/30 V DC (odporová zátěž, ' +
      'cosΦ=1), min. zátěž 100 mA/5 V DC, max. spínací napětí 250 V AC/30 V DC, max. spínací proud ' +
      '12 A, max. spínací výkon 2500 VA/300 W, odpor kontaktu max 100 mΩ @6V DC/1A. Životnost: ' +
      'elektrická 100 000 sepnutí (@30/min), mechanická 10 000 000 sepnutí (@300/min). Izolační ' +
      'odpor min 100 MΩ @500 V DC, dielektrická pevnost mezi rozpojenými kontakty 1000 V AC/1min, ' +
      'mezi kontakty a cívkou 5000 V AC/1min. Doba sepnutí 20 ms, doba rozepnutí 10 ms. Provozní ' +
      'teplota -40 až +85 °C, vlhkost 40–85 %. Odolnost proti rázu (provozní extrémy 10G/11ms, ' +
      'meze poškození 100G/6ms), proti vibracím 10–55 Hz/1,5 mm. Max. spínací kmitočet: mechanicky ' +
      '18 000 sepnutí/h, elektricky 1 800 sepnutí/h. Certifikace: UL, cUL, TÜV, CQC.',
    tags: 'relé,elektromagnetické,výkonové,tianbo,tra1,form-a,form-c,10a,pcb',
  },
  {
    name: 'Tlačítkový mikrospínač 6×6×4,3 mm',
    packageType: 'THT, 4 vývody (2 páry, rozteč 6×6 mm), výška táhla 4,3 mm',
    value: 'Tlačítkový spínač (tact switch), spínací (NO), max. 50 mA/12 V DC',
    notes: 'Standardní 4pinový taktilní spínač pro nepájivé pole/DPS.',
    tags: 'spínač,tlačítkový,tact-switch,tht',
  },
  {
    name: 'Tlačítkový mikrospínač 6×6×7,3 mm',
    packageType: 'THT, 4 vývody (2 páry, rozteč 6×6 mm), výška táhla 7,3 mm',
    value: 'Tlačítkový spínač (tact switch), spínací (NO), max. 50 mA/12 V DC',
    notes: 'Vyšší varianta stejné 6×6 mm řady, vhodné pod panelovou krytku.',
    tags: 'spínač,tlačítkový,tact-switch,tht',
  },
  {
    name: 'Tlačítkový mikrospínač SMD 3×3×2,5 mm',
    packageType: 'SMD, 4 vývody, rozteč 3×3 mm',
    value: 'Tlačítkový spínač (tact switch), spínací (NO), max. 50 mA/12 V DC',
    notes: 'Miniaturní SMD taktilní spínač.',
    tags: 'spínač,tlačítkový,tact-switch,smd',
  },
  {
    name: 'Páčkový přepínač MTS-102 (ON-OFF)',
    packageType: 'THT, panelový, 2 piny, montážní závit M6',
    value: 'Dvoupolohový páčkový přepínač (toggle), 1 pól (SPST), max. 3 A/250 V AC',
    notes: 'Klasický panelový "kolébkový" přepínač do otvoru Ø6 mm.',
    tags: 'spínač,páčkový,toggle,on-off',
  },
  {
    name: 'Páčkový přepínač MTS-103 (ON-OFF-ON)',
    packageType: 'THT, panelový, 3 piny, montážní závit M6',
    value: 'Třípolohový páčkový přepínač (toggle), 1 pól (SPDT), max. 3 A/250 V AC',
    notes: 'Prostřední poloha rozpojená, oba krajní kontakty spínají.',
    tags: 'spínač,páčkový,toggle,on-off-on',
  },
  {
    name: 'Posuvný spínač SS-12F15 (ON-OFF)',
    packageType: 'THT, 3 piny, rozteč 4,5 mm',
    value: 'Dvoupolohový posuvný spínač (slide), max. 0,5 A/50 V DC',
    notes: 'Malý posuvný spínač pro DPS/nepájivé pole.',
    tags: 'spínač,posuvný,slide,on-off',
  },
  {
    name: 'Mikrospínač (koncový) KW11-3Z',
    packageType: 'THT, panelový, 3 piny, s pákou/kladkou',
    value: 'Mikrospínač s pákou (SPDT), max. 5 A/125-250 V AC',
    notes: 'Klasický "cvakací" koncový spínač.',
    tags: 'spínač,mikrospínač,koncový,limit-switch',
  },
  {
    name: 'DIP spínač 4pólový',
    packageType: 'THT, pouzdro DIP-8, rozteč 2,54 mm',
    value: '4× jednopólový posuvný spínač v pouzdře DIP',
    notes: 'Sada 4 miniaturních posuvných spínačů pro nastavení adres/konfigurace.',
    tags: 'spínač,dip,konfigurační',
  },
  {
    name: 'DIP spínač 8pólový',
    packageType: 'THT, pouzdro DIP-16, rozteč 2,54 mm',
    value: '8× jednopólový posuvný spínač v pouzdře DIP',
    notes: 'Sada 8 miniaturních posuvných spínačů pro nastavení adres/konfigurace.',
    tags: 'spínač,dip,konfigurační',
  },
  {
    name: 'Rotační enkodér EC11 s tlačítkem',
    packageType: 'THT, 5 vývodů (A/B/C enkodér + 2× tlačítko), hřídel Ø6 mm',
    value: 'Inkrementální rotační enkodér, 20 impulzů/otáčku, s tlačítkem (stiskem hřídele)',
    notes: 'Oblíbený u DIY projektů pro menu/ovládání hlasitosti.',
    tags: 'spínač,enkodér,rotační,ec11',
  },
  {
    name: 'Otočný přepínač 1P12T',
    packageType: 'THT, panelový, hřídel Ø6 mm',
    value: 'Otočný (rotační) přepínač, 1 pól / 12 poloh',
    notes: 'Mechanický voličový přepínač, např. pro volbu rozsahu/kanálu.',
    tags: 'spínač,otočný,rotační-přepínač',
  },
  {
    name: 'G5LE-1',
    packageType:
      'THT, PCB vývody (5, resp. 4 piny dle kontaktní formy), kubické pouzdro, hmotnost ' +
      'cca 12 g, ochrana proti tavidlu (flux protection)',
    value:
      'Elektromagnetické výkonové relé, SPDT (1c), cívka 5/12/24 V DC, kontakty 10 A/250 V AC ' +
      'nebo 8 A/30 V DC',
    notes:
      'Omron "G5LE — PCB Power Relay, Cubic, Single-pole 10A Power Relay" (kat. č. K100-E1-07). ' +
      'Elektromagnetické relé (galvanicky oddělený kontakt), podobně jako Tianbo TRA1 v této ' +
      'knihovně, ale menší/nižší proudová třída a bohatší modelová řada. Součást rodiny G5LE-1 ' +
      '(SPDT, flux protection) / G5LE-14 (SPDT, fully sealed) / G5LE-1A (SPST-NO, flux protection) ' +
      '/ G5LE-1A4 (SPST-NO, fully sealed) — viz sourozenecké záznamy. Objednací kód: G5LE-<forma> ' +
      '<cívka> — např. "G5LE-1 DC5" = SPDT, 5V DC cívka. Tento konkrétní záznam (G5LE-1) je ' +
      'dostupný s cívkou 5, 12 nebo 24 V DC (vyber konkrétní napětí kusu do pole "hodnota" při ' +
      'evidenci). Cívka @5V: 79,4 mA, 63 Ω; @12V: 33,3 mA, 360 Ω; @24V: 16,7 mA, 1440 Ω (měřeno ' +
      'při 23°C, tolerance ±10%). Musí sepnout ≤75% jmenovitého napětí, musí rozepnout ≥10%, max. ' +
      'napětí cívky 170% jmenovitého @23°C. Příkon cívky cca 400 mW. ' +
      'Kontakty: materiál Ag slitina (bez Cd), jmenovitá zátěž 10A/120VAC nebo 8A/30VDC (odporová), ' +
      '5A/120VAC nebo 4A/30VDC (indukční, cosφ=0.4), jmenovitý trvalý proud 10A, max. spínací ' +
      'napětí 250VAC/125VDC (30VDC dle UL/CSA), odpor kontaktu max 100mΩ. Doba sepnutí max 10ms, ' +
      'rozepnutí max 5ms. Izolační odpor min 100MΩ. Dielektrická pevnost cívka-kontakty 2000VAC/1min, ' +
      'mezi kontakty stejné polarity 750VAC/1min. Impulzní výdrž 4500V (1,2×50µs). Životnost: ' +
      'mechanická min 10 000 000 sepnutí (@18000/h), elektrická min 100 000 sepnutí (@1800/h). ' +
      'Odolnost vůči vibracím 10-55-10Hz/0,75mm, rázová odolnost 1000 m/s² (destrukce)/100 m/s² ' +
      '(porucha). Provozní teplota -25 až +85°C, vlhkost 35-85%. Certifikace UL (E41643), CSA ' +
      '(LR31928), VDE/TÜV EN/IEC. RoHS.',
    tags: 'relé,elektromagnetické,výkonové,omron,g5le,g5le-1,spdt,10a,pcb',
  },
  {
    name: 'G5LE-14',
    packageType:
      'THT, PCB vývody, kubické pouzdro, hmotnost cca 12 g, plně utěsněné (fully sealed, ' +
      'odolné vůči mytí desky)',
    value:
      'Elektromagnetické výkonové relé, SPDT (1c), cívka 5/12/24 V DC, kontakty 10 A/250 V AC ' +
      'nebo 8 A/30 V DC',
    notes:
      'Součást rodiny Omron G5LE (viz poznámka u G5LE-1 pro plné společné specifikace) — plně ' +
      'utěsněná (fully sealed) varianta SPDT, vhodná pro mytí desky po pájení, jinak elektricky ' +
      'shodná s G5LE-1.',
    tags: 'relé,elektromagnetické,výkonové,omron,g5le,g5le-14,spdt,10a,pcb,sealed',
  },
  {
    name: 'G5LE-1A',
    packageType:
      'THT, PCB vývody, kubické pouzdro, hmotnost cca 12 g, ochrana proti tavidlu (flux ' +
      'protection)',
    value:
      'Elektromagnetické výkonové relé, SPST-NO (1a), cívka 5/12/24 V DC, kontakty 10 A/250 V AC ' +
      'nebo 8 A/30 V DC',
    notes:
      'Součást rodiny Omron G5LE (viz poznámka u G5LE-1 pro plné společné specifikace) — spínací ' +
      '(SPST-NO, jen jeden spínací kontakt bez rozpínacího) varianta, jinak elektricky shodná s ' +
      'G5LE-1.',
    tags: 'relé,elektromagnetické,výkonové,omron,g5le,g5le-1a,spst-no,10a,pcb',
  },
  {
    name: 'G5LE-1A4',
    packageType:
      'THT, PCB vývody, kubické pouzdro, hmotnost cca 12 g, plně utěsněné (fully sealed, ' +
      'odolné vůči mytí desky)',
    value:
      'Elektromagnetické výkonové relé, SPST-NO (1a), cívka 5/12/24 V DC, kontakty 10 A/250 V AC ' +
      'nebo 8 A/30 V DC',
    notes:
      'Součást rodiny Omron G5LE (viz poznámka u G5LE-1 pro plné společné specifikace) — plně ' +
      'utěsněná (fully sealed) varianta SPST-NO, jinak elektricky shodná s G5LE-1A.',
    tags: 'relé,elektromagnetické,výkonové,omron,g5le,g5le-1a4,spst-no,10a,pcb,sealed',
  },
  {
    name: 'SI-LS100F',
    packageType:
      'kvádrové plastové pouzdro (termoplast), rozměry cca 99,9×41,3×30 mm, závit SI-QS-M20 ' +
      'pro kabelovou průchodku, 6 žil na svorkovnici, stupeň krytí IP65',
    value:
      'Mechanický bezpečnostní koncový spínač, 2× rozpínací (NC) bezpotenciálový kontakt, ' +
      'zatížitelnost kontaktu 3 A/240 V AC-15 nebo 0,27 A/250 V DC-13',
    notes:
      'Turck "SI-LS100F" — bezpečnostní systémy, mechanický bezpečnostní spínač (ID č. 3049480), ' +
      'datasheet 20-01-2022 01-02. ⚠️ NOVÁ SUB-KATEGORIE v "Spínač/Relé": první bezpečnostní ' +
      '(safety) koncový spínač v knihovně — na rozdíl od běžných mikrospínačů/koncových spínačů ' +
      'jde o certifikovaný prvek pro bezpečnostní obvody strojů (nouzové zastavení, dveřní ' +
      'blokování apod.), bez blokovacího/zamykacího mechanismu (na rozdíl od sesterského ' +
      'SI-LS42DSH, viz jeho poznámka). Provedení dle IEC 60947-5-1, bez pojistky, 1× pomocný ' +
      'spínací kontakt navíc k hlavním bezpečnostním výstupům. Jmenovité izolační napětí 250 V, ' +
      'konvenční tepelný proud 10 A, impulsní výdržné napětí 2,5 kV, třída ochrany II. Četnost ' +
      'spínání 30/min, mechanická životnost 1×10⁶ spínacích cyklů, B10d hodnota 2×10⁶ spínacích ' +
      'cyklů, nelze kaskádovat. Elektrické připojení svorkovnice (svorkovnice s kabelovou ' +
      'průchodkou). Okolní teplota -30 až +80 °C. Bezpečnostní klasifikace: PL e dle ' +
      'ISO 13849-1:2008, kategorie 4, SIL 3 dle IEC 61508, úroveň kódování/ochrana proti ' +
      'neoprávněné manipulaci nízká.',
    tags: 'spínač,bezpečnostní,koncový,limit-switch,turck,si-ls100f,safety,pl-e,sil-3',
  },
  {
    name: 'SI-LS42DSH',
    packageType:
      'kvádrové plastové pouzdro (termoplast), rozměry cca 170×88,8×42,5 mm, závit SI-QS-M20 ' +
      'pro kabelovou průchodku, svorkovnice, stupeň krytí IP65',
    value:
      'Bezpečnostní koncový spínač se zámkem (solenoidové odjištění), 2× rozpínací (NC) ' +
      'bezpotenciálový kontakt, zatížitelnost kontaktu 2,5 A/230 V AC-15',
    notes:
      'Turck "SI-LS42DSH" — bezpečnostní systémy, bezpečnostní spínač se zámkem (ID č. 3047875), ' +
      'datasheet 20-01-2022 01-02. Sesterský typ k SI-LS100F v této knihovně (viz jeho poznámka ' +
      'pro obecný kontext bezpečnostních koncových spínačů), ale navíc s pružinovým mechanickým ' +
      'zámkem otevíraným magnetem (solenoidem) — brání otevření krytu/dveří dokud není napájena ' +
      'odjišťovací cívka (2× magnetická cívka, rozpínací a spínací funkce), typicky pro blokování ' +
      'ochranných krytů na strojích s doběhem. Provedení dle IEC 60947-5-1, s pojistkou. ' +
      'Jmenovité izolační napětí 250 V, konvenční tepelný proud 5 A, impulsní výdržné napětí ' +
      '2,5 kV, třída ochrany II. Četnost spínání 10/min (nižší než SI-LS100F kvůli mechanismu ' +
      'zámku), mechanická životnost 2×10⁶ spínacích cyklů, B10d hodnota 2×10⁶ spínacích cyklů, ' +
      'nelze kaskádovat. Okolní teplota -25 až +70 °C. Bezpečnostní klasifikace: PL e dle ' +
      'ISO 13849-1:2008, kategorie 4, SIL 3 dle IEC 61508, úroveň kódování/ochrana proti ' +
      'neoprávněné manipulaci nízká.',
    tags: 'spínač,bezpečnostní,koncový,limit-switch,zámek,solenoid,turck,si-ls42dsh,safety,pl-e,sil-3',
  },
  {
    name: 'VPEV-1/8-M12',
    packageType:
      'kovové (hliníková slitina) tělo, pneumatické připojení G1/8, elektrický konektor M12×1 ' +
      '(4 piny, kruhový, dle EN 60947-5-2), montáž s průchozí dírou, hmotnost 220 g, stupeň ' +
      'krytí IP65',
    value:
      'Vakuový/tlakový spínač (pneumaticko-elektrický převodník tlaku), přepínací funkce, ' +
      'rozsah měření -0,1 až 0,16 MPa (-1 až 1,6 bar), max. spínací napětí 48 V AC/DC, max. ' +
      'výstupní proud 4000 mA',
    notes:
      'Festo "VPEV-1/8-M12" — vakuový spínač (číslo dílu 192489), datasheet 11.08.26. Elektro' +
      'mechanický tlakový spínač s nastavitelnými prahovými hodnotami (-0,95 až -0,2 bar) a ' +
      'mezními hodnotami po přestavbě (0,16 až 1,6 bar), určený pro monitorování podtlaku/vakua ' +
      'v pneumatických systémech (např. vakuové úchopné hlavice). Shoda s EN 60947-5-1, ' +
      'certifikace CCC, UL Recognized (OL), CE, UKCA. ⚠️ Dostupný také v provedení pro výbušné ' +
      'prostředí (zóny 1/2/21/22 dle ATEX) — dbát upozornění v příslušném osvědčení, tento záznam ' +
      'pokrývá standardní provedení. Provozní médium stlačený vzduch dle ISO 8573-1:2010 [7:4:4] ' +
      '(mazaný provoz možný, ale pak nutno zachovat). Teplota média i okolní teplota -20 až ' +
      '+80 °C. Max. frekvence spínání 3 Hz. Minimální proud zátěže 1 mA@24V / 10 mA@10V / ' +
      '100 mA@5V. Kategorie spotřebiče: indukční zátěž AC-14/DC-13, ohmická zátěž AC-12/DC-12. ' +
      'Materiál tělesa tvárná slitina hliníku, materiál spínacího kontaktu postříbřený. Třída ' +
      'odolnosti korozi KBK 2 (mírné nároky), shoda s LABS VDMA24364-B1/B2-L.',
    tags: 'spínač,tlakový,vakuový,pneumatický,festo,vpev,192489,m12,ip65',
  },
  {
    name: 'Jazýčkový spínač 031828 (ISO 11446)',
    packageType:
      'válcové plastové pouzdro Ø5,7 mm, délka 22,2 mm, s vývodovými dráty, bez konektoru ' +
      '(vhodné pro pouzdro zásuvky obj. č. 382595/382597), stupeň krytí IP67',
    value:
      'Bezkontaktní jazýčkový (reed) spínač, spínací (NO), pro signální proudy do 0,5 A',
    notes:
      'Erich Jäger "031828" — automobilové příslušenství, jazýčkový spínač dle ISO 11446, ' +
      'datasheet 09/2026 (https://www.erich-jaeger.cs). ⚠️ NOVÁ SUB-KATEGORIE v "Spínač/Relé": ' +
      'první bezkontaktní (reed/jazýčkový) magnetický spínač v knihovně — spíná bezdotykově ' +
      'přiblížením magnetu, typicky pro snímání polohy/koncových poloh v automobilové technice ' +
      '(např. detekce otevření dveří/kapoty). Kategorie výrobce "Příslušenství", odvětví Auta. ' +
      'Datasheet neuvádí elektrické parametry nad rámec max. spínacího proudu (0,5 A) a stupně ' +
      'krytí IP67 — bez údajů o spínacím napětí, odporu v sepnutém stavu nebo mechanické ' +
      'životnosti.',
    tags: 'spínač,jazýčkový,reed,bezkontaktní,magnetický,erich-jaeger,031828,iso-11446,automotive',
  },
  {
    name: 'M22-WS (MM216881)',
    packageType:
      'panelová montáž do otvoru M22×1,5, průměr čela 29,7 mm, hloubka za panelem 47,75 mm, ' +
      'dotahovací moment 0,50 Nm, barva černá/světle šedá, stupeň krytí IP66',
    value:
      'Klíčový přepínač, 2-pólový, poloha 0-I (40° rozsah), bez aretace, bez osvětlení',
    notes:
      'Schrack Technik / Eaton "M22-WS" (technický list MM216881--), staženo 2026-09-08 z ' +
      'www.schrack.cz. Klíčový ovládací prvek řady M22 (kompatibilní s běžnými ovladači/kontakty ' +
      'této řady, montážní otvor Ø22 mm) — klíč lze odejmout ve spínací poloze 0. Nezbytné ' +
      'příslušenství (nutno dokoupit zvlášť, nejsou součástí tohoto dílu): kódovací adaptéry pro ' +
      'vyjmutí klíče MM216406 (sada 2 ks červený+zelený), kódovací adaptéry pro změnu aretace ' +
      'MM216407, propojovací díl MM216374, kontaktní blok 1× rozpínací (1R) MM216378 nebo ' +
      '1× spínací (1Z) MM216376 (šroubové svorky, čelní montáž, IP20) — samotný ovladač bez ' +
      'kontaktního bloku nespíná žádný obvod. Normy IEC EN 60947, VDE 0660. Odolnost rázům 30G. ' +
      'Provozní teplota -25 až +70 °C, klimatická odolnost dle IEC 60068-2-78 (vlhké teplo ' +
      'cyklické i konstantní). Mechanická životnost 100 000 spínacích cyklů, doporučená frekvence ' +
      'používání < 100 cyklů. Montážní poloha libovolná.',
    tags: 'spínač,klíčový,panelový,m22,m22-ws,schrack,eaton,mm216881,ip66',
  },
  {
    name: 'Schrack PT (paticové relé)',
    packageType:
      'paticové (plug-in) elektromagnetické relé, instalační výška 29 mm, THT vývody (pájecí ' +
      'nebo zásuvné), k dostání i s LED indikací a/nebo pozlacenými kontakty; patice na DIN ' +
      'lištu nebo do plošného spoje (8/11/14 pin dle počtu pólů)',
    value:
      'Elektromagnetické relé, 2-pólové 12 A, 3-pólové 10 A nebo 4-pólové 6 A (přepínací ' +
      'kontakty), cívka AC nebo DC 6...230 V, do 3000 VA spínaného výkonu',
    notes:
      'Schrack Technik katalog "Relé" (k-relaycz3.pdf) — řada PT, str. 6–11. ⚠️ SOUHRNNÝ ' +
      'KATALOGOVÝ ZÁZNAM: tento katalog pokrývá celou produktovou řadu Schrack relé (paticová, ' +
      'interfaceová, výkonová i bezpečnostní), tento záznam reprezentuje řadu PT jako celek — ' +
      'desítky konkrétních objednacích kódů dle napětí cívky/počtu pólů/provedení (např. ' +
      'PT570024 = 4P/24VDC, PT570730 = 4P/230VAC, PT270024 = 2P/24VDC, PT370730 = 3P/230VAC), ' +
      'viz katalog pro úplný přehled. Materiál kontaktů AgNi 90/10 (neobsahuje kadmium), zkušební ' +
      'tlačítko chráněné proti dotyku s volitelnou aretací, mechanický a elektrický ukazatel ' +
      'provozního stavu. Cívka 6-230V DC nebo 6-230V AC (50Hz), jmenovitý výkon cívky 750mW DC / ' +
      '1,0VA AC. Dielektrická pevnost cívka/kontakty 2500Veff, mezi rozpojenými kontakty ' +
      '1200Veff. Okolní teplota -40 až +70/80°C dle provedení. Dostupné příslušenství: ochranné a ' +
      'LED moduly, popisné štítky, upevňovací spony, propojovací můstky.',
    tags: 'relé,elektromagnetické,paticové,schrack,pt,pt2,pt3,pt5,din-lišta',
  },
  {
    name: 'Schrack RS5 (paticové S-relé)',
    packageType:
      'miniaturní paticové (plug-in) elektromagnetické relé, THT vývody, 14pinová patice na ' +
      'DIN lištu (šroubové nebo bezšroubové svorky)',
    value:
      'Elektromagnetické relé, 4-pólové (4CO), 6 A, cívka AC nebo DC 24/230 V, spínaný výkon ' +
      '1500 VA/180 W',
    notes:
      'Schrack Technik katalog "Relé" (k-relaycz3.pdf) — řada RS5, str. 12–17. ⚠️ SOUHRNNÝ ' +
      'KATALOGOVÝ ZÁZNAM (viz poznámka u "Schrack PT" pro kontext katalogu jako celku) — ' +
      'miniaturní průmyslové relé menší než řada PT, materiál kontaktů AgNi neobsahuje kadmium. ' +
      'Konkrétní kódy: RS500024 (24VDC), RS500524 (24VAC), RS500730 (230VAC). Odpor kontaktů ' +
      '≤50mΩ, elektrická životnost ≥10⁵ sepnutí (1800/h), mechanická životnost ≥10⁷ sepnutí ' +
      '(18000/h). Izolační napětí ≥1000MΩ (500VDC), spotřeba cívky ~0,9W DC / ~1,2VA AC, doba ' +
      'rozběhu/návratu ≤20ms. Okolní teplota -55 až +70°C, odolnost rázům 10G, vibracím 10-55Hz. ' +
      'Hmotnost relé ~35g. Dostupné moduly do patice: ochranná dioda (YRS13250), LED+dioda ' +
      '(YRS12024), LED (YRS11524/YRS11730), RC člen (YRS14524/YRS14730).',
    tags: 'relé,elektromagnetické,paticové,schrack,rs5,din-lišta',
  },
  {
    name: 'Schrack RXT (interfaceové S-relé)',
    packageType:
      'tenké kompaktní paticové relé s manuálním ovládáním, testovacím tlačítkem a kontrolním ' +
      'okénkem; patice na DIN lištu (šroubové nebo bezšroubové svorky, 5mm rozteč)',
    value:
      'Elektromagnetické interfaceové relé, 1-pólové 10 A nebo 2-pólové 5 A (přepínací ' +
      'kontakty), cívka AC nebo DC, identifikace napětí barvou tlačítka (AC červená/DC modrá)',
    notes:
      'Schrack Technik katalog "Relé" (k-relaycz3.pdf) — řada RXT, str. 18–23. ⚠️ SOUHRNNÝ ' +
      'KATALOGOVÝ ZÁZNAM (viz poznámka u "Schrack PT"). Určeno pro rozhraní PLC/řídicích systémů ' +
      '(galvanické oddělení signálu). Kódy patic: YRXT1010 (1P šroubová, 16A), YRXT1110 ' +
      '(1P bezšroubová), YRXT2010 (2P šroubová, 10A), YRXT2110 (2P bezšroubová). Materiál ' +
      'kontaktů slitina stříbra, odpor ≤50mΩ, elektrická životnost ≥10⁵ sepnutí (1800/h), ' +
      'mechanická ≥10⁷ sepnutí (1800/h). Spínaný výkon 1P: 3000VA/360W; 2P: 2000VA/240W. Cívka ' +
      '12/24V DC nebo 24/230V AC (odpor cívky např. 24VDC=1100Ω, 230VAC=23000Ω). Izolační napětí ' +
      '≥1000MΩ. Okolní teplota -40 až +55°C.',
    tags: 'relé,elektromagnetické,interfaceové,paticové,schrack,rxt,din-lišta',
  },
  {
    name: 'Schrack MU (paticové S-relé)',
    packageType:
      'kulaté (octal) paticové relé s manuálním ovládáním, testovacím tlačítkem a kontrolním ' +
      'okénkem, THT vývody; 8pinová (MU2) nebo 11pinová (MU3) patice na DIN lištu se ' +
      'šroubovými svorkami',
    value:
      'Elektromagnetické relé, 2-pólové nebo 3-pólové (přepínací kontakty), 10 A, cívka AC nebo ' +
      'DC 12...230 V, spínaný výkon 2500 VA/300 W',
    notes:
      'Schrack Technik katalog "Relé" (k-relaycz3.pdf) — řada MU, str. 24–27. ⚠️ SOUHRNNÝ ' +
      'KATALOGOVÝ ZÁZNAM (viz poznámka u "Schrack PT"). Desítky konkrétních kódů dle napětí ' +
      'cívky/počtu pólů/provedení (např. MU321024 = 3P/24VDC, MU326230 = 3P/230VAC, i verze s ' +
      'LED "MU323xxx"/"MU328xxx" a pozlacenými kontakty "Au"). Materiál kontaktů slitina stříbra, ' +
      'odpor ≤50mΩ, elektrická životnost ≥10⁵ sepnutí (1800/h), mechanická ≥10⁷ sepnutí (1800/h). ' +
      'Spotřeba cívky ~1,5W DC / ~2,7VA AC, doba rozběhu ≤30ms, návratu ≤20ms. Izolační napětí ' +
      '≥100MΩ (500VDC). Okolní teplota -10 až +55°C. Hmotnost ~85g. Svorky patice zabraňují ' +
      'nesprávnému zasunutí relé.',
    tags: 'relé,elektromagnetické,paticové,schrack,mu,mu2,mu3,din-lišta',
  },
  {
    name: 'Schrack RMX (paticové S-relé)',
    packageType:
      'paticové relé s manuálním ovládáním, testovacím tlačítkem a kontrolním okénkem, THT ' +
      'vývody; 11pinová patice na DIN lištu se šroubovými svorkami',
    value:
      'Elektromagnetické relé, 3-pólové (3 přepínací kontakty), 16 A, cívka AC nebo DC ' +
      '12...400 V, spínaný výkon 6400 VA/480 W (odporová zátěž)',
    notes:
      'Schrack Technik katalog "Relé" (k-relaycz3.pdf) — řada RMX, str. 28–31. ⚠️ SOUHRNNÝ ' +
      'KATALOGOVÝ ZÁZNAM (viz poznámka u "Schrack PT"). Výkonnější nástupce řady MU (16A vs. ' +
      '10A). Konkrétní kódy: RMX72012 (12VDC), RMX72024 (24VDC), RMX72060 (60VDC), RMX72524 ' +
      '(24VAC), RMX72730 (230VAC), RMX72900 (400VAC). Motorová zátěž 1/2P S/1PS 120-240VAC. ' +
      'Materiál kontaktů slitina stříbra, odpor ≤50mΩ, elektrická životnost ≥10⁵ sepnutí (1800/h), ' +
      'mechanická ≥10⁷ sepnutí (1800/h). Spotřeba cívky ~1,7W DC / ~2,5VA AC. Izolační napětí ' +
      '≥100MΩ (500VDC). Okolní teplota -40 až +55°C. Hmotnost ~90g. Patice YRMX78705: 25A/500V.',
    tags: 'relé,elektromagnetické,paticové,výkonové,schrack,rmx,din-lišta',
  },
  {
    name: 'Schrack RT (výkonové PCB relé)',
    packageType:
      'THT výkonové PCB relé, nízká instalační výška 15,7 mm, třída ochrany II (VDE 0700), ' +
      'bezpečné oddělení dle VDE 0160 ve spojení s paticí; k dispozici i patice na DIN lištu',
    value:
      'Elektromagnetické relé — RT1: 1-pólové (1 přepínací kontakt) 12 A nebo 16 A; RT2: ' +
      '2-pólové (2 přepínací kontakty) 8 A; cívka AC nebo DC 5...230 V, nízká spotřeba ' +
      '400mW/0,75VA',
    notes:
      'Schrack Technik katalog "Relé" (k-relaycz3.pdf) — řada RT, str. 32–37. ⚠️ SOUHRNNÝ ' +
      'KATALOGOVÝ ZÁZNAM (viz poznámka u "Schrack PT"). Určeno pro přímou montáž do DPS ' +
      '(řízení kotlů, garážových vrat, prodejních automatů u RT1; domácí spotřebiče, řízení ' +
      'topení, nouzové osvětlení, modemy u RT2). K dodání i s tvrdě zlacenými kontakty. ' +
      'Materiál kontaktů AgNi 90/10 (i tvrdě zlacené AgNi 90/10 htv). RT1: mezní trvalý proud ' +
      '12A nebo 16A (UL 20A), max. spínací výkon AC 3000/4000VA, zapínací proud 25/30A. RT2: ' +
      'mezní proud 8A (UL 10A), max. výkon 2000VA. Izolační systém cívky třída F dle UL1446, ' +
      '5kV/10mm izolace cívka-kontakty. Cívka DC 5-110V (400mW) nebo AC 24-230V (0,74VA).',
    tags: 'relé,elektromagnetické,výkonové,pcb,schrack,rt,rt1,rt2',
  },
  {
    name: 'Schrack RPS (výkonové PCB set relé)',
    packageType:
      'THT set relé + patice, nízká instalační výška 15,7 mm, v souladu s VDE 0700; patice ' +
      'YRTS0626/RT78725/RT7872P',
    value:
      'Elektromagnetické relé, 2-pólové (2 přepínací kontakty), 8 A, cívka AC nebo DC, 5kV/10mm ' +
      'izolace cívka-kontakty',
    notes:
      'Schrack Technik katalog "Relé" (k-relaycz3.pdf) — řada RPS, str. 38–39. ⚠️ SOUHRNNÝ ' +
      'KATALOGOVÝ ZÁZNAM (viz poznámka u "Schrack PT") — set relé+patice+spona+štítek, ' +
      'určeno pro domácí spotřebiče, řízení topení, nouzové osvětlení, modemy. Konkrétní kódy: ' +
      'RPS42024 (24VDC), RPS42524 (24VAC), RPS42730 (230VAC). Jmenovitý proud 8A/250VAC, max. ' +
      'spínací napětí 440VAC/300VDC, max. spínací výkon 2000VA. Odpor kontaktů ≤100mΩ, materiál ' +
      'AgNi, elektrická životnost ≥10⁴ sepnutí, mechanická ≥10⁷ sepnutí. Přepětí (cívka-kontakty) ' +
      '10kV (1,2/50µs). Okolní teplota -40 až +85°C. Hmotnost relé ~13,5g.',
    tags: 'relé,elektromagnetické,výkonové,pcb,set,schrack,rps',
  },
  {
    name: 'Schrack SNR (set relé s paticí)',
    packageType:
      'kompaktní set relé + patice na DIN lištu, šířka modulu jen 6,2 mm, THT vývody, ' +
      'šroubové nebo bezšroubové svorky, ochranná dioda, stupeň krytí patice IP20',
    value:
      'Elektromagnetické relé, 1-pólové (1 přepínací kontakt), 6 A, cívka DC 12/24 V nebo ' +
      'AC/DC 115/230 V',
    notes:
      'Schrack Technik katalog "Relé" (k-relaycz3.pdf) — řada SNR, str. 40–41. ⚠️ SOUHRNNÝ ' +
      'KATALOGOVÝ ZÁZNAM (viz poznámka u "Schrack PT") — malá stavební šířka umožňuje vysokou ' +
      'hustotu montáže na DIN lištu. Konkrétní kódy: ST3P3LB2 (12VDC), ST3P3LC4 (24VDC), ' +
      'ST3P2LC4 (24VDC, pozlacené), ST3P3TP0 (230V AC/DC) — všechny s LED indikací. Materiál ' +
      'kontaktů AgSnO₂/AgSnO₂ htv, max. spínací výkon 1500VA, zapínací schopnost 10A/20ms. ' +
      'Příkon cívky 12VDC=184mW, 24VDC=220mW, 115VAC=403mVA, 230VAC=736mVA. Okolní teplota -40 ' +
      'až +55°C. Odpovídá směrnici RoHS 2002/95/EC.',
    tags: 'relé,elektromagnetické,set,din-lišta,schrack,snr',
  },
  {
    name: 'Schrack SR (bezpečnostní relé s nuceně vedenými kontakty)',
    packageType:
      'THT relé pro montáž do DPS, zesílená izolace mezi kontakty/póly dle EN 50205; SR2 ' +
      'kompaktní, SR4 a SR6 na místo úsporné provedení',
    value:
      'Bezpečnostní relé s nuceně (mechanicky) vedenými kontakty (force-guided) — SR2: ' +
      '2-pólové 6 A (2 přepínací); SR4: 4-pólové 8 A (2 zapínací+2 rozpínací nebo 3+1); SR6: ' +
      '6-pólové 8 A (4 zapínací+2 rozpínací); cívka 24 V DC',
    notes:
      'Schrack Technik katalog "Relé" (k-relaycz3.pdf) — řada SR ("Relé s nuceně vedenými ' +
      'kontakty — bezpečnostní"), str. 63–66 (verze do plošného spoje; existuje i verze na DIN ' +
      'lištu, str. 67–69, mimo rozsah tohoto záznamu). ⚠️ SOUHRNNÝ KATALOGOVÝ ZÁZNAM (viz ' +
      'poznámka u "Schrack PT"). NOVÁ SUB-KATEGORIE: první relé s nuceně vedenými (force-guided) ' +
      'kontakty v knihovně — mechanická konstrukce zaručuje, že se zapínací a rozpínací kontakty ' +
      'nemohou sepnout současně ani při svaření kontaktu, používá se v bezpečnostních obvodech ' +
      '(nouzové vypínání strojů, řízení výtahů a pojízdných schodů). Odpovídá EN 50205. ' +
      'Konkrétní kódy: SR2Y5024 (SR2, 24VDC), SR4D4024/SR4M4024 (SR4, 24VDC), SR6B4024 (SR6, ' +
      '24VDC). Materiál kontaktů SR2 AgNi, SR4/SR6 AgSnO₂. Dielektrická pevnost kontakt-cívka ' +
      '1500-4000Veff dle typu, zesílená izolace mezi sousedními kontakty. Mechanická životnost ' +
      '10×10⁶ cyklů. Okolní teplota -25 až +70°C.',
    tags: 'relé,bezpečnostní,nuceně-vedené-kontakty,force-guided,schrack,sr,sr2,sr4,sr6,en-50205',
  },
];

export function buildRelaySeed(): ComponentInput[] {
  return RELAY_SPECS.map((spec) => ({
    name: spec.name,
    category: 'Spínač/Relé',
    manufacturer: null,
    packageType: spec.packageType,
    value: spec.value,
    quantity: 0,
    location: null,
    datasheetUrl: null,
    notes: spec.notes,
    tags: spec.tags,
  }));
}

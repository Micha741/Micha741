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

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

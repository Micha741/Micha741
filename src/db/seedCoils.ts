import type { ComponentInput } from '../types/component';

interface CoilSpec {
  name: string;
  packageType: string;
  value: string;
  notes: string;
  tags: string;
}

const COIL_SPECS: CoilSpec[] = [
  {
    name: 'P4100E5 series',
    packageType:
      'SMD proudový transformátor (tvarovaný feritový jádrový transformátor v plastovém ' +
      'krytu), rozměry cca 8,38×7,21×5,00 mm, 8 vývodů (piny 1,3,4,6,7,8 využity — primární ' +
      'vinutí 1T mezi piny 7-8, sekundární vinutí Ns mezi piny 6-4), hipot izolace min ' +
      '500 VRMS mezi vinutími',
    value:
      'Proudový snímací transformátor (current sense transformer), poměr 1:20 až 1:125 dle ' +
      'varianty, max. primární proud 10 A (špičkově, 40% duty cycle), provozní kmitočet ' +
      '50 kHz–1 MHz',
    notes:
      'MPS Industries "P4100E5 Series — Current Sensor" — ⚠️ POZOR: navzdory názvu "Current ' +
      'Sensor" NEJDE o polovodičovou součástku jako ostatní proudové senzory v této knihovně ' +
      '(ZMC10 — magnetorezistivní, Allegro ACS752/754/755 — Hallův jev), ale o čistě pasivní ' +
      'INDUKČNÍ komponentu — miniaturní proudový transformátor s jednozávitovým primárním ' +
      'vinutím (1T, piny 7-8) a vícezávitovým sekundárním vinutím (Ns, piny 6-4), určený k ' +
      'zapojení do primárního vodiče spínaného zdroje, kde transformuje velký měřený proud na ' +
      'menší, bezpečně měřitelný proud v sekundárním vinutí (obvykle přes zátěžový/burden ' +
      'rezistor) — typické pro proudové snímání v SMPS (spínaných zdrojích), motor drivers, ' +
      'invertorech. Zařazeno do kategorie "Cívka" jako induktivní/transformátorová součástka, ' +
      'ne do kategorie "IO". Datasheet pokrývá celou modelovou řadu lišící se poměrem závitů/ ' +
      'induktancí (jinak mechanicky i elektricky shodnou, stejné pouzdro a max. proud) — do ' +
      'knihovny přidán jako jeden souhrnný záznam pro celou "P4100E5-XX" řadu, konkrétní ' +
      'varianta (přípona -20 až -125) se volí dle požadovaného převodního poměru: P4100E5-20 ' +
      '(1:20, OCL min 0,08 mH, DCR sekundáru max 0,55 Ω), -30 (1:30, 0,18 mH, 0,87 Ω), -40 ' +
      '(1:40, 0,32 mH, 1,14 Ω), -50 (1:50, 0,50 mH, 1,50 Ω), -60 (1:60, 0,72 mH, 1,75 Ω), -70 ' +
      '(1:70, 0,98 mH, 4,75 Ω), -100 (1:100, 2,00 mH, 5,50 Ω), -125 (1:125, 3,00 mH, 6,50 Ω) — ' +
      'u všech variant DCR primárního vinutí (piny 8-7) max 6 mΩ, max primární proud 10 A ' +
      '(špičkově @40% duty cycle), OCL (open circuit inductance) měřena @15,75 kHz/0,1 VRMS. ' +
      'Izolační pevnost (hipot) min 500 VRMS mezi vinutími. Provozní kmitočet 50 kHz až 1 MHz ' +
      '(typické pro SMPS aplikace). Provozní teplota -40 až +85 °C. RoHS.',
    tags: 'cívka,transformátor,proudový-transformátor,current-sense,smd,mps-industries,p4100e5,smps',
  },
];

export function buildCoilSeed(): ComponentInput[] {
  return COIL_SPECS.map((spec) => ({
    name: spec.name,
    category: 'Cívka',
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

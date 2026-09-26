import type { ComponentInput } from '../types/component';
import { buildIcSeed } from './seedICs';
import { buildModuleSeed } from './seedModules';
import { buildConnectorSeed } from './seedConnectors';
import { buildMiscSeed } from './seedMisc';
import { buildCoilSeed } from './seedCoils';
import { buildRelaySeed } from './seedRelays';

function formatResistance(ohms: number): string {
  if (ohms >= 1_000_000) {
    const num = ohms / 1_000_000;
    return `${Number.isInteger(num) ? num : num.toFixed(1)} MΩ`;
  }
  if (ohms >= 1_000) {
    const num = ohms / 1_000;
    return `${Number.isInteger(num) ? num : num.toFixed(1)} kΩ`;
  }
  return `${Number.isInteger(ohms) ? ohms : ohms.toFixed(1)} Ω`;
}

const E12_BASE = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
const RESISTOR_DECADES = [1, 10, 100, 1_000, 10_000, 100_000, 1_000_000];

function buildResistorSeed(): ComponentInput[] {
  const items: ComponentInput[] = [];
  for (const decade of RESISTOR_DECADES) {
    for (const base of E12_BASE) {
      const ohms = Math.round(base * decade * 100) / 100;
      const label = formatResistance(ohms);
      items.push({
        name: label,
        category: 'Rezistor',
        manufacturer: null,
        packageType: 'THT, drátové vývody',
        value: label,
        quantity: 0,
        location: null,
        datasheetUrl: null,
        schematicImage: null,
        notes: 'Metalizovaný rezistor, řada E12, tolerance 5 %, 0,25 W',
        tags: 'rezistor,E12,0.25W,5%',
      });
    }
  }
  return items;
}

interface CapacitorSpec {
  value: string;
  type: 'keramický' | 'elektrolytický' | 'tantalový' | 'fóliový (MKT)';
  packageType: string;
  notes: string;
}

const CAPACITOR_SPECS: CapacitorSpec[] = [
  ...['10 pF', '22 pF', '47 pF', '100 pF', '220 pF', '470 pF', '1 nF', '2.2 nF', '4.7 nF', '10 nF', '22 nF', '47 nF', '100 nF', '220 nF', '470 nF'].map(
    (value): CapacitorSpec => ({
      value,
      type: 'keramický',
      packageType: 'THT, RM 2,5/5 mm',
      notes: 'Keramický kondenzátor, obecné použití, 50 V',
    })
  ),
  ...['1 µF', '2.2 µF', '4.7 µF', '10 µF', '22 µF', '47 µF', '100 µF', '220 µF', '470 µF', '1000 µF', '2200 µF', '4700 µF'].map(
    (value): CapacitorSpec => ({
      value,
      type: 'elektrolytický',
      packageType: 'THT, radiální',
      notes: 'Elektrolytický kondenzátor, typicky 25 V (ověř napětí u konkrétního kusu)',
    })
  ),
  ...['1 µF', '2.2 µF', '4.7 µF', '10 µF', '22 µF', '47 µF', '100 µF'].map(
    (value): CapacitorSpec => ({
      value,
      type: 'tantalový',
      packageType: 'SMD, typ A/B',
      notes: 'Tantalový kondenzátor, typicky 16 V (ověř napětí u konkrétního kusu)',
    })
  ),
  ...['1 nF', '10 nF', '100 nF', '220 nF', '1 µF'].map(
    (value): CapacitorSpec => ({
      value,
      type: 'fóliový (MKT)',
      packageType: 'THT, RM 5/7,5 mm',
      notes: 'Fóliový (polyesterový) kondenzátor, obecné použití',
    })
  ),
];

function buildCapacitorSeed(): ComponentInput[] {
  return CAPACITOR_SPECS.map((spec) => ({
    name: `${spec.value} ${spec.type}`,
    category: 'Kondenzátor',
    manufacturer: null,
    packageType: spec.packageType,
    value: spec.value,
    quantity: 0,
    location: null,
    datasheetUrl: null,
    schematicImage: null,
    notes: spec.notes,
    tags: `kondenzátor,${spec.type.split(' ')[0]}`,
  }));
}

interface PartSpec {
  name: string;
  packageType: string;
  value: string;
  notes: string;
  tags: string;
  /** Klíč do SCHEMATIC_IMAGES (src/assets/schematicImages.ts), pokud pro díl existuje schéma. */
  schematicImage?: string;
}

const DIODE_SPECS: PartSpec[] = [
  { name: '1N4001', packageType: 'DO-41', value: '1 A / 50 V', notes: 'Usměrňovací dioda', tags: 'dioda,usměrňovací' },
  { name: '1N4002', packageType: 'DO-41', value: '1 A / 100 V', notes: 'Usměrňovací dioda', tags: 'dioda,usměrňovací' },
  { name: '1N4003', packageType: 'DO-41', value: '1 A / 200 V', notes: 'Usměrňovací dioda', tags: 'dioda,usměrňovací' },
  { name: '1N4004', packageType: 'DO-41', value: '1 A / 400 V', notes: 'Usměrňovací dioda', tags: 'dioda,usměrňovací' },
  { name: '1N4005', packageType: 'DO-41', value: '1 A / 600 V', notes: 'Usměrňovací dioda', tags: 'dioda,usměrňovací' },
  { name: '1N4006', packageType: 'DO-41', value: '1 A / 800 V', notes: 'Usměrňovací dioda', tags: 'dioda,usměrňovací' },
  { name: '1N4007', packageType: 'DO-41', value: '1 A / 1000 V', notes: 'Usměrňovací dioda', tags: 'dioda,usměrňovací' },
  { name: '1N5399', packageType: 'DO-15', value: '1,5 A / 1000 V', notes: 'Usměrňovací dioda', tags: 'dioda,usměrňovací' },
  { name: '1N5408', packageType: 'DO-27', value: '3 A / 1000 V', notes: 'Usměrňovací dioda', tags: 'dioda,usměrňovací' },

  {
    name: 'GP1120',
    packageType: 'DO-41, plastové pouzdro (UL 94V-0), barevný pruh = katoda',
    value: '⚠️ 1 A / 1200 V (odvozeno, viz poznámka) — vysokonapěťová usměrňovací dioda',
    notes:
      'Diotec Electronics Corp. "High Voltage Diode Rectifiers" (dok. HVGP-1000-1C/2B) — mechanická ' +
      'sekce datasheetu popisuje "SERIES GP1120 - GP1500", ale ⚠️ tabulka elektrických parametrů v ' +
      'této revizi datasheetu explicitně uvádí jen GP1150 až GP1600 (GP1120 v tabulce chybí — ' +
      'nekonzistence v samotném zdrojovém dokumentu, patrně z předchozí revize řady). VRM=1200 V ' +
      'odvozeno z jednoznačného vzorce platného pro všech 8 tabulkových dílů (VRM = číslo za "GP1" ' +
      '× 10 V: GP1150→1500V, GP1180→1800V, GP1200→2000V, ... GP1600→6000V), elektrické parametry ' +
      '(Io, IFSM, VFM) převzaty ze skupiny GP1150-1200 (nejnižší napěťové pásmo), do které by ' +
      'GP1120 podle napětí spadal. Pro jistotu doporučeno ověřit u výrobce/na jiném revize ' +
      'datasheetu před nákupem/návrhem. Sourozenecké záznamy GP1150–GP1600 mají hodnoty přímo z ' +
      'tabulky (bez ⚠️). Společné pro celou řadu: proprietární "Soft Glass" pasivace přechodu, ' +
      'vakuové pájení čipu bez dutin (void-free), IRM max 1,0 µA @25°C při jmenovitém VDC, CJ typ ' +
      '12 pF @1MHz/4V, TJ/Tstg -65 až +150°C. Io=1000 mA (@TA=50°C, délka vývodu 9,5mm), IFSM=35 A ' +
      '(8,3ms půlvlna), VFM max 1,5 V (při jmenovitém proudu).',
    tags: 'dioda,usměrňovací,vysokonapěťová,diotec,gp-series,gp1120,do-41',
  },
  {
    name: 'GP1150',
    packageType: 'DO-41, plastové pouzdro (UL 94V-0), barevný pruh = katoda',
    value: '1 A / 1500 V — vysokonapěťová usměrňovací dioda',
    notes:
      'Diotec Electronics Corp. "High Voltage Diode Rectifiers" (dok. HVGP-1000-1C/2B) — součást ' +
      'řady GP1120–GP1600, viz poznámka u GP1120 pro společné specifikace. VRM=1500 V, VRRM=1500 V, ' +
      'VRMS=1050 V. Io=1000 mA (@TA=50°C), IFSM=35 A, VFM max 1,5 V.',
    tags: 'dioda,usměrňovací,vysokonapěťová,diotec,gp-series,gp1150,do-41',
  },
  {
    name: 'GP1180',
    packageType: 'DO-41, plastové pouzdro (UL 94V-0), barevný pruh = katoda',
    value: '1 A / 1800 V — vysokonapěťová usměrňovací dioda',
    notes:
      'Diotec Electronics Corp. "High Voltage Diode Rectifiers" — součást řady GP1120–GP1600, viz ' +
      'poznámka u GP1120 pro společné specifikace. VRM=1800 V, VRRM=1800 V, VRMS=1260 V. Io=1000 mA ' +
      '(@TA=50°C), IFSM=35 A, VFM max 1,5 V.',
    tags: 'dioda,usměrňovací,vysokonapěťová,diotec,gp-series,gp1180,do-41',
  },
  {
    name: 'GP1200',
    packageType: 'DO-41, plastové pouzdro (UL 94V-0), barevný pruh = katoda',
    value: '1 A / 2000 V — vysokonapěťová usměrňovací dioda',
    notes:
      'Diotec Electronics Corp. "High Voltage Diode Rectifiers" — součást řady GP1120–GP1600, viz ' +
      'poznámka u GP1120 pro společné specifikace. VRM=2000 V, VRRM=2000 V, VRMS=1400 V. Io=1000 mA ' +
      '(@TA=50°C), IFSM=35 A, VFM max 1,5 V.',
    tags: 'dioda,usměrňovací,vysokonapěťová,diotec,gp-series,gp1200,do-41',
  },
  {
    name: 'GP1250',
    packageType: 'DO-41, plastové pouzdro (UL 94V-0), barevný pruh = katoda',
    value: '0,5 A / 2500 V — vysokonapěťová usměrňovací dioda',
    notes:
      'Diotec Electronics Corp. "High Voltage Diode Rectifiers" — součást řady GP1120–GP1600, viz ' +
      'poznámka u GP1120 pro společné specifikace. VRM=2500 V, VRRM=2500 V, VRMS=1750 V. Io=500 mA ' +
      '(@TA=50°C), IFSM=25 A, VFM max 3,0 V.',
    tags: 'dioda,usměrňovací,vysokonapěťová,diotec,gp-series,gp1250,do-41',
  },
  {
    name: 'GP1300',
    packageType: 'DO-41, plastové pouzdro (UL 94V-0), barevný pruh = katoda',
    value: '0,5 A / 3000 V — vysokonapěťová usměrňovací dioda',
    notes:
      'Diotec Electronics Corp. "High Voltage Diode Rectifiers" — součást řady GP1120–GP1600, viz ' +
      'poznámka u GP1120 pro společné specifikace. VRM=3000 V, VRRM=3000 V, VRMS=2100 V. Io=500 mA ' +
      '(@TA=50°C), IFSM=25 A, VFM max 3,0 V.',
    tags: 'dioda,usměrňovací,vysokonapěťová,diotec,gp-series,gp1300,do-41',
  },
  {
    name: 'GP1400',
    packageType: 'DO-41, plastové pouzdro (UL 94V-0), barevný pruh = katoda',
    value: '0,5 A / 4000 V — vysokonapěťová usměrňovací dioda',
    notes:
      'Diotec Electronics Corp. "High Voltage Diode Rectifiers" — součást řady GP1120–GP1600, viz ' +
      'poznámka u GP1120 pro společné specifikace. VRM=4000 V, VRRM=4000 V, VRMS=2800 V. Io=500 mA ' +
      '(@TA=50°C), IFSM=25 A, VFM max 3,0 V.',
    tags: 'dioda,usměrňovací,vysokonapěťová,diotec,gp-series,gp1400,do-41',
  },
  {
    name: 'GP1500',
    packageType: 'DO-41, plastové pouzdro (UL 94V-0), barevný pruh = katoda',
    value: '0,2 A / 5000 V — vysokonapěťová usměrňovací dioda',
    notes:
      'Diotec Electronics Corp. "High Voltage Diode Rectifiers" — součást řady GP1120–GP1600, viz ' +
      'poznámka u GP1120 pro společné specifikace. VRM=5000 V, VRRM=5000 V, VRMS=3500 V. Io=200 mA ' +
      '(@TA=50°C), IFSM=15 A, VFM max 4,5 V.',
    tags: 'dioda,usměrňovací,vysokonapěťová,diotec,gp-series,gp1500,do-41',
  },
  {
    name: 'GP1600',
    packageType: 'DO-41, plastové pouzdro (UL 94V-0), barevný pruh = katoda',
    value: '0,2 A / 6000 V — vysokonapěťová usměrňovací dioda',
    notes:
      'Diotec Electronics Corp. "High Voltage Diode Rectifiers" — součást řady GP1120–GP1600, viz ' +
      'poznámka u GP1120 pro společné specifikace. VRM=6000 V, VRRM=6000 V, VRMS=4200 V. Io=200 mA ' +
      '(@TA=50°C), IFSM=15 A, VFM max 6,0 V.',
    tags: 'dioda,usměrňovací,vysokonapěťová,diotec,gp-series,gp1600,do-41',
  },

  { name: '1N4148', packageType: 'DO-35', value: '150 mA / 100 V', notes: 'Spínací (signálová) dioda', tags: 'dioda,spínací,signálová' },
  { name: '1N914', packageType: 'DO-35', value: '100 mA / 100 V', notes: 'Spínací (signálová) dioda', tags: 'dioda,spínací,signálová' },

  { name: '1N5817', packageType: 'DO-41', value: '1 A / 20 V', notes: 'Schottky dioda', tags: 'dioda,schottky' },
  { name: '1N5818', packageType: 'DO-41', value: '1 A / 30 V', notes: 'Schottky dioda', tags: 'dioda,schottky' },
  { name: '1N5819', packageType: 'DO-41', value: '1 A / 40 V', notes: 'Schottky dioda', tags: 'dioda,schottky' },
  { name: 'BAT43', packageType: 'DO-35', value: '200 mA / 30 V', notes: 'Schottky dioda', tags: 'dioda,schottky' },
  { name: 'BAT46', packageType: 'DO-35', value: '150 mA / 100 V', notes: 'Schottky dioda', tags: 'dioda,schottky' },
  { name: 'BAT85', packageType: 'DO-35', value: '200 mA / 30 V', notes: 'Schottky dioda', tags: 'dioda,schottky' },
  {
    name: 'SS12',
    packageType: 'SMA (SMD, case 403AE), 2 vývody: 1=anoda, 2=katoda',
    value: 'Schottky dioda, VRRM 20 V, IF(AV) 1,0 A, VF max 500 mV @IF=1,0 A',
    notes:
      'Součást rodiny SS12–S100 (ON Semiconductor, datasheet SS19/D rev. 3, leden 2019) — společný ' +
      'datasheet pro 8 dílů lišících se jen VRRM a VF, viz i sourozenecké záznamy SS13/SS14/SS15/SS16/' +
      'SS18/SS19/S100. Pb-free/halogen-free, RoHS. Skleněný (glass-passivated) přechod, klip-bonded ' +
      'nožičky pro nízký el. odpor a dobrý tepelný přenos. Vhodné pro free-wheeling, sekundární ' +
      'usměrnění, ochranu proti přepólování. ' +
      'Mezní hodnoty: VRRM=20 V, IF(AV)=1,0 A (0,375" délka vývodu @TA=75 °C), IFSM=40 A ' +
      '(8,3 ms jednorázová půlvlna), TJ=-65 až +125 °C, Tstg=-65 až +150 °C, Ptot=1,1 W, ' +
      'RθJA=88 °C/W (na FR4 desce). ' +
      'VF max 500 mV @IF=1,0 A/25 °C. IR max 0,2 mA @25 °C (max 10 mA @100 °C) při jmenovitém VR.',
    tags: 'dioda,schottky,smd,sma,ss12',
  },
  {
    name: 'SS13',
    packageType: 'SMA (SMD, case 403AE), 2 vývody: 1=anoda, 2=katoda',
    value: 'Schottky dioda, VRRM 30 V, IF(AV) 1,0 A, VF max 500 mV @IF=1,0 A',
    notes:
      'Součást rodiny SS12–S100 (ON Semiconductor, datasheet SS19/D rev. 3, leden 2019) — viz ' +
      'poznámka u sourozeneckého záznamu SS12 pro plný popis rodiny. Pb-free/halogen-free, RoHS. ' +
      'Mezní hodnoty: VRRM=30 V, IF(AV)=1,0 A (0,375" délka vývodu @TA=75 °C), IFSM=40 A ' +
      '(8,3 ms jednorázová půlvlna), TJ=-65 až +125 °C, Tstg=-65 až +150 °C, Ptot=1,1 W, ' +
      'RθJA=88 °C/W (na FR4 desce). ' +
      'VF max 500 mV @IF=1,0 A/25 °C. IR max 0,2 mA @25 °C (max 10 mA @100 °C) při jmenovitém VR.',
    tags: 'dioda,schottky,smd,sma,ss13',
  },
  {
    name: 'SS14',
    packageType: 'SMA (SMD, case 403AE), 2 vývody: 1=anoda, 2=katoda',
    value: 'Schottky dioda, VRRM 40 V, IF(AV) 1,0 A, VF max 500 mV @IF=1,0 A',
    notes:
      'Součást rodiny SS12–S100 (ON Semiconductor, datasheet SS19/D rev. 3, leden 2019) — viz ' +
      'poznámka u sourozeneckého záznamu SS12 pro plný popis rodiny. Pb-free/halogen-free, RoHS. ' +
      'Mezní hodnoty: VRRM=40 V, IF(AV)=1,0 A (0,375" délka vývodu @TA=75 °C), IFSM=40 A ' +
      '(8,3 ms jednorázová půlvlna), TJ=-65 až +125 °C, Tstg=-65 až +150 °C, Ptot=1,1 W, ' +
      'RθJA=88 °C/W (na FR4 desce). ' +
      'VF max 500 mV @IF=1,0 A/25 °C. IR max 0,2 mA @25 °C (max 10 mA @100 °C) při jmenovitém VR.',
    tags: 'dioda,schottky,smd,sma,ss14',
  },
  {
    name: 'SS15',
    packageType: 'SMA (SMD, case 403AE), 2 vývody: 1=anoda, 2=katoda',
    value: 'Schottky dioda, VRRM 50 V, IF(AV) 1,0 A, VF max 700 mV @IF=1,0 A',
    notes:
      'Součást rodiny SS12–S100 (ON Semiconductor, datasheet SS19/D rev. 3, leden 2019) — viz ' +
      'poznámka u sourozeneckého záznamu SS12 pro plný popis rodiny. Pb-free/halogen-free, RoHS. ' +
      'Mezní hodnoty: VRRM=50 V, IF(AV)=1,0 A (0,375" délka vývodu @TA=75 °C), IFSM=40 A ' +
      '(8,3 ms jednorázová půlvlna), TJ=-65 až +125 °C, Tstg=-65 až +150 °C, Ptot=1,1 W, ' +
      'RθJA=88 °C/W (na FR4 desce). ' +
      'VF max 700 mV @IF=1,0 A/25 °C. IR max 0,2 mA @25 °C (max 10 mA @100 °C) při jmenovitém VR.',
    tags: 'dioda,schottky,smd,sma,ss15',
  },
  {
    name: 'SS16',
    packageType: 'SMA (SMD, case 403AE), 2 vývody: 1=anoda, 2=katoda',
    value: 'Schottky dioda, VRRM 60 V, IF(AV) 1,0 A, VF max 700 mV @IF=1,0 A',
    notes:
      'Součást rodiny SS12–S100 (ON Semiconductor, datasheet SS19/D rev. 3, leden 2019) — viz ' +
      'poznámka u sourozeneckého záznamu SS12 pro plný popis rodiny. Pb-free/halogen-free, RoHS. ' +
      'Mezní hodnoty: VRRM=60 V, IF(AV)=1,0 A (0,375" délka vývodu @TA=75 °C), IFSM=40 A ' +
      '(8,3 ms jednorázová půlvlna), TJ=-65 až +125 °C, Tstg=-65 až +150 °C, Ptot=1,1 W, ' +
      'RθJA=88 °C/W (na FR4 desce). ' +
      'VF max 700 mV @IF=1,0 A/25 °C. IR max 0,2 mA @25 °C (max 10 mA @100 °C) při jmenovitém VR.',
    tags: 'dioda,schottky,smd,sma,ss16',
  },
  {
    name: 'SS18',
    packageType: 'SMA (SMD, case 403AE), 2 vývody: 1=anoda, 2=katoda',
    value: 'Schottky dioda, VRRM 80 V, IF(AV) 1,0 A, VF max 850 mV @IF=1,0 A',
    notes:
      'Součást rodiny SS12–S100 (ON Semiconductor, datasheet SS19/D rev. 3, leden 2019) — viz ' +
      'poznámka u sourozeneckého záznamu SS12 pro plný popis rodiny. Pb-free/halogen-free, RoHS. ' +
      'Mezní hodnoty: VRRM=80 V, IF(AV)=1,0 A (0,375" délka vývodu @TA=75 °C), IFSM=40 A ' +
      '(8,3 ms jednorázová půlvlna), TJ=-65 až +125 °C, Tstg=-65 až +150 °C, Ptot=1,1 W, ' +
      'RθJA=88 °C/W (na FR4 desce). ' +
      'VF max 850 mV @IF=1,0 A/25 °C. IR max 0,2 mA @25 °C (max 10 mA @100 °C) při jmenovitém VR.',
    tags: 'dioda,schottky,smd,sma,ss18',
  },
  {
    name: 'SS19',
    packageType: 'SMA (SMD, case 403AE), 2 vývody: 1=anoda, 2=katoda',
    value: 'Schottky dioda, VRRM 90 V, IF(AV) 1,0 A, VF max 850 mV @IF=1,0 A',
    notes:
      'Součást rodiny SS12–S100 (ON Semiconductor, datasheet SS19/D rev. 3, leden 2019) — viz ' +
      'poznámka u sourozeneckého záznamu SS12 pro plný popis rodiny. Pb-free/halogen-free, RoHS. ' +
      'Mezní hodnoty: VRRM=90 V, IF(AV)=1,0 A (0,375" délka vývodu @TA=75 °C), IFSM=40 A ' +
      '(8,3 ms jednorázová půlvlna), TJ=-65 až +125 °C, Tstg=-65 až +150 °C, Ptot=1,1 W, ' +
      'RθJA=88 °C/W (na FR4 desce). ' +
      'VF max 850 mV @IF=1,0 A/25 °C. IR max 0,2 mA @25 °C (max 10 mA @100 °C) při jmenovitém VR.',
    tags: 'dioda,schottky,smd,sma,ss19',
  },
  {
    name: 'S100',
    packageType: 'SMA (SMD, case 403AE), 2 vývody: 1=anoda, 2=katoda',
    value: 'Schottky dioda, VRRM 100 V, IF(AV) 1,0 A, VF max 850 mV @IF=1,0 A',
    notes:
      'Součást rodiny SS12–S100 (ON Semiconductor, datasheet SS19/D rev. 3, leden 2019) — nejvyšší ' +
      'napěťová varianta rodiny, viz poznámka u sourozeneckého záznamu SS12 pro plný popis rodiny. ' +
      'Pb-free/halogen-free, RoHS. ' +
      'Mezní hodnoty: VRRM=100 V, IF(AV)=1,0 A (0,375" délka vývodu @TA=75 °C), IFSM=40 A ' +
      '(8,3 ms jednorázová půlvlna), TJ=-65 až +125 °C, Tstg=-65 až +150 °C, Ptot=1,1 W, ' +
      'RθJA=88 °C/W (na FR4 desce). ' +
      'VF max 850 mV @IF=1,0 A/25 °C. IR max 0,2 mA @25 °C (max 10 mA @100 °C) při jmenovitém VR.',
    tags: 'dioda,schottky,smd,sma,s100',
  },
  { name: 'SS34', packageType: 'SMB (SMD)', value: '3 A / 40 V', notes: 'Schottky dioda, SMD', tags: 'dioda,schottky,smd' },
  {
    name: 'NSR01L30MXT5G',
    packageType:
      'X3DFN2 (SMD), rozměry 0,62×0,32×0,24 mm, rozteč 0,35 mm, 2 vývody: 1=katoda, 2=anoda',
    value: 'Schottky dioda, VR 30 V, IF 100 mA (DC), VF max 350 mV @IF=1 mA',
    schematicImage: 'NSR01L30MXT5G.jpg',
    notes:
      'onsemi "NSR01L30MX — Schottky Barrier Diode" (dok. NSR01L30MX/D, rev. 5, 2026) — extrémně ' +
      'malé pouzdro (velikost srovnatelná s 0201 pasivní SMD součástkou), optimalizováno na nízký ' +
      'úbytek napětí v propustném směru a nízký únikový proud. Halide-free i Pb-free provedení. ' +
      'Mezní hodnoty: VR=30 V, IF(DC)=100 mA, IFSM=2,0 A (60 Hz/1 cyklus), TJ max +150 °C, Tstg -55 ' +
      'až +150 °C. ESD: HBM Class 1B (500≤porucha<1000), CDM Class C3 JEDEC (porucha≥1000). ' +
      'RθJA=695 °C/W (na 4" čtverci FR-4, 100mm², 2oz Cu, jednostranná), PD=180 mW @TA=25°C. ' +
      'VF max 350 mV @IF=1 mA (460 mV @IF=10 mA). IR max 0,2 µA @VR=10 V (0,5 µA @VR=30 V). ' +
      'Celková kapacita CT typ 0,8 pF @VR=5V/1MHz. Reverse recovery time trr typ 1,66 ns ' +
      '(IF=IR=10mA). Aplikace: podsvícení LCD/klávesnice, foto blesk fotoaparátu, buck/boost ' +
      'DC-DC měniče, ochrana proti zpětnému napětí/proudu, clamping. Značení na pouzdře: kód L ' +
      '(otočeno 180°) + datový kód M.',
    tags: 'dioda,schottky,smd,onsemi,nsr01l30mx,x3dfn2,0201,30v',
  },

  { name: 'BZX55C3V3', packageType: 'DO-35', value: '3,3 V / 0,5 W', notes: 'Zenerova dioda', tags: 'dioda,zener' },
  { name: 'BZX55C3V9', packageType: 'DO-35', value: '3,9 V / 0,5 W', notes: 'Zenerova dioda', tags: 'dioda,zener' },
  { name: 'BZX55C4V7', packageType: 'DO-35', value: '4,7 V / 0,5 W', notes: 'Zenerova dioda', tags: 'dioda,zener' },
  { name: 'BZX55C5V1', packageType: 'DO-35', value: '5,1 V / 0,5 W', notes: 'Zenerova dioda', tags: 'dioda,zener' },
  { name: 'BZX55C5V6', packageType: 'DO-35', value: '5,6 V / 0,5 W', notes: 'Zenerova dioda', tags: 'dioda,zener' },
  { name: 'BZX55C6V2', packageType: 'DO-35', value: '6,2 V / 0,5 W', notes: 'Zenerova dioda', tags: 'dioda,zener' },
  { name: 'BZX55C6V8', packageType: 'DO-35', value: '6,8 V / 0,5 W', notes: 'Zenerova dioda', tags: 'dioda,zener' },
  { name: 'BZX55C7V5', packageType: 'DO-35', value: '7,5 V / 0,5 W', notes: 'Zenerova dioda', tags: 'dioda,zener' },
  { name: 'BZX55C8V2', packageType: 'DO-35', value: '8,2 V / 0,5 W', notes: 'Zenerova dioda', tags: 'dioda,zener' },
  { name: 'BZX55C9V1', packageType: 'DO-35', value: '9,1 V / 0,5 W', notes: 'Zenerova dioda', tags: 'dioda,zener' },
  { name: 'BZX55C10', packageType: 'DO-35', value: '10 V / 0,5 W', notes: 'Zenerova dioda', tags: 'dioda,zener' },
  { name: 'BZX55C12', packageType: 'DO-35', value: '12 V / 0,5 W', notes: 'Zenerova dioda', tags: 'dioda,zener' },
  { name: 'BZX55C15', packageType: 'DO-35', value: '15 V / 0,5 W', notes: 'Zenerova dioda', tags: 'dioda,zener' },
  { name: 'BZX55C18', packageType: 'DO-35', value: '18 V / 0,5 W', notes: 'Zenerova dioda', tags: 'dioda,zener' },
  { name: 'BZX55C22', packageType: 'DO-35', value: '22 V / 0,5 W', notes: 'Zenerova dioda', tags: 'dioda,zener' },

  { name: 'SMZ253A', packageType: 'SOD-123FL (SMD)', value: '3,0 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 6A. (EIC, řada SMZ25, PD=1,3 W, VF max 1,2 V @IF=200 mA, TJ/Tstg -55 až +150 °C, datasheet rev. 01, 2009-01-12)', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ253D', packageType: 'SOD-123FL (SMD)', value: '3,3 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 6B. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ253G', packageType: 'SOD-123FL (SMD)', value: '3,6 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 6C. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ253J', packageType: 'SOD-123FL (SMD)', value: '3,9 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 6D. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ254D', packageType: 'SOD-123FL (SMD)', value: '4,3 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 6E. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ254H', packageType: 'SOD-123FL (SMD)', value: '4,7 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 6F. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ255B', packageType: 'SOD-123FL (SMD)', value: '5,1 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 6H. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ255G', packageType: 'SOD-123FL (SMD)', value: '5,6 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 6J. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ256C', packageType: 'SOD-123FL (SMD)', value: '6,2 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 6K. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ256I', packageType: 'SOD-123FL (SMD)', value: '6,8 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 6M. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ257F', packageType: 'SOD-123FL (SMD)', value: '7,5 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 6N. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ258C', packageType: 'SOD-123FL (SMD)', value: '8,2 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 6P. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ259B', packageType: 'SOD-123FL (SMD)', value: '9,1 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 6R. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2510', packageType: 'SOD-123FL (SMD)', value: '10 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 6X. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2511', packageType: 'SOD-123FL (SMD)', value: '11 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 6Y. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2512', packageType: 'SOD-123FL (SMD)', value: '12 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 6Z. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2513', packageType: 'SOD-123FL (SMD)', value: '13 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 7A. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2515', packageType: 'SOD-123FL (SMD)', value: '15 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 7B. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2516', packageType: 'SOD-123FL (SMD)', value: '16 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 7C. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2518', packageType: 'SOD-123FL (SMD)', value: '18 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 7D. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2519', packageType: 'SOD-123FL (SMD)', value: '19 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 7E. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2520', packageType: 'SOD-123FL (SMD)', value: '20 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 7F. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2522', packageType: 'SOD-123FL (SMD)', value: '22 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 7H. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2524', packageType: 'SOD-123FL (SMD)', value: '24 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 7J. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2527', packageType: 'SOD-123FL (SMD)', value: '27 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 7K. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2530', packageType: 'SOD-123FL (SMD)', value: '30 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 7M. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2533', packageType: 'SOD-123FL (SMD)', value: '33 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 7N. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2536', packageType: 'SOD-123FL (SMD)', value: '36 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 7P. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2539', packageType: 'SOD-123FL (SMD)', value: '39 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 7R. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2543', packageType: 'SOD-123FL (SMD)', value: '43 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 7X. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2547', packageType: 'SOD-123FL (SMD)', value: '47 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 7Y. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2551', packageType: 'SOD-123FL (SMD)', value: '51 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 7Z. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2556', packageType: 'SOD-123FL (SMD)', value: '56 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 8A. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2562', packageType: 'SOD-123FL (SMD)', value: '62 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 8B. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2568', packageType: 'SOD-123FL (SMD)', value: '68 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 8C. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2575', packageType: 'SOD-123FL (SMD)', value: '75 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 8D. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2582', packageType: 'SOD-123FL (SMD)', value: '82 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 8E. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ2591', packageType: 'SOD-123FL (SMD)', value: '91 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 8F. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ25B0', packageType: 'SOD-123FL (SMD)', value: '100 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 8H. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ25B1', packageType: 'SOD-123FL (SMD)', value: '110 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 8J. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ25B2', packageType: 'SOD-123FL (SMD)', value: '120 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 8K. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ25B3', packageType: 'SOD-123FL (SMD)', value: '130 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 8M. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ25B5', packageType: 'SOD-123FL (SMD)', value: '150 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 8N. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ25B6', packageType: 'SOD-123FL (SMD)', value: '160 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 8P. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ25B8', packageType: 'SOD-123FL (SMD)', value: '180 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 8R. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },
  { name: 'SMZ25D0', packageType: 'SOD-123FL (SMD)', value: '200 V / 1,3 W', notes: 'Zenerova dioda SMD, tolerance ±5 %, značení na pouzdře: 8X. Součást řady SMZ25 (EIC) — viz poznámka u SMZ253A pro plné mezní hodnoty.', tags: 'dioda,zener,smd,sod-123fl,smz25' },

  { name: 'LED 5mm červená', packageType: '5 mm THT', value: '~2,0 V / 20 mA', notes: 'Standardní LED', tags: 'dioda,led,červená' },
  { name: 'LED 5mm žlutá', packageType: '5 mm THT', value: '~2,1 V / 20 mA', notes: 'Standardní LED', tags: 'dioda,led,žlutá' },
  { name: 'LED 5mm zelená', packageType: '5 mm THT', value: '~2,2 V / 20 mA', notes: 'Standardní LED', tags: 'dioda,led,zelená' },
  { name: 'LED 5mm modrá', packageType: '5 mm THT', value: '~3,2 V / 20 mA', notes: 'Standardní LED', tags: 'dioda,led,modrá' },
  { name: 'LED 5mm bílá', packageType: '5 mm THT', value: '~3,2 V / 20 mA', notes: 'Standardní LED', tags: 'dioda,led,bílá' },
  { name: 'LED 5mm infra (IR)', packageType: '5 mm THT', value: '~1,2 V / 20 mA', notes: 'Infračervená LED', tags: 'dioda,led,infra' },
  { name: 'LED 3mm červená', packageType: '3 mm THT', value: '~2,0 V / 20 mA', notes: 'Standardní LED', tags: 'dioda,led,červená' },
  { name: 'LED 3mm zelená', packageType: '3 mm THT', value: '~2,2 V / 20 mA', notes: 'Standardní LED', tags: 'dioda,led,zelená' },

  {
    name: 'LXML-PF01',
    packageType:
      'SMD keramické pouzdro LUXEON Rebel, 4,61 × 3,17 mm (min. 4,37 × 2,93 mm), kopulovitá ' +
      'čočka Ø2,61 mm, 3 pájecí plošky (1=katoda, 2=anoda, 3=tepelná plocha, elektricky izolovaná ' +
      'od katody/anody)',
    value:
      'Výkonová LED Far Red, peak λ 720–750 nm, zářivý výkon 210–260 mW (typ.) @IF=350 mA, ' +
      'VF 1,60–2,40 V (typ. 1,80 V)',
    notes:
      'Lumileds LUXEON Rebel Color Line (datasheet DS68, rev. 20230103) — rodina výkonových SMD ' +
      'LED na keramickém nosiči, konstrukčně zcela odlišná od generických 3/5mm THT LED již v ' +
      'knihovně (viz "LED 5mm/3mm ..." výše) — přidáno jako samostatné položky, ne jako úprava ' +
      'generických záznamů. LXML-PF01 = Far Red, čip AlInGaP, testováno IF=350 mA, TJ=25 °C, binováno ' +
      'podle peak vlnové délky a zářivého výkonu (radiometrického, ne světelného toku). Spektrální ' +
      'pološířka 30 nm, teplotní koeficient vlnové délky 0,17 nm/°C, celkový vyzařovací úhel 145° ' +
      '(typ. viditelný úhel 125°). Tepelný odpor přechod–pájecí ploška 5,50 °C/W. Mezní hodnoty ' +
      '(skupina Far Red/Deep Red/Red/Red-Orange/Amber): DC proud 700 mA, špičkový pulzní proud ' +
      '875 mA (pulz ≤5 ms, duty ≤50 %), TJ max 135 °C, provozní teplota pouzdra -40 až 120 °C, ' +
      'ESD třída 3A (ANSI/ESDA/JEDEC JS-001-2012), vlhkostní citlivost MSL1 (JEDEC 020c), pájení ' +
      'reflow max 260 °C (max. 3 cykly). LUXEON LED nejsou určeny k provozu v závěrném směru.',
    tags: 'dioda,led,výkonová,smd,luxeon,luxeon-rebel,far-red',
  },
  {
    name: 'LXM3-PD01',
    packageType:
      'SMD keramické pouzdro LUXEON Rebel, 4,61 × 3,17 mm, kopulovitá čočka Ø2,61 mm, 3 pájecí ' +
      'plošky (1=katoda, 2=anoda, 3=tepelná plocha, izolovaná)',
    value:
      'Výkonová LED Deep Red, peak λ 650–670 nm, zářivý výkon 270–360 mW (typ.) @IF=350 mA, ' +
      'VF 1,80–2,80 V (typ. 2,10 V)',
    notes:
      'Lumileds LUXEON Rebel Color Line (DS68, 20230103). LXM3-PD01 = Deep Red, čip AlInGaP. ' +
      '⚠️ Odlišný ordering code od "Far Red" (LXML-PF01, samostatný záznam, kratší vlnová délka ' +
      '720–750 nm) a od rodiny "Red" LXM2/LXML/LXM5-PD01 (samostatné záznamy, vlnová délka ' +
      '620–645 nm) — přestože název "PD01" je stejný jako u Red, prefix LXM3 značí jiný ' +
      'čip/pouzdro/binování. Testováno IF=350 mA, TJ=25 °C, binováno podle peak vlnové délky a ' +
      'radiometrického výkonu. Pološířka 20 nm, teplotní koef. vlnové délky 0,05 nm/°C, vyzařovací ' +
      'úhel 145°/125° (typ.). Tepelný odpor přechod–pájecí ploška 8,00 °C/W. Mezní hodnoty stejná ' +
      'skupina jako Far Red: DC 700 mA, špičkově 875 mA, TJ max 135 °C, pouzdro -40 až 120 °C, ' +
      'ESD 3A, MSL1.',
    tags: 'dioda,led,výkonová,smd,luxeon,luxeon-rebel,deep-red',
  },
  {
    name: 'LXM2-PD01',
    packageType:
      'SMD keramické pouzdro LUXEON Rebel (diode size 1 mm²), kopulovitá čočka, 3 pájecí plošky ' +
      '(1=katoda, 2=anoda, 3=tepelná plocha, izolovaná)',
    value:
      'Výkonová LED Red, dominantní λ 620–645 nm, svět. tok 40–60 lm min (typ. 48–62 lm dle binu) ' +
      '@IF=350 mA, VF 1,80–2,80 V (typ. 2,10 V)',
    notes:
      'Lumileds LUXEON Rebel Color Line (DS68, 20230103). LXM2-PD01 = Red, čip AlInGaP, diode size ' +
      '1 mm² (menší čip v rámci nomenklatury LXM2/LXML/LXM5). Testováno IF=350 mA, TJ=25 °C, ' +
      'binováno podle dominantní vlnové délky a světelného toku (na rozdíl od Far Red/Deep Red/' +
      'Royal Blue, které se binují podle radiometrického výkonu). ⚠️ Součást rodiny tří pouzder ' +
      'pro barvu Red se shodnou vlnovou délkou 620–645 nm, ale odlišným čipem/tepelným odporem — ' +
      'LXM2-PD01 (tento záznam, Rth 8,00 °C/W), LXML-PD01 (diode size 2 mm², samostatný záznam, ' +
      'Rth 12,00 °C/W) a LXM5-PD01 (velký čip bez "size" kódu, samostatný záznam, Rth 7,00 °C/W) — ' +
      'jde o tři odlišné objednací kódy, ne o binovou variantu jedné součástky. Pološířka 20 nm, ' +
      'teplotní koef. vlnové délky 0,05 nm/°C, vyzařovací úhel 145°/125° (typ.). Mezní hodnoty: ' +
      'DC 700 mA, špičkově 875 mA, TJ max 135 °C, pouzdro -40 až 120 °C, ESD 3A, MSL1.',
    tags: 'dioda,led,výkonová,smd,luxeon,luxeon-rebel,red,lxm2',
  },
  {
    name: 'LXML-PD01',
    packageType:
      'SMD keramické pouzdro LUXEON Rebel (diode size 2 mm²), 4,61 × 3,17 mm, kopulovitá čočka ' +
      'Ø2,61 mm, 3 pájecí plošky (1=katoda, 2=anoda, 3=tepelná plocha, izolovaná)',
    value:
      'Výkonová LED Red, dominantní λ 620–645 nm, svět. tok 30–50 lm min (typ. 38–52 lm dle binu) ' +
      '@IF=350 mA, VF 2,31–3,51 V (typ. 2,90 V)',
    notes:
      'Lumileds LUXEON Rebel Color Line (DS68, 20230103). LXML-PD01 = Red, čip AlInGaP, diode size ' +
      '2 mm² — standardní pouzdro řady LUXEON Rebel (stejné mechanické rozměry jako u ostatních ' +
      '"L"-variant v této knihovně, např. LXML-PF01). ⚠️ Odlišný objednací kód od LXM2-PD01 (menší ' +
      'čip 1 mm², Rth 8,00 °C/W, samostatný záznam) a LXM5-PD01 (velký čip, Rth 7,00 °C/W, ' +
      'samostatný záznam) — všechny tři sdílejí stejný rozsah vlnové délky 620–645 nm, ale liší se ' +
      'čipem, tepelným odporem i rozsahem světelného toku. Testováno IF=350 mA, TJ=25 °C. Pološířka ' +
      '20 nm, teplotní koef. vlnové délky 0,05 nm/°C, vyzařovací úhel 145°/125° (typ.). Tepelný ' +
      'odpor přechod–pájecí ploška 12,00 °C/W. Mezní hodnoty: DC 700 mA, špičkově 875 mA, TJ max ' +
      '135 °C, pouzdro -40 až 120 °C, ESD 3A, MSL1.',
    tags: 'dioda,led,výkonová,smd,luxeon,luxeon-rebel,red,lxml',
  },
  {
    name: 'LXM5-PD01',
    packageType:
      'SMD keramické pouzdro LUXEON Rebel (velký čip), kopulovitá čočka, 3 pájecí plošky ' +
      '(1=katoda, 2=anoda, 3=tepelná plocha, izolovaná)',
    value:
      'Výkonová LED Red, dominantní λ 620–645 nm, svět. tok min 50 lm (typ. 64 lm) @IF=350 mA, ' +
      'VF 1,80–2,60 V (typ. 2,10 V)',
    notes:
      'Lumileds LUXEON Rebel Color Line (DS68, 20230103). LXM5-PD01 = Red, čip AlInGaP, největší ' +
      'čip v rodině Red (bez "1"/"2" size kódu v nomenklatuře). ⚠️ Odlišný objednací kód od ' +
      'LXM2-PD01 a LXML-PD01 (samostatné záznamy) — sdílí vlnovou délku 620–645 nm, ale má nejnižší ' +
      'tepelný odpor v rodině (7,00 °C/W) a nejvyšší typický světelný tok při srovnatelném VF. ' +
      'Testováno IF=350 mA, TJ=25 °C. Pološířka 20 nm, teplotní koef. vlnové délky 0,05 nm/°C, ' +
      'vyzařovací úhel 145°/125° (typ.). Mezní hodnoty: DC 700 mA, špičkově 875 mA, TJ max 135 °C, ' +
      'pouzdro -40 až 120 °C, ESD 3A, MSL1.',
    tags: 'dioda,led,výkonová,smd,luxeon,luxeon-rebel,red,lxm5',
  },
  {
    name: 'LXM2-PH01',
    packageType:
      'SMD keramické pouzdro LUXEON Rebel (diode size 1 mm²), kopulovitá čočka, 3 pájecí plošky ' +
      '(1=katoda, 2=anoda, 3=tepelná plocha, izolovaná)',
    value:
      'Výkonová LED Red-Orange, dominantní λ 610–620 nm, svět. tok 60–70 lm min (typ. 67–72 lm ' +
      'dle binu) @IF=350 mA, VF 1,80–2,80 V (typ. 2,10 V)',
    notes:
      'Lumileds LUXEON Rebel Color Line (DS68, 20230103). LXM2-PH01 = Red-Orange, čip AlInGaP, ' +
      'diode size 1 mm². ⚠️ Součást rodiny tří pouzder pro Red-Orange se stejnou vlnovou délkou ' +
      '610–620 nm: LXM2-PH01 (tento záznam, Rth 8,00 °C/W), LXML-PH01 (diode size 2 mm², ' +
      'samostatný záznam, Rth 12,00 °C/W) a LXM5-PH01 (velký čip, samostatný záznam, Rth 7,00 °C/W) ' +
      '— tři odlišné objednací kódy. Testováno IF=350 mA, TJ=25 °C. Pološířka 20 nm, teplotní koef. ' +
      'vlnové délky 0,08 nm/°C, vyzařovací úhel 145°/125° (typ.). Mezní hodnoty: DC 700 mA, ' +
      'špičkově 875 mA, TJ max 135 °C, pouzdro -40 až 120 °C, ESD 3A, MSL1.',
    tags: 'dioda,led,výkonová,smd,luxeon,luxeon-rebel,red-orange,lxm2',
  },
  {
    name: 'LXML-PH01',
    packageType:
      'SMD keramické pouzdro LUXEON Rebel (diode size 2 mm²), 4,61 × 3,17 mm, kopulovitá čočka ' +
      'Ø2,61 mm, 3 pájecí plošky (1=katoda, 2=anoda, 3=tepelná plocha, izolovaná)',
    value:
      'Výkonová LED Red-Orange, dominantní λ 610–620 nm, svět. tok 50–60 lm min (typ. 56–62 lm ' +
      'dle binu) @IF=350 mA, VF 2,31–3,51 V (typ. 2,90 V)',
    notes:
      'Lumileds LUXEON Rebel Color Line (DS68, 20230103). LXML-PH01 = Red-Orange, čip AlInGaP, ' +
      'diode size 2 mm². ⚠️ Odlišný objednací kód od LXM2-PH01 (Rth 8,00 °C/W) a LXM5-PH01 ' +
      '(Rth 7,00 °C/W, samostatné záznamy) — sdílí vlnovou délku 610–620 nm. Testováno IF=350 mA, ' +
      'TJ=25 °C. Pološířka 20 nm, teplotní koef. vlnové délky 0,08 nm/°C, vyzařovací úhel 145°/125° ' +
      '(typ.). Tepelný odpor přechod–pájecí ploška 12,00 °C/W. Mezní hodnoty: DC 700 mA, špičkově ' +
      '875 mA, TJ max 135 °C, pouzdro -40 až 120 °C, ESD 3A, MSL1.',
    tags: 'dioda,led,výkonová,smd,luxeon,luxeon-rebel,red-orange,lxml',
  },
  {
    name: 'LXM5-PH01',
    packageType:
      'SMD keramické pouzdro LUXEON Rebel (velký čip), kopulovitá čočka, 3 pájecí plošky ' +
      '(1=katoda, 2=anoda, 3=tepelná plocha, izolovaná)',
    value:
      'Výkonová LED Red-Orange, dominantní λ 610–620 nm, svět. tok min 50 lm (typ. 90 lm) ' +
      '@IF=350 mA, VF 1,80–2,60 V (typ. 2,10 V)',
    notes:
      'Lumileds LUXEON Rebel Color Line (DS68, 20230103). LXM5-PH01 = Red-Orange, čip AlInGaP, ' +
      'největší čip v rodině. ⚠️ Odlišný objednací kód od LXM2-PH01 a LXML-PH01 (samostatné ' +
      'záznamy) — nejnižší tepelný odpor v rodině (7,00 °C/W) a výrazně vyšší typický tok vůči ' +
      'minimu (90 lm typ. při min. 50 lm). Testováno IF=350 mA, TJ=25 °C. Pološířka 20 nm, teplotní ' +
      'koef. vlnové délky 0,08 nm/°C, vyzařovací úhel 145°/125° (typ.). Mezní hodnoty: DC 700 mA, ' +
      'špičkově 875 mA, TJ max 135 °C, pouzdro -40 až 120 °C, ESD 3A, MSL1.',
    tags: 'dioda,led,výkonová,smd,luxeon,luxeon-rebel,red-orange,lxm5',
  },
  {
    name: 'LXM2-PL01',
    packageType:
      'SMD keramické pouzdro LUXEON Rebel (diode size 1 mm²), kopulovitá čočka, 3 pájecí plošky ' +
      '(1=katoda, 2=anoda, 3=tepelná plocha, izolovaná)',
    value:
      'Výkonová LED PC Amber (fosforem konvertovaná), dominantní λ 594–604 nm, svět. tok min ' +
      '80 lm (typ. 110 lm) @IF=350 mA, VF 2,55–3,51 V (typ. 3,05 V)',
    notes:
      'Lumileds LUXEON Rebel Color Line (DS68, 20230103). LXM2-PL01 = PC Amber ("phosphor ' +
      'converted"), čip InGaN s fosforovou konverzí — ⚠️ odlišná technologie i vlnová délka od ' +
      '"Amber" (LXML-PL01/LXM5-PL01, čistě AlInGaP čip, 585–595 nm, samostatné záznamy), přestože ' +
      'název "PL01" je stejný. PC Amber má výrazně širší spektrální pološířku (80 nm vs 20 nm) a ' +
      'záporný teplotní koeficient vlnové délky (-0,01 nm/°C, jediný záporný v celé rodině). ' +
      'Vyzařovací úhel užší než ostatní barvy: 140° celkový / 120° typický (ostatní 145°/125°). ' +
      'Testováno IF=350 mA, TJ=25 °C. Tepelný odpor přechod–pájecí ploška 10,00 °C/W. ⚠️ Mezní ' +
      'hodnoty PC Amber jsou přísnější než u ostatní rodiny Far Red/Deep Red/Red/Red-Orange/Amber: ' +
      'TJ max jen 130 °C (ne 135 °C) a provozní teplota pouzdra jen -40 až 110 °C (ne -40 až ' +
      '120 °C), přestože DC proud 700 mA a špičkový 875 mA jsou stejné. ESD 3A, MSL1.',
    tags: 'dioda,led,výkonová,smd,luxeon,luxeon-rebel,pc-amber,lxm2',
  },
  {
    name: 'LXML-PL01',
    packageType:
      'SMD keramické pouzdro LUXEON Rebel (diode size 2 mm²), 4,61 × 3,17 mm, kopulovitá čočka ' +
      'Ø2,61 mm, 3 pájecí plošky (1=katoda, 2=anoda, 3=tepelná plocha, izolovaná)',
    value:
      'Výkonová LED Amber, dominantní λ 585–595 nm, svět. tok 30–60 lm min (typ. 38–61 lm dle ' +
      'binu) @IF=350 mA, VF 2,31–3,51 V (typ. 2,90 V)',
    notes:
      'Lumileds LUXEON Rebel Color Line (DS68, 20230103). LXML-PL01 = Amber, čip AlInGaP, diode ' +
      'size 2 mm². ⚠️ Odlišná technologie/vlnová délka od "PC Amber" (LXM2-PL01, InGaN s fosforem, ' +
      '594–604 nm, samostatný záznam). Součást rodiny dvou pouzder pro Amber: LXML-PL01 (tento ' +
      'záznam, Rth 12,00 °C/W) a LXM5-PL01 (velký čip, samostatný záznam, Rth 7,00 °C/W). Testováno ' +
      'IF=350 mA, TJ=25 °C. Pološířka 20 nm, teplotní koef. vlnové délky 0,10 nm/°C, vyzařovací ' +
      'úhel 145°/125° (typ.). Mezní hodnoty stejná skupina jako Far Red/Red/Red-Orange: DC 700 mA, ' +
      'špičkově 875 mA, TJ max 135 °C, pouzdro -40 až 120 °C, ESD 3A, MSL1.',
    tags: 'dioda,led,výkonová,smd,luxeon,luxeon-rebel,amber,lxml',
  },
  {
    name: 'LXM5-PL01',
    packageType:
      'SMD keramické pouzdro LUXEON Rebel (velký čip), kopulovitá čočka, 3 pájecí plošky ' +
      '(1=katoda, 2=anoda, 3=tepelná plocha, izolovaná)',
    value:
      'Výkonová LED Amber, dominantní λ 585–595 nm, svět. tok min 50 lm (typ. 74 lm) @IF=350 mA, ' +
      'VF 1,80–2,60 V (typ. 2,10 V)',
    notes:
      'Lumileds LUXEON Rebel Color Line (DS68, 20230103). LXM5-PL01 = Amber, čip AlInGaP, největší ' +
      'čip v rodině. ⚠️ Odlišný objednací kód od LXML-PL01 (samostatný záznam, Rth 12,00 °C/W) a od ' +
      '"PC Amber" LXM2-PL01 (jiná technologie/vlnová délka, samostatný záznam). Nejnižší tepelný ' +
      'odpor v rodině Amber (7,00 °C/W). Testováno IF=350 mA, TJ=25 °C. Pološířka 20 nm, teplotní ' +
      'koef. vlnové délky 0,10 nm/°C, vyzařovací úhel 145°/125° (typ.). Mezní hodnoty: DC 700 mA, ' +
      'špičkově 875 mA, TJ max 135 °C, pouzdro -40 až 120 °C, ESD 3A, MSL1.',
    tags: 'dioda,led,výkonová,smd,luxeon,luxeon-rebel,amber,lxm5',
  },
  {
    name: 'LXML-PX02',
    packageType:
      'SMD keramické pouzdro LUXEON Rebel, 4,61 × 3,17 mm, kopulovitá čočka Ø2,61 mm, 3 pájecí ' +
      'plošky (1=katoda, 2=anoda, 3=tepelná plocha, izolovaná)',
    value:
      'Výkonová LED Lime, dominantní λ 566–569 nm, svět. tok min 140 lm (typ. 184 lm) @IF=350 mA, ' +
      'TJ=85 °C, VF 2,60–3,00 V (typ. 2,75 V)',
    notes:
      'Lumileds LUXEON Rebel Color Line (DS68, 20230103). LXML-PX02 = Lime, čip InGaN. ⚠️ Jediná ' +
      'barva v této rodině testovaná/binovaná při TJ=85 °C (všechny ostatní barvy kromě ES ' +
      'Blue/ES Royal Blue při TJ=25 °C) — hodnoty proto nejsou přímo srovnatelné s ostatními ' +
      'záznamy. Používá odlišný 4-místný alfanumerický CAT kód (flux-color-color-VF) místo ' +
      '3-místného kódu ostatních barev. Nejširší spektrální pološířka v rodině (100 nm) a jediný ' +
      'záznam s téměř nulovým teplotním koeficientem vlnové délky (0,01 nm/°C). Vyzařovací úhel ' +
      '145°/125° (typ.). Tepelný odpor přechod–pájecí ploška 6,00 °C/W. Mezní hodnoty (tabulka pro ' +
      'TJ=85 °C): DC proud 1000 mA, špičkový 1200 mA, TJ max 150 °C, provozní teplota pouzdra -40 ' +
      'až 135 °C, ESD 3A, autokláv 100% RH/96 h max.',
    tags: 'dioda,led,výkonová,smd,luxeon,luxeon-rebel,lime',
  },
  {
    name: 'LXML-PM01',
    packageType:
      'SMD keramické pouzdro LUXEON Rebel, 4,61 × 3,17 mm, kopulovitá čočka Ø2,61 mm, 3 pájecí ' +
      'plošky (1=katoda, 2=anoda, 3=tepelná plocha, izolovaná)',
    value:
      'Výkonová LED Green, dominantní λ 520–540 nm, svět. tok 70–100 lm min (typ. 79–102 lm dle ' +
      'binu) @IF=350 mA, VF 2,55–3,51 V (typ. 3,21 V)',
    notes:
      'Lumileds LUXEON Rebel Color Line (DS68, 20230103). LXML-PM01 = Green, čip InGaN. Testováno ' +
      'IF=350 mA, TJ=25 °C, binováno podle dominantní vlnové délky a světelného toku. Pološířka ' +
      '30 nm, teplotní koef. vlnové délky 0,05 nm/°C, vyzařovací úhel 145°/125° (typ.). Tepelný ' +
      'odpor přechod–pájecí ploška 10,00 °C/W. Mezní hodnoty (skupina Green/Cyan/Blue/Royal Blue): ' +
      'DC proud 1000 mA, špičkový pulzní proud 1200 mA, TJ max 150 °C, provozní teplota pouzdra ' +
      '-40 až 135 °C, ESD 3A, MSL1.',
    tags: 'dioda,led,výkonová,smd,luxeon,luxeon-rebel,green',
  },
  {
    name: 'LXML-PE01',
    packageType:
      'SMD keramické pouzdro LUXEON Rebel, 4,61 × 3,17 mm, kopulovitá čočka Ø2,61 mm, 3 pájecí ' +
      'plošky (1=katoda, 2=anoda, 3=tepelná plocha, izolovaná)',
    value:
      'Výkonová LED Cyan, dominantní λ 490–515 nm, svět. tok 60–80 lm min (typ. 67–83 lm dle ' +
      'binu) @IF=350 mA, VF 2,55–3,51 V (typ. 3,17 V)',
    notes:
      'Lumileds LUXEON Rebel Color Line (DS68, 20230103). LXML-PE01 = Cyan, čip InGaN. Testováno ' +
      'IF=350 mA, TJ=25 °C. Pološířka 30 nm, teplotní koef. vlnové délky 0,04 nm/°C, vyzařovací ' +
      'úhel 145°/125° (typ.). Tepelný odpor přechod–pájecí ploška 10,00 °C/W. Mezní hodnoty ' +
      '(skupina Green/Cyan/Blue/Royal Blue): DC proud 1000 mA, špičkový 1200 mA, TJ max 150 °C, ' +
      'provozní teplota pouzdra -40 až 135 °C, ESD 3A, MSL1.',
    tags: 'dioda,led,výkonová,smd,luxeon,luxeon-rebel,cyan',
  },
  {
    name: 'LXML-PB01',
    packageType:
      'SMD keramické pouzdro LUXEON Rebel, 4,61 × 3,17 mm, kopulovitá čočka Ø2,61 mm, 3 pájecí ' +
      'plošky (1=katoda, 2=anoda, 3=tepelná plocha, izolovaná)',
    value:
      'Výkonová LED Blue, dominantní λ 460–485 nm, svět. tok 18–40 lm min (typ. 22–41 lm dle ' +
      'binu) @IF=350 mA, VF 2,55–3,51 V (typ. 2,95 V)',
    notes:
      'Lumileds LUXEON Rebel Color Line (DS68, 20230103). LXML-PB01 = Blue, čip InGaN, testováno ' +
      'standardním proudem IF=350 mA (na rozdíl od "ES Royal Blue" LXML-PR02, který je binován při ' +
      '700 mA — v této datasheetu není samostatná "ES Blue" položka s konkrétním part number, jen ' +
      'obecná zmínka v testovacích podmínkách a mezních hodnotách). Pološířka 20 nm, teplotní koef. ' +
      'vlnové délky 0,05 nm/°C, vyzařovací úhel 145°/125° (typ.). Tepelný odpor přechod–pájecí ' +
      'ploška 10,00 °C/W. Mezní hodnoty (skupina Green/Cyan/Blue/Royal Blue): DC proud 1000 mA, ' +
      'špičkový 1200 mA, TJ max 150 °C, provozní teplota pouzdra -40 až 135 °C, ESD 3A, MSL1.',
    tags: 'dioda,led,výkonová,smd,luxeon,luxeon-rebel,blue',
  },
  {
    name: 'LXML-PR01',
    packageType:
      'SMD keramické pouzdro LUXEON Rebel, 4,61 × 3,17 mm, kopulovitá čočka Ø2,61 mm, 3 pájecí ' +
      'plošky (1=katoda, 2=anoda, 3=tepelná plocha, izolovaná)',
    value:
      'Výkonová LED Royal Blue, peak λ 440–460 nm, zářivý výkon min 500 mW (typ. 520 mW) ' +
      '@IF=350 mA, VF 2,55–3,51 V (typ. 2,95 V)',
    notes:
      'Lumileds LUXEON Rebel Color Line (DS68, 20230103). LXML-PR01 = Royal Blue (standardní, ne ' +
      '"ES"), čip InGaN, testováno IF=350 mA, TJ=25 °C, binováno podle peak vlnové délky a ' +
      'radiometrického výkonu. ⚠️ Odlišný ordering code od "ES Royal Blue" LXML-PR02 (samostatný ' +
      'záznam) — PR02 je binován/testován při vyšším proudu 700 mA a dosahuje výrazně vyššího ' +
      'výkonu (800–1100 mW typ. 890–1120 mW), zatímco PR01 je jediný bin s min. 500 mW. Pološířka ' +
      '20 nm, teplotní koef. vlnové délky 0,04 nm/°C, vyzařovací úhel 145°/125° (typ.). Tepelný ' +
      'odpor přechod–pájecí ploška 10,00 °C/W. Mezní hodnoty (skupina Green/Cyan/Blue/Royal Blue): ' +
      'DC proud 1000 mA, špičkový 1200 mA, TJ max 150 °C, provozní teplota pouzdra -40 až 135 °C, ' +
      'ESD 3A, MSL1.',
    tags: 'dioda,led,výkonová,smd,luxeon,luxeon-rebel,royal-blue',
  },
  {
    name: 'LXML-PR02',
    packageType:
      'SMD keramické pouzdro LUXEON Rebel ES (mírně upravená mechanika oproti standardní řadě, ' +
      'viz Fig. 7b datasheetu), kopulovitá čočka Ø2,61 mm, 3 pájecí plošky (1=katoda, 2=anoda, ' +
      '3=tepelná plocha, izolovaná)',
    value:
      'Výkonová LED ES Royal Blue, peak λ 440–460 nm, zářivý výkon 800–1100 mW min (typ. ' +
      '890–1120 mW dle binu) @IF=700 mA, VF 2,50–3,50 V (typ. 2,90 V)',
    notes:
      'Lumileds LUXEON Rebel Color Line (DS68, 20230103). LXML-PR02 = ES Royal Blue ("Enhanced ' +
      'Spec"), čip InGaN. ⚠️ Odlišný ordering code od standardní "Royal Blue" LXML-PR01 (samostatný ' +
      'záznam, testován/binován při 350 mA, max. výkon jen 500–520 mW) — ES varianta je testována ' +
      'a binována při vyšším proudu IF=700 mA, TJ=25 °C a dosahuje více než dvojnásobného ' +
      'radiometrického výkonu. Bin LXML-PR02-A900 je speciální výběr pouze z color binů 4 a 5. ' +
      'Pološířka 20 nm, teplotní koef. vlnové délky 0,04 nm/°C, vyzařovací úhel 145°/125° (typ.). ' +
      'Tepelný odpor přechod–pájecí ploška 6,00 °C/W (nižší než u PR01 díky odlišné mechanice). ' +
      'Mezní hodnoty (skupina ES Blue/ES Royal Blue): DC proud 1000 mA, špičkový pulzní proud ' +
      '1200 mA, TJ max 150 °C, provozní teplota pouzdra -40 až 135 °C, ESD 3A, MSL1.',
    tags: 'dioda,led,výkonová,smd,luxeon,luxeon-rebel,royal-blue,es',
  },
  {
    name: 'LCW CR7P.PC',
    packageType:
      'SMD keramické pouzdro OSRAM OSLON SSL 80, 3,1 × 3,1 mm (2,9–3,1 mm), výška s čočkou ' +
      '2,65–2,75 mm, kopulovitá silikonová čočka (silikonový zalévací gel), 2 pájecí plošky ' +
      '(anoda, katoda) + 1 prostřední nekontaktovaná ploška (bez elektrické funkce), hmotnost 25 mg',
    value:
      'Výkonová bílá LED (fosforová konverze), neutrální bílá 3000–6500 K, CRI min. 70 (typ. 72), ' +
      'svět. tok 112–164 lm dle skupiny @IF=350 mA, VF 2,80–3,25 V (typ. 2,95 V), vyzařovací úhel 80°',
    notes:
      'OSRAM Opto Semiconductors, OSLON SSL 80 datasheet v2.1 (2015-12-18) — vysoce výkonná SMD ' +
      'LED s předfokusovanou charakteristikou vyzařování (ideální pro bodová svítidla), ⚠️ zcela ' +
      'odlišná konstrukce/technologie od generických 3/5mm THT bílých LED již v knihovně ("LED ' +
      '5mm bílá"). Rodina LCW CR7P.PC pokrývá barevné teploty 3000/3500/4000/4500/5000/5700/6500 K, ' +
      'rozlišené skupinami jasu (LP 112–121 lm, LQ 121–130, LR 130–140, LS 140–150, LT 150–164 lm) ' +
      'a skupinami napětí VF (L1 2,80–2,90 V, L2 2,90–3,00 V, M1 3,00–3,10 V, MX 3,10–3,25 V) — ' +
      'konkrétní objednací kód např. LCW CR7P.PC-LQLS-5L7N-1 (4000 K, Q65111A2549). Testováno ' +
      'IF=350 mA, TS=25 °C. Reálný tepelný odpor přechod–pájecí bod 9,6 °C/typ. (max. 10,8 °C/W); ' +
      '"elektrický" tepelný odpor (η=40 %) 5,8 °C/W typ. (max. 6,5 °C/W). Zpětné napětí max. 1,2 V ' +
      'při IR=20 mA (LED má paralelně integrovanou ESD ochrannou diodu — na rozdíl od výkonových LED ' +
      'LUXEON Rebel, které nejsou určeny k provozu v závěrném směru vůbec). Mezní hodnoty: DC proud ' +
      '100–800 mA (nesmí být provozována pod 100 mA), impulzní špičkový proud 2000 mA, TJ max ' +
      '135 °C (absolutně 160 °C), provozní/skladovací teplota -40 až 120 °C, ESD odolnost 8 kV ' +
      '(ANSI/ESDA/JEDEC JS-001, třída 3B — výrazně vyšší než běžné LED). Zvýšená odolnost proti ' +
      'korozi (testováno 40 °C/90 % RH/15 ppm H2S/336 h). Pájení reflow: MSL2 (JEDEC J-STD-020D.01), ' +
      'doporučený vrchol 245 °C (max. 260 °C).',
    tags: 'dioda,led,výkonová,smd,bílá,oslon,oslon-ssl-80,osram',
  },
  {
    name: 'LO T64F',
    packageType:
      'PLCC-2 (SMD), černé pouzdro s bezbarvou (colorless) čočkou/zálivkou pro vysoký kontrast ' +
      'panelu při vypnutém stavu — na rozdíl od běžných čirých/bílých pouzder',
    value:
      'OSRAM TOPLED Black — výkonová SMD LED, oranžová (InGaAlP Thinfilm), λdom 606 nm typ., ' +
      'IV typ. 3300–8270 mcd dle jasové skupiny (binningu) @IF=20 mA',
    notes:
      'OSRAM Opto Semiconductors "TOPLED Black — LO T64F" datasheet (verze 2.4, OS-PCN-2016-025-A, ' +
      'listopad 2016) — ⚠️ jiný účel/konstrukce než ostatní výkonové LED v této knihovně (LUXEON ' +
      'Rebel, OSLON SSL 80, samostatné záznamy) — LO T64F má speciálně ČERNÉ pouzdro PLCC-2 (s ' +
      'bezbarvou zálivkou) navržené pro elektronické textové/proměnné informační tabule (VMS — ' +
      'Variable Message Signs) a cenové displeje, kde černé pouzdro poskytuje vysoký kontrast ' +
      'panelu (LED nesvítící nejsou vidět jako světlé tečky). Technologie InGaAlP Thinfilm, barva ' +
      'oranžová (606 nm), vylepšená odolnost proti korozi. Vyzařovací úhel při 50 % IV: 30°. ' +
      'Mezní hodnoty: Top/Tstg -40 až +100 °C, TJ max 125 °C, IF (trvalý) max 50 mA, IFM ' +
      '(nárazový, t≤10 µs, D=0,1) max 100 mA, VR max 12 V, ESD odolnost do 2 kV (HBM, dle ANSI/' +
      'ESDA/JEDEC JS-001). λpeak typ. 610 nm. λdom (dominantní vlnová délka) min 600/typ. 606/max ' +
      '609 nm. Δλ (spektrální šířka @50 % Irel) typ. 17 nm. VF min 1,80/typ. 1,95/max 2,40 V ' +
      '@IF=20 mA. IR typ. 0,2/max 10 µA @VR=12 V. Teplotní koeficienty: TCλpeak 0,12 nm/K, TCλdom ' +
      '0,08 nm/K (-10 až +100 °C). Reálný tepelný odpor přechod/pájecí ploška RθJS max 280 K/W. ' +
      'Binováno do 5 jasových skupin (CB/DA/DB/EA/EB, partial flux Ev 3550–11200 lux @IF=20 mA, ' +
      'odpovídající IV typ. 3300–8270 mcd), 3 skupin dominantní vlnové délky (2/3/4, 600–609 nm) ' +
      'a 4 skupin propustného napětí (3A/3B/4A/4B, 1,80–2,40 V) — zákazník obdrží v jedné baleny ' +
      'jednotce vždy jen jednu konkrétní kombinaci skupin (např. LO T64F-CBEB-24-1).',
    tags: 'dioda,led,výkonová,smd,oranžová,plcc-2,černé-pouzdro,vms,osram,topled-black',
  },
  {
    name: 'LR T66F',
    packageType:
      'PLCC-2 (SMD), černé pouzdro s bezbarvou (colorless) čočkou/zálivkou — shodné pouzdro ' +
      'jako sesterský LO T64F',
    value:
      'OSRAM TOPLED Black — výkonová SMD LED, červená (InGaAlP Thinfilm), λdom 625 nm typ., ' +
      'IV typ. 1260–3550 mcd dle jasové skupiny @IF=20 mA',
    notes:
      'OSRAM Opto Semiconductors "TOPLED Black — LR T66F" datasheet (verze 1.5, 11. 5. 2017) — ' +
      'červená varianta stejné rodiny "TOPLED Black" jako oranžový LO T64F (samostatný záznam) ' +
      '— shodný účel (černé pouzdro pro vysoký kontrast VMS/cenových displejů), shodné pouzdro ' +
      'PLCC-2 a téměř identické mezní hodnoty — viz záznam LO T64F pro plný popis konstrukce a ' +
      'aplikace. LR T66F (červená): vyzařovací úhel při 50 % IV 55° (⚠️ širší než 30° u ' +
      'oranžového LO T64F). Mezní hodnoty shodné s LO T64F: Top/Tstg -40 až +100 °C, TJ max ' +
      '125 °C, IF max 50 mA, IFM (nárazový) max 100 mA, VR max 12 V, ESD do 2 kV (HBM). λpeak ' +
      'typ. 634 nm. λdom min 619/typ. 625/max 631 nm. Δλ typ. 16 nm. VF min 1,80/typ. 1,95/max ' +
      '2,40 V @IF=20 mA (shodné napěťové skupiny 3A/3B/4A/4B jako LO T64F). IR typ. 0,2/max ' +
      '10 µA @VR=12 V. TCλpeak 0,14 nm/K, TCλdom 0,07 nm/K. RθJS max 280 K/W. Binováno do 5 ' +
      'jasových skupin (AA/AB/BA/BB/CA, IV min-max 1120–3550 mcd, odpovídající typ. světelný tok ' +
      '1260–3180 mlm) a 1 skupiny dominantní vlnové délky (619–631 nm) — ⚠️ na rozdíl od ' +
      'oranžového LO T64F, který má 3 vlnové skupiny, LR T66F má jen jednu (užší výrobní rozptyl ' +
      'nebo novější/zjednodušený binning). Objednací kódy např. LR T66F-BABB-1, ' +
      'LR T66F-ABBA-1-1, LR T66F-AACA-1-3A4B.',
    tags: 'dioda,led,výkonová,smd,červená,plcc-2,černé-pouzdro,vms,osram,topled-black',
  },
  {
    name: 'LY M67K',
    packageType:
      'SMT pouzdro "Mini TOPLED", bílé s bezbarvou/čirou (colorless clear) zálivkou pryskyřicí',
    value:
      'OSRAM Mini TOPLED — SMD LED, žlutá (InGaAlP), λdom 587 nm typ., vyzařovací úhel 120° ' +
      '(Lambertův zářič), IF max 20 mA',
    notes:
      'OSRAM Opto Semiconductors "Mini TOPLED — LY M67K" datasheet (verze 1.2, 31. 10. 2014) — ' +
      '⚠️ POZOR na záměnu s rodinou "TOPLED Black" (LO T64F, LR T66F, samostatné záznamy) — ' +
      'navzdory podobnému stylu označení (barva-písmeno + pouzdro-kód) jde o ZCELA JINOU rodinu ' +
      'stejného výrobce: "Mini TOPLED" má BÍLÉ pouzdro s ČIROU zálivkou a široký vyzařovací úhel ' +
      '120° (Lambertův zářič), určené pro obecné indikátory, podsvícení, navázání do světlovodů a ' +
      'automobilové vnitřní osvětlení — na rozdíl od černého úzkoúhlého (30–55°) pouzdra "TOPLED ' +
      'Black" specializovaného na kontrastní VMS/cenové displeje. Technologie InGaAlP. Mezní ' +
      'hodnoty: Top/Tstg -40 až +100 °C, TJ max 125 °C, IF (trvalý) max 20 mA, IFM (nárazový, ' +
      't≤10 µs, D=0,005) max 100 mA, VR max 12 V, ESD odolnost 2 kV (HBM, třída 2). λpeak typ. ' +
      '591 nm. λdom min 580/typ. 587/max 595 nm. Δλ typ. 15 nm. VF (měřeno @IF=2 mA, ⚠️ nižší ' +
      'testovací proud než 20 mA u TOPLED Black) min 1,70/typ. 1,80/max 2,20 V. IR typ. 0,01/max ' +
      '10 µA @VR=12 V. Teplotní koeficienty: TCλpeak 0,12 nm/K, TCλdom 0,09 nm/K, TCV -2,10 mV/K. ' +
      'Tepelný odpor: RθJA (přechod-okolí) max 530 K/W, RθJS (přechod-pájecí ploška) max 280 K/W. ' +
      'Binováno do 6 jasových skupin (J1/J2/K1/K2/L1/L2, IV 4,5–18 mcd @IF=2 mA, světelný tok ' +
      'typ. 15,2–48 mlm) a 5 skupin dominantní vlnové délky (2–6, 580–595 nm). Objednací kód ' +
      'např. LY M67K-J1L2-26.',
    tags: 'dioda,led,smd,žlutá,mini-topled,indikátor,podsvícení,automotive,osram',
  },
  {
    name: 'SMTPA62',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka, bez elektrody gate), ' +
      'hmotnost 0,12 g; značení na součástce laserem "U01"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, VRM 56 V, VBO 82 V, IPP 50 A ' +
      '(10/1000 µs)',
    notes:
      'STMicroelectronics SMTPA série "TRISIL" (dok. říjen 1998, ed. 7A; ⚠️ aktualizováno a ' +
      'potvrzeno sloučeným datasheetem SMP50/SMTPA/TPA, červen 2007, rev. 3 — beze změny ' +
      'elektrických hodnot uvedených níže) — ⚠️ NENÍ to obyčejná ' +
      'lavinová/Zenerova dioda ani TVS s pozvolnou VA charakteristikou jako ostatní diody v této ' +
      'knihovně — TRISIL je křemíková obousměrná spínací (crowbar) ochranná součástka podobná ' +
      'symetrickému tyristoru bez řídicí elektrody: při dosažení průrazného/breakover napětí ' +
      'skokově sepne do nízkoimpedančního stavu (podobně jako SIDACtor/plynem plněná bleskojistka), ' +
      'čímž efektivněji svede energii přepětí než pozvolná avalanche charakteristika TVS diody. ' +
      'Navrženo pro ochranu telekomunikačních zařízení proti blesku a přepětí indukovanému ' +
      'z silových AC vedení. Zpracována celá řada 10 dílů z jednoho datasheetu (SMTPA62/68/100/' +
      '120/130/180/200/220/240/270, samostatné záznamy), lišících se jen napěťovou třídou; ' +
      'novější sloučený datasheet (2007) navíc dokládá 11. díl 320 V (viz samostatný záznam ' +
      'SMTPA320) a to, že tatáž křemíková struktura se dodává i v pouzdru SMA pod ozn. SMP50-xxx ' +
      '(hmotnost 0,068 g) a v drátovém pouzdru DO-15 pod ozn. TPAxxx (hmotnost 0,40 g) se ' +
      'shodnými elektrickými parametry jako SMB verze SMTPAxxx v této knihovně. ' +
      'SMTPA62: VRM (stand-off napětí) 56 V, IRM max 2 µA @VRM. VR (trvalé závěrné napětí) 62 V, ' +
      'IR max 50 µA @VR. VBO (breakover napětí, statický test) max 82 V @IBO=800 mA; dynamický ' +
      'VBO (test okruh 1, 100 V/µs, IPP=50 A) max 85 V. IH (přídržný proud) min ' +
      '150 mA. C typ 20 pF @VR=50 V / 40 pF @VR=2 V (C max dle staršího vydání 150 pF). Mezní hodnoty (společné pro celou řadu): výkonová ztráta P=5 W ' +
      '@Tlead=50 °C; IPP (10/1000 µs)=50 A, (8/20 µs)=150 A, (10/560 µs)=55 A, (5/310 µs)=65 A, ' +
      '(10/160 µs)=75 A, (1/20 µs)=100 A, (2/10 µs)=100 A; IFS (fail-safe zkratový režim) max ' +
      '2,5 kA @8/20 µs; ITSM (nepovtorný sinusový ráz)=16 A@0,2 s / 11,5 A@1 s / 10 A@2 s / ' +
      '3,5 A@15 min; I²t=6,2 A²s@16,6 ms / 6,5 A²s@20 ms; kritická strmost dV/dt=5 kV/µs @VRM, ' +
      'Tstg -55 až +150 °C, TJ max 150 °C, ' +
      'max. pájecí teplota vývodů 260 °C/10 s. Tepelný odpor RθJ-vývody: 20 °C/W (SMB) / ' +
      '30 °C/W (SMA) / 60 °C/W (DO-15); RθJ-okolí: 100 °C/W (SMB, standardní DPS) / 120 °C/W ' +
      '(SMA) / 100 °C/W (DO-15, Llead=10 mm). Shoda se standardy: GR-1089 core (1./2. úroveň, ' +
      'intra-building), ITU-T-K20/K21, VDE0433/0878, IEC-1000-4-5/IEC61000-4-2 (ESD), ' +
      'FCC Part 68 (surge typ A/B), Bellcore TR-NWT-001089 (1./2. úroveň), CNET l31-24, UL1950/' +
      'IEC950/CSA C22.2, UL1459, UL94 V0 (pryskyřice), UL497B (soubor E136224). ⚠️ Existuje i ' +
      'druhý zdroj od čínského výrobce GALAXY ELECTRICAL (značka "BL", dok. č. 0286002) — ' +
      'elektricky/rozměrově kompatibilní klon celé řady SMTPA62–270 v pouzdru SMB, shodné VRM/' +
      'VBO/IH/C hodnoty jako u ST, liší se jen laserovým značením na součástce (Galaxy: T62–T270 ' +
      'místo ST U01–U39) a udávanou PPP=5000 W (ST udává max. výkon jen implicitně přes IPP).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom',
  },
  {
    name: 'SMTPA68',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 0,12 g; ' +
      'značení na součástce laserem "U05"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, VRM 61 V, VBO 90 V, IPP 50 A ' +
      '(10/1000 µs)',
    notes:
      'STMicroelectronics SMTPA série "TRISIL" (dok. říjen 1998, ed. 7A) — součást stejné řady ' +
      '10 dílů jako SMTPA62/100/120/130/180/200/220/240/270 (samostatné záznamy) — viz záznam ' +
      'SMTPA62 pro plný popis principu funkce, mezních hodnot a shody se standardy. SMTPA68: ' +
      'VRM 61 V, IRM max 2 µA @VRM. VR 68 V, IR max 50 µA @VR. VBO max 90 V @IBO=800 mA; ' +
      'dynamický VBO max 93 V. IH min ' +
      '150 mA. C typ 20 pF @VR=50 V / 40 pF @VR=2 V. ⚠️ Dostupné i v pouzdru SMA (SMP50-68) a ' +
      'DO-15 (TPA68) se shodnými parametry (sloučený datasheet 2007).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom',
  },
  {
    name: 'SMTPA100',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 0,12 g; ' +
      'značení na součástce laserem "U13"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, VRM 90 V, VBO 133 V, IPP 50 A ' +
      '(10/1000 µs)',
    notes:
      'STMicroelectronics SMTPA série "TRISIL" (dok. říjen 1998, ed. 7A) — součást stejné řady ' +
      '10 dílů jako SMTPA62/68/120/130/180/200/220/240/270 (samostatné záznamy) — viz záznam ' +
      'SMTPA62 pro plný popis principu funkce, mezních hodnot a shody se standardy. SMTPA100: ' +
      'VRM 90 V, IRM max 2 µA @VRM. VR 100 V, IR max 50 µA @VR. VBO max 133 V @IBO=800 mA; ' +
      'dynamický VBO max 135 V. IH ' +
      'min 150 mA. C typ 16 pF @VR=50 V / 35 pF @VR=2 V (nižší než u SMTPA62/68 díky nižší ' +
      'kapacitě přechodu při vyšším napětí). ⚠️ Dostupné i v pouzdru SMA (SMP50-100) a DO-15 ' +
      '(TPA100) se shodnými parametry (sloučený datasheet 2007).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom',
  },
  {
    name: 'SMTPA120',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 0,12 g; ' +
      'značení na součástce laserem "U17"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, VRM 108 V, VBO 160 V, IPP 50 A ' +
      '(10/1000 µs)',
    notes:
      'STMicroelectronics SMTPA série "TRISIL" (dok. říjen 1998, ed. 7A) — součást stejné řady ' +
      '10 dílů jako SMTPA62/68/100/130/180/200/220/240/270 (samostatné záznamy) — viz záznam ' +
      'SMTPA62 pro plný popis principu funkce, mezních hodnot a shody se standardy. SMTPA120: ' +
      'VRM 108 V, IRM max 2 µA @VRM. VR 120 V, IR max 50 µA @VR. VBO max 160 V @IBO=800 mA; ' +
      'dynamický VBO max 160 V. IH ' +
      'min 150 mA. C typ 16 pF @VR=50 V / 30 pF @VR=2 V. ⚠️ Dostupné i v pouzdru SMA (SMP50-120) ' +
      'a DO-15 (TPA120) se shodnými parametry (sloučený datasheet 2007).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom',
  },
  {
    name: 'SMTPA130',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 0,12 g; ' +
      'značení na součástce laserem "U19"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, VRM 117 V, VBO 173 V, IPP 50 A ' +
      '(10/1000 µs)',
    notes:
      'STMicroelectronics SMTPA série "TRISIL" (dok. říjen 1998, ed. 7A) — součást stejné řady ' +
      '10 dílů jako SMTPA62/68/100/120/180/200/220/240/270 (samostatné záznamy) — viz záznam ' +
      'SMTPA62 pro plný popis principu funkce, mezních hodnot a shody se standardy. SMTPA130: ' +
      'VRM 117 V, IRM max 2 µA @VRM. VR 130 V, IR max 50 µA @VR. VBO max 173 V @IBO=800 mA; ' +
      'dynamický VBO max 173 V. IH ' +
      'min 150 mA. C typ 14 pF @VR=50 V / 30 pF @VR=2 V. ⚠️ Dostupné i v pouzdru SMA (SMP50-130) ' +
      'a DO-15 (TPA130) se shodnými parametry (sloučený datasheet 2007).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom',
  },
  {
    name: 'SMTPA180',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 0,12 g; ' +
      'značení na součástce laserem "U25"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, VRM 162 V, VBO 240 V, IPP 50 A ' +
      '(10/1000 µs)',
    notes:
      'STMicroelectronics SMTPA série "TRISIL" (dok. říjen 1998, ed. 7A) — součást stejné řady ' +
      '10 dílů jako SMTPA62/68/100/120/130/200/220/240/270 (samostatné záznamy) — viz záznam ' +
      'SMTPA62 pro plný popis principu funkce, mezních hodnot a shody se standardy. SMTPA180: ' +
      'VRM 162 V, IRM max 2 µA @VRM. VR 180 V, IR max 50 µA @VR. VBO max 240 V @IBO=800 mA; ' +
      'dynamický VBO max 235 V. IH ' +
      'min 150 mA. C typ 14 pF @VR=50 V / 25 pF @VR=2 V. ⚠️ Test okruh IBO/VBO se u dílů s VBO≥200 V liší (VOUT=480 VRMS, ' +
      'R2=240 Ω) od dílů s VBO<200 V (VOUT=250 VRMS, R1=140 Ω) — SMTPA180 (VBO=240 V) patří do ' +
      'vyšší testovací skupiny. Dostupné i v pouzdru SMA (SMP50-180) a DO-15 (TPA180) se ' +
      'shodnými parametry (sloučený datasheet 2007).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom',
  },
  {
    name: 'SMTPA200',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 0,12 g; ' +
      'značení na součástce laserem "U27"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, VRM 180 V, VBO 267 V, IPP 50 A ' +
      '(10/1000 µs)',
    notes:
      'STMicroelectronics SMTPA série "TRISIL" (dok. říjen 1998, ed. 7A) — součást stejné řady ' +
      '10 dílů jako SMTPA62/68/100/120/130/180/220/240/270 (samostatné záznamy) — viz záznam ' +
      'SMTPA62 pro plný popis principu funkce, mezních hodnot a shody se standardy. SMTPA200: ' +
      'VRM 180 V, IRM max 2 µA @VRM. VR 200 V, IR max 50 µA @VR. VBO max 267 V @IBO=800 mA; ' +
      'dynamický VBO max 262 V. IH ' +
      'min 150 mA. C typ 12 pF @VR=50 V / 25 pF @VR=2 V. ⚠️ Dostupné i v pouzdru SMA (SMP50-200) ' +
      'a DO-15 (TPA200) se shodnými parametry (sloučený datasheet 2007).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom',
  },
  {
    name: 'SMTPA220',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 0,12 g; ' +
      'značení na součástce laserem "U31"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, VRM 198 V, VBO 293 V, IPP 50 A ' +
      '(10/1000 µs)',
    notes:
      'STMicroelectronics SMTPA série "TRISIL" (dok. říjen 1998, ed. 7A) — součást stejné řady ' +
      '10 dílů jako SMTPA62/68/100/120/130/180/200/240/270 (samostatné záznamy) — viz záznam ' +
      'SMTPA62 pro plný popis principu funkce, mezních hodnot a shody se standardy. SMTPA220: ' +
      'VRM 198 V, IRM max 2 µA @VRM. VR 220 V, IR max 50 µA @VR. VBO max 293 V @IBO=800 mA; ' +
      'dynamický VBO max 285 V. IH ' +
      'min 150 mA. C typ 12 pF @VR=50 V / 25 pF @VR=2 V. ⚠️ Dostupné i v pouzdru SMA (SMP50-220) ' +
      'a DO-15 (TPA220) se shodnými parametry (sloučený datasheet 2007).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom',
  },
  {
    name: 'SMTPA240',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 0,12 g; ' +
      'značení na součástce laserem "U35"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, VRM 216 V, VBO 320 V, IPP 50 A ' +
      '(10/1000 µs)',
    notes:
      'STMicroelectronics SMTPA série "TRISIL" (dok. říjen 1998, ed. 7A) — součást stejné řady ' +
      '10 dílů jako SMTPA62/68/100/120/130/180/200/220/270 (samostatné záznamy) — viz záznam ' +
      'SMTPA62 pro plný popis principu funkce, mezních hodnot a shody se standardy. SMTPA240: ' +
      'VRM 216 V, IRM max 2 µA @VRM. VR 240 V, IR max 50 µA @VR. VBO max 320 V @IBO=800 mA; ' +
      'dynamický VBO max 300 V. IH ' +
      'min 150 mA. C typ 12 pF @VR=50 V / 25 pF @VR=2 V. ⚠️ Dostupné i v pouzdru SMA (SMP50-240) ' +
      'a DO-15 (TPA240) se shodnými parametry (sloučený datasheet 2007).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom',
  },
  {
    name: 'SMTPA270',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 0,12 g; ' +
      'značení na součástce laserem "U39"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, VRM 243 V, VBO 360 V, IPP 50 A ' +
      '(10/1000 µs)',
    notes:
      'STMicroelectronics SMTPA série "TRISIL" (dok. říjen 1998, ed. 7A) — součást stejné řady ' +
      '10 dílů jako SMTPA62/68/100/120/130/180/200/220/240 (samostatné záznamy) — viz záznam ' +
      'SMTPA62 pro plný popis principu funkce, mezních hodnot a shody se standardy. SMTPA270: ' +
      'VRM 243 V, IRM max 2 µA @VRM. VR 270 V, IR max 50 µA @VR. VBO max 360 V @IBO=800 mA; ' +
      'dynamický VBO max 350 V. IH ' +
      'min 150 mA. C typ 12 pF @VR=50 V / 25 pF @VR=2 V. ⚠️ Dostupné i v pouzdru SMA (SMP50-270) ' +
      'a DO-15 (TPA270) se shodnými parametry (sloučený datasheet 2007) — ⚠️ nejvyšší napěťová ' +
      'třída v původním 10dílném datasheetu (1998), ale novější sloučený datasheet (2007) přidal ' +
      'ještě vyšší díl 320 V, viz samostatný záznam SMTPA320.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom',
  },
  {
    name: 'SMTPA320',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka, bez elektrody gate), ' +
      'hmotnost 0,11 g; značení na součástce laserem "U47" — nejvyšší napěťová třída v celé ' +
      'rodině SMP50/SMTPA/TPA',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, VRM 290 V, VBO 400 V, IPP 50 A ' +
      '(10/1000 µs)',
    notes:
      'STMicroelectronics sloučený datasheet "SMP50/SMTPA/TPA — Trisil for telecom equipment ' +
      'protection" (červen 2007, rev. 3) — 11. a nejvyšší napěťový díl rodiny SMTPAxx, doplněný ' +
      'oproti staršímu 10dílnému datasheetu (1998, ed. 7A) z něhož vychází SMTPA62–270 (samostatné ' +
      'záznamy — viz SMTPA62 pro plný popis principu funkce TRISIL, mezních hodnot a shody se ' +
      'standardy). SMTPA320: VRM (stand-off napětí) 290 V, IRM max 2 µA @VRM. VR (trvalé závěrné ' +
      'napětí) 320 V, IR max 5 µA @VR. VBO (breakover napětí, statický test) max 400 V ' +
      '@IBO=800 mA; dynamický VBO (test okruh 1, 100 V/µs, IPP=50 A) max 400 V. IH (přídržný ' +
      'proud) min 150 mA. C typ 12 pF @VR=50 V / 25 pF @VR=2 V. Mezní hodnoty společné pro celou ' +
      'rodinu (viz záznam SMTPA62): P=5 W, IPP dle vlny (10/1000 µs)=50 A ... (2/10 µs)=100 A, ' +
      'IFS=2,5 kA @8/20 µs, Tstg -55 až +150 °C, TJ max 150 °C. ⚠️ Dostupné i v pouzdru SMA ' +
      '(ozn. SMP50-320) a v drátovém pouzdru DO-15 (ozn. TPA320) se shodnými elektrickými ' +
      'parametry jako zde uvedená SMB verze.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom',
  },
  {
    name: 'SMP0720SCMC',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka, bez elektrody gate), ' +
      'hmotnost 98 mg; značení na součástce laserem "P07CM"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "micro capacitance" generace, ' +
      'VRM 65 V, VBO 88 V, VBR typ 72 V, C@50V max 45 pF',
    notes:
      'STMicroelectronics SMP-0SCMC série "Trisil" (dok. ID 022779 rev. 1, leden 2013) — ' +
      'novější generace TRISIL s nižší kapacitou přechodu ("micro capacitance technology") než ' +
      'starší řada SMTPAxx v této knihovně — určeno zejména pro širokopásmová telekomunikační ' +
      'zařízení (DSL modemy, subscriber gateway, DSLAM), kde nízká C snižuje útlum vysokých ' +
      'datových frekvencí. Princip funkce shodný s SMTPAxx (viz záznam SMTPA62): křemíková ' +
      'obousměrná spínací (crowbar) součástka podobná symetrickému tyristoru bez řídicí ' +
      'elektrody. Zpracována celá řada 10 dílů z jednoho datasheetu (SMP0720SCMC/0900/1100/' +
      '1300/1500/1800/2100/2300/2600/3100SCMC, samostatné záznamy), lišících se jen napěťovou ' +
      'třídou. SMP0720SCMC: VRM (stand-off napětí) 65 V, IRM max 5 µA @VRM. VBR (průrazné napětí) ' +
      'typ 72 V. VBO (breakover napětí) max 88 V. IH (přídržný proud) min 150 mA. VT ' +
      '(on-state napětí) max 3 V @IT=2,2 A. C max 80 pF @VR=2 V / 45 pF @VR=50 V. Teplotní ' +
      'koeficient VBR αT=9×10⁻⁴/°C. Mezní hodnoty (společné pro celou řadu): IPP dle vlny ' +
      '— (0,5/700 µs)=100 A, (2/10 µs)=500 A, (1,2/50 µs)=400 A, (10/160 µs)=200 A, ' +
      '(10/560 µs)=150 A, (9/720 µs)=200 A, (10/360 µs)=175 A, (10/1000 µs)=100 A, ' +
      '(5/310 µs)=200 A (Tamb -40 až +85 °C); ITSM (nepovtorný sinusový ráz)=61 A@10 ms / ' +
      '18 A@0,2 s / 9 A@1 s / 7 A@2 s / 4 A@15 min; Tstg -55 až +150 °C, Tj (provozní) -40 až ' +
      '+150 °C, max. pájecí teplota vývodů 260 °C/10 s. Shoda se standardy: Telcordia GR-1089, ' +
      'ITU-T K20/K21/K45 (enhanced level), TIA-968, YD/T 950/993/1082, IEC61000-4-5, ' +
      'IEC61000-4-2 level 4 (±15 kV vzduchový/±8 kV kontaktní výboj), MIL-STD-883H metoda ' +
      '3015-8 třída 3B, UL94 V0 (pryskyřice), MIL-STD-750 metoda 2026 (pájitelnost), EIA ' +
      'RS-481/IEC60286-3 (balení), IPC 7531 (footprint), UL497B (soubor E136224).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl',
  },
  {
    name: 'SMP0900SCMC',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 98 mg; ' +
      'značení na součástce laserem "P09CM"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "micro capacitance" generace, ' +
      'VRM 75 V, VBO 98 V, VBR typ 90 V, C@50V max 45 pF',
    notes:
      'STMicroelectronics SMP-0SCMC série "Trisil" (dok. ID 022779 rev. 1, leden 2013) — ' +
      'součást stejné řady 10 dílů jako SMP0720/1100/1300/1500/1800/2100/2300/2600/3100SCMC ' +
      '(samostatné záznamy) — viz záznam SMP0720SCMC pro plný popis principu funkce, mezních ' +
      'hodnot a shody se standardy. SMP0900SCMC: VRM 75 V, IRM max 5 µA @VRM. VBR typ 90 V. VBO ' +
      'max 98 V. IH min 150 mA. VT max 3 V @IT=2,2 A. C max 80 pF @VR=2 V / 45 pF @VR=50 V. ' +
      'αT=9,1×10⁻⁴/°C.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl',
  },
  {
    name: 'SMP1100SCMC',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 98 mg; ' +
      'značení na součástce laserem "P11CM"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "micro capacitance" generace, ' +
      'VRM 90 V, VBO 130 V, VBR typ 110 V, C@50V max 40 pF',
    notes:
      'STMicroelectronics SMP-0SCMC série "Trisil" (dok. ID 022779 rev. 1, leden 2013) — ' +
      'součást stejné řady 10 dílů jako SMP0720/0900/1300/1500/1800/2100/2300/2600/3100SCMC ' +
      '(samostatné záznamy) — viz záznam SMP0720SCMC pro plný popis principu funkce, mezních ' +
      'hodnot a shody se standardy. SMP1100SCMC: VRM 90 V, IRM max 5 µA @VRM. VBR typ 110 V. VBO ' +
      'max 130 V. IH min 150 mA. VT max 3 V @IT=2,2 A. C max 75 pF @VR=2 V / 40 pF @VR=50 V. ' +
      'αT=9,3×10⁻⁴/°C.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl',
  },
  {
    name: 'SMP1300SCMC',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 98 mg; ' +
      'značení na součástce laserem "P13CM"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "micro capacitance" generace, ' +
      'VRM 120 V, VBO 160 V, VBR typ 130 V, C@50V max 40 pF',
    notes:
      'STMicroelectronics SMP-0SCMC série "Trisil" (dok. ID 022779 rev. 1, leden 2013) — ' +
      'součást stejné řady 10 dílů jako SMP0720/0900/1100/1500/1800/2100/2300/2600/3100SCMC ' +
      '(samostatné záznamy) — viz záznam SMP0720SCMC pro plný popis principu funkce, mezních ' +
      'hodnot a shody se standardy. SMP1300SCMC: VRM 120 V, IRM max 5 µA @VRM. VBR typ 130 V. ' +
      'VBO max 160 V. IH min 150 mA. VT max 3 V @IT=2,2 A. C max 75 pF @VR=2 V / 40 pF @VR=50 V. ' +
      'αT=9,5×10⁻⁴/°C.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl',
  },
  {
    name: 'SMP1500SCMC',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 98 mg; ' +
      'značení na součástce laserem "P15CM"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "micro capacitance" generace, ' +
      'VRM 140 V, VBO 180 V, VBR typ 150 V, C@50V max 40 pF',
    notes:
      'STMicroelectronics SMP-0SCMC série "Trisil" (dok. ID 022779 rev. 1, leden 2013) — ' +
      'součást stejné řady 10 dílů jako SMP0720/0900/1100/1300/1800/2100/2300/2600/3100SCMC ' +
      '(samostatné záznamy) — viz záznam SMP0720SCMC pro plný popis principu funkce, mezních ' +
      'hodnot a shody se standardy. SMP1500SCMC: VRM 140 V, IRM max 5 µA @VRM. VBR typ 150 V. ' +
      'VBO max 180 V. IH min 150 mA. VT max 3 V @IT=2,2 A. C max 75 pF @VR=2 V / 40 pF @VR=50 V. ' +
      'αT=9,7×10⁻⁴/°C.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl',
  },
  {
    name: 'SMP1800SCMC',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 98 mg; ' +
      'značení na součástce laserem "P18CM"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "micro capacitance" generace, ' +
      'VRM 170 V, VBO 220 V, VBR typ 180 V, C@50V max 35 pF',
    notes:
      'STMicroelectronics SMP-0SCMC série "Trisil" (dok. ID 022779 rev. 1, leden 2013) — ' +
      'součást stejné řady 10 dílů jako SMP0720/0900/1100/1300/1500/2100/2300/2600/3100SCMC ' +
      '(samostatné záznamy) — viz záznam SMP0720SCMC pro plný popis principu funkce, mezních ' +
      'hodnot a shody se standardy. SMP1800SCMC: VRM 170 V, IRM max 5 µA @VRM. VBR typ 180 V. ' +
      'VBO max 220 V. IH min 150 mA. VT max 3 V @IT=2,2 A. C max 70 pF @VR=2 V / 35 pF @VR=50 V. ' +
      'αT=9,9×10⁻⁴/°C.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl',
  },
  {
    name: 'SMP2100SCMC',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 98 mg; ' +
      'značení na součástce laserem "P21CM"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "micro capacitance" generace, ' +
      'VRM 180 V, VBO 240 V, VBR typ 210 V, C@50V max 25 pF',
    notes:
      'STMicroelectronics SMP-0SCMC série "Trisil" (dok. ID 022779 rev. 1, leden 2013) — ' +
      'součást stejné řady 10 dílů jako SMP0720/0900/1100/1300/1500/1800/2300/2600/3100SCMC ' +
      '(samostatné záznamy) — viz záznam SMP0720SCMC pro plný popis principu funkce, mezních ' +
      'hodnot a shody se standardy. SMP2100SCMC: VRM 180 V, IRM max 5 µA @VRM. VBR typ 210 V. ' +
      'VBO max 240 V. IH min 150 mA. VT max 3 V @IT=2,2 A. C max 45 pF @VR=2 V / 25 pF @VR=50 V. ' +
      'αT=10,2×10⁻⁴/°C.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl',
  },
  {
    name: 'SMP2300SCMC',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 98 mg; ' +
      'značení na součástce laserem "P23CM"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "micro capacitance" generace, ' +
      'VRM 190 V, VBO 260 V, VBR typ 230 V, C@50V max 25 pF',
    notes:
      'STMicroelectronics SMP-0SCMC série "Trisil" (dok. ID 022779 rev. 1, leden 2013) — ' +
      'součást stejné řady 10 dílů jako SMP0720/0900/1100/1300/1500/1800/2100/2600/3100SCMC ' +
      '(samostatné záznamy) — viz záznam SMP0720SCMC pro plný popis principu funkce, mezních ' +
      'hodnot a shody se standardy. SMP2300SCMC: VRM 190 V, IRM max 5 µA @VRM. VBR typ 230 V. ' +
      'VBO max 260 V. IH min 150 mA. VT max 3 V @IT=2,2 A. C max 45 pF @VR=2 V / 25 pF @VR=50 V. ' +
      'αT=10,3×10⁻⁴/°C.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl',
  },
  {
    name: 'SMP2600SCMC',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 98 mg; ' +
      'značení na součástce laserem "P26CM"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "micro capacitance" generace, ' +
      'VRM 220 V, VBO 300 V, VBR typ 260 V, C@50V max 20 pF',
    notes:
      'STMicroelectronics SMP-0SCMC série "Trisil" (dok. ID 022779 rev. 1, leden 2013) — ' +
      'součást stejné řady 10 dílů jako SMP0720/0900/1100/1300/1500/1800/2100/2300/3100SCMC ' +
      '(samostatné záznamy) — viz záznam SMP0720SCMC pro plný popis principu funkce, mezních ' +
      'hodnot a shody se standardy. SMP2600SCMC: VRM 220 V, IRM max 5 µA @VRM. VBR typ 260 V. ' +
      'VBO max 300 V. IH min 150 mA. VT max 3 V @IT=2,2 A. C max 40 pF @VR=2 V / 20 pF @VR=50 V. ' +
      'αT=10,6×10⁻⁴/°C.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl',
  },
  {
    name: 'SMP3100SCMC',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 98 mg; ' +
      'značení na součástce laserem "P31CM" — nejvyšší napěťová třída v řadě',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "micro capacitance" generace, ' +
      'VRM 275 V, VBO 350 V, VBR typ 310 V, C@50V max 20 pF',
    notes:
      'STMicroelectronics SMP-0SCMC série "Trisil" (dok. ID 022779 rev. 1, leden 2013) — ' +
      'součást stejné řady 10 dílů jako SMP0720/0900/1100/1300/1500/1800/2100/2300/2600SCMC ' +
      '(samostatné záznamy) — viz záznam SMP0720SCMC pro plný popis principu funkce, mezních ' +
      'hodnot a shody se standardy. SMP3100SCMC: VRM 275 V, IRM max 5 µA @VRM. VBR typ 310 V. ' +
      'VBO max 350 V. IH min 150 mA. VT max 3 V @IT=2,2 A. C max 40 pF @VR=2 V / 20 pF @VR=50 V. ' +
      'αT=11×10⁻⁴/°C — nejvyšší napěťová třída v celé řadě SMP-0SCMC (72–310 V).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl',
  },
  {
    name: 'SMP100MC-140',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka, bez elektrody gate), ' +
      'hmotnost 98 mg; značení na součástce laserem "ML14"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "micro capacitance" generace, ' +
      'IPP 100 A (10/1000 µs), VRM 126 V, VBO 175 V (statický)',
    notes:
      'STMicroelectronics SMP100MC série "Trisil" (dok. ID 9699 rev. 5, únor 2012) — další, ' +
      'vyšší-proudová "micro capacitance" TRISIL řada (IPP=100 A na rozdíl od IPP=50 A u ' +
      'SMTPAxx a různých vln u SMP-0SCMC), pokrývá napěťové rozmezí 140–400 V; princip funkce ' +
      'shodný s SMTPAxx (viz záznam SMTPA62): křemíková obousměrná spínací (crowbar) součástka ' +
      'podobná symetrickému tyristoru bez řídicí elektrody. Určeno pro ochranu širokopásmových ' +
      'telekomunikačních zařízení (ADSL2+, nízkorychlostní VDSL) a jiných citlivých zařízení ' +
      'proti blesku a "power crossing" — datasheet dokládá funkční ověření v sériovém zapojení ' +
      's pojistkou Cooper Bussmann TCP 1.25 A (Trisil = paralelní rychlá ochrana proti blesku, ' +
      'pojistka = sériová ochrana proti dlouhotrvajícímu síťovému přepětí 50/60 Hz). Zpracována ' +
      'celá řada 8 dílů z jednoho datasheetu (SMP100MC-140/160/200/230/270/320/360/400, ' +
      'samostatné záznamy), lišících se jen napěťovou třídou. SMP100MC-140: VRM (stand-off ' +
      'napětí) 126 V, IRM max 2 µA @VRM. VR (trvalé závěrné napětí) 140 V, IR max 5 µA @VR. VBO ' +
      '(breakover napětí, statický test) max 175 V @IBO=800 mA; dynamický VBO (test okruh 1, ' +
      '100 V/µs, IPP=100 A) max 180 V. IH (přídržný proud) min 150 mA. C typ 30 pF @VR=50 V / ' +
      '60 pF @VR=2 V. Mezní hodnoty (společné pro celou řadu): IPP dle vlny — (10/1000 µs)=100 A, ' +
      '(8/20 µs)=300 A, (10/560 µs)=140 A, (5/310 µs)=150 A, (10/160 µs)=200 A, (1/20 µs)=300 A, ' +
      '(2/10 µs)=500 A; IFS (fail-safe zkratový režim) max 5 kA @8/20 µs; ITSM=18 A@0,2 s / ' +
      '9 A@1 s / 7 A@2 s / 4 A@15 min; I²t=20 A²s@16,6 ms / 21 A²s@20 ms; Tstg -55 až +150 °C, Tj ' +
      '(provozní) -40 až +150 °C, max. pájecí teplota vývodů 260 °C/10 s. Tepelný odpor: ' +
      'RθJ-vývody 20 °C/W, RθJ-okolí 100 °C/W (na standardní DPS). Shoda se standardy: GR-1089 ' +
      'core, ITU-T-K20/K21, IEC61000-4-5, TIA/EIA IS-968, UL60950/IEC950/CSA C22.2, UL1459, ' +
      'UL94 V0 (pryskyřice), UL497B (soubor E136224).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100MC-160',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 98 mg; ' +
      'značení na součástce laserem "ML16"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "micro capacitance" generace, ' +
      'IPP 100 A (10/1000 µs), VRM 144 V, VBO 200 V (statický)',
    notes:
      'STMicroelectronics SMP100MC série "Trisil" (dok. ID 9699 rev. 5, únor 2012) — součást ' +
      'stejné řady 8 dílů jako SMP100MC-140/200/230/270/320/360/400 (samostatné záznamy) — viz ' +
      'záznam SMP100MC-140 pro plný popis principu funkce, mezních hodnot a shody se standardy. ' +
      'SMP100MC-160: VRM 144 V, IRM max 2 µA @VRM. VR 160 V, IR max 5 µA @VR. VBO max 200 V ' +
      '@IBO=800 mA; dynamický VBO max 205 V. IH min 150 mA. C typ 25 pF @VR=50 V / 50 pF @VR=2 V.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100MC-200',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 98 mg; ' +
      'značení na součástce laserem "ML20"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "micro capacitance" generace, ' +
      'IPP 100 A (10/1000 µs), VRM 180 V, VBO 250 V (statický)',
    notes:
      'STMicroelectronics SMP100MC série "Trisil" (dok. ID 9699 rev. 5, únor 2012) — součást ' +
      'stejné řady 8 dílů jako SMP100MC-140/160/230/270/320/360/400 (samostatné záznamy) — viz ' +
      'záznam SMP100MC-140 pro plný popis principu funkce, mezních hodnot a shody se standardy. ' +
      'SMP100MC-200: VRM 180 V, IRM max 2 µA @VRM. VR 200 V, IR max 5 µA @VR. VBO max 250 V ' +
      '@IBO=800 mA; dynamický VBO max 255 V. IH min 150 mA. C typ 20 pF @VR=50 V / 45 pF @VR=2 V.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100MC-230',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 98 mg; ' +
      'značení na součástce laserem "ML23"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "micro capacitance" generace, ' +
      'IPP 100 A (10/1000 µs), VRM 207 V, VBO 285 V (statický)',
    notes:
      'STMicroelectronics SMP100MC série "Trisil" (dok. ID 9699 rev. 5, únor 2012) — součást ' +
      'stejné řady 8 dílů jako SMP100MC-140/160/200/270/320/360/400 (samostatné záznamy) — viz ' +
      'záznam SMP100MC-140 pro plný popis principu funkce, mezních hodnot a shody se standardy. ' +
      'SMP100MC-230: VRM 207 V, IRM max 2 µA @VRM. VR 230 V, IR max 5 µA @VR. VBO max 285 V ' +
      '@IBO=800 mA; dynamický VBO max 295 V. IH min 150 mA. C typ 20 pF @VR=50 V / 40 pF @VR=2 V.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100MC-270',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 98 mg; ' +
      'značení na součástce laserem "ML27"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "micro capacitance" generace, ' +
      'IPP 100 A (10/1000 µs), VRM 243 V, VBO 335 V (statický)',
    notes:
      'STMicroelectronics SMP100MC série "Trisil" (dok. ID 9699 rev. 5, únor 2012) — součást ' +
      'stejné řady 8 dílů jako SMP100MC-140/160/200/230/320/360/400 (samostatné záznamy) — viz ' +
      'záznam SMP100MC-140 pro plný popis principu funkce, mezních hodnot a shody se standardy. ' +
      'SMP100MC-270: VRM 243 V, IRM max 2 µA @VRM. VR 270 V, IR max 5 µA @VR. VBO max 335 V ' +
      '@IBO=800 mA; dynamický VBO max 345 V. IH min 150 mA. C typ 20 pF @VR=50 V / 40 pF @VR=2 V. ' +
      '⚠️ Datasheet dokládá funkční test tohoto konkrétního dílu (SMP100MC-270) v sérii ' +
      's pojistkou Cooper Bussmann TCP 1.25 A proti simulovanému blesku (2/10 µs, ±2,5 a 5 kV, ' +
      '500 A) i proti "power cross" (277 V/25 A) — Trisil i pojistka po testu funkční (GR-1089).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100MC-320',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 98 mg; ' +
      'značení na součástce laserem "ML32"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "micro capacitance" generace, ' +
      'IPP 100 A (10/1000 µs), VRM 290 V, VBO 390 V (statický)',
    notes:
      'STMicroelectronics SMP100MC série "Trisil" (dok. ID 9699 rev. 5, únor 2012) — součást ' +
      'stejné řady 8 dílů jako SMP100MC-140/160/200/230/270/360/400 (samostatné záznamy) — viz ' +
      'záznam SMP100MC-140 pro plný popis principu funkce, mezních hodnot a shody se standardy. ' +
      'SMP100MC-320: VRM 290 V, IRM max 2 µA @VRM. VR 320 V, IR max 5 µA @VR. VBO max 390 V ' +
      '@IBO=800 mA; dynamický VBO max 400 V. IH min 150 mA. C typ 15 pF @VR=50 V / 35 pF @VR=2 V.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100MC-360',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 98 mg; ' +
      'značení na součástce laserem "ML36"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "micro capacitance" generace, ' +
      'IPP 100 A (10/1000 µs), VRM 325 V, VBO 450 V (statický)',
    notes:
      'STMicroelectronics SMP100MC série "Trisil" (dok. ID 9699 rev. 5, únor 2012) — součást ' +
      'stejné řady 8 dílů jako SMP100MC-140/160/200/230/270/320/400 (samostatné záznamy) — viz ' +
      'záznam SMP100MC-140 pro plný popis principu funkce, mezních hodnot a shody se standardy. ' +
      'SMP100MC-360: VRM 325 V, IRM max 2 µA @VRM. VR 360 V, IR max 5 µA @VR. VBO max 450 V ' +
      '@IBO=800 mA; dynamický VBO max 460 V. IH min 150 mA. C typ 15 pF @VR=50 V / 35 pF @VR=2 V.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100MC-400',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka), hmotnost 98 mg; ' +
      'značení na součástce laserem "ML40" — nejvyšší napěťová třída v řadě',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "micro capacitance" generace, ' +
      'IPP 100 A (10/1000 µs), VRM 360 V, VBO 530 V (statický)',
    notes:
      'STMicroelectronics SMP100MC série "Trisil" (dok. ID 9699 rev. 5, únor 2012) — součást ' +
      'stejné řady 8 dílů jako SMP100MC-140/160/200/230/270/320/360 (samostatné záznamy) — viz ' +
      'záznam SMP100MC-140 pro plný popis principu funkce, mezních hodnot a shody se standardy. ' +
      'SMP100MC-400: VRM 360 V, IRM max 2 µA @VRM. VR 400 V, IR max 5 µA @VR. VBO max 530 V ' +
      '@IBO=800 mA; dynamický VBO max 540 V. IH min 150 mA. C typ 15 pF @VR=50 V / 30 pF @VR=2 V ' +
      '— nejvyšší napěťová třída v celé řadě SMP100MC (140–400 V).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100LC-8',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka, bez elektrody gate); ' +
      'značení na součástce laserem "PL8" — nejnižší napěťová třída v řadě',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "low capacitance" generace, IPP ' +
      '100 A (10/1000 µs), VRM 6 V, VBO 15 V (statický)',
    notes:
      'STMicroelectronics SMP100LC série "Trisil" (dok. červen 2005, rev. 11) — nízkokapacitní ' +
      '("low capacitance", C typ 20–45 pF @50 V) TRISIL řada s IPP=100 A, elektricky odlišná od ' +
      'stejnojmenné "micro capacitance" řady SMP100MC (samostatné záznamy, C typ 12–30 pF @50 V, ' +
      'užší rozsah 140–400 V) — SMP100LC pokrývá mnohem širší napěťové pásmo 8–400 V (12 dílů) ' +
      'včetně velmi nízkonapěťové varianty -8 V, podobně jako SMP75-8 (samostatný záznam), ale s ' +
      'vyšším IPP (100 A vs 75 A). Princip funkce shodný se SMTPAxx (viz záznam SMTPA62): ' +
      'křemíková obousměrná spínací (crowbar) součástka bez řídicí elektrody. Testováno a ' +
      'potvrzeno kompatibilní s pojistkou Cooper Bussmann Telecom Circuit Protector TCP 1.25 A ' +
      '(sériová ochrana proti dlouhotrvajícímu síťovému přepětí, TRISIL = paralelní rychlá ' +
      'ochrana proti blesku) — vhodné pro xDSL/ISDN linkové karty. Zpracována celá řada 12 dílů ' +
      'z jednoho datasheetu (SMP100LC-8/25/35/65/90/120/140/160/200/230/270/320/360/400, ' +
      'samostatné záznamy), lišících se jen napěťovou třídou. SMP100LC-8: VRM (stand-off napětí) ' +
      '6 V, IRM max 2 µA @VRM. VR (trvalé závěrné napětí) 8 V, IR max 5 µA @VR. VBO (breakover ' +
      'napětí, statický test) max 15 V @IBO=800 mA; dynamický VBO max 25 V. IH (přídržný proud) ' +
      'typ. 50 mA (⚠️ nižší než 150mA min u ostatních dílů řady — jediná výjimka). C typ 75 pF ' +
      '@VR=2 V (@50V neudáno — "NA", mimo měřitelný rozsah při tak nízkém VRM). Mezní hodnoty ' +
      '(společné pro celou řadu): IPP dle vlny — (10/1000 µs)=100 A, (8/20 µs)=400 A, ' +
      '(10/560 µs)=140 A, (5/310 µs)=150 A, (10/160 µs)=200 A, (1/20 µs)=400 A, (2/10 µs)=500 A; ' +
      'IFS (fail-safe zkratový režim) max 5 kA @8/20 µs; ITSM=24 A@0,2 s / 15 A@1 s / 12 A@2 s / ' +
      '4 A@15 min; I²t=20 A²s@16,6 ms / 21 A²s@20 ms; Tstg -55 až +150 °C, TJ max 150 °C, max. ' +
      'pájecí teplota vývodů 260 °C/10 s. Tepelný odpor: RθJ-vývody 20 °C/W, RθJ-okolí 100 °C/W ' +
      '(na standardní DPS). Shoda se standardy: GR-1089 core, ITU-T-K20/K21, VDE0433/0878, ' +
      'IEC61000-4-5, FCC Part 68, UL60950/IEC950/CSA C22.2, UL1459, UL94 V0 (pryskyřice).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100LC-25',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka); značení na součástce ' +
      'laserem "L25"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "low capacitance" generace, IPP ' +
      '100 A (10/1000 µs), VRM 22 V, VBO 35 V (statický)',
    notes:
      'STMicroelectronics SMP100LC série "Trisil" (dok. červen 2005, rev. 11) — součást stejné ' +
      'řady 12 dílů jako SMP100LC-8/35/65/90/120/140/160/200/230/270/320/360/400 (samostatné ' +
      'záznamy) — viz záznam SMP100LC-8 pro plný popis principu funkce, mezních hodnot a shody se ' +
      'standardy. SMP100LC-25: VRM 22 V, IRM max 2 µA @VRM. VR 25 V, IR max 5 µA @VR. VBO max ' +
      '35 V @IBO=800 mA; dynamický VBO max 40 V. IH min 150 mA. C typ 65 pF @VR=2 V (@50V ' +
      'neudáno).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100LC-35',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka); značení na součástce ' +
      'laserem "L35"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "low capacitance" generace, IPP ' +
      '100 A (10/1000 µs), VRM 32 V, VBO 55 V (statický)',
    notes:
      'STMicroelectronics SMP100LC série "Trisil" (dok. červen 2005, rev. 11) — součást stejné ' +
      'řady 12 dílů jako SMP100LC-8/25/65/90/120/140/160/200/230/270/320/360/400 (samostatné ' +
      'záznamy) — viz záznam SMP100LC-8 pro plný popis principu funkce, mezních hodnot a shody se ' +
      'standardy. SMP100LC-35: VRM 32 V, IRM max 2 µA @VRM. VR 35 V, IR max 5 µA @VR. VBO max ' +
      '55 V @IBO=800 mA; dynamický VBO max 55 V. IH min 150 mA. C typ 55 pF @VR=2 V (@50V ' +
      'neudáno).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100LC-65',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka); značení na součástce ' +
      'laserem "L06"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "low capacitance" generace, IPP ' +
      '100 A (10/1000 µs), VRM 55 V, VBO 85 V (statický)',
    notes:
      'STMicroelectronics SMP100LC série "Trisil" (dok. červen 2005, rev. 11) — součást stejné ' +
      'řady 12 dílů jako SMP100LC-8/25/35/90/120/140/160/200/230/270/320/360/400 (samostatné ' +
      'záznamy) — viz záznam SMP100LC-8 pro plný popis principu funkce, mezních hodnot a shody se ' +
      'standardy. SMP100LC-65: VRM 55 V, IRM max 2 µA @VRM. VR 65 V, IR max 5 µA @VR. VBO max ' +
      '85 V @IBO=800 mA; dynamický VBO max 85 V. IH min 150 mA. C typ 45 pF @VR=50 V / 90 pF ' +
      '@VR=2 V.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100LC-90',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka); značení na součástce ' +
      'laserem "L09"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "low capacitance" generace, IPP ' +
      '100 A (10/1000 µs), VRM 81 V, VBO 125 V (statický)',
    notes:
      'STMicroelectronics SMP100LC série "Trisil" (dok. červen 2005, rev. 11) — součást stejné ' +
      'řady 12 dílů jako SMP100LC-8/25/35/65/120/140/160/200/230/270/320/360/400 (samostatné ' +
      'záznamy) — viz záznam SMP100LC-8 pro plný popis principu funkce, mezních hodnot a shody se ' +
      'standardy. SMP100LC-90: VRM 81 V, IRM max 2 µA @VRM. VR 90 V, IR max 5 µA @VR. VBO max ' +
      '125 V @IBO=800 mA; dynamický VBO max 120 V. IH min 150 mA. C typ 40 pF @VR=50 V / 80 pF ' +
      '@VR=2 V.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100LC-120',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka); značení na součástce ' +
      'laserem "L12"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "low capacitance" generace, IPP ' +
      '100 A (10/1000 µs), VRM 108 V, VBO 160 V (statický)',
    notes:
      'STMicroelectronics SMP100LC série "Trisil" (dok. červen 2005, rev. 11) — součást stejné ' +
      'řady 12 dílů jako SMP100LC-8/25/35/65/90/140/160/200/230/270/320/360/400 (samostatné ' +
      'záznamy) — viz záznam SMP100LC-8 pro plný popis principu funkce, mezních hodnot a shody se ' +
      'standardy. SMP100LC-120: VRM 108 V, IRM max 2 µA @VRM. VR 120 V, IR max 5 µA @VR. VBO max ' +
      '160 V @IBO=800 mA; dynamický VBO max 155 V. IH min 150 mA. C typ 35 pF @VR=50 V / 75 pF ' +
      '@VR=2 V.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100LC-140',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka); značení na součástce ' +
      'laserem "L14"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "low capacitance" generace, IPP ' +
      '100 A (10/1000 µs), VRM 120 V, VBO 190 V (statický)',
    notes:
      'STMicroelectronics SMP100LC série "Trisil" (dok. červen 2005, rev. 11) — součást stejné ' +
      'řady 12 dílů jako SMP100LC-8/25/35/65/90/120/160/200/230/270/320/360/400 (samostatné ' +
      'záznamy) — viz záznam SMP100LC-8 pro plný popis principu funkce, mezních hodnot a shody se ' +
      'standardy. ⚠️ Stejné napěťové označení "SMP100LC-140" jako u sesterské řady SMP100MC-140, ' +
      'ale odlišné elektrické parametry (jiná kapacita, mírně odlišné VBO) — nejde o zaměnitelné ' +
      'díly, pouze o sdílenou napěťovou třídu napříč dvěma příbuznými produktovými řadami. ' +
      'SMP100LC-140: VRM 120 V, IRM max 2 µA @VRM. VR 140 V, IR max 5 µA @VR. VBO max 190 V ' +
      '@IBO=800 mA; dynamický VBO max 185 V. IH min 150 mA. C typ 30 pF @VR=50 V / 65 pF @VR=2 V.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100LC-160',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka); značení na součástce ' +
      'laserem "L16"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "low capacitance" generace, IPP ' +
      '100 A (10/1000 µs), VRM 144 V, VBO 200 V (statický)',
    notes:
      'STMicroelectronics SMP100LC série "Trisil" (dok. červen 2005, rev. 11) — součást stejné ' +
      'řady 12 dílů jako SMP100LC-8/25/35/65/90/120/140/200/230/270/320/360/400 (samostatné ' +
      'záznamy) — viz záznam SMP100LC-8 pro plný popis principu funkce, mezních hodnot a shody se ' +
      'standardy. SMP100LC-160: VRM 144 V, IRM max 2 µA @VRM. VR 160 V, IR max 5 µA @VR. VBO max ' +
      '200 V @IBO=800 mA; dynamický VBO max 205 V. IH min 150 mA. C typ 30 pF @VR=50 V / 65 pF ' +
      '@VR=2 V.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100LC-200',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka); značení na součástce ' +
      'laserem "L20"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "low capacitance" generace, IPP ' +
      '100 A (10/1000 µs), VRM 180 V, VBO 250 V (statický)',
    notes:
      'STMicroelectronics SMP100LC série "Trisil" (dok. červen 2005, rev. 11) — součást stejné ' +
      'řady 12 dílů jako SMP100LC-8/25/35/65/90/120/140/160/230/270/320/360/400 (samostatné ' +
      'záznamy) — viz záznam SMP100LC-8 pro plný popis principu funkce, mezních hodnot a shody se ' +
      'standardy. SMP100LC-200: VRM 180 V, IRM max 2 µA @VRM. VR 200 V, IR max 5 µA @VR. VBO max ' +
      '250 V @IBO=800 mA; dynamický VBO max 255 V. IH min 150 mA. C typ 30 pF @VR=50 V / 60 pF ' +
      '@VR=2 V.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100LC-230',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka); značení na součástce ' +
      'laserem "L23"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "low capacitance" generace, IPP ' +
      '100 A (10/1000 µs), VRM 207 V, VBO 285 V (statický)',
    notes:
      'STMicroelectronics SMP100LC série "Trisil" (dok. červen 2005, rev. 11) — součást stejné ' +
      'řady 12 dílů jako SMP100LC-8/25/35/65/90/120/140/160/200/270/320/360/400 (samostatné ' +
      'záznamy) — viz záznam SMP100LC-8 pro plný popis principu funkce, mezních hodnot a shody se ' +
      'standardy. SMP100LC-230: VRM 207 V, IRM max 2 µA @VRM. VR 230 V, IR max 5 µA @VR. VBO max ' +
      '285 V @IBO=800 mA; dynamický VBO max 295 V. IH min 150 mA. C typ 30 pF @VR=50 V / 60 pF ' +
      '@VR=2 V.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100LC-270',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka); značení na součástce ' +
      'laserem "L27"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "low capacitance" generace, IPP ' +
      '100 A (10/1000 µs), VRM 243 V, VBO 335 V (statický)',
    notes:
      'STMicroelectronics SMP100LC série "Trisil" (dok. červen 2005, rev. 11) — součást stejné ' +
      'řady 12 dílů jako SMP100LC-8/25/35/65/90/120/140/160/200/230/320/360/400 (samostatné ' +
      'záznamy) — viz záznam SMP100LC-8 pro plný popis principu funkce, mezních hodnot a shody se ' +
      'standardy. SMP100LC-270: VRM 243 V, IRM max 2 µA @VRM. VR 270 V, IR max 5 µA @VR. VBO max ' +
      '335 V @IBO=800 mA; dynamický VBO max 345 V. IH min 150 mA. C typ 30 pF @VR=50 V / 60 pF ' +
      '@VR=2 V.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100LC-320',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka); značení na součástce ' +
      'laserem "L32"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "low capacitance" generace, IPP ' +
      '100 A (10/1000 µs), VRM 290 V, VBO 390 V (statický)',
    notes:
      'STMicroelectronics SMP100LC série "Trisil" (dok. červen 2005, rev. 11) — součást stejné ' +
      'řady 12 dílů jako SMP100LC-8/25/35/65/90/120/140/160/200/230/270/360/400 (samostatné ' +
      'záznamy) — viz záznam SMP100LC-8 pro plný popis principu funkce, mezních hodnot a shody se ' +
      'standardy. SMP100LC-320: VRM 290 V, IRM max 2 µA @VRM. VR 320 V, IR max 5 µA @VR. VBO max ' +
      '390 V @IBO=800 mA; dynamický VBO max 400 V. IH min 150 mA. C typ 25 pF @VR=50 V / 50 pF ' +
      '@VR=2 V.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100LC-360',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka); značení na součástce ' +
      'laserem "L36"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "low capacitance" generace, IPP ' +
      '100 A (10/1000 µs), VRM 325 V, VBO 450 V (statický)',
    notes:
      'STMicroelectronics SMP100LC série "Trisil" (dok. červen 2005, rev. 11) — součást stejné ' +
      'řady 12 dílů jako SMP100LC-8/25/35/65/90/120/140/160/200/230/270/320/400 (samostatné ' +
      'záznamy) — viz záznam SMP100LC-8 pro plný popis principu funkce, mezních hodnot a shody se ' +
      'standardy. SMP100LC-360: VRM 325 V, IRM max 2 µA @VRM. VR 360 V, IR max 5 µA @VR. VBO max ' +
      '450 V @IBO=800 mA; dynamický VBO max 460 V. IH min 150 mA. C typ 25 pF @VR=50 V / 50 pF ' +
      '@VR=2 V.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'SMP100LC-400',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka); značení na součástce ' +
      'laserem "L40" — nejvyšší napěťová třída v řadě',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, "low capacitance" generace, IPP ' +
      '100 A (10/1000 µs), VRM 360 V, VBO 530 V (statický)',
    notes:
      'STMicroelectronics SMP100LC série "Trisil" (dok. červen 2005, rev. 11) — součást stejné ' +
      'řady 12 dílů jako SMP100LC-8/25/35/65/90/120/140/160/200/230/270/320/360 (samostatné ' +
      'záznamy) — viz záznam SMP100LC-8 pro plný popis principu funkce, mezních hodnot a shody se ' +
      'standardy. SMP100LC-400: VRM 360 V, IRM max 2 µA @VRM. VR 400 V, IR max 5 µA @VR. VBO max ' +
      '530 V @IBO=800 mA; dynamický VBO max 540 V. IH min 150 mA. C typ 20 pF @VR=50 V / 45 pF ' +
      '@VR=2 V — nejvyšší napěťová třída v celé řadě SMP100LC (8–400 V).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,dsl,adsl',
  },
  {
    name: 'TLP140M/G/G-1',
    packageType:
      'Dostupné ve 3 pouzdrech se shodným čipem: PowerSO-10 (ozn. "M"), D²PAK (ozn. "G") nebo ' +
      'I²PAK/TO-220 (ozn. "G-1") — 3 aktivní vývody TIP, RING, GND (+ mechanické/tepelné piny ' +
      'dle pouzdra); RθJ-pouzdro 1,0 °C/W u všech tří variant',
    value:
      'TRIPOLÁRNÍ TRISIL — 3fázová (TIP-RING, TIP-GND, RING-GND) přepěťová ochrana telefonní ' +
      'linky v jednom pouzdře, VRM 120 V, IPP 100 A (10/1000 µs)',
    notes:
      'STMicroelectronics "TLPxxM/G/G-1 — Tripolar Overvoltage Protection for Telecom Line" ' +
      '(dok. září 1998, ed. 3C) — ⚠️ zásadně odlišná topologie od ostatních TRISIL dílů v této ' +
      'knihovně (SMTPAxx/SMP-0SCMC/SMP100MC/SMP100LC/SMP75, samostatné záznamy) — ty všechny ' +
      'chrání jen JEDEN pár vodičů (2 vývody), zatímco TLPxx je TRIPOLÁRNÍ součástka se 3 ' +
      'aktivními vývody (TIP, RING, GND) obsahující interně 3 samostatné obousměrné crowbar ' +
      'struktury (TIP↔RING, TIP↔GND, RING↔GND) — chrání celou telefonní linku (analogovou i ' +
      'ISDN) najednou proti diferenciálním i souhlasným (podélným) přepětím v jediném pouzdře, ' +
      'místo kombinování více samostatných 2vývodových TRISILů. Princip spínání shodný s ostatními ' +
      'TRISIL díly (viz záznam SMTPA62): křemíková crowbar struktura bez řídicí elektrody. Určeno ' +
      'pro primární i sekundární ochranu citlivých telekomunikačních zařízení (náhrada plynových ' +
      'bleskojistek — "gas-tube replacement"): analogové a ISDN linkové karty, hlavní rozvodné ' +
      'rámy (MDF), koncová a přenosová zařízení. Zpracována celá řada 3 napěťových tříd z jednoho ' +
      'datasheetu (TLP140/200/270, samostatné záznamy), každá dostupná ve 3 pouzdrech (M/G/G-1) ' +
      'se shodnými elektrickými parametry. TLP140: mezi TIP-RING: VRM 120 V, IRM max 5 µA @VRM; ' +
      'VR 140 V, IR max 50 µA @VR; C typ 35 pF. Mezi TIP-GND i RING-GND (symetricky): VRM 120 V, ' +
      'IRM max 5 µA; VR 140 V, IR max 50 µA; VBO (breakover, měřeno @50 Hz) max 200 V @IBO=500 mA; ' +
      'IH min 150 mA; C typ 110 pF @VR=0 V / 40 pF @VR=50 V. Mezní hodnoty (společné pro celou ' +
      'řadu): IPP=100 A (10/1000 µs, otevřený obvod 1 kV) / 250 A (8/20 µs, 4 kV) / 500 A ' +
      '(2/10 µs, 2,5 kV); ITSM (indukce ze sítě 300 Vrms/600 Ω/200 ms)=0,7 A; ITSM (kontakt se ' +
      'sítí, fail-safe práh 220 Vrms/10 Ω/200 ms)=31 A, (220 Vrms/600 Ω/15 min)=0,42 A; Tstg -55 ' +
      'až +150 °C, TJ max 150 °C, provozní teplota -40 až +85 °C, max. pájecí teplota 260 °C/10 s. ' +
      'Shoda se standardy: CCITT K20, VDE0433/0878, IEC-1000-4-5 level 4, FCC Part 68 (surge ' +
      'typ A/B), Bellcore TR-NWT-001089 (1./2. úroveň), CNET I31-24. Objednací kód TPL140<M/G/G-1>' +
      '[-TR] (TR = páska/cívka, jen pro "M" verzi 600 ks; jinak trubička 50 ks).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,tripolární,telekom,powerso-10,d2pak,i2pak,tlp140',
  },
  {
    name: 'TLP200M/G/G-1',
    packageType:
      'Dostupné ve 3 pouzdrech se shodným čipem: PowerSO-10 (ozn. "M"), D²PAK (ozn. "G") nebo ' +
      'I²PAK/TO-220 (ozn. "G-1") — 3 aktivní vývody TIP, RING, GND; RθJ-pouzdro 1,0 °C/W',
    value:
      'TRIPOLÁRNÍ TRISIL — 3fázová (TIP-RING, TIP-GND, RING-GND) přepěťová ochrana telefonní ' +
      'linky v jednom pouzdře, VRM 180 V, IPP 100 A (10/1000 µs)',
    notes:
      'STMicroelectronics "TLPxxM/G/G-1" (dok. září 1998, ed. 3C) — součást stejné řady 3 ' +
      'napěťových tříd jako TLP140 a TLP270 (samostatné záznamy) — viz záznam TLP140M/G/G-1 pro ' +
      'plný popis tripolární topologie, principu funkce, mezních hodnot a shody se standardy. ' +
      'TLP200: mezi TIP-RING: VRM 180 V, IRM max 5 µA @VRM; VR 200 V, IR max 50 µA @VR; ' +
      'C typ 35 pF. Mezi TIP-GND i RING-GND: VRM 180 V, IRM max 5 µA; VR 200 V, IR max 50 µA; ' +
      'VBO max 290 V @IBO=500 mA; IH min 150 mA; C typ 110 pF @VR=0 V / 40 pF @VR=50 V.',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,tripolární,telekom,powerso-10,d2pak,i2pak,tlp200',
  },
  {
    name: 'TLP270M/G/G-1',
    packageType:
      'Dostupné ve 3 pouzdrech se shodným čipem: PowerSO-10 (ozn. "M"), D²PAK (ozn. "G") nebo ' +
      'I²PAK/TO-220 (ozn. "G-1") — 3 aktivní vývody TIP, RING, GND; RθJ-pouzdro 1,0 °C/W — ' +
      'nejvyšší napěťová třída v řadě',
    value:
      'TRIPOLÁRNÍ TRISIL — 3fázová (TIP-RING, TIP-GND, RING-GND) přepěťová ochrana telefonní ' +
      'linky v jednom pouzdře, VRM 230 V, IPP 100 A (10/1000 µs)',
    notes:
      'STMicroelectronics "TLPxxM/G/G-1" (dok. září 1998, ed. 3C) — součást stejné řady 3 ' +
      'napěťových tříd jako TLP140 a TLP200 (samostatné záznamy) — viz záznam TLP140M/G/G-1 pro ' +
      'plný popis tripolární topologie, principu funkce, mezních hodnot a shody se standardy. ' +
      'TLP270: mezi TIP-RING: VRM 230 V, IRM max 5 µA @VRM; VR 270 V, IR max 50 µA @VR; ' +
      'C typ 35 pF. Mezi TIP-GND i RING-GND: VRM 230 V, IRM max 5 µA; VR 270 V, IR max 50 µA; ' +
      'VBO max 400 V @IBO=500 mA; IH min 150 mA; C typ 110 pF @VR=0 V / 40 pF @VR=50 V — ' +
      'nejvyšší napěťová třída v celé řadě TLPxx (140–270 V).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,tripolární,telekom,powerso-10,d2pak,i2pak,tlp270',
  },
  {
    name: 'CLP200M',
    packageType:
      'PowerSO-10, 10 vývodů: 1=FS (Failure Status), 2=TIPS, 3/4/5=TIPL, 6/7/8=RINGL, 9=RINGS, ' +
      '10=NC; TAB (chladicí ploška) = GND',
    value:
      'Aktivní duální obousměrný ochranný obvod telefonní linky — kombinuje přepěťovou (interní ' +
      'ref. ±215 V, externě nastavitelná níž) i nadproudovou (přes Rsense) detekci, s výstupem ' +
      'poruchového stavu (FS)',
    notes:
      'SGS-Thomson (nyní STMicroelectronics) "CLP200M — Overvoltage and Overcurrent Protection ' +
      'for Telecom Line" (dok. únor 1998, ed. 3) — ⚠️ architektonicky pokročilejší než pasivní ' +
      'TRISIL součástky v této knihovně (SMTPAxx/SMPxxx/TLPxx, samostatné záznamy) — CLP200M NENÍ ' +
      'prostá crowbar struktura, ale AKTIVNÍ ochranný obvod s vnitřními komparátory/detektory ' +
      '(přepěťový i nadproudový detektor na obou stranách TIP i RING), logickými OR hradly a ' +
      'spínači SW1–SW4, který zkratuje linku na GND při překročení prahu — funkčně podobný účel ' +
      '(ochrana telekomunikační linky), ale programovatelný/konfigurovatelný externími ' +
      'součástkami: práh přepětí lze snížit z pevné interní reference ±215 V pomocí externích ' +
      'Zenerových diod (VZ1–VZ4) nebo externího napěťového referenčního obvodu (např. LCP1511D ' +
      'nebo řada THDTxx jako druhý ochranný stupeň u SLIC), a aktivační proud nadproudové ochrany ' +
      'je nastavitelný externím rezistorem RSENSE. Duální (2× shodný obvod pro TIP i RING) a ' +
      'obousměrný (kladné i záporné přepětí/proud). Výstupní pin FS (Failure Status) signalizuje ' +
      'poruchový/sepnutý stav. Určeno pro primární ochranu na MDF (hlavní rozvodný rám) i pro ' +
      'linkové karty (analogové, ISDN, PABX) — v aplikaci obvykle kombinováno s druhým ochranným ' +
      'stupněm (LCP1511D/THDTxx) blíže u SLIC obvodu. Elektrické charakteristiky (RSENSE=4 Ω): ' +
      'ILGL (svodový proud linka-GND) max 10 µA @VLG=200 V. VREF (interní přepěťová reference) ' +
      'min 215 V @ILG=1 mA. VSWON (napětí linka-GND při sepnutí SW1/SW2) max 290 V @50 Hz. ISWOFF ' +
      '(vypínací proud) min 150 mA. ISWON (zapínací proud): kladný pulz 180–280 mA, záporný pulz ' +
      '220–320 mA. C (kapacita linka-GND) max 200 pF @VLG=-1 V+1 Vrms/1 MHz. Mezní hodnoty: IPP ' +
      '(linka-GND, 10/1000 µs, otevřený obvod 1 kV)=100 A / (5/310 µs, otevřený obvod 4 kV, ' +
      '10/700 µs)=130 A; ITSM (indukce ze sítě 300 Vrms/600 Ω/200 ms)=0,5 A; (kontakt se sítí, ' +
      'práh poruchového stavu, 220 Vrms/10 Ω/200 ms)=22 A; (220 Vrms/600 Ω/15 min)=0,30 A; Tstg ' +
      '-40 až +150 °C, TJ max 150 °C, max. pájecí teplota 260 °C/10 s. Shoda se standardy: CCITT ' +
      'K20 (4 kV 10/700 µs, 100 A 5/310 µs), Bellcore TR-NWT-000974 (1 kV a 100 A, 10/1000 µs). ' +
      'Zbytkové napětí po zásahu ochrany v testech dle CCITT K20: nepřesahuje +2,5 V/-60 V ' +
      '(bleskový test se sekundární LCP1511D ochranou) resp. do 270 V (indukční test bez ' +
      'sekundární ochrany).',
    tags: 'dioda,přepěťová-ochrana,nadproudová-ochrana,telekom,powerso-10,clp200m,aktivní-ochrana',
  },
  {
    name: 'SMP75-8',
    packageType:
      'SMB (JEDEC DO-214AA), 2 vývody (symetrická/obousměrná součástka, bez elektrody gate), ' +
      'hmotnost 0,11 g; značení na součástce laserem "L08"',
    value:
      'TRISIL — obousměrná crowbar (spínací) přepěťová ochrana, velmi nízké napětí 8 V, IPP 75 A ' +
      '(10/1000 µs), VRM 6 V, VBO 15 V (statický)',
    notes:
      'STMicroelectronics SMP75-8 "Trisil" (dok. ID 5015 rev. 5, říjen 2010) — samostatný, ' +
      'elektricky odlišný TRISIL díl (jiná napěťová i proudová třída než SMTPAxx/SMP-0SCMC/' +
      'SMP100MC v této knihovně), princip funkce shodný (viz záznam SMTPA62): křemíková ' +
      'obousměrná spínací (crowbar) součástka podobná symetrickému tyristoru bez řídicí ' +
      'elektrody. Určeno speciálně pro velmi nízkonapěťovou ochranu citlivých ' +
      'telekomunikačních rozhraní (Ethernet, T1/E1) — nízké VBO chrání linkový transformátor ' +
      'proti přepětí, aniž by ho saturovalo. VRM (stand-off napětí) 6 V, IRM max 2 µA @VRM. VR ' +
      '(trvalé závěrné napětí) 8 V, IR max 5 µA @VR. VBO (breakover napětí, statický test) max ' +
      '15 V @IBO=800 mA; dynamický VBO max 20 V. IH (přídržný proud) typ 50 mA. C max 60 pF ' +
      '@VR=2 V. Mezní hodnoty: IPP dle vlny — (10/1000 µs)=75 A, (8/20 µs)=250 A, ' +
      '(10/560 µs)=100 A, (5/310 µs)=120 A, (10/160 µs)=150 A, (1/20 µs)=250 A, (2/10 µs)=250 A; ' +
      'IFS (fail-safe zkratový režim) max 5 kA @8/20 µs; ITSM=14 A@0,2 s / 8 A@1 s / 6,5 A@2 s / ' +
      '2 A@15 min; I²t=12 A²s@16,6 ms / 12,2 A²s@20 ms; Tstg -55 až +150 °C, TJ max 150 °C, ' +
      'max. pájecí teplota vývodů 260 °C/10 s. Tepelný odpor: RθJ-vývody 20 °C/W, RθJ-okolí ' +
      '100 °C/W (na standardní DPS). Shoda se standardy: GR-1089 core, ITU-T-K20/K21, ' +
      'VDE0433/0878, IEC61000-4-5, FCC Part 68, UL1950/IEC950/CSA C22.2, UL1459, UL94 V0 ' +
      '(pryskyřice).',
    tags: 'dioda,trisil,crowbar,přepěťová-ochrana,thyristor,smb,do-214aa,telekom,ethernet',
  },
  {
    name: 'SCD4C60S',
    packageType: 'D-PAK (TO-252), 3 vývody: 1=katoda, 2=anoda, 3=gate',
    value:
      'Tyristor (SCR — Silicon Controlled Rectifier), standardní hradlové spouštění, VDRM 600 V, ' +
      'IT(RMS) 4 A, VTM 1,6 V typ. @ITM=6 A',
    notes:
      'SemiWell Semiconductor "SCD4C60S — Silicon Controlled Rectifiers" (dok. říjen 2005, ' +
      '"Preliminary") — ⚠️ POZOR na záměnu s jinými díly obsahujícími prefix "SCD" v této ' +
      'knihovně (Cornell Dubilier "Type SCD" fóliové IGBT snubber kondenzátory, Sensirion ' +
      '"SCD4x" CO2 senzory) — čistě náhodná shoda označení, tento SCD4C60S je zcela odlišná ' +
      'součástka od jiného výrobce: klasický třívývodový tyristor (SCR) s hradlovým (gate) ' +
      'spouštěním — NA ROZDÍL od TRISIL součástek (SMTPAxx/SMP-0SCMC/SMP100MC/SMP75 v této ' +
      'knihovně), které jsou dvouvývodové a spínají samovolně při dosažení breakover napětí bez ' +
      'řídicí elektrody, SCD4C60S vyžaduje aktivní spouštěcí impulz na gate elektrodu (typicky ' +
      'z řídicího obvodu) — jde tedy o řízený spínací prvek, ne o autonomní přepěťovou ochranu. ' +
      'Určeno pro aplikace vyžadující vysokou obousměrnou blokovací schopnost napětí: přepěťová ' +
      'ochrana, řízení motorů v elektrickém nářadí, omezovače nárazového proudu, systémy řízení ' +
      'topení. VDRM (opakovatelné špičkové závěrné/blokovací napětí) 600 V. IT(AV) (střední ' +
      'proud v propustném směru) 2 A @half-sine, Tc=106 °C. IT(RMS) 4 A @180° vodivostní úhel. ' +
      'ITSM (nárazový proud) 33 A (1/2 cyklu, 60 Hz, nepovtorný). I²t=21 A²s @8,3 ms. Kritická ' +
      'strmost nárůstu proudu di/dt 50 A/µs. VTM (propustné napětí) typ. 1,6 V @ITM=6 A. IGT ' +
      '(spouštěcí proud gate) max 200 µA @VAK=6 V/RL=10 Ω/25 °C. VGT (spouštěcí napětí gate) max ' +
      '1,5 V. VGD (nespouštěcí napětí gate) min 0,2 V @VAK=12 V/RL=100 Ω/125 °C. dv/dt (kritická ' +
      'strmost nárůstu blokovacího napětí) min 200 V/µs @125 °C (gate otevřený). IH (přídržný ' +
      'proud) min 100 µA. IDRM (blokovací proud) max 10 µA @25 °C / 200 µA @125 °C. Mezní gate ' +
      'hodnoty: PGM 0,5 W, PG(AV) 0,1 W, IFGM 0,3 A, VRGM 6,0 V. Tepelný odpor RθJ-pouzdro 3,12 ' +
      '°C/W, RθJ-okolí 89 °C/W. TJ a Tstg -40 až +125 °C.',
    tags: 'tyristor,scr,silicon-controlled-rectifier,semiwell,d-pak,to-252,řízený-spínač',
  },
  {
    name: 'QL85H6S-A/B/C',
    packageType:
      'TO-18/5,6 mm kovové pouzdro s integrovanou monitorovací fotodiodou, planární okénko, 3 ' +
      'vývody (varianty A/B/C se liší vzájemným zapojením katody/anody laserové diody a ' +
      'fotodiody uvnitř společného pouzdra)',
    value:
      'AlGaAs polovodičový laser (laserová dioda) s vestavěnou monitorovací fotodiodou, λp 855 nm ' +
      'typ. (845–865 nm), Po 20 mW typ. (22 mW max, CW), Ith 20 mA typ. (5–35 mA), Iop 55 mA typ. ' +
      '(40–70 mA), Vop 2,0 V typ. (max 2,5 V)',
    notes:
      'Roithner LaserTechnik "QL85H6S-A/B/C" — 850nm AlGaAs polovodičový laser v TO-18/5,6mm ' +
      'pouzdru s vestavěnou monitorovací (zpětnovazební) fotodiodou pro řízení výkonu — MUSÍ být ' +
      'provozován v režimu APC (Automatic Power Control, zpětnovazební regulace výkonu přes ' +
      'monitorovací fotodiodu), NIKOLI v režimu konstantního proudu (ACC), jinak hrozí degradace/ ' +
      'zničení čipu při změnách teploty. Tři varianty A/B/C se liší pouze vnitřním zapojením ' +
      '(sdílená katoda/anoda mezi laserovou diodou a monitorovací fotodiodou) při jinak identických ' +
      'optických/elektrických parametrech — do knihovny přidán jako jeden souhrnný záznam pro celou ' +
      'trojici, konkrétní varianta se volí dle požadovaného zapojení pinů v aplikaci. Optický výkon ' +
      '(CW): Po typ. 20 mW, max 22 mW. Prahový proud Ith typ. 20 mA (rozsah 5–35 mA dle kusu). ' +
      'Provozní proud Iop typ. 55 mA (rozsah 40–70 mA). Diferenciální účinnost SE (slope efficiency) ' +
      'typ. 0,5 mW/mA. Provozní napětí Vop typ. 2,0 V (max 2,5 V). Vlnová délka λp typ. 855 nm ' +
      '(rozsah 845–865 nm). Úhel vyzařování (beam divergence) θ∥ 9° (rovnoběžně s přechodem), θ⊥ ' +
      '32° (kolmo k přechodu) — eliptický svazek typický pro hranově vyzařující laserové diody. ' +
      'Monitorovací fotodioda: Im (monitorovací proud) typ. 0,6 mA @Po. Závěrná napětí: VR(LD) ' +
      '(laserová dioda) max 2 V, VR(PD) (monitorovací fotodioda) max 30 V. Provozní teplota -10 až ' +
      '+60 °C, skladovací -40 až +85 °C. Typické použití: čárové skenery, dálkoměry, zaměřovací ' +
      'laserové moduly, optické senzory.',
    tags: 'dioda,laser,laserová-dioda,algaas,to-18,monitorovací-fotodioda,apc,roithner,ql85h6s',
  },
  {
    name: 'QL78I6S-A/B/C',
    packageType:
      'TO-18/5,6 mm kovové pouzdro s integrovanou monitorovací fotodiodou, planární okénko, 3 ' +
      'vývody (varianty A/B/C se liší vzájemným zapojením katody/anody laserové diody a ' +
      'fotodiody uvnitř společného pouzdra)',
    value:
      'AlGaAs polovodičový laser (laserová dioda) s vestavěnou monitorovací fotodiodou, λp 785 nm ' +
      'typ. (775–795 nm), Po 30 mW typ., Ith 20 mA typ. (max 30 mA), Iop 55 mA typ. (max 75 mA), ' +
      'Vop 2,0 V typ. (max 2,6 V)',
    notes:
      'Roithner LaserTechnik "QL78I6S-A/B/C" (v1.1, 07/14) — ⚠️ příbuzný, ale elektricky/opticky ' +
      'odlišný díl od QL85H6S-A/B/C v této knihovně (samostatný záznam): oba jsou stejné mechanické ' +
      'konstrukce (TO-18/5,6mm, integrovaná monitorovací fotodioda, 3 pinové varianty A/B/C, MUSÍ ' +
      'být provozovány v režimu APC), ale QL78I6S pracuje v pásmu 780 nm (775–795 nm) s výkonem ' +
      '30 mW typ., zatímco QL85H6S pracuje v pásmu 855 nm s výkonem 20 mW typ. — odlišná vlnová ' +
      'délka i výkonová třída, nejde o záměnnou náhradu. Optický výkon: Po typ. 30 mW (abs. max ' +
      '35 mW). Prahový proud Ith typ. 20 mA (max 30 mA). Provozní proud Iop typ. 55 mA (max 75 ' +
      'mA). Diferenciální účinnost η typ. 0,85 mW/mA (rozsah 0,55–1,2). Provozní napětí Vop typ. ' +
      '2,0 V (max 2,6 V). Vlnová délka λp typ. 785 nm (rozsah 775–795 nm). Úhel vyzařování ' +
      '(beam divergence) θ∥ 9° typ. (rovnoběžně s přechodem), θ⊥ 22° typ. (kolmo k přechodu). Úhel ' +
      'svazku (beam angle) tolerance Δθ∥ ±2°, Δθ⊥ ±3°. Monitorovací fotodioda: Im typ. 0,3 mA ' +
      '(rozsah 0,1–0,6 mA) @Po=30mW. Optická vzdálenost (ΔX, ΔY, ΔZ) max ±60 µm. Astigmatismus ' +
      'typ. 5 µm. Závěrná napětí: laserová dioda max 2 V, monitorovací fotodioda max 30 V. ' +
      'Provozní teplota -10 až +60 °C, skladovací -40 až +85 °C. Určeno pro průmyslové optické ' +
      'moduly a senzorové aplikace.',
    tags: 'dioda,laser,laserová-dioda,algaas,to-18,monitorovací-fotodioda,apc,roithner,ql78i6s',
  },
  {
    name: 'QL78F6S-A/B/C',
    packageType:
      'TO-18/5,6 mm kovové pouzdro s integrovanou monitorovací fotodiodou, planární okénko, 3 ' +
      'vývody (varianty A/B/C se liší vzájemným zapojením katody/anody laserové diody a ' +
      'fotodiody uvnitř společného pouzdra)',
    value:
      'AlGaAs polovodičový laser (laserová dioda) s vestavěnou monitorovací fotodiodou, λp 788 nm ' +
      'typ. (775–800 nm), Po 10 mW typ., Ith 12 mA typ. (8–18 mA), Iop 22 mA typ. (max 40 mA), ' +
      'Vop 1,8 V typ. (1,5–2,4 V)',
    notes:
      'Roithner LaserTechnik "QL78F6S-A/B/C" (Ver. 0, 2004) — ⚠️ příbuzný, ale výkonově odlišný díl ' +
      'od QL78I6S-A/B/C v této knihovně (samostatný záznam): oba pracují ve stejném vlnovém pásmu ' +
      '780 nm a mají stejné mechanické pouzdro TO-18/5,6mm s monitorovací fotodiodou, ale QL78F6S ' +
      'je SLABŠÍ (nižší výkonová) varianta (10 mW typ./12 mW max vs. 30 mW typ./35 mW max u ' +
      'QL78I6S) s odpovídajícně nižším prahovým i provozním proudem (Ith 12 mA typ. vs. 20 mA; ' +
      'Iop 22 mA typ. vs. 55 mA) — jde o odlišný produkt v rámci téže produktové řady, ne o ' +
      'ekvivalent. ⚠️ Zapojení pinů A/B/C u QL78F6S odpovídá konvenci QL85J6S-A/B/C-L v této ' +
      'knihovně (A = LD katoda/PD anoda), tedy OPAČNÉ vůči QL78I6S-A/B/C (kde A = LD anoda/PD ' +
      'katoda) — při náhradě dílu nutno pečlivě zkontrolovat konkrétní písmenný sufix a odpovídající ' +
      'schéma zapojení v datasheetu, ne jen mechanické pouzdro a vlnovou délku. Optický výkon: Po ' +
      'typ. 10 mW (abs. max 12 mW). Prahový proud Ith typ. 12 mA (rozsah 8–18 mA). Provozní proud ' +
      'Iop typ. 22 mA (max 40 mA). Diferenciální účinnost η typ. 0,75 mW/mA (rozsah 0,55–0,95, ' +
      '@5mW/I(10mW)-I(5mW)). Provozní napětí Vop typ. 1,8 V (rozsah 1,5–2,4 V). Vlnová délka λp ' +
      'typ. 788 nm (rozsah 775–800 nm). Úhel vyzařování θ∥ 8° typ. (6–11°), θ⊥ 31° typ. (25–35°). ' +
      'Úhel svazku tolerance Δθ∥ ±2°, Δθ⊥ ±3°. Monitorovací fotodioda: Im typ. 0,7 mA (rozsah ' +
      '0,5–1,5 mA) @Po=10mW. Astigmatismus max 10 µm. Optická vzdálenost max ±60 µm. Závěrná ' +
      'napětí: laserová dioda max 2 V, monitorovací fotodioda max 30 V. Provozní teplota -10 až ' +
      '+60 °C, skladovací -40 až +85 °C. MUSÍ být provozována v režimu APC.',
    tags: 'dioda,laser,laserová-dioda,algaas,to-18,monitorovací-fotodioda,apc,roithner,ql78f6s',
  },
  {
    name: 'QL78J6S-A/B/C',
    packageType:
      'TO-18/5,6 mm kovové pouzdro s integrovanou monitorovací fotodiodou, planární okénko, 3 ' +
      'vývody (varianty A/B/C se liší vzájemným zapojením katody/anody laserové diody a ' +
      'fotodiody uvnitř společného pouzdra)',
    value:
      'AlGaAs polovodičový laser (laserová dioda) s vestavěnou monitorovací fotodiodou, λp 785 nm ' +
      'typ. (775–795 nm), Po 50 mW typ., Ith 25 mA typ. (max 40 mA), Iop 75 mA typ. (max 100 mA), ' +
      'Vop 2,0 V typ. (max 2,8 V)',
    notes:
      'Roithner LaserTechnik "QL78J6S-A/B/C" (03.08.2010) — ⚠️ třetí výkonová varianta v rámci ' +
      'rodiny 780nm laserových diod Roithner v této knihovně (spolu s QL78F6S-A/B/C a ' +
      'QL78I6S-A/B/C, samostatné záznamy): stejné mechanické pouzdro TO-18/5,6mm s monitorovací ' +
      'fotodiodou a stejné vlnové pásmo 780 nm, ale QL78J6S je NEJVÝKONNĚJŠÍ z trojice (50 mW ' +
      'typ./50 mW max vs. 30 mW typ./35 mW max u QL78I6S a 10 mW typ./12 mW max u QL78F6S) s ' +
      'odpovídajícně nejvyšším prahovým i provozním proudem (Ith 25 mA typ., Iop 75 mA typ.) — ' +
      'řada QL78F6S (10mW) < QL78I6S (30mW) < QL78J6S (50mW) tvoří výkonový žebříček téže optické ' +
      'vlnové délky. ⚠️ Zapojení pinů A/B/C u QL78J6S odpovídá konvenci QL78F6S a QL85J6S-A/B/C-L ' +
      'v této knihovně (A = LD katoda/PD anoda), tedy OPAČNÉ vůči QL78I6S-A/B/C (kde A = LD anoda/ ' +
      'PD katoda) — při náhradě dílu nutno pečlivě zkontrolovat konkrétní písmenný sufix a ' +
      'odpovídající schéma zapojení v datasheetu, ne jen mechanické pouzdro, vlnovou délku a výkon. ' +
      'Optický výkon: Po typ. 50 mW (abs. max 50 mW — provozováno na hraně absolutního maxima). ' +
      'Prahový proud Ith typ. 25 mA (max 40 mA). Provozní proud Iop typ. 75 mA (max 100 mA). ' +
      'Diferenciální účinnost η typ. 1,0 mW/mA (rozsah 0,6–1,4, @40mW/I(45mW)-I(5mW)). Provozní ' +
      'napětí Vop typ. 2,0 V (max 2,8 V). Vlnová délka λp typ. 785 nm (rozsah 775–795 nm). Úhel ' +
      'vyzařování θ∥ 9° typ. (7–12°), θ⊥ 22° typ. (17–27°). Úhel svazku tolerance Δθ∥ ±2°, Δθ⊥ ±3°. ' +
      'Monitorovací fotodioda: Im typ. 0,25 mA (rozsah 0,1–0,6 mA) @Po=50mW. Astigmatismus max ' +
      '5 µm. Optická vzdálenost max ±60 µm. Závěrná napětí: laserová dioda max 2 V, monitorovací ' +
      'fotodioda max 30 V. Provozní teplota -10 až +60 °C, skladovací -40 až +85 °C. MUSÍ být ' +
      'provozována v režimu APC.',
    tags: 'dioda,laser,laserová-dioda,algaas,to-18,monitorovací-fotodioda,apc,roithner,ql78j6s',
  },
  {
    name: 'QL85J6S-A/B/C-L',
    packageType:
      'TO-18/5,6 mm kovové pouzdro s integrovanou monitorovací fotodiodou, skleněné okénko ' +
      '(varianta "-L"), 3 vývody (varianty A/B/C se liší vzájemným zapojením katody/anody ' +
      'laserové diody a fotodiody uvnitř společného pouzdra)',
    value:
      'AlGaAs polovodičový laser (laserová dioda) s vestavěnou monitorovací fotodiodou, λp 855 nm ' +
      'typ. (845–865 nm), Po 40 mW typ., Ith 30 mA typ. (max 45 mA), Iop 95 mA typ. (70–110 mA), ' +
      'Vop 2,0 V typ. (max 2,5 V)',
    notes:
      'Roithner LaserTechnik "QL85J6S-A/B/C-L" (03.08.2010) — ⚠️ POZOR na záměnu s QL85H6S-A/B/C ' +
      'v této knihovně (samostatný záznam): oba pracují ve stejném vlnovém pásmu 850 nm (855 nm ' +
      'typ.) a mají stejné mechanické pouzdro TO-18/5,6mm s monitorovací fotodiodou, ale ' +
      'QL85J6S-L je VÝKONNĚJŠÍ varianta (40 mW typ./42 mW max vs. 20 mW typ./22 mW max u QL85H6S) ' +
      's odpovídajícně vyšším prahovým i provozním proudem (Ith 30 mA typ. vs. 20 mA; Iop 95 mA ' +
      'typ. vs. 55 mA) — jde o odlišný produkt v rámci téže produktové řady, ne o ekvivalent. ' +
      'Navíc přípona "-L" značí variantu se SKLENĚNÝM okénkem pouzdra (na rozdíl od planárního ' +
      'okénka u standardní QL85H6S) — dle výkresu pouzdra "LD Chip Subcount... Glass". ⚠️ Zapojení ' +
      'pinů A/B/C je navíc u QL85J6S OPAČNÉ vůči konvenci použité u příbuzného QL78I6S-A/B/C v ' +
      'této knihovně: u QL78I6S je A = LD anoda/PD katoda, zatímco u QL85J6S je A = LD katoda/PD ' +
      'anoda (a obdobně obráceně u B, C) — při náhradě dílu nutno pečlivě zkontrolovat konkrétní ' +
      'písmenný sufix a odpovídající schéma zapojení v datasheetu, ne jen mechanické pouzdro. ' +
      'Optický výkon: Po typ. 40 mW (abs. max 42 mW). Prahový proud Ith typ. 30 mA (max 45 mA). ' +
      'Provozní proud Iop typ. 95 mA (rozsah 70–110 mA). Strmost (slope efficiency) SE typ. 0,6 ' +
      'mW/mA (rozsah 0,3–0,9, @20–40mW). Provozní napětí Vop typ. 2,0 V (max 2,5 V). Vlnová délka ' +
      'λp typ. 855 nm (rozsah 845–865 nm). Úhel vyzařování θ∥ 9° typ. (7–12°), θ⊥ 32° typ. (25– ' +
      '40°). Úhel svazku tolerance Δθ∥ ±2°, Δθ⊥ ±3°. Monitorovací fotodioda: Im typ. 0,2 mA ' +
      '(rozsah 0,05–0,5 mA) @Po=40mW. Astigmatismus max 15 µm. Optická vzdálenost max ±60 µm. ' +
      'Závěrná napětí: laserová dioda max 2 V, monitorovací fotodioda max 30 V. Provozní teplota ' +
      '-10 až +60 °C, skladovací -40 až +85 °C. MUSÍ být provozována v režimu APC.',
    tags: 'dioda,laser,laserová-dioda,algaas,to-18,monitorovací-fotodioda,apc,roithner,ql85j6s',
  },
  {
    name: 'LD-201VR',
    packageType:
      'THT plochý ("flat") jednočipový displej, tenké pouzdro cca 6,0×3,68 mm, dlouhé vývody ' +
      '(min. 24 mm) pro širokou škálu montážních možností, vhodné ke spojování více kusů vedle ' +
      'sebe; katodová značka/seříznutí pro identifikaci pinu 1',
    value:
      'LED "flat display" (planární emise z jednoho čipu), červená, λp 650 nm, IV typ. 6,3 mcd ' +
      '@IF=10 mA, VF typ. 2,0 V',
    notes:
      'ROHM "LD-201 Series — Flat displays" — jednočipové ploché LED displeje s planární emisí ' +
      'a tenkým pouzdrem umožňujícím vzájemné spojování více kusů do řady/pole a montáž díky ' +
      'dlouhým vývodům v širokém spektru aplikací (na rozdíl od běžných kulatých/pouzdrových LED ' +
      'v této knihovně). Zpracována celá řada 4 barev z jednoho datasheetu (LD-201VR červená, ' +
      'LD-201DU oranžová, LD-201YY žlutá, LD-201MG zelená, samostatné záznamy). LD-201VR ' +
      '(červená): PD 60 mW, IF 20 mA, IFP 60 mA (pulz 1 ms, duty 1/5), VR 3 V. VF typ. 2,0 V/max ' +
      '2,8 V @IF=10 mA. IR max 10 µA @VR=3 V. λp (vrcholová vlnová délka) typ. 650 nm, Δλ ' +
      '(spektrální pološířka) typ. 40 nm @IF=10 mA. IV (svítivost) min 2,2/typ. 6,3 mcd @IF=10 mA. ' +
      'Provozní teplota -25 až +75 °C, skladovací -30 až +85 °C. Poznámka k montáži: ohyb vývodů ' +
      'min. 2 mm od těla pouzdra, pájet až po tvarování vývodů.',
    tags: 'dioda,led,displej,flat-display,rohm,ld-201,červená',
  },
  {
    name: 'LD-201DU',
    packageType:
      'THT plochý ("flat") jednočipový displej, tenké pouzdro cca 6,0×3,68 mm, dlouhé vývody ' +
      '(min. 24 mm), vhodné ke spojování více kusů vedle sebe',
    value:
      'LED "flat display" (planární emise z jednoho čipu), oranžová, λp 610 nm, IV typ. 6,3 mcd ' +
      '@IF=10 mA, VF typ. 2,0 V',
    notes:
      'ROHM "LD-201 Series — Flat displays" — součást stejné řady 4 barev jako LD-201VR/YY/MG ' +
      '(samostatné záznamy) — viz záznam LD-201VR pro plný popis principu "flat display" a ' +
      'montážní poznámky. ⚠️ Dle datasheetu "order-based production" (vyráběno na objednávku, ' +
      'nikoli standardní skladová položka). LD-201DU (oranžová): PD 60 mW, IF 20 mA, IFP 60 mA, ' +
      'VR 3 V. VF typ. 2,0 V/max 2,8 V @IF=10 mA. IR max 10 µA @VR=3 V. λp typ. 610 nm, Δλ typ. ' +
      '40 nm. IV min 2,2/typ. 6,3 mcd @IF=10 mA. Provozní teplota -25 až +75 °C, skladovací -30 ' +
      'až +85 °C.',
    tags: 'dioda,led,displej,flat-display,rohm,ld-201,oranžová',
  },
  {
    name: 'LD-201YY',
    packageType:
      'THT plochý ("flat") jednočipový displej, tenké pouzdro cca 6,0×3,68 mm, dlouhé vývody ' +
      '(min. 24 mm), vhodné ke spojování více kusů vedle sebe',
    value:
      'LED "flat display" (planární emise z jednoho čipu), žlutá, λp 585 nm, IV typ. 4,0 mcd ' +
      '@IF=10 mA, VF typ. 2,1 V',
    notes:
      'ROHM "LD-201 Series — Flat displays" — součást stejné řady 4 barev jako LD-201VR/DU/MG ' +
      '(samostatné záznamy) — viz záznam LD-201VR pro plný popis principu "flat display" a ' +
      'montážní poznámky. ⚠️ Dle datasheetu "order-based production" (vyráběno na objednávku). ' +
      'LD-201YY (žlutá): PD 60 mW, IF 20 mA, IFP 60 mA, VR 3 V. VF typ. 2,1 V/max 2,8 V @IF=10 mA. ' +
      'IR max 10 µA @VR=3 V. λp typ. 585 nm, Δλ typ. 40 nm. IV min 1,4/typ. 4,0 mcd @IF=10 mA ' +
      '(⚠️ nejnižší svítivost v řadě). Provozní teplota -25 až +75 °C, skladovací -30 až +85 °C.',
    tags: 'dioda,led,displej,flat-display,rohm,ld-201,žlutá',
  },
  {
    name: 'LD-201MG',
    packageType:
      'THT plochý ("flat") jednočipový displej, tenké pouzdro cca 6,0×3,68 mm, dlouhé vývody ' +
      '(min. 24 mm), vhodné ke spojování více kusů vedle sebe',
    value:
      'LED "flat display" (planární emise z jednoho čipu), zelená, λp 563 nm, IV typ. 10 mcd ' +
      '@IF=10 mA, VF typ. 2,1 V — nejvyšší výkon/svítivost v řadě',
    notes:
      'ROHM "LD-201 Series — Flat displays" — součást stejné řady 4 barev jako LD-201VR/DU/YY ' +
      '(samostatné záznamy) — viz záznam LD-201VR pro plný popis principu "flat display" a ' +
      'montážní poznámky. LD-201MG (zelená): ⚠️ vyšší mezní hodnoty než ostatní barvy v řadě — PD ' +
      '75 mW, IF 25 mA (vs. 60 mW/20 mA u červené/oranžové/žluté), VR 3 V. VF typ. 2,1 V/max ' +
      '2,8 V @IF=10 mA. IR max 10 µA @VR=3 V. λp typ. 563 nm, Δλ typ. 40 nm. IV min 3,6/typ. ' +
      '10 mcd @IF=10 mA — nejvyšší svítivost v celé řadě LD-201. Provozní teplota -25 až +75 °C, ' +
      'skladovací -30 až +85 °C.',
    tags: 'dioda,led,displej,flat-display,rohm,ld-201,zelená',
  },
  {
    name: 'LD-001VR',
    packageType:
      'THT plochý ("flat") DVOUčipový displej, plocha emise 4,5×9,5 mm (větší než jednočipový ' +
      'LD-201, samostatné záznamy), tenké pouzdro s dlouhými vývody, cathode mark pro ' +
      'identifikaci pinu 1',
    value:
      'LED "flat display" (planární emise ze 2 čipů zapojených sériově), červená, λp 650 nm, ' +
      'IV typ. 6,3 mcd @IF=10 mA (na 1 čip), VF typ. 2,0 V (na 1 čip)',
    notes:
      'ROHM "LD-001 Series — Flat displays" — středně velký DVOUčipový sourozenec jednočipové ' +
      'řady LD-201 (samostatné záznamy) — stejná koncepce ploché planární emise a možnosti ' +
      'skládání více kusů vedle sebe, ale LD-001 má dva čipy zapojené SÉRIOVĚ v jednom pouzdře ' +
      '(větší emisní plocha 4,5×9,5 mm, vyšší PD/IF) místo jednoho čipu u LD-201 — uvedené ' +
      'elektrické/optické hodnoty (VF, IV, λp, Δλ) jsou dle datasheetu měřeny "per element" ' +
      '(na 1 čip), proud prochází oběma čipy v sérii. Zpracována celá řada 4 barev z jednoho ' +
      'datasheetu (LD-001VR červená, LD-001DU oranžová, LD-001YY žlutá, LD-001MG zelená, ' +
      'samostatné záznamy). LD-001VR (červená): PD 120 mW (vs. 60 mW u LD-201VR), IF 20 mA, ' +
      'IFP 60 mA (pulz 1 ms, duty 1/5), VR 3 V. VF typ. 2,0 V/max 2,8 V @IF=10 mA (na čip). IR ' +
      'max 10 µA @VR=3 V. λp typ. 650 nm, Δλ typ. 40 nm. IV min 2,2/typ. 6,3 mcd @IF=10 mA — ' +
      'shodná svítivost na čip jako LD-201VR (protože jde o stejný čip, jen zdvojený v sérii). ' +
      'Provozní teplota -25 až +75 °C, skladovací -30 až +85 °C.',
    tags: 'dioda,led,displej,flat-display,rohm,ld-001,červená,dvoučipový',
  },
  {
    name: 'LD-001DU',
    packageType:
      'THT plochý ("flat") DVOUčipový displej, plocha emise 4,5×9,5 mm, tenké pouzdro s ' +
      'dlouhými vývody',
    value:
      'LED "flat display" (planární emise ze 2 čipů zapojených sériově), oranžová, λp 610 nm, ' +
      'IV typ. 6,3 mcd @IF=10 mA (na 1 čip), VF typ. 2,0 V (na 1 čip)',
    notes:
      'ROHM "LD-001 Series — Flat displays" — součást stejné řady 4 barev jako LD-001VR/YY/MG ' +
      '(samostatné záznamy) — viz záznam LD-001VR pro plný popis dvoučipové koncepce a vztahu k ' +
      'jednočipové řadě LD-201. ⚠️ Dle datasheetu "order-based production" (na objednávku). ' +
      'LD-001DU (oranžová): PD 120 mW, IF 20 mA, IFP 60 mA, VR 3 V. VF typ. 2,0 V/max 2,8 V ' +
      '@IF=10 mA (na čip). IR max 10 µA @VR=3 V. λp typ. 610 nm, Δλ typ. 40 nm. IV min 2,2/typ. ' +
      '6,3 mcd @IF=10 mA. Provozní teplota -25 až +75 °C, skladovací -30 až +85 °C.',
    tags: 'dioda,led,displej,flat-display,rohm,ld-001,oranžová,dvoučipový',
  },
  {
    name: 'LD-001YY',
    packageType:
      'THT plochý ("flat") DVOUčipový displej, plocha emise 4,5×9,5 mm, tenké pouzdro s ' +
      'dlouhými vývody',
    value:
      'LED "flat display" (planární emise ze 2 čipů zapojených sériově), žlutá, λp 585 nm, IV ' +
      'typ. 4,0 mcd @IF=10 mA (na 1 čip), VF typ. 2,1 V (na 1 čip)',
    notes:
      'ROHM "LD-001 Series — Flat displays" — součást stejné řady 4 barev jako LD-001VR/DU/MG ' +
      '(samostatné záznamy) — viz záznam LD-001VR pro plný popis dvoučipové koncepce a vztahu k ' +
      'jednočipové řadě LD-201. ⚠️ Dle datasheetu "order-based production" (na objednávku). ' +
      'LD-001YY (žlutá): PD 120 mW, IF 20 mA, IFP 60 mA, VR 3 V. VF typ. 2,1 V/max 2,8 V ' +
      '@IF=10 mA (na čip). IR max 10 µA @VR=3 V. λp typ. 585 nm, Δλ typ. 40 nm. IV min 1,4/typ. ' +
      '4,0 mcd @IF=10 mA (⚠️ nejnižší svítivost v řadě). Provozní teplota -25 až +75 °C, ' +
      'skladovací -30 až +85 °C.',
    tags: 'dioda,led,displej,flat-display,rohm,ld-001,žlutá,dvoučipový',
  },
  {
    name: 'LD-001MG',
    packageType:
      'THT plochý ("flat") DVOUčipový displej, plocha emise 4,5×9,5 mm, tenké pouzdro s ' +
      'dlouhými vývody',
    value:
      'LED "flat display" (planární emise ze 2 čipů zapojených sériově), zelená, λp 563 nm, IV ' +
      'typ. 10 mcd @IF=10 mA (na 1 čip), VF typ. 2,1 V (na 1 čip) — nejvyšší svítivost/výkon v řadě',
    notes:
      'ROHM "LD-001 Series — Flat displays" — součást stejné řady 4 barev jako LD-001VR/DU/YY ' +
      '(samostatné záznamy) — viz záznam LD-001VR pro plný popis dvoučipové koncepce a vztahu k ' +
      'jednočipové řadě LD-201. LD-001MG (zelená): ⚠️ vyšší mezní hodnoty než ostatní barvy v ' +
      'řadě — PD 150 mW, IF 25 mA (vs. 120 mW/20 mA u ostatních barev), VR 3 V. VF typ. 2,1 V/max ' +
      '2,8 V @IF=10 mA (na čip). IR max 10 µA @VR=3 V. λp typ. 563 nm, Δλ typ. 40 nm. IV min ' +
      '3,6/typ. 10 mcd @IF=10 mA — nejvyšší svítivost v celé řadě LD-001. Provozní teplota -25 ' +
      'až +75 °C, skladovací -30 až +85 °C.',
    tags: 'dioda,led,displej,flat-display,rohm,ld-001,zelená,dvoučipový',
  },
  {
    name: 'LD-701VR',
    packageType:
      'THT plochý ("flat") TŘÍčipový displej, velká emisní plocha 4,5×19,8 mm, tenké pouzdro s ' +
      'dlouhými vývody, možnost skládání více kusů vedle sebe',
    value:
      'LED "large flat display" (planární emise ze 3 čipů zapojených sériově), červená, λp ' +
      '650 nm, IV typ. 10 mcd @IF=10 mA (na 1 čip), VF typ. 2,0 V (na 1 čip)',
    notes:
      'ROHM "LD-701 Series — Large flat displays" — třetí (a největší) velikostní stupeň řady ' +
      'plochých displejů ROHM v této knihovně, po jednočipovém LD-201 a dvoučipovém LD-001 ' +
      '(samostatné záznamy) — LD-701 má TŘI nezávislé čipové elementy zapojené sériově ("proud ' +
      'prochází všemi elementy", stejně jako u LD-001), s dvojnásobnou emisní plochou oproti ' +
      'LD-001 (4,5×19,8 mm vs. 4,5×9,5 mm) — určeno pro velké, dobře viditelné indikátory/panely. ' +
      'Zpracována celá řada 4 barev z jednoho datasheetu (LD-701VR červená, LD-701DU oranžová, ' +
      'LD-701YY žlutá, LD-701MG zelená, samostatné záznamy). LD-701VR (červená): PD 180 mW (vyšší ' +
      'než 120 mW u LD-001VR kvůli 3 čipům), IF 20 mA, IFP 60 mA (pulz 1 ms, duty 1/5), VR 3 V. VF ' +
      'typ. 2,0 V/max 3,0 V @IF=10 mA (na čip, ⚠️ vyšší max. hodnota než 2,8 V u LD-201/LD-001). ' +
      'IR max 10 µA @VR=3 V. λp typ. 650 nm, Δλ typ. 40 nm. IV min 3,6/typ. 10 mcd @IF=10 mA (na ' +
      'čip) — shodná svítivost na čip jako LD-201VR/LD-001VR (stejný čip, jen ztrojený v sérii). ' +
      'Provozní teplota -25 až +75 °C, skladovací -30 až +85 °C.',
    tags: 'dioda,led,displej,flat-display,rohm,ld-701,červená,třičipový',
  },
  {
    name: 'LD-701DU',
    packageType:
      'THT plochý ("flat") TŘÍčipový displej, velká emisní plocha 4,5×19,8 mm, tenké pouzdro s ' +
      'dlouhými vývody',
    value:
      'LED "large flat display" (planární emise ze 3 čipů zapojených sériově), oranžová, λp ' +
      '610 nm, IV typ. 10 mcd @IF=10 mA (na 1 čip), VF typ. 2,0 V (na 1 čip)',
    notes:
      'ROHM "LD-701 Series — Large flat displays" — součást stejné řady 4 barev jako LD-701VR/' +
      'YY/MG (samostatné záznamy) — viz záznam LD-701VR pro plný popis třičipové koncepce a ' +
      'vztahu k menším řadám LD-201/LD-001. ⚠️ Dle datasheetu "order-based production" (na ' +
      'objednávku). LD-701DU (oranžová): PD 180 mW, IF 20 mA, IFP 60 mA, VR 3 V. VF typ. 2,0 V/' +
      'max 3,0 V @IF=10 mA (na čip). IR max 10 µA @VR=3 V. λp typ. 610 nm, Δλ typ. 40 nm. IV min ' +
      '3,6/typ. 10 mcd @IF=10 mA. Provozní teplota -25 až +75 °C, skladovací -30 až +85 °C.',
    tags: 'dioda,led,displej,flat-display,rohm,ld-701,oranžová,třičipový',
  },
  {
    name: 'LD-701YY',
    packageType:
      'THT plochý ("flat") TŘÍčipový displej, velká emisní plocha 4,5×19,8 mm, tenké pouzdro s ' +
      'dlouhými vývody',
    value:
      'LED "large flat display" (planární emise ze 3 čipů zapojených sériově), žlutá, λp 585 nm, ' +
      'IV typ. 6,3 mcd @IF=10 mA (na 1 čip), VF typ. 2,1 V (na 1 čip)',
    notes:
      'ROHM "LD-701 Series — Large flat displays" — součást stejné řady 4 barev jako LD-701VR/' +
      'DU/MG (samostatné záznamy) — viz záznam LD-701VR pro plný popis třičipové koncepce. ⚠️ Dle ' +
      'datasheetu "order-based production" (na objednávku). LD-701YY (žlutá): PD 180 mW, IF ' +
      '20 mA, IFP 60 mA, VR 3 V. VF typ. 2,1 V/max 3,0 V @IF=10 mA (na čip). IR max 10 µA @VR=3 V. ' +
      'λp typ. 585 nm, Δλ typ. 40 nm. IV min 2,2/typ. 6,3 mcd @IF=10 mA (⚠️ nejnižší svítivost v ' +
      'řadě). Provozní teplota -25 až +75 °C, skladovací -30 až +85 °C.',
    tags: 'dioda,led,displej,flat-display,rohm,ld-701,žlutá,třičipový',
  },
  {
    name: 'LD-701MG',
    packageType:
      'THT plochý ("flat") TŘÍčipový displej, velká emisní plocha 4,5×19,8 mm, tenké pouzdro s ' +
      'dlouhými vývody',
    value:
      'LED "large flat display" (planární emise ze 3 čipů zapojených sériově), zelená, λp ' +
      '563 nm, IV typ. 10 mcd @IF=10 mA (na 1 čip), VF typ. 2,1 V (na 1 čip) — nejvyšší ' +
      'svítivost/výkon v řadě',
    notes:
      'ROHM "LD-701 Series — Large flat displays" — součást stejné řady 4 barev jako LD-701VR/' +
      'DU/YY (samostatné záznamy) — viz záznam LD-701VR pro plný popis třičipové koncepce. ' +
      'LD-701MG (zelená): ⚠️ vyšší mezní hodnoty než ostatní barvy v řadě — PD 225 mW, IF 25 mA ' +
      '(vs. 180 mW/20 mA u ostatních barev), VR 3 V. VF typ. 2,1 V/max 3,0 V @IF=10 mA (na čip). ' +
      'IR max 10 µA @VR=3 V. λp typ. 563 nm, Δλ typ. 40 nm. IV min 3,6/typ. 10 mcd @IF=10 mA — ' +
      'shodná nejvyšší svítivost v řadě jako LD-701VR/DU. Provozní teplota -25 až +75 °C, ' +
      'skladovací -30 až +85 °C.',
    tags: 'dioda,led,displej,flat-display,rohm,ld-701,zelená,třičipový',
  },
  {
    name: 'AND-5610S (red)',
    packageType:
      'THT 10pin DIP pouzdro, 0,56" (14,2 mm) výška znaku, rozteč vývodů 2,54 mm; dostupné jako ' +
      'AND-5610SCL (společná katoda) nebo AND-5610SAL (společná anoda), obě s červeným čelem ' +
      'displeje; průmyslově pin-kompatibilní s běžnými 7seg. displeji',
    value:
      '7segmentový LED displej, 0,56", červená (GaAsP/GaP), λp 635 nm, IV/seg typ. 3,3 mcd ' +
      '@IF=10 mA, VF typ. 2,1 V',
    notes:
      'AND Optoelectronics (Purdy Electronics) "AND-5610 Series — GaAsP/GaP-Red; GaP-Green, ' +
      '7 Segment, 0.56 Inch" (dok. 7/2007) — klasický jednomístný 7segmentový LED displej pro ' +
      'číselné zobrazení v přístrojové a průmyslové technice, průmyslově pin-kompatibilní design. ' +
      'Zpracována celá řada (červená i zelená varianta, každá se společnou katodou i anodou, ' +
      'samostatné záznamy — viz AND-5610G (green) pro zelenou variantu). AND-5610S (červená, ' +
      'GaAsP/GaP): DC IF/seg max 30 mA, pulzní IFP/seg max 100 mA, VR/seg max 3 V, provozní ' +
      'teplota -25 až +85 °C, skladovací -25 až +100 °C. VF typ. 2,1 V/max 3,0 V @IF=10 mA. IR max ' +
      '100 µA @VR=3 V. IV/seg (svítivost na segment) min 2,0/typ. 3,3 mcd @IF=10 mA. λp typ. ' +
      '635 nm, Δλ typ. 40 nm. Pinout: piny 1/2/4/5/6/7/9/10 = anody/katody segmentů E/D/C/DP/B/A/' +
      'F/G (dle CC/CA verze), piny 3 a 8 = společná katoda/anoda. Pájecí teplota max 260 °C/3 s, ' +
      'ohyb vývodů max 5 mm od těla bez pnutí. RoHS.',
    tags: 'dioda,led,displej,7segment,and-optoelectronics,and-5610,červená,gaasp',
  },
  {
    name: 'AND-5610G (green)',
    packageType:
      'THT 10pin DIP pouzdro, 0,56" (14,2 mm) výška znaku, rozteč vývodů 2,54 mm; dostupné jako ' +
      'AND-5610GCL (společná katoda) nebo AND-5610GAL (společná anoda), obě se šedým čelem ' +
      'displeje (na rozdíl od červené varianty s červeným čelem)',
    value:
      '7segmentový LED displej, 0,56", zelená (GaP), λp 567 nm, IV/seg typ. 2,9 mcd @IF=10 mA, ' +
      'VF typ. 2,1 V',
    notes:
      'AND Optoelectronics (Purdy Electronics) "AND-5610 Series" — zelená (GaP) varianta stejné ' +
      'řady jako červená AND-5610S (samostatný záznam) — viz tam pro plný popis pouzdra, pinoutu ' +
      'a společných mezních hodnot. AND-5610G (zelená, GaP): VR/seg max 5 V (⚠️ vyšší než 3 V u ' +
      'červené varianty). VF typ. 2,1 V/max 3,0 V @IF=10 mA. IR max 100 µA @VR=5 V. IV/seg min ' +
      '1,7/typ. 2,9 mcd @IF=10 mA. λp typ. 567 nm, Δλ typ. 30 nm (užší než 40 nm u červené). ' +
      'Ostatní mezní hodnoty (IF/IFP, teploty) shodné s AND-5610S.',
    tags: 'dioda,led,displej,7segment,and-optoelectronics,and-5610,zelená,gap',
  },
  {
    name: 'AND-8010-B (red)',
    packageType:
      'THT 18pin DIP pouzdro, 0,8" (20,3 mm) výška znaku, rozteč vývodů 2,54 mm; dostupné jako ' +
      'AND-8010SCLB (společná katoda) nebo AND-8010SALB (společná anoda), obě s červeným čelem ' +
      'displeje',
    value:
      '16segmentový alfanumerický LED displej, 0,8", červená (GaAsP/GaP), λp 635 nm, IV/seg ' +
      'typ. 3,8 mcd @IF=10 mA, VF typ. 2,1 V',
    notes:
      'AND Optoelectronics (Purdy Electronics) "AND-8010-B Series — GaAsP/GaP-Red; GaP-Green, ' +
      '16 Segment, Single Digit, 0.8 Inch" (dok. 6/2007) — ⚠️ jiný typ displeje než AND-5610 ' +
      '(samostatné záznamy, 7segmentový) od stejného výrobce — AND-8010-B je 16segmentový ' +
      'alfanumerický displej (zobrazuje písmena i číslice, ne jen číslice), větší znak (0,8" vs ' +
      '0,56") a více pinů (18 vs 10), určený pro počítačové periferie a terminálové displeje ' +
      'čitelné z větší vzdálenosti. Segmenty označeny A1/A2/B/C/D1/D2/E/F/G/H/J/K/M/N/P/R + ' +
      'desetinná tečka. Zpracována celá řada (červená i zelená varianta, každá se společnou ' +
      'katodou i anodou — viz AND-8010-B (green) pro zelenou variantu). AND-8010-B červená ' +
      '(GaAsP/GaP): DC IF/seg max 30 mA, pulzní IFP/seg max 100 mA (1µs pulz, 0,3 % duty), VR/seg ' +
      'max 3 V, provozní teplota -25 až +85 °C, skladovací -25 až +100 °C. VF typ. 2,1 V/max ' +
      '3,0 V @IF=10 mA. IR max 100 µA @VR=3 V. IV/seg min 2,3/typ. 3,8 mcd @IF=10 mA. λp typ. ' +
      '635 nm, Δλ typ. 40 nm. Pájecí teplota max 260 °C/3 s, ohyb vývodů max 5 mm od těla bez ' +
      'pnutí. RoHS.',
    tags: 'dioda,led,displej,16segment,alfanumerický,and-optoelectronics,and-8010,červená,gaasp',
  },
  {
    name: 'AND-8010-B (green)',
    packageType:
      'THT 18pin DIP pouzdro, 0,8" (20,3 mm) výška znaku, rozteč vývodů 2,54 mm; dostupné jako ' +
      'AND-8010GCLB (společná katoda) nebo AND-8010GALB (společná anoda), obě se šedým čelem ' +
      'displeje',
    value:
      '16segmentový alfanumerický LED displej, 0,8", zelená (GaP), λp 567 nm, IV/seg typ. ' +
      '3,3 mcd @IF=10 mA, VF typ. 2,1 V',
    notes:
      'AND Optoelectronics (Purdy Electronics) "AND-8010-B Series" — zelená (GaP) varianta ' +
      'stejné řady jako červená AND-8010-B (red) (samostatný záznam) — viz tam pro plný popis ' +
      'pouzdra, 16segmentového alfanumerického principu, pinoutu a společných mezních hodnot. ' +
      'AND-8010-B zelená (GaP): VR/seg max 5 V (⚠️ vyšší než 3 V u červené varianty). VF typ. ' +
      '2,1 V/max 3,0 V @IF=10 mA. IR max 100 µA @VR=5 V. IV/seg min 2,0/typ. 3,3 mcd @IF=10 mA. ' +
      'λp typ. 567 nm, Δλ typ. 30 nm (užší než 40 nm u červené). Ostatní mezní hodnoty (IF/IFP, ' +
      'teploty) shodné s AND-8010-B (red).',
    tags: 'dioda,led,displej,16segment,alfanumerický,and-optoelectronics,and-8010,zelená,gap',
  },
  {
    name: 'MV53164',
    packageType:
      '20pin DIP pouzdro (0,3" rozteč vývodů), end-stackable (montovatelné do řady vedle sebe) ' +
      '— 10 segmentů se samostatnou anodou i katodou pro každý segment, piny 1-10=anody segmentů ' +
      'Bar1-10, piny 11-20=katody segmentů Bar10-1 (opačné pořadí)',
    value:
      '10segmentový LED bargraf displej (sloupcový ukazatel), žlutá, λp 585 nm, IV (průměr) typ. ' +
      '1800 µcd @IF=10 mA, VF typ. 2,0 V',
    notes:
      'QT Optoelectronics "Yellow MV53164, High Efficiency Green MV54164, High Efficiency Red ' +
      'MV57164 — Bargraph Displays" — 10segmentový LED bargraf (sloupcový/úrovňový ukazatel, ' +
      'typicky buzený obvodem LM3914/podobným) se samostatnou anodou a katodou pro každý ze 10 ' +
      'segmentů (20 aktivních pinů), vysoce vhodný pro multiplexování díky rychlému přepínání ' +
      '(500 ns). Zpracována celá řada 3 barevných variant ve stejném mechanickém pouzdře z ' +
      'jednoho datasheetu (MV53164 žlutá, MV54164 vysoce účinná zelená, MV57164 vysoce účinná ' +
      'červená, samostatné záznamy). MV53164 (žlutá): PD 750 mW @25 °C (derating -14,3 mW/°C nad ' +
      '50 °C), provozní/skladovací teplota -40 až +85 °C, celkový propustný proud (trvalý) max ' +
      '200 mA, na segment max 25 mA, reverzní napětí/segment max 6 V, pájecí teplota 260 °C/5 s. ' +
      'VF typ. 2,0/max 2,5 V @IF=10 mA. IV (průměrná svítivost přes všechny segmenty, Note 1) min ' +
      '510/typ. 1800 µcd @IF=10 mA — rozptyl svítivosti mezi segmenty v rámci jednoho kusu max ' +
      '±33,3 %, díly kategorizovány (binovány) dle svítivosti, kategorie značena písmenným ' +
      'sufixem na součástce. λp typ. 585 nm, Δλ typ. 40 nm. Dynamický odpor segmentu typ. 26 Ω ' +
      '@IF=20 mA. Kapacita typ. 35 pF @V=0/1 MHz. Doba přepnutí typ. 500 ns @IF=10 mA. Reverzní ' +
      'napětí max 6,0 V @IR=100 µA. Tepelný odpor přechod-okolí ΘJA 160 °C/W, teplotní koeficient ' +
      'VF typ. -1,5 mV/°C. Doporučený kontrastní filtr: Panelgraphic Yellow 25 nebo Amber 23 ' +
      '(příp. Homalite 190-1720 nebo 100-1726).',
    tags: 'dioda,led,bargraf,displej,žlutá,qt-optoelectronics,mv53164,dip-20',
  },
  {
    name: 'MV54164',
    packageType:
      '20pin DIP pouzdro (0,3" rozteč vývodů), end-stackable — shodné mechanické pouzdro jako ' +
      'MV53164/MV57164, 10 segmentů se samostatnou anodou i katodou',
    value:
      '10segmentový LED bargraf displej, vysoce účinná (high efficiency) zelená, λp 562 nm, IV ' +
      'typ. 1800 µcd @IF=10 mA, VF typ. 2,2 V',
    notes:
      'QT Optoelectronics "MV53164/MV54164/MV57164 — Bargraph Displays" — součást stejné řady ' +
      'jako žlutá MV53164 a červená MV57164 (samostatné záznamy) — viz záznam MV53164 pro plný ' +
      'popis principu bargraf displeje, mechanického pouzdra a pinoutu. MV54164 (zelená, "high ' +
      'efficiency"): PD 750 mW @25 °C, provozní/skladovací teplota -40 až +85 °C, celkový ' +
      'propustný proud max 300 mA (⚠️ vyšší než 200 mA u žluté MV53164), na segment max 30 mA, ' +
      'reverzní napětí/segment max 6 V. VF typ. 2,2/max 3,0 V @IF=10 mA. IV min 510/typ. ' +
      '1800 µcd @IF=10 mA; navíc jako jediná v řadě udává datasheet i pulzní svítivost min ' +
      '710/typ. 2500 µcd @IF=60 mA (špičkový proud, duty factor 1:6). λp typ. 562 nm, Δλ typ. ' +
      '30 nm (užší než 40 nm u žluté/červené). Dynamický odpor segmentu typ. 12 Ω @IF=20 mA ' +
      '(nižší než 26 Ω u žluté/červené). Kapacita typ. 40 pF. Teplotní koeficient VF typ. ' +
      '-1,4 mV/°C. Ostatní parametry (ΘJA, doba přepnutí, reverzní napětí) shodné s MV53164. ' +
      'Doporučený kontrastní filtr: Panelgraphic Green 48 (příp. Homalite 100-1440 Green).',
    tags: 'dioda,led,bargraf,displej,zelená,vysoce-účinná,qt-optoelectronics,mv54164,dip-20',
  },
  {
    name: 'MV57164',
    packageType:
      '20pin DIP pouzdro (0,3" rozteč vývodů), end-stackable — shodné mechanické pouzdro jako ' +
      'MV53164/MV54164, 10 segmentů se samostatnou anodou i katodou',
    value:
      '10segmentový LED bargraf displej, vysoce účinná (high efficiency) červená, λp 630 nm, IV ' +
      'typ. 1800 µcd @IF=10 mA, VF typ. 2,2 V',
    notes:
      'QT Optoelectronics "MV53164/MV54164/MV57164 — Bargraph Displays" — součást stejné řady ' +
      'jako žlutá MV53164 a zelená MV54164 (samostatné záznamy) — viz záznam MV53164 pro plný ' +
      'popis principu bargraf displeje, mechanického pouzdra a pinoutu. MV57164 (červená, "high ' +
      'efficiency"): PD 750 mW @25 °C, provozní/skladovací teplota -40 až +85 °C, celkový ' +
      'propustný proud max 300 mA, na segment max 30 mA, reverzní napětí/segment max 6 V. VF ' +
      'typ. 2,2/max 3,0 V @IF=10 mA. IV min 510/typ. 1800 µcd @IF=10 mA. λp typ. 630 nm, Δλ typ. ' +
      '40 nm. Dynamický odpor segmentu typ. 26 Ω @IF=20 mA. Kapacita typ. 35 pF. Teplotní ' +
      'koeficient VF typ. -2,0 mV/°C (⚠️ nejvyšší teplotní drift v řadě). Ostatní parametry (ΘJA, ' +
      'doba přepnutí, reverzní napětí) shodné s MV53164/MV54164. Doporučený kontrastní filtr: ' +
      'Panelgraphic Red 60 (příp. Homalite 100-1605).',
    tags: 'dioda,led,bargraf,displej,červená,vysoce-účinná,qt-optoelectronics,mv57164,dip-20',
  },
  {
    name: 'BS-AA21RD / BS-CA21RD',
    packageType:
      'THT 20pin DIP pouzdro "SD-43" (1,00" výška znaku), tělo 13,70×33,00 mm, rozteč vývodů ' +
      '2,54 mm (řada)/5,08 mm; NC pin 1, NP piny 5/8/17/20; 16 segmentů (A1/A2/B/C/D1/D2/E/F/G1/' +
      'G2/J/K/L/M/N/P) + desetinná tečka — BS-AA21RD = společná anoda, BS-CA21RD = společná ' +
      'katoda (elektricky/opticky identické, jen opačná polarita zapojení)',
    value:
      '16segmentový alfanumerický LED displej, červená (GaAsP), λp 655 nm, IV/seg typ. 2,5 mcd ' +
      '@IF=10 mA, VF typ. 3,4 V',
    notes:
      'Yellow Stone Corp "Single Digit LED Displays" katalogový datasheet — ⚠️ rozsáhlý katalog ' +
      'pokrývající 6 velikostí/tvarů pouzder (SD-43 až SD-48, výška znaku 1,00" nebo 1,20", ' +
      'jednomístné i více-pinové alfanumerické provedení) × 8 barevných/materiálových variant ' +
      '(GaAsP červená, GaP jasně červená, GaP zelená, GaAsP/GaP žlutá, GaAsP/GaP vysoce účinná ' +
      'červená/oranžová, GaAlAs SH super červená, GaAlAs DDH super červená) × 2 polarity ' +
      '(společná anoda/katoda) — do knihovny přidán jen konkrétní pojmenovaný pár BS-AA21RD/' +
      'BS-CA21RD z názvu souboru (pouzdro SD-43, GaAsP červená), ne celá kombinatorická matice. ' +
      'Funkčně podobný typ displeje jako AND-8010-B (samostatné záznamy, jiný výrobce) — 16 ' +
      'segmentů umožňuje zobrazení písmen i číslic, ne jen číslic jako u 7seg. displejů. VF typ. ' +
      '3,4/max 4,0 V @IF=10 mA. IV/segment typ. 2,5 mcd @IF=10 mA. λp 655 nm, Δλ 40 nm. Mezní ' +
      'hodnoty: PD 160 mW, IF (trvalý) max 40 mA, IFP (pulzní) max 200 mA (⚠️ nejvyšší proudová ' +
      'třída v celém katalogu — ostatní barevné varianty mají IF max 15–30 mA, IFP max 50–150 mA). ' +
      'Ostatní varianty stejného SD-43 pouzdra (BS-AA22RD až BS-AA2FRD/BS-CA22RD až BS-CA2FRD) ' +
      'pokrývají zelenou (568 nm), žlutou (585 nm), oranžovou/hi-eff červenou (635 nm) a dvě ' +
      'varianty super červené GaAlAs (660 nm, IV až 15 mcd/seg).',
    tags: 'dioda,led,displej,16segment,alfanumerický,yellow-stone,bs-aa21rd,červená,gaasp,sd-43',
  },
  {
    name: 'ELS-512UBWA',
    packageType:
      'THT 10pin DIP pouzdro, 0,56" (14,22 mm) výška znaku, rozteč vývodů 2,54 mm×4, šedé čelo ' +
      'displeje s bílými segmenty, společná anoda (piny 3 a 8)',
    value:
      '7segmentový LED displej (jednomístný), MODRÁ (GaN/SiC), λp typ. 428 nm, IV/segment typ. ' +
      '3,2 mcd @IF=10 mA, VF typ. 3,8 V',
    notes:
      'Everlight Electronics "ELS-512UBWA — 0.56" Single Digit Displays" (dok. CDDS-512-018, ' +
      'rev. 1) — ⚠️ modrá LED na bázi GaN/SiC (galium nitrid na karbidu křemíku), zcela odlišná ' +
      'polovodičová technologie a výrazně vyšší propustné napětí (VF typ. 3,8 V, max 4,5 V) než ' +
      'ostatní 7/16segmentové displeje v této knihovně na bázi GaAsP/GaP/GaAlAs (VF typ. 2,0–4,0 V) ' +
      '— typické pro modré/bílé LED, kde je potřeba vyšší energie fotonu (kratší vlnová délka) ' +
      'než u červené/žluté/zelené. Průmyslově standardní velikost (14,22 mm/0,56"), navrženo pro ' +
      'čitelnost ze vzdálenosti až 7 m, vhodné pro audio zařízení, přístrojové panely a číslicové ' +
      'digitální ukazatele. Mezní hodnoty: VR max 5 V, IF max 30 mA, IFP (peak, duty 1/10 @1 kHz) ' +
      'max 70 mA, PD max 140 mW, provozní teplota -40 až +85 °C, skladovací -40 až +100 °C, ' +
      'pájecí teplota 260±5 °C, ESD (HBM) 1000 V. VF typ. 3,8/max 4,5 V @IF=20 mA. IR max 100 µA ' +
      '@VR=5 V. IV/segment min 2,0/typ. 3,2 mcd @IF=10 mA; IV/desetinná tečka min 0,7/typ. ' +
      '1,0 mcd. λp typ. 428 nm, λd (dominantní) typ. 466 nm, Δλ typ. 65 nm @IF=20 mA. Kategorizováno ' +
      '(binováno) dle svítivosti. Piny: 1=NC, 2=katoda D, 3=společná anoda, 4=katoda C, ' +
      '5=katoda DP, 6=katoda B, 7=katoda A, 8=společná anoda, 9=katoda F, 10=katoda G.',
    tags: 'dioda,led,displej,7segment,modrá,gan,sic,everlight,els-512ubwa,jednomístný',
  },
  {
    name: 'BT-M511RD / BT-N511RD',
    packageType:
      'THT 12pin DIP pouzdro "TD-09" (0,56" výška znaku, 3místný displej), tělo 37,50×18,90 mm, ' +
      'rozteč vývodů 2,54 mm; BT-M511RD = společná anoda, BT-N511RD = společná katoda (piny D1/' +
      'D2/D3 vyvedeny odděleně pro multiplexní buzení, segmenty A-G+DP sdíleny mezi číslicemi)',
    value:
      '3místný 7segmentový LED displej (multiplexovaný), červená (GaAsP), λp 655 nm, IV/seg ' +
      'typ. 0,6 mcd @IF=10 mA, VF typ. 1,7 V',
    notes:
      'Yellow Stone Corp "Three Digit LED Displays" katalogový datasheet — ⚠️ rozsáhlý katalog ' +
      'pokrývající 2 typy pouzder (TD-09: multiplexované, sdílené segmenty A-G+DP mezi číslicemi, ' +
      'jen 12 pinů; TD-10: plně nezávislé, každá číslice má vlastní sadu segmentových pinů, 27+ ' +
      'pinů) × 7 barevných/materiálových variant (GaAsP červená, GaP jasně červená, GaP zelená, ' +
      'GaAsP/GaP žlutá, GaAsP/GaP hi-eff červená/oranžová, GaAlAs SH super červená, GaAlAs DH ' +
      'super červená) × 2 polarity (společná anoda/katoda) — do knihovny přidán jen konkrétní ' +
      'pojmenovaný pár BT-M511RD/BT-N511RD z názvu souboru (pouzdro TD-09, GaAsP červená). ' +
      'Multiplexované zapojení (TD-09): segmentové elektrody A-G+DP jsou společné pro všechny 3 ' +
      'číslice, každá číslice má samostatný vyvedený pin D1/D2/D3 pro postupné rozsvěcování ' +
      '(časový multiplex) — nižší počet pinů (12) než u plně statického TD-10 pouzdra (27+), ale ' +
      'vyžaduje řízení s obnovovací frekvencí (multiplex driver). VF typ. 1,7/max 2,0 V @IF=10 mA ' +
      '(⚠️ nižší napětí než u jednomístného BS-AA21RD/BS-CA21RD v této knihovně, přestože stejný ' +
      'materiál GaAsP a λp 655 nm — patrně jiná konstrukce čipu/přechodu). IV/segment typ. ' +
      '0,6 mcd @IF=10 mA. λp 655 nm, Δλ 40 nm. Mezní hodnoty: PD 80 mW, IF max 40 mA, IFP max ' +
      '200 mA. Ostatní varianty stejného TD-09 pouzdra (BT-M512RD až BT-M51DRD / BT-N512RD až ' +
      'BT-N51DRD) pokrývají zelenou (568 nm), žlutou (585 nm), oranžovou/hi-eff červenou (635 nm) ' +
      'a dvě varianty super červené GaAlAs (660 nm, IV až 7 mcd/seg).',
    tags: 'dioda,led,displej,7segment,3místný,multiplex,yellow-stone,bt-m511rd,červená,gaasp,td-09',
  },
  {
    name: 'ELT-511USOWA/S530-A3',
    packageType:
      'THT 12pin DIP pouzdro (0,56" výška znaku, 3 číslice), tělo 37,7×19,0 mm, rozteč vývodů ' +
      '2,54 mm×5, šedé čelo displeje s bílými segmenty, společná katoda; multiplexované zapojení ' +
      '(segmenty A-G+DP sdíleny, samostatné piny D1/D2/D3 pro jednotlivé číslice)',
    value:
      '3místný 7segmentový LED displej (multiplexovaný), načervenalá oranžová (AlGaInP), λp ' +
      '621 nm, IV/seg typ. 17,6 mcd @IF=10 mA, VF typ. 2,0 V',
    notes:
      'Everlight Electronics "ELT-511USOWA/S530-A3 — 0.56" Triple Digit Displays" (dok. ' +
      'CDDT-511-049, rev. 1, květen 2007) — konkrétní jeden díl (na rozdíl od rozsáhlého katalogu ' +
      'Yellow Stone BT-M511RD/BT-N511RD v této knihovně, samostatný záznam, se kterým sdílí ' +
      'stejnou aplikační kategorii — 0,56" 3místný multiplexovaný 7seg. displej pro audio ' +
      'zařízení, přístrojové panely a číslicové ukazatele) — ale zcela jiný výrobce, materiál ' +
      'čipu (AlGaInP místo GaAsP) a výrazně vyšší svítivost. Multiplexované zapojení: segmentové ' +
      'elektrody A-G+DP společné pro všechny 3 číslice, samostatné anody D1/D2/D3 (piny 12/9/8) ' +
      'pro postupné rozsvěcování. Mezní hodnoty: VR max 5 V, IF max 25 mA, provozní teplota -40 ' +
      'až +85 °C, skladovací -40 až +100 °C, pájecí teplota 260±5 °C/5 s, ESD (HBM) 2000 V, PD ' +
      'max 60 mW. VF typ. 2,0/max 2,4 V @IF=20 mA. IR max 100 µA @VR=5 V. IV/segment typ. ' +
      '4,0 mcd @IF=2 mA / 7,8 min-17,6 typ. mcd @IF=10 mA; IV/desetinná tečka typ. 1,0 mcd @IF=2 mA ' +
      '/ min 2,0-typ. 4,0 mcd @IF=10 mA. λp typ. 621 nm, λd (dominantní) typ. 615 nm, Δλ typ. ' +
      '18 nm @IF=20 mA — bílé segmenty na šedém čele pouzdra pro dobrý kontrast na jasném ' +
      'okolním světle, čitelnost do 7 m. Balení 13 ks/tuba, 54 tub/box.',
    tags: 'dioda,led,displej,7segment,3místný,multiplex,everlight,elt-511usowa,oranžová,algainp',
  },
  {
    name: 'ELS-2326SYGWA/S530-E2',
    packageType:
      'THT 10pin DIP pouzdro, velký formát 2,3" (57,0 mm) výška znaku, tělo 47,7×69,7 mm, ' +
      'rozteč vývodů 2,54 mm×4, šedé čelo displeje s bílými segmenty, společná anoda (piny 1 a 5)',
    value:
      'Jednomístný 7segmentový LED displej, VELKÝ formát (2,3"), brilantní žlutozelená (AlGaInP), ' +
      'λp 575 nm, IV/seg typ. 12,5 mcd @IF=10 mA, VF/seg typ. 8,0 V (⚠️ víceřetězcový segment)',
    notes:
      'Everlight Electronics "ELS-2326SYGWA/S530-E2 — 2.3" Single Digit Displays" (dok. ' +
      'CDDS-232-032, rev. 1, duben 2007) — velkoformátový displej (2,3"/57 mm, čitelný do 7 m), ' +
      'výrazně větší než ostatní jednomístné displeje v této knihovně (ELS-512UBWA 0,56", ' +
      'BS-AA21RD 1,00"). ⚠️ Každý segment je vnitřně tvořen TŘEMI LED čipy zapojenými sériově ' +
      '(viz schéma zapojení — 3 řady diodových symbolů na segment), proto neobvykle vysoké ' +
      'propustné napětí na segment (VF typ. 8,0 V, cca 3× vyšší než u jednočipových segmentů ' +
      'malých displejů) — nutno zohlednit při návrhu budicího/proudově omezovacího obvodu. Mezní ' +
      'hodnoty: VR max 5 V, IF max 25 mA, provozní teplota -40 až +85 °C, skladovací -40 až ' +
      '+100 °C, pájecí teplota 260±5 °C/5 s, ESD (HBM) 2000 V, PD max 60 mW. VF/segment typ. ' +
      '8,0/max 9,6 V @IF=20 mA; VF/desetinná tečka typ. 4,0/max 4,8 V (odpovídá cca poloviční ' +
      'sériové kombinaci vůči plnému segmentu). IR max 100 µA @VR=5 V. IV/segment typ. 2,5 mcd ' +
      '@IF=2 mA / min 5,6-typ. 12,5 mcd @IF=10 mA; IV/desetinná tečka typ. 0,7 mcd @IF=2 mA / min ' +
      '1,4-typ. 3,0 mcd @IF=10 mA. λp typ. 575 nm, λd (dominantní) typ. 573 nm, Δλ typ. 20 nm ' +
      '@IF=20 mA. Bílé segmenty na šedém čele pouzdra pro dobrý kontrast na jasném okolním ' +
      'světle. Určeno pro audio zařízení, přístrojové panely, digitální ukazatele.',
    tags: 'dioda,led,displej,7segment,jednomístný,velký,žlutozelená,everlight,els-2326sygwa,algainp',
  },
  {
    name: 'TIL302',
    packageType:
      '14vývodové THT pouzdro, červený solid-state 7segmentový displej, výška znaku 6,9 mm ' +
      '(0,270"), montovatelný na roztečích 11,43 mm (0,450") pro vícemístné sestavy; interní ' +
      'zapojení redukuje počet pinů z 16 na 14 slučováním segmentů A+B (pin 14) a C+D (pin 9), ' +
      'zatímco E/F/G/DP jsou vyvedeny společně na pin 3 (piny 4, 5, 12 nevyužity)',
    value:
      '7segmentový LED displej (číslicový), červená, λp 660 nm, IV/segment typ. 275 µcd ' +
      '@IF=20 mA, VF typ. 3,4 V',
    notes:
      'Texas Instruments "TIL302, TIL303, TIL304 — Numeric Displays" (dok. SOES010A, duben ' +
      '1971, revidováno prosinec 1993) — vintage červený solid-state 7segmentový displej, ' +
      'kompatibilní s většinou TTL/DTL obvodů. Zpracována celá řada 3 dílů z jednoho datasheetu ' +
      '(TIL302, TIL303 — samostatné záznamy, standardní 7segmentové číslicové displeje lišící se ' +
      'jen vnitřním propojením segmentů/pozicí desetinné tečky; TIL304 — samostatný záznam, ' +
      'speciální znaménkový/přetokový "±1." displej). TIL302: interní zapojení sdružuje segmenty ' +
      'A+B a C+D do společných párů (viz packageType) pro úsporu pinů, zatímco E, F, G a desetinná ' +
      'tečka (vlevo) jsou spojeny na jeden společný pin — typicky pro aplikace, kde tyto segmenty ' +
      'svítí vždy současně (např. zobrazení číslice "8" nebo řízení přes dekodér, který tyto ' +
      'kombinace segmentů stejně sdružuje). Elektrické parametry (společné pro segmenty všech tří ' +
      'dílů): reverzní napětí 6 V/segment, 3 V/desetinná tečka. Špičkový propustný proud 200 mA ' +
      '(PRR≥60 Hz, duty≤10 %). Trvalý propustný proud 30 mA/segment nebo tečku, celkem max 240 mA ' +
      '(TIL302/303). Provozní teplota 0 až +70 °C, skladovací -25 až +85 °C. Segment: IV min ' +
      '100/typ. 275 µcd @IF=20 mA, λp typ. 660 nm, Δλ typ. 20 nm, VF min 3/typ. 3,4/max 3,8 V, ' +
      'αVF typ. -2,7 mV/°C, IR max 100 µA @VR=6 V, C typ. 85 pF @VR=0/1 MHz. Desetinná tečka: IV ' +
      'min 40/typ. 110 µcd, VF min 1,5/typ. 1,65/max 2 V, αVF typ. -1,4 mV/°C, IR max 100 µA ' +
      '@VR=3 V, C typ. 120 pF.',
    tags: 'dioda,led,displej,7segment,texas-instruments,til302,červená,vintage',
  },
  {
    name: 'TIL303',
    packageType:
      '14vývodové THT pouzdro, červený solid-state 7segmentový displej, výška znaku 6,9 mm ' +
      '(0,270"), montovatelný na roztečích 11,43 mm (0,450"); jiné vnitřní sloučení segmentů než ' +
      'TIL302 — A+F (pin 2) a B+C+G (pin 13) tvoří společné páry/trojici, D/E/desetinná tečka ' +
      '(vpravo) sdruženy na pin 7 (piny 5, 11, 12 nevyužity)',
    value:
      '7segmentový LED displej (číslicový), červená, λp 660 nm, IV/segment typ. 275 µcd ' +
      '@IF=20 mA, VF typ. 3,4 V — odlišné vnitřní zapojení segmentů než TIL302',
    notes:
      'Texas Instruments "TIL302, TIL303, TIL304" (dok. SOES010A, 1971/rev. 1993) — součást ' +
      'stejné řady jako TIL302 a TIL304 (samostatné záznamy) — viz záznam TIL302 pro plný popis ' +
      'shodných elektrických parametrů a mezních hodnot (VF/IV/λp/kapacita segmentu i tečky, ' +
      'proudová omezení, teploty). TIL303 se od TIL302 liší pouze vnitřním sloučením segmentů do ' +
      'společných pinů (viz packageType) — jiná kombinace segmentů svítí společně, a poloha ' +
      'desetinné tečky je na opačné (pravé) straně znaku oproti TIL302 (levá tečka). Fyzicky ' +
      'shodné pouzdro/rozměry jako TIL302, mechanicky zaměnitelné, ale vyžaduje odlišné řídicí ' +
      'zapojení kvůli jinému sdružení segmentových pinů.',
    tags: 'dioda,led,displej,7segment,texas-instruments,til303,červená,vintage',
  },
  {
    name: 'TIL304',
    packageType:
      '14vývodové THT pouzdro, červený solid-state displej, výška znaku 6,9 mm (0,270"); ' +
      'NEJDE o plný 7segmentový znak — zobrazuje jen tvar "±1." (znaménko/přetokový symbol + ' +
      'desetinná tečka), piny 2, 3, 4, 5, 6, 12, 13 nevyužity (jen 7 aktivních pinů)',
    value:
      'Znaménkový/přetokový LED displej ("±1." symbol pro kalkulačky/číselníky), červená, ' +
      'λp 660 nm, VF typ. 3,4 V (segmenty A/B/C/D) — max. celkový proud 150 mA (nižší než ' +
      'TIL302/303)',
    notes:
      'Texas Instruments "TIL302, TIL303, TIL304" (dok. SOES010A, 1971/rev. 1993) — ⚠️ ' +
      'ZÁSADNĚ odlišný účel od TIL302/TIL303 (samostatné záznamy, plné 7segmentové číslicové ' +
      'displeje) — TIL304 zobrazuje pouze speciální kombinaci tvarů "+", "−", "1" a desetinnou ' +
      'tečku (typicky značeno segmenty A, B, C, D v datasheetu, ale jde o jinak tvarované ' +
      'segmenty než u běžné "8" v 7seg. displeji) — používáno jako znaménkový (sign) a přetokový ' +
      '(overflow) indikátor v kalkulačkách a číselnících vedle hlavních číslicových pozic ' +
      '(TIL302/TIL303 nebo obdobných), ne jako samostatná číslice. Elektrické parametry segmentu ' +
      'i desetinné tečky shodné s TIL302/TIL303 (viz záznam TIL302 pro plné hodnoty VF/IV/λp/ ' +
      'kapacita/αVF), pouze celkový trvalý propustný proud je nižší — max 150 mA (vs. 240 mA u ' +
      'TIL302/303), odpovídající menšímu počtu aktivních segmentů/pinů. Reverzní napětí 6 V/' +
      'segment, 3 V/tečka, špičkový propustný proud 200 mA/segment (PRR≥60 Hz, duty≤10 %), ' +
      'provozní teplota 0 až +70 °C, skladovací -25 až +85 °C. Piny: 1=C+D, 7=D, 8=C, 9=DP, ' +
      '10=B, 11=A, 14=A+B+DP.',
    tags: 'dioda,led,displej,znaménkový,přetokový,texas-instruments,til304,červená,vintage',
  },
  {
    name: 'TYN50W-1600T / TYN80W-1600T',
    packageType: 'TO-247, 3 vývody (anoda/katoda/gate), planárně pasivované',
    schematicImage: 'TYN50W-1600T.jpg',
    value:
      'Tyristor (SCR), vysokonapěťový 1600 V — TYN50W: IT(AV) 50 A, IT(RMS) 79 A; TYN80W: ' +
      'IT(AV) 80 A, IT(RMS) 126 A; VDRM 1600 V, IGT max 80 mA, TJ(max) 150 °C',
    notes:
      'WeEn Semiconductors "Product Selection Guide" (PSG2020, vydáno červenec 2020, dok. č. ' +
      '20200701), str. 12, "WeEn High Voltage 1600V SCRs — Planar Passivated" — ⚠️ SOUHRNNÝ ' +
      'ZÁZNAM ZE VÝBĚROVÉHO KATALOGU (product selection guide), ne z plného datasheetu — ' +
      'katalogový list uvádí jen klíčové parametry, nikoli kompletní elektrické křivky. Dvojice ' +
      'nejvýkonnějších tyristorů z celé WeEn nabídky SCR (katalog dále uvádí desítky menších ' +
      'typů 0,8–126 A/200–1600 V, zde neevidovány jednotlivě). Určeno pro UPS (uninterruptible ' +
      'power supply), solid-state relé (SSR), nabíječky baterií, řízení AC/DC motorů, řízení ' +
      'osvětlení a teploty — typicky pro omezení špičkového proudu při zapnutí napájení (inrush ' +
      'current limiting), což umožňuje nahradit mechanické relé. ITSM (max. nárazový proud, ' +
      '10ms): TYN50W 650 A, TYN80W 850 A. dIT/dt (kritická strmost nárůstu proudu) 150 A/µs ' +
      '(oba typy). dVD/dt (kritická strmost nárůstu blokovacího napětí, @150°C): TYN50W ' +
      '1500 V/µs, TYN80W 1000 V/µs. Vlastnosti: velmi vysoká blokovací schopnost napětí (do ' +
      '1600 V), vysoká pracovní teplota přechodu (TJmax=150°C), vysoká odolnost proti proudovým ' +
      'rázům, planárně pasivováno pro napěťovou odolnost a spolehlivost, vysoká odolnost vůči ' +
      'teplotnímu cyklování, nízký úbytek napětí v propustném směru.',
    tags: 'tyristor,scr,silicon-controlled-rectifier,ween,tyn50w,tyn80w,1600v,to-247,ups,ssr',
  },
  {
    name: 'BTA330 (30A Hi-Com triak)',
    schematicImage: 'BTA330.jpg',
    packageType:
      'TO220 (BTA330-800BT), TO220FP izolované (BTA330X-800BT), IITO220 vnitřně izolované ' +
      '(BTA330Y-800BT/CT), D²PAK SMD (BTA330B-800BT/CT)',
    value:
      'Triak (TRIAC), 3Q Hi-Com technologie, 30 A, VDRM 800 V — BT (přepínací/standardní gate) ' +
      'řada: IGT max 50 mA; CT řada: IGT max 35 mA; oba ITSM 270 A@20ms, TJ(max) 150 °C',
    notes:
      'WeEn Semiconductors "Product Selection Guide" (PSG2020, červenec 2020, dok. 20200701), ' +
      'str. 13, "WeEn 30A Hi-Com™ Triacs" — ⚠️ SOUHRNNÝ ZÁZNAM ZE VÝBĚROVÉHO KATALOGU (viz ' +
      'poznámka u "TYN50W-1600T / TYN80W-1600T" pro kontext) — vlajkový (nejvyšší proudový) ' +
      'model z širší řady 3Q Hi-Com triaků BTAxxx v katalogu (0,8–45 A, zde neevidovány ' +
      'jednotlivě, viz i BTA425/BTA440/BTA445 zmíněné jako příbuzné vysokoproudé typy). Určeno ' +
      'pro topné regulace, výkonové řízení motorů, výkonové řízení AC (např. stmívače, ohřevné ' +
      'prvky kávovarů — BTA316Y-800CT — a praček — BTA416Y-800C — dle aplikační části katalogu), ' +
      'aplikace vystavené vysoké teplotě (TJmax=150°C). dIT/dt 100 A/µs (oba typy). Vnitřně ' +
      'izolované pouzdro IITO220 poskytuje vysokou napěťovou izolaci (2500 V) a vyrovnání ' +
      'tepelné disipace; D²PAK (SMD) umožňuje snadnou automatizovanou montáž. Vysoká komutační ' +
      'schopnost s maximální odolností proti falešnému sepnutí, vysoký surge proud při nízkém ' +
      'úbytku napětí v sepnutém stavu (VT), vysoká odolnost vůči teplotnímu cyklování, pouzdro ' +
      'RoHS.',
    tags: 'triak,triac,hi-com,ween,bta330,30a,800v,to220,d2pak,iito220',
  },
  {
    name: 'CL05M6F',
    packageType: 'SOD-123FL (SMD), 2 vývody (anoda/katoda), pásková balení 3000ks/7"',
    schematicImage: 'CL05M6F.jpg',
    value:
      'Proudově omezující dioda (Current Limiting Diode / CLD, konstantní proudový zdroj), ' +
      'IP(nom) 5,6 mA, VAK max 190 V, Ptot 0,7 W (1,2 W při větší chladicí plošce)',
    notes:
      'Diotec Semiconductor "CL05M6F — SMD Current Limiting Diodes" (dok. verze 2019-10-18, ' +
      '"Preliminary/Vorläufig") — ⚠️ NOVÝ TYP součástky v této knihovně: proudově omezující ' +
      'dioda (též "constant current diode/regulator diode") — dvouvývodová polovodičová ' +
      'součástka, která (na rozdíl od klasické usměrňovací/Zenerovy/Schottky diody v této ' +
      'knihovně) v propustném směru po dosažení prahového napětí VT udržuje téměř konstantní ' +
      'proud IP nezávisle na přiloženém napětí (až do VAK) — funguje jako jednoduchý ' +
      'dvouvývodový zdroj konstantního proudu bez potřeby aktivního obvodu. Typické použití: ' +
      'konstantní proudové zdroje pro jednoduché senzorové obvody, malovýkonové LED driverpy a ' +
      'nabíječky akumulátorů (viz aplikační schéma v datasheetu — můstkový usměrňovač + CLD jako ' +
      'proudový zdroj pro sériové LED). Lze zapojit paralelně pro vyšší celkový proud, nebo ' +
      'kompenzovat teplotní drift paralelním rezistorem (dle aplikačních poznámek datasheetu). ' +
      'IPmin 4,5 mA / IPnom 5,6 mA / IPmax 6,7 mA @VT=20V (impulzně, 20ms). IP(DC) (typický ' +
      'ustálený proud) 5,4 mA @VT=10V / 4,8 mA @VT=50V. Teplotní koeficient IP αIP=-15×10⁻⁴/°C ' +
      '@VT=10V. Mezní hodnoty: Ptot 0,7 W (25mm² Cu plošky) / 1,2 W (50×50mm² Cu plošky), VAK ' +
      '(max. pracovní napětí, impulzně 20ms) 190 V, TJ a Tstg -50 až +150 °C. Limitní napětí VL ' +
      '(@IL=80%·IPmin) 2 V. Závěrné napětí VR (@IR=1mA) 0,5 V. Kapacita přechodu CT 5 pF @VR=0V. ' +
      'Tepelný odpor přechod-okolí RthA 180 K/W (25mm² Cu plošky). Pouzdro UL94V-0, pájecí ' +
      'podmínky 260°C/10s, MSL=1, hmotnost ~0,01 g. Shoda s RoHS, REACH, Conflict Minerals.',
    tags: 'dioda,proudově-omezující,current-limiting-diode,constant-current,diotec,cl05m6f,sod-123fl,led-driver',
  },
  {
    name: 'DSEI 2x 61-04C',
    packageType:
      'výkonový modul miniBLOC (ISOTOP kompatibilní, SOT-227B), 2 elektricky ZCELA NEZÁVISLÉ ' +
      '(nepropojené) diody — každá se svými vlastními 2 vývody, dohromady 4 šroubové M4 ' +
      'terminály (ověřeno ze schématu v datasheetu — žádné společné propojení vývodů mezi diodami, ' +
      'na rozdíl od dřívější verze této poznámky, která mylně uváděla "společnou katodu"), ' +
      'izolační napětí pouzdra 2500 V~, hmotnost 30 g, šroubovací montáž (moment 1,5 Nm)',
    schematicImage: 'DSEI2X61.jpg',
    value:
      'Rychlá epitaxní dioda (FRED — Fast Recovery Epitaxial Diode), 2× v jednom pouzdře, VRRM ' +
      '400 V, IFAVM 2×60 A, doba zotavení trr typ. 35 ns (velmi rychlá/měkká charakteristika)',
    notes:
      'IXYS "DSEI 2x 61 — Fast Recovery Epitaxial Diode (FRED)" (katalogový list, © 2000 IXYS). ' +
      '⚠️ NOVÝ TYP součástky v této knihovně: první výkonový diodový MODUL (dvojice diod v ' +
      'šroubovacím kovovém pouzdře pro montáž na chladič) — na rozdíl od THT/SMD diskrétních ' +
      'diod v této knihovně jde o vysokoproudou/vysokorychlostní součástku pro výkonovou ' +
      'elektroniku. Planárně pasivované čipy, velmi krátká doba zotavení a měkký (soft) ' +
      'zotavovací charakter pro nízké napěťové špičky a nízký rušivý hluk při spínání. Použití: ' +
      'antiparalelní dioda pro vysokofrekvenční spínací prvky (IGBT/MOSFET), anti-saturační ' +
      'dioda, snubber dioda, zpětná (freewheeling) dioda v měničích a řízení motorů, ' +
      'usměrňovače ve spínaných zdrojích (SMPS), indukční ohřev a tavení, UPS, ultrazvukové ' +
      'čističky a svářečky. Nejnižší napěťová varianta dvojice DSEI 2x 61-04C/-06C (VRRM 400 V, ' +
      'VRSM 440 V; viz sourozenecký záznam "DSEI 2x 61-06C" pro 600V variantu). IFRMS 100 A ' +
      '(TVJ=TVJM). IFAVM 60 A/diodu (TC=70°C, obdélníkový průběh, d=0,5, zahrnuje ztráty ' +
      'zpětného blokování při TVJM/VR=0,8·VRRM). IFRM 800 A (impulzně, tp<10µs). IFSM (rázový ' +
      'proud, sinusová půlvlna): 550 A (10ms/50Hz) / 600 A (8,3ms/60Hz) @TVJ=45°C, nebo 480 A / ' +
      '520 A @TVJ=150°C. I²t: 1510 A²s (10ms/50Hz) až 1120 A²s (8,3ms/60Hz, TVJ=150°C). VF ' +
      '(@IF=60A) max 1,5V @TVJ=150°C / max 1,8V @TVJ=25°C. VT0 (pro výpočet ztrát) 1,13V, ' +
      'dynamický odpor rT 4,7mΩ @TVJ=TVJM. Závěrný proud IR: typ 200µA @VR=VRRM/25°C, max 14mA ' +
      '@VR=0,8·VRRM/125°C. Doba zotavení trr typ. 35ns/max 50ns @IF=1A/-di/dt=200A/µs/VR=30V/ ' +
      '25°C. Špičkový zpětný proud IRM typ. 19A/max 21A @VR=350V/IF=60A/-diF/dt=480A/µs. Tepelný ' +
      'odpor přechod-pouzdro RthJC 0,7 K/W, pouzdro-chladič RthCK 0,05 K/W. Ptot 180W @TC=25°C. ' +
      'TVJ -40 až +150°C (TVJM 150°C), Tstg -40 až +150°C. Certifikace UL (E72873). Data dle ' +
      'IEC 60747.',
    tags: 'dioda,fred,fast-recovery,epitaxní,výkonový-modul,ixys,dsei-2x61,minibloc,sot-227,400v,duální',
  },
  {
    name: 'DSEI 2x 61-06C',
    packageType: 'shodné s DSEI 2x 61-04C — viz jeho záznam pro plné mechanické specifikace',
    schematicImage: 'DSEI2X61.jpg',
    value:
      'Rychlá epitaxní dioda (FRED), 2× v jednom pouzdře, VRRM 600 V, IFAVM 2×60 A, doba ' +
      'zotavení trr typ. 35 ns',
    notes:
      'IXYS "DSEI 2x 61" — součást dvojice DSEI 2x 61-04C/-06C, viz záznam "DSEI 2x 61-04C" v ' +
      'této knihovně pro plné společné elektrické/mechanické specifikace. Vyšší napěťová ' +
      'varianta: VRRM 600 V, VRSM 640 V (ostatní parametry — proudové zatížitelnosti, doba ' +
      'zotavení, tepelné odpory — shodné s -04C variantou dle katalogového listu).',
    tags: 'dioda,fred,fast-recovery,epitaxní,výkonový-modul,ixys,dsei-2x61,minibloc,sot-227,600v,duální',
  },
  {
    name: 'LL4148',
    packageType:
      'SMD ~SOD-80C (Glass MiniMELF), válcová skleněná pouzdra, Ø1,45mm, délka 3,5±0,1mm, ' +
      'pásková balení 2500ks/7", hmotnost ~0,04g',
    schematicImage: 'LL4148.jpg',
    value:
      'Spínací (small signal) dioda, IFAV 150 mA, VRRM 100 V, VF<1,0V @IF=10mA, doba zotavení ' +
      'trr<4ns',
    notes:
      'Diotec Semiconductor "LL4148, LL4150, LL4151, LL4448 — SMD Small Signal Switching ' +
      'Diodes" (verze 2022-02-01). SMD (MiniMELF) ekvivalent THT diody 1N4148 (DO-35) již ' +
      'evidované v této knihovně — dle výrobce elektricky totožná dioda, jen jiné pouzdro ' +
      '(výrobce uvádí LL4148 = 1N4148 v DO-35, Q-MiniMELF = LS4148, Q-MicroMELF = MCL4148, ' +
      'SOD-123F = 1N4148W, SOD-323F = 1N4148WS — celá rodina alternativních pouzder stejného ' +
      'čipu). Typické použití: zpracování signálu, vysokorychlostní spínání. Dostupné i ' +
      'varianty -Q (AEC-Q101 compliant) / -AQ (v procesu AEC-Q101 kvalifikace). Max. periodický ' +
      'špičkový proud IFRM 500mA, nárazový proud IFSM 2000mA (tp=1µs), max. ztrátový výkon Ptot ' +
      '500mW. Závěrný proud IR<25nA @VR=20V/25°C (<50µA @150°C), <5µA @VR=75V/25°C. Kapacita ' +
      'přechodu CT typ. 4pF @VR=0V/1MHz. Tepelný odpor přechod-okolí RthA typ. 300K/W. TJ a ' +
      'Tstg -50 až +175°C. Pájecí podmínky 260°C/10s, MSL=1. Shoda s RoHS (výjimka 7c), REACH, ' +
      'Conflict Minerals. ⚠️ Druhý zdroj (second source): Vishay Semiconductors nabízí ' +
      'elektricky/mechanicky shodný díl pod stejným označením "LL4148" (dok. 85557, rev. 2.1, ' +
      '2020) — shodné pouzdro MiniMELF/SOD-80, VRRM 100V, IFSM 2A, IFRM 500mA, IF(AV) 150mA, ' +
      'Ptot 500mW, RthJA 300K/W, Tstg -65 až +175°C; VF max 1,0V @IF=50mA (u Diotec verze ' +
      'testováno @10mA); trr max 8ns @IR=1mA nebo max 4ns @iR=0,1×IR/VR=6V/RL=100Ω (podrobnější ' +
      'dvě testovací podmínky než u Diotec). Objednací kódy Vishay: LL4148-GS08 (7", 2,5K), ' +
      'LL4148-GS18 (13", 10K).',
    tags: 'dioda,spínací,signálová,smd,minimelf,sod-80c,diotec,vishay,ll4148,1n4148-ekvivalent',
  },
  {
    name: 'LL4150',
    packageType: 'shodné s LL4148 (SOD-80C MiniMELF) — viz jeho záznam pro plné mechanické specifikace',
    schematicImage: 'LL4148.jpg',
    value: 'Spínací dioda, IFAV 300 mA, VRRM 50 V, VF<1,2V @IF=100mA',
    notes:
      'Diotec "LL4148, LL4150, LL4151, LL4448" — součást rodiny, viz záznam "LL4148" v této ' +
      'knihovně pro plné společné mechanické specifikace a kontext. Vyšší proudová (300mA) a ' +
      'nižší napěťová (50V) varianta rodiny — IFRM 600mA, IFSM 4000mA, IR<100nA @20V/25°C ' +
      '(<100µA @150°C).',
    tags: 'dioda,spínací,signálová,smd,minimelf,sod-80c,diotec,ll4150',
  },
  {
    name: 'LL4151',
    packageType: 'shodné s LL4148 (SOD-80C MiniMELF) — viz jeho záznam pro plné mechanické specifikace',
    schematicImage: 'LL4148.jpg',
    value: 'Spínací dioda, IFAV 200 mA, VRRM 75 V, VF<1,0V @IF=50mA',
    notes:
      'Diotec "LL4148, LL4150, LL4151, LL4448" — součást rodiny, viz záznam "LL4148" v této ' +
      'knihovně pro plné společné mechanické specifikace a kontext. IFRM 500mA, IFSM 2000mA, ' +
      'IR<50nA @20V/25°C (<50µA @150°C).',
    tags: 'dioda,spínací,signálová,smd,minimelf,sod-80c,diotec,ll4151',
  },
  {
    name: 'LL4448',
    packageType: 'shodné s LL4148 (SOD-80C MiniMELF) — viz jeho záznam pro plné mechanické specifikace',
    schematicImage: 'LL4148.jpg',
    value: 'Spínací dioda, IFAV 150 mA, VRRM 100 V, VF 0,62–0,72V @IF=5mA',
    notes:
      'Diotec "LL4148, LL4150, LL4151, LL4448" — součást rodiny, viz záznam "LL4148" v této ' +
      'knihovně pro plné společné mechanické specifikace a kontext. SMD ekvivalent 1N4448 ' +
      '(DO-35) — přesnější (těsnější) definice propustného napětí VF (0,62-0,72V @5mA) než ' +
      'LL4148, jinak shodné mezní hodnoty (IFRM 500mA, IFSM 2000mA), IR<25nA @20V/25°C ' +
      '(<50µA @150°C), <5µA @75V/25°C. ⚠️ Druhý zdroj: Vishay Semiconductors "LL4148, LL4448" ' +
      '(dok. 85557, rev. 2.1, 2020) — shodné pouzdro/mezní hodnoty jako Diotec verze, VF ' +
      'testováno navíc @100mA (max 1,0V, přesněji 0,93-1,0V), objednací kódy LL4448-GS08/-GS18.',
    tags: 'dioda,spínací,signálová,smd,minimelf,sod-80c,diotec,vishay,ll4448,1n4448-ekvivalent',
  },
  {
    name: 'CD4148W',
    packageType:
      'SMD čipové pouzdro 1206 (3,40×1,70mm), epoxidová pryskyřice UL94V-0, pájecí terminály ' +
      'dle MIL-STD-202E metoda 208, hmotnost ~10mg, montáž v libovolné poloze',
    schematicImage: 'CD4148W.jpg',
    value:
      'Spínací (switching) dioda, VRRM 100 V, IF 150 mA, IFSM 500 mA, VF max 1,0V, trr max 4ns',
    notes:
      'DC Components Co., Ltd. "CD4148W, CD4148WS, CD4148WT — Technical Specifications of ' +
      'Surface Mount Switching Diode, 100V/0,3A". Třetí rodina SMD ekvivalentů 1N4148 v této ' +
      'knihovně vedle Diotec LL4148 (viz jeho záznam) — na rozdíl od cylindrického MiniMELF ' +
      'pouzdra LL4148 jde o PLOCHÉ OBDÉLNÍKOVÉ SMD ČIPOVÉ pouzdro (podobné SMD ' +
      'rezistoru/kondenzátoru) ve třech standardních velikostech 1206/0805/0603 (viz ' +
      'sourozenecké záznamy "CD4148WS"/"CD4148WT" pro menší velikosti). Tento záznam (CD4148W, ' +
      'pouzdro 1206C) je nejvyšší proudová/tepelná třída rodiny. VR (max. trvalé závěrné ' +
      'napětí) 75V, VRM (max. nepovtorné špičkové závěrné napětí) 100V. IF max 150mA @25°C ' +
      '(single phase, half-wave, 60Hz, odporová/indukční zátěž — pro kapacitní zátěž derating ' +
      '20%). IFSM (rázový proud, tp=1µs) 500mA. Ptot max 500mW @25°C. VF max 1,0V. IR max 25nA ' +
      '@VR=20V / max 5,0µA @VR=75V. trr max 4,0ns (IF=IR=10mA, RL=100Ω, měřeno při IR=1mA). CJ ' +
      'typ. 4,0pF @1MHz/VR=0. Tepelný odpor přechod-okolí RθJA 450K/W (pro pouzdro 1206C — ' +
      'menší pouzdra mají vyšší RθJA 650K/W, viz sourozenecké záznamy). TJ a Tstg -65 až ' +
      '+175°C.',
    tags: 'dioda,spínací,signálová,smd,chip,1206,dc-components,cd4148w,1n4148-ekvivalent',
  },
  {
    name: 'CD4148WS',
    packageType:
      'SMD čipové pouzdro 0805 (2,20×1,45mm), epoxidová pryskyřice UL94V-0, hmotnost ~6mg',
    schematicImage: 'CD4148W.jpg',
    value:
      'Spínací dioda, VRRM 100 V, IF 150 mA, IFSM 500 mA, VF max 1,0V, trr max 4ns',
    notes:
      'DC Components "CD4148W, CD4148WS, CD4148WT" — součást rodiny, viz záznam "CD4148W" v ' +
      'této knihovně pro plné společné elektrické specifikace a kontext. Menší pouzdro 0805C, ' +
      'jinak elektricky shodné parametry jako CD4148W kromě tepelného odporu: RθJA 650K/W ' +
      '(vyšší než u CD4148W kvůli menší ploše pouzdra).',
    tags: 'dioda,spínací,signálová,smd,chip,0805,dc-components,cd4148ws,1n4148-ekvivalent',
  },
  {
    name: 'CD4148WT',
    packageType:
      'SMD čipové pouzdro 0603 (1,65×0,90mm), epoxidová pryskyřice UL94V-0, hmotnost ~4mg',
    schematicImage: 'CD4148W.jpg',
    value:
      'Spínací dioda, VRRM 100 V, IF 150 mA, IFSM 500 mA, VF max 1,0V, trr max 4ns',
    notes:
      'DC Components "CD4148W, CD4148WS, CD4148WT" — součást rodiny, viz záznam "CD4148W" v ' +
      'této knihovně pro plné společné elektrické specifikace a kontext. Nejmenší pouzdro ' +
      'rodiny 0603C, jinak elektricky shodné parametry jako CD4148W, RθJA 650K/W (shodné s ' +
      'CD4148WS).',
    tags: 'dioda,spínací,signálová,smd,chip,0603,dc-components,cd4148wt,1n4148-ekvivalent',
  },
  {
    name: 'M1',
    packageType:
      'SMD ~SMA / ~DO-214AC, rozměry cca 5,3×2,7×2,2mm, pásková balení 7500ks/13", hmotnost ' +
      '~0,07g',
    schematicImage: 'M1.jpg',
    value:
      'Usměrňovací dioda se standardní dobou zotavení, VRRM 50 V, IFAV 1 A, VF<1,1V @IF=1A, ' +
      'IFSM 27/30 A',
    notes:
      'Diotec Semiconductor "M1...M7 — Standard Recovery SMD Rectifier Diodes" (verze ' +
      '2016-12-19). ⚠️ NOVÁ ŘADA v této knihovně: budget (levnější) verze řady S1A...S1M ' +
      '(sama S1A-S1M v knihovně dosud neevidována) — stejné pouzdro SMA/DO-214AC jako běžné ' +
      'SMD usměrňovací diody, ale se standardní (pomalejší, trr~1500ns) dobou zotavení místo ' +
      'rychlé/ultra rychlé. Určeno pro síťové usměrnění 50/60Hz, napájecí zdroje, ochranu proti ' +
      'přepólování. Nejnižší napěťová varianta řady M1-M7 (VRRM 50-1000V, viz sourozenecké ' +
      'záznamy M2-M7 pro plné specifikace VRRM). VRSM (nárazové špičkové závěrné napětí) shodné ' +
      's VRRM. Max. trvalý usměrněný proud IFAV 1A @TT=75°C (odporová zátěž, jednocestné ' +
      'zapojení). Periodický špičkový propustný proud IFRM 5A @f>15Hz. Rázový proud IFSM 27A ' +
      '(půlvlna 50Hz/10ms) / 30A (60Hz/8,3ms). Grenzlastintegral i²t (t<10ms) 3,6 A²s. VF<1,1V ' +
      '@IF=1A/TJ=25°C. Závěrný proud IR<5µA @VR=VRRM/25°C (<50µA @100°C). Kapacita přechodu Cj ' +
      'typ. 12pF @VR=4V. Doba zotavení trr typ. 1500ns (IF=0,5A→IR=1A→IR=0,25A) — výrazně delší ' +
      'než u rychlých/ultra rychlých usměrňovacích diod v této knihovně. Tepelný odpor ' +
      'přechod-okolí RthA<75K/W (25mm² Cu plošky), přechod-vývod RthT<40K/W. TJ a Tstg -50 až ' +
      '+150°C. Pouzdro UL94V-0, pájecí podmínky 260°C/10s, MSL=1. Shoda s RoHS, REACH, ' +
      'Conflict Minerals.',
    tags: 'dioda,usměrňovací,standardní-zotavení,smd,sma,do-214ac,diotec,m1,50v,síťové-usměrnění',
  },
  {
    name: 'M2',
    packageType: 'shodné s M1 (SMA/DO-214AC) — viz jeho záznam pro plné mechanické specifikace',
    schematicImage: 'M1.jpg',
    value: 'Usměrňovací dioda se standardní dobou zotavení, VRRM 100 V, IFAV 1 A',
    notes:
      'Diotec "M1...M7" — součást řady M1-M7, viz záznam "M1" v této knihovně pro plné ' +
      'společné elektrické/mechanické specifikace. VRSM 100V.',
    tags: 'dioda,usměrňovací,standardní-zotavení,smd,sma,do-214ac,diotec,m2,100v,síťové-usměrnění',
  },
  {
    name: 'M3',
    packageType: 'shodné s M1 (SMA/DO-214AC) — viz jeho záznam pro plné mechanické specifikace',
    schematicImage: 'M1.jpg',
    value: 'Usměrňovací dioda se standardní dobou zotavení, VRRM 200 V, IFAV 1 A',
    notes:
      'Diotec "M1...M7" — součást řady M1-M7, viz záznam "M1" v této knihovně pro plné ' +
      'společné elektrické/mechanické specifikace. VRSM 200V.',
    tags: 'dioda,usměrňovací,standardní-zotavení,smd,sma,do-214ac,diotec,m3,200v,síťové-usměrnění',
  },
  {
    name: 'M4',
    packageType: 'shodné s M1 (SMA/DO-214AC) — viz jeho záznam pro plné mechanické specifikace',
    schematicImage: 'M1.jpg',
    value: 'Usměrňovací dioda se standardní dobou zotavení, VRRM 400 V, IFAV 1 A',
    notes:
      'Diotec "M1...M7" — součást řady M1-M7, viz záznam "M1" v této knihovně pro plné ' +
      'společné elektrické/mechanické specifikace. VRSM 400V.',
    tags: 'dioda,usměrňovací,standardní-zotavení,smd,sma,do-214ac,diotec,m4,400v,síťové-usměrnění',
  },
  {
    name: 'M5',
    packageType: 'shodné s M1 (SMA/DO-214AC) — viz jeho záznam pro plné mechanické specifikace',
    schematicImage: 'M1.jpg',
    value: 'Usměrňovací dioda se standardní dobou zotavení, VRRM 600 V, IFAV 1 A',
    notes:
      'Diotec "M1...M7" — součást řady M1-M7, viz záznam "M1" v této knihovně pro plné ' +
      'společné elektrické/mechanické specifikace. VRSM 600V.',
    tags: 'dioda,usměrňovací,standardní-zotavení,smd,sma,do-214ac,diotec,m5,600v,síťové-usměrnění',
  },
  {
    name: 'M6',
    packageType: 'shodné s M1 (SMA/DO-214AC) — viz jeho záznam pro plné mechanické specifikace',
    schematicImage: 'M1.jpg',
    value: 'Usměrňovací dioda se standardní dobou zotavení, VRRM 800 V, IFAV 1 A',
    notes:
      'Diotec "M1...M7" — součást řady M1-M7, viz záznam "M1" v této knihovně pro plné ' +
      'společné elektrické/mechanické specifikace. VRSM 800V.',
    tags: 'dioda,usměrňovací,standardní-zotavení,smd,sma,do-214ac,diotec,m6,800v,síťové-usměrnění',
  },
  {
    name: 'M7',
    packageType: 'shodné s M1 (SMA/DO-214AC) — viz jeho záznam pro plné mechanické specifikace',
    schematicImage: 'M1.jpg',
    value: 'Usměrňovací dioda se standardní dobou zotavení, VRRM 1000 V, IFAV 1 A',
    notes:
      'Diotec "M1...M7" — součást řady M1-M7, viz záznam "M1" v této knihovně pro plné ' +
      'společné elektrické/mechanické specifikace. Nejvyšší napěťová varianta celé řady. ' +
      'VRSM 1000V.',
    tags: 'dioda,usměrňovací,standardní-zotavení,smd,sma,do-214ac,diotec,m7,1000v,síťové-usměrnění',
  },
  {
    name: 'BAV99',
    packageType:
      'SMD SOT-23 (TO-236), 3 vývody: 1=katoda D1, 2=katoda D2, 3=společná anoda (ověřeno ze ' +
      'schématu v datasheetu — pozor, dřívější verze této poznámky měla polaritu obráceně), ' +
      'rozměry cca 2,9×1,3×1,1mm, pásková balení 3000ks/7", hmotnost ~0,01g',
    schematicImage: 'BAV99.jpg',
    value:
      'Duální (2×) spínací SMD dioda se společnou anodou v jednom pouzdře, IFAV 215 mA/dioda, ' +
      'VRRM 85 V, VF<855mV @IF=10mA, doba zotavení trr<4ns',
    notes:
      'Diotec Semiconductor "BAV99, BAV99L, BAV199 — SMD Small Signal Diodes" (verze ' +
      '2025-11-18). ⚠️ NOVÝ TYP součástky v této knihovně: první DUÁLNÍ (2 diody v jednom ' +
      'SOT-23 pouzdře) small-signal dioda — na rozdíl od jednotlivých THT/SMD spínacích diod ' +
      '(1N4148, LL4148/LL4448 aj. v této knihovně) integruje 2 diody se společnou anodou (pin ' +
      '3) v úsporném 3pinovém SOT-23 pouzdru — typicky pro logické hradlování/ochranu vstupů, ' +
      'sériové/paralelní kombinace v jednom pouzdře úsporném na místo na DPS. Objednací ' +
      'varianty: BAV99-C (commercial grade, VRRM 70V), BAV99/-Q/-AQ (industrial/automotive ' +
      'grade, VRRM 85V, nejvyšší rychlost přepínání ze skupiny) — viz sourozenecké záznamy ' +
      '"BAV99L" (100V verze) a "BAV199" (extrémně nízký svodový proud) pro odlišné varianty ve ' +
      'stejném pouzdře/pinoutu. Max. ztrátový výkon Ptot 225mW (BAV99-C) / 350mW (BAV99/-Q/-AQ, ' +
      'na 3mm² Cu plošky). Max. trvalý proud IFAV 215mA (zatížena jen jedna dioda) / 125mA ' +
      '(zatíženy obě diody současně). Periodický špičkový proud IFRM 300mA. Nárazový proud ' +
      'IFSM 0,5A (tp≤1s) / 1A (tp≤1ms) / 2A (tp≤1µs). VF (BAV99/-Q/-AQ, TJ=25°C): <715mV @1mA, ' +
      '<855mV @10mA, <1,0V @50mA, <1,25V @150mA. Závěrný proud IR<30nA @VR=70V/25°C (<30µA ' +
      '@150°C). Kapacita přechodu Cj<2pF @VR=0V/1MHz. Tepelný odpor přechod-okolí RthA 357K/W ' +
      '(BAV99/-Q/-AQ, na 3mm² Cu plošky). TJ a Tstg -55 až +150°C. Pouzdro UL94V-0, pájecí ' +
      'podmínky 260°C/10s, MSL=1. Shoda s RoHS (bez výjimky), REACH, Conflict Minerals, ' +
      'bezolovnatá/bezhalogenová konstrukce.',
    tags: 'dioda,spínací,signálová,duální,smd,sot-23,diotec,bav99,společná-anoda',
  },
  {
    name: 'BAV99L',
    packageType: 'shodné s BAV99 (SOT-23) — viz jeho záznam pro plné mechanické specifikace',
    schematicImage: 'BAV99.jpg',
    value:
      'Duální spínací SMD dioda se společnou anodou, IFAV 215 mA/dioda, VRRM 100 V, ' +
      'VF<855mV @IF=10mA, trr<4ns',
    notes:
      'Diotec "BAV99, BAV99L, BAV199" — součást rodiny, viz záznam "BAV99" v této knihovně pro ' +
      'plné společné mechanické specifikace a kontext. Vyšší napěťová varianta (VRRM 100V vs. ' +
      '85V u BAV99), jinak elektricky shodná s BAV99/-Q/-AQ (stejné VF, trr, Ptot, RthA). Pouze ' +
      've variantě -AQ (AEC-Q101 qualified).',
    tags: 'dioda,spínací,signálová,duální,smd,sot-23,diotec,bav99l,společná-anoda,100v',
  },
  {
    name: 'BAV199',
    packageType: 'shodné s BAV99 (SOT-23) — viz jeho záznam pro plné mechanické specifikace',
    schematicImage: 'BAV99.jpg',
    value:
      'Duální spínací SMD dioda se společnou anodou, extrémně nízký svodový proud, IFAV 215 ' +
      'mA/dioda, VRRM 85 V, VF<1,0V @IF=10mA, trr<3000ns',
    notes:
      'Diotec "BAV99, BAV99L, BAV199" — součást rodiny, viz záznam "BAV99" v této knihovně pro ' +
      'plné společné mechanické specifikace a kontext. ⚠️ Na rozdíl od BAV99 (optimalizováno ' +
      'na rychlost přepínání, trr<4ns) je BAV199 optimalizováno na EXTRÉMNĚ NÍZKÝ SVODOVÝ ' +
      '(leakage) PROUD — IR<5nA @VR=75V/25°C (<80nA @150°C), řádově nižší než u BAV99/BAV99L ' +
      '— za cenu výrazně pomalejší doby zotavení (trr<3000ns, cca 750× pomalejší než BAV99). ' +
      'Vhodné pro aplikace citlivé na svodový proud (např. vzorkovací obvody, vysokoimpedanční ' +
      'senzorové rozhraní), ne pro vysokorychlostní spínání. VF<900mV @1mA/<1,0V @10mA/<1,1V ' +
      '@50mA/<1,25V @150mA. Kapacita přechodu Cj typ. 2pF. Pouze ve variantách -Q/-AQ.',
    tags: 'dioda,spínací,signálová,duální,smd,sot-23,diotec,bav199,společná-anoda,nízký-svodový-proud',
  },
  {
    name: 'SKKT 92 (SEMIPACK 1)',
    schematicImage: 'SKKT92.jpg',
    packageType:
      'šroubovací výkonový modul SEMIPACK 1, keramická izolační destička (přenos tepla přes ' +
      'destičku z oxidu hlinitého), tvrdé pájené spoje, rozměry 93×30×9mm (case A46), 3 ' +
      'výkonové vývody se závitem M5 (piny 1/2/3), 4 gate/katoda signální vývody (piny 4-7), ' +
      'UL recognized (file E63532)',
    value:
      'Duální tyristorový modul (2× SCR se společnou katodou), ITAV 95 A/tyristor, ITRMS 150 A ' +
      '(max. trvalý), VRRM/VDRM 800–1800 V dle objednacího kódu, ITSM 2000 A (10ms/25°C)',
    notes:
      'SEMIKRON "SKKT 92, SKKT 92B, SKKH 92 — SEMIPACK 1 Thyristor/Diode Modules" (dok. verze ' +
      '09-03-2004). ⚠️ NOVÝ TYP součástky v této knihovně: první VÝKONOVÝ TYRISTOROVÝ MODUL ' +
      '(na rozdíl od diskrétních tyristorů SemiWell SCD4C60S a WeEn TYN50W/TYN80W-1600T v této ' +
      'knihovně) — dvojice tyristorů (SCR) v jednom šroubovacím pouzdře pro montáž na chladič, ' +
      'určeno pro průmyslové výkonové řízení (DC pohony obráběcích strojů, AC měkké rozběhy ' +
      'motorů, teplotní regulace pecí/chemických procesů, profesionální stmívání osvětlení ve ' +
      'studiích/divadlech). SKKT 92 má oba tyristory zapojené se SPOLEČNOU KATODOU (viz ' +
      'sourozenecké záznamy "SKKT 92B" pro variantu se společnou anodou a "SKKH 92" pro ' +
      'poloviční/smíšenou konfiguraci tyristor+dioda). Objednací kódy dle napěťové třídy: ' +
      'SKKT92/08E (VRRM 800V/VRSM 900V), /12E (1200V/1300V), /14E (1400V/1500V), /16E (1600V/ ' +
      '1700V), /18E (1800V/1900V). VT (propustné napětí) max 1,65V @IT=300A/25°C, VT(TO) max ' +
      '0,9V @125°C, dynamický odpor rT max 2mΩ @125°C. Blokovací proud IDD/IRD max 20mA @125°C. ' +
      'Doba zapnutí tgd 1µs, tgr 2µs. Kritická strmost (di/dt)cr max 150A/µs, (dv/dt)cr max ' +
      '1000V/µs (obojí @125°C). Vypínací doba tq typ. 100µs @125°C. Přídržný proud IH typ. ' +
      '150mA/max 250mA, rozběhový proud IL typ. 300mA/max 600mA (RG=33Ω, @25°C). Řídicí ' +
      'elektroda: VGT min 3V, IGT min 150mA (DC, 25°C); VGD max 0,25V, IGD max 6mA (DC, 125°C). ' +
      'Tepelný odpor přechod-pouzdro na tyristor: 0,28K/W (nepřetržitý provoz) / 0,3K/W ' +
      '(sinusový 180°) / 0,32K/W (usměrněný 120°) — na modul poloviční hodnoty. Tepelný odpor ' +
      'pouzdro-chladič 0,2K/W (na tyristor) / 0,1K/W (na modul). TVJ a TSTG -40 až +125°C. ' +
      'Izolační napětí (50Hz, 1s/1min) 3600/3000V~. Utahovací moment na chladič 5Nm (±15%), na ' +
      'terminály 3Nm (±15%). Hmotnost ~95g.',
    tags: 'tyristor,scr,výkonový-modul,duální,semikron,semipack,skkt92,800v,1800v,šroubovací',
  },
  {
    name: 'SKKT 92B (SEMIPACK 1)',
    packageType: 'shodné s SKKT 92 (case A48) — viz jeho záznam pro plné mechanické specifikace',
    schematicImage: 'SKKT92.jpg',
    value:
      'Duální tyristorový modul (2× SCR se společnou anodou), ITAV 95 A/tyristor, ITRMS 150 A, ' +
      'VRRM/VDRM 800–1800 V dle objednacího kódu',
    notes:
      'SEMIKRON "SKKT 92, SKKT 92B, SKKH 92" — součást rodiny, viz záznam "SKKT 92" v této ' +
      'knihovně pro plné společné elektrické specifikace a kontext. Na rozdíl od SKKT 92 mají ' +
      'oba tyristory SPOLEČNOU ANODU místo společné katody — vhodné pro jiná zapojení řízených ' +
      'usměrňovačů/měničů (např. dvojice modulů SKKT92+SKKT92B pro plně řízený třífázový ' +
      'můstek). Objednací kódy: SKKT92B08E až SKKT92B18E (stejná napěťová řada jako SKKT 92). ' +
      'Case A48 (mírně odlišné mechanické provedení od A46 u SKKT 92).',
    tags: 'tyristor,scr,výkonový-modul,duální,semikron,semipack,skkt92b,společná-anoda,800v,1800v,šroubovací',
  },
  {
    name: 'SKKH 92 (SEMIPACK 1)',
    packageType: 'shodné s SKKT 92 (case A47) — viz jeho záznam pro plné mechanické specifikace',
    schematicImage: 'SKKT92.jpg',
    value:
      'Poloviční řízený modul (1× tyristor SCR + 1× dioda), ITAV 95 A, ITRMS 150 A, VRRM/VDRM ' +
      '800–1800 V dle objednacího kódu',
    notes:
      'SEMIKRON "SKKT 92, SKKT 92B, SKKH 92" — součást rodiny, viz záznam "SKKT 92" v této ' +
      'knihovně pro plné společné elektrické specifikace a kontext (tyristorová část ' +
      'elektricky shodná). Na rozdíl od SKKT 92/92B (2× tyristor) obsahuje SKKH 92 SMÍŠENOU ' +
      'KONFIGURACI — jeden tyristor a jednu výkonovou diodu v jednom pouzdře, typické pro ' +
      'poloviditelně řízené (half-controlled) usměrňovací můstky s nižšími náklady na řízení ' +
      'než plně tyristorové zapojení. Objednací kódy: SKKH92/08E až SKKH92/18E (stejná napěťová ' +
      'řada). Case A47.',
    tags: 'tyristor,scr,dioda,výkonový-modul,smíšený,semikron,semipack,skkh92,800v,1800v,šroubovací',
  },
];

const BRIDGE_SPECS: PartSpec[] = [
  {
    name: 'ABS2',
    packageType:
      'SMD můstkové pouzdro "ABS", 4 vývody (~ / ~ / + / -), rozteč vývodů 4 mm (kvůli vyšším ' +
      'vzdušným/povrchovým vzdálenostem), rozměry cca 6,2×5,0×1,4 mm, pásková balení ' +
      '5000ks/13"',
    schematicImage: 'ABS2.jpg',
    value:
      'Jednofázový můstkový usměrňovač (SMD), VRRM 200 V, IFAV 0,8/1 A, VF<0,95V @0,4A, IFSM ' +
      '25 A (50Hz)/27 A (60Hz)',
    notes:
      'Diotec Semiconductor "ABS2...ABS10-16 — SMD Single Phase Bridge Rectifier" (dok. verze ' +
      '2024-06-19). ⚠️ NOVÁ KATEGORIE v této knihovně (Můstek) — první usměrňovací můstek, ' +
      'vyčleněn ze samostatných diod do vlastní kategorie, protože jde o integrované pouzdro ' +
      'se 4 diodami zapojenými jako celý jednofázový usměrňovací můstek, ne o jednotlivou diodu. ' +
      'Použití: síťové usměrnění 50/60Hz, napájecí zdroje. Nejnižší napěťová varianta řady ' +
      'ABS2–ABS10-16 (VRRM 200–1600V, viz sourozenecké záznamy ABS4/6/8/10/10-16 pro plné ' +
      'specifikace VRRM). Max. vstupní střídavé napětí VVRMS 140V. Max. trvalý výstupní proud ' +
      'IFAV 0,8A (25mm² Cu plošky) / 1A (2500mm² Cu plošky) @TA=40°C. Periodický špičkový ' +
      'propustný proud IFRM 5,4A @f>15Hz/TA=40°C. Rázový proud IFSM 25A (půlvlna 50Hz/10ms) / ' +
      '27A (60Hz/8,3ms) — ⚠️ datasheet v záhlaví uvádí souhrnně "IFSM=27/30A" pro celou řadu, ' +
      'zatímco podrobná tabulka pro tento konkrétní typ udává 25A/27A; použita přesnější ' +
      'hodnota z tabulky. Grenzlastintegral i²t (t<10ms) 3,6 A²s. VF<0,95V @IF=0,4A / <1,1V ' +
      '@IF=0,8A (Tj=25°C, platí na diodu). Závěrný proud IR<5µA @VR=VRRM. Doba zotavení trr ' +
      'typ. 1500ns. Kapacita přechodu Cj 10pF @VR=4V. Tepelný odpor přechod-okolí RthA<80K/W ' +
      '(25mm² plošky) / <62K/W (2500mm² Al substrát), přechod-pouzdro RthT<25K/W. TJ a Tstg -50 ' +
      'až +150°C. Doporučený ochranný odpor Rt=14,8Ω, přípustný nabíjecí kondenzátor CL=338µF. ' +
      'Pouzdro UL94V-0, pájecí podmínky 260°C/10s, MSL=1, hmotnost ~0,1g. Shoda s RoHS (výjimka ' +
      '7a), REACH, Conflict Minerals, bez halogenu. K dispozici i varianty -Q (AEC-Q101 ' +
      'compliant) / -AQ (AEC-Q101 qualified) pro automotive.',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,diotec,abs2,200v,síťové-usměrnění',
  },
  {
    name: 'ABS4',
    packageType: 'shodné s ABS2 — viz poznámka u ABS2 pro plné mechanické specifikace',
    schematicImage: 'ABS2.jpg',
    value: 'Jednofázový můstkový usměrňovač (SMD), VRRM 400 V, IFAV 0,8/1 A',
    notes:
      'Diotec Semiconductor "ABS2...ABS10-16" — součást řady ABS2–ABS10-16, viz záznam "ABS2" ' +
      'v této knihovně pro plné společné elektrické/mechanické specifikace. Max. vstupní ' +
      'střídavé napětí VVRMS 280V. Doporučený ochranný odpor Rt=22,2Ω, přípustný nabíjecí ' +
      'kondenzátor CL=225µF.',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,diotec,abs4,400v,síťové-usměrnění',
  },
  {
    name: 'ABS6',
    packageType: 'shodné s ABS2 — viz poznámka u ABS2 pro plné mechanické specifikace',
    schematicImage: 'ABS2.jpg',
    value: 'Jednofázový můstkový usměrňovač (SMD), VRRM 600 V, IFAV 0,8/1 A',
    notes:
      'Diotec Semiconductor "ABS2...ABS10-16" — součást řady ABS2–ABS10-16, viz záznam "ABS2" ' +
      'v této knihovně pro plné společné elektrické/mechanické specifikace. Max. vstupní ' +
      'střídavé napětí VVRMS 420V. Doporučený ochranný odpor Rt=29,6Ω, přípustný nabíjecí ' +
      'kondenzátor CL=169µF.',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,diotec,abs6,600v,síťové-usměrnění',
  },
  {
    name: 'ABS8',
    packageType: 'shodné s ABS2 — viz poznámka u ABS2 pro plné mechanické specifikace',
    schematicImage: 'ABS2.jpg',
    value: 'Jednofázový můstkový usměrňovač (SMD), VRRM 800 V, IFAV 0,8/1 A',
    notes:
      'Diotec Semiconductor "ABS2...ABS10-16" — součást řady ABS2–ABS10-16, viz záznam "ABS2" ' +
      'v této knihovně pro plné společné elektrické/mechanické specifikace. Max. vstupní ' +
      'střídavé napětí VVRMS 560V. Doporučený ochranný odpor Rt=37,0Ω, přípustný nabíjecí ' +
      'kondenzátor CL=125µF.',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,diotec,abs8,800v,síťové-usměrnění',
  },
  {
    name: 'ABS10',
    packageType: 'shodné s ABS2 — viz poznámka u ABS2 pro plné mechanické specifikace',
    schematicImage: 'ABS2.jpg',
    value: 'Jednofázový můstkový usměrňovač (SMD), VRRM 1000 V, IFAV 0,8/1 A',
    notes:
      'Diotec Semiconductor "ABS2...ABS10-16" — součást řady ABS2–ABS10-16, viz záznam "ABS2" ' +
      'v této knihovně pro plné společné elektrické/mechanické specifikace. Max. vstupní ' +
      'střídavé napětí VVRMS 700V. Doporučený ochranný odpor Rt=64,0Ω, přípustný nabíjecí ' +
      'kondenzátor CL=78µF — ⚠️ POZOR na záměnu se sourozeneckým typem "ABS10-16" (stejný ' +
      'prefix ABS10, ale VRRM 1600V, ne 1000V, a odlišné Rt/CL hodnoty shodné s ABS2).',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,diotec,abs10,1000v,síťové-usměrnění',
  },
  {
    name: 'ABS10-16',
    packageType: 'shodné s ABS2 — viz poznámka u ABS2 pro plné mechanické specifikace',
    schematicImage: 'ABS2.jpg',
    value: 'Jednofázový můstkový usměrňovač (SMD), VRRM 1600 V, IFAV 0,8/1 A',
    notes:
      'Diotec Semiconductor "ABS2...ABS10-16" — součást řady ABS2–ABS10-16, viz záznam "ABS2" ' +
      'v této knihovně pro plné společné elektrické/mechanické specifikace. Nejvyšší napěťová ' +
      'varianta celé řady. Max. vstupní střídavé napětí VVRMS 1120V. Doporučený ochranný odpor ' +
      'Rt=14,8Ω, přípustný nabíjecí kondenzátor CL=338µF (shodné s ABS2, přestože VRRM je ' +
      '8× vyšší — dáno vztahem Rt=VRRM/IFSM při stejném IFSM).',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,diotec,abs10-16,1600v,síťové-usměrnění',
  },
  {
    name: 'S40',
    packageType:
      'SMD pouzdro TO-269AA "MiniDIL SLIM", 4 vývody (~ / ~ / + / -), nízký profil, rozměry cca ' +
      '6,5×5,1×1,65 mm, pásková balení 5000ks/13"',
    schematicImage: 'S40.jpg',
    value:
      'Jednofázový diodový můstkový usměrňovač (SMD), VRRM 80 V, IFAV 0,8 A, VF<0,95V @0,4A, ' +
      'IFSM 40 A (50Hz)/44 A (60Hz)',
    notes:
      'Diotec Semiconductor "S40...S500 — SMD Single Phase Diode Bridge Rectifier" (dok. verze ' +
      '2020-12-14) — druhá rodina usměrňovacích můstků v této kategorii, odlišná od ABS-série ' +
      '(viz záznam "ABS2" v této knihovně) jiným SMD pouzdrem (TO-269AA MiniDIL SLIM vs. ABS) a ' +
      'nižším napěťovým rozsahem (80-1000V vs. 200-1600V) při vyšším IFSM (40/44A vs. 25/27A). ' +
      'UL rozpoznáno (UL Recognized, File E175067). Nejnižší napěťová varianta řady S40–S500 ' +
      '(VRRM 80–1000V, viz sourozenecké záznamy S80/S125/S250/S380/S500 pro plné specifikace ' +
      'VRRM). Značení na pouzdru: pruh (bar) označuje DC stranu (+/-), kód "B" + 2-3místný ' +
      'výrobní kód. Max. vstupní střídavé napětí VVRMS 40V. Max. trvalý výstupní proud IFAV ' +
      '0,8A @TA=50°C (25mm² Cu plošky). Periodický špičkový propustný proud IFRM 10A @f>15Hz/ ' +
      'TA=50°C. Rázový proud IFSM 40A (půlvlna 50Hz/10ms) / 44A (60Hz/8,3ms). Grenzlastintegral ' +
      'i²t (t<10ms) 8 A²s. VF<0,95V @IF=0,4A / <1,1V @IF=0,8A (Tj=25°C, platí na diodu). Závěrný ' +
      'proud IR<5µA @VR=VRRM. Doba zotavení trr typ. 1500ns. Kapacita přechodu Cj 10pF @VR=4V. ' +
      'Tepelný odpor přechod-okolí RthA 60K/W (typ., 25mm² plošky), přechod-vývod RthT 20K/W ' +
      '(typ.). TJ a Tstg -50 až +150°C. Doporučený ochranný odpor Rt=2,0Ω, přípustný nabíjecí ' +
      'kondenzátor CL=2500µF. Pouzdro UL94V-0, pájecí podmínky 260°C/10s, MSL=1, hmotnost ' +
      '~0,1g. Shoda s RoHS (výjimka 7a), REACH, Conflict Minerals, bez halogenu.',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,diotec,s40,to-269aa,minidil,80v,síťové-usměrnění',
  },
  {
    name: 'S80',
    packageType: 'shodné s S40 — viz poznámka u S40 pro plné mechanické specifikace',
    schematicImage: 'S40.jpg',
    value: 'Jednofázový diodový můstkový usměrňovač (SMD), VRRM 160 V, IFAV 0,8 A',
    notes:
      'Diotec Semiconductor "S40...S500" — součást řady S40–S500, viz záznam "S40" v této ' +
      'knihovně pro plné společné elektrické/mechanické specifikace. Značení "C" + výrobní kód. ' +
      'Max. vstupní střídavé napětí VVRMS 80V. Doporučený ochranný odpor Rt=4,0Ω, přípustný ' +
      'nabíjecí kondenzátor CL=1250µF.',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,diotec,s80,to-269aa,minidil,160v,síťové-usměrnění',
  },
  {
    name: 'S125',
    packageType: 'shodné s S40 — viz poznámka u S40 pro plné mechanické specifikace',
    schematicImage: 'S40.jpg',
    value: 'Jednofázový diodový můstkový usměrňovač (SMD), VRRM 250 V, IFAV 0,8 A',
    notes:
      'Diotec Semiconductor "S40...S500" — součást řady S40–S500, viz záznam "S40" v této ' +
      'knihovně pro plné společné elektrické/mechanické specifikace. Značení "E" + výrobní kód. ' +
      'Max. vstupní střídavé napětí VVRMS 125V. Doporučený ochranný odpor Rt=6,25Ω, přípustný ' +
      'nabíjecí kondenzátor CL=800µF.',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,diotec,s125,to-269aa,minidil,250v,síťové-usměrnění',
  },
  {
    name: 'S250',
    packageType: 'shodné s S40 — viz poznámka u S40 pro plné mechanické specifikace',
    schematicImage: 'S40.jpg',
    value: 'Jednofázový diodový můstkový usměrňovač (SMD), VRRM 600 V, IFAV 0,8 A',
    notes:
      'Diotec Semiconductor "S40...S500" — součást řady S40–S500, viz záznam "S40" v této ' +
      'knihovně pro plné společné elektrické/mechanické specifikace. Značení "J" + výrobní kód. ' +
      'Max. vstupní střídavé napětí VVRMS 250V. Doporučený ochranný odpor Rt=15,0Ω, přípustný ' +
      'nabíjecí kondenzátor CL=333µF.',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,diotec,s250,to-269aa,minidil,600v,síťové-usměrnění',
  },
  {
    name: 'S380',
    packageType: 'shodné s S40 — viz poznámka u S40 pro plné mechanické specifikace',
    schematicImage: 'S40.jpg',
    value: 'Jednofázový diodový můstkový usměrňovač (SMD), VRRM 800 V, IFAV 0,8 A',
    notes:
      'Diotec Semiconductor "S40...S500" — součást řady S40–S500, viz záznam "S40" v této ' +
      'knihovně pro plné společné elektrické/mechanické specifikace. Značení "K" + výrobní kód. ' +
      'Max. vstupní střídavé napětí VVRMS 380V. Doporučený ochranný odpor Rt=20,0Ω, přípustný ' +
      'nabíjecí kondenzátor CL=250µF.',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,diotec,s380,to-269aa,minidil,800v,síťové-usměrnění',
  },
  {
    name: 'S500',
    packageType: 'shodné s S40 — viz poznámka u S40 pro plné mechanické specifikace',
    schematicImage: 'S40.jpg',
    value: 'Jednofázový diodový můstkový usměrňovač (SMD), VRRM 1000 V, IFAV 0,8 A',
    notes:
      'Diotec Semiconductor "S40...S500" — součást řady S40–S500, viz záznam "S40" v této ' +
      'knihovně pro plné společné elektrické/mechanické specifikace. Nejvyšší napěťová varianta ' +
      'celé řady. Značení "M" + výrobní kód. Max. vstupní střídavé napětí VVRMS 500V. Doporučený ' +
      'ochranný odpor Rt=25,0Ω, přípustný nabíjecí kondenzátor CL=200µF.',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,diotec,s500,to-269aa,minidil,1000v,síťové-usměrnění',
  },
  {
    name: 'DF005S',
    packageType:
      'SMD pouzdro SDIP 4L (4-Lead, 6,5mm šířka), rozměry cca 8,5×6,5×2,6 mm, pásková balení, ' +
      'top mark shodný s názvem dílu',
    schematicImage: 'DF005S.jpg',
    value:
      'Jednofázový můstkový usměrňovač (SMD), VRRM 50 V, IFAV 1,5 A, VF max 1,1V @1,5A, IFSM ' +
      '50 A (8,3ms půlvlna)',
    notes:
      'Fairchild (ON Semiconductor) "DF005S - DF10S — Bridge Rectifiers" (dok. Rev. 1.5, květen ' +
      '2015, © 1998 Fairchild Semiconductor). Třetí rodina usměrňovacích můstků v této ' +
      'kategorii, odlišná od obou Diotec řad (ABS a S40-S500, viz záznamy "ABS2" a "S40" v této ' +
      'knihovně) jiným SMD pouzdrem (SDIP 4L, nekonformní s žádným referenčním standardem dle ' +
      'datasheetu) a vyšším trvalým proudem IFAV=1,5A. UL certifikováno (UL #E258596), pájení ' +
      'kompatibilní s IR reflow i vlnovou pájkou, bezolovnaté (RoHS 2002/95/EU), "Green Molding ' +
      'Compound" dle IEC61249. Nejnižší napěťová varianta řady DF005S–DF10S (VRRM 50–1000V, ' +
      'viz sourozenecké záznamy DF01S/DF02S/DF04S/DF06S/DF08S/DF10S pro plné specifikace VRRM). ' +
      'Max. RMS vstupní napětí VRMS 35V, DC závěrné napětí při jmenovitém IR VDC 50V. Max. ' +
      'trvalý usměrněný proud IFAV 1,5A @TA=40°C (shodný pro celou řadu). Nadproudový ráz IFSM ' +
      '50A (jednorázová půlvlna 8,3ms, shodné pro celou řadu). Grenzlastintegral i²t (t<8,35ms) ' +
      '10 A²s. VF (na prvek) max 1,1V @IF=1,5A/25°C (typ. 0,94V dle "Features"). Závěrný proud ' +
      'IR (na prvek, @VR jmenovité) max 5,0µA @TA=25°C / max 500µA @TA=125°C. Kapacita přechodu ' +
      'CJ typ. 25pF @VR=4V/f=1MHz. Ztrátový výkon PD 3,1W. Tepelný odpor přechod-okolí RθJA: ' +
      '62°C/W (jeden čip, max. land pattern 13×13mm) / 50°C/W (multi-die, max. pattern) / ' +
      '105°C/W (multi-die, min. pattern 1,3×1,5mm). Tepelná charakteristika přechod-vývod ψJL ' +
      '27°C/W. TJ a Tstg -55 až +150°C.',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,fairchild,onsemi,df005s,sdip,50v,síťové-usměrnění',
  },
  {
    name: 'DF01S',
    packageType: 'shodné s DF005S — viz poznámka u DF005S pro plné mechanické specifikace',
    schematicImage: 'DF005S.jpg',
    value: 'Jednofázový můstkový usměrňovač (SMD), VRRM 100 V, IFAV 1,5 A',
    notes:
      'Fairchild "DF005S - DF10S" — součást řady DF005S–DF10S, viz záznam "DF005S" v této ' +
      'knihovně pro plné společné elektrické/mechanické specifikace. Max. RMS vstupní napětí ' +
      'VRMS 70V, DC závěrné napětí VDC 100V.',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,fairchild,onsemi,df01s,sdip,100v,síťové-usměrnění',
  },
  {
    name: 'DF02S',
    packageType: 'shodné s DF005S — viz poznámka u DF005S pro plné mechanické specifikace',
    schematicImage: 'DF005S.jpg',
    value: 'Jednofázový můstkový usměrňovač (SMD), VRRM 200 V, IFAV 1,5 A',
    notes:
      'Fairchild "DF005S - DF10S" — součást řady DF005S–DF10S, viz záznam "DF005S" v této ' +
      'knihovně pro plné společné elektrické/mechanické specifikace. Max. RMS vstupní napětí ' +
      'VRMS 140V, DC závěrné napětí VDC 200V.',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,fairchild,onsemi,df02s,sdip,200v,síťové-usměrnění',
  },
  {
    name: 'DF04S',
    packageType: 'shodné s DF005S — viz poznámka u DF005S pro plné mechanické specifikace',
    schematicImage: 'DF005S.jpg',
    value: 'Jednofázový můstkový usměrňovač (SMD), VRRM 400 V, IFAV 1,5 A',
    notes:
      'Fairchild "DF005S - DF10S" — součást řady DF005S–DF10S, viz záznam "DF005S" v této ' +
      'knihovně pro plné společné elektrické/mechanické specifikace. Max. RMS vstupní napětí ' +
      'VRMS 280V, DC závěrné napětí VDC 400V.',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,fairchild,onsemi,df04s,sdip,400v,síťové-usměrnění',
  },
  {
    name: 'DF06S',
    packageType: 'shodné s DF005S — viz poznámka u DF005S pro plné mechanické specifikace',
    schematicImage: 'DF005S.jpg',
    value: 'Jednofázový můstkový usměrňovač (SMD), VRRM 600 V, IFAV 1,5 A',
    notes:
      'Fairchild "DF005S - DF10S" — součást řady DF005S–DF10S, viz záznam "DF005S" v této ' +
      'knihovně pro plné společné elektrické/mechanické specifikace. Max. RMS vstupní napětí ' +
      'VRMS 420V, DC závěrné napětí VDC 600V.',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,fairchild,onsemi,df06s,sdip,600v,síťové-usměrnění',
  },
  {
    name: 'DF08S',
    packageType: 'shodné s DF005S — viz poznámka u DF005S pro plné mechanické specifikace',
    schematicImage: 'DF005S.jpg',
    value: 'Jednofázový můstkový usměrňovač (SMD), VRRM 800 V, IFAV 1,5 A',
    notes:
      'Fairchild "DF005S - DF10S" — součást řady DF005S–DF10S, viz záznam "DF005S" v této ' +
      'knihovně pro plné společné elektrické/mechanické specifikace. Max. RMS vstupní napětí ' +
      'VRMS 560V, DC závěrné napětí VDC 800V.',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,fairchild,onsemi,df08s,sdip,800v,síťové-usměrnění',
  },
  {
    name: 'DF10S',
    packageType: 'shodné s DF005S — viz poznámka u DF005S pro plné mechanické specifikace',
    schematicImage: 'DF005S.jpg',
    value: 'Jednofázový můstkový usměrňovač (SMD), VRRM 1000 V, IFAV 1,5 A',
    notes:
      'Fairchild "DF005S - DF10S" — součást řady DF005S–DF10S, viz záznam "DF005S" v této ' +
      'knihovně pro plné společné elektrické/mechanické specifikace. Nejvyšší napěťová varianta ' +
      'celé řady. Max. RMS vstupní napětí VRMS 700V, DC závěrné napětí VDC 1000V.',
    tags: 'můstek,usměrňovací,bridge-rectifier,smd,fairchild,onsemi,df10s,sdip,1000v,síťové-usměrnění',
  },
];

const TRANSISTOR_SPECS: PartSpec[] = [
  {
    name: 'BC546',
    packageType:
      'TO-92 — POZOR, pořadí vývodů závisí na výrobci (viz poznámka): ' +
      'Motorola/ON Semi a UTC/Unisonic (většina) = C-B-E, Philips/NXP (SOT54/SC-43A, výjimka) = E-B-C',
    value: 'NPN, VCEO 65 V, IC 100 mA, hFE 110–450 (@ IC=2 mA)',
    schematicImage: 'BC546.jpg',
    notes:
      '⚠️ PINOUT SE LIŠÍ PODLE VÝROBCE — vždy ověř podle konkrétního kusu: ' +
      '• Motorola/ON Semi TO-92 (Case 29-04, styl 17) a UTC/Unisonic TO-92: 1=kolektor, 2=báze, 3=emitor (většinová konvence). ' +
      '• Philips/NXP TO-92 (SOT54, JEDEC SC-43A): 1=emitor, 2=báze, 3=kolektor (výjimka!). ' +
      'Záměna vývodů podle špatného výrobce tranzistor nezničí, ale obvod nebude fungovat. ' +
      'PNP komplement (dle Philips/NXP): BC556/BC557. ' +
      'Elektrické parametry — srovnání 3 datasheetů (Motorola BC546/D, Philips/NXP 2004, UTC QW-R201-037): ' +
      'VCEO=65 V, VCBO=80 V, VEBO=6 V (shoda všech tří). IC(trvalý)=100 mA (shoda). ' +
      'ICM/IBM (špičkově, jen Philips)=200 mA. ' +
      'Ptot/Pc: 625 mW @TA=25 °C na volném vzduchu (Motorola) / 500 mW @Tamb=25 °C na DPS FR4 (Philips) / ' +
      '500 mW bez upřesnění chlazení (UTC) — reálný výkon závisí na chlazení a osazení. ' +
      'TJ max 150 °C (shoda), Tstg -55/-65 až +150 °C. ' +
      'Rth(j-a)=200 °C/W (Motorola, volný vzduch) / 250 K/W na DPS FR4 (Philips). ' +
      'hFE @IC=2 mA/VCE=5 V: základní BC546(A) min 110, typ 180, max 220 (shoda Motorola/UTC); ' +
      'BC546B min 200, typ 290, max 450 (shoda všech tří). hFE @IC=10 µA: BC546A typ 90, BC546B typ 150. ' +
      'ICBO (únik) max 15 nA @VCB=30 V (shoda Motorola/UTC, max 5 µA @Tj=150 °C dle Motoroly). IEBO max 100 nA @VEB=5 V (Philips). ' +
      'VCE(sat) @IC=10 mA/IB=0,5 mA: typ 0,09 V, max 0,25 V (shoda všech tří — velmi konzistentní parametr). ' +
      'VBE(sat) @IC=10 mA: typ 0,7 V (shoda Philips/UTC). VBE(on) @IC=2 mA: 0,58–0,70 V, typ 0,66 V (shoda). ' +
      'fT @IC=10 mA/VCE=5 V/f=100 MHz: typ 300 MHz (shoda Motorola/UTC), Philips udává jen min 100 MHz. ' +
      'Kapacity: výstupní (Cobo/Cc/Cob) 1,5–1,7 pF typ (Motorola/Philips), ale 3,5–6 pF (UTC) — znatelný rozptyl mezi výrobci. ' +
      'Vstupní (Cibo/Ce/Cib) 9–11 pF (přibližná shoda). ' +
      'Šum NF @IC=0,2 mA/VCE=5 V/RS=2 kΩ: typ 2,0 dB, max 10 dB (shoda všech tří zdrojů).',
    tags: 'tranzistor,npn,bipolární,to-92,zesilovací,bc546,pozor-pinout',
  },
  { name: 'BC547', packageType: 'TO-92', value: 'NPN, 45 V, 100 mA', notes: 'Malovýkonový bipolární tranzistor', tags: 'tranzistor,npn,bipolární' },
  { name: 'BC548', packageType: 'TO-92', value: 'NPN, 30 V, 100 mA', notes: 'Malovýkonový bipolární tranzistor', tags: 'tranzistor,npn,bipolární' },
  { name: 'BC549', packageType: 'TO-92', value: 'NPN, 30 V, 100 mA', notes: 'Malovýkonový bipolární tranzistor, nízký šum', tags: 'tranzistor,npn,bipolární' },
  {
    name: '2N2222',
    packageType:
      'TO-18 — vývody: 1=emitor, 2=báze, 3=kolektor (kolektor je spojen s kovovým pouzdrem/case!)',
    value: 'NPN, 40 V, 800 mA',
    schematicImage: '2N2221A.jpg',
    notes:
      'Malovýkonový bipolární tranzistor. Pořadí vývodů (1=E, 2=B, 3=K) a spojení kolektoru s pouzdrem ' +
      'potvrzeno dle MIL-PRF-19500/255 (Microchip DS00005314A) pro celou rodinu 2N222x v TO-18 — ' +
      'stejná konvence platí i pro 2N2222A a další TO-18 tranzistory této řady (např. 2N2907).',
    tags: 'tranzistor,npn,bipolární',
  },
  {
    name: '2N2221A',
    packageType:
      'TO-18 (TO-206AA) — vývody: 1=emitor, 2=báze, 3=kolektor (kolektor spojen s pouzdrem); ' +
      'existují i SMD varianty UA (4 vývody)/UB/UBC (keramický leadless chip carrier)',
    value: 'NPN, VCEO 50 V (MIL spec), IC 800 mA, hFE 35–150 (@ IC=1 mA)',
    schematicImage: '2N2221A.jpg',
    notes:
      'Radiačně odolný (radiation hardened) NPN spínací tranzistor kvalifikovaný dle MIL-PRF-19500/255 ' +
      '(vojenské/kosmické aplikace; třídy odolnosti JANTXV/JANS 3K až 1MEG rad Si). Menší sourozenec ' +
      '2N2222A ve stejném pouzdře. Datasheet Microchip DS00005314A (2024, převod staršího Microsemi listu). ' +
      'Mezní hodnoty: VCEO=50 V, VCBO=75 V, VEBO=6,0 V, IC=800 mA. Ptot=0,5 W @TA=25 °C (2N2221A/L, UBC) ' +
      'nebo 0,65 W (UA varianta). TJ/Tstg=-65 až +200 °C. RθJA=325 °C/W (TO-18, UB/UBC) / 210 °C/W (UA). ' +
      'ICBO max 10 µA @VCB=75 V (max 10 nA @VCB=60 V). IEBO max 10 µA @VEB=6 V (max 10 nA @VEB=4 V). ' +
      'ICES max 50 nA @VCE=50 V. ' +
      'hFE: @IC=0,1 mA min 30; @1 mA min 35, max 150; @10 mA min 40; @150 mA min 40, max 120; @500 mA min 20. ' +
      'VCE(sat) max 0,3 V @IC=150 mA/IB=15 mA; max 1,0 V @IC=500 mA/IB=50 mA. ' +
      'VBE(sat) 0,6–1,2 V @IC=150 mA/IB=15 mA; max 2,0 V @IC=500 mA/IB=50 mA. ' +
      'hfe (malý signál) min 30 @IC=1 mA/f=1 kHz; |hfe| min 2,5 @IC=20 mA/VCE=20 V/f=100 MHz. ' +
      'Cobo max 8,0 pF @VCB=10 V. Cibo max 25 pF @VEB=0,5 V. ' +
      'Spínací časy: ton max 35 ns, toff max 300 ns. ' +
      '⚠️ Nezaměňovat s 2N2222A — sdílí pouzdro a vojenskou kvalifikaci, ale má nižší hFE (viz vlastní záznam).',
    tags: 'tranzistor,npn,bipolární,to-18,spínací,mil-prf-19500,radiačně-odolný,2n2221a',
  },
  {
    name: '2N2222A',
    packageType:
      'TO-18 — vývody: 1=emitor, 2=báze, 3=kolektor (kolektor je spojen s kovovým pouzdrem/case!)',
    value: 'NPN, VCEO 40–50 V (dle třídy/výrobce), VCBO 75 V, IC 600–800 mA',
    schematicImage: '2N2221A.jpg',
    notes:
      'OPRAVA pořadí vývodů: dříve uvedeno chybně jako 1=kolektor,2=báze,3=emitor (převzato z odlišné ' +
      'konvence TO-92 Motorola). Dle MIL-PRF-19500/255 (Microchip DS00005314A) je pro TO-18 2N222x ' +
      'správné pořadí 1=emitor, 2=báze, 3=kolektor, přičemž kolektor je interně spojen s kovovým pouzdrem. ' +
      'Rozpor mezi zdroji u VCEO: komerční Motorola P2N2222A/D uvádí VCEO=40 V, zatímco vojenská ' +
      'MIL-PRF-19500/255 verze (JAN/JANTX/JANS) uvádí VCEO=50 V — jde o rozdílné třídy/binning, ne chybu; ' +
      'pro běžnou komerční 2N2222A počítej s 40 V, pro JAN/JANTX/JANS kusy s 50 V. ' +
      'VCBO=75 V, VEBO=6,0 V (shoda obou zdrojů). hFE typicky 100–300 (@IC=150 mA, komerční verze), ' +
      'fT typ 300 MHz. Podrobná komerční data viz samostatná položka „P2N2222A“ (plastová TO-92 verze ' +
      'téže třídy A); vojenská data viz „2N2221A“ (stejná rodina, nižší hFE).',
    tags: 'tranzistor,npn,bipolární,to-18,mil-prf-19500',
  },
  {
    name: 'P2N2222A',
    packageType: 'TO-92 (TO-226AA, Case 29-04, styl 17) — vývody: 1=kolektor, 2=báze, 3=emitor',
    value: 'NPN, VCEO 40 V, VCBO 75 V, IC(trvalý) 600 mA, hFE 100–300 (@ IC=150 mA)',
    schematicImage: 'P2N2222A.jpg',
    notes:
      'Plastová TO-92 verze tranzistoru 2N2222A (elektricky stejná třída "A" jako kovový TO-18 ' +
      '2N2222A, ale nižší proudové/výkonové zatížení pouzdra). Datasheet Motorola P2N2222A/D. ' +
      'Mezní hodnoty: VCEO=40 V, VCBO=75 V, VEBO=6,0 V, IC(trvalý)=600 mA. ' +
      'PD=625 mW @TA=25 °C (1,5 W @TC=25 °C), TJ/Tstg=-55 až +150 °C. ' +
      'RθJA=200 °C/W, RθJC=83,3 °C/W. ' +
      'Off charakteristiky: V(BR)CEO min 40 V, V(BR)CBO min 75 V, V(BR)EBO min 6,0 V. ' +
      'ICEX max 10 nA @VCE=60 V. ICBO max 0,01 µA @25 °C / max 10 µA @Tj=150 °C (VCB=60 V). ' +
      'IEBO max 10 nA, ICEO max 10 nA @VCE=10 V, IBEX max 20 nA. ' +
      'hFE: @IC=0,1 mA min 35; @1 mA min 50; @10 mA min 75 (min 35 při -55 °C); ' +
      '@150 mA min 100, max 300; @150 mA/VCE=1 V min 50; @500 mA min 40. ' +
      'VCE(sat) @IC=150 mA/IB=15 mA: max 0,3 V. @IC=500 mA/IB=50 mA: max 1,0 V. ' +
      'VBE(sat) @IC=150 mA/IB=15 mA: 0,6–1,2 V. @IC=500 mA/IB=50 mA: max 2,0 V. ' +
      'fT @IC=20 mA/VCE=20 V/f=100 MHz: min 300 MHz. ' +
      'Cobo max 8,0 pF @VCB=10 V. Cibo max 25 pF @VEB=0,5 V. ' +
      'Šum NF max 4,0 dB @IC=100 µA/VCE=10 V/RS=1 kΩ. ' +
      'Spínací časy (IC=150 mA, IB=15 mA): td=10 ns, tr=25 ns, ts=225 ns, tf=60 ns — vhodný i pro spínací aplikace.',
    tags: 'tranzistor,npn,bipolární,to-92,spínací,zesilovací,p2n2222a,2n2222a',
  },
  {
    name: '2N3904',
    packageType: 'TO-92, 3 vývody: 1=emitor, 2=báze, 3=kolektor (pohled zepředu na popsanou stranu)',
    value: 'NPN, VCEO 40 V, IC 200 mA, hFE 100–300 (@ IC=10 mA)',
    schematicImage: '2N3904.jpg',
    notes:
      'Malovýkonový bipolární NPN tranzistor pro obecné spínací a zesilovací aplikace — komplementární ' +
      'k 2N3906. Datasheet GTM Corporation (jejich verze „G2N3904"), vydán 2003, revize 2005/06/24. ' +
      'Mezní hodnoty: VCBO=60 V, VCEO=40 V, VEBO=6 V, IC=200 mA, Ptot=625 mW @TA=25 °C, ' +
      'TJ=+150 °C, Tstg=-55 až +150 °C. ' +
      'BVCBO min 60 V @IC=10 µA. BVCEO min 40 V @IC=1 mA. BVEBO min 6 V @IE=10 µA. ' +
      'ICEX max 50 nA @VCE=30 V/VEB=3 V. IEBO max 50 nA @VEB=3 V. ' +
      'VCE(sat) max 200 mV @IC=10 mA/IB=1 mA; max 300 mV @IC=50 mA/IB=5 mA. ' +
      'VBE(sat) 650–850 mV @IC=10 mA/IB=1 mA; max 950 mV @IC=50 mA/IB=5 mA. ' +
      'hFE: min 40 @IC=0,1 mA, min 70 @IC=1 mA, 100–300 @IC=10 mA, min 60 @IC=50 mA, min 30 @IC=100 mA ' +
      '(vždy @VCE=1 V). ' +
      'fT min 300 MHz @VCE=20 V/IE=10 mA/f=100 MHz. Cob max 4 pF @VCB=10 V. Cib max 8 pF @VEB=0,5 V. ' +
      'Spínací časy (VCC=3 V, IC=10 mA, IB1=1 mA): td max 35 ns, tr max 35 ns, tstg max 200 ns, tf max 50 ns.',
    tags: 'tranzistor,npn,bipolární,to-92,2n3904,spínací,zesilovací',
  },
  { name: 'S8050', packageType: 'TO-92', value: 'NPN, 25 V, 700 mA', notes: 'Malovýkonový bipolární tranzistor', tags: 'tranzistor,npn,bipolární' },
  {
    name: 'KTC3542T',
    packageType:
      'SMD, miniaturní pouzdro (KEC "TSM", cca 2,9 × 1,6 × 1,0 mm) — vývody: 1=emitor, 2=báze, 3=kolektor',
    value: 'NPN, VCEO 30 V, IC 3 A (DC), hFE 200–560 (@ IC=500 mA)',
    schematicImage: 'KTC3542T.jpg',
    notes:
      'SMD spínací/výkonový tranzistor pro relé, žárovky, motory a blesky (strobe aplikace) — ' +
      'datasheet KEC, 2001. PNP komplement: KTA1542T. ' +
      'Mezní hodnoty: VCBO=40 V, VCEO=30 V, VEBO=5 V, IC(DC)=3 A, IC(pulzně)=5 A, IB max=600 mA, ' +
      'PC=0,9 W (na keramické destičce 600 mm²×0,8 mm — bez takového chlazení výrazně méně), ' +
      'TJ max 150 °C, Tstg -55 až +150 °C. ' +
      'ICBO max 0,1 µA @VCB=30 V. IEBO max 0,1 µA @VEB=4 V (velmi nízký únikový proud). ' +
      'VCE(sat) @IC=1,5 A/IB=30 mA: typ 120 mV, max 180 mV. @IC=1,5 A/IB=75 mA: typ 105 mV, max 155 mV. ' +
      'VBE(sat) @IC=1,5 A/IB=30 mA: typ 0,83 V, max 1,2 V. ' +
      'hFE @VCE=2 V/IC=500 mA: min 200, max 560. ' +
      'fT @VCE=10 V/IC=500 mA: typ 450 MHz. Cob=20 pF typ @VCB=10 V/f=1 MHz. ' +
      'Spínací časy: ton typ 30 ns, tstg (storage) typ 300 ns, tf typ 15 ns — rychlé spínání.',
    tags: 'tranzistor,npn,bipolární,smd,spínací,relé,motor,žárovka,ktc3542t,kta1542t',
  },

  {
    name: 'BC557',
    packageType: 'TO-92 — vývody: 1=kolektor, 2=báze, 3=emitor',
    value: 'PNP, VCEO 45 V, IC 100 mA, hFE 75–800 (@ IC=2 mA, tříděno A/B/C)',
    schematicImage: 'BC557.jpg',
    notes:
      'PNP komplement k BC546/BC547 (řada BC556/557/558/559). Elektrické parametry ' +
      'dle datasheetu HSMC HBC557 (ekvivalent/druhý zdroj BC557), hodnoty v PNP konvenci ' +
      'záporné, zde uvedeny jako velikost: VCBO=50 V, VCEO=45 V, VEBO=5 V, IC=100 mA, ' +
      'PD=500 mW @Ta=25 °C, TJ max 150 °C, Tstg -55 až +150 °C. ' +
      'ICBO max 100 nA @VCB=20 V. IEBO max 1 µA @VEB=5 V. ' +
      'VBE(on) @IC=2 mA/VCE=5 V: 600–750 mV. @IC=10 mA/VCE=5 V: max 820 mV. ' +
      'VCE(sat) @IC=10 mA/IB=1 mA: max 300 mV. @IC=100 mA/IB=10 mA: max 650 mV. ' +
      'hFE @VCB=5 V/IC=2 mA: 75–800 (třídy: A 125–260, B 240–500, C 420–800, Normal 75–260). ' +
      'fT @VCE=5 V/IC=10 mA/f=100 MHz: typ 300 MHz. Cob=4,5 pF typ @VCB=10 V. ' +
      'Pouzdro TO-92, vývody 1=kolektor, 2=báze, 3=emitor (stejné pořadí jako Motorola BC546/547).',
    tags: 'tranzistor,pnp,bipolární,to-92,zesilovací,bc557,hbc557',
  },
  { name: 'BC558', packageType: 'TO-92', value: 'PNP, 30 V, 100 mA', notes: 'Malovýkonový bipolární tranzistor', tags: 'tranzistor,pnp,bipolární' },
  { name: 'BC559', packageType: 'TO-92', value: 'PNP, 30 V, 100 mA', notes: 'Malovýkonový bipolární tranzistor', tags: 'tranzistor,pnp,bipolární' },
  {
    name: '2N2907',
    packageType:
      'TO-18 — vývody: 1=emitor, 2=báze, 3=kolektor (kolektor je spojen s kovovým pouzdrem/case!)',
    value: 'PNP, 40 V, 600 mA',
    schematicImage: '2N2221A.jpg',
    notes:
      'Malovýkonový bipolární tranzistor. Pořadí vývodů (1=E, 2=B, 3=K) a spojení kolektoru s pouzdrem ' +
      'odvozeno z konvence TO-18 dle MIL-PRF-19500/255 pro rodinu 2N222x/2N29xx ve stejném pouzdře ' +
      '(Microchip DS00005314A) — ověř u konkrétního kusu, výrobci se u starších tranzistorů mohou lišit.',
    tags: 'tranzistor,pnp,bipolární',
  },
  {
    name: 'MMBT2907A',
    packageType:
      'SOT-23 (SMD) — POZOR, jiné číslování vývodů než THT pouzdra: 1=emitor, 2=báze, 3=kolektor',
    value: 'PNP, VCEO 60 V, VCBO 60 V, IC(trvalý) 600 mA, hFE 75–300',
    notes:
      'SMD (SOT-23) verze tranzistoru 2N2907A, PNP komplement k MMBT2222A. Datasheet ' +
      'STMicroelectronics, únor 2003 (preliminary data). Hodnoty v datasheetu jsou v PNP ' +
      'konvenci záporné, zde uvedeny jako velikost. ' +
      'Mezní hodnoty: VCBO=60 V, VCEO=60 V, VEBO=5 V, IC(trvalý)=600 mA, ICM (špičkově, tp<5 ms)=800 mA, ' +
      'Ptot=350 mW @Tamb=25 °C, Tj max 150 °C, Tstg -65 až +150 °C. ' +
      'Rthj-amb=357,1 °C/W (na DPS ploše 1 cm²). ' +
      'ICEX max 50 nA @VCE=30 V/VBE=3 V. IBEX max 50 nA. ICBO max 10 nA @VCB=50 V. ' +
      'V(BR)CEO min 60 V @IC=10 mA. V(BR)CBO min 60 V @IC=10 µA. V(BR)EBO min 5 V @IE=10 µA. ' +
      'VCE(sat) @IC=150 mA/IB=15 mA: max 0,4 V. @IC=500 mA/IB=50 mA: max 1,6 V. ' +
      'VBE(sat) @IC=150 mA/IB=15 mA: max 1,3 V. @IC=500 mA/IB=50 mA: max 2,6 V. ' +
      'hFE: @IC=0,1 mA min 75; @1 mA min 100; @10 mA min 100; @150 mA min 100, max 300; @500 mA min 50. ' +
      'fT @IC=50 mA/VCE=20 V/f=100 MHz: typ 200 MHz. ' +
      'CCBO=8 pF max @VCB=10 V. CEBO=30 pF max @VEB=2 V. ' +
      'Spínací časy (IC=150 mA, IB=15 mA, VCC=30 V): td=10 ns, tr=40 ns, ton=45 ns, ts=190 ns, ' +
      'tf=30 ns, toff=220 ns.',
    tags: 'tranzistor,pnp,bipolární,sot-23,smd,zesilovací,spínací,mmbt2907a,2n2907a',
  },
  {
    name: '2N3906',
    packageType: 'TO-92, 3 vývody: 1=emitor, 2=báze, 3=kolektor (pohled zepředu na popsanou stranu)',
    value: 'PNP, VCEO -40 V, IC -200 mA, hFE 100–300 (@ IC=-10 mA)',
    schematicImage: '2N3906.jpg',
    notes:
      'Malovýkonový bipolární PNP tranzistor pro obecné spínací a zesilovací aplikace — komplementární ' +
      'k 2N3904. Datasheet GTM Corporation (jejich verze „G2N3906"), vydán 2004, revize 2005/06/24. ' +
      'Hodnoty v datasheetu jsou v PNP konvenci záporné, zde uvedeny stejně. ' +
      'Mezní hodnoty: VCBO=-40 V, VCEO=-40 V, VEBO=-5 V, IC=-200 mA, Ptot=625 mW @TA=25 °C, ' +
      'TJ=+150 °C, Tstg=-55 až +150 °C. ' +
      'BVCBO min -40 V @IC=-10 µA. BVCEO min -40 V @IC=-1 mA. BVEBO min -5 V @IE=-10 µA. ' +
      'ICEX max -50 nA @VCE=-30 V/VEB=-3 V. IEBO max -50 nA @VEB=-3 V. ' +
      'VCE(sat) max -0,25 V @IC=-10 mA/IB=-1 mA; max -0,4 V @IC=-50 mA/IB=-5 mA. ' +
      'VBE(sat) -0,65 až -0,85 V @IC=-10 mA/IB=-1 mA; max -0,95 V @IC=-50 mA/IB=-5 mA. ' +
      'hFE: min 60 @IC=-0,1 mA, min 80 @IC=-1 mA, 100–300 @IC=-10 mA, min 60 @IC=-50 mA, ' +
      'min 30 @IC=-100 mA (vždy @VCE=-1 V). ' +
      'fT min 250 MHz @VCE=-20 V/IE=-10 mA/f=100 MHz. Cob max 4,5 pF @VCB=-10 V. Cib max 10 pF @VEB=-0,5 V. ' +
      'Spínací časy (VCC=-3 V, IC=-10 mA, IB1=-1 mA): td max 35 ns, tr max 35 ns, tstg max 225 ns, ' +
      'tf max 75 ns.',
    tags: 'tranzistor,pnp,bipolární,to-92,2n3906,spínací,zesilovací',
  },
  { name: 'S8550', packageType: 'TO-92', value: 'PNP, 25 V, 700 mA', notes: 'Malovýkonový bipolární tranzistor', tags: 'tranzistor,pnp,bipolární' },
  {
    name: '2N4401',
    packageType: 'TO-92, 3 vývody: 1=emitor, 2=báze, 3=kolektor (pohled zepředu na popsanou stranu)',
    value: 'NPN, VCEO 40 V, IC 600 mA, hFE 100–300 (@ IC=150 mA)',
    schematicImage: '2N4401.jpg',
    notes:
      'Malovýkonový bipolární NPN tranzistor pro obecné spínací a zesilovací aplikace — komplementární ' +
      'k 2N4403, vyšší proudová zatížitelnost a vyšší hFE při vyšším proudu než u 2N3904. Datasheet ' +
      'GTM Corporation (jejich verze „G2N4401"), vydán 2004, revize 2004/11/29. ' +
      'Mezní hodnoty: VCBO=60 V, VCEO=40 V, VEBO=5 V, IC=600 mA, Ptot=625 mW @TA=25 °C, ' +
      'TJ=+150 °C, Tstg=-55 až +150 °C. ' +
      'BVCBO min 60 V @IC=100 µA. BVCEO min 40 V @IC=1 mA. BVEBO min 5 V @IE=10 µA. ' +
      'ICEX max 100 nA @VCE=35 V/VBE=0,4 V. ' +
      'VCE(sat) max 400 mV @IC=150 mA/IB=15 mA; max 750 mV @IC=500 mA/IB=50 mA. ' +
      'VBE(sat) 750–950 mV @IC=150 mA/IB=15 mA; max 1,2 V @IC=500 mA/IB=50 mA. ' +
      'hFE: min 20 @IB=0,1 mA, min 40 @IC=1 mA, min 80 @IC=10 mA, 100–300 @IC=150 mA (třídění: ' +
      'rank A 100–210, rank B 190–300), min 40 @IC=500 mA/VCE=2 V (ostatní @VCE=1 V). ' +
      'fT min 250 MHz @VCE=10 V/IC=20 mA/f=100 MHz. Cob max 6,5 pF @VCB=5 V/f=1 MHz.',
    tags: 'tranzistor,npn,bipolární,to-92,2n4401,spínací,zesilovací',
  },
  {
    name: '2N5551',
    packageType: 'TO-92, 3 vývody: 1=emitor, 2=báze, 3=kolektor (pohled zepředu na popsanou stranu)',
    value: 'NPN, VCEO 160 V, VCBO 180 V, IC 600 mA, hFE 80–400 (@ IC=10 mA)',
    schematicImage: '2N5551.jpg',
    notes:
      'Malovýkonový bipolární NPN tranzistor s vysokým průrazným napětím — komplementární k PNP typu ' +
      '2N5401. Datasheet GTM Corporation (jejich verze „G2N5551"), vydán 2004, revize 2004/11/29. ' +
      'Mezní hodnoty: VCBO=180 V, VCEO=160 V, VEBO=6 V, IC=600 mA, Ptot=625 mW @TA=25 °C, ' +
      'TJ=+150 °C, Tstg=-55 až +150 °C. ' +
      'BVCBO min 180 V @IC=100 µA. BVCEO min 160 V @IC=1 mA. BVEBO min 6 V @IE=10 µA. ' +
      'ICBO max 50 nA @VCB=120 V. IEBO max 50 nA @VEB=4 V. ' +
      'VCE(sat) max 0,15 V @IC=10 mA/IB=1 mA; max 0,2 V @IC=50 mA/IB=5 mA. ' +
      'VBE(sat) max 1 V @IC=10 mA/IB=1 mA i @IC=50 mA/IB=5 mA. ' +
      'hFE (@VCE=5 V): min 80 @IC=1 mA, 80–400 (typ 160) @IC=10 mA (třídění: rank A 80–200, ' +
      'rank N 100–250, rank C 160–400), min 50 @IC=50 mA. ' +
      'fT min 100 (typ 300) MHz @VCE=10 V/IC=10 mA/f=100 MHz. Cob max 6 pF @VCB=10 V/f=1 MHz.',
    tags: 'tranzistor,npn,bipolární,to-92,2n5551,vysokonapěťový,zesilovací,spínací',
  },

  {
    name: 'TIP120',
    packageType:
      'TO-220, 4 vývody: 1=báze, 2=kolektor, 3=emitor, 4=kolektor ' +
      '(chladicí ploška pouzdra je elektricky spojená s kolektorem!)',
    value: 'NPN Darlington, VCEO(sus) 60 V (min), IC 5 A (trvale), hFE min 1000',
    schematicImage: 'TIP120.jpg',
    notes:
      'Monolitický Darlington s integrovaným rezistorem báze-emitor a vestavěnou ochrannou ' +
      '(zpětnou) diodou mezi kolektorem a emitorem — vhodný pro přímé spínání induktivní zátěže ' +
      '(relé, motor, solenoid) z mikrokontroléru přes bázový rezistor, bez nutnosti externí ' +
      'flyback diody. Srovnání 2 datasheetů: MOSPEC a originál Motorola TIP120/D (1995) pro rodinu ' +
      'TIP120/121/122 (NPN) a PNP komplement TIP125/126/127 — TIP120/125 mají nejnižší napěťovou ' +
      'třídu rodiny (TIP121/126=80 V, TIP122/127=100 V). ' +
      'Mezní hodnoty: VCEO=VCBO=60 V, VEBO=5,0 V, IC(trvalý)=5,0 A, ICM (špičkově)=8,0 A, ' +
      'IB max=120 mA (shoda obou zdrojů). ' +
      'Ptot=65 W @TC=25 °C na nekonečném chladiči (odvod 0,52 W/°C), ale jen 2,0 W @TA=25 °C bez ' +
      'chladiče na volném vzduchu (odvod 0,016 W/°C, dle Motoroly) — bez chladiče je reálný výkon ' +
      'mnohem nižší, než sugeruje headline hodnota 65 W. TJ/Tstg=-65 až +150 °C. ' +
      'RθJC=1,92 °C/W (shoda), RθJA=62,5 °C/W (Motorola). ' +
      'Energie neomezené induktivní zátěže (avalanche) E=50 mJ @IC=1 A, L=100 mH, PRF=10 Hz, ' +
      'VCC=20 V, RBE=100 Ω (Motorola) — orientační limit, kolik energie z cívky/relé zvládne pohltit ' +
      'vestavěná ochranná dioda/přechod bez poškození. ' +
      'ICEO max 0,5 mA @VCE=30 V. ICBO max 0,2 mA @VCB=60 V. IEBO max 2,0 mA @VEB=5 V (shoda obou zdrojů). ' +
      'hFE (DC, pulzní test): min 1000 @IC=0,5 A i @IC=3,0 A/VCE=3,0 V; typicky 2500 @IC=4,0 A ' +
      '(dle Motoroly, výrazně vyšší než minimum, běžné u Darlingtonů). ' +
      'VCE(sat) max 2,0 V @IC=3,0 A/IB=12 mA; max 4,0 V @IC=5,0 A/IB=20 mA. ' +
      'VBE(on) max 2,5 V @IC=3,0 A/VCE=3,0 V. hfe (malý signál) min 4,0 @IC=3,0 A/VCE=4,0 V/f=1 MHz (shoda). ' +
      'Cob @VCB=10 V/f=0,1 MHz: dle MOSPEC max 300 pF (NPN 120/121/122) / 250 pF (PNP 125/126/127); ' +
      'dle originální Motoroly max 200 pF (NPN) / 300 pF (PNP) — zdroje si u této hodnoty odporují, ' +
      'ber jako orientační řádovou hodnotu (řádově stovky pF). ' +
      '⚠️ Chladicí ploška (pin 4 i kovový tab) je na potenciálu kolektoru — při montáži na uzemněný ' +
      'nebo sdílený chladič použij izolační podložku, pokud kolektor není na zemním potenciálu.',
    tags: 'tranzistor,npn,bipolární,darlington,to-220,tip120,spínací,relé,motor,pozor-chladič',
  },
  { name: 'TIP125', packageType: 'TO-220', value: 'PNP Darlington, 60 V, 5 A', notes: 'Darlington tranzistor', tags: 'tranzistor,pnp,darlington' },
  {
    name: '2N6299SMD',
    packageType:
      'SMD (TO-276AA „SMD05" nebo TO-276AB „SMD1", dle varianty) — Pad 1=báze, Pad 2=kolektor, Pad 3=emitor',
    value: 'PNP Darlington, VCEO 80 V, IC 8 A (trvale), hFE 750–18 000 (@ IC=4 A)',
    schematicImage: '2N6299SMD.jpg',
    notes:
      'Výkonový PNP Darlington v SMD pouzdru, monolitická konstrukce s vestavěným rezistorem ' +
      'báze-emitor. NPN komplement: 2N6301SMD (shodné parametry, opačná polarita). Datasheet Semelab ' +
      'plc, dokument č. 2660. ' +
      'Mezní hodnoty: VCEO=80 V, VCBO=80 V, VEBO=5 V, IC(trvalý)=8 A, ICM (špičkově)=16 A, IB max=120 mA, ' +
      'Ptot=75 W @TC=25 °C (odvod 0,428 W/°C), TJ/Tstg=-65 až +200 °C. ' +
      'VCEO(sus) min 80 V @IC=100 mA/IB=0. ICEO max 0,5 mA @VCE=40 V/IB=0. ICEX max 0,5 mA @VCE=VCB/ ' +
      'VBE(off)=1,5 V (max 5 mA @TC=150 °C). IEBO max 2 mA @VBE=5 V. ' +
      'hFE (extrémně vysoký, typické pro dvojitý Darlington) @VCE=3 V/IC=4 A: min 750, max 18 000. ' +
      '@VCE=3 V/IC=8 A: min 100. ' +
      'VCE(sat) max 2,0 V @IC=4 A/IB=16 mA; max 3,0 V @IC=8 A/IB=80 mA. VBE(sat) max 4,0 V @IC=8 A/IB=80 mA. ' +
      'VBE(on) max 2,8 V @VCE=3 V/IC=4 A. Cob max 200 pF @VCB=10 V/f=0,1 MHz. ' +
      '|hfe| (malý signál) min 25, max 350 @VCE=3 V/IC=3 A/f=1 MHz; hfe min 300 @f=1 kHz.',
    tags: 'tranzistor,pnp,bipolární,darlington,smd,2n6299,2n6301',
  },
  {
    name: 'D44E3',
    packageType:
      'TO-220AB, 4 vývody: 1=báze, 2=kolektor, 3=emitor, 4=montážní ploška ' +
      '(elektricky spojená s kolektorem!)',
    value: 'NPN Darlington, VCEO 80 V, IC 10 A (trvale), hFE min 1000 (@ IC=5 A)',
    schematicImage: 'D44E3.jpg',
    notes:
      'Velmi vysokozisková NPN Darlington výkonová "Silicon Power Pac" — driver, regulátor, budič relé/ ' +
      'solenoidu, audio výstup. Vyrobena epitaxním base procesem se 2 integrovanými rezistory a 1 diodou ' +
      'pro stabilitu a ochranu (dle Central Semiconductor) — podobně jako TIP120, vhodná pro přímé ' +
      'spínání induktivní zátěže. Srovnání 2 datasheetů: New Jersey Semi-Conductor Products (starší) a ' +
      'Central Semiconductor Corp (2014, R1). D44E3 má nejvyšší napěťovou třídu rodiny (D44E1=40 V, ' +
      'D44E2=60 V, D44E3=80 V — VCEO/VCES, shoda obou zdrojů). ' +
      'Mezní hodnoty: VCEO=VCES=80 V, VEBO=7 V, IC(trvalý)=10 A (shoda), IB(trvalý) max=1 A (shoda). ' +
      'ICM (špičkově, 50% střída, 25 ms puls)=20 A (jen NJSC). ' +
      'Ptot: 80 W (Central, bez upřesnění podmínek) / 50 W @TC=25 °C na pouzdru, jen 1,67 W @TA=25 °C ' +
      'na volném vzduchu bez chladiče (NJSC) — zdroje se liší, drž se konzervativnější (nižší) hodnoty ' +
      'bez ověřeného chlazení. RθJC=1,56 °C/W (Central) / 2,5 °C/W (NJSC) — také rozdíl mezi zdroji. ' +
      'RθJA=75 °C/W (NJSC). TJ/Tstg=-65/-55 až +150 °C. Teplota vývodu max 260 °C (NJSC, 1/16"±1/32" ' +
      'od pouzdra, 10 s). ' +
      'hFE @IC=5 A/VCE=5 V: min 1000 (shoda obou zdrojů). ' +
      'VCE(sat) max 1,5 V @IC=5 A/IB=10 mA; max 3,0 V @IC=10 A/IB=20 mA (shoda obou zdrojů — velmi ' +
      'konzistentní parametr). VBE(sat) max 2,5 V @IC=5 A/IB=10 mA (shoda). ' +
      'ICES max 500 µA @VCE=rated VCES, 25 °C (Central) / max 10 µA @25 °C, max 1,0 mA @150 °C (NJSC) — ' +
      'nekonzistentní, ber jako orientační řádovou hodnotu. ' +
      'IEBO @VEB=7 V: max 5,0 mA (Central) / max 1,0 µA (NJSC) — výrazný rozpor mezi zdroji (možný ' +
      'překlep v jednom z listů), neber doslovně, ověř na konkrétním kusu. ' +
      'Cob/CCBO @VCB=10 V/f=1 MHz: max 200 pF (Central) / max 130 pF (NJSC). ' +
      'Spínací časy (IC=10 A, IB=20 mA): ton max 1,0 µs (Central) odpovídá NJSC td+tr max 0,6 µs; ' +
      'toff max 2,5 µs (Central) přesně odpovídá součtu NJSC ts (2,0 µs) + tf (0,5 µs). ' +
      '⚠️ Montážní ploška (pin 4) je na potenciálu kolektoru — při montáži na uzemněný/sdílený chladič ' +
      'použij izolační podložku, pokud kolektor není na zemním potenciálu.',
    tags: 'tranzistor,npn,bipolární,darlington,to-220,d44e3,relé,pozor-chladič',
  },
  {
    name: 'BC517',
    packageType:
      'TO-92 — vývody: 1=kolektor, 2=báze, 3=emitor (3L, rovné nebo ohnuté vývody dle balení)',
    schematicImage: 'BC517.jpg',
    value:
      'NPN Darlington, VCEO 30 V, IC 1,2 A (trvale, dle ON Semiconductor), hFE min 30 000 ' +
      '(@ IC=20 mA)',
    notes:
      'Vysoce ziskový NPN Darlington pro obecné použití (např. citlivé spínání malým bázovým ' +
      'proudem). ⚠️ Doplněno podle oficiálního datasheetu ON Semiconductor BC517-D74Z/D rev. 2 ' +
      '(září 2017), který nahrazuje dříve zpracovaný datasheet HSMC HBC517 (ekvivalent/druhý ' +
      'zdroj) — rozdíly mezi oběma zdroji jsou označeny níže. ⚠️ Trvalý kolektorový proud IC podle ' +
      'ON Semiconductor je 1,2 A (HSMC uváděl jen 500 mA — výrazně nižší, konzervativnější ' +
      'hodnota; při návrhu doporučeno vycházet z přísnější hodnoty 500 mA, pokud není potvrzen ' +
      'konkrétní výrobce součástky). Mezní hodnoty (ON Semiconductor): VCBO=40 V, VCEO=30 V, ' +
      'VEBO=10 V, IC=1,2 A, TJ/Tstg=-55 až +150 °C. PD=625 mW @TA=25 °C (odvod 5,0 mW/°C nad ' +
      '25 °C), RθJC=83,3 °C/W, RθJA=200 °C/W (údaje o tepelném odporu v HSMC datasheetu chyběly). ' +
      '⚠️ ICBO max 100 nA @VCB=30 V/IE=0 (HSMC uváděl max 1 µA @VCB=40 V — desetinásobně vyšší ' +
      'hodnota při jiném testovacím napětí). VEBO (breakdown) min 10 V @IE=100 nA. VCEO ' +
      '(breakdown) min 30 V @IC=2,0 mA/IB=0. hFE min 30 000 @IC=20 mA/VCE=2 V (⚠️ HSMC udával ' +
      'stejnou min. hodnotu, ale při jiném testovacím proudu IC=100 mA). ⚠️ VCE(sat) max 1 V ' +
      '@IC=100 mA/IB=0,1 mA (HSMC uváděl týž max 1 V, ale při desetinásobně vyšším IB=1 mA — ' +
      'přísnější podmínka u ON Semiconductor naznačuje vyšší skutečný proudový zisk). VBE(on) ' +
      'max 1,4 V @IC=10 mA/VCE=5,0 V (jiný parametr/testovací bod než dříve uvedené VBE(sat) typ ' +
      '1,5 V/max 2 V @IC=100 mA/IB=1 mA z HSMC — obě platí, jde o odlišné pracovní body). Datasheet ' +
      'ON Semiconductor neuvádí konkrétní číselnou hodnotu fT ani Cob (jen grafy) — dříve uvedené ' +
      'hodnoty fT typ 220 MHz a Cob typ 5 pF (z HSMC) ponechány, nejsou v rozporu s grafem Gain ' +
      'Bandwidth Product (špička cca 350 MHz kolem IC=50 mA).',
    tags: 'tranzistor,npn,bipolární,darlington,to-92,bc517,hbc517,onsemi',
  },

  {
    name: 'TIP41C',
    packageType:
      'TO-220, 4 vývody: 1=báze, 2=kolektor, 3=emitor, 4=kolektor ' +
      '(chladicí ploška pouzdra je elektricky spojená s kolektorem!)',
    value: 'NPN, VCEO(sus) 100 V (min), IC 6 A (trvale), hFE 15–75 (@ IC=3 A)',
    schematicImage: 'TIP41C.jpg',
    notes:
      'Výkonový bipolární tranzistor, PNP komplement TIP42C. Datasheet MOSPEC pro rodinu ' +
      'TIP41/41A/41B/41C (NPN) a TIP42/42A/42B/42C (PNP) — TIP41C/42C má nejvyšší napěťovou třídu ' +
      'rodiny (TIP41=40 V, TIP41A=60 V, TIP41B=80 V, TIP41C=100 V). ' +
      'Mezní hodnoty: VCEO=VCBO=100 V, VEBO=5,0 V, IC(trvalý)=6 A, ICM (špičkově)=10 A, IB max=2 A, ' +
      'Ptot=65 W @TC=25 °C (odvod 0,52 W/°C), TJ/Tstg=-65 až +150 °C. RθJC=1,92 °C/W. ' +
      'ICEO max 0,7 mA @VCE=60 V. ICES max 0,4 mA @VCE=100 V/VEB=0. IEBO max 1,0 mA @VEB=5 V. ' +
      'hFE: min 30 @IC=0,3 A/VCE=4 V; min 15, max 75 @IC=3,0 A/VCE=4 V. ' +
      'VCE(sat) max 1,5 V @IC=6,0 A/IB=600 mA. VBE(on) max 2,0 V @IC=6,0 A/VCE=4,0 V. ' +
      'fT min 3,0 MHz @IC=500 mA/VCE=10 V/f=1 MHz. hfe (malý signál) min 20 @IC=500 mA/VCE=10 V/f=1 kHz. ' +
      '⚠️ Chladicí ploška (pin 4 i kovový tab) je na potenciálu kolektoru — při montáži na uzemněný ' +
      'nebo sdílený chladič použij izolační podložku, pokud kolektor není na zemním potenciálu.',
    tags: 'tranzistor,npn,bipolární,výkonový,to-220,tip41c,pozor-chladič',
  },
  {
    name: 'TIP33C',
    packageType: 'TO-247 (3 vývody): 1=báze, 2=kolektor, 3=emitor',
    value: 'NPN, VCEO(sus) 100 V (min), IC 10 A (trvale), hFE 20–100 (@ IC=3 A)',
    schematicImage: 'TIP33C.jpg',
    notes:
      'Výkonový bipolární tranzistor pro vysoké proudy, PNP komplement TIP34C. Datasheet MOSPEC pro ' +
      'rodinu TIP33/33A/33B/33C (NPN) a TIP34/34A/34B/34C (PNP) — TIP33C/34C má nejvyšší napěťovou ' +
      'třídu rodiny (TIP33=40 V, TIP33A=60 V, TIP33B=80 V, TIP33C=100 V). ' +
      'Mezní hodnoty: VCEO=VCBO=100 V, VEBO=5,0 V, IC(trvalý)=10 A, ICM (špičkově)=15 A, IB max=3,0 A, ' +
      'Ptot=80 W @TC=25 °C (odvod 0,64 W/°C), TJ/Tstg=-65 až +150 °C. RθJC=1,56 °C/W. ' +
      'ICEO max 0,7 mA @VCE=60 V. ICES max 0,4 mA @VCE=100 V/VEB=0. IEBO max 1,0 mA @VEB=5 V. ' +
      'hFE: min 40 @IC=1,0 A/VCE=4 V; min 20, max 100 @IC=3,0 A/VCE=4 V. ' +
      'VCE(sat) max 1,0 V @IC=3,0 A/IB=0,3 A; max 4,0 V @IC=10 A/IB=2,5 A. ' +
      'VBE(on) max 1,6 V @IC=3,0 A/VCE=4,0 V; max 3,0 V @IC=10 A/VCE=4,0 V. ' +
      'fT min 3,0 MHz @IC=500 mA/VCE=10 V/f=1 MHz. hfe (malý signál) min 20 @IC=500 mA/VCE=10 V/f=1 kHz. ' +
      'Datasheet navíc udává bezpečnou oblast při zpětném zatížení (Reverse Bias SOA) pro spínání ' +
      'induktivní zátěže (L=200 µH, IC/IB≥5, VBE(off)=0–5 V, TC<100 °C) — viz graf, orientačně do ~15 A ' +
      'při nižším VCE, klesající s napětím. ' +
      '⚠️ U výkonových tranzistorů v TO-247 bývá kovová chladicí ploška spojená s kolektorem (typické ' +
      'pro toto pouzdro) — před montáží na sdílený/uzemněný chladič ověř multimetrem a případně použij ' +
      'izolační podložku.',
    tags: 'tranzistor,npn,bipolární,výkonový,to-247,tip33c,pozor-chladič',
  },
  {
    name: 'TIP29C',
    packageType:
      'TO-220 (3 vývody): 1=báze, 2=kolektor, 3=emitor — POZOR, prostřední pin (kolektor) je ' +
      'přímo spojen s montážní/chladicí ploškou (na rozdíl od 4vývodových TIP41C/TIP120)',
    value: 'NPN, VCEO 100 V, VCBO 140 V, IC 1 A (trvale), hFE 15–75 (@ IC=1 A)',
    schematicImage: 'TIP29C.jpg',
    notes:
      'Výkonový spínací/zesilovací tranzistor navržený pro komplementární použití s řadou TIP30 (PNP). ' +
      'Datasheet Power Innovations Ltd. (1997, staré TI označení). TIP29C má nejvyšší napěťovou třídu ' +
      'rodiny (TIP29=40/80 V, TIP29A=60/100 V, TIP29B=80/120 V, TIP29C=100/140 V — VCEO/VCBO). ' +
      'Mezní hodnoty: VCEO=100 V, VCBO=140 V, VEBO=5 V, IC(trvalý)=1 A, ICM (špičkově, tp≤0,3 ms)=3 A, ' +
      'IB max=0,4 A. Ptot=30 W @TC=25 °C (odvod 0,24 W/°C) / jen 2 W @TA=25 °C na volném vzduchu bez ' +
      'chladiče (odvod 16 mW/°C). TJ/Tstg=-65 až +150 °C. Teplota vývodu max 250 °C (3,2 mm od pouzdra, 10 s). ' +
      'RθJC=4,17 °C/W, RθJA=62,5 °C/W. ' +
      'Energie neomezené induktivní zátěže ½LIC²=32 mJ (L=20 mH, IB(on)=0,4 A, RBE=100 Ω, VBE(off)=0, ' +
      'RS=0,1 Ω, VCC=20 V). ' +
      'ICES max 0,2 mA @VCE=140 V/VBE=0. ICEO max 0,3 mA @VCE=60 V/IB=0. IEBO max 1 mA @VEB=5 V. ' +
      'hFE: min 40 @IC=0,2 A/VCE=4 V; min 15, max 75 @IC=1 A/VCE=4 V. ' +
      'VCE(sat) max 0,7 V @IB=125 mA/IC=1 A. VBE max 1,3 V @VCE=4 V/IC=1 A. ' +
      'hfe (malý signál) min 20 @IC=0,2 A/VCE=10 V/f=1 kHz; |hfe| min 3 @f=1 MHz. ' +
      'Spínací časy (odporová zátěž, IC=1 A): ton typ 0,5 µs, toff typ 2 µs.',
    tags: 'tranzistor,npn,bipolární,výkonový,to-220,tip29c,pozor-chladič',
  },
  {
    name: 'BD243C',
    packageType:
      'TO-220 (3 vývody): 1=báze, 2=kolektor, 3=emitor — POZOR, prostřední pin (kolektor) je ' +
      'přímo spojen s montážní/chladicí ploškou (na rozdíl od 4vývodových TIP41C/TIP120)',
    value: 'NPN, VCEO 100 V, VCER 115 V, IC 6 A (trvale), hFE min 15 (@ IC=3 A)',
    schematicImage: 'BD243C.jpg',
    notes:
      'Výkonový spínací/zesilovací tranzistor navržený pro komplementární použití s řadou BD244 (PNP). ' +
      'Datasheet Power Innovations Ltd. (1997, staré TI označení), stejná konstrukční řada jako TIP29/TIP30. ' +
      'BD243C má nejvyšší napěťovou třídu rodiny (BD243=45/55 V, BD243A=60/70 V, BD243B=80/90 V, ' +
      'BD243C=100/115 V — VCEO/VCER). ' +
      'Mezní hodnoty: VCEO=100 V (@IC=30 mA), VCER=115 V (s odporem báze-emitor RBE=100 Ω — vyšší než ' +
      'prosté VCEO), VEBO=5 V, IC(trvalý)=6 A, ICM (špičkově, tp≤0,3 ms)=10 A, IB max=3 A. ' +
      'Ptot=65 W @TC=25 °C (odvod 0,52 W/°C) / jen 2 W @TA=25 °C na volném vzduchu bez chladiče ' +
      '(odvod 16 mW/°C). TJ/Tstg=-65 až +150 °C. Teplota vývodu max 250 °C (3,2 mm od pouzdra, 10 s). ' +
      'RθJC=1,92 °C/W, RθJA=62,5 °C/W. ' +
      'Energie neomezené induktivní zátěže ½LIC²=62,5 mJ (L=20 mH, IB(on)=0,4 A, RBE=100 Ω, VBE(off)=0, ' +
      'RS=0,1 Ω, VCC=20 V). ' +
      'ICES max 0,4 mA @VCE=115 V/VBE=0. ICEO max 0,7 mA @VCE=60 V/IB=0. IEBO max 1 mA @VEB=5 V. ' +
      'hFE: min 30 @IC=0,3 A/VCE=4 V; min 15 @IC=3 A/VCE=4 V (bez udaného maxima). ' +
      'VCE(sat) max 1,5 V @IB=1 A/IC=6 A. VBE max 2 V @VCE=4 V/IC=6 A. ' +
      'hfe (malý signál) min 20 @IC=0,5 A/VCE=10 V/f=1 kHz; |hfe| min 3 @f=1 MHz. ' +
      'Spínací časy (odporová zátěž, IC=1 A): ton typ 0,3 µs, toff typ 1 µs.',
    tags: 'tranzistor,npn,bipolární,výkonový,to-220,bd243c,pozor-chladič',
  },
  {
    name: 'TIP3055',
    packageType:
      'TO-247 (dříve i SOT-93/TO-218, od 6/2012 jen TO-247) — vývody: 1=báze, 2=kolektor, ' +
      '3=emitor, 4=kolektor (u TO-218/TO-247 stejné jako chladicí ploška)',
    value: 'NPN, VCEO 60 V, IC 15 A (trvale), hFE 20–70 (@ IC=4 A)',
    schematicImage: 'TIP3055.jpg',
    notes:
      'Plastová/výkonová obdoba klasického 2N3055 (stejná elektrická rodina — datasheet ON ' +
      'Semiconductor odkazuje na charakteristické křivky 2N3055), PNP komplement TIP2955. ' +
      'Od června 2012 dodáváno pouze v pouzdru TO-247 (FPCN#16827), dříve i SOT-93/TO-218. ' +
      'Mezní hodnoty: VCEO=60 V, VCER=70 V (s RBE=100 Ω), VCB=100 V, VEB=7 V, IC(trvalý)=15 A, ' +
      'IB max=7 A, Ptot=90 W @TC=25 °C (odvod 0,72 W/°C), TJ/Tstg=-65 až +150 °C. ' +
      'RθJC=1,39 °C/W, RθJA=35,7 °C/W. ' +
      'VCEO(sus) min 60 V @IC=30 mA/IB=0. ICER max 1,0 mA @VCE=70 V/RBE=100 Ω. ' +
      'ICEO max 0,7 mA @VCE=30 V/IB=0. ICEV max 5,0 mA @VCE=100 V/VBE(off)=1,5 V. ' +
      'IEBO max 5,0 mA @VEB=7 V. ' +
      'hFE @IC=4 A/VCE=4 V: min 20, max 70. @IC=10 A/VCE=4 V: min 5. ' +
      'VCE(sat) max 1,1 V @IC=4 A/IB=400 mA; max 3,0 V @IC=10 A/IB=3,3 A. VBE(on) max 1,8 V @IC=4 A/VCE=4 V. ' +
      'Druhý průraz (second breakdown): Is/b min 3,0 A @VCE=30 V, t=1,0 s (nonrepetitivní). ' +
      'fT min 2,5 MHz @IC=0,5 A/VCE=10 V/f=1 MHz. hfe (malý signál) min 15 @VCE=4 V/IC=1 A/f=1 kHz. ' +
      '⚠️ U TO-218/TO-247 varianty je chladicí ploška/pin 4 spojena s kolektorem — při montáži na ' +
      'sdílený/uzemněný chladič použij izolační podložku, pokud kolektor není na zemním potenciálu.',
    tags: 'tranzistor,npn,bipolární,výkonový,to-247,to-218,tip3055,tip2955',
  },
  {
    name: '2N3055',
    packageType: 'TO-3 — vývody: 1=báze, 2=emitor, 3=kolektor (kolektor je spojen s kovovým pouzdrem/case!)',
    value: 'NPN, VCEO 60 V, IC 15 A (trvale), hFE 20–70 (@ IC=4 A)',
    notes:
      'Klasický výkonový tranzistor pro obecné zesilovací a spínací aplikace. Datasheet Multicomp Pro ' +
      '(2019), pouzdro TO-3. ' +
      'Mezní hodnoty: VCEO=60 V, VCEX=70 V (s reverzní bází), VCBO=100 V, VEBO=7 V, IC(trvalý)=15 A, ' +
      'IB max=7 A, Ptot=115 W @TC=25 °C (odvod 0,657 W/°C), TJ/Tstg=-65 až +150 °C. RθJC=1,52 °C/W. ' +
      'VCEO(sus) min 60 V @IC=200 mA/IB=0. VCER(sus) min 70 V @IC=200 mA/RBE=100 Ω. ' +
      'ICEO max 0,7 mA @VCE=30 V/IB=0. ICEX max 1 mA @VCE=100 V/VBE(off)=1,5 V (max 5 mA @TC=150 °C). ' +
      'IEBO max 5 mA @VEB=7 V. ' +
      'hFE @IC=4 A/VCE=4 V: min 20, max 70. @IC=10 A/VCE=4 V: min 5. ' +
      'VCE(sat) max 1,1 V @IC=4 A/IB=0,4 A; max 3 V @IC=10 A/IB=3,3 A. VBE(sat) max 1,5 V @IC=4 A/VCE=4 V. ' +
      'fT min 2,5 MHz @IC=500 mA/VCE=10 V/f=1 MHz. hfe (malý signál) min 15, max 120 @IC=1 A/VCE=4 V/f=1 MHz. ' +
      '⚠️ Pouzdro TO-3 nemá izolovanou patici — kolektor je přímo spojen s kovovým tělem tranzistoru; ' +
      'při montáži na společný chladič s jinými součástkami použij izolační podložku a průchodku.',
    tags: 'tranzistor,npn,bipolární,výkonový,to-3,2n3055,pozor-chladič',
  },
  {
    name: 'BD135',
    packageType: 'SOT-32 (=TO-126), vývody: 1=báze, 2=kolektor, 3=emitor',
    value: 'NPN, VCEO 45 V, IC 1,5 A (špičkově 3 A), hFE 40–250 @IC=150 mA',
    notes:
      'STMicroelectronics BD135/BD136/BD139/BD140 "Complementary low voltage transistor" ' +
      '(dok. DS, rev. 5, květen 2008) — čtveřice komplementárních tranzistorů pro audio ' +
      'zesilovače a budiče v komplementárním/kvazikomplementárním zapojení: NPN BD135/BD139, ' +
      'komplementární PNP BD136/BD140. Zpracována celá rodina z jednoho datasheetu. BD135 = ' +
      'nižší napěťová třída (45 V), NPN komplement k BD136 (samostatný záznam). Mezní hodnoty: ' +
      'VCBO=VCEO=45 V, VEBO=5 V, IC=1,5 A (trvale), ICM=3 A (špičkově), IB=0,5 A, ' +
      'Ptot=12,5 W @Tcase≤25 °C (1,25 W @Tamb≤25 °C), Tstg -65 až 150 °C, TJ max 150 °C. ' +
      'RθJC=10 °C/W, RθJA=100 °C/W. ICBO max 0,1 µA @VCB=30 V (10 µA @TC=125 °C). ' +
      'IEBO max 10 µA @VEB=5 V. VCEO(sus) min 45 V @IC=30 mA. VCE(sat) max 0,5 V @IC=0,5 A/' +
      'IB=0,05 A. VBE max 1 V @IC=0,5 A/VCE=2 V. hFE: min 25 @IC=5 mA/VCE=2 V, min 40 max 250 ' +
      '@IC=150 mA/VCE=2 V, min 25 @IC=0,5 A/VCE=2 V (vše pulzně, 300 µs/1,5 % duty). Dostupné ' +
      'i gain-selected varianty BD135-16 (hFE 100–250 @150 mA, stejné jinak) — pokud je gain-bin ' +
      'kritický, je nutné objednat konkrétní suffix.',
    tags: 'tranzistor,npn,bipolární,výkonový,sot-32,to-126,bd135,audio',
  },
  {
    name: 'BD139',
    packageType: 'SOT-32 (=TO-126), vývody: 1=báze, 2=kolektor, 3=emitor',
    value: 'NPN, VCEO 80 V, IC 1,5 A (špičkově 3 A), hFE 40–250 @IC=150 mA',
    notes:
      'STMicroelectronics BD135/BD136/BD139/BD140 "Complementary low voltage transistor" ' +
      '(dok. DS, rev. 5, květen 2008) — součást stejné rodiny jako BD135/BD136/BD140 (samostatné ' +
      'záznamy). BD139 = vyšší napěťová třída (80 V) oproti BD135 (45 V), jinak identické ' +
      'elektrické parametry a pouzdro; NPN komplement k BD140 (samostatný záznam). Mezní hodnoty: ' +
      'VCBO=VCEO=80 V, VEBO=5 V, IC=1,5 A (trvale), ICM=3 A (špičkově), IB=0,5 A, ' +
      'Ptot=12,5 W @Tcase≤25 °C (1,25 W @Tamb≤25 °C), Tstg -65 až 150 °C, TJ max 150 °C. ' +
      'RθJC=10 °C/W, RθJA=100 °C/W. ICBO max 0,1 µA @VCB=30 V (10 µA @TC=125 °C). ' +
      'IEBO max 10 µA @VEB=5 V. VCEO(sus) min 80 V @IC=30 mA. VCE(sat) max 0,5 V @IC=0,5 A/' +
      'IB=0,05 A. VBE max 1 V @IC=0,5 A/VCE=2 V. hFE: min 25 @IC=5 mA/VCE=2 V, min 40 max 250 ' +
      '@IC=150 mA/VCE=2 V, min 25 @IC=0,5 A/VCE=2 V (vše pulzně, 300 µs/1,5 % duty). Dostupné i ' +
      'gain-selected varianty BD139-10 (hFE 63–160 @150 mA) a BD139-16 (hFE 100–250 @150 mA).',
    tags: 'tranzistor,npn,bipolární,výkonový,sot-32,to-126,bd139,audio',
  },

  { name: 'TIP42C', packageType: 'TO-220', value: 'PNP, 100 V, 6 A', notes: 'Výkonový bipolární tranzistor', tags: 'tranzistor,pnp,výkonový' },
  {
    name: 'BD136',
    packageType: 'SOT-32 (=TO-126), vývody: 1=báze, 2=kolektor, 3=emitor',
    value: 'PNP, VCEO -45 V, IC -1,5 A (špičkově -3 A), hFE 40–250 @IC=-150 mA',
    notes:
      'STMicroelectronics BD135/BD136/BD139/BD140 "Complementary low voltage transistor" ' +
      '(dok. DS, rev. 5, květen 2008) — součást stejné rodiny jako BD135/BD139/BD140 (samostatné ' +
      'záznamy). BD136 = PNP komplement k BD135 (nižší napěťová třída, 45 V), stejné pouzdro a ' +
      'parametry jako NPN protějšek, jen opačná polarita. Mezní hodnoty: VCBO=VCEO=-45 V, ' +
      'VEBO=-5 V, IC=-1,5 A (trvale), ICM=-3 A (špičkově), IB=-0,5 A, Ptot=12,5 W @Tcase≤25 °C ' +
      '(1,25 W @Tamb≤25 °C), Tstg -65 až 150 °C, TJ max 150 °C. RθJC=10 °C/W, RθJA=100 °C/W. ' +
      'ICBO max -0,1 µA @VCB=-30 V (-10 µA @TC=125 °C). IEBO max -10 µA @VEB=-5 V. VCEO(sus) ' +
      'min -45 V @IC=-30 mA. VCE(sat) max -0,5 V @IC=-0,5 A/IB=-0,05 A. VBE max -1 V @IC=-0,5 A/' +
      'VCE=-2 V. hFE: min 25 @IC=-5 mA/VCE=-2 V, min 40 max 250 @IC=-150 mA/VCE=-2 V, min 25 ' +
      '@IC=-0,5 A/VCE=-2 V (vše pulzně, 300 µs/1,5 % duty). Dostupné i gain-selected varianta ' +
      'BD136-16 (hFE 100–250 @-150 mA).',
    tags: 'tranzistor,pnp,bipolární,výkonový,sot-32,to-126,bd136,audio',
  },
  {
    name: 'BD140',
    packageType: 'SOT-32 (=TO-126), vývody: 1=báze, 2=kolektor, 3=emitor',
    value: 'PNP, VCEO -80 V, IC -1,5 A (špičkově -3 A), hFE 40–250 @IC=-150 mA',
    notes:
      'STMicroelectronics BD135/BD136/BD139/BD140 "Complementary low voltage transistor" ' +
      '(dok. DS, rev. 5, květen 2008) — součást stejné rodiny jako BD135/BD136/BD139 (samostatné ' +
      'záznamy). BD140 = PNP komplement k BD139 (vyšší napěťová třída, 80 V), stejné pouzdro a ' +
      'parametry jako NPN protějšek, jen opačná polarita. Mezní hodnoty: VCBO=VCEO=-80 V, ' +
      'VEBO=-5 V, IC=-1,5 A (trvale), ICM=-3 A (špičkově), IB=-0,5 A, Ptot=12,5 W @Tcase≤25 °C ' +
      '(1,25 W @Tamb≤25 °C), Tstg -65 až 150 °C, TJ max 150 °C. RθJC=10 °C/W, RθJA=100 °C/W. ' +
      'ICBO max -0,1 µA @VCB=-30 V (-10 µA @TC=125 °C). IEBO max -10 µA @VEB=-5 V. VCEO(sus) ' +
      'min -80 V @IC=-30 mA. VCE(sat) max -0,5 V @IC=-0,5 A/IB=-0,05 A. VBE max -1 V @IC=-0,5 A/' +
      'VCE=-2 V. hFE: min 25 @IC=-5 mA/VCE=-2 V, min 40 max 250 @IC=-150 mA/VCE=-2 V, min 25 ' +
      '@IC=-0,5 A/VCE=-2 V (vše pulzně, 300 µs/1,5 % duty). Dostupné i gain-selected varianty ' +
      'BD140-10 (hFE 63–160 @-150 mA) a BD140-16 (hFE 100–250 @-150 mA).',
    tags: 'tranzistor,pnp,bipolární,výkonový,sot-32,to-126,bd140,audio',
  },

  {
    name: 'H5N6001P',
    packageType:
      'TO-3P — vývody: 1=gate, 2=drain, 3=source (chladicí ploška je spojena s drainem)',
    value: 'N-MOSFET, VDSS 600 V, ID 20 A (@TC=25 °C), RDS(on) max 0,38 Ω (@VGS=10 V)',
    notes:
      'ISC (Inchange Semiconductor) "H5N6001P — N-Channel MOSFET Transistor" datasheet. Výkonový ' +
      'vysokonapěťový spínací N-MOSFET pro DC/DC měniče, obecné průmyslové aplikace a řízení ' +
      'výkonových motorů. Mezní hodnoty: VDSS=600 V, VGS=±30 V (trvale), ID=20 A (trvalý proud, ' +
      '@TC=25°C), IDM=80 A (jednorázový pulz), Ptot=150 W (@TC=25°C), TJ max 150 °C, Tstg -55 až ' +
      '+150 °C. RθJC max 0,83 °C/W. ' +
      'BVDSS min 600 V @VGS=0/ID=10 mA. IDSS max 1 µA @VDS=600 V/VGS=0. IGSS max ±100 nA ' +
      '@VGS=±20V/VDS=0. VGS(th) 3,0–4,0 V @VDS=VGS/ID=1 mA. RDS(on) max 0,38 Ω @VGS=10 V/ID=10 A. ' +
      'VSD (dioda těla) max 1,4 V @IS=20 A/VGS=0.',
    tags: 'tranzistor,mosfet,n-kanál,výkonový,to-3p,isc,inchange,h5n6001p,600v',
  },

  {
    name: 'IRF540N',
    packageType:
      'TO-220AB — vývody: 1=gate, 2=drain, 3=source (chladicí ploška je spojena s drainem)',
    schematicImage: 'IRF540N.jpg',
    value: 'N-MOSFET, VDSS 100 V, ID 33 A (@TC=25 °C), RDS(on) typ 0,033 Ω (max 0,040 Ω @VGS=10 V)',
    notes:
      'Výkonový spínací N-MOSFET s nízkým odporem v sepnutém stavu. Datasheet Intersil, 2000. ' +
      'Mezní hodnoty: VDSS=100 V, VDGR=100 V (RGS=20 kΩ), VGS=±20 V, ID(trvalý)=33 A @TC=25 °C ' +
      '(klesá na 23 A @TC=100 °C — viz graf odvodu proudu s teplotou). Ptot=120 W @TC=25 °C ' +
      '(odvod 0,80 W/°C), TJ/Tstg=-55 až +175 °C. ' +
      'RθJC max 1,25 °C/W (na chladiči), RθJA max 62 °C/W (bez chladiče). ' +
      'BVDSS min 100 V @ID=250 µA/VGS=0 V. IDSS max 1 µA @VDS=95 V (max 250 µA @TC=150 °C). ' +
      'IGSS max ±100 nA @VGS=±20 V. VGS(th) (prahové napětí) 2–4 V @ID=250 µA. ' +
      'RDS(on) typ 0,033 Ω, max 0,040 Ω @ID=33 A/VGS=10 V. ' +
      'Spínací časy @VGS=10 V (VDD=50 V, ID=33 A, RGS=9,1 Ω): tON max 100 ns (td(on) typ 9,5 ns, ' +
      'tr typ 57 ns), tOFF max 145 ns (td(off) typ 40 ns, tf typ 55 ns). ' +
      'Náboj hradla: Qg(tot) typ 66 max 79 nC (VGS=0→20 V), Qg(10) typ 35 max 42 nC (0→10 V), ' +
      'Qgs typ 5,4 nC, Qgd (Miller) typ 13 nC. ' +
      'Kapacity @VDS=25 V/VGS=0 V/f=1 MHz: Ciss typ 1220 pF, Coss typ 295 pF, Crss typ 100 pF. ' +
      'Vnitřní tělesová (body) dioda: VSD max 1,25 V @ISD=33 A (max 1,00 V @17 A); ' +
      'trr max 112 ns, QRR max 400 nC @ISD=33 A/dISD/dt=100 A/µs — pomalejší než diskrétní Schottky/ ' +
      'usměrňovací diody, u rychlého spínání induktivní zátěže zvaž externí rychlou diodu.',
    tags: 'tranzistor,mosfet,n-kanál,to-220,irf540n,spínací',
  },
  {
    name: 'IRF540NS',
    schematicImage: 'IRF540NS.jpg',
    packageType:
      'D2Pak (SMD) — POZOR, jiné pouzdro než TO-220 „IRF540N"! Vývody/pady: 1=gate, 2=drain, 3=source. ' +
      'Nízkoprofilová THT varianta stejné elektrické rodiny: IRF540NL v pouzdře TO-262.',
    value: 'N-MOSFET, VDSS 100 V, ID 33 A (@TC=25 °C), RDS(on) max 44 mΩ (@ID=16 A)',
    notes:
      'International Rectifier HEXFET, i přes podobný název odlišný díl od TO-220 „IRF540N" (Intersil) — ' +
      'jiné pouzdro (D2Pak SMD / TO-262 nízkoprofilové THT) a RDS(on) měřeno při jiném proudu (16 A ' +
      'místo 33 A). Datasheet International Rectifier, 2004 (PD-95130). ' +
      'Mezní hodnoty: VDSS=100 V, VGS=±20 V, ID=33 A @TC=25 °C (23 A @TC=100 °C), IDM (pulzně)=110 A, ' +
      'Ptot=130 W @TC=25 °C (odvod 0,87 W/°C), IAR (lavinový proud)=16 A, EAR (opakovatelná lavinová ' +
      'energie)=13 mJ, dv/dt (špičkové zotavení diody)=7,0 V/ns, TJ/Tstg=-55 až +175 °C. ' +
      'RθJC max 1,15 °C/W, RθJA max 40 °C/W (na DPS 1" čtverec, FR-4/G-10). ' +
      'V(BR)DSS min 100 V @ID=250 µA. RDS(on) max 44 mΩ @VGS=10 V/ID=16 A. VGS(th) 2,0–4,0 V @ID=250 µA. ' +
      'gfs (transkonduktance) min 21 S @VDS=50 V/ID=16 A. ' +
      'IDSS max 25 µA @VDS=100 V (max 250 µA @VDS=80 V/TJ=150 °C). IGSS max ±100 nA @VGS=±20 V. ' +
      'Náboj hradla: Qg max 71 nC @ID=16 A, Qgs max 14 nC, Qgd max 21 nC. ' +
      'Spínání (VDD=50 V, ID=16 A, RG=5,1 Ω): td(on) typ 11 ns, tr typ 35 ns, td(off) typ 39 ns, tf typ 35 ns. ' +
      'Kapacity @f=1 MHz: Ciss typ 1960 pF, Coss typ 250 pF, Crss typ 40 pF. ' +
      'Lavinová energie EAS: max 185 mJ (vypočtený rating, TJ=175 °C) — typ 700 mJ je destruktivní ' +
      'testovací hodnota mimo doporučené meze, neber jako běžně použitelný limit. ' +
      'Tělesová dioda: IS(trvalý)=33 A, ISM(pulzně)=110 A. VSD max 1,2 V @IS=16 A. ' +
      'trr typ 115, max 170 ns @IF=16 A. Qrr typ 505, max 760 nC @di/dt=100 A/µs.',
    tags: 'tranzistor,mosfet,n-kanál,smd,d2pak,irf540ns,irf540nl,spínací',
  },
  { name: 'IRFZ44N', packageType: 'TO-220', value: 'N-MOSFET, 55 V, 49 A', notes: 'Výkonový spínací MOSFET', tags: 'tranzistor,mosfet,n-kanál' },
  {
    name: 'IRLZ44',
    packageType: 'TO-220 — vývody: 1=gate, 2=drain, 3=source',
    value: 'N-MOSFET (logic level), VDSS 60 V, ID 35 A (@TC=25 °C), RDS(on) max 0,04 Ω (@VGS=5 V!)',
    notes:
      '⚠️ LOGIC LEVEL MOSFET — na rozdíl od podobně znějícího IRFZ44N (běžný gate, potřebuje VGS okolo ' +
      '10 V pro plné sepnutí) má IRLZ44 nízké prahové napětí VGS(th)=1,0–2,0 V a RDS(on) je garantováno ' +
      'už při VGS=5,0 V — lze tedy přímo spínat z výstupu mikrokontroléru/logiky (5 V) bez budiče hradla. ' +
      'Datasheet Samsung Electronics. Sourozenec IRLZ40 má nižší VDSS=50 V, jinak identické parametry. ' +
      'Mezní hodnoty: VDSS=60 V, VDGR=60 V (RGS=1 MΩ), VGS=±15 V, ID(trvalý)=35 A @TC=25 °C ' +
      '(27 A @TC=100 °C), IDM (pulzně)=140 A, Ptot=150 W @TC=25 °C (odvod 1,0 W/°C), TJ/Tstg=-55 až +175 °C. ' +
      'RθJC max 1,0 °C/W, RθCS (pouzdro-chladič, greased) typ 0,5 °C/W, RθJA max 62,5 °C/W (volný vzduch). ' +
      'BVDSS min 60 V @ID=250 µA/VGS=0 V. VGS(th) 1,0–2,0 V @ID=1 mA. ' +
      'IGSS max ±100 nA @VGS=±15 V. IDSS max 250 µA @VDS=max/VGS=0 V (max 1000 µA @TC=125 °C). ' +
      'RDS(on) max 0,04 Ω @VGS=5,0 V/ID=18 A. gfs min 15,0 S @VDS≥15 V/ID=18 A. ' +
      'Ciss typ 2400 pF, Coss typ 795 pF, Crss typ 390 pF @VDS=25 V/f=1 MHz. ' +
      'Spínání (VDD=0,5×BVDSS, ID=3,5 A, Zo=9,1 Ω): td(on) typ 25 max 40 ns, tr typ 65 max 85 ns, ' +
      'td(off) typ 350 max 400 ns, tf typ 180 max 200 ns (spínací časy prakticky nezávislé na teplotě). ' +
      'Qg(tot) max 80 nC @VGS=5 V/ID=35 A, Qgs typ 20 nC, Qgd typ 30 nC (náboj hradla nezávislý na teplotě). ' +
      'Tělesová dioda: IS(trvalý)=35 A, ISM(pulzně)=140 A. VSD max 2,5 V @IS=35 A/VGS=0 V (poměrně vysoký ' +
      'úbytek oproti jiným MOSFETům). trr max 600 ns @IF=35 A/dIF/dt=100 A/µs. ' +
      '⚠️ Nezaměňovat s „IRLZ44N" (International Rectifier) — podobný název, ale novější/výkonnější díl ' +
      's jinými parametry, viz samostatná položka.',
    tags: 'tranzistor,mosfet,n-kanál,to-220,irlz44,irlz40,logic-level,spínací',
  },
  {
    name: 'IRLZ44N',
    packageType: 'TO-220AB, 4 vývody: 1=gate, 2=drain, 3=source, 4=drain (chladicí ploška = drain)',
    value: 'N-MOSFET (logic level), VDSS 55 V, ID 47 A (@TC=25 °C), RDS(on) max 0,022 Ω (@VGS=10 V)',
    schematicImage: 'IRLZ44N.jpg',
    notes:
      '⚠️ POZOR na záměnu tří podobně znějících dílů: „IRFZ44N" (běžný gate, potřebuje ~10 V pro plné ' +
      'sepnutí), „IRLZ44" (Samsung, logic level, 60 V/35 A, RDS(on) max 0,04 Ω) a tento „IRLZ44N" ' +
      '(International Rectifier, 5. generace HEXFET, logic level) — každý má jiné parametry! ' +
      'Datasheet International Rectifier (PD-94831). Logic-level: RDS(on) garantováno už při VGS=5,0 V, ' +
      'lze spínat přímo z výstupu mikrokontroléru/logiky. ' +
      'Mezní hodnoty: VDSS=55 V, VGS=±16 V, ID(trvalý)=47 A @TC=25 °C (33 A @TC=100 °C), ' +
      'IDM (pulzně)=160 A, Ptot=110 W @TC=25 °C (odvod 0,71 W/°C), TJ/Tstg=-55 až +175 °C. ' +
      'EAS (jednorázová lavinová energie)=210 mJ. IAR (lavinový proud)=25 A, EAR (opakovatelná lavinová ' +
      'energie)=11 mJ. dv/dt (špičkové zotavení diody)=5,0 V/ns. ' +
      'RθJC max 1,4 °C/W, RθCS typ 0,50 °C/W, RθJA max 62 °C/W. ' +
      'V(BR)DSS min 55 V @ID=250 µA. VGS(th) 1,0–2,0 V @ID=250 µA. ' +
      'RDS(on): max 0,022 Ω @VGS=10 V/ID=25 A; max 0,025 Ω @VGS=5,0 V/ID=25 A; max 0,035 Ω @VGS=4,0 V/ID=21 A. ' +
      'gfs min 21 S @VDS=25 V/ID=25 A. IDSS max 25 µA @VDS=55 V (max 250 µA @TJ=150 °C). ' +
      'IGSS max ±100 nA @VGS=±16 V. ' +
      'Qg(tot) max 48 nC @ID=25 A, Qgs typ 8,6 nC, Qgd typ 25 nC @VGS=5,0 V. ' +
      'Spínání (VDD=28 V, ID=25 A, VGS=5,0 V, RG=3,4 Ω): td(on) typ 11 ns, tr typ 84 ns, ' +
      'td(off) typ 26 ns, tf typ 15 ns. ' +
      'Kapacity @f=1 MHz: Ciss typ 1700 pF, Coss typ 400 pF, Crss typ 150 pF. ' +
      'Tělesová dioda: IS(trvalý)=47 A, ISM(pulzně)=160 A. VSD max 1,3 V @IS=25 A ' +
      '(výrazně nižší úbytek než u Samsung IRLZ44). trr typ 80, max 120 ns @IF=25 A/di/dt=100 A/µs. ' +
      'Qrr typ 210, max 320 nC.',
    tags: 'tranzistor,mosfet,n-kanál,to-220,irlz44n,logic-level,spínací',
  },
  {
    name: 'IRF3205',
    packageType:
      'TO-220AB, 4 vývody: 1=gate, 2=drain, 3=source, 4=drain (chladicí ploška = drain)',
    schematicImage: 'IRF3205.jpg',
    value: 'N-MOSFET, VDSS 55 V, ID 110 A (viz poznámka o reálném limitu), RDS(on) max 8,0 mΩ',
    notes:
      '⚠️ Hlavičková hodnota ID=110 A je dle datasheetu jen vypočtená hodnota na základě max. teploty ' +
      'přechodu — reálné omezení pouzdrem (vývody/bondovací drátky) je 75 A (viz graf max. proudu vs. ' +
      'teplota pouzdra, "LIMITED BY PACKAGE"). Pro dimenzování počítej s 75 A, ne se 110 A. ' +
      'Datasheet International Rectifier, 2001 (kvalifikováno i pro automotive Q101). ' +
      'Mezní hodnoty: VDSS=55 V, VGS=±20 V, ID(trvalý)=80 A @TC=100 °C, IDM (pulzně)=390 A, ' +
      'Ptot=200 W @TC=25 °C (odvod 1,3 W/°C), TJ/Tstg=-55 až +175 °C. ' +
      'IAR (lavinový proud)=62 A, EAR (opakovatelná lavinová energie)=20 mJ, dv/dt=5,0 V/ns. ' +
      'RθJC max 0,75 °C/W, RθCS typ 0,50 °C/W, RθJA max 62 °C/W. ' +
      'V(BR)DSS min 55 V @ID=250 µA. VGS(th) 2,0–4,0 V @ID=250 µA. RDS(on) max 8,0 mΩ @VGS=10 V/ID=62 A. ' +
      'gfs min 44 S @VDS=25 V/ID=62 A. IDSS max 25 µA @VDS=55 V (max 250 µA @TJ=150 °C). ' +
      'IGSS max ±100 nA @VGS=±20 V. ' +
      'Qg(tot) max 146 nC @ID=62 A, Qgs typ 35 nC, Qgd typ 54 nC. ' +
      'Spínání (VDD=28 V, ID=62 A, RG=4,5 Ω): td(on) typ 14 ns, tr typ 101 ns, td(off) typ 50 ns, tf typ 65 ns. ' +
      'Kapacity @f=1 MHz: Ciss typ 3247 pF, Coss typ 781 pF, Crss typ 211 pF. ' +
      'EAS (jednorázová lavinová energie): max 264 mJ (vypočtený rating, TJ=175 °C) — typ 1050 mJ je ' +
      'destruktivní testovací hodnota mimo doporučené meze, neber jako běžně použitelný limit. ' +
      'Tělesová dioda: IS(trvalý)=110 A, ISM(pulzně)=390 A. VSD max 1,3 V @IS=62 A. ' +
      'trr typ 69, max 104 ns @IF=62 A/di/dt=100 A/µs. Qrr typ 143, max 215 nC.',
    tags: 'tranzistor,mosfet,n-kanál,to-220,irf3205,spínací,pozor-proud',
  },
  { name: '2N7000', packageType: 'TO-92', value: 'N-MOSFET, 60 V, 200 mA', notes: 'Malovýkonový spínací MOSFET', tags: 'tranzistor,mosfet,n-kanál' },
  {
    name: 'BSS138PS',
    packageType:
      'SMD plastové pouzdro SOT363 (SC-88), 6 vývodů, rozteč e1=1,3 mm — piny zkříženě: ' +
      '1=S1, 2=G1, 3=D2, 4=S2, 5=G2, 6=D1 (dva nezávislé tranzistory, NE v jednoduchém pořadí ' +
      '1-2-3=tranzistor1)',
    value:
      'Duální N-MOSFET (2× nezávislý tranzistor v jednom pouzdře), logic-level, VDS 60 V, ' +
      'VGS ±20 V, ID 320 mA/tranzistor (@Tamb=25 °C), RDS(on) max 1,6 Ω (@VGS=10 V/ID=300 mA)',
    notes:
      'Nexperia "BSS138PS — 60 V, 320 mA dual N-channel Trench MOSFET" (dok. Rev.1, 2.11.2010) — ' +
      '⚠️ NOVÝ TYP součástky v této knihovně: první DUÁLNÍ MOSFET (dvě nezávislé N-MOSFET struktury ' +
      'v jednom pouzdře) — na rozdíl od jednotlivých MOSFETů jako 2N7000/IRFZ44N výše obsahuje ' +
      'BSS138PS dva samostatné tranzistory s vlastním gate/drain/source, ale sdíleným pouzdrem ' +
      'SOT363 (6 vývodů), což šetří místo na DPS. Elektricky příbuzný velmi rozšířenému jednoduchému ' +
      'N-MOSFETu BSS138 (stejná Trench technologie/čip) — ten je oblíbený jako obousměrný I2C/' +
      'logický level-shifter (5V↔3,3V); BSS138PS nabízí rovnou dva takové tranzistory pohromadě. ' +
      'Logic-level kompatibilní (plně sepnutý i při VGS=5 V — RDS(on) max 2 Ω/typ 1 Ω @VGS=5V/' +
      'ID=50mA), velmi rychlé spínání, AEC-Q101 kvalifikovaný pro automotive. ' +
      'Mezní hodnoty na tranzistor: VDS max 60 V, VGS max ±20 V, ID max 320 mA (@Tamb=25 °C, ' +
      'standardní footprint; 200 mA @100 °C), IDM (pulzní, 10 µs) max 1,2 A. ' +
      'Ztrátový výkon: 280 mW/tranzistor (standardní footprint) až 320 mW (plocha pro drain 1 cm²), ' +
      '420 mW na celé pouzdro (oba tranzistory). Tj max 150 °C, Tamb -55 až +150 °C. ' +
      'VGS(th) (práh sepnutí) 0,9–1,5 V (typ 1,2 V) @ID=250 µA. ' +
      'RDS(on) typ 0,9 Ω/max 1,6 Ω @VGS=10V/ID=300mA (typ 1 Ω/max 2 Ω @VGS=5V/ID=50mA). ' +
      'IDSS (unikání) max 1 µA @VDS=60V/VGS=0V/Tj=25°C (max 10 µA @Tj=150°C). ' +
      'Vlastní zpětná source-drain dioda: VSD typ 0,75 V (max 1,1 V) @IS=115 mA. ' +
      'Aplikace dle výrobce: relé driver, vysokorychlostní line driver, low-side load switch, ' +
      'obecné spínací obvody.',
    tags:
      'tranzistor,mosfet,n-kanál,duální,logic-level,nexperia,bss138ps,bss138,sot363,sc-88,' +
      'trench,level-shifter',
  },

  {
    name: 'IRF9540',
    packageType: 'TO-220',
    value: 'P-MOSFET, -100 V, -19 A',
    notes:
      'Výkonový spínací MOSFET. Existuje i novější/mírně odlišný díl „IRF9540N" (5. generace HEXFET, ' +
      'ID=-23 A, RDS(on)=0,117 Ω) — viz samostatná položka, pokud máš konkrétně tuto verzi.',
    tags: 'tranzistor,mosfet,p-kanál',
  },
  {
    name: 'IRF9540N',
    packageType: 'TO-220AB, 4 vývody: 1=gate, 2=drain, 3=source, 4=drain (chladicí ploška = drain)',
    value: 'P-MOSFET, VDSS -100 V, ID -23 A (@TC=25 °C), RDS(on) max 0,117 Ω (@VGS=-10 V)',
    schematicImage: 'IRF9540N.jpg',
    notes:
      '5. generace HEXFET od International Rectifier — odlišný/novější díl od generického „IRF9540" ' +
      '(ten má ID=-19 A). Hodnoty v datasheetu jsou v P-kanálové konvenci záporné, zde uvedeny stejně. ' +
      'Mezní hodnoty: VDSS=-100 V, VGS=±20 V, ID(trvalý)=-23 A @TC=25 °C (-16 A @TC=100 °C), ' +
      'IDM (pulzně)=-76 A, Ptot=140 W @TC=25 °C (odvod 0,91 W/°C), TJ/Tstg=-55 až +175 °C. ' +
      'EAS (jednorázová lavinová energie)=430 mJ. IAR (lavinový proud)=-11 A, EAR (opakovatelná ' +
      'lavinová energie)=14 mJ. dv/dt=-5,0 V/ns. ' +
      'RθJC max 1,1 °C/W, RθCS typ 0,50 °C/W, RθJA max 62 °C/W. ' +
      'V(BR)DSS min -100 V @ID=-250 µA. VGS(th) -2,0 až -4,0 V @ID=-250 µA. ' +
      'RDS(on) max 0,117 Ω @VGS=-10 V/ID=-11 A. gfs min 5,3 S @VDS=-50 V/ID=-11 A. ' +
      'IDSS max -25 µA @VDS=-100 V (max -250 µA @TJ=150 °C). IGSS max ±100 nA @VGS=±20 V. ' +
      'Qg(tot) max 97 nC @ID=-11 A, Qgs typ 15 nC, Qgd typ 51 nC. ' +
      'Spínání (VDD=-50 V, ID=-11 A, RG=5,1 Ω): td(on) typ 15 ns, tr typ 67 ns, td(off) typ 51 ns, tf typ 51 ns. ' +
      'Kapacity @f=1 MHz: Ciss typ 1300 pF, Coss typ 400 pF, Crss typ 240 pF. ' +
      'Tělesová dioda: IS(trvalý)=-23 A, ISM(pulzně)=-76 A. VSD max -1,6 V @IS=-11 A. ' +
      'trr typ 150, max 220 ns @IF=-11 A/di/dt=-100 A/µs. Qrr typ 830, max 1200 nC.',
    tags: 'tranzistor,mosfet,p-kanál,to-220,irf9540n,spínací',
  },
  {
    name: 'IRF9540NS',
    schematicImage: 'IRF9540NS.jpg',
    packageType:
      'D2Pak (SMD, „IRF9540NS") nebo TO-262 (nízkoprofilová THT, „IRF9540NL") — POZOR, jiné pouzdro ' +
      'než TO-220 „IRF9540N"! Vývody/pady: 1=gate, 2=drain, 3=source (u TO-262 i pin 4=drain).',
    value: 'P-MOSFET, VDSS -100 V, ID -23 A (@TC=25 °C), RDS(on) max 0,117 Ω — el. shodné s IRF9540N',
    notes:
      'SMD (D2Pak) a nízkoprofilová THT (TO-262) verze stejného čipu jako IRF9540N — datasheet ' +
      'International Rectifier výslovně uvádí, že elektrické charakteristiky přebírá z IRF9540N ' +
      '(shodné VDSS, ID, RDS(on), hFE, spínací časy, náboj hradla i tělesová dioda — viz záznam „IRF9540N"). ' +
      'Liší se hlavně tepelné/výkonové parametry podle pouzdra: RθJC max 1,1 °C/W (shoda), ' +
      'RθJA max 40 °C/W (D2Pak, na DPS 1" čtverec, FR-4/G-10, ustálený stav) — mnohem lepší než ' +
      'TO-220 samostatně bez chladiče. Ptot=3,8 W @TA=25 °C (D2Pak na DPS bez dalšího chlazení) / ' +
      '140 W @TC=25 °C (na chladiči, stejně jako IRF9540N). ' +
      'Ostatní mezní hodnoty a elektrické parametry (VGS=±20 V, EAS=430 mJ, IAR=-11 A, ' +
      'RDS(on) max 0,117 Ω @VGS=-10 V/ID=-11 A, VGS(th) -2 až -4 V atd.) jsou shodné s „IRF9540N" — ' +
      'viz tam pro plný výčet.',
    tags: 'tranzistor,mosfet,p-kanál,smd,d2pak,to-262,irf9540ns,irf9540nl,spínací',
  },
  {
    name: 'AFGB40T65SPD-BW',
    packageType:
      'D²PAK (TO-263AB, case 221BQ), 3 vývody: 1=gate, 2=kolektor (i chladicí TAB), 3=emitor',
    value:
      '⚠️ NOVÝ TYP součástky v této knihovně (IGBT) — Field Stop Trench IGBT, BVCES 650 V, ' +
      'VCE(sat) typ. 2,0 V @IC=40 A, IC max 120 A (pulzní), integrovaná antiparalelní rychlá dioda',
    notes:
      'onsemi "AFGB40T65SPD-BW — Field Stop Trench IGBT, 650 V, 40 A" (dok. ' +
      'AFGB40T65SPD-BW/D, rev. 1, 2026) — na rozdíl od ostatních spínacích tranzistorů v této ' +
      'knihovně (bipolární BJT, MOSFET) jde o IGBT (Insulated Gate Bipolar Transistor): hradlo ' +
      'řízené jako u MOSFETu (vysoká vstupní impedance), ale výstupní charakteristika bipolární ' +
      '(nižší úbytek napětí při vysokém proudu než srovnatelný MOSFET, na úkor pomalejšího ' +
      'vypínání) — vhodné pro vyšší napětí/proudy než běžné výkonové MOSFETy v této knihovně. ' +
      'AEC-Q101 kvalifikováno, 100 % dílů dynamicky testováno, zkratová odolnost >5 µs @25 °C, ' +
      'kladný teplotní koeficient VCE(sat) usnadňuje paralelní řazení více kusů. Copackováno s ' +
      'měkkou rychlou (soft, fast recovery) antiparalelní diodou (freewheeling). ' +
      'Mezní hodnoty: VCES=650 V, VGES=±20 V (přechodně ±30 V), IC=80 A @TC=25°C (40 A @TC=100°C), ' +
      'ICM=120 A (pulzní), IF diody=40 A @TC=25°C (20 A @TC=100°C), IFM=120 A (pulzní), ' +
      'PD=267 W @TC=25°C (134 W @TC=100°C), SCWT (short circuit withstand time)=5 µs @TC=25°C, ' +
      'TJ/Tstg=-55 až +175°C, pájecí teplota max 300°C/5s (1/8" od pouzdra). RθJC (IGBT)=0,56°C/W, ' +
      'RθJC (dioda)=1,71°C/W, RθJA=40°C/W. ' +
      'BVCES min 650 V @VGE=0/IC=1mA (teplotní koeficient +0,6 V/°C typ). ICES max 250 µA ' +
      '@VCE=VCES/VGE=0. IGES max ±400 nA. VGE(th) 4,0–7,5 V typ 5,8 V @IC=40mA. VCE(sat) typ 2,0 V ' +
      '(max 2,4 V) @IC=40A/VGE=15V/TC=25°C, typ 2,9 V @TC=125°C. ' +
      'Ciss typ 1520 pF, Coss typ 92 pF, Crss typ 15 pF @VCE=30V/VGE=0/f=1MHz. ' +
      'Spínání @TC=25°C (VCC=400V/IC=40A/RG=6Ω/VGE=15V, indukční zátěž): td(on) typ 18ns, tr typ ' +
      '26ns, td(off) typ 35ns, tf typ 10ns, Eon typ 0,97mJ, Eoff typ 0,28mJ, Ets typ 1,25mJ. ' +
      '@TC=175°C: td(on) typ 14ns, tr typ 35ns, td(off) typ 38ns, tf typ 13ns, Eon typ 1,61mJ, ' +
      'Eoff typ 0,47mJ, Ets typ 2,08mJ. Náboj hradla (VCE=400V/IC=40A/VGE=15V): Qg typ 36nC, Qge ' +
      'typ 12nC, Qgc typ 11nC. ' +
      'Integrovaná dioda: VFM typ 2,0V (max 2,7V) @IF=20A/TC=25°C, typ 1,8V @TC=175°C. Reverse ' +
      'recovery @IF=20A/diF/dt=200A/µs: trr typ 34ns/Qrr typ 56nC @TC=25°C, trr typ 206ns/Qrr typ ' +
      '731nC @TC=175°C (výrazně horší zotavení za horka). Erec typ 51µJ @TC=175°C. ' +
      'Aplikace: palubní nabíječky (OBC), kompresory klimatizace, PTC topení, pohony motorů a ' +
      'další automotive napájecí/pomocné aplikace. Pb-free, RoHS.',
    tags: 'tranzistor,igbt,field-stop-trench,onsemi,afgb40t65spd,d2pak,to-263,650v,automotive,aec-q101',
  },
  {
    name: 'IRF4905',
    packageType:
      'TO-220AB, 4 vývody: 1=gate, 2=drain, 3=source, 4=drain (chladicí ploška = drain)',
    value: 'P-MOSFET, VDSS -55 V, ID -74 A (@TC=25 °C), RDS(on) max 0,020 Ω (@VGS=-10 V)',
    schematicImage: 'IRF4905.jpg',
    notes:
      'HEXFET Power MOSFET, International Rectifier (datasheet 8/25/97). ' +
      'Mezní hodnoty: VDSS=-55 V, VGS=±20 V, ID(trvalý)=-74 A @TC=25 °C (-52 A @TC=100 °C), ' +
      'IDM (pulzně)=-260 A, Ptot=200 W @TC=25 °C (odvod 1,3 W/°C), TJ/Tstg=-55 až +175 °C. ' +
      'EAS (jednorázová lavinová energie)=930 mJ. IAR (lavinový proud)=-38 A, EAR (opakovatelná ' +
      'lavinová energie)=20 mJ. dv/dt=-5,0 V/ns. ' +
      'RθJC max 0,75 °C/W, RθCS typ 0,50 °C/W, RθJA max 62 °C/W. ' +
      'V(BR)DSS min -55 V @ID=-250 µA (ΔV(BR)DSS/ΔTJ typ -0,05 V/°C). ' +
      'VGS(th) -2,0 až -4,0 V @ID=-250 µA. RDS(on) max 0,020 Ω @VGS=-10 V/ID=-38 A. ' +
      'gfs min 21 S @VDS=-25 V/ID=-38 A. ' +
      'IDSS max -25 µA @VDS=-55 V/VGS=0 (max -250 µA @VDS=-44 V/TJ=150 °C). ' +
      'IGSS max 100 nA @VGS=20 V (fwd), max -100 nA @VGS=-20 V (rev). ' +
      'Qg(tot) max 180 nC @ID=-38 A, Qgs typ 32 nC @VDS=-44 V, Qgd typ 86 nC @VGS=-10 V. ' +
      'Spínání (VDD=-28 V, ID=-38 A, RG=2,5 Ω): td(on) typ 18 ns, tr typ 99 ns, td(off) typ 61 ns, ' +
      'tf typ 96 ns (@RD=0,72 Ω). Ciss typ 3400 pF, Coss typ 1400 pF, Crss typ 640 pF ' +
      '(@VGS=0/VDS=-25 V/f=1 MHz). ' +
      'Tělesová dioda: IS=-74 A (trvale), ISM=-260 A (pulzně), VSD max -1,6 V @IS=-38 A/VGS=0, ' +
      'trr typ 89 ns (max 130 ns) @IF=-38 A/di/dt=-100 A/µs, Qrr typ 230 (max 350) — datasheet uvádí ' +
      'jednotku µC, což je u tohoto typu náboje neobvyklé (u srovnatelných dílů bývá v nC); možná jde ' +
      'o překlep v originálním datasheetu, hodnotu proto neopravuji a jen upozorňuji.',
    tags: 'tranzistor,mosfet,p-kanál,to-220,irf4905,spínací',
  },
  {
    name: 'IRFBA1405P',
    packageType:
      'Super-220 (mechanicky kompatibilní s TO-220, ale s větším křemíkovým čipem), 3+1 vývody: ' +
      '1=gate, 2=drain, 3=source, 4=drain (chladicí ploška pouzdra = drain). JEDEC TO-273AA. ' +
      'Automotive/Q101 kvalifikace.',
    value: 'N-MOSFET, VDSS 55 V, ID 174 A⁶ (viz poznámka o reálném limitu pouzdrem), RDS(on) max 5,0 mΩ',
    notes:
      '⚠️ Hlavičková hodnota ID=174 A @TC=25 °C je dle datasheetu vypočtená na základě max. teploty ' +
      'přechodu (RθJC) — poznámka v datasheetu uvádí, že reálné omezení pouzdrem (package limitation) ' +
      'je 95 A. Pro dimenzování počítej spíše s tímto limitem než se 174 A. ' +
      'International Rectifier, Super-220™ (stejný mechanický rozměr/pinout jako TO-220, ale s větším ' +
      'čipem než TO-220 i menším než TO-247), navrženo pro automotive aplikace (EPS, ABS, stěrače, ' +
      'klimatizace), kvalifikováno dle Q101. Datasheet PD-94111, 3/1/01. ' +
      'Mezní hodnoty: VDSS=55 V, VGS=±20 V, ID(trvalý)=174 A @TC=25 °C (123 A @TC=100 °C), ' +
      'IDM (pulzně)=680 A, Ptot=330 W @TC=25 °C (odvod 2,2 W/°C), TJ=-40 až +175 °C, Tstg=-55 až +175 °C. ' +
      'EAS (jednorázová lavinová energie)=560 mJ. dv/dt=5,0 V/ns. ' +
      'RθJC max 0,45 °C/W, RθCS typ 0,50 °C/W, RθJA max 58 °C/W. ' +
      'V(BR)DSS min 55 V @VGS=0/ID=250 µA (ΔV(BR)DSS/ΔTJ typ 0,057 V/°C). ' +
      'VGS(th) 2,0–4,0 V @VDS=10 V/ID=250 µA. RDS(on) typ 4,3 max 5,0 mΩ @VGS=10 V/ID=101 A. ' +
      'gfs min 69 S @VDS=25 V/ID=110 A. ' +
      'IDSS max 20 µA @VDS=55 V/VGS=0 (max 250 µA @VDS=44 V/TJ=150 °C). ' +
      'IGSS max 200 nA (fwd @VGS=20 V), max -200 nA (rev @VGS=-20 V). ' +
      'Qg(tot) typ 170 max 260 nC @ID=101 A, Qgs typ 44 max 66 nC @VDS=44 V, ' +
      'Qgd typ 62 max 93 nC @VGS=10 V. ' +
      'Spínání (VDD=38 V, ID=110 A, RG=1,1 Ω): td(on) typ 13 ns, tr typ 190 ns, td(off) typ 130 ns, ' +
      'tf typ 110 ns. Ciss typ 5480 pF, Coss typ 1210 pF, Crss typ 280 pF (@VGS=0/VDS=25 V/f=1 MHz). ' +
      'Tělesová dioda: IS=174 A (trvale), ISM=680 A (pulzně), VSD max 1,3 V @IS=101 A/VGS=0, ' +
      'trr typ 88 ns (max 130 ns) @IF=101 A/di/dt=100 A/µs, Qrr typ 250 max 380 nC.',
    tags: 'tranzistor,mosfet,n-kanál,super-220,to-220,automotive,irfba1405p,spínací',
  },
  {
    name: 'G2N7000',
    packageType:
      'TO-92, 3 vývody: 1=source, 2=gate, 3=drain (pohled zepředu na popsanou stranu, značka „S G D")',
    value: 'N-MOSFET (logická úroveň, malý signál), VDSS 60 V, ID 200 mA, RDS(on) max 5,0 Ω @VGS=10 V',
    schematicImage: 'G2N7000.jpg',
    notes:
      'Malý spínací N-MOSFET, GTM Corporation (datasheet vydán 2004, revize 2006/10/30). ' +
      'Určen pro spínací regulátory, měniče, budiče relé a solenoidů. Elektricky kompatibilní ' +
      'ekvivalent běžného 2N7000. ' +
      'Mezní hodnoty: VDSS=60 V, VGS=±20 V (nepřerušovaně), VGS(M)=±40 V (jednorázově, tp≤50 µs), ' +
      'ID(trvalý)=200 mA, IDM (pulzně)=500 mA, Ptot=0,35 W @TA=25 °C (odvod 2,8 mW/°C), ' +
      'TJ/Tstg=-55 až +150 °C, RθJA=357 °C/W. ' +
      'V(BR)DSS min 60 V @VGS=0/ID=250 µA. VGS(th) 0,8–3,0 V @VDS=VGS/ID=1,0 mA. ' +
      'IGSS max ±100 nA @VGS=±20 V/VDS=0. IDSS max 1 µA @VDS=60 V/VGS=0. ' +
      'ID(on) min 75 mA @VGS=4,5 V/VDS=10 V. ' +
      'RDS(on) max 6,0 Ω @VGS=4,5 V/ID=75 mA; max 5,0 Ω @VGS=10 V/ID=500 mA. ' +
      'VDS(on) max 0,45 V @VGS=4,5 V/ID=75 mA; max 2,5 V @VGS=10 V/ID=500 mA. ' +
      'gfs min 100 mS @VDS=10 V/ID=200 mA. ' +
      'Ciss max 60 pF, Coss max 25 pF, Crss max 5 pF (@VDS=25 V/VGS=0/f=1 MHz). ' +
      'Spínání (VDD=15 V, ID=500 mA, RG=25 Ω, RL=30 Ω): ton max 10 ns, toff max 10 ns ' +
      '(pulzní test, šířka pulzu ≤300 µs, střída ≤2 %).',
    tags: 'tranzistor,mosfet,n-kanál,to-92,logická-úroveň,malý-signál,g2n7000,2n7000,spínací',
  },
  {
    name: 'G2N7002',
    packageType:
      'SOT-23 (SMD), 3 vývody: 1=gate, 2=source, 3=drain (pohled zepředu na popsanou stranu, značka „702")',
    value: 'N-MOSFET (SMD, malý signál), VDS 60 V, ID 500 mA, RDS(on) max 4,5 Ω @VGS=10 V',
    schematicImage: 'G2N7002.jpg',
    notes:
      '⚠️ Jiný díl než „G2N7000" (TO-92, ID=200 mA) — jde o SMD ekvivalent, elektricky odpovídá ' +
      'běžnému 2N7002, ne 2N7000. GTM Corporation (datasheet vydán 2003, revize 2006/01/17), ' +
      'Pb-free pokovení. Určen univerzálně pro komerční/průmyslové SMD aplikace. ' +
      'Mezní hodnoty: VDS=60 V, VGS=±20 V (nepřerušovaně), VGS(M)=±40 V (jednorázově, tp≤50 µs), ' +
      'ID(trvalý)=500 mA, IDM (pulzně)=800 mA, Ptot=225 mW @TA=25 °C, TJ/Tstg=-55 až +150 °C, ' +
      'RθJA=556 °C/W. ' +
      'BVDSS min 60 V @VGS=0/ID=250 µA. VGS(th) 1,0–2,5 V @VDS=2,5 V/ID=0,25 mA. ' +
      'IGSS max ±100 nA @VGS=±20 V/VDS=0. IDSS max 1 µA @VDS=60 V/VGS=0. ' +
      'ID(on) min 500 mA @VDS=7,5 V/VGS=10 V. ' +
      'RDS(on) max 5 Ω @ID=50 mA/VGS=5 V; max 4,5 Ω @ID=500 mA/VGS=10 V. ' +
      'gfs min 80 mS @VDS>2·VDS(on)/ID=200 mA. ' +
      'Ciss max 50 pF, Coss max 25 pF, Crss max 5 pF (@VDS=25 V/VGS=0/f=1 MHz).',
    tags: 'tranzistor,mosfet,n-kanál,sot-23,smd,logická-úroveň,malý-signál,g2n7002,2n7002,spínací',
  },

  {
    name: '2N5457',
    packageType: 'TO-92, 3 vývody: 1=drain, 2=source, 3=gate (pohled zepředu na popsanou stranu)',
    value: 'N-JFET, VGS(off) 0,5–6,0 V, IDSS 1,0–5,0 mA (@ VDS=15 V)',
    notes:
      'Silikonový N-kanálový JFET pro spínací a zesilovací aplikace — nejnižší proudová varianta z ' +
      'trojice 2N5457/5458/5459 (stejný datasheet, liší se jen IDSS/VGS(off)/gfs). Central ' +
      'Semiconductor, datasheet R1, 6. březen 2014. ' +
      'Mezní hodnoty: VDS=25 V, VDG=25 V, VGS=25 V (u N-kanálového JFETu se v provozu používá ' +
      'záporné VGS, mezní hodnota je udávána jako absolutní), IG=10 mA, Ptot=310 mW @TA=25 °C, ' +
      'TJ/Tstg=-65 až +150 °C. ' +
      'IGSS max 1,0 nA @VGS=15 V (max 200 nA @TA=100 °C). BVGSS min 25 V @IG=10 µA. ' +
      'VGS(off) 0,5–6,0 V @VDS=15 V/ID=10 nA. IDSS 1,0–5,0 mA @VDS=15 V. ' +
      'Crss max 3,0 pF, Ciss max 7,0 pF @VDS=15 V/VGS=0/f=1,0 MHz. ' +
      'gfs 1,0–5,0 mS (1,0K–5,0K µS) @VDS=15 V/VGS=0/f=1,0 kHz. gos max 50 µS @stejných podmínkách.',
    tags: 'tranzistor,jfet,n-kanál,to-92,2n5457,zesilovací,spínací',
  },
  {
    name: '2N5458',
    packageType: 'TO-92, 3 vývody: 1=drain, 2=source, 3=gate (pohled zepředu na popsanou stranu)',
    value: 'N-JFET, VGS(off) 1,0–7,0 V, IDSS 2,0–9,0 mA (@ VDS=15 V)',
    notes:
      'Silikonový N-kanálový JFET pro spínací a zesilovací aplikace — střední proudová varianta z ' +
      'trojice 2N5457/5458/5459 (stejný datasheet jako 2N5457, liší se IDSS/VGS(off)/gfs). Central ' +
      'Semiconductor, datasheet R1, 6. březen 2014. ' +
      'Mezní hodnoty: VDS=25 V, VDG=25 V, VGS=25 V, IG=10 mA, Ptot=310 mW @TA=25 °C, ' +
      'TJ/Tstg=-65 až +150 °C. ' +
      'IGSS max 1,0 nA @VGS=15 V (max 200 nA @TA=100 °C). BVGSS min 25 V @IG=10 µA. ' +
      'VGS(off) 1,0–7,0 V @VDS=15 V/ID=10 nA. IDSS 2,0–9,0 mA @VDS=15 V. ' +
      'Crss max 3,0 pF, Ciss max 7,0 pF @VDS=15 V/VGS=0/f=1,0 MHz. ' +
      'gfs 1,5–5,5 mS (1,5K–5,5K µS) @VDS=15 V/VGS=0/f=1,0 kHz. gos max 50 µS @stejných podmínkách.',
    tags: 'tranzistor,jfet,n-kanál,to-92,2n5458,zesilovací,spínací',
  },
  {
    name: '2N5459',
    packageType: 'TO-92, 3 vývody: 1=drain, 2=source, 3=gate (pohled zepředu na popsanou stranu)',
    value: 'N-JFET, VGS(off) 2,0–8,0 V, IDSS 4,0–16 mA (@ VDS=15 V)',
    notes:
      'Silikonový N-kanálový JFET pro spínací a zesilovací aplikace — nejvyšší proudová varianta z ' +
      'trojice 2N5457/5458/5459 (stejný datasheet jako 2N5457, liší se IDSS/VGS(off)/gfs). Central ' +
      'Semiconductor, datasheet R1, 6. březen 2014. ' +
      'Mezní hodnoty: VDS=25 V, VDG=25 V, VGS=25 V, IG=10 mA, Ptot=310 mW @TA=25 °C, ' +
      'TJ/Tstg=-65 až +150 °C. ' +
      'IGSS max 1,0 nA @VGS=15 V (max 200 nA @TA=100 °C). BVGSS min 25 V @IG=10 µA. ' +
      'VGS(off) 2,0–8,0 V @VDS=15 V/ID=10 nA. IDSS 4,0–16 mA @VDS=15 V. ' +
      'Crss max 3,0 pF, Ciss max 7,0 pF @VDS=15 V/VGS=0/f=1,0 MHz. ' +
      'gfs 2,0–6,0 mS (2,0K–6,0K µS) @VDS=15 V/VGS=0/f=1,0 kHz. gos max 50 µS @stejných podmínkách.',
    tags: 'tranzistor,jfet,n-kanál,to-92,2n5459,zesilovací,spínací',
  },
  {
    name: '2N5484',
    packageType: 'TO-92, 3 vývody (pohled zepředu): 1=gate, 2=source, 3=drain (S/D vzájemně zaměnitelné)',
    schematicImage: '2N5484.jpg',
    value: 'N-JFET (RF), VGS(off) -0,3 až -3,0 V, IDSS 1,0-5,0 mA (@ VDS=15 V)',
    notes:
      'Silikonový N-kanálový JFET pro RF zesilovače, určený primárně pro elektronické spínání ' +
      '(nízký odpor v sepnutém stavu, analog switching), Sourced from Process 50. Součást rodiny ' +
      '2N5484/5485/5486 (TO-92) a MMBF5484/5485/5486 (SOT-23) — společný datasheet, liší se jen ' +
      'VGS(off)/IDSS/gfs/NF — nejnižší proudová varianta. Fairchild Semiconductor, 1997. ' +
      'Mezní hodnoty: VDG=25 V, VGS=-25 V, IGF=10 mA, TJ/Tstg=-55 až +150 °C. ' +
      'PD=350 mW @TA=25 °C (derating 2,8 mW/°C nad 25 °C), RθJC=125 °C/W, RθJA=357 °C/W. ' +
      'V(BR)GSS min -25 V @IG=-1,0 µA/VDS=0. IGSS max -1,0 nA @VGS=-20 V/VDS=0 (max -0,2 µA @TA=100 °C). ' +
      'VGS(off) -0,3 až -3,0 V @VDS=15 V/ID=10 nA. IDSS 1,0-5,0 mA @VDS=15 V/VGS=0. ' +
      'gfs 3000-6000 µmhos @VDS=15 V/VGS=0/f=1,0 kHz. ' +
      'Ciss max 5,0 pF, Crss max 1,0 pF, Coss max 2,0 pF (@VDS=15 V/VGS=0/f=1,0 MHz). ' +
      'NF max 3,0 dB @100 MHz, typ. 4,0 dB @400 MHz (max neuveden), VDS=15 V, RG=1,0 kΩ.',
    tags: 'tranzistor,jfet,n-kanál,to-92,2n5484,rf,zesilovací,spínací',
  },
  {
    name: '2N5485',
    packageType: 'TO-92, 3 vývody (pohled zepředu): 1=gate, 2=source, 3=drain (S/D vzájemně zaměnitelné)',
    schematicImage: '2N5484.jpg',
    value: 'N-JFET (RF), VGS(off) -0,5 až -4,0 V, IDSS 4,0-10 mA (@ VDS=15 V)',
    notes:
      'Silikonový N-kanálový JFET pro RF zesilovače, určený primárně pro elektronické spínání ' +
      '(nízký odpor v sepnutém stavu, analog switching), Sourced from Process 50. Součást rodiny ' +
      '2N5484/5485/5486 (TO-92) a MMBF5484/5485/5486 (SOT-23) — společný datasheet jako 2N5484, ' +
      'liší se jen VGS(off)/IDSS/gfs/NF — střední proudová varianta. Fairchild Semiconductor, 1997. ' +
      'Mezní hodnoty: VDG=25 V, VGS=-25 V, IGF=10 mA, TJ/Tstg=-55 až +150 °C. ' +
      'PD=350 mW @TA=25 °C (derating 2,8 mW/°C nad 25 °C), RθJC=125 °C/W, RθJA=357 °C/W. ' +
      'V(BR)GSS min -25 V @IG=-1,0 µA/VDS=0. IGSS max -1,0 nA @VGS=-20 V/VDS=0 (max -0,2 µA @TA=100 °C). ' +
      'VGS(off) -0,5 až -4,0 V @VDS=15 V/ID=10 nA. IDSS 4,0-10 mA @VDS=15 V/VGS=0. ' +
      'gfs 3500-7000 µmhos @VDS=15 V/VGS=0/f=1,0 kHz. ' +
      'Ciss max 5,0 pF, Crss max 1,0 pF, Coss max 2,0 pF (@VDS=15 V/VGS=0/f=1,0 MHz). ' +
      'NF max 2,0 dB @100 MHz, max 4,0 dB @400 MHz, VDS=15 V, RG=1,0 kΩ.',
    tags: 'tranzistor,jfet,n-kanál,to-92,2n5485,rf,zesilovací,spínací',
  },
  {
    name: '2N5486',
    packageType: 'TO-92, 3 vývody (pohled zepředu): 1=gate, 2=source, 3=drain (S/D vzájemně zaměnitelné)',
    schematicImage: '2N5484.jpg',
    value: 'N-JFET (RF), VGS(off) -2,0 až -6,0 V, IDSS 8,0-20 mA (@ VDS=15 V)',
    notes:
      'Silikonový N-kanálový JFET pro RF zesilovače, určený primárně pro elektronické spínání ' +
      '(nízký odpor v sepnutém stavu, analog switching), Sourced from Process 50. Součást rodiny ' +
      '2N5484/5485/5486 (TO-92) a MMBF5484/5485/5486 (SOT-23) — společný datasheet jako 2N5484, ' +
      'liší se jen VGS(off)/IDSS/gfs/NF — nejvyšší proudová varianta. Fairchild Semiconductor, 1997. ' +
      'Mezní hodnoty: VDG=25 V, VGS=-25 V, IGF=10 mA, TJ/Tstg=-55 až +150 °C. ' +
      'PD=350 mW @TA=25 °C (derating 2,8 mW/°C nad 25 °C), RθJC=125 °C/W, RθJA=357 °C/W. ' +
      'V(BR)GSS min -25 V @IG=-1,0 µA/VDS=0. IGSS max -1,0 nA @VGS=-20 V/VDS=0 (max -0,2 µA @TA=100 °C). ' +
      'VGS(off) -2,0 až -6,0 V @VDS=15 V/ID=10 nA. IDSS 8,0-20 mA @VDS=15 V/VGS=0. ' +
      'gfs 4000-8000 µmhos @VDS=15 V/VGS=0/f=1,0 kHz. ' +
      'Ciss max 5,0 pF, Crss max 1,0 pF, Coss max 2,0 pF (@VDS=15 V/VGS=0/f=1,0 MHz). ' +
      'NF max 2,0 dB @100 MHz, max 4,0 dB @400 MHz, VDS=15 V, RG=1,0 kΩ.',
    tags: 'tranzistor,jfet,n-kanál,to-92,2n5486,rf,zesilovací,spínací',
  },
  {
    name: 'MMBF5484',
    packageType: 'SOT-23 (SMD), G/S/D (S/D vzájemně zaměnitelné), značení na pouzdře: 6B',
    schematicImage: '2N5484.jpg',
    value: 'N-JFET (RF), VGS(off) -0,3 až -3,0 V, IDSS 1,0-5,0 mA (@ VDS=15 V)',
    notes:
      'SMD verze 2N5484 (stejný křemíkový čip, stejný datasheet, jen SOT-23 pouzdro a nižší PD) — ' +
      'viz poznámka u 2N5484 pro elektrické parametry. Součást rodiny 2N5484/5485/5486 (TO-92) a ' +
      'MMBF5484/5485/5486 (SOT-23), Fairchild Semiconductor, 1997. ' +
      'Mezní hodnoty: VDG=25 V, VGS=-25 V, IGF=10 mA, TJ/Tstg=-55 až +150 °C. ' +
      'PD=225 mW @TA=25 °C (derating 1,8 mW/°C nad 25 °C), RθJA=556 °C/W. ' +
      'VGS(off) -0,3 až -3,0 V, IDSS 1,0-5,0 mA, gfs 3000-6000 µmhos, NF max 3,0 dB @100 MHz — ' +
      'shodné s 2N5484.',
    tags: 'tranzistor,jfet,n-kanál,sot-23,smd,mmbf5484,rf,zesilovací,spínací',
  },
  {
    name: 'MMBF5485',
    packageType: 'SOT-23 (SMD), G/S/D (S/D vzájemně zaměnitelné), značení na pouzdře: 6M',
    schematicImage: '2N5484.jpg',
    value: 'N-JFET (RF), VGS(off) -0,5 až -4,0 V, IDSS 4,0-10 mA (@ VDS=15 V)',
    notes:
      'SMD verze 2N5485 (stejný křemíkový čip, stejný datasheet, jen SOT-23 pouzdro a nižší PD) — ' +
      'viz poznámka u 2N5484 pro plný popis rodiny. Součást rodiny 2N5484/5485/5486 (TO-92) a ' +
      'MMBF5484/5485/5486 (SOT-23), Fairchild Semiconductor, 1997. ' +
      'Mezní hodnoty: VDG=25 V, VGS=-25 V, IGF=10 mA, TJ/Tstg=-55 až +150 °C. ' +
      'PD=225 mW @TA=25 °C (derating 1,8 mW/°C nad 25 °C), RθJA=556 °C/W. ' +
      'VGS(off) -0,5 až -4,0 V, IDSS 4,0-10 mA, gfs 3500-7000 µmhos, NF max 2,0 dB @100 MHz — ' +
      'shodné s 2N5485.',
    tags: 'tranzistor,jfet,n-kanál,sot-23,smd,mmbf5485,rf,zesilovací,spínací',
  },
  {
    name: 'MMBF5486',
    packageType: 'SOT-23 (SMD), G/S/D (S/D vzájemně zaměnitelné), značení na pouzdře: 6H',
    schematicImage: '2N5484.jpg',
    value: 'N-JFET (RF), VGS(off) -2,0 až -6,0 V, IDSS 8,0-20 mA (@ VDS=15 V)',
    notes:
      'SMD verze 2N5486 (stejný křemíkový čip, stejný datasheet, jen SOT-23 pouzdro a nižší PD) — ' +
      'viz poznámka u 2N5484 pro plný popis rodiny. Součást rodiny 2N5484/5485/5486 (TO-92) a ' +
      'MMBF5484/5485/5486 (SOT-23), Fairchild Semiconductor, 1997. ' +
      'Mezní hodnoty: VDG=25 V, VGS=-25 V, IGF=10 mA, TJ/Tstg=-55 až +150 °C. ' +
      'PD=225 mW @TA=25 °C (derating 1,8 mW/°C nad 25 °C), RθJA=556 °C/W. ' +
      'VGS(off) -2,0 až -6,0 V, IDSS 8,0-20 mA, gfs 4000-8000 µmhos, NF max 2,0 dB @100 MHz — ' +
      'shodné s 2N5486.',
    tags: 'tranzistor,jfet,n-kanál,sot-23,smd,mmbf5486,rf,zesilovací,spínací',
  },
  { name: 'BF245', packageType: 'TO-92', value: 'N-JFET', notes: 'Unipolární (JFET) tranzistor', tags: 'tranzistor,jfet,n-kanál' },
  {
    name: 'BSR58LT1',
    packageType:
      'SOT-23 (SMD), 3 vývody: 1=drain, 2=source, 3=gate (case 318, style 10)',
    schematicImage: 'BSR58LT1.jpg',
    value: 'N-JFET (depletion, chopper), VDG max -40 V, VGS(off) -0,8 až -4,0 V, IDSS 8–80 mA',
    notes:
      'JFET chopper tranzistor, ON Semiconductor (datasheet BSR58LT1/D, rev. 1, srpen 2005), ' +
      'Pb-free provedení dostupné (varianta „BSR58LT1G"). Hodnoty jsou dle N-kanálové depletion ' +
      'konvence datasheetu záporné (VDG, VGS), zde uvedeny stejně. ' +
      'Mezní hodnoty: VDG=-40 V, VGS=-35 V, IG=50 mA, Ptot=350 mW @TA=25 °C (odvod 2,8 mW/°C), ' +
      'TJ/Tstg=-65 až +150 °C. ' +
      'V(BR)GSS min 40 V @IG=-1,0 A (uvedeno v datasheetu kladně, jde o průrazné napětí gate-source). ' +
      'IGSS max -1,0 nA @VGS=-15 V. VGS(off) -0,8 až -4,0 V @VDS=5,0 V/ID=1,0 µA. ' +
      'ID(off) max 1,0 nA @VDS=5,0 V/VGS=-10 V. ' +
      'IDSS 8,0–80 mA @VDS=15 V (zero-gate-voltage drain current — široký rozptyl je pro JFETy ' +
      'typický, vhodné měřit/třídit kusy při použití v přesnějších aplikacích). ' +
      'rDS(on) max 60 Ω @VDS=0,1 V. Cdg(on)+Csg(on) max 28 pF @VDS=VGS=0/f=1 MHz. ' +
      'Cdg(off) max 5,0 pF, Csg(off) max 5,0 pF @VGS=-10 V/f=1 MHz.',
    tags: 'tranzistor,jfet,n-kanál,depletion,sot-23,smd,bsr58lt1,chopper',
  },
  {
    name: 'MMBFJ177LT1G',
    packageType:
      'SOT-23 (SMD), 3 vývody: 1=drain, 2=source, 3=gate (case 318-08, style 10)',
    schematicImage: 'MMBFJ177LT1G.jpg',
    value: 'P-JFET (depletion, chopper), VDG max 25 V, VGS(off) 0,8–2,5 V, IDSS 1,5–20 mA',
    notes:
      '⚠️ P-kanálový JFET (na rozdíl od dosud zavedených N-kanálových JFETů 2N5457/BF245/BSR58LT1 ' +
      'v knihovně) — JFET chopper, ON Semiconductor (datasheet MMBFJ177LT1/D, rev. 4, srpen 2009), ' +
      'Pb-free/halogen-free/BFR-free, RoHS. ' +
      'Mezní hodnoty: VDG=25 V, VGS(r) (reverzní gate-source)=-25 V, Ptot=225 mW @TA=25 °C ' +
      '(deska FR-5, odvod 1,8 mW/°C), RθJA=556 °C/W, TJ/Tstg=-55 až +150 °C. ' +
      'V(BR)GSS min 30 V @VDS=0/ID=1,0 µA. IGSS max 1,0 nA @VDS=0/VGS=20 V. ' +
      'VGS(off) 0,8–2,5 V @VDS=15 V/ID=10 nA. ' +
      'IDSS 1,5–20 mA @VGS=0/VDS=15 V (zero-gate-voltage drain current). ' +
      'ID(off) max 1,0 nA @VDS=15 V/VGS=10 V. rDS(on) max 300 Ω @ID=500 µA. ' +
      'Ciss max 11 pF, Crss max 5,5 pF @VDS=0/VGS=10 V/f=1 MHz.',
    tags: 'tranzistor,jfet,p-kanál,depletion,sot-23,smd,mmbfj177lt1g,j177,chopper',
  },
  {
    name: 'J110',
    packageType: 'TO-92 (case 29, style 5), 3 vývody: 1=drain, 2=source, 3=gate',
    schematicImage: 'J110.jpg',
    value: 'N-JFET (depletion, obecné použití), VGS -25 V, RDS(on) max 18 Ω, IDSS min 10 mA',
    notes:
      'JFET pro obecné použití (audio zesilovače, analogové spínače, choppery), ON Semiconductor ' +
      '(datasheet J110/D, rev. 6, listopad 2005), Pb-free provedení dostupné. Drain a source jsou ' +
      'dle datasheetu vzájemně zaměnitelné. Hodnoty v N-kanálové depletion konvenci datasheetu jsou ' +
      'záporné (VGS, VDG), zde uvedeny stejně. ' +
      'Mezní hodnoty: VGS=-25 V, VDG=-25 V, IG=10 mA, Ptot=310 mW @TA=25 °C (odvod 2,82 mW/°C), ' +
      'TJ=135 °C, Tstg=-65 až +150 °C. ' +
      'V(BR)GSS min -25 V @IG=-1,0 µA. IGSS max -3,0 nA @VGS=-15 V/VDS=0 (max -200 nA @TA=100 °C). ' +
      'VGS(off) -0,5 až -4,0 V @VDS=5,0 V/ID=1,0 µA. RDS(on) max 18 Ω @VDS≤0,1 V/VGS=0. ' +
      'IDSS min 10 mA @VDS=15 V (zero-gate-voltage drain current). ' +
      'Cdg(on)+Csg(on) max 85 pF @VDS=VGS=0/f=1 MHz. Cdg(off) max 15 pF, Csg(off) max 15 pF ' +
      '@VGS=-10 V/f=1 MHz. ' +
      'Rychlé spínání (typ.): td(on)+tr=8,0 ns. Nízký šum (typ.): en=6,0 nV/√Hz @10 Hz.',
    tags: 'tranzistor,jfet,n-kanál,depletion,to-92,j110,chopper,zesilovací,spínací',
  },
  {
    name: 'ACE8205A',
    schematicImage: 'ACE8205A.jpg',
    packageType:
      'TSSOP-8 (SMD), dvojice N-MOSFETů se společným pouzdrem: piny 1/8=D1/D2 (společný drain), ' +
      '2,3=S1, 4=G1, 5=G2, 6,7=S2 — vhodné pro battery-protection zapojení se dvěma sériovými ' +
      'spínacími MOSFETy (např. nabíjecí/vybíjecí FET Li-ion ochranného obvodu)',
    value: '2× N-MOSFET (dual), VDS 20 V, ID 6 A, RDS(on) max 27 mΩ (@VGS=4,5 V) / max 37 mΩ (@VGS=2,5 V)',
    notes:
      'Dvojitý N-kanálový spínací MOSFET (trench technologie), ACE Technology, datasheet ver. 1.1, ' +
      'RoHS/Pb-free/halogen-free. Určen pro ochranu baterií, load-switche a power management — ' +
      'pracuje už při VGS=2,5 V. ESD chráněný. ' +
      'Mezní hodnoty (na jeden FET v pouzdru): VDS=20 V, VGS=±10 V, ID(trvalý)=6 A, IDM (pulzně)=25 A, ' +
      'Ptot=1,5 W @TA=25 °C, TJ/Tstg=-55 až +150 °C, RθJA=83 °C/W (SMD na FR4). ' +
      'BVDSS min 20 V (typ 21 V) @VGS=0/ID=250 µA. IDSS max 1 µA @VDS=19,5 V/VGS=0. ' +
      'IGSS max ±100 nA @VGS=±10 V/VDS=0. VGS(th) 0,5–1,2 V (typ 0,7 V) @VDS=VGS/ID=250 µA. ' +
      'RDS(on): typ 21 max 27 mΩ @VGS=4,5 V/ID=4,5 A; typ 27 max 37 mΩ @VGS=2,5 V/ID=3,5 A. ' +
      'gfs typ 10 S @VDS=5 V/ID=4,5 A. ' +
      'Ciss typ 600 pF, Coss typ 330 pF, Crss typ 140 pF (@VDS=8 V/VGS=0/f=1 MHz). ' +
      'Spínání (VDD=10 V, ID=1,0 A, VGS=4,5 V, RGEN=6 Ω): td(on) typ 10 max 20 ns, tr typ 11 max 25 ns, ' +
      'td(off) typ 35 max 75 ns, tf typ 30 max 60 ns. ' +
      'Qg(tot) typ 10 max 15 nC, Qgs typ 2,3 nC, Qgd typ 1,5 nC (@VDS=10 V/ID=6 A/VGS=4,5 V). ' +
      'Tělesová dioda: VSD typ 0,75 max 1,2 V @IS=1,7 A/VGS=0, IS max 1,7 A.',
    tags: 'tranzistor,mosfet,n-kanál,dual,tssop-8,smd,ace8205a,battery-protection,logická-úroveň,spínací',
  },
  {
    name: 'KSE13009F',
    packageType: 'TO-220F, vývody: 1=báze, 2=kolektor, 3=emitor (plastové pouzdro, izolovaná ploška)',
    value:
      'NPN vysokonapěťový spínací tranzistor, VCEO 400 V, VCBO 700 V, IC 12 A (pulzně 24 A), ' +
      'hFE 8–40 @IC=5 A',
    notes:
      'Fairchild Semiconductor KSE13009F (dok. rev. A, únor 2000) — vysokonapěťový rychlospínací ' +
      'NPN tranzistor z rodiny "13009", typicky používaný ve spínaných zdrojích (SMPS) a řízení ' +
      'motorů. Mezní hodnoty: VCBO=700 V, VCEO=400 V, VEBO=9 V, IC=12 A (DC), ICP=24 A (pulzně), ' +
      'IB=6 A, PC=50 W @TC=25 °C (lineárně klesá k 0 W při TC=150 °C), TJ max 150 °C, ' +
      'Tstg -65 až +150 °C. VCEO(sus) min 400 V @IC=10 mA/IB=0. IEBO max 1 mA @VEB=7 V. ' +
      'hFE: 8–40 @VCE=5 V/IC=5 A, 6–30 @VCE=5 V/IC=8 A (výrazný pokles zisku při vyšším proudu, ' +
      'typické pro vysokonapěťové spínací tranzistory). VCE(sat): max 1 V @IC=5 A/IB=1 A, ' +
      'max 1,5 V @IC=8 A/IB=1,6 A, max 3 V @IC=12 A/IB=3 A. VBE(sat): max 1,2 V @IC=5 A/IB=1 A, ' +
      'max 1,6 V @IC=8 A/IB=1,6 A. Cob typ 180 pF @VCB=10 V/f=0,1 MHz. fT min 4 MHz @VCE=10 V/' +
      'IC=0,5 A. Spínací časy (VCC=125 V, IC=8 A, IB1=-IB2=1,6 A, RL=15,6 Ω): tON max 1,1 µs, ' +
      'tSTG (storage) max 3 µs, tF max 0,7 µs — relativně pomalé vypínání typické pro tuto ' +
      'kategorii vysokonapěťových bipolárních spínačů (na rozdíl od MOSFETů).',
    tags: 'tranzistor,npn,bipolární,vysokonapěťový,spínací,to-220,13009,smps',
  },
  {
    name: 'BF240',
    packageType:
      '⚠️ TO-92, vývody: 1=kolektor, 2=emitor, 3=báze (neobvyklé pořadí C-E-B — odlišné od ' +
      'typického pořadí E-B-C nebo C-B-E, snadná záměna, ověř si zapojení v datasheetu před pájením)',
    value: 'NPN RF (VF) tranzistor, VCEO 40 V, IC 50 mA, fT min 1100 MHz, hFE 65–225 @IC=1 mA',
    notes:
      'Fairchild Semiconductor BF240 "NPN RF Transistor" (dok. rev. A, září 2003) — malosignálový ' +
      'vysokofrekvenční tranzistor pro VF/VKV zesilovače a oscilátory (fT přes 1 GHz). Mezní ' +
      'hodnoty: VCEO=40 V, VCBO=40 V, VEBO=4,0 V, IC=50 mA (trvale), TJ/Tstg -55 až +150 °C. ' +
      'PD=350 mW @TA=25 °C (odvod 2,8 mW/°C nad 25 °C), RθJC=125 °C/W, RθJA=357 °C/W. ' +
      'V(BR)CEO min 40 V @IC=1,0 mA/IB=0. V(BR)CBO min 40 V @IC=100 µA/IE=0. V(BR)EBO min 4,0 V ' +
      '@IE=10 µA/IC=0. ICBO max 100 nA @VCB=20 V/IE=0. hFE 65–225 @IC=1 mA/VCE=10 V. VCE(sat) ' +
      'max 0,65 V @IC=1 mA/IB=0,1 mA. VBE(sat) max 0,74 V @IC=1 mA/IB=0,1 mA. fT min 1100 MHz ' +
      '@IC=7,0 mA/VCE=10 V/f=100 MHz (velmi vysoký tranzitní kmitočet, typický pro VF aplikace ' +
      'jako FM/VKV přijímače, směšovače a oscilátory — nevhodné pro výkonové spínání). Cre ' +
      '(zpětná přenosová kapacita v zapojení SE) max 0,34 pF @VCB=10 V/IE=0/f=1,0 MHz.',
    tags: 'tranzistor,npn,bipolární,rf,vf,vysokofrekvenční,to-92,bf240',
  },
  {
    name: 'MJE15032',
    packageType: 'TO-220 (case 221A, style 1), vývody: 1=báze, 2=kolektor, 3=emitor, 4=kolektor (chladicí ploška)',
    value: 'NPN výkonový tranzistor, VCEO 250 V, IC 8,0 A, PD 50 W @TC=25 °C — audio driver',
    notes:
      'ON Semiconductor MJE15032 (NPN) / MJE15033 (PNP) "Complementary Silicon Plastic Power ' +
      'Transistors" (dok. MJE15032/D, rev. 6, prosinec 2014) — komplementární pár navržený ' +
      'speciálně jako vysokofrekvenční budič (driver) ve výkonových audio zesilovačích (typicky ' +
      'jako předstupeň budící koncové výkonové tranzistory). MJE15032 = NPN polovina páru, ' +
      'komplement k MJE15033 (samostatný záznam). Mezní hodnoty: VCEO=250 V, VCB=250 V, VEB=5,0 V, ' +
      'IC=8,0 A (trvale), ICM=16 A (špičkově), IB=2,0 A, PD=50 W @TC=25 °C (odvod 0,40 W/°C), ' +
      'PD=2,0 W @TA=25 °C (odvod 0,016 W/°C), TJ/Tstg -65 až +150 °C. RθJC=2,5 °C/W, ' +
      'RθJA=62,5 °C/W. ESD odolnost: HBM třída 3B, MM třída C. Pouzdro TO-220 (case 221A style 1), ' +
      'epoxid dle UL 94 V-0 @0,125", Pb-free/RoHS. Značení na pouzdru "MJE1503xG AYWW" ' +
      '(x=2 nebo 3, A=místo výroby, Y=rok, WW=týden, G=Pb-free). ⚠️ Datasheet neuvádí konkrétní ' +
      'hodnoty hFE, VCE(sat) ani fT na první straně (jen mezní hodnoty a tepelné charakteristiky) ' +
      '— doplnit při zpracování detailního listu elektrických charakteristik, pokud bude nahrán.',
    tags: 'tranzistor,npn,bipolární,výkonový,to-220,mje15032,audio,driver',
  },
  {
    name: 'MJE15033',
    packageType: 'TO-220 (case 221A, style 1), vývody: 1=báze, 2=kolektor, 3=emitor, 4=kolektor (chladicí ploška)',
    value: 'PNP výkonový tranzistor, VCEO -250 V, IC -8,0 A, PD 50 W @TC=25 °C — audio driver',
    notes:
      'ON Semiconductor MJE15032 (NPN) / MJE15033 (PNP) "Complementary Silicon Plastic Power ' +
      'Transistors" (dok. MJE15032/D, rev. 6, prosinec 2014). MJE15033 = PNP komplement k ' +
      'MJE15032 (samostatný záznam) — stejné pouzdro a parametry, jen opačná polarita. Určeno ' +
      'jako vysokofrekvenční budič (driver) ve výkonových audio zesilovačích. Mezní hodnoty: ' +
      'VCEO=-250 V, VCB=-250 V, VEB=-5,0 V, IC=-8,0 A (trvale), ICM=-16 A (špičkově), IB=-2,0 A, ' +
      'PD=50 W @TC=25 °C (odvod 0,40 W/°C), PD=2,0 W @TA=25 °C (odvod 0,016 W/°C), TJ/Tstg -65 až ' +
      '+150 °C. RθJC=2,5 °C/W, RθJA=62,5 °C/W. ESD odolnost: HBM třída 3B, MM třída C. Pouzdro ' +
      'TO-220 (case 221A style 1), epoxid dle UL 94 V-0 @0,125", Pb-free/RoHS. Značení na pouzdru ' +
      '"MJE1503xG AYWW". ⚠️ Datasheet neuvádí konkrétní hodnoty hFE, VCE(sat) ani fT na první ' +
      'straně (jen mezní hodnoty a tepelné charakteristiky) — doplnit při zpracování detailního ' +
      'listu elektrických charakteristik, pokud bude nahrán.',
    tags: 'tranzistor,pnp,bipolární,výkonový,to-220,mje15033,audio,driver',
  },
  {
    name: 'BC807U',
    packageType:
      'SOT-363 (SC-70-6), 6 vývodů — dva galvanicky oddělené PNP tranzistory v jednom SMD ' +
      'pouzdře (dobře spárované parametry), přesné přiřazení pinů viz diagram výrobce; značení ' +
      'na pouzdru "S5B"',
    value: 'Duální PNP tranzistor (2× PNP v pouzdře), VCEO -45 V, IC -0,5 A, hFE 160–400 @IC=-100 mA',
    notes:
      'Jiangsu Changjiang Electronics Technology (JCET) BC807U "Dual Transistor (PNP+PNP)" ' +
      '(dok. rev. B, březen 2016) — dvojice nezávislých PNP tranzistorů BC807 integrovaná v jednom ' +
      'malém SOT-363 pouzdře, určená pro nízkofrekvenční (AF) vstupní stupně a budicí obvody, kde ' +
      'je výhodou dobré teplotní spárování obou tranzistorů (např. diferenciální zesilovače). ' +
      'Mezní hodnoty: VCBO=-50 V, VCEO=-45 V, VEBO=-5 V, IC=-0,5 A, PC=0,3 W @TA=25 °C, ' +
      'RθJA=417 °C/W, TJ max 150 °C, Tstg -55 až +150 °C. V(BR)CBO min -50 V @IC=-10 µA/IE=0. ' +
      'V(BR)CEO min -45 V @IC=-10 mA/IB=0. V(BR)EBO min -5 V @IE=-10 µA/IC=0. ICBO max -0,1 µA ' +
      '@VCB=-25 V/IE=0. IEBO max -0,1 µA @VEB=-4 V/IC=0. hFE(1) 160–400 @VCE=-1 V/IC=-100 mA. ' +
      'hFE(2) min 40 @VCE=-1 V/IC=-500 mA (pokles zisku při vyšším proudu — typické pro tento ' +
      'malosignálový tranzistor). VCE(sat) max -0,7 V @IC=-500 mA/IB=-50 mA. VBE(sat) max -1,2 V ' +
      '@IC=-500 mA/IB=-50 mA. fT typ 200 MHz @VCE=-5 V/IC=-50 mA/f=20 MHz. Ccb typ 10 pF ' +
      '@VCB=-10 V/f=1 MHz. Ceb typ 60 pF @VEB=-0,5 V/f=1 MHz. ⚠️ Odlišné od jednotlivého (single) ' +
      'tranzistoru BC807 v běžném SOT-23 pouzdře (ten v knihovně zatím není zpracován) — toto je ' +
      'duální varianta se dvěma nezávislými tranzistory v jednom SMD pouzdře, jiný počet pinů ' +
      'a jiný footprint.',
    tags: 'tranzistor,pnp,bipolární,duální,sot-363,sc-70-6,bc807,bc807u,smd,af',
  },
  {
    name: 'BC817-16LT1G',
    packageType: 'SOT-23 (SMD), 3 vývody: 1=báze, 2=emitor, 3=kolektor; značení na pouzdře "6A"',
    schematicImage: 'BC817-16LT1G.jpg',
    value: 'NPN tranzistor, VCEO 45 V, IC 500 mA, hFE 100–250 @IC=100 mA',
    notes:
      'onsemi "BC817-16L, SBC817-16L, BC817-25L, SBC817-25L, BC817-40L, SBC817-40L — General ' +
      'Purpose Transistors NPN Silicon" (dok. BC817-16LT1/D, rev. 19, 2026). Nejnižší proudová ' +
      '(hFE) varianta z trojice BC817-16L/25L/40L (společný datasheet, liší se jen třídou hFE) — ' +
      'viz sourozenecké záznamy BC817-25LT1G a BC817-40LT1G. ⚠️ Existuje i automotive-kvalifikovaná ' +
      'varianta SBC817-16L (AEC-Q101, PPAP capable, S/NSV prefix pro řízení výroby) se stejnými ' +
      'elektrickými parametry a stejným pouzdrem/značením — nepřidána jako samostatný záznam, jde ' +
      'jen o odlišnou kvalifikaci stejného čipu. ' +
      'Mezní hodnoty: VCEO=45 V, VCBO=50 V, VEBO=5,0 V, IC=500 mA (trvalý). PD=225 mW @TA=25°C ' +
      '(FR-5 deska, derating 1,8 mW/°C, RθJA=556°C/W) nebo 300 mW (Al2O3 substrát, derating ' +
      '2,4 mW/°C, RθJA=417°C/W). TJ/Tstg=-65 až +150°C. ' +
      'V(BR)CEO min 45 V @IC=10mA. V(BR)CES min 50 V @VEB=0/IC=10µA. V(BR)EBO min 5,0 V @IE=1µA. ' +
      'ICBO max 100 nA @VCB=20V (max 5,0 µA @VCB=20V/TA=150°C). hFE 100–250 @IC=100mA/VCE=1,0V ' +
      '(min 40, bez udaného max, @IC=500mA/VCE=1,0V — pokles zisku při vyšším proudu). VCE(sat) ' +
      'max 0,7 V @IC=500mA/IB=50mA. VBE(on) max 1,2 V @IC=500mA/VCE=1,0V. fT min 100 MHz ' +
      '@IC=10mA/VCE=5,0V/f=100MHz. Cobo typ 10 pF @VCB=10V/f=1MHz. Spínací časy (VCC=3,0V/ ' +
      'VBE=0,5V/IC=10mA): td typ 85ns, tr typ 30ns, ts typ 1000ns, tf typ 300ns. Pb-free, ' +
      'halogen/BFR free, RoHS.',
    tags: 'tranzistor,npn,bipolární,sot-23,onsemi,bc817,bc817-16l,smd',
  },
  {
    name: 'BC817-25LT1G',
    packageType: 'SOT-23 (SMD), 3 vývody: 1=báze, 2=emitor, 3=kolektor; značení na pouzdře "6B"',
    value: 'NPN tranzistor, VCEO 45 V, IC 500 mA, hFE 160–400 @IC=100 mA',
    notes:
      'Součást trojice BC817-16L/25L/40L (onsemi, společný datasheet) — viz poznámka u ' +
      'BC817-16LT1G pro plné společné specifikace (mezní hodnoty, pouzdro, spínací časy). Střední ' +
      'proudová (hFE) varianta. ⚠️ Automotive ekvivalent SBC817-25L (AEC-Q101) má shodné elektrické ' +
      'parametry.',
    tags: 'tranzistor,npn,bipolární,sot-23,onsemi,bc817,bc817-25l,smd',
  },
  {
    name: 'BC817-40LT1G',
    packageType: 'SOT-23 (SMD), 3 vývody: 1=báze, 2=emitor, 3=kolektor; značení na pouzdře "6C"',
    value: 'NPN tranzistor, VCEO 45 V, IC 500 mA, hFE 250–600 @IC=100 mA',
    notes:
      'Součást trojice BC817-16L/25L/40L (onsemi, společný datasheet) — viz poznámka u ' +
      'BC817-16LT1G pro plné společné specifikace (mezní hodnoty, pouzdro, spínací časy). Nejvyšší ' +
      'proudová (hFE) varianta. ⚠️ Automotive ekvivalent SBC817-40L (AEC-Q101) má shodné elektrické ' +
      'parametry.',
    tags: 'tranzistor,npn,bipolární,sot-23,onsemi,bc817,bc817-40l,smd',
  },
  {
    name: 'BC856S',
    packageType:
      'SOT-363 (SC-70-6), 6 vývodů: 1/4=E1/E2, 2/5=B1/B2, 3/6=C2/C1 (dva nezávislé PNP ' +
      'tranzistory TR1, TR2 v jednom SMD pouzdře) — pinout potvrzen jak JCET reissue, tak ' +
      'originálním Siemens datasheetem; značení na pouzdru "5Ft" (JCET) nebo "3Ds" (Siemens)',
    value: 'Duální PNP tranzistor (2× PNP v pouzdře), VCEO -65 V, IC -100 mA, hFE 200–475 @IC=2 mA',
    notes:
      '⚠️ Doplněno podle původního Siemens datasheetu "BC 856S — PNP Silicon AF Transistor ' +
      'Array" (1998-11-01), který doplňuje/upřesňuje dříve zpracovaný reissue od Jiangsu ' +
      'Changjiang Electronics Technology (JCET, dok. rev. D, 2016) — rozdíly mezi zdroji jsou ' +
      'označeny níže; SOT-363 pouzdro stejné rodiny jako BC807U (samostatný záznam). Dva ' +
      'nezávislé PNP tranzistory (TR1, TR2) sdílející jedno pouzdro, bez vzájemného ovlivňování, ' +
      's dobrým teplotním spárováním pro diferenciální stupně/proudová zrcadla — určeno pro AF ' +
      '(nízkofrekvenční) vstupní stupně a budicí obvody. Mezní hodnoty (Siemens): VCEO=65 V, ' +
      'VCBO=80 V, VCES=80 V (⚠️ nový parametr, JCET jej neuváděl), VEBO=5 V, IC=100 mA (trvale), ' +
      'ICM=200 mA (špičkově, ⚠️ JCET tento parametr neuváděl), Ptot=250 mW @TS=115 °C (pájecí ' +
      'bod — ⚠️ JCET uváděl 200 mW @TA=25 °C, jiná referenční teplota, přímo nesrovnatelné), TJ ' +
      'max 150 °C, Tstg -65 až +150 °C. ⚠️ Tepelný odpor RθJA≤275 K/W dle Siemens výrazně nižší ' +
      'než RθJA=625 °C/W uváděný JCET reissue pro stejný díl — možný rozdíl v měřicí metodice ' +
      '(deska 40×40×1,5 mm/0,5 cm² Cu u Siemens) nebo v kvalitě/konstrukci čipu druhého zdroje; ' +
      'Siemens navíc udává RθJS (přechod–pájecí bod) ≤140 K/W. Elektrické charakteristiky na ' +
      'tranzistor (Siemens, TA=25 °C): V(BR)CEO min 65 V @IC=10 mA/IB=0, V(BR)CBO min 80 V ' +
      '@IC=10 µA/IB=0, V(BR)CES min 80 V @IC=10 µA/VBE=0 (nový parametr), V(BR)EBO min 5 V ' +
      '@IE=10 µA/IC=0. ICBO max 15 nA @VCB=30 V/IE=0 (shoduje se s JCET), max 5 µA @VCB=30 V/' +
      'IE=0/TA=150 °C (nový parametr — teplotní chování). ⚠️ hFE dle Siemens: typ 250 @IC=10 µA/' +
      'VCE=5 V; min 200, typ 290, max 475 @IC=2 mA/VCE=5 V — výrazně vyšší minimum než JCET ' +
      'reissue (ten uváděl jen min 110 @stejné podmínce IC=2 mA/VCE=5 V), druhý zdroj patrně ' +
      'garantuje volnější/nižší minimální zisk. ⚠️ VCEsat dle Siemens: typ 90 mV max 300 mV ' +
      '@IC=10 mA/IB=0,5 mA (JCET uváděl přísnější max 100 mV při stejné podmínce); typ 250 mV ' +
      'max 650 mV @IC=100 mA/IB=5 mA (JCET uváděl přísnější max 300 mV) — reissue tedy garantuje ' +
      'nižší (lepší) saturační napětí než originál. VBEsat typ 700 mV @IC=10 mA/IB=0,5 mA (shoduje ' +
      'se s JCET), typ 850 mV @IC=100 mA/IB=5 mA. VBE(on) (nový parametr): min 600 typ 650 max ' +
      '750 mV @IC=2 mA/VCE=5 V; max 820 mV @IC=10 mA/VCE=5 V. AC charakteristiky (Siemens): ' +
      '⚠️ fT typ 250 MHz @IC=20 mA/VCE=5 V/f=100 MHz (vyšší testovací proud i vyšší hodnota než ' +
      'JCET min 100 MHz @IC=10 mA — různé testovací podmínky, nejsou přímo srovnatelné). Ccb typ ' +
      '3 pF @VCB=10 V/f=1 MHz (blízké JCET Cobo max 2,5 pF). Ceb typ 8 pF @VEB=0,5 V/f=1 MHz ' +
      '(nový parametr). Malosignálové h-parametry v zapojení SE @IC=2 mA/VCE=5 V/f=1 kHz (zcela ' +
      'nové, JCET je neuváděl): h11e typ 4,5 kΩ (vstupní impedance), h12e typ 2×10⁻⁴ (zpětný ' +
      'napěťový přenos), h21e min 330 (proudové zesílení), h22e typ 30 µS (výstupní admitance).',
    tags: 'tranzistor,pnp,bipolární,duální,sot-363,sc-70-6,bc856,bc856s,smd',
  },
  {
    name: '2SA1873',
    packageType:
      'SOT-353 (SC-88, 5 vývodů: 1, 2, 3 dole, 4, 5 nahoře) — dva PNP tranzistory v jednom ' +
      'pouzdře se sdílenou (společnou) bází: 1=emitor T1, 2=báze T1+T2 (společná), 3=emitor T2, ' +
      '4=kolektor T2, 5=kolektor T1 — potvrzeno dle schématu vývodů v datasheetu JCET (pin 2 je ' +
      'na schématu vyznačen tečkou jako společný uzel obou bází); značení na pouzdru "SY" (rank Y) ' +
      'nebo "SGR" (rank GR)',
    value:
      'Duální PNP tranzistor (2× PNP v pouzdře, společná báze), VCEO -50 V, IC -150 mA, hFE 120–400 ' +
      '@IC=-2 mA (dle binu)',
    schematicImage: '2SA1873.jpg',
    notes:
      'Jiangsu Changjiang Electronics Technology (JCET) 2SA1873 "Dual Transistor (PNP+PNP)" ' +
      '(dok. rev. D, březen 2016) — menší SOT-353 pouzdro (na rozdíl od 6pinového SOT-363 ' +
      'u BC807U/BC856S, samostatné záznamy), určeno pro aplikace vyžadující vysoké napětí, ' +
      'vysoký proud a vysoký lineární hFE (např. proudová zrcadla, diferenciální vstupní stupně). ' +
      'Komplementární NPN protějšek je 2SC4944 (v knihovně zatím nezpracován). Mezní hodnoty: ' +
      'VCBO=-50 V, VCEO=-50 V, VEBO=-5 V, IC=-150 mA (trvale), PC=200 mW @TA=25 °C, TJ max 150 °C, ' +
      'Tstg -55 až +150 °C. V(BR)CBO min -50 V @IC=-100 µA/IE=0. V(BR)CEO min -50 V @IC=-1 mA/' +
      'IB=0. V(BR)EBO min -5 V @IE=-10 µA/IC=0. ICBO max -0,1 µA @VCB=-50 V/IE=0. IEBO max ' +
      '-0,1 µA @VEB=-5 V/IC=0. hFE min 120 max 400 @VCE=-6 V/IC=-2 mA. VCE(sat) max -0,3 V ' +
      '@IC=-100 mA/IB=-10 mA. fT min 80 MHz @VCE=-10 V/IC=-1 mA. Cob max 7 pF @VCB=-10 V/IE=0/' +
      'f=1 MHz. Binování dle hFE: rank Y = 120–240 (značení "SY"), rank GR = 200–400 (značení ' +
      '"SGR") — konkrétní kus odpovídá jedné ze dvou skupin, ne celému rozsahu 120–400 najednou.',
    tags: 'tranzistor,pnp,bipolární,duální,sot-353,sc-88,2sa1873,smd',
  },
  {
    name: 'EMZ8',
    packageType:
      'SOT-563, 6 vývodů (piny 1, 2, 3 dole, 4, 5, 6 nahoře), miniaturní SMD pouzdro menší než ' +
      'SOT-363 — dva tranzistory v jednom pouzdře, přesné přiřazení pinů k Tr1/Tr2 viz diagram ' +
      'výrobce před pájením; značení na pouzdru "Z8"',
    value:
      'Komplementární duální tranzistor v jednom pouzdře: Tr1 = PNP (VCEO -12 V, IC -150 mA, ' +
      'hFE 270–680), Tr2 = NPN (VCEO 50 V, IC 150 mA, hFE 120–560)',
    notes:
      'Jiangsu Changjiang Electronics Technology (JCET) EMZ8 (dok. rev. C, květen 2015) — ' +
      'kombinuje čip 2SA2018 (PNP) a čip 2SC2412K (NPN) v jednom SOT-563 pouzdře. ⚠️ Nadpis ' +
      'datasheetu chybně uvádí "DUAL TRANSISTOR (PNP+PNP)" — ve skutečnosti jde dle vlastní ' +
      'tabulky mezních hodnot a elektrických charakteristik výrobce o KOMPLEMENTÁRNÍ pár PNP+NPN ' +
      '(Tr1 má záporná napětí typická pro PNP, Tr2 má kladná napětí typická pro NPN) — zjevná ' +
      'chyba v hlavičce dokumentu (pravděpodobně šablona zkopírovaná z jiného dílu), knihovna ' +
      'vychází z reálných dat v tabulkách, ne z chybného nadpisu. ⚠️ Na rozdíl od BC807U/BC856S/' +
      '2SA1873 (samostatné záznamy, shodné páry stejné polarity) je EMZ8 asymetrický pár dvou ' +
      'zcela odlišných čipů — Tr1 a Tr2 mají naprosto odlišné mezní hodnoty i elektrické ' +
      'charakteristiky, nejde o vzájemně zaměnitelné/symetrické tranzistory. Společné mezní ' +
      'hodnoty: PC=150 mW (TOTAL, sdíleno oběma čipy), TJ max 150 °C, Tstg -55 až +150 °C. ' +
      'Tr1 (PNP, 2SA2018): VCBO=-15 V, VCEO=-12 V, VEBO=-6 V, IC=-150 mA (trvale). V(BR)CBO ' +
      'min -15 V @IC=-10 µA/IE=0. V(BR)CEO min -12 V @IC=-1 mA/IB=0. V(BR)EBO min -6 V @IE=-10 µA/' +
      'IC=0. ICBO max -0,1 µA @VCB=-15 V/IE=0. IEBO max -0,1 µA @VEB=-6 V/IC=0. hFE min 270 max ' +
      '680 @VCE=-2 V/IC=-10 mA (velmi vysoký zisk). VCEsat max -0,25 V @IC=-200 mA/IB=-10 mA. ' +
      'fT typ 260 MHz @VCE=-2 V/IC=-10 mA/f=100 MHz. Cob typ 6,5 pF @VCB=-10 V/IE=0/f=1 MHz. ' +
      'Tr2 (NPN, 2SC2412K): VCBO=60 V, VCEO=50 V, VEBO=7 V, IC=150 mA (trvale) — výrazně vyšší ' +
      'napěťová třída než Tr1. V(BR)CBO min 60 V @IC=50 µA/IE=0. V(BR)CEO min 50 V @IC=1 mA/IB=0. ' +
      'V(BR)EBO min 7 V @IE=50 µA/IC=0. ICBO max 0,1 µA @VCB=60 V/IE=0. IEBO max 0,1 µA @VEB=7 V/' +
      'IC=0. hFE min 120 max 560 @VCE=6 V/IC=1 mA. VCE(sat) max 0,4 V @IC=50 mA/IB=5 mA. fT typ ' +
      '180 MHz @VCE=12 V/IC=2 mA/f=100 MHz. Cob 2,0–3,5 pF @VCB=12 V/IE=0/f=1 MHz.',
    tags: 'tranzistor,pnp,npn,bipolární,duální,komplementární,sot-563,emz8,smd',
  },
  {
    name: 'BC857BV',
    packageType:
      'SOT-563, 6 vývodů (piny 1, 2, 3 dole, 4, 5, 6 nahoře) — dva PNP tranzistory ve stejném ' +
      'miniaturním SMD pouzdře jako EMZ8 (samostatný záznam); značení na pouzdru "K5V"',
    value: 'Duální PNP tranzistor (2× PNP v pouzdře), VCEO -45 V, IC -0,1 A, hFE 220–475 @IC=-2 mA (bin B)',
    notes:
      'Jiangsu Changjiang Electronics Technology (JCET) BC857BV "Dual Transistor (PNP+PNP)" ' +
      '(dok. rev. C, červenec 2015) — na rozdíl od EMZ8 (samostatný záznam, stejné SOT-563 ' +
      'pouzdro, ale asymetrická kombinace PNP+NPN čipů) jde o skutečný symetrický pár dvou ' +
      'shodných PNP tranzistorů BC857B, obdoba BC807U/BC856S (samostatné záznamy), jen v menším ' +
      'SOT-563 pouzdře místo SOT-363. Epitaxní konstrukce čipu. Komplementární NPN protějšek ' +
      'BC847BV (v knihovně zatím nezpracován) je dostupný ve stejném pouzdře. "B" v označení = ' +
      'hFE gain bin 220–475 (jiné giny výrobce obvykle značí jinými písmeny, zde konkrétně ' +
      'změřeno/garantováno pro tuto binovou skupinu). Mezní hodnoty: VCBO=-50 V, VCEO=-45 V, ' +
      'VEBO=-5 V, IC=-0,1 A (trvale), PC=0,15 W @TA=25 °C, RθJA=833 °C/W, TJ max 150 °C, Tstg ' +
      '-55 až +150 °C. V(BR)CBO min -50 V @IC=-10 µA/IE=0. V(BR)CEO min -45 V @IC=-10 mA/IB=0. ' +
      'V(BR)EBO min -5 V @IE=-1 µA/IC=0. ICBO max -15 nA @VCB=-30 V/IE=0. hFE min 220 max 475 ' +
      '@VCE=-5 V/IC=-2 mA. VCE(sat) max -0,1 V @IC=-10 mA/IB=-0,5 mA; max -0,4 V @IC=-100 mA/' +
      'IB=-5 mA. VBE(sat) typ -0,7 V @IC=-10 mA/IB=-0,5 mA; typ -0,9 V @IC=-100 mA/IB=-5 mA. ' +
      'VBE: min -0,6 V max -0,75 V @VCE=-5 V/IC=-2 mA; max -0,82 V @VCE=-5 V/IC=-10 mA. fT min ' +
      '100 MHz @VCE=-5 V/IC=-10 mA/f=100 MHz. Cob max 4,5 pF @VCB=-10 V/IE=0/f=1 MHz. Šumové ' +
      'číslo (NF) typ 10 dB @VCE=-5 V/IC=-0,2 mA/f=1 kHz/Rs=2 kΩ/BW=200 Hz — parametr uváděný jen ' +
      'u tohoto dílu z rodiny (relevantní pro malosignálové audio/mikrofonní předzesilovače).',
    tags: 'tranzistor,pnp,bipolární,duální,sot-563,bc857,bc857bv,smd',
  },
  {
    name: 'BC857S',
    packageType:
      'SOT-363 (SC-70-6), 6 vývodů (piny 1, 2, 3 dole, 4, 5, 6 nahoře): 1=emitor T1, 2=báze T1, ' +
      '6=kolektor T1, 4=emitor T2, 5=báze T2, 3=kolektor T2 — potvrzeno dle schématu vývodů v ' +
      'datasheetu JCET (dva zcela nezávislé PNP tranzistory, žádný sdílený pin, na rozdíl od ' +
      '5pinového 2SA1873); značení na pouzdru "3C"',
    value: 'Duální PNP tranzistor (2× PNP v pouzdře), VCEO -45 V, IC -0,2 A, hFE 125–630 @IC=-2 mA (bin S)',
    schematicImage: 'BC857S.jpg',
    notes:
      'Jiangsu Changjiang Electronics Technology (JCET) BC857S "Dual Transistor (PNP+PNP)" ' +
      '(dok. rev. E, březen 2016) — ⚠️ na rozdíl od BC857BV (samostatný záznam, menší SOT-563 ' +
      'pouzdro, IC max -0,1 A, hFE bin B 220–475) je BC857S ve větším SOT-363 pouzdře (stejném ' +
      'jako BC807U/BC856S) s vyšší proudovou zatížitelností (-0,2 A) a širokým "S" ' +
      'binem hFE 125–630 (nerozlišený/"spread" bin pokrývající rozsah více užších binů). ' +
      '⚠️ Výrazně lepší šumové číslo NF typ 2,5 dB (vs. 10 dB u BC857BV, stejné testovací ' +
      'podmínky) — vhodnější pro nízkošumové audio/mikrofonní předzesilovače. Mezní hodnoty: ' +
      'VCBO=-50 V, VCEO=-45 V, VEBO=-5 V, IC=-0,2 A (trvale), PC=0,3 W @TA=25 °C, RθJA=417 °C/W, ' +
      'TJ max 150 °C, Tstg -55 až +150 °C. V(BR)CBO min -50 V @IC=-10 µA/IE=0. V(BR)CEO min ' +
      '-45 V @IC=-10 mA/IB=0. V(BR)EBO min -5 V @IE=-10 µA/IC=0. ICBO max -15 nA @VCB=-30 V/' +
      'IE=0. hFE min 125 max 630 @VCE=-5 V/IC=-2 mA. VCE(sat) max -0,3 V @IC=-10 mA/IB=-0,5 mA; ' +
      'max -0,65 V @IC=-100 mA/IB=-5 mA. VBE: min -0,6 V max -0,75 V @VCE=-5 V/IC=-2 mA; max ' +
      '-0,82 V @VCE=-5 V/IC=-10 mA. fT typ 200 MHz @VCE=-5 V/IC=-10 mA/f=100 MHz. Cob max 3,5 pF ' +
      '@VCB=-10 V/IE=0/f=1 MHz. NF typ 2,5 dB @VCE=-5 V/IC=-0,2 mA/f=1 kHz/Rs=2 kΩ/BW=200 Hz.',
    tags: 'tranzistor,pnp,bipolární,duální,sot-363,sc-70-6,bc857,bc857s,smd,nízký-šum',
  },
  {
    name: 'MMDT2907A',
    packageType:
      'SOT-363 (SC-70-6), 6 vývodů: 1=emitor T2, 2=báze T2, 3=kolektor T1, 4=emitor T1, ' +
      '5=báze T1, 6=kolektor T2 — dva nezávislé PNP tranzistory v jednom SMD pouzdře; značení ' +
      'na pouzdru "K2F"',
    value:
      'Duální PNP tranzistor (2× PNP 2907A v pouzdře), VCEO -60 V, IC -600 mA, hFE 100–300 ' +
      '@IC=-150 mA',
    notes:
      'Jiangsu Changjiang Electronics Technology (JCET) MMDT2907A "Dual Transistor (PNP+PNP)" ' +
      '(dok. rev. E, březen 2016) — SOT-363 duální verze klasického 2N2907A/MMBT2907A ' +
      '(samostatný záznam pro jednotlivý SOT-23 tranzistor MMBT2907A). ⚠️ Odlišný pinout od ' +
      'BC807U/BC856S/BC857S (samostatné záznamy, stejné SOT-363 pouzdro) — u MMDT2907A je pin1 ' +
      '=E2 (ne E1), tzn. číslování tranzistorů T1/T2 je na desce zrcadlově otočené oproti ' +
      'konvenci JCET u BC-řady; při návrhu DPS ověř konkrétní diagram. Komplementární NPN duál ' +
      'je MMDT2222A (v knihovně zatím nezpracován). Mezní hodnoty: VCBO=-60 V, VCEO=-60 V, ' +
      'VEBO=-5 V, IC=-600 mA (trvale), PC=200 mW @TA=25 °C, TJ max 150 °C, Tstg -55 až +150 °C. ' +
      'V(BR)CBO min -60 V @IC=-10 µA/IE=0. V(BR)CEO min -60 V @IC=-10 mA/IB=0. V(BR)EBO min ' +
      '-5 V @IE=-10 µA/IC=0. ICBO max -10 nA @VCB=-50 V/IE=0. ICEX max -50 nA @VCE=-30 V/' +
      'VEB(off)=-0,5 V. IEBO max -10 nA @VEB=-5 V/IC=0. hFE: min 75 @IC=-0,1 mA, min 100 ' +
      '@IC=-1 mA, min 100 @IC=-10 mA, min 100 max 300 @IC=-150 mA, min 50 @IC=-500 mA (vše ' +
      '@VCE=-10 V) — pětibodová specifikace zisku napříč širokým proudovým rozsahem, typická pro ' +
      'kvalitní obecný spínací/zesilovací tranzistor. VCE(sat) max -0,4 V @IC=-150 mA/IB=-15 mA; ' +
      'max -1,6 V @IC=-500 mA/IB=-50 mA. VBE(sat) max -1,3 V @IC=-150 mA/IB=-15 mA; max -2,6 V ' +
      '@IC=-500 mA/IB=-50 mA. fT min 200 MHz @VCE=-20 V/IC=-50 mA/f=100 MHz. Cob max 8 pF ' +
      '@VCB=-10 V/IE=0/f=1 MHz. Cib max 30 pF @VEB=-2 V/IC=0/f=1 MHz. Spínací časy: td max ' +
      '10 ns, tr max 40 ns (@VCC=-30 V/IC=-150 mA/IB1=-15 mA); ts max 225 ns, tf max 60 ns ' +
      '(@VCC=-6 V/IC=-150 mA/IB1=IB2=-15 mA).',
    tags: 'tranzistor,pnp,bipolární,duální,sot-363,sc-70-6,mmdt2907a,2n2907,mmbt2907a,smd',
  },
  {
    name: 'MMDT3906',
    packageType:
      'SOT-363 (SC-70-6), 6 vývodů — dva nezávislé PNP tranzistory v jednom SMD pouzdře, ' +
      'pravděpodobně shodný pinout jako MMDT2907A (1=E2, 2=B2, 3=C1, 4=E1, 5=B1, 6=C2 — stejný ' +
      'výrobce/pouzdro/dokumentová řada, ale bez výslovného popisku písmeny na obrázku v tomto ' +
      'konkrétním datasheetu) — ověř diagram před pájením; značení na pouzdru "K3N"',
    value: 'Duální PNP tranzistor (2× PNP 3906 v pouzdře), VCEO -40 V, IC -0,2 A, hFE 100–300 @IC=-10 mA',
    notes:
      'Jiangsu Changjiang Electronics Technology (JCET) MMDT3906 "Dual Transistor (PNP+PNP)" ' +
      '(dok. rev. D, březen 2016 / rev. A, červen 2014) — SOT-363 duální verze klasického ' +
      '2N3906/G2N3906 (samostatný záznam „2N3906" pro jednotlivý tranzistor v této knihovně). ' +
      'Epitaxní planární konstrukce čipu, určeno pro nízkopříkonové zesilovací a spínací obvody. ' +
      'Mezní hodnoty: VCBO=-40 V, VCEO=-40 V, VEBO=-5 V, IC=-0,2 A (trvale), PC=0,2 W @TA=25 °C, ' +
      'RθJA=625 °C/W, TJ max 150 °C, Tstg -55 až +150 °C. V(BR)CBO min -40 V @IC=-10 µA/IE=0. ' +
      'V(BR)CEO min -40 V @IC=-1 mA/IB=0. V(BR)EBO min -5 V @IE=-10 µA/IC=0. ICEX max -50 nA ' +
      '@VCE=-30 V/VEB(off)=-3 V. IEBO max -50 nA @VEB=-5 V/IC=0. hFE (@VCE=-1 V): min 60 ' +
      '@IC=-0,1 mA, min 80 @IC=-1 mA, min 100 max 300 @IC=-10 mA, min 60 @IC=-50 mA, min 30 ' +
      '@IC=-100 mA. VCE(sat) max -0,25 V @IC=-10 mA/IB=-1 mA; max -0,4 V @IC=-50 mA/IB=-5 mA. ' +
      'VBE(sat) min -0,65 V max -0,85 V @IC=-10 mA/IB=-1 mA; max -0,95 V @IC=-50 mA/IB=-5 mA. ' +
      'fT typ 250 MHz @VCE=-20 V/IC=-10 mA/f=100 MHz. Cob max 4,5 pF @VCB=-5 V/IE=0/f=1 MHz. ' +
      'NF typ 4 dB @VCE=-5 V/IC=-0,1 mA/f=1 kHz/Rg=1 kΩ. Spínací časy (VCC=-3 V, IC=-10 mA, ' +
      'IB1=-IB2=-1 mA): td max 35 ns, tr max 35 ns (VBE=0,5 V), ts max 225 ns, tf max 75 ns.',
    tags: 'tranzistor,pnp,bipolární,duální,sot-363,sc-70-6,mmdt3906,2n3906,smd',
  },
  {
    name: 'MMDT5401',
    packageType:
      'SOT-363 (SC-70-6), 6 vývodů — dva nezávislé PNP tranzistory v jednom SMD pouzdře; ' +
      'značení na pouzdru "K4M"',
    value:
      'Duální PNP tranzistor (2× PNP 5401 v pouzdře), VCEO -150 V, VCBO -160 V, IC -0,2 A, ' +
      'hFE 100–300 @IC=-10 mA',
    notes:
      'Jiangsu Changjiang Electronics Technology (JCET) MMDT5401 "Dual Transistor (PNP+PNP)" ' +
      '(dok. rev. D, březen 2016) — SOT-363 duální verze klasického vysokonapěťového ' +
      '2N5401/G2N5401. ⚠️ Jednotlivý 2N5401 v knihovně zatím nezpracován jako samostatný ' +
      'záznam, jen zmíněn jako PNP komplement v poznámkách u NPN protějšku "2N5551" (samostatný ' +
      'záznam, VCEO 160 V) — MMDT5401 potvrzuje shodnou vysokonapěťovou třídu (VCEO -150 V, ' +
      'VCBO -160 V) na straně PNP. Komplementární NPN duál je MMDT5551 (v knihovně zatím ' +
      'nezpracován). Určeno pro středněvýkonové zesilovací a spínací obvody. Mezní hodnoty: ' +
      'VCBO=-160 V, VCEO=-150 V, VEBO=-5 V, IC=-0,2 A (trvale), PC=0,2 W @TA=25 °C, TJ max ' +
      '150 °C, Tstg -55 až +150 °C. V(BR)CBO min -160 V @IC=-100 µA/IE=0. V(BR)CEO min -150 V ' +
      '@IC=-1 mA/IB=0. V(BR)EBO min -5 V @IE=-10 µA/IC=0. ICBO max -0,05 µA @VCB=-120 V/IE=0. ' +
      'IEBO max -0,05 µA @VEB=-3 V/IC=0. hFE (@VCE=-5 V): min 50 @IC=-1 mA, min 100 max 300 ' +
      '@IC=-10 mA, min 50 @IC=-50 mA. VCE(sat) max -0,2 V @IC=-10 mA/IB=-1 mA; max -0,5 V ' +
      '@IC=-50 mA/IB=-5 mA. VBE(sat) max -1 V @IC=-10 mA/IB=-1 mA; max -1 V @IC=-50 mA/IB=-5 mA. ' +
      'fT min 100 MHz @VCE=-10 V/IC=-10 mA/f=100 MHz. Cob max 6 pF @VCB=-10 V/IE=0/f=1 MHz. ' +
      'NF max 8,0 dB @VCE=-5,0 V/IC=-200 µA/RS=10 Ω/f=1,0 kHz.',
    tags: 'tranzistor,pnp,bipolární,duální,sot-363,sc-70-6,mmdt5401,2n5401,vysokonapěťový,smd',
  },
  {
    name: 'LTR-306',
    packageType:
      'THT plastové "side looking" pouzdro (boční pohled — čočka směřuje kolmo k ose vývodů), ' +
      '2 vývody (bez báze) — 1=emitor, 2=kolektor; rozteč vývodů 2,54 mm',
    value:
      'IR fototranzistor (detektor), NPN, bez báze, λ=940 nm, VCEO 30 V, IC(ON) 0,2–2,4 mA dle ' +
      'BIN třídy (A–F) @Ee=1 mW/cm²',
    notes:
      'Lite-On Electronics "LTR-306 — IR Emitter and Detector" (dok. DS-50-92-0116, rev. B, ' +
      '05/2000) — NPN křemíkový fototranzistor (IR detektor) citlivý na infračervené záření ' +
      '(λ=940 nm), bez vyvedené báze (jen kolektor a emitor, optické buzení nahrazuje bázový ' +
      'proud) — typicky používán v páru s IR LED vysílačem (přerušovač paprsku, reflexní senzor, ' +
      'IR dálkové ovládání apod.). "Side looking" pouzdro — optická osa čočky je kolmá k ose ' +
      'vývodů (boční snímání), na rozdíl od axiálních/"top view" fototranzistorů. Mezní hodnoty: ' +
      'výkonová ztráta 100 mW, VCEO 30 V, VECO 5 V, provozní teplota -40 až +85 °C, skladovací ' +
      '-55 až +100 °C, pájecí teplota 260 °C/5 s (1,6 mm od těla). V(BR)CEO min 30 V @IC=1 mA/' +
      'Ee=0. V(BR)ECO min 5 V @IE=100 µA/Ee=0. VCE(sat) typ 0,1 V/max 0,4 V @IC=100 µA/Ee=1 mW/cm². ' +
      'Doba náběhu/poklesu (tr/tf) max 20 µs @VCC=5 V/IC=1 mA/RL=1 kΩ. Kolektorový temný proud ' +
      'ICEO max 100 nA @VCE=10 V/Ee=0. Spínací kolektorový proud IC(ON) @VCE=5 V/Ee=1 mW/cm²/' +
      'λ=940 nm — binování dle citlivosti do 6 skupin (BIN A–F): A=0,20–0,60 mA, B=0,40–1,08 mA, ' +
      'C=0,72–1,56 mA, D=1,04–1,80 mA, E=1,20–2,40 mA, F=1,60 mA min (bez horní meze v datasheetu) ' +
      '— při objednávání/výběru dílu je nutno specifikovat požadovaný BIN.',
    tags: 'tranzistor,fototranzistor,ir,detektor,npn,liteon,ltr-306,optoelektronika,side-looking',
  },
  {
    name: 'LTR-1650D',
    packageType:
      'THT plastové kulaté "top view" pouzdro Ø3,0 mm (kupolovitá čočka), speciální tmavě ' +
      'transparentní barva pouzdra (optický IR filtr potlačující viditelné světlo), 2 vývody ' +
      '(bez báze) — 1=emitor, 2=kolektor (plochá strana pouzdra označuje kolektor); rozteč ' +
      'vývodů 2,54 mm',
    value:
      'IR fototranzistor (detektor), NPN, bez báze, λ=940 nm, VCEO 30 V, IC(ON) 0,2–6,4 mA dle ' +
      'BIN třídy (A–F) @Ee=1 mW/cm² — vyšší citlivostní třídy než LTR-306',
    notes:
      'Lite-On Electronics "LTR-1650D — IR Emitter and Detector" (dok. DS-50-95-0016, rev. A, ' +
      '05/2000) — ⚠️ jiné pouzdro a vyšší citlivostní rozsah než LTR-306 (samostatný záznam, ' +
      'stejný výrobce/technologie/vlnová délka) — LTR-1650D má klasické kulaté "top view" ' +
      'pouzdro Ø3 mm se speciální tmavou transparentní barvou (funguje jako IR propustný/' +
      'viditelné-světlo-blokující filtr pro potlačení rušení okolním osvětlením), zatímco LTR-306 ' +
      'má boční ("side looking") pohled a čirou čočku. Elektricky shodné mezní hodnoty (VCEO ' +
      '30 V, VECO 5 V, PD 100 mW, provozní -40 až +85 °C) i princip (NPN fototranzistor bez báze, ' +
      'λ=940 nm), ale BIN třídy IC(ON) posunuty výše: A=0,2–0,6 mA, B=0,4–1,2 mA, C=0,8–2,4 mA, ' +
      'D=1,6–4,8 mA, E=3,2–9,6 mA, F=6,4 mA min (bez horní meze) — cca 2–4× vyšší citlivost v ' +
      'odpovídajících BIN třídách oproti LTR-306, díky větší čočce/aktivní ploše. VCE(sat) max ' +
      '0,4 V @IC=100 µA/Ee=1 mW/cm² (bez uvedené typ. hodnoty, na rozdíl od LTR-306). Doba náběhu/' +
      'poklesu (tr/tf) max 10 µs @VCC=5 V/IC=1 mA/RL=1 kΩ (2× rychlejší než LTR-306). Kolektorový ' +
      'temný proud ICEO max 100 nA @VCE=10 V/Ee=0. Skladovací teplota -55 až +100 °C, pájecí ' +
      'teplota 260 °C/5 s (1,6 mm od těla). Při objednávání/výběru dílu nutno specifikovat ' +
      'požadovaný BIN.',
    tags: 'tranzistor,fototranzistor,ir,detektor,npn,liteon,ltr-1650d,optoelektronika,top-view',
  },
  {
    name: 'PT23GP11',
    packageType:
      'THT plastové pouzdro s vrchním čočkovým okénkem (kupolovitý tvar, šířka cca 4,6 mm, výška ' +
      'cca 4,6 mm, délka vývodů 14,8 mm), 2 vývody (bez báze) rozteč 2,54 mm, plochá strana ' +
      'pouzdra a delší vývod = kolektor, kratší = emitor',
    value:
      'Fototranzistor pro viditelné světlo (senzor okolního osvětlení/soumraku, "daylight ' +
      'sensor"), NPN, bez báze, špičková citlivost λp=560 nm (odpovídá lidskému oku), VCEO 10 V, ' +
      'IL 100 µA typ. @Vce=5V/10lx, náhrada za CdS fotorezistor',
    notes:
      'Kodenshi Corp. "PT23GP11 — Daylight Sensor" (dok. květen 2004) — ⚠️ POZOR na záměnu s IR ' +
      'fototranzistory Lite-On LTR-306/LTR-1650D v této knihovně (samostatné záznamy): jde o ' +
      'zcela odlišnou aplikační kategorii — LTR-306/LTR-1650D jsou IR fototranzistory (λ=940 nm) ' +
      'určené pro páry s IR LED vysílačem (přerušení/odraz paprsku, IR dálkové ovládání apod.), ' +
      'zatímco PT23GP11 je fototranzistor CITLIVÝ NA VIDITELNÉ SVĚTLO se spektrální odezvou ' +
      '400–650 nm a špičkou @560 nm — záměrně navržený tak, aby napodoboval spektrální citlivost ' +
      'lidského oka (křivka relativní citlivosti v datasheetu téměř kopíruje standardní křivku ' +
      'fotopického vidění) — určen jako přímá náhrada za klasický CdS fotorezistor (sírník ' +
      'kademnatý) v obvodech reagujících na okolní osvětlení/soumrak, ale bez toxického kadmia a ' +
      's lepší linearitou výstupu vůči intenzitě osvětlení. Kolektor-emitorové napětí VCEO max ' +
      '10 V. Temný proud (dark current) ICEO typ. 10 nA (max 500 nA) @VCE=5V — velmi nízký, pro ' +
      'spolehlivou detekci i při nízké intenzitě osvětlení. Světelný proud IL typ. 100 µA ' +
      '@VCE=5V/10lx (světelný zdroj typu A). Rozdíl výstupu mezi světelnými zdroji A a B (poměr ' +
      'IL) typ. 1,3 — citlivost mírně závislá na spektru osvětlení. Doporučený provozní rozsah ' +
      'osvětlení 1–500 lx (nízké až středně nízké osvětlení — soumrakové spínače, stmívání ' +
      'podsvícení displejů). Bezolovnaté pájení. Určeno pro soumrakové spínače domácího osvětlení, ' +
      'stmívání podsvícení LCD monitorů/displejů, automatickou expozici (AE) fotoaparátů, ' +
      'náhradu CdS senzorů.',
    tags: 'tranzistor,fototranzistor,viditelné-světlo,daylight-sensor,npn,kodenshi,pt23gp11,cds-náhrada,optoelektronika',
  },
];

const RESISTOR_SPECS: PartSpec[] = [
  {
    name: 'Pt100',
    packageType:
      'Kabelová sonda (cable sensor): pouzdro nerezová ocel AISI 316 Ti (W 1.4571), ø5,8 × 60 mm, ' +
      '4vodičový vysoce ohebný silikonový kabel (2× červený, 2× bílý), délka kabelu volitelná ' +
      'do 99,99 m — "standard sensor" pro zasunutí do jímky/trubky ø6 mm, nebo "air sensor" ' +
      '(8 otvorů ø3 mm v plášti) pro rychlou odezvu na volném vzduchu, krytí IP65',
    value:
      'Platinový odporový teplotní senzor (RTD), Pt100 = 100 Ω @0 °C dle DIN/EN/IEC 60751, ' +
      'rozsah měření sondy -50 až +205 °C',
    notes:
      'Baumer "Cable Sensor, Pt100/Pt1000" (dok. 2902-1) — kompletní kabelová teplotní sonda ' +
      's platinovým odporovým prvkem (RTD), ne holý keramický čip. Odpor prvku roste s teplotou ' +
      'dle normalizované křivky DIN/EN/IEC 60751 (100 Ω @0 °C, cca 138,5 Ω @100 °C). ⚠️ Prvek je ' +
      'dostupný i jako Pt1000 (1000 Ω @0 °C, desetinásobná citlivost) se stejnou konstrukcí sondy ' +
      'a kabelu — jde o odlišný objednací kód (jiný odporový prvek), ne o bin/variantu Pt100, ' +
      'nepřidáno jako samostatný záznam, protože jde jen o jiný snímací prvek ve stejné sondě. ' +
      'Třídy přesnosti prvku (volitelné dle objednacího kódu): 1/1 DIN B ±(0,3+0,005×t) °C ' +
      '(rozsah prvku -50 až +400 °C), 1/3 DIN B ±1/3×(0,3+0,005×t) °C (0 až 150 °C), 1/6 DIN B ' +
      '±1/6×(0,3+0,005×t) °C (0 až 100 °C), 1/1 DIN A (-50 až +400 °C). Provedení "standard ' +
      'sensor" (do jímky/trubky ø6 mm, navíc odolá tlaku <25 bar při průtoku vody 3 m/s) nebo ' +
      '"air sensor" (bez jímky, 8 otvorů ø3 mm v plášti pro rychlou odezvu na vzduchu) — obě ' +
      'varianty mají stejný rozsah měření -50 až +205 °C, štítek značení dimenzován na -30 až ' +
      '+105 °C. Vlhkost <98 % RH kondenzující, krytí IP65. Časová konstanta τ0,5 dle způsobu ' +
      'montáže: kapalina 0,4 m/s 8 s (bez jímky) / 17 s (v nerezové jímce se silikonovou pastou), ' +
      'vzduch 3 m/s 35 s (standard) / 25 s (air sensor), nehybný vzduch 135 s (standard) / 105 s ' +
      '(air sensor). 4vodičové zapojení (Kelvinovo) eliminuje chybu odporu přívodních vodičů — ' +
      'při připojení na 3vodičový teplotní převodník zůstává jeden z párů vodičů nezapojen. ' +
      'Volitelné příslušenství: nerezová jímka (AISI 316L, závit R1/2 s M12 kabelovou průchodkou) ' +
      'pro instalaci standardní sondy do potrubí/nádrže — prodává se samostatně, není součástí ' +
      'této položky.',
    tags: 'rezistor,senzor,teploměr,rtd,pt100,platinový,baumer',
  },
  {
    name: 'NTC D-5',
    packageType:
      'Diskový termistor Ø6,5 mm max., 2 radiální vývody (rozteč 5±1 mm) nebo axiální provedení ' +
      '(Ø5 mm max.), operační rozsah -55 až +200 °C',
    value:
      'NTC termistor (záporný teplotní koeficient), R25 5–200 Ω dle typu (5D-5/10D-5/60D-5/' +
      '200D-5), Imax 0,1–1,0 A @25 °C',
    notes:
      'Shanghai Leiditech "NTC Thermistor" katalogový datasheet (rev. 01.06.2018) — pokrývá celou ' +
      'produktovou řadu diskových výkonových NTC termistorů rozlišených průměrem pouzdra (D-5 až ' +
      'D-25), použitelných jako omezovač nárazového proudu (inrush current limiter) při zapnutí ' +
      'spínaných zdrojů/UPS/zátěží, nebo jako teplotní čidlo/ochrana vlákna CRT a žárovek. ' +
      'Zpracována celá řada v jednom kroku — každý průměr pouzdra (D-5, D-7, D-9, D-11, D-13, ' +
      'D-15, D-20, D-25, samostatné záznamy) nabízí desítky konkrétních objednacích kódů lišících ' +
      'se jen jmenovitým odporem R25 (např. "10D-5" = R25 10 Ω, průměr pouzdra D-5), proto zde ' +
      'uveden jako rozsah, ne jako desítky samostatných řádků. D-5 = nejmenší pouzdro v řadě: ' +
      'R25 5/10/60/200 Ω, Imax 1,0/0,7/0,3/0,1 A, disipační konstanta δ 6 mW/°C, tepelná časová ' +
      'konstanta 18–20 s. Materiál: sintrované oxidy kovů (železo, nikl, kobalt, mangan, měď) při ' +
      '1200–1500 °C. Rt = odpor při dané teplotě (nulový výkon), R25 = jmenovitý odpor při 25 °C ' +
      '(nulový výkon, uváděn na součástce), Imax = max. trvalý proud @25 °C, δ = disipační ' +
      'konstanta (poměr změny ztrátového výkonu ku změně teploty okolí).',
    tags: 'rezistor,ntc,termistor,inrush,omezovač-proudu,leiditech,d-5',
  },
  {
    name: 'NTC D-7',
    packageType:
      'Diskový termistor Ø8,5 mm max., 2 radiální vývody (rozteč 5±1 mm) nebo axiální provedení ' +
      '(Ø5,5 mm max.), operační rozsah -55 až +200 °C',
    value:
      'NTC termistor, R25 5–200 Ω dle typu (5D-7…200D-7), Imax 0,2–2,0 A @25 °C',
    notes:
      'Shanghai Leiditech "NTC Thermistor" katalogový datasheet (rev. 01.06.2018) — ⚠️ součást ' +
      'stejné řady jako NTC D-5/D-9/D-11/D-13/D-15/D-20/D-25 (samostatné záznamy), liší se jen ' +
      'průměrem pouzdra a odpovídajícím rozsahem parametrů. Dostupné typy: 5D-7, 8D-7, 10D-7, ' +
      '12D-7, 16D-7, 22D-7, 33D-7, 200D-7 (R25 5–200 Ω). Imax 2,0–0,2 A, disipační konstanta δ ' +
      '9–11 mW/°C, tepelná časová konstanta 27–28 s. Operační rozsah -55 až +200 °C. Použití: ' +
      'omezení nárazového proudu ve spínaných zdrojích/UPS/ballastech, ochrana filamentu CRT/' +
      'žárovek, obecná teplotní ochrana obvodů.',
    tags: 'rezistor,ntc,termistor,inrush,omezovač-proudu,leiditech,d-7',
  },
  {
    name: 'NTC D-9',
    packageType:
      'Diskový termistor Ø10,5 mm max., 2 radiální vývody (rozteč 5±1 mm) nebo axiální provedení ' +
      '(Ø5,5 mm max.), operační rozsah -55 až +200 °C',
    value:
      'NTC termistor, R25 3–400 Ω dle typu (3D-9…400D-9), Imax 0,2–4,0 A @25 °C',
    notes:
      'Shanghai Leiditech "NTC Thermistor" katalogový datasheet (rev. 01.06.2018) — ⚠️ součást ' +
      'stejné řady jako NTC D-5/D-7/D-11/D-13/D-15/D-20/D-25 (samostatné záznamy). Nejširší nabídka ' +
      'hodnot v katalogu: 3, 4, 5, 6, 8, 9, 10, 12, 16, 20, 22, 30, 33, 50, 60, 80, 120, 200, 400 Ω. ' +
      'Imax 4,0–0,2 A (klesá s rostoucím R25), disipační konstanta δ 11 mW/°C (konstantní napříč ' +
      'celou řadou), tepelná časová konstanta 30–35 s. Operační rozsah -55 až +200 °C. Typické ' +
      'použití: omezovač nárazového proudu ve spínaných zdrojích (nejběžnější velikost pro tuto ' +
      'aplikaci v malých/středních spotřebičích).',
    tags: 'rezistor,ntc,termistor,inrush,omezovač-proudu,leiditech,d-9',
  },
  {
    name: 'NTC D-11',
    packageType:
      'Diskový termistor Ø12,5 mm max., 2 radiální vývody (rozteč 7,5/5 mm) nebo axiální provedení ' +
      '(Ø5,5 mm max.), operační rozsah -55 až +200 °C',
    value:
      'NTC termistor, R25 2,5–120 Ω dle typu (2,5D-11…120D-11), Imax 1,2–5,0 A @25 °C',
    notes:
      'Shanghai Leiditech "NTC Thermistor" katalogový datasheet (rev. 01.06.2018) — ⚠️ součást ' +
      'stejné řady jako NTC D-5/D-7/D-9/D-13/D-15/D-20/D-25 (samostatné záznamy). Dostupné ' +
      'hodnoty: 2,5; 3; 4; 5; 6; 8; 10; 12; 16; 20; 22; 30; 33; 50; 60; 80; 120 Ω. Imax 5,0–1,2 A, ' +
      'disipační konstanta δ 13–16 mW/°C, tepelná časová konstanta 43–65 s. Operační rozsah -55 ' +
      'až +200 °C. Vhodné pro omezení nárazového proudu u výkonnějších spotřebičů než D-9.',
    tags: 'rezistor,ntc,termistor,inrush,omezovač-proudu,leiditech,d-11',
  },
  {
    name: 'NTC D-13',
    packageType:
      'Diskový termistor Ø14,5 mm max., 2 radiální vývody (rozteč 7,5/5 mm) nebo axiální provedení ' +
      '(Ø6 mm max.), operační rozsah -55 až +200 °C',
    value:
      'NTC termistor, R25 1,3–120 Ω dle typu (1,3D-13…120D-13), Imax 1,2–7,0 A @25 °C',
    notes:
      'Shanghai Leiditech "NTC Thermistor" katalogový datasheet (rev. 01.06.2018) — ⚠️ součást ' +
      'stejné řady jako NTC D-5/D-7/D-9/D-11/D-15/D-20/D-25 (samostatné záznamy). Dostupné ' +
      'hodnoty: 1,3; 1,5; 2,5; 3; 4; 5; 6; 7; 8; 10; 12; 15; 16; 20; 30; 47; 120 Ω. Imax 7,0–1,2 A, ' +
      'disipační konstanta δ 13–17 mW/°C, tepelná časová konstanta 60–68 s. Operační rozsah -55 ' +
      'až +200 °C.',
    tags: 'rezistor,ntc,termistor,inrush,omezovač-proudu,leiditech,d-13',
  },
  {
    name: 'NTC D-15',
    packageType:
      'Diskový termistor Ø16,5 mm max., 2 radiální vývody (rozteč 7,5±0,1 mm) nebo axiální ' +
      'provedení (Ø7 mm max.), operační rozsah -55 až +200 °C',
    value:
      'NTC termistor, R25 1,3–120 Ω dle typu (1,3D-15…120D-15), Imax 1,8–8,0 A @25 °C',
    notes:
      'Shanghai Leiditech "NTC Thermistor" katalogový datasheet (rev. 01.06.2018) — ⚠️ součást ' +
      'stejné řady jako NTC D-5/D-7/D-9/D-11/D-13/D-20/D-25 (samostatné záznamy). Dostupné ' +
      'hodnoty: 1,3; 1,5; 3; 5; 6; 7; 8; 10; 12; 15; 16; 20; 30; 47; 120 Ω. Imax 8,0–1,8 A, ' +
      'disipační konstanta δ 18–22 mW/°C, tepelná časová konstanta 68–87 s. Operační rozsah -55 ' +
      'až +200 °C. Vyšší proudová zatížitelnost vhodná pro omezení nárazového proudu u výkonnějších ' +
      'zdrojů/spotřebičů.',
    tags: 'rezistor,ntc,termistor,inrush,omezovač-proudu,leiditech,d-15',
  },
  {
    name: 'NTC D-20',
    packageType:
      'Diskový termistor Ø22 mm max., 2 radiální vývody (rozteč 7,5/10 mm) nebo axiální provedení ' +
      '(Ø7 mm max.), operační rozsah -55 až +200 °C',
    value:
      'NTC termistor, R25 0,7–16 Ω dle typu (0,7D-20…16D-20), Imax 5,0–11,0 A @25 °C',
    notes:
      'Shanghai Leiditech "NTC Thermistor" katalogový datasheet (rev. 01.06.2018) — ⚠️ součást ' +
      'stejné řady jako NTC D-5/D-7/D-9/D-11/D-13/D-15/D-25 (samostatné záznamy). Dostupné hodnoty: ' +
      '0,7; 1,3; 3; 5; 6; 8; 10; 12; 16 Ω — výrazně nižší odpory než menší pouzdra, typické pro ' +
      'omezení nárazového proudu u vyšších výkonů (desítky až stovky W spínaných zdrojů). ' +
      'Imax 11,0–5,0 A, disipační konstanta δ 24–25 mW/°C, tepelná časová konstanta 87–105 s. ' +
      'Operační rozsah -55 až +200 °C.',
    tags: 'rezistor,ntc,termistor,inrush,omezovač-proudu,leiditech,d-20',
  },
  {
    name: 'NTC D-25',
    packageType:
      'Diskový termistor Ø26,5 mm max., 2 radiální vývody (rozteč 10 mm) nebo axiální provedení ' +
      '(Ø8 mm max.), operační rozsah -55 až +200 °C',
    value:
      'NTC termistor, R25 1–16 Ω dle typu (1D-25…16D-25), Imax 6,0–12,0 A @25 °C',
    notes:
      'Shanghai Leiditech "NTC Thermistor" katalogový datasheet (rev. 01.06.2018) — ⚠️ součást ' +
      'stejné řady jako NTC D-5/D-7/D-9/D-11/D-13/D-15/D-20 (samostatné záznamy) — největší a ' +
      'proudově nejvýkonnější pouzdro v katalogu. Dostupné hodnoty: 1; 1,5; 3; 5; 8; 10; 12; 16 Ω. ' +
      'Imax 12,0–6,0 A, disipační konstanta δ 30–35 mW/°C, tepelná časová konstanta 120–126 s. ' +
      'Operační rozsah -55 až +200 °C. Určeno pro omezení nárazového proudu u výkonných spínaných ' +
      'zdrojů/UPS v řádu stovek wattů.',
    tags: 'rezistor,ntc,termistor,inrush,omezovač-proudu,leiditech,d-25',
  },
  {
    name: 'B59081G1120A161',
    packageType:
      'SMD "Gamma I" pouzdro, kupolovitý tvar Ø8±0,2 mm, výška 3,3 mm max., 2 ploché SMD ' +
      'kontakty (rozteč 10,8 mm mezi středy pájecích plošek), balení 16mm páska/cívka (330 mm)',
    value:
      'PTC termistor pro nadproudovou ochranu (samočinně zotavitelná "polyfuse"), RR 9 Ω ±20 %, ' +
      'ISmax 1,0 A @230 V AC',
    schematicImage: 'B59081G1120A161.jpg',
    notes:
      'EPCOS/TDK "B590** — PTC thermistors for overcurrent protection in telecom applications, ' +
      'Single SMDs" (dok. listopad 2009) — ⚠️ jiný typ termistoru než NTC řada D-5…D-25 v této ' +
      'knihovně (samostatné záznamy): PTC (kladný teplotní koeficient) prudce ZVYŠUJE odpor při ' +
      'zahřátí nadproudem a přejde do vysokoimpedančního "tripped" stavu, čímž omezí proud na ' +
      'bezpečnou hodnotu (samočinně zotavitelná pojistka, opak funkce NTC, který odpor se zahřátím ' +
      'SNIŽUJE a slouží k omezení nárazového/zapínacího proudu) — po odstranění poruchy a poklesu ' +
      'napětí/proudu se PTC samovolně vrátí do nízkoodporového stavu. Určeno pro ochranu ' +
      'telekomunikačních zařízení (linkové karty POTS, přístupové sítě, CPE, IVD) proti ' +
      'přetížení/zkratu linky v souladu s ITU-T K20/K21/K45 (základní i "enhanced" úroveň pro ' +
      'indukci ze sítě, kontakt se sítí i bleskový výboj) a GR-1089 (120 V/50 Hz/zkrat 25 A/15 min). ' +
      'Zpracována celá řada 8 typů ze stejného datasheetu (Gamma I: G1080/G1081/G1083/G1084/G1085/' +
      'G1086; Gamma L: G1012/G1040, samostatné záznamy pod objednacími kódy), lišících se ' +
      'jmenovitým odporem/proudovou třídou a pouzdrem. Konkrétní nahraný díl B59081G1120A161 = typ ' +
      'G1081: RR (jmenovitý odpor @25 °C) 9 Ω ±20 %, shoda odporu v páru (R25,match, pro ' +
      'vyvážené linky TIP/RING) max 0,5 Ω. IR (zbytkový proud v "tripped" stavu) max 180 mA ' +
      '@25 °C / 120 mA @70 °C. IS (spínací/trip proud) typ. 400 mA @25 °C. ISmax (max. trvale ' +
      'snesitelný proud) 1,0 A @230 V AC. Doba přepnutí (switching time) typ. 4,4 s @ISmax/230 V ' +
      'AC, 4,4 s @1 A/230 V AC, 23,0 s @500 mA/230 V AC. Max. provozní napětí 245 V AC. Provozní ' +
      'teplota -20 až +125 °C (bez napětí) / 0 až +70 °C (@230 V, trvale ve vypnutém/tripped ' +
      'stavu). UL schválení dle UL1434 (soubor E69802, jen Gamma I). RoHS.',
    tags: 'rezistor,ptc,termistor,nadproudová-ochrana,polyfuse,telekom,epcos,tdk,gamma-i',
  },
  {
    name: 'B59085G1120A161',
    packageType:
      'SMD "Gamma I" pouzdro, kupolovitý tvar Ø8±0,2 mm, výška 3,3 mm max., 2 ploché SMD ' +
      'kontakty, balení 16mm páska/cívka',
    value: 'PTC termistor pro nadproudovou ochranu, RR 10 Ω ±20 %, ISmax 1,0 A @230 V AC',
    schematicImage: 'B59081G1120A161.jpg',
    notes:
      'EPCOS/TDK "B590** — PTC thermistors for overcurrent protection in telecom applications" ' +
      '(dok. listopad 2009) — součást stejné řady 8 typů jako B59081/83/84/86/40/12-... (Gamma I: ' +
      'G1080/G1081/G1083/G1084/G1086; Gamma L: G1012/G1040, samostatné záznamy) — viz záznam ' +
      'B59081G1120A161 (typ G1081) pro plný popis principu funkce PTC a shody se standardy. Typ ' +
      'G1085: RR 10 Ω ±20 %, R25,match max 1,0 Ω. IR max 180 mA @25 °C / 120 mA @70 °C. IS typ. ' +
      '400 mA @25 °C. ISmax 1,0 A @230 V AC. Doba přepnutí typ. 3,9 s @ISmax/230 V AC, 3,9 s ' +
      '@1 A/230 V AC, 19,0 s @500 mA/230 V AC.',
    tags: 'rezistor,ptc,termistor,nadproudová-ochrana,polyfuse,telekom,epcos,tdk,gamma-i',
  },
  {
    name: 'B59083G1120A161',
    packageType:
      'SMD "Gamma I" pouzdro, kupolovitý tvar Ø8±0,2 mm, výška 3,3 mm max., 2 ploché SMD ' +
      'kontakty, balení 16mm páska/cívka',
    value: 'PTC termistor pro nadproudovou ochranu, RR 16 Ω ±20 %, ISmax 1,5 A @230 V AC',
    schematicImage: 'B59081G1120A161.jpg',
    notes:
      'EPCOS/TDK "B590** — PTC thermistors for overcurrent protection in telecom applications" ' +
      '(dok. listopad 2009) — součást stejné řady 8 typů jako B59081/85/84/86/40/12-... (Gamma I: ' +
      'G1080/G1081/G1084/G1085/G1086; Gamma L: G1012/G1040, samostatné záznamy) — viz záznam ' +
      'B59081G1120A161 (typ G1081) pro plný popis principu funkce PTC a shody se standardy. Typ ' +
      'G1083: RR 16 Ω ±20 %, R25,match max 0,5 Ω. IR max 150 mA @25 °C / 100 mA @70 °C. IS typ. ' +
      '300 mA @25 °C. ISmax 1,5 A @230 V AC. Doba přepnutí typ. 1,0 s @ISmax/230 V AC, 2,4 s ' +
      '@1 A/230 V AC, 11,0 s @500 mA/230 V AC.',
    tags: 'rezistor,ptc,termistor,nadproudová-ochrana,polyfuse,telekom,epcos,tdk,gamma-i',
  },
  {
    name: 'B59080G1120B262',
    packageType:
      'SMD "Gamma I" pouzdro, kupolovitý tvar Ø8±0,2 mm, výška 3,3 mm max., 2 ploché SMD ' +
      'kontakty, balení 16mm páska/cívka',
    value: 'PTC termistor pro nadproudovou ochranu, RR 25 Ω ±20 %, ISmax 2,8 A @230 V AC',
    schematicImage: 'B59081G1120A161.jpg',
    notes:
      'EPCOS/TDK "B590** — PTC thermistors for overcurrent protection in telecom applications" ' +
      '(dok. listopad 2009) — součást stejné řady 8 typů jako B59081/83/84/85/86/40/12-... (Gamma ' +
      'I: G1081/G1083/G1084/G1085/G1086; Gamma L: G1012/G1040, samostatné záznamy) — viz záznam ' +
      'B59081G1120A161 (typ G1081) pro plný popis principu funkce PTC a shody se standardy. Typ ' +
      'G1080: RR 25 Ω ±20 %, R25,match max 1,0 Ω. IR max 130 mA @25 °C / 85 mA @70 °C. IS typ. ' +
      '270 mA @25 °C. ISmax 2,8 A @230 V AC. Doba přepnutí typ. 0,2 s @ISmax/230 V AC, 1,5 s ' +
      '@1 A/230 V AC, 6,5 s @500 mA/230 V AC.',
    tags: 'rezistor,ptc,termistor,nadproudová-ochrana,polyfuse,telekom,epcos,tdk,gamma-i',
  },
  {
    name: 'B59086G1120B262',
    packageType:
      'SMD "Gamma I" pouzdro, kupolovitý tvar Ø8±0,2 mm, výška 3,3 mm max., 2 ploché SMD ' +
      'kontakty, balení 16mm páska/cívka',
    value: 'PTC termistor pro nadproudovou ochranu, RR 29 Ω ±20 %, ISmax 2,8 A @230 V AC',
    schematicImage: 'B59081G1120A161.jpg',
    notes:
      'EPCOS/TDK "B590** — PTC thermistors for overcurrent protection in telecom applications" ' +
      '(dok. listopad 2009) — součást stejné řady 8 typů jako B59081/83/84/85/80/40/12-... (Gamma ' +
      'I: G1080/G1081/G1083/G1084/G1085; Gamma L: G1012/G1040, samostatné záznamy) — viz záznam ' +
      'B59081G1120A161 (typ G1081) pro plný popis principu funkce PTC a shody se standardy. Typ ' +
      'G1086: RR 29 Ω ±20 %, R25,match max 1,0 Ω. IR max 125 mA @25 °C / 80 mA @70 °C. IS typ. ' +
      '260 mA @25 °C. ISmax 2,8 A @230 V AC. Doba přepnutí typ. 0,18 s @ISmax/230 V AC, 1,3 s ' +
      '@1 A/230 V AC, 5,5 s @500 mA/230 V AC.',
    tags: 'rezistor,ptc,termistor,nadproudová-ochrana,polyfuse,telekom,epcos,tdk,gamma-i',
  },
  {
    name: 'B59084G1120A161',
    packageType:
      'SMD "Gamma I" pouzdro, kupolovitý tvar Ø8±0,2 mm, výška 3,3 mm max., 2 ploché SMD ' +
      'kontakty, balení 16mm páska/cívka — nejvyšší jmenovitý odpor v podřadě Gamma I',
    value: 'PTC termistor pro nadproudovou ochranu, RR 50 Ω ±15 %, ISmax 2,5 A @230 V AC',
    schematicImage: 'B59081G1120A161.jpg',
    notes:
      'EPCOS/TDK "B590** — PTC thermistors for overcurrent protection in telecom applications" ' +
      '(dok. listopad 2009) — součást stejné řady 8 typů jako B59081/83/85/86/80/40/12-... (Gamma ' +
      'I: G1080/G1081/G1083/G1085/G1086; Gamma L: G1012/G1040, samostatné záznamy) — viz záznam ' +
      'B59081G1120A161 (typ G1081) pro plný popis principu funkce PTC a shody se standardy. Typ ' +
      'G1084: RR 50 Ω ±15 % (⚠️ užší tolerance než ostatní díly Gamma I, které mají ±20 %), ' +
      'R25,match max 1,0 Ω. IR max 90 mA @25 °C / 60 mA @70 °C. IS typ. 190 mA @25 °C. ISmax ' +
      '2,5 A @230 V AC. Doba přepnutí typ. 0,13 s @ISmax/230 V AC, 0,8 s @1 A/230 V AC, 3,1 s ' +
      '@500 mA/230 V AC.',
    tags: 'rezistor,ptc,termistor,nadproudová-ochrana,polyfuse,telekom,epcos,tdk,gamma-i',
  },
  {
    name: 'B59040G1120B161',
    packageType:
      'SMD "Gamma L" pouzdro, kupolovitý tvar Ø7±0,2 mm, výška 3,8 mm max., 2 ploché SMD ' +
      'kontakty (rozteč 11 mm mezi středy pájecích plošek), balení 24mm páska/cívka',
    value: 'PTC termistor pro nadproudovou ochranu, RR 25 Ω ±20 %, ISmax 4,0 A @230 V AC',
    schematicImage: 'B59081G1120A161.jpg',
    notes:
      'EPCOS/TDK "B590** — PTC thermistors for overcurrent protection in telecom applications" ' +
      '(dok. listopad 2009) — součást stejné řady 8 typů jako B59081/83/84/85/86/80/12-... (Gamma ' +
      'I: G1080/G1081/G1083/G1084/G1085/G1086; Gamma L: G1012, samostatné záznamy) — viz záznam ' +
      'B59081G1120A161 (typ G1081) pro plný popis principu funkce PTC a shody se standardy. ⚠️ ' +
      'Gamma L má odlišné, mírně větší pouzdro (Ø7 mm, výška 3,8 mm) než Gamma I (Ø8 mm, výška ' +
      '3,3 mm) — nezaměnitelné rozměry pájecí plošky (11 mm rozteč u Gamma L vs. 10,8 mm u Gamma ' +
      'I). Typ G1040: RR 25 Ω ±20 %, R25,match max 1,0 Ω. IR max 120 mA @25 °C / 80 mA @70 °C. IS ' +
      'typ. 250 mA @25 °C. ISmax 4,0 A @230 V AC — vyšší proudová třída než shodně označený ' +
      'G1080 v podřadě Gamma I (2,8 A). Doba přepnutí typ. 0,08 s @ISmax/230 V AC, 1,1 s @1 A/' +
      '230 V AC, 5,0 s @500 mA/230 V AC.',
    tags: 'rezistor,ptc,termistor,nadproudová-ochrana,polyfuse,telekom,epcos,tdk,gamma-l',
  },
  {
    name: 'B59012G1120A161',
    packageType:
      'SMD "Gamma L" pouzdro, kupolovitý tvar Ø7±0,2 mm, výška 3,8 mm max., 2 ploché SMD ' +
      'kontakty, balení 24mm páska/cívka — nejvyšší proudová třída v celé řadě',
    value: 'PTC termistor pro nadproudovou ochranu, RR 35 Ω +15/−20 %, ISmax 4,6 A @230 V AC',
    schematicImage: 'B59081G1120A161.jpg',
    notes:
      'EPCOS/TDK "B590** — PTC thermistors for overcurrent protection in telecom applications" ' +
      '(dok. listopad 2009) — součást stejné řady 8 typů jako B59081/83/84/85/86/80/40 (Gamma I: ' +
      'G1080/G1081/G1083/G1084/G1085/G1086; Gamma L: G1040, samostatné záznamy) — viz záznam ' +
      'B59081G1120A161 (typ G1081) pro plný popis principu funkce PTC, pouzdra Gamma L a shody se ' +
      'standardy. Typ G1012: RR 35 Ω, ⚠️ nesymetrická tolerance +15/−20 % (jediný díl v řadě s ' +
      'nesymetrickou tolerancí), R25,match max 1,0 Ω. IR max 100 mA @25 °C / 65 mA @70 °C. IS ' +
      'typ. 250 mA @25 °C. ISmax 4,6 A @230 V AC — nejvyšší proudová zatížitelnost v celé řadě ' +
      'B590**. Doba přepnutí typ. 0,05 s @ISmax/230 V AC, 0,8 s @1 A/230 V AC, 3,5 s @500 mA/' +
      '230 V AC.',
    tags: 'rezistor,ptc,termistor,nadproudová-ochrana,polyfuse,telekom,epcos,tdk,gamma-l',
  },
  {
    name: 'RT1206FRE073K01L',
    packageType:
      'SMD 1206 (3,10×1,60×0,55 mm), tenkovrstvý (thin film) čipový rezistor, Ni/matný cín ' +
      'terminace (bezolovnatá), keramický substrát; potisk hodnoty "3011" (E-96 kód pro 3,01 kΩ)',
    value: 'Přesný tenkovrstvý SMD rezistor 3,01 kΩ, ±1 %, TC 50 ppm/°C, 1/4 W, dodán na 7" cívce',
    notes:
      'Yageo/Phicomp "RT series — Thin Film Chip Resistors, High precision - high stability" ' +
      '(dok. produktová specifikace v.4, 21. 10. 2009) — katalogový datasheet celé řady RT0402 až ' +
      'RT2512, konkrétní kód objednávky RT1206FRE073K01L dekódován dle značení výrobce: RT1206 ' +
      '(velikost 1206) F (tolerance ±1 %) R (papírová/PE páska) E (TC 50 ppm/°C) 07 (7" cívka) ' +
      '3K01 (3,01 kΩ) L (výchozí kód objednávky). ⚠️ Jde o obecnou katalogovou řadu přesných ' +
      'tenkovrstvých rezistorů (technologie thin film, laserové doladění hodnoty), nikoli o ' +
      'jediný specifický díl — zaznamenána jako reprezentativní příklad s dekódovaným kódem ' +
      'nahraného dílu; odlišná technologie/přesnost od generické E12 řady (5 %, tlustovrstvá) ' +
      'v této knihovně. Řada pokrývá 7 velikostí (0402/0603/0805/1206/1210/2010/2512), tolerance ' +
      '±0,05/±0,1/±0,25/±0,5/±1 %, teplotní koeficient (TCR) 10/15/25/50 ppm/°C dle kombinace ' +
      'velikosti a tolerance, a hodnoty v řadě E-24/E-96 (na požádání i E-192). Pro RT1206: ' +
      'jmenovitý výkon 1/4 W @70 °C, max. pracovní napětí 200 V, max. přetížitelné napětí 400 V, ' +
      'elektrická pevnost 300 V, provozní teplota -55 až +125 °C, odporový rozsah dle tolerance ' +
      '10 Ω–1,5 MΩ (TC50, tol. ±0,5/1 %) až 10 Ω–100 kΩ (TC10). RoHS/Halogen Free (bezolovnaté ' +
      'terminace Ni/matný cín). Testováno dle IEC 60115-1/60068-x/MIL-STD-202G (teplotní cyklování ' +
      '300× -55/+125 °C, vlhkostní odolnost, pájitelnost při 260 °C/bezolovnatá pájka, ohyb DPS aj.) ' +
      '— vhodné pro přesné aplikace (měřicí obvody, zpětné vazby, převodníky) vyžadující nízkou ' +
      'teplotní driftaci a vysokou dlouhodobou stabilitu (±0,5 % po 1000 h @70 °C/125 °C/155 °C). ' +
      '⚠️ Aktualizace dle novějšího vydání téhož Yageo RT datasheetu (v.14, 23. 11. 2022, dok. ' +
      '"RT series 0100 to 2512"): řada byla od r. 2009 výrazně rozšířena — přidány velikosti ' +
      'RT0100 (0,40×0,20×0,13 mm — nejmenší běžně vyráběný SMD rezistor, 1/32 W, 15 V, hmotnost ' +
      '0,037 mg/ks, rozsah 50 mΩ ... vlastně 50R–5k Ω, tolerance jen ±0,25/±0,5/±1 %, TCR ±25/' +
      '±50 ppm/°C) a RT0201 (0,60×0,30×0,23 mm, 1/20 W); u existujících velikostí 0402–1206 ' +
      'přidána extrémní přesnost ±0,01 % (kód L) a ±0,02 % (kód P) a nejnižší TCR 5 ppm/°C (kód A) ' +
      'a 10 ppm/°C (kód B, dříve nejnižší dostupný); RT0402 nyní i s provozním rozsahem do ' +
      '+155 °C (dříve +125 °C); rozšířeny odporové rozsahy (např. RT0603 až 1 Ω–2 MΩ); doplněna ' +
      'hmotnost na kus (0,037 mg u RT0100 až 40,351 mg u RT2512) a pro RT2512 přidána i verze ' +
      '1 W. Nahraný konkrétní kód RT0100LRA07XXXXL odpovídá size RT0100, tolerance L=±0,01 %, ' +
      'reel R, TCR A=5 ppm/°C, 7" cívka — nejpřesnější/teplotně nejstabilnější a zároveň fyzicky ' +
      'nejmenší konfigurace v celé řadě (hodnota v kódu neuvedena/proměnná "XXXX").' +
      ' ⚠️ POZOR na záměnu názvů: výrobce Susumu má vlastní, zcela odlišnou "RT sérii" ' +
      'laditelných (trimmable) rezistorů se stejným prefixem "RT" i podobnými velikostními kódy ' +
      '(např. Susumu RT0603 = pouzdro 0201!) — viz samostatné záznamy Susumu RT0603/RT0510/' +
      'RT0816/RT1220, které s touto Yageo řadou nesouvisí.',
    tags: 'rezistor,smd,1206,precision,tenkovrstvý,thin-film,yageo,phicomp,rt-series',
  },
  {
    name: 'ROYALOHM Thick Film Chip Resistor',
    packageType:
      'SMD tlustovrstvý (thick film) čipový rezistor, standardní velikosti 0201(0603 metric)/' +
      '0402(1005)/0603(1608)/0805(2012)/1206(3216)/1210(3225)/1812/2010(5025)/2512(6432) + ' +
      'širokoterminálové varianty 0508/0612/1020/1218/1225; terminace Sn (vnější)/Ni bariéra ' +
      '(střední)/Ag (vnitřní) na vysocečisté alumina keramice, bezolovnaté (RoHS), MSL1',
    value:
      'Obecná řada 5% (i 1/2%) tlustovrstvých SMD rezistorů, E-24/E-96, 0,1 Ω–10 MΩ (dle ' +
      'velikosti), výkon 1/20 W (0201) až 1 W (2512), provozní teplota -55 až +155 °C',
    notes:
      'ROYALOHM (UNI-ROYAL Group) "Thick Film Chip Resistors" — katalogový datasheet celé řady ' +
      '(www.royalohm.com). ⚠️ NOVÝ TYP v této knihovně: první OBECNÁ (generic-purpose) SMD ' +
      'tlustovrstvá čipová řada — na rozdíl od precizní tenkovrstvé Yageo RT-series (viz záznam ' +
      'výše) jde o běžné 5% (příp. 1/2%) rezistory pro obecné použití, a na rozdíl od THT E12 ' +
      'řady (0,25 W, drátové vývody) v této knihovně jde o SMD čipové provedení v celé škále ' +
      'standardních velikostí — pravděpodobně nejběžnější typ rezistoru v moderních DPS. ' +
      'Objednací kód dekódován dle výrobce, např. "1206S4J0100T5E" = 1206 (velikost) S4 (výkon ' +
      '1/4W-S) J (tolerance ±5%) 0100 (odporová hodnota, E-24: 1.–3. číslice=platné číslice, ' +
      '4.=počet nul → 010×10⁰=10Ω) T (páska/cívka) 5 (5000 ks/cívka) E (bezolovnaté, RoHS). ' +
      'U E-96 kódu (tolerance ±1%) mají 1.–3. číslice význam platných číslic přímo, 4. číslice ' +
      'počet nul (písmena J/K/L nahrazují desetinnou čárku pro hodnoty <100: "012J"=1,2Ω, ' +
      '"226K"=22,6Ω). Tolerance: D=±0,5%, F=±1%, G=±2%, J=±5%. ' +
      '⚠️ Historie výkonových tříd (viz doprovodný dopis výrobce "Part No Explanation", ' +
      'aktualizace 14.9.2022): do r. 2000 měl každý rozměr pouzdra jednu pevnou výkonovou třídu ' +
      '(0402=1/16W, 0603=1/16W, 0805=1/10W, 1206=1/8W, 1210=1/4W, 2010=1/2W, 2512=1W); od r. 2000 ' +
      'byly výkonové třídy navýšeny (0603→1/10W, 0805→1/8W, 1206→1/4W, 1210→1/2W, 2010→3/4W), ' +
      'přičemž nové/vyšší výkonové značení nese příponu "-S" (resp. u 1210 "-SS") — starší i ' +
      'novější díly jsou elektricky/výrobně TOTOŽNÉ (stejný čip, jen jiné objednací značení kvůli ' +
      'historické kontinuitě se staršími zákaznickými schváleními), 0402 a 2512 zůstaly beze ' +
      'změny výkonu. Aktuální (navýšené) výkonové třídy dle velikosti: 0201=1/20W, 0402=1/16W, ' +
      '0603=1/10W-S/1/16W, 0805=1/8W-S/1/10W, 1206=1/4W-S/1/8W, 1210=1/2W-SS/1/3W-S/1/4W, ' +
      '1812=1/2W/3/4W-S, 2010=3/4W-S/1/2W, 2512=1W. Max. pracovní napětí/proud dle velikosti: ' +
      '0201 25V/0,5A, 0402 50V/1A, 0603 75V/1A, 0805 150V/2A, 1206 200V/2A, 1210 200V/2A, ' +
      '1812 200V/2A, 2010 200V/2A, 2512 200V/2A (max. přetížitelné 2–10A dle velikosti). ' +
      'Dielektrická pevnost 100–500V dle velikosti (0402 100V, 0603 300V, 0805+ 500V). Teplotní ' +
      'koeficient (TCR): 0Ω1–0Ω99 ±800ppm/°C, 1Ω–10Ω ±400ppm/°C, 10,1Ω–100Ω ±200ppm/°C, >100Ω ' +
      '±100ppm/°C (u 0201: >100Ω ±200ppm/°C). Izolační odpor min. 1000 MΩ. Nízkoodporová řada ' +
      '(0,1–0,99Ω) dostupná pro velikosti 0402/0603/0805/1206/1210/2010/2512. Standard: E-96 ' +
      '(0,5%/1%), E-24 (2%/5%). Jumper (0Ω propojka) dostupný pro všechny velikosti (<50 mΩ). ' +
      'Vhodné pro vlnové i reflow pájení, standardní cívka 7" (4"/10"/13" na vyžádání).',
    tags: 'rezistor,smd,tlustovrstvý,thick-film,chip,royalohm,uni-royal,e24,e96,obecný,katalog',
  },
  {
    name: 'Susumu RT0603',
    packageType:
      'SMD pouzdro velikosti 0201 (L 0,60±0,05 × W 0,30±0,05 × T 0,23±0,05 mm, kontakt P ' +
      '0,12±0,05 mm), tenkovrstvý (thin film) laditelný čipový rezistor',
    value:
      'Laditelný (trimmable) tenkovrstvý SMD rezistor, počáteční hodnota 150/330/1,5k Ω, ' +
      'laserem doladitelný nahoru až na 1,0k/2,2k/10k Ω, ±20 %, 1/20 W',
    notes:
      'Susumu Group "RT series, high-precision trimmable chip resistors" (katalogový datasheet) ' +
      '— ⚠️ POZOR: NEJDE o stejnou řadu jako Yageo/Phicomp "RT series" (viz záznam ' +
      'RT1206FRE073K01L v této knihovně) — shoda prefixu "RT" i velikostních kódů (zde "0603") ' +
      'je čistě náhodná/kolizní, jde o zcela jiného výrobce i jinou technologii. Susumu RT je ' +
      'unikátní JEDNOKROKOVĚ laserem laditelná (in-circuit trimmable) tenkovrstvá součástka — ' +
      'na rozdíl od běžných rezistorů, kde se hodnota nastavuje laserovým řezem při výrobě, lze ' +
      'zde hodnotu doladit AŽ PO OSAZENÍ do obvodu (in-circuit tuning), a to bez nutnosti ' +
      'vlhkotěsné ochrany po trimování (patent č. 1921853). Vynikající teplotní charakteristiky, ' +
      'nízký šum a nízké zkreslení 3. harmonickou — vhodné pro přesné analogové obvody vyžadující ' +
      'doladění po osazení (např. kalibrace zesílení, referenční napětí, filtry). Susumu RT0603 ' +
      '(označuje pouzdro velikosti 0201, "New first in the market 0201 trimmable chip resistor") ' +
      '— součást stejné rodiny 4 velikostí jako Susumu RT0510/RT0816/RT1220 (samostatné ' +
      'záznamy), lišících se pouzdrem a rozsahem hodnot. Počáteční hodnoty 150/330/1,5k Ω, ' +
      'laditelné nahoru až na horní mez 1,0k/2,2k/10k Ω (dle počáteční hodnoty). TCR ±25 ppm/°C ' +
      '(kód P). Tolerance ±20 % (kód M). Výkon 1/20 W, max. pracovní napětí 15 V, max. přetížitelné ' +
      'napětí 30 V. Balení 15 000 ks/cívka. RoHS, zcela bezolovnaté. Kód objednávky: RT<velikost>' +
      '<TCR kód>-<3místný EIA odporový kód>-<tolerance kód M>, např. RT0816P-102-M = 1 kΩ, ' +
      'TCR ±25 ppm/°C, tolerance ±20 %.',
    tags: 'rezistor,smd,0201,trimovatelný,trimmable,laditelný,susumu,thin-film,rt-series',
  },
  {
    name: 'Susumu RT0510',
    packageType:
      'SMD pouzdro velikosti 0402 (L 1,00±0,07 × W 0,50±0,07 × T 0,35±0,05 mm, kontakt P ' +
      '0,20±0,10 mm), tenkovrstvý (thin film) laditelný čipový rezistor',
    value:
      'Laditelný (trimmable) tenkovrstvý SMD rezistor, počáteční hodnota 100/270/1,5k Ω (i 50 Ω), ' +
      'laserem doladitelný nahoru až na 820/2,1k/10k Ω, ±20 %, 1/16 W',
    notes:
      'Susumu Group "RT series, high-precision trimmable chip resistors" — součást stejné rodiny ' +
      '4 velikostí jako Susumu RT0603/RT0816/RT1220 (samostatné záznamy) — viz záznam Susumu ' +
      'RT0603 pro plný popis principu jednokrokového laserem laditelného (in-circuit trimmable) ' +
      'tenkovrstvého rezistoru a upozornění na kolizi názvu s nesouvisející řadou Yageo/Phicomp ' +
      '"RT series" v této knihovně. Susumu RT0510 = pouzdro velikosti 0402. Počáteční hodnoty ' +
      '100/270/1,5k Ω (dostupná i varianta s počáteční hodnotou 50 Ω), laditelné nahoru až na ' +
      'horní mez 820/2,1k/10k Ω. TCR ±25 ppm/°C (kód P). Tolerance ±20 % (kód M). Výkon 1/16 W, ' +
      'max. pracovní napětí 25 V, max. přetížitelné napětí 50 V. Balení 10 000 ks/cívka.',
    tags: 'rezistor,smd,0402,trimovatelný,trimmable,laditelný,susumu,thin-film,rt-series',
  },
  {
    name: 'Susumu RT0816',
    packageType:
      'SMD pouzdro velikosti 0603 (L 1,60±0,20 × W 0,80±0,20 × T 0,40±0,10 mm, kontakt P ' +
      '0,30±0,20 mm), tenkovrstvý (thin film) laditelný čipový rezistor',
    value:
      'Laditelný (trimmable) tenkovrstvý SMD rezistor, počáteční hodnota 100/330/1k/3,3k/10k Ω, ' +
      'laserem doladitelný nahoru až na 2,7k–40k Ω, ±20 %, 1/16 W',
    notes:
      'Susumu Group "RT series, high-precision trimmable chip resistors" — součást stejné rodiny ' +
      '4 velikostí jako Susumu RT0603/RT0510/RT1220 (samostatné záznamy) — viz záznam Susumu ' +
      'RT0603 pro plný popis principu jednokrokového laserem laditelného (in-circuit trimmable) ' +
      'tenkovrstvého rezistoru a upozornění na kolizi názvu s nesouvisející řadou Yageo/Phicomp ' +
      '"RT series" v této knihovně. Susumu RT0816 = pouzdro velikosti 0603 (např. ' +
      'RT0816P-102-M = 1 kΩ, TCR ±25 ppm/°C, ±20 %, viz vzor kódu v záznamu RT0603). Počáteční ' +
      'hodnoty 100/330/1k/3,3k/10k Ω, laditelné nahoru na horní meze 2,7k/8,0k/8,8k/37k/40k Ω. ' +
      'TCR ±25 ppm/°C (kód P) nebo ±100 ppm/°C (kód R). Tolerance ±20 % (kód M). Výkon 1/16 W, ' +
      'max. pracovní napětí 75 V, max. přetížitelné napětí 150 V. Balení 5 000 ks/cívka.',
    tags: 'rezistor,smd,0603,trimovatelný,trimmable,laditelný,susumu,thin-film,rt-series',
  },
  {
    name: 'Susumu RT1220',
    packageType:
      'SMD pouzdro velikosti 0805 (L 2,00±0,20 × W 1,25±0,20 × T 0,40±0,10 mm, kontakt P ' +
      '0,40±0,20 mm), tenkovrstvý (thin film) laditelný čipový rezistor',
    value:
      'Laditelný (trimmable) tenkovrstvý SMD rezistor, počáteční hodnota 33 Ω–100 kΩ (8 tříd), ' +
      'laserem doladitelný nahoru až na 4,7k–220k Ω, ±20 %, 1/10 W — nejvyšší výkonová/napěťová ' +
      'třída v řadě',
    notes:
      'Susumu Group "RT series, high-precision trimmable chip resistors" — součást stejné rodiny ' +
      '4 velikostí jako Susumu RT0603/RT0510/RT0816 (samostatné záznamy) — viz záznam Susumu ' +
      'RT0603 pro plný popis principu jednokrokového laserem laditelného (in-circuit trimmable) ' +
      'tenkovrstvého rezistoru a upozornění na kolizi názvu s nesouvisející řadou Yageo/Phicomp ' +
      '"RT series" v této knihovně. Susumu RT1220 = pouzdro velikosti 0805, největší a ' +
      'výkonově/napěťově nejvyšší třída v katalogu. Počáteční hodnoty 33/100/330/1k/3,3k/10k/' +
      '33k/100k Ω, laditelné nahoru na horní meze 4,7k/8,2k/15k/15k/100k/120k/120k/220k Ω. TCR ' +
      '±50 ppm/°C (kód Q), ±25 ppm/°C (kód P) nebo ±100 ppm/°C (kód R) dle konkrétní hodnoty. ' +
      'Tolerance ±20 % (kód M). Výkon 1/10 W, max. pracovní napětí 100 V, max. přetížitelné ' +
      'napětí 200 V. Balení 5 000 ks/cívka.',
    tags: 'rezistor,smd,0805,trimovatelný,trimmable,laditelný,susumu,thin-film,rt-series',
  },
  {
    name: 'TRA06E',
    packageType:
      '8vývodové SMD pouzdro rezistorové sítě, tenkovrstvá (thin film) technologie, obalové ' +
      '(wrap around) zakončení vývodů, rozměry L 3,2±0,3 × W 1,6±0,15 mm, izolované vnitřní ' +
      'elektrody',
    value:
      'Tenkovrstvá rezistorová síť (izolovaná, schéma "03" — 4 nezávislé rezistory), rozsah 10 Ω ' +
      'až 330 kΩ, tolerance 0,1–1 %, výkon 0,063 W/rezistor, TCR ±25 až ±100 ppm/°C',
    notes:
      'Vishay Dale "TRA06E — Thin Film, Resistor Array" (dok. č. 31054, rev. 05.4.2004) — ⚠️ NOVÁ ' +
      'TŘÍDA rezistorové součástky v této knihovně: první REZISTOROVÁ SÍŤ/POLE (resistor array) — ' +
      'na rozdíl od jednotlivých rezistorů (E12 řada, Susumu RT/laditelné, Yageo RT1206 aj.) v ' +
      'této knihovně jde o JEDNO SMD pouzdro obsahující 4 VZÁJEMNĚ IZOLOVANÉ rezistory (schéma ' +
      '"03" — každý rezistor má vlastní pár vývodů, žádný společný/sdílený vývod), určené pro ' +
      'aplikace vyžadující více přesně přizpůsobených rezistorů na malé ploše (např. děliče ' +
      'napětí, pull-up sítě, RC filtry) s vysokou vzájemnou shodou teplotního součinitele ' +
      '(TCR tracking ±10 ppm/°C mezi rezistory v poli — výrazně těsnější než absolutní TCR ' +
      '±50 až ±100 ppm/°C jednotlivého rezistoru). Tenkovrstvá technologie s vnitřní ochranou ' +
      'elektrod a obalovým (wrap around) zakončením vývodů pro průtokové pájení (flow solderable) ' +
      'a automatické osazování. Objednací kód TRA06E-08-03-<R-hodnota><tolerance>-<balení>, např. ' +
      'TRA06E080310 1FRT1 = 8 vývodů, obvod 03, 100 Ω, ±1 %, papírová páska 5000 ks. Rozsah ' +
      'odporu dle TCR třídy: 100R–33K (TCR ±25 ppm/°C, tol. 0,1/0,5/1 %), 10R–91R (TCR ±50 ppm/°C, ' +
      'tol. 0,5/1 %), 36K–330K (TCR ±100 ppm/°C, tol. 0,5/1 %). Jmenovité napětí max. 50 V ' +
      '(limiting element voltage, √(P×R)), napěťový koeficient < 0,1 ppm/V (velmi nízký, typické ' +
      'pro tenkovrstvou technologii oproti tlustovrstvé). Kategorie teplotní rozsah -55 až +150 °C ' +
      '(derating od 70 °C lineárně k 0 % @150 °C). Rozteč vývodů (pitch) 0,8 mm. Zkoušky dle EIA ' +
      '575: endurance test 1000 h @70 °C (±3,0 %), přetížení (±2,0 %), teplotní šok (±1,0 %), ' +
      'vlhkostní odolnost (±1,0 %), odolnost pájecímu teplu 10 s @260 °C (±2,0 %), pájitelnost ' +
      '95% pokrytí.',
    tags: 'rezistor,rezistorová-síť,resistor-array,smd,tenkovrstvý,thin-film,vishay-dale,tra06e,izolovaný',
  },
  {
    name: 'RC0801-100J100J',
    packageType:
      'THT SIP pouzdro (single in-line), 8 pinů (konfigurace RC-01), rozteč pinů 2,54 mm, ' +
      'délka pouzdra 0,1"×počet pinů max., výška max 8,9 mm (nízkoprofilová verze dostupná)',
    value:
      'Kombinovaná rezistorová/kapacitní síť (RC network), rezistor 10 Ω ±5 %, kondenzátor 10 pF ' +
      '±5 % (NPO/COG dielektrikum, 50 V), zapojení dle schématu RC-01',
    notes:
      'RCD Components Inc. "RC Series — Capacitor and Resistor/Capacitor Networks" (dok. FA100) ' +
      '— ⚠️ NOVÁ TŘÍDA v této knihovně: KOMBINOVANÁ rezistorová+kapacitní síť v jednom SIP ' +
      'pouzdru — na rozdíl od Vishay Dale TRA06E v této knihovně (čistě rezistorová síť, 4 ' +
      'izolované rezistory, SMD) obsahuje RC Series jak REZISTOROVÉ, tak KAPACITNÍ prvky ' +
      'současně v jednom pouzdru, propojené dle jednoho z 16 standardních schémat (RC-01 až ' +
      'RC-16, každé s jiným zapojením/počtem vývodů 4-14 pinů — možné i zákaznické obvody). Z ' +
      'názvu souboru identifikován konkrétní díl RC0801-100J100J = pouzdro RC-08 (8 pinů), ' +
      'konfigurace obvodu "01" (schéma RC-01), rezistorový kód 100 = 10 Ω ±5 % (J), kapacitní kód ' +
      '100 = 10 pF ±5 % (J), výchozí napětí 50 V a dielektrikum NPO/COG (nejsou v P/N explicitně ' +
      'přepsány, tedy standardní). Rezistorový rozsah celé řady: 22 Ω–1 MΩ standardně (1 Ω–100 MΩ ' +
      'na vyžádání), tolerance ±5 % std (±2 %/±1 % dostupné), TCR ±100 ppm/°C typ. (±250 ppm pro ' +
      '<50Ω a >2,2MΩ), napětí 50V std (do 1kV dostupné), výkon 0,2 W @25°C (0,125 W/pin balíku). ' +
      'Kapacitní rozsah celé řady: 10 pF–0,1 µF standardně (0,5 pF–10 µF na vyžádání), napětí ' +
      '50V std (6,3V–2kV dostupné), dielektrika COG(NPO)/X7R/X5R/Y5V/Z5U. Objednací kód: RC<počet ' +
      'pinů><konfigurace>-<rezistorový kód Ω, 2 platné číslice+násobitel><tol. rezistoru: J=5%/ ' +
      'G=2%><kapacitní kód pF, 2 platné číslice+násobitel><tol. kondenzátoru: J=5%/K=10%/M=20%/ ' +
      'Z=+80%-20%><volitelně napětí kondenzátoru pokud jiné než 50V><volitelně dielektrikum: ' +
      'G=COG/R=X7R/X=X5R/U=Z5U/V=Y5V><volitelně balení/zakončení>. Provozní teplota -55 až ' +
      '+125 °C. Zařazeno do kategorie "Rezistor" jako pasivní síťová součástka, obdobně jako ' +
      'TRA06E v této knihovně. RoHS kompatibilní verze "W" (bezolovnaté zakončení) odolná pájení ' +
      'do 260°C.',
    tags: 'rezistor,kondenzátor,rezistorová-síť,rc-network,sip,rcd-components,rc-series,kombinovaná-síť',
  },
  {
    name: 'Otočný potenciometr 1 kΩ (lineární)',
    packageType: 'THT, panelový, hřídel Ø6 mm, 3 piny',
    value: '1 kΩ, lineární průběh (B)',
    notes: 'Obecný jednootáčkový otočný potenciometr pro panelovou montáž.',
    tags: 'rezistor,potenciometr,lineární,otočný',
  },
  {
    name: 'Otočný potenciometr 10 kΩ (lineární)',
    packageType: 'THT, panelový, hřídel Ø6 mm, 3 piny',
    value: '10 kΩ, lineární průběh (B)',
    notes: 'Obecný jednootáčkový otočný potenciometr pro panelovou montáž.',
    tags: 'rezistor,potenciometr,lineární,otočný',
  },
  {
    name: 'Otočný potenciometr 100 kΩ (lineární)',
    packageType: 'THT, panelový, hřídel Ø6 mm, 3 piny',
    value: '100 kΩ, lineární průběh (B)',
    notes: 'Obecný jednootáčkový otočný potenciometr pro panelovou montáž.',
    tags: 'rezistor,potenciometr,lineární,otočný',
  },
  {
    name: 'Otočný potenciometr 10 kΩ (logaritmický, audio)',
    packageType: 'THT, panelový, hřídel Ø6 mm, 3 piny',
    value: '10 kΩ, logaritmický průběh (A) — audio taper',
    notes: 'Logaritmický potenciometr pro regulaci hlasitosti/audio aplikace.',
    tags: 'rezistor,potenciometr,logaritmický,audio,otočný',
  },
  {
    name: 'Otočný potenciometr 100 kΩ (logaritmický, audio)',
    packageType: 'THT, panelový, hřídel Ø6 mm, 3 piny',
    value: '100 kΩ, logaritmický průběh (A) — audio taper',
    notes: 'Logaritmický potenciometr pro regulaci hlasitosti/audio aplikace.',
    tags: 'rezistor,potenciometr,logaritmický,audio,otočný',
  },
  {
    name: 'Trimr 1 kΩ',
    packageType: 'THT, ležatý nebo stojatý, rozteč 5 mm (typ 3296 nebo obdobný)',
    value: '1 kΩ',
    notes: 'Podstavný trimovací potenciometr pro nastavení na DPS.',
    tags: 'rezistor,trimr,trimovací',
  },
  {
    name: 'Trimr 10 kΩ',
    packageType: 'THT, ležatý nebo stojatý, rozteč 5 mm (typ 3296 nebo obdobný)',
    value: '10 kΩ',
    notes: 'Podstavný trimovací potenciometr pro nastavení na DPS.',
    tags: 'rezistor,trimr,trimovací',
  },
  {
    name: 'Trimr 100 kΩ',
    packageType: 'THT, ležatý nebo stojatý, rozteč 5 mm (typ 3296 nebo obdobný)',
    value: '100 kΩ',
    notes: 'Podstavný trimovací potenciometr pro nastavení na DPS.',
    tags: 'rezistor,trimr,trimovací',
  },
  {
    name: 'Trimr SMD 10 kΩ',
    packageType: 'SMD, 3 piny, cca 4×4 mm (typ 3314/TC33X)',
    value: '10 kΩ',
    notes: 'SMD podstavný trimovací potenciometr.',
    tags: 'rezistor,trimr,trimovací,smd',
  },
];

const CAPACITOR_PART_SPECS: PartSpec[] = [
  {
    name: 'NTE 90000 Series',
    packageType:
      'THT keramický disk, radiální vývody, rozteč (S) 7,5 mm (větší hodnoty 8,5–10,5 mm), ' +
      'průměr disku (D) 5–20 mm dle kapacity — viz tabulka rozměrů v datasheetu pro konkrétní ' +
      'hodnotu',
    value:
      'Keramický diskový kondenzátor, 1000 V DC, 1,0 pF – 0,10 µF (100 000 pF) dle konkrétního ' +
      'typu v řadě',
    notes:
      'NTE Electronics "1000V Ceramic Disc — 90000 Series" katalogový list — vysokonapěťová řada ' +
      'keramických diskových kondenzátorů, ⚠️ odlišná od generických keramických kondenzátorů ' +
      'v této knihovně (bulk generované hodnoty 10 pF–470 nF, jmenovité napětí jen 50 V) — tato ' +
      'řada je dimenzována na 1000 V DC (zkušební/withstand napětí 2500 V DC), typické použití ' +
      'jako odrušovací/blokovací kondenzátory v obvodech s vyšším napětím. Zpracována jako jeden ' +
      'souhrnný záznam pokrývající celou řadu ~80 konkrétních kapacitních hodnot (1,0 pF až ' +
      '0,10 µF), ne jako desítky samostatných řádků — obdoba přístupu u NTC termistorů řady D-5 ' +
      'až D-25 v této knihovně. Objednací kód kóduje kapacitu přímo v čísle typu (např. 9002D0 = ' +
      '2,0 pF, 90220 = 2000 pF, 90347 = 0,047 µF) — formát "90" + multiplikátor + kapacita v pF. ' +
      'Značení na součástce 3místným kódem (např. 202 = 2000 pF, 473 = 0,047 µF). Tolerance a ' +
      'teplotní koeficient se liší dle rozsahu hodnot: 9001D0–9009D0 ±0,5 pF (TK "SL"), ' +
      '90010–90210 ±10 % (TK "Y5F" do 90118, "Y5P" od 90122), 90212–90220 +80/−20 % (TK "Z5V"), ' +
      '90222 ±20 % (TK "Z5U"), 90227–90410 +80/−20 % (TK "Z5V") — u konkrétního kusu je nutné ' +
      'dohledat přesnou toleranci/TK dle jeho čísla typu v rozsahu. Provozní teplota -25 až ' +
      '+85 °C. Izolační odpor min. 7500 MΩ (měřeno po 1 minutě při jmenovitém napětí). Rozměry ' +
      '(průměr disku D, rozteč vývodů S) rostou s kapacitou — od D=5 mm/S=7,5 mm (malé pF hodnoty) ' +
      'až po D=20 mm/S=10,5 mm (0,10 µF).',
    tags: 'kondenzátor,keramický,vysokonapěťový,disk,1000v,nte,90000',
  },
  {
    name: 'Multicomp MCBU/MCFU Series',
    packageType:
      'THT keramický disk, radiální rovné vývody, průměr disku 5/6/7/8 mm dle kapacity, ' +
      'rozteč vývodů (F) 2,5 mm (5mm disk) nebo 5,0 mm (6/7/8mm disk), tloušťka disku max 3,5 mm ' +
      '— objednací kód např. MCBU5101K5 (100 pF, disk 5 mm, tolerance K=±10 %)',
    value:
      'Keramický diskový kondenzátor, 50 V, 100 pF – 47 nF (47 000 pF), dvě přesnostní třídy: ' +
      'MCBU (Y5P, ±10 %) a MCFU (Z5V, +80/−20 %)',
    notes:
      'Multicomp (Premier Farnell/Newark) "MCBU, MCFU Series — Ceramic Disc Capacitors" datasheet ' +
      'V1.0 (31.8.2006). ⚠️ Elektricky se rozsah kapacity/napětí značně překrývá s generickými ' +
      '50V keramickými kondenzátory bulk-generovanými v této knihovně (10 pF–470 nF) — hlavní ' +
      'rozdíl je v pojmenovaném/značeném produktu se dvěma jasně definovanými přesnostními ' +
      'třídami: MCBU s dielektrikem Y5P (nelineární teplotní koeficient, těsná tolerance ±10 %, ' +
      'ztrátový činitel tan δ ≤2,5 %) a MCFU s dielektrikem Z5V (širší tolerance +80/−20 %, ' +
      'tan δ ≤5 %, nižší cena) — u obecných bulk položek v knihovně tato volba není rozlišena. ' +
      'Provozní teplota -25 až +85 °C (MCB/Y5P) nebo +10 až +85 °C (MCF/Z5V, užší rozsah zdola). ' +
      'Izolační odpor při 25 °C min. 10 000 MΩ nebo 200 MΩ/µF (podle toho, co je menší). ' +
      'Dielektrická pevnost 2,5× jmenovité napětí (tedy 125 V zkušebně při 50V dílu). Testovací ' +
      'podmínky kapacity: 1 kHz ±20 %, 1,0 ±0,2 Vrms. Rozměry dle kapacitního rozsahu: disk 5 mm ' +
      '(1200–2200 pF u MCB, celý rozsah 1000–5600 pF u MCF), 6 mm (2700–3300 pF), 7 mm ' +
      '(3900–4700 pF), 8 mm (5600–6800 pF) — u menších kapacit (100–470 pF, 1 nF) rovněž disk ' +
      '5 mm. Objednací kód kóduje: teplotní charakteristiku (MCB/MCF) + jmenovité napětí (U=50 V) ' +
      '+ průměr disku (5/6/7/8) + kód kapacity (EIA 3místný, např. 102=1000 pF) + toleranci ' +
      '(K=±10 %, Z=+80/−20 %) + typ vývodů (5=rovné rozteč 2,5 mm, 6=rovné rozteč 5,0 mm, ' +
      'G=ammo balení, L=cívka).',
    tags: 'kondenzátor,keramický,disk,multicomp,mcbu,mcfu,y5p,z5v',
  },
  {
    name: '473GMR012M',
    packageType:
      'THT keramický disk, radiální rovné vývody, D max 6,0 mm, T max 3,5 mm, rozteč vývodů ' +
      'S 5,0±1,5 mm, průměr vývodu d 0,47±0,02 mm',
    value: 'Keramický diskový kondenzátor, 47 nF (0,047 µF), ±20 % (M), 12 WVDC, dielektrikum Y5T',
    notes:
      'Illinois Capacitor Inc. "GMR/GQR Ceramic Disc Capacitors" katalogový list — GMR série je ' +
      '⚠️ nízkonapěťová (jen 12 WVDC), výrazně nižší než generické 50V keramické kondenzátory ' +
      'v této knihovně i než ostatní diskové série (Multicomp MCBU/MCFU 50 V, NTE 90000 1000 V, ' +
      'samostatné záznamy) — vhodná jen pro nízkonapěťové obvody. Provozní teplota -30 až +85 °C. ' +
      'Izolační odpor ≥1 MΩ (měřeno @12 WVDC/1 min). Ztrátový činitel max 5,0 % @1 kHz/+20 °C. ' +
      'Dielektrická pevnost 250 % jmenovitého napětí (60 s). Životnostní test 1000 h @200 % ' +
      'jmenovitého napětí.',
    tags: 'kondenzátor,keramický,disk,illinois-capacitor,gmr,nízkonapěťový,y5t',
  },
  {
    name: '104GMR012M',
    packageType:
      'THT keramický disk, radiální rovné vývody, D max 9,0 mm, T max 3,5 mm, rozteč vývodů ' +
      'S 5,0±1,5 mm, průměr vývodu d 0,47±0,02 mm',
    value: 'Keramický diskový kondenzátor, 100 nF (0,1 µF), ±20 % (M), 12 WVDC, dielektrikum Y5U',
    notes:
      'Illinois Capacitor Inc. "GMR/GQR Ceramic Disc Capacitors" katalogový list — součást stejné ' +
      'nízkonapěťové (12 WVDC) série GMR jako 473GMR012M/204GMR012Z (samostatné záznamy), větší ' +
      'kapacita ve větším pouzdře (D 9,0 mm oproti 6,0 mm). Provozní teplota -30 až +85 °C. ' +
      'Izolační odpor ≥1 MΩ (měřeno @12 WVDC/1 min). Ztrátový činitel max 5,0 % @1 kHz/+20 °C. ' +
      'Dielektrická pevnost 250 % jmenovitého napětí (60 s). Životnostní test 1000 h @200 % ' +
      'jmenovitého napětí.',
    tags: 'kondenzátor,keramický,disk,illinois-capacitor,gmr,nízkonapěťový,y5u',
  },
  {
    name: '204GMR012Z',
    packageType:
      'THT keramický disk, radiální rovné vývody, D max 9,0 mm, T max 3,5 mm, rozteč vývodů ' +
      'S 7,5±1,5 mm, průměr vývodu d 0,47±0,02 mm',
    value:
      'Keramický diskový kondenzátor, 200 nF (0,2 µF), -20/+80 % (Z), 12 WVDC, dielektrikum Y5U',
    notes:
      'Illinois Capacitor Inc. "GMR/GQR Ceramic Disc Capacitors" katalogový list — součást stejné ' +
      'nízkonapěťové (12 WVDC) série GMR jako 473GMR012M/104GMR012M (samostatné záznamy) — ' +
      '⚠️ na rozdíl od nich má širokou toleranci -20/+80 % (kód Z) místo těsné ±20 % (kód M), ' +
      'jinak stejné pouzdro (D 9,0 mm) jako 104GMR012M, jen delší rozteč vývodů (S 7,5 mm místo ' +
      '5,0 mm). Provozní teplota -30 až +85 °C. Izolační odpor ≥1 MΩ. Ztrátový činitel max 5,0 % ' +
      '@1 kHz/+20 °C. Dielektrická pevnost 250 % jmenovitého napětí (60 s). Životnostní test ' +
      '1000 h @200 % jmenovitého napětí.',
    tags: 'kondenzátor,keramický,disk,illinois-capacitor,gmr,nízkonapěťový,y5u',
  },
  {
    name: '102GQR500Z',
    packageType:
      'THT keramický disk, radiální rovné vývody, D max 6,0 mm, T max 3,0 mm, rozteč vývodů ' +
      'S 5,0±1,5 mm, průměr vývodu d 0,58±0,02 mm',
    value:
      'Keramický diskový kondenzátor, 1 nF (0,001 µF), -20/+80 % (Z), 500 WVDC, dielektrikum Y5P',
    notes:
      'Illinois Capacitor Inc. "GMR/GQR Ceramic Disc Capacitors" katalogový list — GQR série je ' +
      'vysokonapěťová (500 WVDC) — ⚠️ zcela odlišná napěťová třída od nízkonapěťové GMR série ' +
      '(12 WVDC, samostatné záznamy 473GMR012M/104GMR012M/204GMR012Z), přesto o řád nižší napětí ' +
      'než 1000V série NTE 90000 (samostatný záznam). Dielektrikum Y5P (EIA třída II), ztrátový ' +
      'činitel max 2,5 % @1 kHz/+20 °C. Provozní teplota -30 až +85 °C (Y5P varianta). Izolační ' +
      'odpor ≥1000 MΩ. Dielektrická pevnost 250 % jmenovitého napětí (60 s). Životnostní test ' +
      '1000 h @200 % jmenovitého napětí. Shoda s E.I.A. RS 198, Class II.',
    tags: 'kondenzátor,keramický,disk,illinois-capacitor,gqr,vysokonapěťový,y5p,500v',
  },
  {
    name: '103GQR500Z',
    packageType:
      'THT keramický disk, radiální rovné vývody, D max 8,0 mm, T max 3,0 mm, rozteč vývodů ' +
      'S 6,35±1,5 mm, průměr vývodu d 0,58±0,02 mm',
    value:
      'Keramický diskový kondenzátor, 10 nF (0,01 µF), -20/+80 % (Z), 500 WVDC, dielektrikum Z5V',
    notes:
      'Illinois Capacitor Inc. "GMR/GQR Ceramic Disc Capacitors" katalogový list — součást stejné ' +
      'vysokonapěťové (500 WVDC) série GQR jako 102GQR500Z (samostatný záznam), ale ⚠️ jiné ' +
      'dielektrikum: Z5V (EIA třída III, ztrátový činitel max 3,0 % @1 kHz/+20 °C, užší provozní ' +
      'teplota +10 až +85 °C) místo Y5P (třída II, 2,5 %, -30 až +85 °C) u 102GQR500Z — vyšší ' +
      'kapacita v poměru k rozměru díky odlišnému dielektriku. Izolační odpor ≥1000 MΩ. ' +
      'Dielektrická pevnost 250 % jmenovitého napětí (60 s). Životnostní test 1000 h @200 % ' +
      'jmenovitého napětí. Shoda s E.I.A. RS 198, Class III.',
    tags: 'kondenzátor,keramický,disk,illinois-capacitor,gqr,vysokonapěťový,z5v,500v',
  },
  {
    name: 'CCNPO101J50V5B1',
    packageType:
      'THT keramický disk, tělo Ø cca 6 mm (dle tabulky rozsahu kapacit pro NP0 při 50–100 pF), ' +
      'kompletně durezem potažené (celoplošně krytované) vývody, rozteč vývodů 5,08 mm (kód "5"), ' +
      'nominální průměr vývodu 0,6 mm, izolační fenolický povlak (namáčecí metoda)',
    value: 'Keramický diskový kondenzátor, 100 pF, ±5 pF (kód J), 50 V, dielektrikum NP0 (Class 1)',
    notes:
      'Meritek "Ceramic Disc Capacitors CC Series" katalogový list rev. 6a. Konkrétní díl dle ' +
      'systému značení výrobce: CC (řada) + NPO (teplotní charakteristika, Class 1) + 101 ' +
      '(kapacitní kód EIA: 10×10¹ pF = 100 pF) + J (tolerance ±5 pF) + 50V (jmenovité napětí) + ' +
      '5 (rozteč vývodů 5,08 mm) + B (bulk balení) + 1 (vývody s kompletním durezovým krytím). ' +
      'NP0 (též C0G) je "Class 1" teplotně kompenzovaný dielektrik s předvídatelnou lineární ' +
      'změnou kapacity s teplotou — vhodný pro přesné/kritické obvody jako laděné obvody a ' +
      'oscilátory (na rozdíl od "Class 2/3" dielektrik jako Y5V/Z5U určených jen pro obecné ' +
      'blokovací/vazební účely, kde není stabilita kapacity kritická). ⚠️ Tento datasheet ' +
      'dokumentuje celou širokou produktovou řadu CC (Class 1 NP0/N-řady, Class 2 Y5E/Y5P/Z5U/Z5V, ' +
      'Class 3 "semiconductor type" Y5P/Y5T/Y5U/Y5V) s desítkami kombinací kapacit/napětí/pouzder ' +
      '— do knihovny přidán jen konkrétní pojmenovaný díl CCNPO101J50V5B1 z názvu souboru, ne ' +
      'celá matice kombinací. Provozní teplota -25 až +85 °C. Kapacita měřena @1±0,1 MHz/1 Vrms/' +
      '25 °C. Činitel jakosti (Q) @1±0,1 MHz/1 Vrms/25 °C: pro C<30 pF je Q=400+20×C, pro C≥30 pF ' +
      '(platí pro tento díl, 100 pF) je Q min. 1000. Zkušební napětí 250 % jmenovitého napětí ' +
      '(max. nabíjecí proud 50 mA) = 125 V pro tento 50V díl. Izolační odpor min. 10 000 MΩ ' +
      '(měřeno při jmenovitém napětí, 60 s). RoHS.',
    tags: 'kondenzátor,keramický,disk,meritek,np0,c0g,class1,cc-series',
  },
  {
    name: 'Cornell Dubilier SCD Series',
    packageType:
      'Přímo montovatelný modul na pouzdro IGBT (2 ploché cínované měděné vývody/lugy pro šroubový ' +
      'spoj), plastové pouzdro UL94V-0 s tvrzenou pryskyřicí UL94V-0; rozměry dle kapacity/napětí ' +
      'zhruba 24,6×47,0×24,1 mm (nejmenší, 0,22–0,47 µF/600 V) až 76,2×62,9×38,1 mm (největší, ' +
      '3 µF/1200 V); standardní roztečné varianty pro IGBT s 23/25/28 mm rozestupem vývodů (kód ' +
      '"Z25"), jiné rozteče (22/24/28/29 mm i na zakázku) dostupné na vyžádání',
    value:
      'Fóliový (polypropylenový) IGBT dV/dt snubber kondenzátor pro přímou montáž na IGBT modul, ' +
      '0,22–4,7 µF, 600–2000 Vdc, ±10 % (K) standardně',
    notes:
      'Cornell Dubilier (CDE) "Type SCD — IGBT Snubber Capacitor Modules, High dV/dt Direct ' +
      'Mount IGBT Snubber" katalogový datasheet — ⚠️ celá parametrická řada cca 35 kombinací ' +
      'kapacita/napětí (0,22–4,7 µF × 600/1000/1200/1600/2000 Vdc), do knihovny přidána jako ' +
      'jeden souhrnný záznam (ne každá kombinace zvlášť) — konkrétní díl v katalogu identifikován ' +
      'kódem SCD<kapacitní kód EIA><tolerance><napěťový kód><interní kód sestavy><typ sekce>-' +
      '<rozteč vývodů>-F, např. SCD474K162A3Z25-F = 0,47 µF, ±10 %, 1600 Vdc, standardní ' +
      'sekce/vývody, rozteč 25,4 mm C-C, RoHS. Určeno k připojení přímo mezi kolektor/emitor ' +
      '(C1–E2 u duálního IGBT modulu) nebo mezi P–N (u six-pack modulu) pro potlačení napěťových ' +
      'transientů při vysokém dV/dt spínání IGBT — nízkoindukční přímá montáž na pouzdro modulu ' +
      '(místo připojení přes DPS/vodiče) minimalizuje parazitní indukčnost smyčky. Dielektrikum: ' +
      'nízkoztrátový polypropylen se samohojicí (self-healing) vlastností. Elektrické parametry ' +
      'závisí na konkrétní kombinaci kapacita/napětí (viz tabulka výrobce) — např. u 0,47 µF/' +
      '1600 V: dV/dt 650 V/µs, špičkový proud IPK 306 A, ESR 10 mΩ, IRMS @100 kHz/55 °C 12,6 A. ' +
      'Zkušební napětí mezi vývody 160 % jmenovitého napětí/60 s, mezi vývody a pouzdrem 3 kVAC ' +
      '50/60 Hz/60 s. Životnostní test 2000 h @85 °C/125 % jmenovitého napětí. Udávaná životnost ' +
      '60 000 h @jmenovité Vdc/70 °C nebo 30 000 h @jmenovité Vac/70 °C. Provozní teplota -55 až ' +
      '+85 °C. Tolerance ±10 % (K) standardně, ±5 % (J) volitelně. RoHS.',
    tags: 'kondenzátor,fóliový,polypropylen,snubber,igbt,cornell-dubilier,scd-series,dv-dt',
  },
  {
    name: 'TRA10-103',
    packageType:
      'Radiální vývody (drop/kapkovitý tvar), epoxidový povlak UL94V-0 (samozhášivý), případ ' +
      '(case) velikosti A: D(max) 4,5 mm, H(max) 7,1 mm, průměr vývodu 0,5 mm, rozteč vývodů ' +
      '2,54 mm (styl vývodů "10")',
    value:
      'Tantalový kondenzátor řady TangoldTM (RCD Components "TR Series"), kapacitní kód 103 = ' +
      '10 000 pF (0,01 µF), pouzdro velikosti A',
    notes:
      'RCD Components Inc. "Radial Lead TangoldTM Capacitors, Epoxy Resin Coated, Tantalum — TR ' +
      'Series" (dok. FA059B) — ⚠️ POZOR NA ZÁMĚNU NÁZVU: kód "TRA1..." zde NENÍ nijak spojen s ' +
      'relé Tianbo TRA1 (kategorie Spínač/Relé) ani s DC/DC měničem TRACO POWER TRA 1 Series ' +
      '(kategorie IO) v této knihovně — jde o TŘETÍ zcela odlišný produkt čtvrtého výrobce ' +
      'sdílející podobný alfanumerický prefix čistě náhodou (zde "TR" = RCD interní typové ' +
      'označení "Tantalum Radial", "A" = kód velikosti pouzdra, "10" = styl vývodů, "103" = ' +
      'kapacitní kód). Objednací kód dle katalogu: TR<velikost pouzdra: A/B/C/D/E/F>' +
      '<styl vývodů: 10/20/25/10K>-<kapacitní kód (pF, 2 platné číslice + násobitel, např. ' +
      '103=10000pF/0,01µF, 104=100000pF/0,1µF, 105=1µF, 106=10µF, 107=100µF)>-<tolerance: ' +
      'K=10%/J=5%/M=20%>-<napěťový kód: 3 číslice, např. 003=3V, 016=16V, 025=25V>-<balení: ' +
      'B=volně ložené/A=ammo páska>-<zakončení: W=bezolovnaté (std)/Q=cín-olovo> — ⚠️ z názvu ' +
      'souboru "TRA10-103" chybí poslední tři segmenty kódu (tolerance/napětí/balení/zakončení), ' +
      'do knihovny tedy přidán jen částečně specifikovaný díl s určitelnými parametry (pouzdro A, ' +
      'styl vývodů 10 se standardní roztečí 2,54 mm, kapacita 0,01 µF) — jmenovité napětí a ' +
      'tolerance NEJSOU z dostupného označení jednoznačně určeny (⚠️ neuváděno, nutno ověřit u ' +
      'konkrétní objednávky). Tolerance na kapacitu (ΔC) dle rozsahu: <1,0 µF → ±10/15/25 % ' +
      '(při -55/+85/+125°C), ztrátový činitel (DF @25°C/120Hz) 4–6 % pro <1µF. Epoxidový povlak ' +
      'dipovaný (UL94V-0 samozhášivý), nízký svodový proud a impedance, vysoká odolnost proti ' +
      'vlhkosti/teplu, laserem značené tělo kondenzátoru. Zakončení "W" (bezolovnaté, std.) je ' +
      'RoHS kompatibilní a odolné pájení do 260°C.',
    tags: 'kondenzátor,tantalový,radiální,epoxidový,rcd-components,tr-series,tangold',
  },
  {
    name: 'HCPB Series',
    packageType:
      'Radiální vývody, kompaktní pryskyřicové (resin case) pouzdro, rozměry W 26,0 × H 17,5 × ' +
      'T 8,0 mm, rozteč vývodů 21,5±1,0 mm, vývody UL1007 AWG20 (bílá izolace, pájené)',
    value:
      'Vysokonapěťový fóliový kondenzátor pro spínané zdroje/měniče, 1250 V DC, rozsah kapacity ' +
      '0,0047–0,013 µF (6 hodnot v řadě), tolerance ±5 % (J)',
    notes:
      'Okaya Electric Industries "HCPB Series" (katalogový list, str. 11) — vysokonapěťový ' +
      'kondenzátor kompaktního provedení s pryskyřicovým (resin) pouzdrem, určený pro spínané ' +
      'zdroje (switching power supply), měniče (inverter) a servo napájecí zdroje, tedy podobná ' +
      'kategorie aplikace jako vysokonapěťová keramická disková řada NTE 90000 a fóliová IGBT ' +
      'snubber řada Cornell Dubilier SCD v této knihovně, ale ODLIŠNÁ konstrukce — HCPB je ' +
      'KOMPAKTNÍ RADIÁLNÍ pryskyřicově zalitý kondenzátor (ne diskový keramický jako NTE 90000, ' +
      'ne přímo montovaný modul na IGBT pouzdro jako CDE SCD) — určen pro standardní vsazení do ' +
      'DPS jako běžná pasivní součástka. ⚠️ Datasheet dokumentuje CELOU ŘADU 6 kapacitních hodnot ' +
      '(472=0,0047µF, 682=0,0068µF, 822=0,0082µF, 113=0,011µF, 123=0,012µF, 133=0,013µF), všechny ' +
      'se shodným jmenovitým napětím 1250 V DC a shodnými rozměry pouzdra — do knihovny přidána ' +
      'jako jeden souhrnný záznam pro celou řadu, ne každá hodnota zvlášť. Objednací kód: HCPB- ' +
      '<napětí, např. 1250V>-<kapacitní kód pF, 2 platné číslice + počet nul>-<tolerance, J=±5%>, ' +
      'např. HCPB1250V822J = 1250V, 0,0082µF, ±5 %. Ztrátový činitel (dissipation factor) max ' +
      '0,001 @1000±100Hz. Zkušební napětí 1,75× jmenovité napětí (2-5s). Izolační odpor min ' +
      '50 kMΩ @20°C/100VDC. Provozní teplota -40 až +85 °C. Kruhový (o) symbol v patičce ' +
      'datasheetu indikuje UL/CSA schválení pro daný typ.',
    tags: 'kondenzátor,fóliový,vysokonapěťový,okaya,hcpb-series,spínaný-zdroj,radiální',
  },
  {
    name: 'HCP-S Series',
    packageType:
      'Radiální vývody, kompaktní pryskyřicové (resin case) pouzdro, rozměry dle kapacity/napětí ' +
      'zhruba 5,0×12,0×15,0 mm (nejmenší, 0,01µF/450V) až 41,0×32,5×37,5 mm (největší, 2,2µF/ ' +
      '630V), rozteč vývodů F 15,0–37,5 mm dle velikosti',
    value:
      'Vysokonapěťový fóliový kondenzátor, standardní typ (suffix "S"), 4 napěťové třídy 450/630/ ' +
      '1000/1250 V DC, rozsah kapacity 0,01–2,2 µF (dle napěťové třídy), tolerance ±10 % (K)',
    notes:
      'Okaya Electric Industries "HCP-S Series" (katalogový list, str. 10) — ⚠️ POZOR na záměnu s ' +
      'HCPB Series v této knihovně (shodný výrobce Okaya, podobná konstrukce — kompaktní ' +
      'pryskyřicové pouzdro, radiální vývody — ale JINÁ produktová řada s jiným rozsahem): HCP-S ' +
      'pokrývá VÝRAZNĚ ŠIRŠÍ rozsah — 4 napěťové třídy (450/630/1000/1250 V, oproti jediné třídě ' +
      '1250V u HCPB) a širší kapacitní rozsah (0,01–2,2 µF, oproti úzkému rozsahu 0,0047–0,013 µF ' +
      'u HCPB) — HCP-S je tedy obecnější/univerzálnější řada, HCPB spíše úzce specializovaná ' +
      'varianta na 1250V. Aplikace HCP-S šířeji uvedeny: vysokofrekvenční obvody, vysokonapěťové ' +
      'rezonanční obvody, snubber obvody a ochrana polovodičů (IGBT, IPM, MOSFET) — oproti užšímu ' +
      'zaměření HCPB na spínané zdroje/měniče/servo napájení. ⚠️ Datasheet dokumentuje CELOU ' +
      'PARAMETRICKOU ŘADU (desítky kombinací kapacita×napětí napříč 4 napěťovými třídami) — do ' +
      'knihovny přidána jako jeden souhrnný záznam pro celou řadu, ne každá kombinace zvlášť. Z ' +
      'názvu souboru identifikován konkrétní díl HCP450V104KS = 450V, kapacitní kód 104 = 0,1 µF, ' +
      'tolerance K = ±10 %, "S" = standardní typ (rozměry dle tabulky: W17,0×T6,5×H13,5×F15,0mm). ' +
      'Objednací kód: HCP<napěťová třída>-<kapacitní kód pF, 2 platné číslice + počet nul>-' +
      '<tolerance: K=±10%>-<typ: S=standardní>. Ztrátový činitel (dissipation factor) max 0,001 ' +
      '@1000±100Hz. Zkušební napětí 1,75× jmenovité napětí (2-5s). Izolační odpor min 50 kΩ ' +
      '@20°C/100VDC (pro menší kapacity/napětí) nebo 20 kΩ min (pro vyšší třídy, dle tabulky). ' +
      'Provozní teplota -40 až +85 °C.',
    tags: 'kondenzátor,fóliový,vysokonapěťový,okaya,hcp-s-series,snubber,rezonanční-obvod,radiální',
  },
];

function buildFromSpecs(
  specs: PartSpec[],
  category: 'Dioda' | 'Můstek' | 'Tranzistor' | 'Rezistor' | 'Kondenzátor'
): ComponentInput[] {
  return specs.map((spec) => ({
    name: spec.name,
    category,
    manufacturer: null,
    packageType: spec.packageType,
    value: spec.value,
    quantity: 0,
    location: null,
    datasheetUrl: null,
    schematicImage: spec.schematicImage ?? null,
    notes: spec.notes,
    tags: spec.tags,
  }));
}

// Zvyšovat o 1 při každé změně seed dat (nová/upravená součástka), spolu s verzí v app.json.
export const SEED_LIBRARY_VERSION = 24;

export const SEED_COMPONENTS: ComponentInput[] = [
  ...buildResistorSeed(),
  ...buildFromSpecs(RESISTOR_SPECS, 'Rezistor'),
  ...buildCapacitorSeed(),
  ...buildFromSpecs(CAPACITOR_PART_SPECS, 'Kondenzátor'),
  ...buildFromSpecs(DIODE_SPECS, 'Dioda'),
  ...buildFromSpecs(BRIDGE_SPECS, 'Můstek'),
  ...buildFromSpecs(TRANSISTOR_SPECS, 'Tranzistor'),
  ...buildIcSeed(),
  ...buildModuleSeed(),
  ...buildConnectorSeed(),
  ...buildMiscSeed(),
  ...buildCoilSeed(),
  ...buildRelaySeed(),
];

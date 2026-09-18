import type { ComponentInput } from '../types/component';
import { buildIcSeed } from './seedICs';
import { buildModuleSeed } from './seedModules';
import { buildConnectorSeed } from './seedConnectors';

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
];

const TRANSISTOR_SPECS: PartSpec[] = [
  {
    name: 'BC546',
    packageType:
      'TO-92 — POZOR, pořadí vývodů závisí na výrobci (viz poznámka): ' +
      'Motorola/ON Semi a UTC/Unisonic (většina) = C-B-E, Philips/NXP (SOT54/SC-43A, výjimka) = E-B-C',
    value: 'NPN, VCEO 65 V, IC 100 mA, hFE 110–450 (@ IC=2 mA)',
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
    name: 'IRF540N',
    packageType:
      'TO-220AB — vývody: 1=gate, 2=drain, 3=source (chladicí ploška je spojena s drainem)',
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
    name: 'IRF4905',
    packageType:
      'TO-220AB, 4 vývody: 1=gate, 2=drain, 3=source, 4=drain (chladicí ploška = drain)',
    value: 'P-MOSFET, VDSS -55 V, ID -74 A (@TC=25 °C), RDS(on) max 0,020 Ω (@VGS=-10 V)',
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
  { name: 'BF245', packageType: 'TO-92', value: 'N-JFET', notes: 'Unipolární (JFET) tranzistor', tags: 'tranzistor,jfet,n-kanál' },
  {
    name: 'BSR58LT1',
    packageType:
      'SOT-23 (SMD), 3 vývody: 1=drain, 2=source, 3=gate (case 318, style 10)',
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
      'pouzdře; kvůli pouze 5 pinům (na rozdíl od 6pinového SOT-363 u BC807U/BC856S) je jeden ' +
      'vývod pravděpodobně sdílený mezi oběma tranzistory — přesné přiřazení pinů ověř v diagramu ' +
      'výrobce před pájením; značení na pouzdru "SY" (rank Y) nebo "SGR" (rank GR)',
    value:
      'Duální PNP tranzistor (2× PNP v pouzdře), VCEO -50 V, IC -150 mA, hFE 120–400 ' +
      '@IC=-2 mA (dle binu)',
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
      'SOT-363 (SC-70-6), 6 vývodů (piny 1, 2, 3 dole, 4, 5, 6 nahoře), pravděpodobně shodný ' +
      'pinout 1/4=E1/E2, 2/5=B1/B2, 3/6=C2/C1 jako u BC856S (stejný výrobce/pouzdro/kresba, ' +
      'ověřeno u BC856S i originálním Siemens datasheetem) — dva nezávislé PNP tranzistory bez ' +
      'vzájemného ovlivňování; značení na pouzdru "3C"',
    value: 'Duální PNP tranzistor (2× PNP v pouzdře), VCEO -45 V, IC -0,2 A, hFE 125–630 @IC=-2 mA (bin S)',
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
      '⚠️ POZOR na záměnu názvů: výrobce Susumu má vlastní, zcela odlišnou "RT sérii" ' +
      'laditelných (trimmable) rezistorů se stejným prefixem "RT" i podobnými velikostními kódy ' +
      '(např. Susumu RT0603 = pouzdro 0201!) — viz samostatné záznamy Susumu RT0603/RT0510/' +
      'RT0816/RT1220, které s touto Yageo řadou nesouvisí.',
    tags: 'rezistor,smd,1206,precision,tenkovrstvý,thin-film,yageo,phicomp,rt-series',
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
];

function buildFromSpecs(
  specs: PartSpec[],
  category: 'Dioda' | 'Tranzistor' | 'Rezistor' | 'Kondenzátor'
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
    notes: spec.notes,
    tags: spec.tags,
  }));
}

export const SEED_COMPONENTS: ComponentInput[] = [
  ...buildResistorSeed(),
  ...buildFromSpecs(RESISTOR_SPECS, 'Rezistor'),
  ...buildCapacitorSeed(),
  ...buildFromSpecs(CAPACITOR_PART_SPECS, 'Kondenzátor'),
  ...buildFromSpecs(DIODE_SPECS, 'Dioda'),
  ...buildFromSpecs(TRANSISTOR_SPECS, 'Tranzistor'),
  ...buildIcSeed(),
  ...buildModuleSeed(),
  ...buildConnectorSeed(),
];

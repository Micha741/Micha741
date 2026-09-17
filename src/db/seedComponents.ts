import type { ComponentInput } from '../types/component';

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
  { name: 'SS14', packageType: 'SMA (SMD)', value: '1 A / 40 V', notes: 'Schottky dioda, SMD', tags: 'dioda,schottky,smd' },
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
  { name: '2N2222', packageType: 'TO-18', value: 'NPN, 40 V, 800 mA', notes: 'Malovýkonový bipolární tranzistor', tags: 'tranzistor,npn,bipolární' },
  {
    name: '2N2222A',
    packageType: 'TO-18 — vývody: 1=kolektor, 2=báze, 3=emitor',
    value: 'NPN, VCEO 40 V, VCBO 75 V, IC 600–800 mA (dle pouzdra/výrobce)',
    notes:
      'OPRAVA: dříve uvedených 75 V byla ve skutečnosti hodnota VCBO, ne VCEO — opraveno podle ' +
      'datasheetu plastové varianty P2N2222A/D (Motorola), která sdílí stejnou elektrickou třídu "A". ' +
      'VCEO=40 V, VCBO=75 V, VEBO=6,0 V. hFE typicky 100–300 (@IC=150 mA), fT typ 300 MHz. ' +
      'Podrobná data viz samostatná položka „P2N2222A“ (plastová TO-92 verze téže třídy A).',
    tags: 'tranzistor,npn,bipolární',
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
  { name: '2N3904', packageType: 'TO-92', value: 'NPN, 40 V, 200 mA', notes: 'Malovýkonový bipolární tranzistor', tags: 'tranzistor,npn,bipolární' },
  { name: 'S8050', packageType: 'TO-92', value: 'NPN, 25 V, 700 mA', notes: 'Malovýkonový bipolární tranzistor', tags: 'tranzistor,npn,bipolární' },

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
  { name: '2N2907', packageType: 'TO-18', value: 'PNP, 40 V, 600 mA', notes: 'Malovýkonový bipolární tranzistor', tags: 'tranzistor,pnp,bipolární' },
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
  { name: '2N3906', packageType: 'TO-92', value: 'PNP, 40 V, 200 mA', notes: 'Malovýkonový bipolární tranzistor', tags: 'tranzistor,pnp,bipolární' },
  { name: 'S8550', packageType: 'TO-92', value: 'PNP, 25 V, 700 mA', notes: 'Malovýkonový bipolární tranzistor', tags: 'tranzistor,pnp,bipolární' },

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
    name: 'BC517',
    packageType: 'TO-92 — vývody: 1=kolektor, 2=báze, 3=emitor',
    value: 'NPN Darlington, VCEO 30 V, IC 500 mA, hFE min 30 000 (@ IC=100 mA)',
    notes:
      'Vysoce ziskový NPN Darlington pro obecné použití (např. citlivé spínání malým bázovým ' +
      'proudem). Datasheet HSMC HBC517 (ekvivalent/druhý zdroj BC517). ' +
      'Mezní hodnoty: VCBO=40 V, VCEO=30 V, VEBO=10 V, IC=500 mA, PD=625 mW @TA=25 °C, ' +
      'TJ max 150 °C, Tstg -55 až +150 °C. ' +
      'ICBO max 1 µA @VCB=40 V. IEBO max 1 µA @VEB=10 V. ' +
      'hFE @IC=100 mA/VCE=2 V: min 30 000 (extrémně vysoký zisk typický pro dvojitý Darlington). ' +
      'VCE(sat) @IC=100 mA/IB=1 mA: max 1 V. VBE(sat) @IC=100 mA/IB=1 mA: typ 1,5 V, max 2 V ' +
      '(dvojnásobný úbytek, typické pro Darlington zapojení). ' +
      'fT @IC=100 mA/VCE=2 V/f=100 MHz: typ 220 MHz. Cob=5 pF typ @VCB=10 V/f=1 MHz.',
    tags: 'tranzistor,npn,bipolární,darlington,to-92,bc517,hbc517',
  },

  { name: 'TIP41C', packageType: 'TO-220', value: 'NPN, 100 V, 6 A', notes: 'Výkonový bipolární tranzistor', tags: 'tranzistor,npn,výkonový' },
  { name: 'TIP3055', packageType: 'TO-218/TO-220', value: 'NPN, 60 V, 15 A', notes: 'Výkonový bipolární tranzistor', tags: 'tranzistor,npn,výkonový' },
  { name: '2N3055', packageType: 'TO-3', value: 'NPN, 60 V, 15 A', notes: 'Výkonový bipolární tranzistor', tags: 'tranzistor,npn,výkonový' },
  { name: 'BD135', packageType: 'TO-126', value: 'NPN, 45 V, 1,5 A', notes: 'Výkonový bipolární tranzistor', tags: 'tranzistor,npn,výkonový' },
  { name: 'BD139', packageType: 'TO-126', value: 'NPN, 80 V, 1,5 A', notes: 'Výkonový bipolární tranzistor', tags: 'tranzistor,npn,výkonový' },

  { name: 'TIP42C', packageType: 'TO-220', value: 'PNP, 100 V, 6 A', notes: 'Výkonový bipolární tranzistor', tags: 'tranzistor,pnp,výkonový' },
  { name: 'BD136', packageType: 'TO-126', value: 'PNP, 45 V, 1,5 A', notes: 'Výkonový bipolární tranzistor', tags: 'tranzistor,pnp,výkonový' },
  { name: 'BD140', packageType: 'TO-126', value: 'PNP, 80 V, 1,5 A', notes: 'Výkonový bipolární tranzistor', tags: 'tranzistor,pnp,výkonový' },

  { name: 'IRF540N', packageType: 'TO-220', value: 'N-MOSFET, 100 V, 33 A', notes: 'Výkonový spínací MOSFET', tags: 'tranzistor,mosfet,n-kanál' },
  { name: 'IRFZ44N', packageType: 'TO-220', value: 'N-MOSFET, 55 V, 49 A', notes: 'Výkonový spínací MOSFET', tags: 'tranzistor,mosfet,n-kanál' },
  { name: 'IRF3205', packageType: 'TO-220', value: 'N-MOSFET, 55 V, 110 A', notes: 'Výkonový spínací MOSFET', tags: 'tranzistor,mosfet,n-kanál' },
  { name: '2N7000', packageType: 'TO-92', value: 'N-MOSFET, 60 V, 200 mA', notes: 'Malovýkonový spínací MOSFET', tags: 'tranzistor,mosfet,n-kanál' },

  { name: 'IRF9540', packageType: 'TO-220', value: 'P-MOSFET, -100 V, -19 A', notes: 'Výkonový spínací MOSFET', tags: 'tranzistor,mosfet,p-kanál' },
  { name: 'IRF4905', packageType: 'TO-220', value: 'P-MOSFET, -55 V, -74 A', notes: 'Výkonový spínací MOSFET', tags: 'tranzistor,mosfet,p-kanál' },

  { name: '2N5457', packageType: 'TO-92', value: 'N-JFET', notes: 'Unipolární (JFET) tranzistor', tags: 'tranzistor,jfet,n-kanál' },
  { name: 'BF245', packageType: 'TO-92', value: 'N-JFET', notes: 'Unipolární (JFET) tranzistor', tags: 'tranzistor,jfet,n-kanál' },
];

function buildFromSpecs(specs: PartSpec[], category: 'Dioda' | 'Tranzistor'): ComponentInput[] {
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
  ...buildCapacitorSeed(),
  ...buildFromSpecs(DIODE_SPECS, 'Dioda'),
  ...buildFromSpecs(TRANSISTOR_SPECS, 'Tranzistor'),
];

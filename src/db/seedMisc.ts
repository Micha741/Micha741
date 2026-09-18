import type { ComponentInput } from '../types/component';

interface MiscSpec {
  name: string;
  packageType: string;
  value: string;
  notes: string;
  tags: string;
}

const MISC_SPECS: MiscSpec[] = [
  {
    name: 'SCD-0134032010-KF-SA',
    packageType:
      'Koaxiální hliníkové tělo, černý lak, 3× 2,92 mm (K) samičí konektory (INPUT, OUTPUT, ' +
      'Coupled Port), rozměry cca 84,0 × 15,0 × 40,0 mm (dle výkresu, přes konektory), montážní ' +
      'otvory 4× Ø2,3 mm, hmotnost 1,8 oz (~51 g); utahovací moment konektorů 8,0±0,15 in-lb ' +
      '(0,90±0,02 Nm)',
    value:
      'Koaxiální směrový odbočovač (directional coupler), 1–40 GHz, vazba 20 dB, vložný útlum ' +
      '2,1 dB, směrovost 10 dB typ., 50 Ω, do 20 W (CW)',
    notes:
      'SAGE Millimeter, Inc. / Eravant "SCD-0134032010-KF-SA — Coaxial Directional Coupler, 1 to ' +
      '40 GHz, 20 dB Coupling Level" (rev. 1.2, 2023) — ⚠️ POZOR na záměnu s jinými díly ' +
      'obsahujícími prefix "SCD" v této knihovně (Cornell Dubilier fóliové IGBT snubber ' +
      'kondenzátory řady "Type SCD", Sensirion CO2 senzory "SCD4x", tyristor SemiWell SCD4C60S) ' +
      '— čistě náhodná shoda označení; toto je pasivní mikrovlnný/RF komponent, ne polovodičová ' +
      'součástka ani kondenzátor, proto zařazen do kategorie "Ostatní". Směrový odbočovač je ' +
      'pasivní 3portový (+ zakončovací 50Ω port) prvek, který odebírá definovaný, přesně známý ' +
      'zlomek výkonu procházejícího signálu (zde -20 dB, tj. 1 %) na samostatný "Coupled Port" ' +
      'pro měření/monitorování úrovně signálu (výkonoměr, spektrální analyzátor) bez přerušení ' +
      'hlavní signálové cesty INPUT→OUTPUT — typické využití v RF/mikrovlnných zkušebnách, ' +
      'měřicích sestavách a podsestavách vyžadujících vzorkování výkonu (např. ALC smyčky, ' +
      'monitoring vysílačů). Elektrické parametry: kmitočtový rozsah 1–40 GHz, vložný útlum ' +
      '(insertion loss) typ. 2,1 dB, vazba (coupling) 20 dB s vlnitostí (flatness) ±1,2 dB, ' +
      'směrovost (directivity) typ. 10 dB, zpětný útlum portů (return loss) 12 dB, impedance ' +
      '50 Ω, výkonová zatížitelnost 20 W (CW). RF konektory 2,92 mm samičí (K), tělo hliníkové s ' +
      'černým lakováním. Provozní teplota -40 až +80 °C (specifikováno při +25 °C). RoHS. ' +
      'Doporučen speciální momentový klíč Eravant SCH-08008-S1 pro správné dotažení konektorů.',
    tags: 'rf,mikrovlny,směrový-odbočovač,directional-coupler,koaxiální,sage-millimeter,eravant,k-konektor',
  },
];

export function buildMiscSeed(): ComponentInput[] {
  return MISC_SPECS.map((spec) => ({
    name: spec.name,
    category: 'Ostatní',
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

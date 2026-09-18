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
  {
    name: 'GD-342AP',
    packageType:
      'Skleněný segmentový LCD panel, 24 pinů (zebra/elastomer kontaktní páska po obou delších ' +
      'stranách, rozteč 2,54 mm, 12+12), vnější rozměry 30,48×22,86 mm, aktivní/zobrazovací ' +
      'plocha 24,13×11,43 mm, výška číslice cca 8,89 mm',
    value:
      '3místný 7segmentový pasivní LCD displej (statický, bez multiplexu), 2 desetinné tečky ' +
      '(DP1, DP2), napájení 3,0 V, TN typ, reflexní polarizér',
    notes:
      'AZ Displays, Inc. mechanický výkres "GD-342AP" (výrobní štítek na výkresu uvádí ' +
      '"CD-342AP" — nesrovnalost v označení mezi souborem a štítkem výkresu samotného výrobce; ' +
      'do knihovny přidáno pod názvem odpovídajícím nahranému souboru) — ⚠️ POZOR: jde o pasivní ' +
      'segmentové LCD sklo (skleněná "cela" s tekutými krystaly a elektrodami), NE o LED ani ' +
      'aktivní modul s vlastní elektronikou — pro zobrazení vyžaduje externí LCD budicí obvod ' +
      '(např. specializovaný LCD driver IC generující střídavé budicí napětí, statický režim bez ' +
      'multiplexování znamená jednoduché přímé buzení bez COM sdílení). Kontaktování zebra páskou ' +
      '(elastomerový konektor) k řídicí DPS, ne pájené vývody. 3 číslice, 7 segmentů + 2 ' +
      'desetinné tečky na displej. Pozorovací úhel 6 hodin (optimální kontrast při pohledu zespodu ' +
      'shora), duty cycle statický (přímé buzení, žádné sdílené COM elektrody), budicí napětí ' +
      '5,0 V (typicky střídavé, pro zabránění degradaci LCD stejnosměrným polem). Provozní ' +
      'teplota 0 až +50 °C, skladovací -15 až +60 °C.',
    tags: 'lcd,displej,segmentový,statický,az-displays,gd-342ap,7segment,pasivní',
  },
  {
    name: 'GD-458P',
    packageType:
      'Skleněný segmentový LCD panel, 18 pinů (zebra/elastomer kontaktní páska, rozteč 2,54 mm, ' +
      '10+8), vnější rozměry 146×45 mm, aktivní/zobrazovací plocha 142×39 mm (V.A.), jednotlivá ' +
      'číslice cca 19,0×12,5 mm',
    value:
      '6místný 7segmentový multiplexovaný LCD displej (1/4 duty, 1/3 bias) s doplňkovými ' +
      'ikonovými/šipkovými segmenty (T1-T8) a kruhovým ikonovým polem, 6 desetinných teček ' +
      '(DP1-DP6), napájení 3,0 V, TN typ, transflektivní',
    notes:
      'AZ Displays, Inc. mechanický výkres "GD-458P" (datováno 9. 1. 1997) — ⚠️ pasivní ' +
      'segmentové LCD sklo jako GD-342AP (samostatný záznam) — viz tam pro obecné vysvětlení ' +
      'principu (vyžaduje externí LCD budicí obvod, kontaktováno zebra páskou), ale odlišná ' +
      'konfigurace: 6 číslic místo 3, MULTIPLEXOVANÉ buzení (4 společné elektrody COM1-4, duty ' +
      '1/4, bias 1/3 — na rozdíl od statického buzení u GD-342AP) umožňující více segmentů na ' +
      'méně vývodů, transflektivní (funguje jak v odraženém, tak s podsvícením procházejícím ' +
      'světle) pozitivní displej (tmavé segmenty na světlém pozadí). Kromě 6× 7segmentové číslice ' +
      '+ desetinná tečka obsahuje navíc 8 trojúhelníkových ikonových segmentů (T1-T8, pravděpodobně ' +
      'směrové šipky/ukazatele stavu) a jedno kruhové ikonové pole (u T4, možný symbol napájení/ ' +
      'stupně/baterie) — vhodné pro měřicí přístroj s doplňkovými stavovými indikátory. Pozorovací ' +
      'úhel 12 hodin. Budicí napětí 3,0 V. Provozní teplota 0 až +55 °C, skladovací -15 až +60 °C.',
    tags: 'lcd,displej,segmentový,multiplexovaný,az-displays,gd-458p,7segment,pasivní,ikony',
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

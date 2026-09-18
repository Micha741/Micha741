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
  {
    name: 'FE0202W-EU',
    packageType:
      'Skleněný segmentový LCD panel, rozměry pouzdra 2,0×1,2 palce (50,8×30,5 mm), výška ' +
      'číslice 0,5" (12,7 mm), 4místný 7segmentový font (bez doplňkových ikon/prefixového ' +
      'symbolu, na rozdíl od příbuzných FE0201W/FE0203W/FE0206W ve stejném katalogu)',
    value:
      '4místný 7segmentový pasivní LCD panel, transflektivní provedení ("-EU"), určeno pro ' +
      'široký teplotní rozsah a vysokou vlhkost',
    notes:
      'AND / Purdy Electronics Corporation "Displays Short Form Catalog 2013" — položka z ' +
      'tabulky "LCD — Panel-Segment Displays (Wide Temperature & High Humidity)" — ⚠️ pasivní ' +
      'segmentové LCD sklo stejného principu jako GD-342AP/GD-458P v této knihovně (samostatné ' +
      'záznamy, jiný výrobce AZ Displays) — vyžaduje externí LCD budicí obvod, zobrazovací sklo ' +
      'samo neobsahuje žádnou elektroniku. Základní objednací kód "FE0202W" je v katalogu ' +
      'dostupný ve dvou variantách podsvětlovacího/pozorovacího režimu: "-DU" = reflektivní ' +
      '(odrazivý povrch využívající jen okolní světlo) nebo "-EU" = transflektivní (částečně ' +
      'odrazivý povrch použitelný jak s podsvícením, tak s odraženým světlem) — nahraný díl je ' +
      'konkrétně transflektivní varianta "-EU". Katalog nabízí celou řadu podobných panelů ' +
      '(FE1901W, FE0201W, FE0203W, FE0202W, FE0501W, FE0502W, FE0206W, FE0208W, FE0401W, ' +
      'FE0601W, FE1001W) lišících se počtem číslic, výškou znaku (0,4–0,7") a přítomností ' +
      'doplňkových ikon/prefixových symbolů (např. baterie) — do knihovny přidán jen konkrétně ' +
      'pojmenovaný díl FE0202W-EU z názvu souboru. Určeno pro provoz v širokém teplotním rozsahu ' +
      'a vysoké vlhkosti (přesné meze v tomto souhrnném katalogu neuvedeny, jen v plném ' +
      'datasheetu dílu).',
    tags: 'lcd,displej,segmentový,panel,and-displays,purdy,fe0202w,7segment,pasivní,transflektivní',
  },
  {
    name: 'IML-0638',
    packageType:
      'Kruhová Fresnelova čočka, materiál HDPE (polyetylen s vysokou hustotou), barva přírodní/ ' +
      'bílá (natural/white), určeno k montáži před optické okénko lead-type senzorů řady "IRA-E"',
    value:
      'Fresnelova čočka pro PIR (pyroelektrické) pohybové senzory, formuje/segmentuje zorné pole ' +
      'senzoru do detekčních zón',
    notes:
      'Murata "IML-0638" — pasivní optická součástka (Fresnelova čočka z HDPE), NENÍ elektronická ' +
      'součástka ani senzor sám — doplňkový optický prvek montovaný před PIR pohybové senzory ' +
      'Murata řady "IRA-E" (lead-type, drátové vývody) pro rozdělení zorného pole senzoru do ' +
      'více detekčních zón/paprsků a zaostření IR záření na pyroelektrické elementy, čímž ' +
      'zvyšuje citlivost a dosah detekce pohybu. ⚠️ Společně s touto knihovnou obsahuje i senzor ' +
      'IRA-S410ST03 (Murata), ten ovšem patří do jiné, mechanicky odlišné řady TO-5 (kovové ' +
      'pouzdro s vlastním vestavěným optickým filtrem, bez potřeby externí Fresnelovy čočky) — ' +
      'IML-0638 je určena konkrétně pro řadu "IRA-E" (jiný mechanický formát), nejde tedy o přímý ' +
      'doplněk k IRA-S410ST03, pouze o příbuzný produkt ze stejné produktové rodiny PIR senzorů ' +
      'od téhož výrobce. Provozní teplota -25 až +60 °C, skladovací teplota -30 až +80 °C. ' +
      'Zařazeno do kategorie "Ostatní" jako čistě pasivní optická/mechanická součástka bez ' +
      'vlastní elektroniky.',
    tags: 'optika,fresnelova-čočka,hdpe,pir,murata,ira-e,pohybový-senzor,pasivní',
  },
  {
    name: 'PKGS-00LDP1-R',
    packageType:
      'SMD pouzdro 6,4×2,8×1,2 mm, 2 elektrody (Electrode A, Electrode B) na spodní straně, ' +
      'značka polarity (Polarity Marking) na horní straně, páskování 180 mm embossed tape ' +
      '(min. objednací množství 2000 ks)',
    value:
      'Piezoelektrický rázový/vibrační senzorový element (shock sensor), elektrický náboj ' +
      '(charge output) typu, citlivost 0,84 pC/G typ., kapacita 770 pF typ., rezonanční ' +
      'kmitočet 20 kHz',
    notes:
      'Murata "PKGS-00LDP1-R" (dok. Product Search Data Sheet, staženo z murata.com, ' +
      'aktualizováno 27. 10. 2017 — pozn. výrobce: může být neaktuální, doporučeno stáhnout ' +
      'nejnovější verzi) — ⚠️ POZOR: jde o pasivní dvouelektrodový piezoelektrický snímací ' +
      'element (bez vlastní elektroniky, bez napájecích pinů), NE o aktivní senzorový modul s ' +
      'vestavěným zesilovačem/výstupním obvodem — na rozdíl od tlakových senzorů Seiko Epson ' +
      'TSU-20G/TSU-70G/TSU-100G v této knihovně (ty mají vlastní napájení a frekvenční výstup), ' +
      'proto zařazen do kategorie "Ostatní", ne "Modul". Výstupem je elektrický náboj úměrný ' +
      'zrychlení/rázu (typ "electric charge sensitivity type"), pro použitelný napěťový signál ' +
      'vyžaduje externí nábojový zesilovač (charge amplifier). Provozní/skladovací teplota -40 ' +
      'až +85 °C. Sklon primární osy citlivosti (primary axis inclined angle) 0°. Izolační ' +
      'odpor min. 500 MΩ. Nelinearita typ. 1 %. Rázová odolnost 1500 G (doba trvání 0,5 ms). ' +
      'Frekvenční charakteristika má výraznou rezonanční špičku okolo 20 kHz (viz graf v ' +
      'datasheetu) — mimo tuto oblast prakticky rovný výstup v rozsahu cca 1 Hz–10 kHz. Určeno ' +
      'pro spotřební elektroniku (detekce pádu/nárazu, ochrana disků, alarmy apod.).',
    tags: 'senzor,piezoelektrický,rázový,vibrační,náboj,murata,pkgs,shock-sensor,pasivní',
  },
  {
    name: 'PKGS-45TAV-R',
    packageType:
      'SMD pouzdro 4,8×2,3×1,3 mm, 2 elektrody (Electrode A, Electrode B) na spodní straně, ' +
      'značka polarity (Polarity Marking) na horní straně, páskování 180 mm embossed tape ' +
      '(min. objednací množství 3000 ks), kvalifikace AEC-Q200',
    value:
      'Piezoelektrický rázový/vibrační senzorový element (shock sensor), napěťová (voltage ' +
      'output) typu, citlivost 0,77 mV/G typ., kapacita 195 pF typ., rezonanční kmitočet ' +
      '37 kHz, sklon primární osy citlivosti 45°',
    notes:
      'Murata "PKGS-45TAV-R" (dok. Product Search Data Sheet, staženo z murata.com, aktualizováno ' +
      '27. 10. 2017 — pozn. výrobce: může být neaktuální, doporučeno stáhnout nejnovější verzi) — ' +
      '⚠️ POZOR na záměnu s PKGS-00LDP1-R v této knihovně (samostatný záznam) — jde o příbuzný, ' +
      'ale elektricky odlišný typ ze stejné produktové řady "PKGS" piezoelektrických rázových ' +
      'senzorů od Murata: PKGS-00LDP1-R je typu "electric charge sensitivity" (výstup elektrický ' +
      'náboj v pC/G, sklon osy 0°, pro spotřební elektroniku), zatímco PKGS-45TAV-R je typu ' +
      '"electric voltage sensitivity" (výstup přímo napěťový v mV/G, díky integrovanému ' +
      'piezoelektrickému prvku s vestavěnou impedanční konverzí, sklon osy citlivosti 45°) — má ' +
      'tedy jiný mechanismus výstupu i jinou geometrii snímací osy, navíc kvalifikován pro ' +
      'automotive (AEC-Q200) a výslovně omezen na použití v TPMS (Tire Pressure Monitoring System ' +
      '— sledování tlaku v pneumatikách, powertrain/safety), na rozdíl od PKGS-00LDP1-R určeného ' +
      'jen pro spotřební elektroniku. Provozní/skladovací teplota -40 až +125 °C (širší než ' +
      'PKGS-00LDP1-R kvůli automotive nasazení). Izolační odpor min. 10 000 MΩ. Nelinearita typ. ' +
      '1 %. Rázová odolnost 3000 G (doba trvání 0,3 ms). Frekvenční charakteristika s výraznou ' +
      'rezonanční špičkou okolo 37 kHz, mimo tuto oblast plochý výstup v pásmu cca 1 Hz–10 kHz.',
    tags: 'senzor,piezoelektrický,rázový,vibrační,napěťový,murata,pkgs,shock-sensor,automotive,tpms,aec-q200',
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

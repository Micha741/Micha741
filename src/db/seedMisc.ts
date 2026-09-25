import type { ComponentInput } from '../types/component';

interface MiscSpec {
  name: string;
  packageType: string;
  value: string;
  notes: string;
  tags: string;
  schematicImage?: string;
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
    schematicImage: 'GD-458P.jpg',
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
    name: 'IML-0637',
    packageType:
      'Kupolovitá (dome) Fresnelova čočka, Ø10,4 mm (spodní), Ø9,0 mm (vnitřní dutina), výška ' +
      '8,65 mm, materiál HDPE (polyetylen s vysokou hustotou), barva přírodní/bílá, s ' +
      'orientačním výstupkem (tab) pro správné natočení vůči senzoru a vnitřní dutinou/stupněm ' +
      '(step) pro usazení pyroelektrického elementu (Pyro-Element) senzoru, určeno k montáži ' +
      'před optické okénko lead-type senzorů řady "IRA-E", balení volné (bulk/bag) po 100 ks',
    value:
      'Fresnelova čočka pro PIR (pyroelektrické) pohybové senzory, formuje/segmentuje zorné pole ' +
      'senzoru do detekčních zón',
    notes:
      'Murata "IML-0637" (dok. Product Search Data Sheet, staženo z murata.com, aktualizováno ' +
      '27. 10. 2017) — ⚠️ velmi příbuzný díl k IML-0638 v této knihovně (samostatný záznam): ' +
      'stejný materiál (HDPE, přírodní bílá), stejný provozní/skladovací teplotní rozsah a stejné ' +
      'určení "For LEAD TYPE (IRA-E Series)" — pravděpodobně se jedná o odlišný optický vzor/ ' +
      'segmentaci Fresnelovy čočky (jiný počet/uspořádání detekčních zón) v rámci téže produktové ' +
      'řady čoček pro senzory IRA-E, přesná optická odlišnost od IML-0638 ale není v tomto stručném ' +
      '"Product Search" datasheetu specifikována — nejistota uvedena explicitně. Na rozdíl od ' +
      'záznamu IML-0638 (kde nebyl mechanický výkres k dispozici) tento datasheet obsahuje detail ' +
      'mechanické konstrukce: kupolovitý tvar s orientačním výstupkem (tab, natočen dle značky na ' +
      'senzoru), vnitřní dutina se stupněm (step) pro přesné usazení pyroelektrického elementu ' +
      '(Pyro-Element) senzoru uvnitř čočky, a doporučení výrobce pro návrh krytu/pouzdra (housing) ' +
      'kolem čočky — šrafovaná oblast dle obrázku v datasheetu musí být zakrytá neprůhledným ' +
      'materiálem krytu, jinak hrozí falešná detekce průnikem nežádoucího IR záření mimo optickou ' +
      'dráhu čočky. Materiál HDPE (vysokohustotní polyetylen), barva přírodní/bílá. Provozní ' +
      'teplota -25 až +60 °C, skladovací teplota -30 až +80 °C. Zařazeno do kategorie "Ostatní" ' +
      'jako čistě pasivní optická/mechanická součástka bez vlastní elektroniky.',
    tags: 'optika,fresnelova-čočka,hdpe,pir,murata,ira-e,pohybový-senzor,pasivní',
  },
  {
    name: 'IML-0662N000-T1',
    packageType:
      'Hranatá (obdélníková) SMD Fresnelova čočka s klenutým vrškem, půdorys 8,0×9,0 mm ' +
      '(zaoblené rohy R1,8), výška cca 6,7 mm nad DPS + patky, materiál HDPE (polyetylen s ' +
      'vysokou hustotou), barva přírodní/bílá, patky pro povrchovou montáž (SMD) na DPS, ' +
      'balení na podnosu (tray) po 1000 ks',
    value:
      'Fresnelova čočka pro PIR (pyroelektrické) pohybové senzory, formuje/segmentuje zorné pole ' +
      'senzoru do detekčních zón',
    notes:
      'Murata "IML-0662N000-T1" (dok. Product Search Data Sheet, staženo z murata.com, ' +
      'aktualizováno 27. 10. 2017 — pozn. výrobce: může být neaktuální, doporučeno stáhnout ' +
      'nejnovější verzi) — ⚠️ POZOR na záměnu s IML-0637/IML-0638 v této knihovně (samostatné ' +
      'záznamy): jde o stejný typ součástky (Fresnelova čočka pro PIR pohybové senzory, shodný ' +
      'materiál HDPE, přírodní bílá barva, shodný teplotní rozsah -25 až +60 °C provozní / -30 ' +
      'až +80 °C skladovací) ze STEJNÉ produktové rodiny "IML", ale s ODLIŠNÝM způsobem montáže: ' +
      'IML-0637/IML-0638 jsou určeny "For LEAD TYPE (IRA-E Series)" (kulaté kupolovité čočky pro ' +
      'drátové PIR senzory typu IRA-S4xx/IRA-S2xx/IRA-S5xx v této knihovně), zatímco IML-0662N000-T1 ' +
      'je výslovně "For SMD TYPE" — hranatá čočka s SMD patkami pro přímou povrchovou montáž na ' +
      'DPS, určená pro miniaturní SMD provedení PIR senzorů (na rozdíl od TO-5 kovového pouzdra u ' +
      'lead-type řady). Nejde tedy o záměnnou náhradu ani variantu optického vzoru v rámci stejné ' +
      'mechanické řady, ale o zcela odlišný mechanický formát pro jiný typ senzorového pouzdra. ' +
      'Materiál HDPE (vysokohustotní polyetylen), barva přírodní/bílá. Provozní teplota -25 až ' +
      '+60 °C, skladovací teplota -30 až +80 °C. Zařazeno do kategorie "Ostatní" jako čistě ' +
      'pasivní optická/mechanická součástka bez vlastní elektroniky.',
    tags: 'optika,fresnelova-čočka,hdpe,pir,murata,smd,pohybový-senzor,pasivní',
  },
  {
    name: 'IML-0660',
    packageType:
      'Kruhová kupolovitá SMD Fresnelova čočka, Ø11,0 mm (spodní), výška cca 10,4 mm nad DPS, ' +
      'materiál HDPE (polyetylen s vysokou hustotou), barva přírodní/bílá, SMD patky pro ' +
      'povrchovou montáž, balení volné (bulk/bag) po 200 ks',
    value:
      'Fresnelova čočka pro PIR (pyroelektrické) pohybové senzory, formuje/segmentuje zorné pole ' +
      'senzoru do detekčních zón',
    notes:
      'Murata "IML-0660" (dok. Product Search Data Sheet, staženo z murata.com, aktualizováno ' +
      '15. 2. 2024) — ⚠️ POZOR: díl je dle datasheetu v režimu "Discontinued" (výrobcem ukončen), ' +
      'na rozdíl od ostatních Fresnelových čoček v této knihovně (IML-0637, IML-0638, ' +
      'IML-0662N000-T1), které jsou aktivní ("In Production"/"Recommended") — pro nový návrh ' +
      'nevhodné, uvedeno jen pro referenci/servis existujících zařízení. ⚠️ Další záměna v rámci ' +
      'stejné produktové rodiny "IML" — shodně s IML-0662N000-T1 jde o "For SMD TYPE" variantu ' +
      '(na rozdíl od IML-0637/IML-0638 pro lead-type senzory), ale s ODLIŠNOU geometrií: IML-0660 ' +
      'je kruhová kupolovitá čočka Ø11,0 mm (podobného tvaru jako lead-type IML-0637, ale s SMD ' +
      'montáží), zatímco IML-0662N000-T1 je hranatá čočka s půdorysem 8,0×9,0 mm — odlišný tvar i ' +
      'balení (bulk/bag 200 ks u IML-0660 vs. tray 1000 ks u IML-0662N000-T1). Materiál HDPE ' +
      '(vysokohustotní polyetylen), barva přírodní/bílá. Provozní teplota -25 až +60 °C, ' +
      'skladovací teplota -30 až +80 °C (shodné s ostatními čočkami řady IML v této knihovně). ' +
      'Zařazeno do kategorie "Ostatní" jako čistě pasivní optická/mechanická součástka bez ' +
      'vlastní elektroniky.',
    tags: 'optika,fresnelova-čočka,hdpe,pir,murata,smd,pohybový-senzor,pasivní,discontinued',
  },
  {
    name: 'WXair MODUL 100-230V US/MX/J B',
    packageType:
      'Stolní přístrojová skříňka, rozměry 195×154×87 mm, hmotnost 1,28 kg, 2 otočné ovladače na ' +
      'čelním panelu, síťový vypínač, výstupní hadicové/vzduchové konektory na spodní straně',
    value:
      '2kanálový rework modul pro pájecí stanici Weller WXsmart — integrovaná rotační lamelová ' +
      'pumpa pro horký vzduch (kapacita 18 l/min) a vakuum (70 kPa), 100–240 V AC 50/60 Hz, 70 W',
    notes:
      'Weller Tools GmbH "WXair MODUL 100-230V US/MX/J B" (dok. Product Information, obj. č. ' +
      'T0053452299) — ⚠️ POZOR: NEJDE o elektronickou součástku pro stavbu obvodů, ale o ' +
      'DÍLENSKÉ VYBAVENÍ (pracovní nástroj/tool) — dvoukanálový přídavný modul, který rozšiřuje ' +
      'pájecí stanici Weller WXsmart na plnohodnotnou "All-in-One" rework stanici s integrovanou ' +
      'vysokovýkonnou rotační lamelovou vývěvou (poskytuje jak tlakový vzduch pro horkovzdušné ' +
      'pero, tak podtlak/vakuum pro odpájecí nástroje) bez nutnosti externího zdroje stlačeného ' +
      'vzduchu v dílně — "World\'s First Self-Contained, 2-in-1 Rework Module". Zařazeno do ' +
      'kategorie "Ostatní" jako výjimka mimo standardní elektronické součástky v této knihovně ' +
      '(na uživatelovo přání, i přes nesoulad s primárním zaměřením knihovny na součástky pro ' +
      'BOM/inventář stavěných obvodů). Kompatibilní nástroje: Weller WXDP 120 (odpájecí pero pro ' +
      'horizontální použití, 120 W), WXDV 120 (odpájecí pero pro vertikální použití, 120 W), ' +
      'WXHAP 200 (horkovzdušné pero, 200 W). Vyměnitelné filtry prodlužují životnost pumpy. Plná ' +
      'zpětná kompatibilita se staršími Weller WX stanicemi. Volitelná aktivace nožním spínačem. ' +
      'Celý modul i připojené nástroje jsou plně ESD bezpečné (ESD Safe).',
    tags: 'ostatní,dílenské-vybavení,pájecí-stanice,rework,weller,wxair,vzduchová-pumpa,vakuum,tool',
  },
  {
    name: 'Krystal 16 MHz HC-49/S',
    packageType: 'THT, HC-49/S, 2 vývody',
    value: '16,000 MHz, zátěžová kapacita obvykle 20 pF',
    notes:
      'Nejběžnější krystal pro AVR/Arduino oscilátory. Nutné doplnit 2× zátěžový kondenzátor ' +
      '(typicky 18–22 pF) dle konkrétní aplikace.',
    tags: 'krystal,oscilátor,16mhz,hc-49',
  },
  {
    name: 'Krystal 8 MHz HC-49/S',
    packageType: 'THT, HC-49/S, 2 vývody',
    value: '8,000 MHz, zátěžová kapacita obvykle 20 pF',
    notes: 'Nutné doplnit 2× zátěžový kondenzátor (typicky 18–22 pF) dle konkrétní aplikace.',
    tags: 'krystal,oscilátor,8mhz,hc-49',
  },
  {
    name: 'Krystal 12 MHz HC-49/S',
    packageType: 'THT, HC-49/S, 2 vývody',
    value: '12,000 MHz, zátěžová kapacita obvykle 20 pF',
    notes: 'Nutné doplnit 2× zátěžový kondenzátor (typicky 18–22 pF) dle konkrétní aplikace.',
    tags: 'krystal,oscilátor,12mhz,hc-49',
  },
  {
    name: 'Krystal 32,768 kHz (hodinkový)',
    packageType: 'THT, cylindrický (typ DS-26 / DT-38), 2 vývody',
    value: '32,768 kHz',
    notes: 'Hodinkový krystal pro RTC obvody (např. DS1307, DS3231) a hodiny mikrokontrolérů.',
    tags: 'krystal,oscilátor,32768hz,rtc,hodinkový',
  },
  {
    name: 'Keramický rezonátor 16 MHz (3pin)',
    packageType: 'THT, 3 vývody (rozteč 5 mm), s vestavěnými kondenzátory',
    value: '16,000 MHz ±0,5 %',
    notes:
      'Keramický rezonátor s integrovanými zátěžovými kondenzátory — nižší přesnost než krystal, ' +
      'ale bez nutnosti externích C.',
    tags: 'rezonátor,keramický,oscilátor,16mhz',
  },
  {
    name: 'Keramický rezonátor 8 MHz (3pin)',
    packageType: 'THT, 3 vývody (rozteč 5 mm), s vestavěnými kondenzátory',
    value: '8,000 MHz ±0,5 %',
    notes:
      'Keramický rezonátor s integrovanými zátěžovými kondenzátory — nižší přesnost než krystal, ' +
      'ale bez nutnosti externích C.',
    tags: 'rezonátor,keramický,oscilátor,8mhz',
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
    schematicImage: spec.schematicImage ?? null,
    notes: spec.notes,
    tags: spec.tags,
  }));
}

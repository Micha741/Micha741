import type { ComponentCategory, ComponentInput } from '../types/component';

interface MiscSpec {
  name: string;
  packageType: string;
  value: string;
  notes: string;
  tags: string;
  schematicImage?: string;
  category?: ComponentCategory;
  /** Odkaz na datasheet/oficiální produktovou stránku, pokud byl dohledán. */
  datasheetUrl?: string;
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
    schematicImage: 'SCD-0134032010-KF-SA.jpg',
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
    schematicImage: 'GD-342AP.jpg',
    category: 'LCD',
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
    category: 'LCD',
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
    schematicImage: 'FE0202W-EU.jpg',
    category: 'LCD',
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
      'Zařazeno do kategorie "PIR čidla" společně se senzorovými elementy Murata IRA-S410ST03/ ' +
      '230ST01/510ST01, ačkoli jde o čistě pasivní optickou/mechanickou součástku bez vlastní ' +
      'elektroniky.',
    schematicImage: 'IML-0638.jpg',
    category: 'PIR čidla',
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
      'teplota -25 až +60 °C, skladovací teplota -30 až +80 °C. Zařazeno do kategorie "PIR čidla" ' +
      'společně se senzorovými elementy Murata IRA-S410ST03/230ST01/510ST01, ačkoli jde o čistě ' +
      'pasivní optickou/mechanickou součástku bez vlastní elektroniky.',
    schematicImage: 'IML-0637.jpg',
    category: 'PIR čidla',
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
      '+60 °C, skladovací teplota -30 až +80 °C. Zařazeno do kategorie "PIR čidla" společně se ' +
      'senzorovými elementy Murata IRA-S410ST03/230ST01/510ST01, ačkoli jde o čistě pasivní ' +
      'optickou/mechanickou součástku bez vlastní elektroniky.',
    schematicImage: 'IML-0662N000-T1.jpg',
    category: 'PIR čidla',
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
      'Zařazeno do kategorie "PIR čidla" společně se senzorovými elementy Murata IRA-S410ST03/ ' +
      '230ST01/510ST01, ačkoli jde o čistě pasivní optickou/mechanickou součástku bez vlastní ' +
      'elektroniky.',
    schematicImage: 'IML-0660.jpg',
    category: 'PIR čidla',
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
    name: 'Krystal 10 MHz HC-49/S',
    packageType: 'THT, HC-49/S, 2 vývody',
    value: '10,000 MHz, zátěžová kapacita obvykle 20 pF',
    notes: 'Nutné doplnit 2× zátěžový kondenzátor (typicky 18–22 pF) dle konkrétní aplikace.',
    tags: 'krystal,oscilátor,10mhz,hc-49',
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
    name: 'Krystal 3,579545 MHz',
    packageType: 'THT, HC-49/S, 2 vývody',
    value: '3,579545 MHz (barevný NTSC subnosný kmitočet)',
    notes:
      'Standardní „televizní" krystal (odvozený z NTSC barevné podnosné) — běžně se používá jako ' +
      'časovací prvek DTMF přijímačů (např. MT8870D/MT8870) a dalších obvodů, kde je potřeba právě ' +
      'tento kmitočet. V této appce použito u X1 v projektu „Domácí interkom" (Praktická elektronika ' +
      'A Radio 01/2025) jako časovací krystal přijímače DTMF MT8870D.',
    tags: 'krystal,oscilátor,3.579545mhz,ntsc,dtmf,hc-49',
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
  {
    name: 'Baterie 9V (6F22)',
    packageType: 'Blokový 9V akumulátor/baterie, klip (snap) konektor',
    value: '9 V, alkalická nebo zinko-uhlíková (typ 6F22/PP3)',
    notes: 'Standardní blokový 9V zdroj pro malé přenosné obvody.',
    tags: 'baterie,9v,6f22,napájení',
  },
  {
    name: 'Baterie AA (tužková, 1,5 V)',
    packageType: 'Válcový článek AA (LR6)',
    value: '1,5 V alkalický nebo 1,2 V NiMH akumulátor',
    notes: 'Standardní tužková baterie/akumulátor velikosti AA, obvykle v sadě v držáku (2–4 ks dle napětí).',
    tags: 'baterie,aa,lr6,napájení,článek',
  },
  {
    name: 'Akumulátor Li-ion/Li-pol (obecný, ≥300 mAh)',
    packageType: 'Prizmatický nebo válcový článek, 2 vývody',
    value: '1 článek, 3,7 V nominál (4,2 V plně nabitý)',
    notes: 'Obecný jednočlánkový Li-ion/Li-pol akumulátor — kapacita a rozměr dle konkrétní konstrukce, nutná nabíječka s ochranou (např. TP4056).',
    tags: 'baterie,akumulátor,li-ion,li-pol,napájení',
  },
  {
    name: 'Trubičková pojistka (obecná, skleněná)',
    packageType: '5×20 mm nebo 6,3×32 mm skleněná trubička + držák',
    value: 'Tavná pojistka, proud dle konkrétní konstrukce (typicky 0,1–3 A)',
    notes: 'Obecná rychlá (F) nebo pomalá (T) tavná pojistka s odpovídajícím držákem na DPS/panel.',
    tags: 'pojistka,fuse,ochrana',
  },
  {
    name: 'Ventilátor 12V (DC, obecný)',
    packageType: 'Čtvercový rámeček (40–120 mm dle typu), 2 nebo 3 vývody',
    value: '12 V DC, obvykle 0,1–0,3 A',
    notes: 'Obecný stejnosměrný chladicí ventilátor pro elektroniku, rozměr/výkon dle konkrétní konstrukce.',
    tags: 'ventilátor,chlazení,12v,dc',
  },
  {
    name: 'Solární článek (obecný, malý)',
    packageType: 'Polykrystalický/monokrystalický panel, 2 vývody',
    value: 'Napětí a proud dle konkrétního typu (jednotky V, desítky mA)',
    notes: 'Obecný malý solární článek pro napájení/dobíjení nízkopříkonových obvodů (solární lampičky apod.).',
    tags: 'solární,fotovoltaický,článek,napájení',
  },
  {
    name: 'Superkondenzátor (obecný)',
    packageType: 'Radiální THT, 2 vývody',
    value: 'Desítky až stovky F, 2,5–5,5 V dle typu',
    notes: 'Obecný superkondenzátor (EDLC) pro krátkodobé zálohování/vyhlazení napájení.',
    tags: 'superkondenzátor,edlc,kondenzátor,napájení',
  },
  {
    name: 'Rtuťový polohový spínač (obecný)',
    packageType: 'Skleněná ampule se dvěma kontakty, 2 vývody',
    value: 'Spínač sepnutý/rozepnutý podle náklonu',
    notes: 'Polohový (náklonový) spínač s kapkou rtuti — sepne podle orientace. Pozor, obsahuje rtuť (nebezpečný odpad).',
    tags: 'spínač,rtuťový,polohový,náklonový',
    category: 'Spínač/Relé',
  },
  {
    name: 'Drátová propojka/jumper',
    packageType: 'THT, zkratovací propojka nebo pájecí drátová propojka',
    value: '0 Ω (přímé propojení)',
    notes: 'Obecná propojka na desce plošných spojů — buď pájecí drát, nebo zasunovací jumper (2,54 mm).',
    tags: 'propojka,jumper,drát',
  },
  {
    name: 'Relé modul (sestavená deska s relé)',
    packageType: 'Hotová deska s elektromagnetickým relé, budicím tranzistorem/optočlenem a svorkovnicí',
    value: '1–8 kanálů, spínané napětí 5/12 V logika, spínaný výkon dle typu relé na desce (typicky 10 A/250 VAC)',
    notes: 'Obecný hotový modul s relé (časté u Arduino/mikrokontrolérových projektů) — konkrétní počet kanálů a typ relé dle výrobce desky.',
    tags: 'modul,relé,relé-modul,spínací',
    category: 'Modul',
  },
  {
    name: 'Napájecí adaptér (síťový, obecný)',
    packageType: 'Externí síťový adaptér 230V AC → DC, souosý konektor',
    value: 'Výstupní napětí/proud dle konkrétní konstrukce (typicky 5–12 V)',
    notes: 'Obecný externí síťový napájecí adaptér — napětí a proud dle potřeby konkrétní konstrukce.',
    tags: 'napájecí,adaptér,zdroj,230v',
    category: 'Modul',
  },
  {
    name: 'Transformátor 230V/12V (malý síťový)',
    packageType: 'THT nebo vinutý toroidní/EI transformátor, montáž na DPS nebo šasi',
    value: 'Primár 230 V AC, sekundár 12 V AC, výkon dle konkrétní konstrukce (jednotky až desítky VA)',
    notes: 'Obecný malý síťový transformátor pro napájení nízkonapěťové elektroniky — výkon/proud dle konkrétní konstrukce.',
    tags: 'transformátor,síťový,230v,12v',
    category: 'Cívka',
  },
  {
    name: 'GL5539',
    datasheetUrl: 'https://www.lcsc.com/product-detail/Photoresistors_Senba-Sensing-Tech-GL5539_C125630.html',
    packageType: 'THT, 2 vývody, kulatá čočka Ø5 mm',
    value: 'Fotorezistor (LDR, CdS), odpor ve tmě ~1 MΩ, na světle ~10–20 kΩ (dle osvětlení)',
    notes:
      'Senba Sensing Tech, "GL55 Series Photoresistor" (katalogový datasheet řady GL55, souhrnná ' +
      'tabulka parametrů). Pro GL5539: maximální napětí 150 V, maximální ztrátový výkon 100 mW, ' +
      'pracovní teplota −30 až +70 °C, spektrální citlivost s vrcholem (peak) na 540 nm (odpovídá ' +
      'zelenému světlu, blízko citlivosti lidského oka). Světelný odpor měřený při osvětlení 10 lx ' +
      '(standardní zdroj A, po 2 h kondicionování 400–600 lx) bývá u GL5539 udáván v rozsahu cca ' +
      '30–90 kΩ (vybíraný/binovaný subtyp GL5539A pak užší 60–80 kΩ), gama (sklon odporu mezi 100 a ' +
      '10 lx) cca 0,7, doba odezvy (nárůst/pokles) cca 30 ms. Odpor ve tmě (měřen 10 s po zhasnutí ' +
      '10lx osvětlení) se mezi prodejci/kopiemi datasheetu liší (uváděno 1–10 MΩ) — hodnotu ve tmě ' +
      'proto brát jako řádově jednotky MΩ a ověřit u konkrétního dodaného kusu. Pouzdro THT, Ø5 mm, ' +
      '2 drátové vývody.',
    tags: 'fotorezistor,ldr,gl5539,senzor,světlo',
  },
  {
    name: 'Reproduktor 8 Ω (malý, obecný)',
    packageType: 'Kulatý mylarový/papírový reproduktor, Ø 4–5 cm, 2 vývody',
    value: 'Impedance 8 Ω, výkon cca 0,5–1 W (max. do 2 W), citlivost cca 85 dB/1W/1m, kmitočtový rozsah cca 300 Hz–10 kHz',
    notes:
      'Obecný malý reproduktor, jaký se běžně používá v hračkách, poplašných zařízeních a hobby ' +
      'konstrukcích (ne auto-audio/HiFi reproduktor s velkým výkonem a basovou odezvou) — hodnoty ' +
      'jsou typické/orientační pro tuto kategorii, ne z konkrétního datasheetu jednoho výrobku. ' +
      'V této appce použito jako SP1 v projektu „Elektronický kanárek" (Praktická elektronika A ' +
      'Radio 01/2025) a SP1/SP2 v projektu „Univerzální reproskříň".',
    tags: 'reproduktor,speaker,8ohm,audio',
  },
  {
    name: 'Vícepásmová End Fed anténa EFHW (1:49/1:64)',
    packageType:
      'Jednostranně napájená (end-fed) drátová KV anténa s impedančním transformátorem (unun) ' +
      'v plastové krabičce na jednom konci a vodičem 2,5 mm² na druhém; na obou koncích upevnění ' +
      'nekovovými (ne ocelovými) lany, instalace jako inverted-V nebo horizontální/diagonální drát',
    value:
      'Varianta 40 m (JYR4010-150W): délka vodiče cca 20 m, transformátor 1:64, pásma 10/15/20/40 m. ' +
      'Varianta 80 m (JYR8010-150W): délka vodiče cca 40,7 m, transformátor 1:49, pásma 10–80 m. ' +
      'Výkon obě varianty: SSB <150 W, CW ~100–120 W, FT8 ~80–100 W',
    notes:
      'Vícesměrová (všesměrová) jednopásmově napájená KV anténa pro radioamatérský provoz — díky ' +
      'jednostrannému napájení rychlá a jednoduchá instalace bez nutnosti řešit směrovost. ' +
      'Instalační požadavky dle výrobce: po celé délce anténa vyžaduje min. 3 m odstup od ' +
      'nekovových překážek (zdi, stromy, listí) a min. 5 m od kovových předmětů (el. vedení, okna, ' +
      'kovové zábradlí) pro zachování parametrů; lana vydrží cca 5 let, kontrola doporučena každých ' +
      '6 měsíců. Hodnoty přepsány z produktové stránky prodejce (ne z PDF datasheetu výrobce), proto ' +
      'bez datasheetUrl — ověřit přesné parametry u konkrétního kusu, pokud je to kritické.',
    tags: 'anténa,antenna,efhw,end-fed,vícepásmová,multiband,kv,hf,drátová,unun,transformátor,1:49,1:64,radioamatér',
  },
  {
    name: 'Tenzometrické čidlo (obecné, odporový můstek)',
    packageType: 'Kovová/plastová nosná destička s nalepenými tenzometry (strain gauge), 4 vývody (Wheatstoneův můstek: VDD, GND, IN+, IN-)',
    value: 'Resistivní tenzometrický senzor síly/hmotnosti, výstupní signál v řádu mV/V (vyžaduje 24bitový diferenciální A/D převodník, např. HX711)',
    notes:
        'Obecné tenzometrické čidlo (load cell) — malý výstupní signál typický pro tuto kategorii, ' +
        'proto se prakticky vždy používá se specializovaným 24bitovým sigma-delta A/D převodníkem ' +
        's diferenciálním vstupem (viz samostatný záznam „24bitový A/D převodník..."). V této appce ' +
        'použito jako dvojice čidel (12L, 12P, zapojená sériově pro sečtení signálu) pro vážení ' +
        'nádobky v projektu „Automatické krmítko kurníku (ESP32-C3, bakalářská práce)" — Pavel ' +
        'Kejík, FIT VUT v Brně, 2024.',
    tags: 'tenzometr,tenzometrické-čidlo,load-cell,strain-gauge,vážení,senzor,hmotnost',
  },
  {
    name: '24bitový A/D převodník pro tenzometry (obecný, diferenciální, typ HX711)',
    packageType: 'SMD/DIP IC, piny vdd/gnd + diferenciální vstup (in+, in-) + sériové rozhraní (PDCLK, PDO)',
    value: '24bitový sigma-delta A/D převodník s nastavitelným zesílením, určený pro přímé snímání tenzometrických (Wheatstoneův můstek) čidel',
    notes:
        'Obecná kategorie — typický zástupce je HX711 (bez samostatného datasheetem podloženého ' +
        'záznamu v této appce). Kvůli velmi malému výstupnímu napětí tenzometrů (mV/V řádu) ' +
        'potřebuje diferenciální vstup s vysokým ziskem, na rozdíl od běžných ADC vestavěných v ' +
        'mikrokontrolérech. V této appce použito jako „A/D C 24bit" v blokovém schématu elektroniky ' +
        'projektu „Automatické krmítko kurníku (ESP32-C3, bakalářská práce)" — Pavel Kejík, FIT VUT ' +
        'v Brně, 2024 — konkrétní typ IC práce blíže nespecifikuje.',
    category: 'IO',
    tags: 'io,ad-převodník,adc,24bit,diferenciální,tenzometr,load-cell,hx711,sigma-delta',
  },
  {
    name: 'Induktivní snímač (obecný, bezkontaktní)',
    packageType: 'Válcový nebo kvádrový snímač, 2–3 vývody',
    value: 'Bezkontaktní detekce kovových předmětů, spínaný výstup',
    notes: 'Obecný induktivní (bezkontaktní) snímač pro detekci kovových předmětů — konkrétní typ/dosah dle výrobce.',
    tags: 'snímač,induktivní,senzor,bezkontaktní',
  },
  {
    name: 'Vibrační motorek (koinový/kapslový, z mobilního telefonu)',
    packageType: 'Plochý kulatý (coin) nebo válcový (cylinder) motorek, 2 vývody',
    value: 'Malý DC motorek s excentrickou zátěží (ERM), 3–5 V',
    notes: 'Obecný vibrační motorek používaný v mobilních telefonech pro vibrační upozornění — lze znovupoužít jako zdroj vibrací pro DIY konstrukce.',
    tags: 'motor,vibrační,motorek,erm,mobilní-telefon',
  },
  {
    name: 'DC motor s převodovkou (obecný)',
    packageType: 'Válcové tělo motoru + šneková nebo planetová převodovka, 2 vývody',
    value: 'Stejnosměrný motor s převodovkou, napětí a otáčky dle konkrétní konstrukce (typicky 6–12 V)',
    notes: 'Obecný DC motor s převodovkou pro pohon mechanismů (dvířka, rolety apod.) — přesné otáčky/moment/napětí dle konkrétního typu (např. DFRobot gearmotor).',
    tags: 'motor,dc-motor,převodovka,gearmotor',
  },
  {
    name: 'Nízkotlaké palivové čerpadlo (12V DC, obecné)',
    packageType: 'Válcové tělo s palivovými hrdly, 2 elektrické vývody',
    value: 'Stejnosměrné nízkotlaké palivové čerpadlo, 12 V DC',
    notes: 'Obecné nízkotlaké DC palivové čerpadlo (např. z novějších modelů Škoda) — konkrétní tlak/průtok dle výrobce a modelu vozu.',
    tags: 'čerpadlo,palivové,motor,automotive',
  },
  {
    name: 'ZM1005 / ZM1005R',
    datasheetUrl: 'https://frank.pocnet.net/sheets/013/z/ZM1005_7b_1979-05.pdf',
    packageType:
      '14pinová patice (dvouřadé vývody po 7, rozteč 2,54 mm, kompatibilní s roztečí DPS dle IEC ' +
      'Publikace 97/0,1"), skleněné tělo, průměr pouzdra cca 19 mm max., výška cca 42,8 mm max. ' +
      'Odchylka os vývodů od ideální polohy max. 0,3 mm.',
    value:
      'Doutnavková indikační trubice ("Nixie"-typ) se studenou katodou, 10 číslic (0-9) + desetinná ' +
      'tečka, výška číslic cca 14 mm, zapalovací napětí max. 170 V, špičkový anodový proud 6-20 mA',
    notes:
      '⚠️ NENÍ KONDENZÁTOR a NENÍ z BBC micro:bit — uživatel nahrál s dotazem, zda jde o ' +
      'kondenzátor z micro:bitu, ale dokument popisuje úplně jinou, vintage součástku: Mullard ' +
      '"ZM1005/ZM1005R — Indicator Tube" (datasheet leden/duben 1970). Jde o doutnavkovou ' +
      '(cold-cathode) indikační trubici pro boční čtení (side viewing), obdobu "Nixie" trubic — ' +
      'žhavená vakuová/plynem plněná trubice se skleněným tělem, ne polovodičová ani pasivní SMD ' +
      'součástka, proto zařazena do kategorie "Ostatní". ZM1005R má červený kontrastní filtr, ' +
      'ZM1005 je identická, ale bez filtru. Princip činnosti: trubice obsahuje 10 katod ve tvaru ' +
      'číslic 0-9 a jednu katodu ve tvaru desetinné tečky, primer (pomocná elektroda pro ' +
      'ionizaci bez zpoždění při strobe/blanking aplikacích) a jednu společnou anodu — přiložením ' +
      'vhodného napětí mezi anodu a jednu z katod se příslušná číslice/tečka rozsvítí červenou ' +
      'neonovou září. Vývody: pr (primer), k0-k9 (katody číslic), kdp (katoda desetinné tečky), ' +
      'a (anoda), i.c. (interně propojené/nezapojené vývody). Mezní hodnoty: Vign (zapalovací ' +
      'napětí, pulzní) min. 170 V, Ia (anodový proud, průměrný, Tav≤20ms) max. 2,5 mA, Iap ' +
      '(špičkový) min. 6 mA/max. 20 mA, Timp (délka pulzu) min. 50µs (10µs při Iap≥10mA), Vkk ' +
      '(napětí výběru katody) 70-115 V, Vext (zhášecí napětí) min. 118 V, tamb -50 až +70°C ' +
      '(pod 10°C snížená životnost). Doporučené rezistory: Rdp (katoda desetinné tečky) 10 kΩ±10%, ' +
      'Rpr (primer, anoda-primer napájení min. 170V) 10 MΩ±10%. Pájení: max. 240°C po max. 10s do ' +
      'vzdálenosti 3 mm od skleněných průchodek. Životnost při Ia=2mA: 100000 h (Iap=10mA, ' +
      'sekvenční změna číslic každých ≤100h) / 20000 h (Iap=20mA), MTBF min. 200000 h. ' +
      'Vlastní frekvence katodových číslic 300-800 Hz. Příslušenství výrobce: 55701 (montážní ' +
      'DPS 19×100mm), 55702 (patice pro rastr 0,1"), 55703 (zaklapávací držák), 55704 (koncové ' +
      'díly pro sestavu držáku).',
    schematicImage: 'ZM1005.jpg',
    tags: 'indikátor,trubice,nixie,doutnavka,cold-cathode,mullard,zm1005,zm1005r,vintage,číslicový-displej',
  },
  {
    name: 'RV2,4P45',
    datasheetUrl: 'https://tubedatabase.co/tubes/RV 2,4 P45',
    packageType:
      'Skleněná baňka, přímo žhavená oxidová katoda (vlákno), žhavicí napětí 2,4 V — typické pro ' +
      'malé přenosné bateriové přijímače vojenské/válečné výroby (Wehrmacht). Přesné mechanické ' +
      'rozměry a vývodové uspořádání se v dostupných zdrojích liší (viz poznámka níže).',
    value:
      'Prostorovou mřížkou řízená pentoda (Raumladegitter-Pentode), přímo žhavená, Va max 100 V, ' +
      'Pa max 1 W, typický pracovní bod (NF/VF zesílení): Va 20 V, strmost 750 µA/V, ri 60 kΩ, ' +
      'Ia 1,6 mA',
    notes:
      '⚠️ Nejde o datasheet nahraný uživatelem — uživatel poslal historický časopis "Radioamatér" ' +
      'ročník XXVI, č. 8 (13. srpna 1947), kde elektronka RV2,4P45 figuruje ve stavebním návodu ' +
      '"Malý přenosný superhet" (str. 216-219): dvě elektronky RV2,4P45 (V1=směšovač-oscilátor, ' +
      'V2=NF/MF zesilovač) v bateriovém přenosném superhetu s rámovou anténou, napájené ' +
      'žhavicím napětím 2,4 V (ze dvou tyčkových baterií "Mila") a anodovým napětím 15-18 V (ze ' +
      'dvou plochých kapesních baterií). Protože se nejedná o oficiální výrobcovský datasheet, ' +
      'elektrické parametry byly dohledány sekundárně (tubedatabase.co) a v dostupných zdrojích ' +
      'se mírně rozcházejí mezi uváděnou skleněnou verzí (RV 2,4 P45 — Telefunken, Raumladegitter- ' +
      'pentoda, oxidová katoda, odkaz na dodací podmínky Wehrmachtu TL 21b 7023) a kovovou verzí ' +
      '(RV2P45 — 6kolíková kovová patice, Pa max 0,5 W, µ=45, strmost 700 µA/V, pravděpodobně ' +
      'jiná/příbuzná varianta) — ⚠️ údaje tedy berte jako orientační, ne jako přesný ověřený ' +
      'datasheet. Mezní hodnoty (skleněná verze): Va max 100 V, Pa max 1 W, Vg2 (stínicí mřížka) ' +
      'max 50 V, Vg1 (řídicí mřížka) max -5 V, Ik max 6 mA. Typický pracovní bod pro NF/VF ' +
      'zesílení: Va 20 V, strmost (gm) 750 µA/V, vnitřní odpor ri 60 kΩ, Ia 1,6 mA. Součást ' +
      'rodiny příbuzných typů RV2,4P700, RV2,4P1400 (jiné, výkonnější elektronky stejné "RV2,4" ' +
      'žhavicí řady, časté náhradní díly z vojenského demobilu v poválečném Československu — viz ' +
      'i dobový text "Máte-li k dispozici zbytky dosavadní vojenské výzbroje...").',
    schematicImage: 'RV2-4P45.jpg',
    tags: 'elektronka,trubice,tube,pentoda,raumladegitter,vojenská,telefunken,rv2,4p45,vintage,žhavená,1947',
  },
];

export function buildMiscSeed(): ComponentInput[] {
  return MISC_SPECS.map((spec) => ({
    name: spec.name,
    category: spec.category ?? 'Ostatní',
    manufacturer: null,
    packageType: spec.packageType,
    value: spec.value,
    quantity: 0,
    location: null,
    datasheetUrl: spec.datasheetUrl ?? null,
    schematicImage: spec.schematicImage ?? null,
    notes: spec.notes,
    tags: spec.tags,
  }));
}

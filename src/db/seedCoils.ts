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
  {
    name: 'Radiální tlumivka 10 µH',
    packageType: 'THT, radiální, barevný kód',
    value: '10 µH',
    notes: 'Obecná radiální (barelová) tlumivka pro obecné použití, ověř proudovou zatížitelnost u konkrétního kusu.',
    tags: 'cívka,tlumivka,induktor,tht',
  },
  {
    name: 'Radiální tlumivka 100 µH',
    packageType: 'THT, radiální, barevný kód',
    value: '100 µH',
    notes: 'Obecná radiální (barelová) tlumivka pro obecné použití, ověř proudovou zatížitelnost u konkrétního kusu.',
    tags: 'cívka,tlumivka,induktor,tht',
  },
  {
    name: 'Radiální tlumivka 1 mH',
    packageType: 'THT, radiální, barevný kód',
    value: '1 mH',
    notes: 'Obecná radiální (barelová) tlumivka pro obecné použití, ověř proudovou zatížitelnost u konkrétního kusu.',
    tags: 'cívka,tlumivka,induktor,tht',
  },
  {
    name: 'Radiální tlumivka 10 mH',
    packageType: 'THT, radiální, barevný kód',
    value: '10 mH',
    notes: 'Obecná radiální (barelová) tlumivka pro obecné použití, ověř proudovou zatížitelnost u konkrétního kusu.',
    tags: 'cívka,tlumivka,induktor,tht',
  },
  {
    name: 'SMD výkonová tlumivka 4,7 µH (0630)',
    packageType: 'SMD, stíněná, pouzdro cca 6,5×6,5×3,0 mm',
    value: '4,7 µH',
    notes: 'Stíněná SMD výkonová tlumivka pro spínané zdroje (SMPS), ověř proudovou zatížitelnost u konkrétního kusu.',
    tags: 'cívka,tlumivka,induktor,smd,smps',
  },
  {
    name: 'SMD výkonová tlumivka 10 µH (0630)',
    packageType: 'SMD, stíněná, pouzdro cca 6,5×6,5×3,0 mm',
    value: '10 µH',
    notes: 'Stíněná SMD výkonová tlumivka pro spínané zdroje (SMPS), ověř proudovou zatížitelnost u konkrétního kusu.',
    tags: 'cívka,tlumivka,induktor,smd,smps',
  },
  {
    name: 'SMD výkonová tlumivka 22 µH (0630)',
    packageType: 'SMD, stíněná, pouzdro cca 6,5×6,5×3,0 mm',
    value: '22 µH',
    notes: 'Stíněná SMD výkonová tlumivka pro spínané zdroje (SMPS), ověř proudovou zatížitelnost u konkrétního kusu.',
    tags: 'cívka,tlumivka,induktor,smd,smps',
  },
  {
    name: 'SMD výkonová tlumivka 47 µH (0630)',
    packageType: 'SMD, stíněná, pouzdro cca 6,5×6,5×3,0 mm',
    value: '47 µH',
    notes: 'Stíněná SMD výkonová tlumivka pro spínané zdroje (SMPS), ověř proudovou zatížitelnost u konkrétního kusu.',
    tags: 'cívka,tlumivka,induktor,smd,smps',
  },
  {
    name: 'Ferritová korálka THT (na vývod)',
    packageType: 'THT, navlékací na vývod/kabel, Ø5 mm',
    value: 'Ferritová korálka (EMI supresní), impedance řádově 100 Ω @100 MHz',
    notes: 'Potlačení VF rušení na vodiči, konkrétní impedance závisí na materiálu jádra a kmitočtu.',
    tags: 'cívka,ferrit,emi,tlumivka',
  },
  {
    name: 'Ferritová korálka SMD 0805',
    packageType: 'SMD 0805',
    value: 'Ferritová korálka (EMI supresní), impedance řádově 100 Ω @100 MHz',
    notes: 'SMD ferritová korálka pro potlačení VF rušení na napájecí/signálové lince.',
    tags: 'cívka,ferrit,emi,tlumivka,smd',
  },
  {
    name: 'AC1020',
    packageType:
      'THT toroidní proudový transformátor v plastovém pouzdru, 3 vývody (piny 1/2/3, pin 3 ' +
      'jen mechanická podpora nebo pro provedení se středním odbočením), vnější Ø23,8×23,8 mm, ' +
      'výška 11,12 mm, otvor pro primární vodič Ø9,5 mm, rozteč vývodů 15,24×7,62 mm',
    value:
      'Proudový transformátor (current transformer, CT) pro měření/snímání proudu 50/60 Hz, ' +
      'jmenovitý primární proud 20 A (max. 60 A), převodní poměr 1000:1',
    notes:
      'Talema Group "AC1020 — 20 Amp Current Transformer" (datasheet, rev. 07/18). Druhý typ ' +
      'proudového transformátoru v této knihovně vedle MPS Industries P4100E5 (viz jeho záznam) ' +
      '— na rozdíl od P4100E5 (miniaturní SMD transformátor pro proudové snímání uvnitř SMPS, ' +
      'jednozávitové primární vinutí v pouzdře) jde o větší toroidní THT konstrukci pro montáž ' +
      'na vlastní jeden závit vodiče/přípojnice (průchozí otvor Ø9,5mm, primární vinutí NENÍ ' +
      'součástí dílu — protahuje se jím měřený vodič, případně 1 závit izolovaného vodiče pro ' +
      'nižší proudy) určenou pro síťové kmitočty 50/60Hz. Použití: snímání přetížení, detekce ' +
      'zemního/reziduálního proudu, měření (metering), převod na analogový signál pro A/D ' +
      'obvody. Primární proud 20A jmenovitě, max. 60A. Poměr napětí na 1 ampér při zátěži 100 Ω: ' +
      '0,100 V/A @20A / 0,097 V/A @2A (mírná nelinearita při nízkém proudu). Odpor sekundárního ' +
      'vinutí (DCR) 41,8 Ω @20°C. Dielektrická pevnost (hi-pot) 4 kVrms. Izolační odpor min ' +
      '100 MΩ. Skladovací teplota -55 až +130°C. Pouzdro UL94V-0, shoda s RoHS a REACH. ' +
      'Poznámka výrobce: zátěžový (burden) rezistor ani jednozávitové primární vinutí nejsou ' +
      'součástí dodávky, pokud nejsou výslovně objednány — burden rezistor 100Ω/1/8W je uveden ' +
      'jako referenční příklad (dává 2,0V výstup @20A). Pin 3 slouží pouze jako mechanická ' +
      'podpora, případně pro provedení se středním odbočením vinutí.',
    tags: 'cívka,transformátor,proudový-transformátor,current-transformer,talema,ac1020,toroid,thd,metering',
  },
  {
    name: 'INDEL KK 60/EI 22-2/4 / 23-2/4 / 24-2/4',
    packageType:
      'THT síťový transformátor na jádru EI 60, zalitý epoxidovou pryskyřicí, 14 pinů (7+7, ' +
      'rozteč vývodů p=5mm), 4 montážní otvory pro šroub Ø4,4mm, rozměry (a×b×c dle varianty) ' +
      'cca 63,6×53,6×47,2–56,5 mm',
    value:
      'Síťový (izolační/napájecí) transformátor — mechanická/výkonová platforma na jádru EI60, ' +
      'jmenovitý výkon 25 VA (jádro EI60/21) / 30 VA (EI60/25) / 35 VA (EI60/31), na zvláštní ' +
      'objednávku až 30/35/45 VA',
    notes:
      'INDEL "Karta katalogowa KK 60/EI .... - 2/4 — Rozwiązanie mechaniczne transformatora na ' +
      'kształtce EI 60 w obudowie zalanego żywicą" (polský/vícejazyčný katalogový list). ⚠️ TENTO ' +
      'KONKRÉTNÍ LIST POPISUJE POUZE MECHANICKÉ ŘEŠENÍ (rozměry pouzdra, rozteč a typ vývodů, ' +
      'hmotnost) a jmenovitý výkon v VA — NEOBSAHUJE elektrické parametry vinutí (počet závitů, ' +
      'primární/sekundární napětí, proud) — ty by byly na samostatném elektrickém katalogovém ' +
      'listu ke konkrétnímu objednacímu kódu (typické u výrobců transformátorů, kde se ' +
      'mechanická "platforma" jádra/kostřičky a elektrické provedení vinutí uvádí odděleně). ' +
      'Tři varianty lišící se pouze typem jádra EI60 a tím i výškou pouzdra a výkonem: KK 60/ ' +
      'EI 22-2/4 (jádro EI60/21, 25VA, resp. 30VA na objednávku, výška c=47,2mm), KK 60/EI 23-2/4 ' +
      '(jádro EI60/25, 30VA/35VA, c=51,5mm), KK 60/EI 24-2/4 (jádro EI60/31, 35VA/45VA, ' +
      'c=56,5mm) — mechanicky a rozměrově jinak shodné (a=63,6mm, a1=41,8mm, b=53,6mm, ' +
      'b1=35,8mm, d=72,5mm, d1=43,5mm, e=81,8mm, montážní otvor Ø4,4mm, rozteč vývodů p=5mm, ' +
      'osová vzdálenost vývodů m=32,5mm). Typ vývodů (koncovky): LZ, G1, P, X (varianty ' +
      'provedení pinů/pájecích ploch, blíže nespecifikováno v tomto listu). Hmotnost 0,6 kg ' +
      '(EI22) / 0,7 kg (EI23) / 0,8 kg (EI24).',
    tags: 'cívka,transformátor,síťový-transformátor,ei60,indel,kk60,epoxidová-zalévačka,mechanická-platforma',
  },
];

const TORK_SPECS: CoilSpec[] = [
  {
    name: 'T-SB1.230A',
    packageType:
      'Cívka elektromagnetického ventilu s konektorem DIN 43650 typ A (PG9/PG11), krytí ' +
      'IP65 (DIN 40050), hmotnost 0,15 kg; svorky konektoru: PE (zem), N, L',
    value: '230 V AC, 15 VA, 50/60 Hz',
    notes:
      'TORK "Technická data cívky" (návod pro mechanickou a elektrickou instalaci) — náhradní ' +
      'cívka (s konektorem) pro elektromagnetické (solenoidové) ventily řady TORK T-SB, ' +
      '⚠️ NOVÝ TYP součástky v této knihovně: elektromagnetická cívka ventilu (fluidní/ ' +
      'vodovodní/plynová armatura), ne cívka pro elektronický obvod jako ostatní záznamy v ' +
      'kategorii "Cívka" — přidáno sem jako nejbližší odpovídající kategorie (elektromagnetický ' +
      'aktuátor). Ventil samotný se standardně dodává i s cívkou a konektorem; cívka+konektor se ' +
      'samostatně dodává jen jako náhradní díl. Součást dvojice sérií T-SB1 (jediné napětí 230 ' +
      'VAC, tento záznam) a T-SB2 (24/12 VAC nebo VDC, viz sourozenecké záznamy T-SB2.24A/D a ' +
      'T-SB2.12A/D) — datasheet společný. ' +
      'Tolerance napětí ±10 %. Trvalé zatížení 100 %. Max. teplota okolí 50 °C. Tepelná třída ' +
      'izolace cívky H (180 °C). Magnetická jednotka: měděné vinutí tvarované v termoplastu ' +
      '(polyester s 30% laminátu), izolace cívky 30% vlákno Nylon 66. Konektor DIN 43650 (v ' +
      'originále uvedeno jako "DIN 4365") typ A, závit PG9/PG11. ' +
      'Instalace: cívka se nesmí připojit k napětí, dokud není osazena na ventil a přichycena ' +
      'jistící maticí; nelze ji sejmout z ventilu před odpojením napětí (hrozí poškození); ' +
      'konektor se k cívce připevňuje jen jediným možným způsobem a zajišťuje upevňovacím ' +
      'šroubem; cívkou lze otáčet i po zapojení. ⚠️ Za provozu se cívka může zahřát na horký ' +
      'povrch (vlivem teploty média nebo dlouhodobého připojení pod napětím).',
    tags: 'cívka,solenoidový-ventil,elektromagnetický-ventil,tork,t-sb,t-sb1,230vac,ip65',
  },
  {
    name: 'T-SB2.24A',
    packageType:
      'Cívka elektromagnetického ventilu s konektorem DIN 43650 typ A (PG9/PG11), krytí ' +
      'IP65 (DIN 40050), hmotnost 0,15 kg; svorky konektoru: PE (zem), 1, 2',
    value: '24 V AC, 15 VA, 50/60 Hz',
    notes:
      'Součást řady TORK T-SB (viz poznámka u T-SB1.230A pro plné společné specifikace). ' +
      'Série T-SB2, varianta 24 V AC.',
    tags: 'cívka,solenoidový-ventil,elektromagnetický-ventil,tork,t-sb,t-sb2,24vac,ip65',
  },
  {
    name: 'T-SB2.24D',
    packageType:
      'Cívka elektromagnetického ventilu s konektorem DIN 43650 typ A (PG9/PG11), krytí ' +
      'IP65 (DIN 40050), hmotnost 0,15 kg; svorky konektoru: PE (zem), 1, 2',
    value: '24 V DC, 18 W',
    notes:
      'Součást řady TORK T-SB (viz poznámka u T-SB1.230A pro plné společné specifikace). ' +
      'Série T-SB2, varianta 24 V DC.',
    tags: 'cívka,solenoidový-ventil,elektromagnetický-ventil,tork,t-sb,t-sb2,24vdc,ip65',
  },
  {
    name: 'T-SB2.12A',
    packageType:
      'Cívka elektromagnetického ventilu s konektorem DIN 43650 typ A (PG9/PG11), krytí ' +
      'IP65 (DIN 40050), hmotnost 0,15 kg; svorky konektoru: PE (zem), 1, 2',
    value: '12 V AC, 15 VA, 50/60 Hz',
    notes:
      'Součást řady TORK T-SB (viz poznámka u T-SB1.230A pro plné společné specifikace). ' +
      'Série T-SB2, varianta 12 V AC.',
    tags: 'cívka,solenoidový-ventil,elektromagnetický-ventil,tork,t-sb,t-sb2,12vac,ip65',
  },
  {
    name: 'T-SB2.12D',
    packageType:
      'Cívka elektromagnetického ventilu s konektorem DIN 43650 typ A (PG9/PG11), krytí ' +
      'IP65 (DIN 40050), hmotnost 0,15 kg; svorky konektoru: PE (zem), 1, 2',
    value: '12 V DC, 18 W',
    notes:
      'Součást řady TORK T-SB (viz poznámka u T-SB1.230A pro plné společné specifikace). ' +
      'Série T-SB2, varianta 12 V DC.',
    tags: 'cívka,solenoidový-ventil,elektromagnetický-ventil,tork,t-sb,t-sb2,12vdc,ip65',
  },
];

const SCHAEFFLER_SPECS: CoilSpec[] = [
  {
    name: 'MF-INDUCTOR',
    packageType:
      'Flexibilní kabelová indukční cívka (ovíjí se kolem/do obrobku), kruhové bajonetové ' +
      'konektory pro připojení ke generátoru; 3 výkonové třídy generátoru a víc rozměrových ' +
      'variant v každé — viz tabulka v poznámce',
    value:
      '⚠️ NOVÝ TYP součástky v této knihovně — indukční ohřevová cívka pro průmyslové indukční ' +
      'ohřívání feromagnetických obrobků (např. ohřev ložisek před montáží), 3,5/10-22/44 kW, ' +
      'délky 5–40 m, max. teplota 180 °C nebo 300 °C dle provedení',
    notes:
      'Schaeffler "BA 86 — Flexibilní indukční cívky MF-INDUCTOR" (uživatelská příručka, rev. ' +
      '09/2024) — ⚠️ jde o kabelovou indukční cívku pro profesionální indukční ohřívací zařízení ' +
      '(generátor + cívka), ne o cívku pro elektronický obvod jako ostatní záznamy v kategorii ' +
      '"Cívka" — přidáno sem jako nejbližší odpovídající kategorie (induktor). Generátor dodává ' +
      'střídavé napětí do cívky, kolem/v obrobku vzniká střídavé elektromagnetické pole, ve ' +
      'feromagnetickém obrobku indukuje vířivé proudy → obrobek se ohřívá (bez přímého kontaktu ' +
      's topným tělesem). Cívka se buď ovíjí kolem obrobku, vkládá do otvoru obrobku, nebo se ' +
      'používá jako plochá cívka na povrchu. Smí se provozovat jen se Schaeffler generátory ' +
      'odpovídajícího výkonu, max. 2 přívodní kabely v řadě (celkem max 6 m). ' +
      '⚠️ NEBEZPEČÍ: silné elektromagnetické pole — ohrožení života osob s kardiostimulátorem ' +
      'nebo kovovým implantátem v blízkosti; riziko srdeční arytmie při dlouhodobém působení i ' +
      'bez implantátu; horký povrch cívky i ohřívaného obrobku. ' +
      'Objednací kód: MF-INDUCTOR-<výkon>-<délka>M-D<průměr kabelu>-<teplotní třída>C[-SLIM]. ' +
      'Výkonové/rozměrové třídy (P=jmenovitý výkon generátoru, D=vnější průměr kabelu cívky, ' +
      'dmin=min. průměr obrobku, Tmax=max. teplota obrobku, hmotnost dle délky): ' +
      '3,5 kW/D12mm/dmin90mm/180°C (délky 5–10 m, 1,35–2,6 kg); ' +
      '10–22 kW/D12mm/dmin75mm/180°C "SLIM" provedení, tmax provozu 10 min (délky 10–30 m, ' +
      '3–11 kg); 10–22 kW/D15mm/dmin100mm/180°C, bez časového omezení provozu (délky 15–40 m, ' +
      '7–20 kg); 10–22 kW/D20mm/dmin120mm/300°C, provedení odolávající vysokým teplotám (délky ' +
      '10–30 m, 6–18 kg); 44 kW/D19mm/dmin140mm/180°C (délky 15–40 m, 16–36 kg); 44 kW/D28mm/ ' +
      'dmin220mm/300°C (délky 15–30 m, 17–34 kg). Každá kombinace délka/průměr/teplota má vlastní ' +
      'objednací číslo (např. MF-INDUCTOR-3.5KW-5M-D12-180C = obj. č. 300217072-0000-10) — celkem ' +
      '28 kombinací v aktuální nabídce, konkrétní kus rozliš podle typového štítku na cívce. ' +
      'Provozní podmínky: okolní teplota 0 až +40 °C, vlhkost 5–80 % (bez kondenzace), obrobek ' +
      'musí stát na nehořlavém/žáruvzdorném a neferomagnetickém podkladu a mít pevné uzemnění. ' +
      'Skladovací podmínky: -5 až +55 °C, 5–80 % vlhkosti (bez kondenzace), cívka musí být ' +
      'vychladlá na pokojovou teplotu. Příslušenství: přívodní kabel MF-GENERATOR.CONNECT-22KW-3M ' +
      '(pro 10-22kW generátory) nebo MF-GENERATOR.CONNECT-44KW-3M (pro 44kW), oba 3 m, s ' +
      'jednopólovými bajonetovými konektory (pro generátor 3,5kW není přívodní kabel dostupný — ' +
      'cívka se připojuje přímo); snímač teploty MF-GENERATOR.MPROBE-GREEN/RED (umísťuje se do ' +
      'bezprostřední blízkosti závitů cívky, kde teplo vzniká nejdřív, protože cívka sama nemá ' +
      'žádné vlastní monitorování teploty). Oprava: konektory lze vyměnit jen u modelů 22kW a ' +
      '44kW; poškozenou vrchní silikonovou vrstvu u 180°C variant lze opravit samovulkanizační ' +
      'silikonovou páskou; 300°C varianty se musí při poškození vyměnit celé (nebo zkrátit, je-li ' +
      'poškození u jednoho z konců). CE (LVD 2014/35/EU, RoHS 2011/65/EU), EN 60204-1:2018.',
    tags: 'cívka,induktor,indukční-ohřev,schaeffler,mf-inductor,ba86,generátor,ohřev-ložisek',
  },
];

const SCHNEIDER_SPECS: CoilSpec[] = [
  {
    name: 'METSECTR30500U',
    packageType:
      'Flexibilní Rogowského cívka (rozevírací, průvlečný primár), vnitřní průměr smyčky ' +
      '95,5 mm, přívodní kabel k cívce 2400 mm + výstupní vodiče (AWM STYLE 20167, 1000 V, ' +
      '24 AWG); bílý vodič = X1, šipka na těle ukazuje směr k zátěži',
    value:
      'Rogowského proudový transducer, Ip 2000 A, výstup 58,3 mV/kA @50Hz (70 mV/kA @60Hz), ' +
      'třída přesnosti 1-A1',
    notes:
      'Schneider Electric "CTRx Series — Rogowski Current Transducers" (instalační manuál ' +
      'S2003/Z207424-0C, rev. 07-2025) — flexibilní rozevírací (split-core, "let-through ' +
      'primary") proudová cívka generující na výstupu střídavé napětí úměrné primárnímu ' +
      '(měřenému) proudu; navržena pro použití s měřicími přístroji Schneider EM35xxA, iEM35x5 ' +
      'a EM42xx. Zesílená izolace mezi měřeným vodičem a výstupními vodiči. Nejmenší (95,5 mm) ' +
      'model řady, jediný s nižším Ip=2000A — ostatní 3 modely řady (METSECTR46500U/60500U/ ' +
      '90500U, viz sourozenecké záznamy) mají Ip=5000A a liší se jen vnitřním průměrem smyčky ' +
      '(větší smyčka = větší měřený vodič/svazek). ' +
      'Max. měřený proud 2 kA. Měřicí rozsah cívky 50–2000 A. Jmenovitý výstup 58,3 mV/kA @50Hz, ' +
      '70 mV/kA @60Hz. Přesnost třída 1-A1 dle IEC 61869-10. Frekvence 50/60 Hz. Max. primární ' +
      'napětí 600 V CAT IV (vstup do objektu). Provozní teplota -35 až +75°C (do 2 kA). ' +
      'Skladovací teplota -40 až +90°C. Vlhkost 0–95 % bez kondenzace. Nadmořská výška do 2000 m. ' +
      'Jen pro vnitřní použití, nevhodné pro vlhké prostředí. Stupeň znečištění 2. Schválení UL/ ' +
      'CSA 61010-1, IEC/EN 61010-1, UL/CSA 2808, EN IEC 63000:2018. CE (RoHS). ' +
      'Instalace: vypnout napájení → ověřit beznapěťový stav vhodným detektorem → připojit ' +
      'výstupní vodiče do měřicího přístroje (bílý=X1) → uvolnit západku a otevřít cívku na ' +
      'kloubu → obepnout měřený vodič (doporučeno umístit doprostřed smyčky) → uzamknout ' +
      'otočením zajišťovacího kroužku ve směru hodinových ručiček → obnovit napájení. ⚠️ ' +
      'Sekundární obvod (výstup) musí být vždy zkratován nebo připojen k zátěži — nikdy nesmí ' +
      'zůstat naprázdno pod proudem v primáru. Nevhodné pro aplikace ochrany života/bezpečnosti ' +
      'osob. Nesmí zabírat víc než 75 % průřezu vedení v zařízení, nesmí blokovat ventilaci ani ' +
      'být v oblasti odvádění oblouku jističe. "Not suitable for Class 2 wiring methods".',
    tags: 'cívka,rogowski,proudový-transformátor,proudový-senzor,schneider-electric,ctrx,metsectr30500u',
  },
  {
    name: 'METSECTR46500U',
    packageType:
      'Flexibilní Rogowského cívka (rozevírací, průvlečný primár), vnitřní průměr smyčky ' +
      '146,4 mm, přívodní kabel k cívce 2400 mm + výstupní vodiče (AWM STYLE 20167, 1000 V, ' +
      '24 AWG)',
    value:
      'Rogowského proudový transducer, Ip 5000 A, výstup 58,3 mV/kA @50Hz (70 mV/kA @60Hz), ' +
      'třída přesnosti 1-A1',
    notes:
      'Součást řady Schneider Electric CTRx (viz poznámka u METSECTR30500U pro plné společné ' +
      'specifikace). Vnitřní průměr smyčky 146,4 mm, Ip=5000A, měřicí rozsah 50–5000 A. ' +
      'Provozní teplota -35 až +60°C (v rozsahu 2–5 kA, jinak jako u ostatních modelů).',
    tags: 'cívka,rogowski,proudový-transformátor,proudový-senzor,schneider-electric,ctrx,metsectr46500u',
  },
  {
    name: 'METSECTR60500U',
    packageType:
      'Flexibilní Rogowského cívka (rozevírací, průvlečný primár), vnitřní průměr smyčky ' +
      '191,0 mm, přívodní kabel k cívce 2400 mm + výstupní vodiče (AWM STYLE 20167, 1000 V, ' +
      '24 AWG)',
    value:
      'Rogowského proudový transducer, Ip 5000 A, výstup 58,3 mV/kA @50Hz (70 mV/kA @60Hz), ' +
      'třída přesnosti 1-A1',
    notes:
      'Součást řady Schneider Electric CTRx (viz poznámka u METSECTR30500U pro plné společné ' +
      'specifikace). Vnitřní průměr smyčky 191,0 mm, Ip=5000A, měřicí rozsah 50–5000 A. ' +
      'Provozní teplota -35 až +60°C (v rozsahu 2–5 kA, jinak jako u ostatních modelů).',
    tags: 'cívka,rogowski,proudový-transformátor,proudový-senzor,schneider-electric,ctrx,metsectr60500u',
  },
  {
    name: 'METSECTR90500U',
    packageType:
      'Flexibilní Rogowského cívka (rozevírací, průvlečný primár), vnitřní průměr smyčky ' +
      '286,5 mm, přívodní kabel k cívce 2400 mm + výstupní vodiče (AWM STYLE 20167, 1000 V, ' +
      '24 AWG)',
    value:
      'Rogowského proudový transducer, Ip 5000 A, výstup 58,3 mV/kA @50Hz (70 mV/kA @60Hz), ' +
      'třída přesnosti 1-A1',
    notes:
      'Součást řady Schneider Electric CTRx (viz poznámka u METSECTR30500U pro plné společné ' +
      'specifikace). Největší (286,5 mm) model řady, pro svazky vodičů většího průřezu. ' +
      'Ip=5000A, měřicí rozsah 50–5000 A. Provozní teplota -35 až +60°C (v rozsahu 2–5 kA).',
    tags: 'cívka,rogowski,proudový-transformátor,proudový-senzor,schneider-electric,ctrx,metsectr90500u',
  },
];

export function buildCoilSeed(): ComponentInput[] {
  return [...COIL_SPECS, ...TORK_SPECS, ...SCHAEFFLER_SPECS, ...SCHNEIDER_SPECS].map((spec) => ({
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

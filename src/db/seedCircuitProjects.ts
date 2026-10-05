import type { CircuitProjectInput } from '../types/circuit';

export const CIRCUIT_LIBRARY_VERSION = 2;

/**
 * Přesný počet kusů u drobných pasivních součástek (rezistory) je odhad podle
 * schématu zdroje, ne ověřená kusovka — před nákupem si ověř podle vlastního
 * zapojení.
 *
 * Projekty níže (vánoční stromeček s 4060 … vozítko s Mecanum Omni koly) jsou
 * zpracované podle časopisu Praktická elektronika A Radio 11/2024. Obrázky
 * schémat jsou oříznuté scany z tohoto časopisu — třetí strana publikace,
 * u některých článků navíc sama přebíraná z jiného zdroje (viz poznámka
 * „Zdroj“ u jednotlivých projektů). Než se tyto obrázky zveřejní uživatelům
 * appky, je potřeba ověřit licenční práva k jejich použití.
 */
export const SEED_CIRCUIT_PROJECTS: CircuitProjectInput[] = [
  {
    name: 'Arduino relé modul s Bluetooth a IR ovládáním',
    description:
      'Arduino Nano ovládá 4 relé přes optočleny PC817, spínané buď přes Bluetooth modul HC-05, nebo IR dálkovým ovladačem (přijímač 1738/TSOP1738). Přepínání mezi BT a IR režimem přes tlačítko.',
    image: null,
    notes:
      'Zdroj: TechStudyCell / easyelectronicsproject.com — přidáno podle referenčního schématu, bez naskenovaného obrázku (ten appka zatím neobsahuje, lze doplnit nahráním souboru).',
    parts: [
      { label: 'Arduino Nano', match: 'Arduino Nano', quantity: 1 },
      { label: 'HC-05 Bluetooth modul', match: 'HC-05', quantity: 1 },
      { label: 'IR přijímač 1738 (TSOP1738)', match: '1738', quantity: 1 },
      { label: 'Optočlen PC817', match: 'PC817', quantity: 4 },
      { label: 'Tranzistor BC547', match: 'BC547', quantity: 1 },
      { label: 'Dioda 1N4007', match: '1N4007', quantity: 4 },
      { label: 'Relé modul SPDT', match: 'relé', quantity: 4 },
      { label: 'Rezistor 220 Ω', match: '220', quantity: 6 },
      { label: 'Rezistor 2 kΩ', match: '2k', quantity: 1 },
      { label: 'Rezistor 4,7 kΩ', match: '4.7k', quantity: 1 },
      { label: 'Rezistor 10 kΩ', match: '10k', quantity: 2 },
      { label: 'LED 5mm', match: 'LED', quantity: 3 },
      { label: 'Elektrolytický kondenzátor 100 µF', match: '100µF', quantity: 1 },
      { label: 'Tlačítko (push button)', match: 'tlačítko', quantity: 1 },
      { label: 'Napájecí konektor DC 5V', match: 'DC konektor', quantity: 1 },
      { label: 'Napájecí konektor DC 5/12V', match: 'DC konektor', quantity: 1 },
    ],
  },
  {
    name: 'Vánoční stromeček s 4060',
    description:
      'Jednoduchý blikač šesti LED (D1–D6) napodobující animaci vánočního stromečku. CMOS čítač/oscilátor 4060 generuje jediným RC článkem (R1, R2, C1) vnitřní kmitočet a z jeho binárních výstupů Q4–Q14 se odebírají postupně dělené, vzájemně odlišné blikací kmitočty pro jednotlivé LED.',
    image: 'vanocni-stromecek-4060.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 11/2024, str. 6, rubrika Jednoduchá zapojení. Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce.',
    parts: [
      { label: 'IO1 — CD4060 (14stupňový binární čítač/oscilátor)', match: '4060', quantity: 1 },
      { label: 'R1 — rezistor 100 kΩ', match: '100k', quantity: 1 },
      { label: 'R2 — rezistor 33 kΩ', match: '33k', quantity: 1 },
      { label: 'R3–R8 — rezistor 1 kΩ', match: '1k', quantity: 6 },
      { label: 'C1 — kondenzátor 100 nF', match: '100n', quantity: 1 },
      { label: 'C2 — elektrolytický kondenzátor 100 µF/16 V', match: '100µF', quantity: 1 },
      { label: 'D1–D6 — LED 5 mm', match: 'LED', quantity: 6 },
      { label: 'Konektor napájení 9 V (J1, J2)', match: 'konektor', quantity: 1 },
    ],
  },
  {
    name: 'Elektronická ultrazvuková píšťalka',
    description:
      'Generátor ultrazvukového signálu 21 kHz pro odpuzování zvířat. Oscilátor je tvořen invertory hradla CD40106 (IO1A/B/C s hysterezí), zbylé tři invertory (IO1D/E/F) spolu se dvěma dvojicemi doplňkových tranzistorů (BD135/BD136) tvoří můstkový výkonový zesilovač buzící piezoměnič SP1.',
    image: 'ultrazvukova-pistalka.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 11/2024, str. 8, rubrika Jednoduchá zapojení, převzato z Rádiótechnika (HU) 02/2018. Piezoreproduktor SP1 musí být speciální vysokotónový typ schopný vyzařovat ultrazvuk (běžné piezoměniče nevhodné). Schéma je oříznuté ze scanu časopisu, navíc samo převzaté z maďarského časopisu — ověřit práva k publikaci obrázku v appce.',
    parts: [
      { label: 'IO1 — CD40106 (hex Schmittův invertor)', match: '40106', quantity: 1 },
      { label: 'T1, T2 — tranzistor BD135 (NPN)', match: 'BD135', quantity: 2 },
      { label: 'T3, T4 — tranzistor BD136 (PNP)', match: 'BD136', quantity: 2 },
      { label: 'SP1 — piezoreproduktor (vysokotónový, ultrazvukový)', match: 'piezo', quantity: 1 },
      { label: 'R1 — rezistor 39 kΩ', match: '39k', quantity: 1 },
      { label: 'C1 — kondenzátor 1 nF', match: '1n', quantity: 1 },
      { label: 'C2 — elektrolytický kondenzátor 220 µF/16 V', match: '220µF', quantity: 1 },
      { label: 'C3 — kondenzátor 100 nF', match: '100n', quantity: 1 },
      { label: 'S1 — tlačítko (zapnutí hvizdu)', match: 'tlačítko', quantity: 1 },
      { label: 'B1 — baterie 9 V (6F22)', match: '9V baterie', quantity: 1 },
    ],
  },
  {
    name: 'Univerzální reproskříň',
    description:
      'Testovací reproskříň pro NF zesilovače do 10 W s přepínatelnou vstupní impedancí (4, 8, 16, 16–116, 1k, ∞ Ω) přes dva synchronní přepínače S1A/S1B. Dva reproduktory SP1/SP2 jsou chráněny rychlými tavnými pojistkami F1/F2, signál je dostupný i na výstupním konektoru K5 (BNC) pro osciloskop nebo milivoltmetr.',
    image: 'univerzalni-reproskrin.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 11/2024, str. 8, rubrika Jednoduchá zapojení. Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce.',
    parts: [
      { label: 'SP1, SP2 — reproduktor 8 Ω', match: 'reproduktor', quantity: 2 },
      { label: 'S1 (S1A/S1B) — přepínač impedance, 6 poloh', match: 'přepínač', quantity: 1 },
      { label: 'P1 — potenciometr 100 Ω/5 W', match: '100', quantity: 1 },
      { label: 'R1 — rezistor 1 kΩ/1 W', match: '1k', quantity: 1 },
      { label: 'F1, F2 — pojistka rychlá F630 mA', match: 'pojistka', quantity: 2 },
      { label: 'K3 — konektor CINCH', match: 'CINCH', quantity: 1 },
      { label: 'K4 — konektor reproduktorová zásuvka DIN', match: 'DIN', quantity: 1 },
      { label: 'K5 — konektor BNC (výstup pro osciloskop)', match: 'BNC', quantity: 1 },
    ],
  },
  {
    name: 'Krátkovlnná aktivní anténa s preselekcí',
    description:
      'Aktivní KV anténa s osmipolohovým přepínačem S1 volícím jeden ze sedmi pásmových LC obvodů (L1–L7/R1–R7, 0,05 MHz až 35 MHz) a širokopásmovou polohu bez preselekce. Zvolený signál jde na emitorový sledovač s tranzistorem JFET J310 (T1).',
    image: 'kv-aktivni-antena-preselekce.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 11/2024, str. 9, rubrika Jednoduchá zapojení, převzato z Rádiótechnika (HU) 12/2017. Schéma je oříznuté ze scanu časopisu, navíc samo převzaté z maďarského časopisu — ověřit práva k publikaci obrázku v appce.',
    parts: [
      { label: 'ANT1 — teleskopická anténa', match: 'anténa', quantity: 1 },
      { label: 'T1 — tranzistor J310 (JFET, N-kanál)', match: 'J310', quantity: 1 },
      { label: 'C1 — kondenzátor 390 pF', match: '390p', quantity: 1 },
      { label: 'S1 — přepínač kmitočtového rozsahu, 8 poloh', match: 'přepínač', quantity: 1 },
      { label: 'L1 220 µH / L2 100 µH / L3 47 µH / L4 22 µH', match: 'cívka', quantity: 4 },
      { label: 'L5 10 µH / L6 4,7 µH / L7 2,2 µH', match: 'cívka', quantity: 3 },
      { label: 'R1 33 k / R2 22 k / R3 15 k / R4 10 kΩ', match: 'rezistor', quantity: 4 },
      { label: 'R5 6k8 / R6 4k7 / R7 3k3', match: 'rezistor', quantity: 3 },
      { label: 'R8 — rezistor 1 MΩ, R9 120 Ω, R10 180 Ω, R11 27 kΩ', match: 'rezistor', quantity: 4 },
      { label: 'D1 — LED (indikace napájení)', match: 'LED', quantity: 1 },
      { label: 'C9 — elektrolytický kondenzátor 47 µF/25 V', match: '47µF', quantity: 1 },
      { label: 'S2 — vypínač napájení', match: 'vypínač', quantity: 1 },
      { label: 'B1 — baterie 9 V', match: '9V baterie', quantity: 1 },
    ],
  },
  {
    name: 'Dvojčinný spínač',
    description:
      'Malý tranzistorový spínač s hranovou reakcí na vstupní signál (RC derivační článek R1/C1 + R3) — tranzistor T1 ovládá výstupní tranzistor T2 tak, že výstup se krátce sepne při každé náběžné i sestupné hraně vstupního signálu.',
    image: 'dvojcinny-spinac.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 11/2024, str. 10, rubrika Jednoduchá zapojení, převzato z Radioelektronik (PL) 5/2007. Schéma je oříznuté ze scanu časopisu, navíc samo převzaté z polského časopisu — ověřit práva k publikaci obrázku v appce.',
    parts: [
      { label: 'T1, T2 — tranzistor 2N2222 (NPN)', match: '2N2222', quantity: 2 },
      { label: 'D1 — dioda 1N4148', match: '1N4148', quantity: 1 },
      { label: 'R1 — rezistor 2k2', match: '2k2', quantity: 1 },
      { label: 'R2 — rezistor 300 Ω', match: '300', quantity: 1 },
      { label: 'R3 — rezistor 560 Ω', match: '560', quantity: 1 },
      { label: 'R4 — rezistor 1 kΩ', match: '1k', quantity: 1 },
      { label: 'C1 — kondenzátor 2n2', match: '2n2', quantity: 1 },
    ],
  },
  {
    name: 'Malý aktuátor z RC serva',
    description:
      'Autonomní jednotka pro uvolnění drahé videokamery připevněné k padáku (např. u akrobacie s dronem/paraglidingem). Mikrokontrolér AT89C2051 po aktivaci (vytažení pojistné struny spínače S4) vyčká naprogramovaný čas a spustí analogové servo SG90, které uvolní západku. Parametry se nastavují a ukládají do paměti EEPROM 24C32, stav zobrazuje sedmisegmentový displej buzený budičem HD-A304RDA.',
    image: 'maly-aktuator-rc-serva.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 11/2024, str. 14–15, rubrika Konstrukce (Ing. Jaroslav Romler). Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce.',
    parts: [
      { label: 'I1 — mikroprocesor AT89C2051-24PU', match: 'AT89C2051', quantity: 1 },
      { label: 'I2 — paměť EEPROM 24C32', match: '24C32', quantity: 1 },
      { label: 'I3 — stabilizátor 78L05', match: '78L05', quantity: 1 },
      { label: 'D1 — budič sedmisegmentového displeje HD-A304RDA', match: 'HD-A304RDA', quantity: 1 },
      { label: 'Q1 — krystal 10 MHz', match: '10MHz', quantity: 1 },
      { label: 'C1, C2 — kondenzátor 22 pF', match: '22p', quantity: 2 },
      { label: 'C3, C4 — kondenzátor 1 nF', match: '1n', quantity: 2 },
      { label: 'V1 — dioda 1N4007', match: '1N4007', quantity: 1 },
      { label: 'S1–S4 — mikrospínač MSW-22', match: 'mikrospínač', quantity: 4 },
      { label: 'R1, R2 — rezistor 240 Ω', match: '240', quantity: 2 },
      { label: 'Servo — analogové mikroservo SG90', match: 'SG90', quantity: 1 },
    ],
  },
  {
    name: 'PWM regulátor',
    description:
      'Transistorový PWM regulátor otáček stejnosměrného motoru (5 až 48 V, do 1,5 A) bez použití integrovaného obvodu — astabilní multivibrátor (T1, T2) nastavitelný trimrem P1 spíná výkonový N-MOSFET IRF630 (T3) v propustném režimu.',
    image: 'pwm-regulator.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 11/2024, str. 16–17, rubrika Konstrukce (Ing. Vladimír Krátký). Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce.',
    parts: [
      { label: 'T1, T2 — tranzistor BC546 (NPN)', match: 'BC546', quantity: 2 },
      { label: 'T3 — N-MOSFET IRF630 (alt. IRFZ48)', match: 'IRF630', quantity: 1 },
      { label: 'D1, D2 — dioda 1N4007', match: '1N4007', quantity: 2 },
      { label: 'ZD1 — Zenerova dioda 7 V', match: 'Zenerova dioda', quantity: 1 },
      { label: 'ZD2, ZD3 — Zenerova dioda 4,7–5 V', match: 'Zenerova dioda', quantity: 2 },
      { label: 'R1, R2 — rezistor 5,6 kΩ', match: '5.6k', quantity: 2 },
      { label: 'R3, R4 — rezistor 10 kΩ', match: '10k', quantity: 2 },
      { label: 'R5 — rezistor 47 kΩ', match: '47k', quantity: 1 },
      { label: 'P1 — potenciometr 100 kΩ lineární', match: '100k', quantity: 1 },
      { label: 'C1, C2 — kondenzátor 33 nF/100 V', match: '33n', quantity: 2 },
      { label: 'C3 — elektrolytický kondenzátor 22 µF/100 V', match: '22µF', quantity: 1 },
    ],
  },
  {
    name: 'Shield POLOLU pro Arduino UNO',
    description:
      'Shield se dvěma moduly POLOLU A4998 pro řízení dvou bipolárních krokových motorů (do 2 A, napájení 8–35 V) z Arduina UNO, s mikrokrokováním (1, 1/2, 1/4, 1/8, 1/16) nastavitelným propojkami MS1–MS3. Shield je kompatibilní s PICAXE.',
    image: 'shield-pololu-arduino-uno.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 11/2024, str. 31–32, rubrika Konstrukce (Ing. Vladimír Krátký). Draft zapojení DS18B20 (PR #9) již obsahuje samostatnou kartu modulu POLOLU A4988 jako součástky — zde jde o kompletní shield se dvěma moduly. Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce.',
    parts: [
      { label: 'IO1, IO2 — modul POLOLU A4988 (krokový driver)', match: 'A4988', quantity: 2 },
      { label: 'R1 — rezistor 560 Ω', match: '560', quantity: 1 },
      { label: 'R2, R3 — rezistor 10 kΩ', match: '10k', quantity: 2 },
      { label: 'R4, R5 — rezistor 1 kΩ', match: '1k', quantity: 2 },
      { label: 'C1 — elektrolytický kondenzátor 100 µF', match: '100µF', quantity: 1 },
      { label: 'C2 — kondenzátor 100 nF', match: '100n', quantity: 1 },
      { label: 'C3 — elektrolytický kondenzátor 47 µF/16 V', match: '47µF', quantity: 1 },
      { label: 'LED1 — LED zelená', match: 'LED', quantity: 1 },
      { label: 'TL1, TL2 — tlačítko do plošného spoje', match: 'tlačítko', quantity: 2 },
    ],
  },
  {
    name: 'Vozítko s Mecanum Omni koly',
    description:
      'Čtyřkolové vozítko s Mecanum Omni koly (80 mm) umožňujícími pohyb do všech směrů i otáčení na místě. Arduino UNO řídí přes posuvný registr 74HC595 a dva motorové driver shieldy L293D čtyři DC motory; ovládání probíhá bezdrátově z tabletu/telefonu přes Bluetooth modul JDY-33TTL (sériový terminál).',
    image: 'vozitko-mecanum-omni-kola.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 11/2024, str. 33–38, rubrika Konstrukce (Vlastimil Vágner), přihlášeno do Konkurzu 2024. Obrázek je nákres osazení driver shieldu (obr. 5), ne klasické elektrické schéma — časopis u tohoto projektu kompletní schéma zapojení neuvádí. Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce.',
    parts: [
      { label: 'Arduino UNO', match: 'Arduino Uno', quantity: 1 },
      { label: 'IO1, IO3 — budič motoru L293D', match: 'L293D', quantity: 2 },
      { label: 'IO2 — posuvný registr 74HC595', match: '74HC595', quantity: 1 },
      { label: 'Bluetooth modul JDY-33TTL', match: 'JDY-33', quantity: 1 },
      { label: 'DC motor s převodovkou + Mecanum Omni kolo 80 mm', match: 'motor', quantity: 4 },
      { label: 'Li-Ion článek (2× do série, 8,4 V/3000 mAh)', match: 'Li-Ion', quantity: 2 },
    ],
  },
];

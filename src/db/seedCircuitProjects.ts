import type { CircuitProjectInput } from '../types/circuit';

export const CIRCUIT_LIBRARY_VERSION = 7;

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
      { label: 'Rezistor 4,7 kΩ', match: '4.7 kΩ', quantity: 1 },
      { label: 'Rezistor 10 kΩ', match: '10k', quantity: 2 },
      { label: 'LED 5mm', match: 'LED', quantity: 3 },
      { label: 'Elektrolytický kondenzátor 100 µF', match: '100 µF', quantity: 1 },
      { label: 'Tlačítko (push button)', match: 'tlačítko', quantity: 1 },
      { label: 'Napájecí konektor DC 5V', match: 'Napájecí konektor DC', quantity: 1 },
      { label: 'Napájecí konektor DC 5/12V', match: 'Napájecí konektor DC', quantity: 1 },
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
      { label: 'R1 — rezistor 100 kΩ', match: '100 kΩ', quantity: 1 },
      { label: 'R2 — rezistor 33 kΩ', match: '33 kΩ', quantity: 1 },
      { label: 'R3–R8 — rezistor 1 kΩ', match: '1k', quantity: 6 },
      { label: 'C1 — kondenzátor 100 nF', match: '100 nF', quantity: 1 },
      { label: 'C2 — elektrolytický kondenzátor 100 µF/16 V', match: '100 µF', quantity: 1 },
      { label: 'D1–D6 — LED 5 mm', match: 'LED', quantity: 6 },
      { label: 'Konektor napájení 9 V (J1, J2)', match: 'konektor', quantity: 1 },
    ],
  },
  {
    name: 'Elektronická ultrazvuková vrbovka',
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
      { label: 'R1 — rezistor 39 kΩ', match: '39 kΩ', quantity: 1 },
      { label: 'C1 — kondenzátor 1 nF', match: '1n', quantity: 1 },
      { label: 'C2 — elektrolytický kondenzátor 220 µF/16 V', match: '220 µF', quantity: 1 },
      { label: 'C3 — kondenzátor 100 nF', match: '100 nF', quantity: 1 },
      { label: 'S1 — tlačítko (zapnutí hvizdu)', match: 'tlačítko', quantity: 1 },
      { label: 'B1 — baterie 9 V (6F22)', match: 'Baterie 9V', quantity: 1 },
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
      { label: 'C1 — kondenzátor 390 pF', match: '390 pF', quantity: 1 },
      { label: 'S1 — přepínač kmitočtového rozsahu, 8 poloh', match: 'přepínač', quantity: 1 },
      { label: 'L1 220 µH / L2 100 µH / L3 47 µH / L4 22 µH', match: 'cívka', quantity: 4 },
      { label: 'L5 10 µH / L6 4,7 µH / L7 2,2 µH', match: 'cívka', quantity: 3 },
      { label: 'R1 33 k / R2 22 k / R3 15 k / R4 10 kΩ', match: 'rezistor', quantity: 4 },
      { label: 'R5 6k8 / R6 4k7 / R7 3k3', match: 'rezistor', quantity: 3 },
      { label: 'R8 — rezistor 1 MΩ, R9 120 Ω, R10 180 Ω, R11 27 kΩ', match: 'rezistor', quantity: 4 },
      { label: 'D1 — LED (indikace napájení)', match: 'LED', quantity: 1 },
      { label: 'C9 — elektrolytický kondenzátor 47 µF/25 V', match: '47 µF', quantity: 1 },
      { label: 'S2 — vypínač napájení', match: 'páčkový přepínač', quantity: 1 },
      { label: 'B1 — baterie 9 V', match: 'Baterie 9V', quantity: 1 },
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
      { label: 'R1 — rezistor 2k2', match: '2.2 kΩ', quantity: 1 },
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
      { label: 'Q1 — krystal 10 MHz', match: 'Krystal 10 MHz', quantity: 1 },
      { label: 'C1, C2 — kondenzátor 22 pF', match: '22 pF', quantity: 2 },
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
      { label: 'R1, R2 — rezistor 5,6 kΩ', match: '5.6 kΩ', quantity: 2 },
      { label: 'R3, R4 — rezistor 10 kΩ', match: '10k', quantity: 2 },
      { label: 'R5 — rezistor 47 kΩ', match: '47 kΩ', quantity: 1 },
      { label: 'P1 — potenciometr 100 kΩ lineární', match: '100 kΩ', quantity: 1 },
      { label: 'C1, C2 — kondenzátor 33 nF/100 V', match: '33 nF', quantity: 2 },
      { label: 'C3 — elektrolytický kondenzátor 22 µF/100 V', match: '22 µF', quantity: 1 },
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
      { label: 'C1 — elektrolytický kondenzátor 100 µF', match: '100 µF', quantity: 1 },
      { label: 'C2 — kondenzátor 100 nF', match: '100 nF', quantity: 1 },
      { label: 'C3 — elektrolytický kondenzátor 47 µF/16 V', match: '47 µF', quantity: 1 },
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

  /**
   * Projekty níže (výstražná světla na přejezdu … stavba bodovací svářečky) jsou
   * zpracované podle časopisu Praktická elektronika A Radio 07/2023. Obrázky schémat
   * jsou oříznuté scany z tohoto časopisu — stejně jako u čísla 11/2024 je potřeba
   * před zveřejněním uživatelům appky ověřit licenční práva k jejich použití.
   */
  {
    name: 'Výstražná světla na přejezdu',
    description:
      'Blikač dvou červených a dvou bílých LED pro označení železničního přejezdu u modelové kolejiště. CMOS oscilátor/čítač 4060 generuje taktovací signál, hradla 4011 podle polohy spínače S1 (poloha LEDW/LEDR) přepínají, zda blikají bílé nebo červené LED, s periodou cca 1 s.',
    image: 'vystrazna-svetla-prejezdu.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 07/2023, str. 9–10, rubrika Jednoduchá zapojení pro volný čas. Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce.',
    parts: [
      { label: 'IO1 — CD4060 (14stupňový binární čítač/oscilátor)', match: '4060', quantity: 1 },
      { label: 'IO2 — CD4011 (čtveřice 2vstup. NAND)', match: '4011', quantity: 1 },
      { label: 'T1 — tranzistor BC546B', match: 'BC546', quantity: 1 },
      { label: 'R1 — rezistor 82 kΩ', match: '82 kΩ', quantity: 1 },
      { label: 'R2 — rezistor 3,3 kΩ', match: '3.3 kΩ', quantity: 1 },
      { label: 'R3, R5 — rezistor 100 kΩ', match: '100 kΩ', quantity: 2 },
      { label: 'R4, R9 — rezistor 10 kΩ', match: '10k', quantity: 2 },
      { label: 'R6, R7 — rezistor 3,9 kΩ', match: '3.9 kΩ', quantity: 2 },
      { label: 'R8 — rezistor 2,2 kΩ', match: '2.2 kΩ', quantity: 1 },
      { label: 'P1 — trimr 10 kΩ', match: 'Trimr 10 kΩ', quantity: 1 },
      { label: 'C1 — kondenzátor 68 nF', match: '68 nF', quantity: 1 },
      { label: 'C2, C4 — kondenzátor 100 nF', match: '100 nF', quantity: 2 },
      { label: 'C3 — elektrolytický kondenzátor 100 µF/16 V', match: '100 µF', quantity: 1 },
      { label: 'D1–D4 — LED červená supersvítivá', match: 'LED 5mm červená', quantity: 4 },
      { label: 'D5, D6 — LED bílá', match: 'LED 5mm bílá', quantity: 2 },
      { label: 'S1 — spínač (2 polohy)', match: 'spínač', quantity: 1 },
    ],
  },
  {
    name: 'Stereofonní zesilovač se ziskem -20 až +20 dB',
    description:
      'Stereofonní zesilovač NF signálu s plynule nastavitelným ziskem od -20 do +20 dB jedním potenciometrem (dvojitým, pro oba kanály). V každém kanálu je oddělovací stupeň s nulovým výstupním odporem (OZ TS924IN zapojený se zesílením 1) a za ním invertující stupeň s regulovatelným ziskem.',
    image: 'stereo-zesilovac-20db.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 07/2023, str. 11, rubrika Jednoduchá zapojení (převzato z Elektor (D) 11/2002). Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce. Uveden jen levý kanál (IO1C, IO1A) — pravý kanál (IO1B, IO1D) je zapojen shodně, se společným potenciometrem P1B na stejné hřídeli s P1A.',
    parts: [
      { label: 'IO1 — TS924IN (učveřice OZ, levý + pravý kanál)', match: 'TS924', quantity: 1 },
      { label: 'P1 — dvojitý potenciometr 50 kΩ/LIN (zisk)', match: '50k', quantity: 1 },
      { label: 'R1 — rezistor 270 kΩ', match: '270 kΩ', quantity: 1 },
      { label: 'R2, R6 — rezistor 1 kΩ', match: '1k', quantity: 2 },
      { label: 'R3 — rezistor 56 kΩ', match: '56k', quantity: 1 },
      { label: 'R4, R5 — rezistor 4,7 kΩ', match: '4.7 kΩ', quantity: 2 },
      { label: 'R7 — rezistor 1 MΩ', match: '1M', quantity: 1 },
      { label: 'R8 — rezistor 100 Ω', match: '100R', quantity: 1 },
      { label: 'R9 — rezistor 100 kΩ', match: '100 kΩ', quantity: 1 },
      { label: 'R27, R28 — rezistor 47 kΩ', match: '47 kΩ', quantity: 2 },
      { label: 'C1, C3 — elektrolytický kondenzátor 4,7 µF/63 V', match: '4.7 µF', quantity: 2 },
      { label: 'C2 — kondenzátor 47 pF', match: '47 pF', quantity: 1 },
      { label: 'C9 — kondenzátor 100 nF', match: '100 nF', quantity: 1 },
      { label: 'C11 — elektrolytický kondenzátor 100 µF/10 V', match: '100 µF', quantity: 1 },
      { label: 'C12 — elektrolytický kondenzátor 220 µF/25 V', match: '220 µF', quantity: 1 },
      { label: 'D1, D2 — dioda 1N4148', match: '1N4148', quantity: 2 },
    ],
  },
  {
    name: 'Stereofonní indikátor přebuzení',
    description:
      'Doplněk k NF zesilovači s nastavitelným ziskem — stereofonní indikátor přebuzení s dvěma okénkovými komparátory (LM339), které rozsvítí červenou LED, když efektivní hodnota NF signálu na vstupu překročí nastavenou úroveň (šířku okénka nastavuje trimr P1).',
    image: 'stereo-indikator-prebuzeni.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 07/2023, str. 12, rubrika Jednoduchá zapojení (převzato z Elektor (D) 11/2002). Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce. Uveden jen levý kanál — pravý kanál (IO1D, IO1C) je zapojen shodně.',
    parts: [
      { label: 'IO1 — LM339 (čtveřice komparátorů, levý + pravý kanál)', match: 'LM339', quantity: 1 },
      { label: 'ZD1 — Zenerova dioda 5,6 V/0,5 W', match: 'BZX55C5V6', quantity: 1 },
      { label: 'P1 — trimr 100 kΩ (šířka okénka)', match: 'Trimr 100 kΩ', quantity: 1 },
      { label: 'R1–R4, R7, R8 — rezistor 47 kΩ', match: '47 kΩ', quantity: 6 },
      { label: 'R5, R6 — rezistor 1,8 kΩ', match: '1.8 kΩ', quantity: 2 },
      { label: 'R9 — rezistor 10 kΩ', match: '10k', quantity: 1 },
      { label: 'R10, R13 — rezistor 6,8 kΩ', match: '6.8 kΩ', quantity: 2 },
      { label: 'R12, R15 — rezistor 100 Ω', match: '100R', quantity: 2 },
      { label: 'C1, C2 — elektrolytický kondenzátor 10 µF/50 V', match: '10 µF', quantity: 2 },
      { label: 'C3 — elektrolytický kondenzátor 100 µF/16 V', match: '100 µF', quantity: 1 },
      { label: 'C4, C6 — elektrolytický kondenzátor 47 µF/25 V', match: '47 µF', quantity: 2 },
      { label: 'C5, C7 — elektrolytický kondenzátor 220 µF/25 V', match: '220 µF', quantity: 2 },
      { label: 'C8 — kondenzátor 100 nF', match: '100 nF', quantity: 1 },
      { label: 'C9 — elektrolytický kondenzátor 220 µF/25 V', match: '220 µF', quantity: 1 },
      { label: 'D1, D2 — LED červená supersvítivá', match: 'LED 5mm červená', quantity: 2 },
    ],
  },
  {
    name: 'Detektor průchodu síťového napětí nulou',
    description:
      'Detektor pro řídicí systémy, poskytující informaci o průchodu síťového napětí (230 V/50 Hz) nulou — galvanicky oddělenou krátkodobým sepnutím výstupního optočlenu PC817. Síťové napětí je usměrněno můstkem D1–D4, kladné půlvlny spínají tranzistor T1, derivační článek T2–T4/C1 generuje úzký impuls kolem průchodu nulou.',
    image: 'detektor-prechodu-nulou.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 07/2023, str. 13, rubrika Jednoduchá zapojení (převzato z Rádiótechnika (HU) 2/2009). Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce. POZOR: zapojení je přímo na síťovém napětí 230 V — nebezpečí úrazu elektrickým proudem.',
    parts: [
      { label: 'D1–D4 — dioda 1N4148 (usměrňovací můstek)', match: '1N4148', quantity: 4 },
      { label: 'D5 — dioda 1N4148', match: '1N4148', quantity: 1 },
      { label: 'D6 — dioda 1N4148', match: '1N4148', quantity: 1 },
      { label: 'ZD1 — Zenerova dioda BZX85V012 (12 V)', match: 'BZX85', quantity: 1 },
      { label: 'T1, T2 — tranzistor BC546B', match: 'BC546', quantity: 2 },
      { label: 'T3, T4 — tranzistor BC546B', match: 'BC546', quantity: 2 },
      { label: 'OC1 — optočlen PC817', match: 'PC817', quantity: 1 },
      { label: 'R1 — rezistor 100 kΩ/2 W', match: '100 kΩ', quantity: 1 },
      { label: 'R2, R4, R5 — rezistor 100 kΩ', match: '100 kΩ', quantity: 3 },
      { label: 'R3 — rezistor 10 kΩ', match: '10k', quantity: 1 },
      { label: 'R6 — rezistor 470 Ω', match: '470', quantity: 1 },
      { label: 'C1 — kondenzátor 270 pF', match: '270 pF', quantity: 1 },
      { label: 'C2 — elektrolytický kondenzátor 22 µF/25 V', match: '22 µF', quantity: 1 },
      { label: 'JP1 — kolíková lišta pro volbu hrany impulzu', match: 'kolíková lišta', quantity: 1 },
    ],
  },
  {
    name: 'Omezovač proudu',
    description:
      'Jednoduchý laboratorní omezovač proudu (proudový zdroj/ochrana) s rozsahem nastavitelného proudu cca 0,2 až 600 mA (rozsah 1) nebo 4 mA až 6 A limitovaných výkonovým přetížením (rozsah 2). Zdroj proudu LM334Z řízený potenciometrem RV2 je zesilován proudovým zesilovacím činitelem tranzistorů Q1 a Q2.',
    image: 'omezovac-proudu.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 07/2023, str. 15, rubrika Jednoduchá zapojení (Ivan Stupka). Obrázek je vlastní překreslení (ne sken časopisu) — topologie ověřena uživatelem přímo proti originálu: kolektor Q1 je napevno na výstupu J1, SW1 (KNX-1-D1, 250V/3A) odpojuje jen Q2 (přepnutí rozsahu 1↔2), Q2 emitor → báze Q1 (Darlington). Minimální úbytek napětí asi 2,3 V, maximální přípustné napětí 24 V.',
    parts: [
      { label: 'U1 — LM334Z (nastavitelný proudový zdroj)', match: 'LM334', quantity: 1 },
      { label: 'Q1 — tranzistor KD601', match: 'KD601', quantity: 1 },
      { label: 'Q2 — tranzistor KU612 (rozsah 2, odpojitelný SW1)', match: 'KU612', quantity: 1 },
      { label: 'R1 — rezistor 10 Ω', match: '10 Ω', quantity: 1 },
      { label: 'RV2 — potenciometr 100 kΩ/G (logaritmický)', match: '100 kΩ', quantity: 1 },
      { label: 'SW1 — spínač KNX-1-D1, 250V/3A (odpojení Q2, přepnutí rozsahu)', match: 'spínač', quantity: 1 },
    ],
  },
  {
    name: 'Ovládání dvířek kurníku pro domácí zvířata',
    description:
      'Arduino (Mega 2560) automaticky ovládá motor s převodovkou, který přes lanko zvedá a spouští dvířka kurníku — za tmy dvířka zavře, za světla otevře. Snímání provádí fotorezistor GL5539, polohu dvířek hlídají dva mikrospínače (horní/dolní poloha); motor spíná dvoukanálový relé modul.',
    image: 'ovladani-dvirek-kurniku.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 07/2023, str. 16–18, rubrika Arduino (Jaroslav Romler). Obrázek je zapojení ovladače dvířek (obr. 4/5) — ne klasické elektrické schéma. Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce.',
    parts: [
      { label: 'Arduino Mega 2560', match: 'Arduino Mega', quantity: 1 },
      { label: 'Deska relé 2kanálová 5 V', match: 'relé modul', quantity: 1 },
      { label: 'Motor s převodovkou a rolnou', match: 'DC motor s převodovkou', quantity: 1 },
      { label: 'Fotorezistor GL5539', match: 'GL5539', quantity: 1 },
      { label: 'Mikrospínač (senzor polohy dvířek)', match: 'mikrospínač', quantity: 2 },
      { label: 'Potenciometr/trimr 10 kΩ (test denního světla)', match: '10k', quantity: 1 },
      { label: 'Rezistor 100 kΩ (dělič pro fotorezistor)', match: '100 kΩ', quantity: 1 },
      { label: 'Napájecí adaptér 5 V', match: 'napájecí adaptér', quantity: 1 },
      { label: 'Svorkovnice přístrojová 12pólová lámací', match: 'svorkovnice', quantity: 1 },
    ],
  },
  {
    name: 'Automatická dvířka kurníku (ESP32, bakalářská práce)',
    description:
      'Samostatný návrh elektronicky i softwarově podstatně sofistikovanějších automatických dvířek kurníku oproti jednoduchému zapojení výše — procesorový modul ESP32-S3-WROOM-1U (Wi-Fi/Bluetooth LE, konektivita MQTT/Home Assistant) řídí stejnosměrný motor s převodovkou přes integrovaný H-můstkový budič (PWM regulace rychlosti i směru), polohu dvířek snímá dvoukanálový optický enkodér (dvojice závor TCST1103) doplněný softwarovým dvojitým regulátorem (P pro polohu, PI pro rychlost) a proudovým snímáním zátěže motoru (detekce překážky/dorazu). Deska dále obsahuje fotorezistor pro úroveň denního světla, NTC teplotní čidlo, dvoubarevnou LED, tlačítko a rozhraní RS485/ModBus RTU i dva rezervní vstupy na konektoru RJ45.',
    image: 'ovladani-dvirek-kurniku-esp32.jpg',
    notes:
      'Zdroj: Pavel Kejík, "Automatický systém pro domácí chov slepic" (bakalářská práce, FIT VUT v Brně, vedoucí Ing. Vojtěch Mrázek, Ph.D., Brno 2024), kapitola 6 (Periferie dvířka) a příloha A (schéma desky). ⚠️ Jde o zcela odlišný návrh od zapojení „Ovládání dvířek kurníku pro domácí zvířata" z PE 07/2023 (Arduino Mega 2560 + mikrospínače + relé modul, bez konektivity) — přidáno jako samostatný projekt, ne jako náhrada. Obrázek je blokové schéma desky elektroniky dvířek (obr. 6.4 práce), podrobné schéma zapojení (plný seznam součástek vč. referenčních označení) je v příloze A práce. Práce je veřejně dostupná kvalifikační práce VUT, nejde o časopisecký scan — otázka práv k publikaci obrázku v appce je tedy odlišná od PE scanů, ale přesto je vhodné ji ověřit před zveřejněním.',
    parts: [
      { label: 'IC1 — ESP32-S3-WROOM-1U (modul MCU, Wi-Fi/BLE)', match: 'ESP32-S3', quantity: 1 },
      { label: 'IC2 — L6201PS (H-můstkový budič DC motoru)', match: 'L6201', quantity: 1 },
      { label: 'Motor DFRobot DC 12 V 40 ot./min se šnekovou převodovkou 1:150', match: 'DC motor s převodovkou', quantity: 1 },
      { label: 'Optická závora TCST1103 (kanály enkodéru polohy)', match: 'TCST1103', quantity: 2 },
      { label: 'Relé (odpojení napájení motoru při poruše)', match: 'relé modul', quantity: 1 },
      { label: 'Fotorezistor (úroveň denního světla)', match: 'fotorezistor', quantity: 1 },
      { label: 'NTC termistor (snímání teploty)', match: 'NTC', quantity: 1 },
      { label: 'Dvoubarevná LED (indikace stavu)', match: 'LED dvoubarevná', quantity: 1 },
      { label: 'Tranzistor BC846 (ovládání TCST1103/výstup)', match: 'BC846', quantity: 1 },
      { label: 'Dioda 1N4148WT (nejmenší SMD pouzdro rodiny 1N4148)', match: '4148', quantity: 1 },
      { label: 'Konektor RJ45 (rozšiřující I/O, RS485)', match: 'RJ45', quantity: 1 },
      { label: 'Napájecí zdroj 12 V DC (konektor JACK 2,5 mm)', match: 'napájecí adaptér', quantity: 1 },
    ],
  },
  {
    name: 'Univerzální deska rozhraní pro sběrnici MODBUS RTU',
    description:
      'Univerzální měřicí/řídicí modul s komunikací po průmyslové sběrnici RS485 protokolem MODBUS RTU — 4 analogové vstupy, 2 digitální vstupy (galvanicky oddělené optočleny) a 2 relé výstupy (24 V/10 A). Srdcem je mikrokontrolér ATmega8A, komunikaci po RS485 zajišťuje budič ST485; více modulů lze řadit za sebou na jednom kabelu Ethernet CAT5 (napájení 20–26 V i sběrnice společně).',
    image: 'modbus-rtu-deska.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 07/2023, str. 19–21, rubrika Mikrokontroléry (Jan Chlístovský, OK1BAF). Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce. Program (zdrojový kód i HEX) je staženém na webu časopisu, kompilace vyžaduje placenou licenci E-Lab Pascal.',
    parts: [
      { label: 'IC1 — ATmega8A (mikrokontrolér)', match: 'ATmega8', quantity: 1 },
      { label: 'IC2 — 78L05SMD (stabilizátor 5 V)', match: '78L05', quantity: 1 },
      { label: 'IC3 — ST485 (budič RS485)', match: 'ST485', quantity: 1 },
      { label: 'OK1, OK2 — optočlen PC817', match: 'PC817', quantity: 2 },
      { label: 'Q1 — krystal 8 MHz', match: '8MHz', quantity: 1 },
      { label: 'Q2, Q3 — tranzistor 2N7002 (MOSFET)', match: '2N7002', quantity: 2 },
      { label: 'K1, K2 — relé K2G5LE 24 V (8 A/10 A)', match: 'G5LE-1', quantity: 2 },
      { label: 'D1, D2 — dioda BAT54A/BAT54S', match: 'BAT54', quantity: 2 },
      { label: 'D3, D4 — Zenerova dioda 5,6 V', match: 'BZX55C5V6', quantity: 2 },
      { label: 'D5 — Zenerova dioda 5,6 V', match: 'BZX55C5V6', quantity: 1 },
      { label: 'D6 — Zenerova dioda 27 V (ochrana napájení)', match: 'BZX55C27', quantity: 1 },
      { label: 'LED1, LED2 — SMD LED', match: 'LED SMD', quantity: 2 },
      { label: 'R1, R9, R10 — rezistor 33 Ω', match: '33 Ω', quantity: 3 },
      { label: 'R2–R6 — rezistor 33 Ω (indikace X1 vstupů)', match: '33 Ω', quantity: 5 },
      { label: 'R7, R8 — rezistor 22 kΩ', match: '22 kΩ', quantity: 2 },
      { label: 'R11, R12 — rezistor 10 kΩ', match: '10k', quantity: 2 },
      { label: 'Konektor RJ45 (Ethernet CAT5, napájení + sběrnice)', match: 'RJ45', quantity: 2 },
      { label: 'Šroubovací svorkovnice (napájení, I/O)', match: 'svorkovnice', quantity: 3 },
    ],
  },
  {
    name: 'Solární lampička se superkondenzátorem',
    description:
      'Nejjednodušší varianta solární zahradní lampičky — superkondenzátor (50–120 F) nahrazuje akumulátor, nabíjí se přímo ze solárního článku 2 V přes integrovaný měnič YX8018, který za tmy rozsvítí LED. Bez akumulátoru odpadá jeho údržba a vybíjecí cykly, svítí ale jen několik hodin (u 120 F cca 9 hodin).',
    image: 'solarni-lampicka-superkondenzator.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 07/2023, str. 22–27, rubrika Konstrukce (Jaroslav Belza). Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce. 3D modely pouzdra (STL) jsou ke stažení na webu časopisu.',
    parts: [
      { label: 'IC1 — YX8018 (joule thief měnič pro solární LED svítidla)', match: 'YX8018', quantity: 1 },
      { label: 'FC1 — solární článek 2 V (Ø 36–45 mm)', match: 'solární článek', quantity: 1 },
      { label: 'C1 — superkondenzátor 50–120 F/2,5–3 V', match: 'superkondenzátor', quantity: 1 },
      { label: 'L1 — tlumivka 330 µH', match: '330 µH', quantity: 1 },
      { label: 'LED1 — LED bílá nebo barevná', match: 'LED', quantity: 1 },
      { label: 'SW1 — drátová propojka/jumper', match: 'jumper', quantity: 1 },
    ],
  },
  {
    name: 'Solární lampička s Li-ion akumulátorem (SMD)',
    description:
      'Výkonnější varianta solární zahradní lampičky s Li-ion/Li-pol akumulátorem (≥300 mAh) místo kondenzátoru — nabíjecí obvod TP4056 omezuje nabíjecí proud na 130 mA a napětí na 4,2 V. Dvojice MOSFETů (duální pouzdro FDS9926) podle napětí ze solárního článku spíná LED za tmy.',
    image: 'solarni-lampicka-akumulator-smd.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 07/2023, str. 24–27, rubrika Konstrukce (Jaroslav Belza), SMD osazení. Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce. Alternativa s vývodovými (THT) součástkami viz samostatný projekt.',
    parts: [
      { label: 'IC1 — TP4056 (nabíječka Li-ion/Li-pol)', match: 'TP4056', quantity: 1 },
      { label: 'Q1 — dvojitý MOSFET FDS9926 (SO-8)', match: 'FDS9926', quantity: 1 },
      { label: 'FC1 — solární článek 5,5 V', match: 'solární článek', quantity: 1 },
      { label: 'Akumulátor Li-ion/Li-pol, ≥300 mAh', match: 'Akumulátor Li-ion', quantity: 1 },
      { label: 'LED1 — LED 1 W', match: 'LED', quantity: 1 },
      { label: 'R1 — rezistor SMD 10 kΩ (0805)', match: '10k', quantity: 1 },
      { label: 'R2 — rezistor SMD 1 MΩ (0805)', match: '1M', quantity: 1 },
      { label: 'R3 — rezistor SMD 33 Ω (1206)', match: '33 Ω', quantity: 1 },
      { label: 'C1, C2 — kondenzátor SMD 10 µF/16 V (1206)', match: '10 µF', quantity: 2 },
      { label: 'SW1 — polohový rtuťový spínač', match: 'rtuťový', quantity: 1 },
    ],
  },
  {
    name: 'Solární lampička s Li-ion akumulátorem (THT)',
    description:
      'Alternativní zapojení solární lampičky s Li-ion/Li-pol akumulátorem pomocí vývodových (THT) součástek — nabíjecí obvod na principu omezení napětí s TL431 (dobíjí akumulátor, dokud napětí na solárním článku převyšuje napětí akumulátoru) a dvojice tranzistorů BS108 spínajících LED za tmy.',
    image: 'solarni-lampicka-akumulator-tht.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 07/2023, str. 24–27, rubrika Konstrukce (Jaroslav Belza), THT osazení. Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce.',
    parts: [
      { label: 'IO1 — TL431 (nastavitelná Zenerova dioda, nabíjecí obvod)', match: 'TL431', quantity: 1 },
      { label: 'T1, T2 — tranzistor BS108 (nebo BS170)', match: 'BS108', quantity: 2 },
      { label: 'D1 — dioda 1N5818 (Schottky)', match: '1N5818', quantity: 1 },
      { label: 'FC2 — solární článek 5,5 V', match: 'solární článek', quantity: 1 },
      { label: 'Akumulátor Li-ion/Li-pol, ≥300 mAh', match: 'Akumulátor Li-ion', quantity: 1 },
      { label: 'LED4 — LED (doporučeno pro proud alespoň 50 mA)', match: 'LED', quantity: 1 },
      { label: 'R4 — rezistor 100 kΩ, 0207', match: '100 kΩ', quantity: 1 },
      { label: 'R5 — rezistor 68 kΩ, 0207', match: '68 kΩ', quantity: 1 },
      { label: 'R6 — rezistor 2,7 kΩ, 0207', match: '2.7 kΩ', quantity: 1 },
      { label: 'R7 — rezistor 1 MΩ, 0207', match: '1M', quantity: 1 },
      { label: 'R8 — rezistor 33 Ω, 0207', match: '33 Ω', quantity: 1 },
      { label: 'S1 — polohový rtuťový spínač', match: 'rtuťový', quantity: 1 },
    ],
  },
  {
    name: 'Spínaný napájecí zdroj 12/5 V s indikací podpětí',
    description:
      'Malý spínaný zdroj s výstupním napětím 5 V a maximálním proudem 0,5 A pro napájení přístrojů z baterie nebo akumulátoru (vstup 8–15 V). Obvod LM2575-5 pracuje s konstantním kmitočtem 52 kHz a téměř neruší okolí. Komparátor s OZ MAA741 signalizuje nastavitelným prahem (7,6–9,1 V) rozsvícením LED pokles napětí baterie.',
    image: 'spinany-zdroj-12-5v.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 07/2023, str. 33–36, rubrika Konstrukce (Ing. Jan Šedivý). Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce. Modul byl původně navržen pro napájení tuneru bezdrátového ozvučení (odběr cca 220 mA při 5 V).',
    parts: [
      { label: 'IO1 — LM2575-5 (spínaný snižující měnič, pevných 5 V)', match: 'LM2575', quantity: 1 },
      { label: 'IO2 — MAA741 (operační zesilovač, komparátor)', match: 'MAA741', quantity: 1 },
      { label: 'D1 — dioda 1N5819 (Schottky)', match: '1N5819', quantity: 1 },
      { label: 'D2 — dioda KA206 (nebo KA261, 1N4148, KA501)', match: 'KA206', quantity: 1 },
      { label: 'D3 — LED červená', match: 'LED 5mm červená', quantity: 1 },
      { label: 'L1 — tlumivka 330 µH/0,5 A (radiální)', match: '330 µH', quantity: 1 },
      { label: 'L2 — tlumivka 1–5 µH (válcová vinutá)', match: 'tlumivka', quantity: 1 },
      { label: 'R1 — odporový trimr 4,7 kΩ', match: 'Trimr 4,7 kΩ', quantity: 1 },
      { label: 'R2 — rezistor 7,5 kΩ', match: '7.5 kΩ', quantity: 1 },
      { label: 'R3 — rezistor 15 kΩ', match: '15 kΩ', quantity: 1 },
      { label: 'R4 — rezistor 1 MΩ', match: '1M', quantity: 1 },
      { label: 'R5 — rezistor 680 Ω', match: '680', quantity: 1 },
      { label: 'R6 — rezistor 10 kΩ', match: '10k', quantity: 1 },
      { label: 'C1, C2 — elektrolytický kondenzátor 1500 µF/16 V', match: '1500 µF', quantity: 2 },
      { label: 'C4, C5, C6 — elektrolytický kondenzátor 470 µF/16 V', match: '470 µF', quantity: 3 },
      { label: 'C3, C7 — kondenzátor 100 nF', match: '100 nF', quantity: 2 },
      { label: 'Po1 — pojistka trubičková 800 mA', match: 'pojistka', quantity: 1 },
    ],
  },
  {
    name: 'Bodovací svářečka z mikrovlnné trouby',
    description:
      'Domácí bodovací svářečka (pro bodové svařování Li-ion akumulátorových pásků apod.) postavená z transformátoru staré mikrovlnné trouby (MOT). Spínací deska NY-D01 s triakem BTA41-800B přes pedál spouští krátký, nastavitelný impuls (20–1000 ms, výkon 30–99 %) do sekundárního vinutí přetočeného MOT.',
    image: 'bodovaci-svarecka.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 07/2023, str. 40–42, rubrika Konstrukce — Zápisky mladého elektronika (Antonín Čapek, 15 let). Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce. UPOZORNĚNÍ redakce: konstrukce nemá vyřešenou ochranu neživých částí před nebezpečným dotykovým napětím (viz poznámka redakce v článku) — jde o nebezpečné síťové zapojení, stavět jen se zkušenostmi s prací pod napětím 230 V.',
    parts: [
      { label: 'Tr2 — MOT, transformátor z mikrovlnné trouby (přetočené sekundární vinutí)', match: 'transformátor', quantity: 1 },
      { label: 'Spínací deska NY-D01 40A s triakem BTA41-800B', match: 'BTA41-800B', quantity: 1 },
      { label: 'Tr1 — transformátor 230 V/12 V (napájení spínací desky)', match: '230V/12V', quantity: 1 },
      { label: 'M — ventilátor pro chlazení MOT (spínaný přes vypínač Vv)', match: 'ventilátor', quantity: 1 },
      { label: 'Tl — tlačítko (pedál) pro spuštění svaření', match: 'tlačítko', quantity: 1 },
      { label: 'Bodovací hroty — měděný drát Ø 16 mm²', match: 'měděný drát', quantity: 2 },
    ],
  },
  {
    name: 'DS18B20 teploměr s Arduinem (1-Wire)',
    description:
      'Digitální teploměr DS18B20 (voděodolná sonda s 3žilovým kabelem: červený VCC, černý GND, žlutý DATA) připojený na Arduino Uno. Datový vodič jde na digitální pin 2 a je nutný pull-up rezistor 4,7 kΩ mezi DATA a VCC (5V), jinak 1-Wire sběrnice nefunguje spolehlivě.',
    image: 'DS18B20-arduino-wiring.jpg',
    notes:
      'Zdroj: datasheet "eses vodotěsný teploměr pro jednodeskové počítače" (DS18B20 sonda). Čtení přes knihovny OneWire + DallasTemperature, ONE_WIRE_BUS = pin 2. Rezistor 4,7 kΩ je nutný pull-up na datové lince, ne volitelný doplněk.',
    parts: [
      { label: 'Teplotní čidlo DS18B20 (voděodolná sonda)', match: 'DS18B20', quantity: 1 },
      { label: 'Arduino Uno', match: 'Arduino Uno', quantity: 1 },
      { label: 'Rezistor 4,7 kΩ (pull-up na DATA)', match: '4.7 kΩ', quantity: 1 },
    ],
  },

  // Projekty níže (elektronický kanárek … měnič pro modrozelenou LED) jsou
  // zpracované podle časopisu Praktická elektronika A Radio 01/2025. Obrázky
  // schémat jsou oříznuté scany z tohoto časopisu — ověřit licenční práva
  // k jejich použití, než se zobrazí uživatelům appky mimo osobní použití.
  {
    name: 'Elektronický kanárek',
    description:
      'Zvuková hříčka napodobující zpěv kanárka. Vydává trvale vysoký tón (3,5–3,9 kHz), jehož výška se periodicky moduluje hvizdy, takže zvuk připomíná ptačí zpěv. Postaveno na čtyřech multivibrátorech s LM324 a výkonovém zesilovači s tranzistorem pro reproduktor 8 Ω.',
    image: 'elektronicky-kanarek.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 01/2025, str. 3–4, rubrika Jednoduchá zapojení (Ing. Miloš Munzar), převzato z Rádiótechnika (HU), 03/2019. Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce. Napájení 9 V (baterie 6F22), proud kolísá mezi 60 a 85 mA. Multivibrátor IO1C generuje signál vysokého tónu (3,5/3,9 kHz dle stavu T1), IO1A/IO1B/IO1D modulují periodu a šířku hvizdů. Trimr P1 nastavuje zvukový efekt dle vkusu.',
    parts: [
      { label: 'IO1 — operační zesilovač LM324 (4× OZ)', match: 'LM324', quantity: 1 },
      { label: 'T1 — tranzistor BC548', match: 'BC548', quantity: 1 },
      { label: 'T2 — tranzistor BC328', match: 'BC328', quantity: 1 },
      { label: 'SP1 — reproduktor 8 Ω', match: 'reproduktor', quantity: 1 },
      { label: 'B1 — baterie 9 V (6F22)', match: 'Baterie 9V', quantity: 1 },
      { label: 'R1, R8 — rezistor 68 kΩ', match: '68 kΩ', quantity: 2 },
      { label: 'R2, R4, R9, R20 — rezistor 33 kΩ', match: '33 kΩ', quantity: 4 },
      { label: 'R3, R11, R18 — rezistor 100 kΩ', match: '100 kΩ', quantity: 3 },
      { label: 'R6 — rezistor 15 kΩ', match: '15 kΩ', quantity: 1 },
      { label: 'R7, R10 — rezistor 33 kΩ', match: '33 kΩ', quantity: 2 },
      { label: 'R12, R14 — rezistor 8,2 kΩ', match: '8.2 kΩ', quantity: 2 },
      { label: 'R15 — rezistor 1 MΩ', match: '1M', quantity: 1 },
      { label: 'R16, R17 — rezistor 82 kΩ', match: '82 kΩ', quantity: 2 },
      { label: 'R19 — rezistor 470 kΩ', match: '470 kΩ', quantity: 1 },
      { label: 'R21 — rezistor 33 Ω', match: '33 Ω', quantity: 1 },
      { label: 'P1 — trimr 50 kΩ', match: 'Trimr 50 kΩ', quantity: 1 },
      { label: 'C1, C6 — elektrolytický kondenzátor 100 µF/16 V', match: '100 µF', quantity: 2 },
      { label: 'C2 — elektrolytický kondenzátor 470 µF/16 V', match: '470 µF', quantity: 1 },
      { label: 'C3 — elektrolytický kondenzátor 10 µF/16 V', match: '10 µF', quantity: 1 },
      { label: 'C4 — kondenzátor 330 pF', match: '330 pF', quantity: 1 },
      { label: 'C5 — kondenzátor 2,2 nF', match: '2.2 nF', quantity: 1 },
    ],
  },
  {
    name: 'Odpuzovač krtků 1 (vibrace z mobilního vibrátoru)',
    description:
      'Zahradní odpuzovač krtků — plastová trubka zatlačená do půdy, uvnitř s vibračním motorkem z mobilního telefonu. Elektronika nepravidelně (pseudonáhodně) spíná vibrátor na 9 s s periodou 170 s, díky dvěma multivibrátorům CMOS 4093.',
    image: 'odpuzovac-krtku-1.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 01/2025, str. 5, rubrika Jednoduchá zapojení, převzato z Radio (RU), 8/2012. Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce. Napájení 4,5 V (3× sériově alkalické AA/AAA). Autor původního pramene upozorňuje, že účinnost odpuzovačů krtků tímto principem není zaručená. Existuje i varianta „Odpuzovač krtků 2" se dvěma vibrátory (samostatný projekt).',
    parts: [
      { label: 'IO1 — CMOS hradlo 4093 (4× 2-vstupý NAND se Schmittovým vstupem)', match: '4093', quantity: 1 },
      { label: 'T1 — tranzistor 2N7000 (N-MOSFET)', match: '2N7000', quantity: 1 },
      { label: 'D1 — dioda 1N4007', match: '1N4007', quantity: 1 },
      { label: 'MOT1 — vibrační motorek z mobilního telefonu', match: 'Vibrační motorek', quantity: 1 },
      { label: 'B1 — baterie 4,5 V (3× AA/AAA)', match: 'Baterie AA', quantity: 1 },
      { label: 'R1, R2, R3, R4 — rezistor 1 MΩ', match: '1M', quantity: 4 },
      { label: 'C1 — elektrolytický kondenzátor 220 µF/10 V', match: '220 µF', quantity: 1 },
      { label: 'C2 — elektrolytický kondenzátor 47 µF/10 V', match: '47 µF', quantity: 1 },
      { label: 'C3 — elektrolytický kondenzátor 10 µF/10 V', match: '10 µF', quantity: 1 },
      { label: 'C4 — elektrolytický kondenzátor 1 µF/10 V', match: '1 µF', quantity: 1 },
      { label: 'C5 — elektrolytický kondenzátor 220 µF/10 V', match: '220 µF', quantity: 1 },
    ],
  },
  {
    name: 'Odpuzovač krtků 2 (dva vibrátory)',
    description:
      'Varianta odpuzovače krtků se dvěma vibračními motorky (MOT1, MOT2) spínanými ve dvou různých, nezávislých periodách (170 s a 350 s), takže se v zemi vytváří pseudonáhodné rázy, rušivější než jediný pravidelný vibrátor.',
    image: 'odpuzovac-krtku-2.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 01/2025, str. 6, rubrika Jednoduchá zapojení, převzato z Radio (RU), 8/2012 — druhá varianta z téhož článku jako „Odpuzovač krtků 1". Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce. Napájení 4,5 V. MOT2 je zavěšen na tenké šňůrce u dna trubky a při rozvibrování naráží do stěny.',
    parts: [
      { label: 'IO1 — CMOS hradlo 4093 (4× 2-vstupý NAND se Schmittovým vstupem)', match: '4093', quantity: 1 },
      { label: 'T1, T2 — tranzistor 2N2222', match: '2N2222', quantity: 2 },
      { label: 'D1, D2 — dioda 1N4007', match: '1N4007', quantity: 2 },
      { label: 'MOT1, MOT2 — vibrační motorek z mobilního telefonu', match: 'Vibrační motorek', quantity: 2 },
      { label: 'B1 — baterie 4,5 V', match: 'Baterie AA', quantity: 1 },
      { label: 'R1, R2, R3, R4 — rezistor 1 MΩ', match: '1M', quantity: 4 },
      { label: 'R5, R6 — rezistor 1 kΩ', match: '1k', quantity: 2 },
      { label: 'C1 — elektrolytický kondenzátor 220 µF/10 V', match: '220 µF', quantity: 1 },
      { label: 'C2 — elektrolytický kondenzátor 47 µF/10 V', match: '47 µF', quantity: 1 },
      { label: 'C3 — elektrolytický kondenzátor 10 µF/10 V', match: '10 µF', quantity: 1 },
      { label: 'C4 — elektrolytický kondenzátor 1 µF/10 V', match: '1 µF', quantity: 1 },
      { label: 'C5 — elektrolytický kondenzátor 220 µF/10 V', match: '220 µF', quantity: 1 },
    ],
  },
  {
    name: 'Kmitočtová výhybka VHF/UHF — verze 1',
    description:
      'Pasivní kmitočtová výhybka (diplexer) pro slučování/rozdělování VF signálů z rozhlasového pásma VHF (FM, 87,5–108 MHz) a televizního pásma UHF (650–950 MHz), impedance 75 Ω. Pásmová propust VHF je tvořena dvěma paralelními LC rezonančními obvody, horní propust UHF kapacitně vázanými kondenzátory.',
    image: 'kmitoctova-vyhybka-vhf-uhf-v1.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 01/2025, str. 6–7, rubrika Jednoduchá zapojení, převzato z Rádiótechnika (HU), 02/2019. Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce. Cívky jsou autorem ručně vinuté (samonosné): L1 a L3 mají vnitřní průměr 4 mm, 9 závitů; L2 a L3 (pozn. zřejmě L2) mají vnitřní průměr 4 mm, 5 závitů; L4 má vnitřní průměr 3 mm, 3 závity — vše lakovaný měděný drát 0,5 mm. Kondenzátory keramické NP0. Deska s jednostrannými spoji 40×50 mm. Existuje i verze 2 s rozšířeným UHF pásmem (samostatný projekt).',
    parts: [
      { label: 'K1 — konektor VHF vstup (souosý)', match: 'konektor', quantity: 1 },
      { label: 'K2 — konektor UHF vstup (souosý)', match: 'konektor', quantity: 1 },
      { label: 'K3 — konektor VHF+UHF výstup (souosý)', match: 'konektor', quantity: 1 },
      { label: 'L1 — vlastní vinutá cívka, Ø 4 mm, 9 závitů', match: 'cívka', quantity: 1 },
      { label: 'L2, L3 — vlastní vinutá cívka, Ø 4 mm, 5 závitů', match: 'cívka', quantity: 2 },
      { label: 'L4 — vlastní vinutá cívka, Ø 3 mm, 3 závity', match: 'cívka', quantity: 1 },
      { label: 'C1 — kondenzátor 6,8 pF NP0', match: '6.8 pF', quantity: 1 },
      { label: 'C2 — kondenzátor 39 pF NP0', match: '39 pF', quantity: 1 },
      { label: 'C3 — kondenzátor 12 pF NP0', match: '12 pF', quantity: 1 },
      { label: 'C4 — kondenzátor 12 pF NP0', match: '12 pF', quantity: 1 },
      { label: 'C5, C6 — kondenzátor 2,2 pF NP0', match: '2.2 pF', quantity: 2 },
    ],
  },
  {
    name: 'Kmitočtová výhybka VHF/UHF — verze 2',
    description:
      'Druhá varianta kmitočtové výhybky VHF/UHF se shodnou pásmovou propustí VHF jako verze 1, ale s horní propustí UHF rozšířenou do vyššího pásma (650–950 MHz místo 440–1000 MHz u verze 1) pomocí tří paralelních LC rezonančních obvodů místo jednoho.',
    image: 'kmitoctova-vyhybka-vhf-uhf-v2.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 01/2025, str. 7, rubrika Jednoduchá zapojení, převzato z Rádiótechnika (HU), 02/2019 — druhá varianta z téhož článku jako „Kmitočtová výhybka VHF/UHF — verze 1". Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce. L4 až L6 mají vnitřní průměr 2 mm, 2 závity (ostatní cívky stejné jako verze 1). Autor upozorňuje, že cívky jsou špatně reprodukovatelné a doporučuje kmitočtové charakteristiky po stavbě zkontrolovat a případně doladit hodnoty součástek.',
    parts: [
      { label: 'K1 — konektor VHF vstup (souosý)', match: 'konektor', quantity: 1 },
      { label: 'K2 — konektor UHF vstup (souosý)', match: 'konektor', quantity: 1 },
      { label: 'K3 — konektor VHF+UHF výstup (souosý)', match: 'konektor', quantity: 1 },
      { label: 'L1 — vlastní vinutá cívka, Ø 4 mm, 9 závitů', match: 'cívka', quantity: 1 },
      { label: 'L2, L3 — vlastní vinutá cívka, Ø 4 mm, 5 závitů', match: 'cívka', quantity: 2 },
      { label: 'L4, L5, L6 — vlastní vinutá cívka, Ø 2 mm, 2 závity', match: 'cívka', quantity: 3 },
      { label: 'C1 — kondenzátor 6,8 pF NP0', match: '6.8 pF', quantity: 1 },
      { label: 'C2 — kondenzátor 39 pF NP0', match: '39 pF', quantity: 1 },
      { label: 'C3 — kondenzátor 12 pF NP0', match: '12 pF', quantity: 1 },
      { label: 'C4 — kondenzátor 12 pF NP0', match: '12 pF', quantity: 1 },
      { label: 'C5 — kondenzátor 3 pF NP0', match: '3p', quantity: 1 },
      { label: 'C6, C8, C10 — kondenzátor 2,2 pF NP0', match: '2.2 pF', quantity: 3 },
      { label: 'C7, C9 — kondenzátor 1 pF NP0', match: '1p', quantity: 2 },
      { label: 'C11 — kondenzátor 3 pF NP0', match: '3p', quantity: 1 },
    ],
  },
  {
    name: 'Jednoduchý DC ampérmetr ±100 A na principu fluxgate',
    description:
      'Bezkontaktní (klešťový) ampérmetr pro měření velkých stejnosměrných proudů (±100 A) na principu fluxgate — na rozdíl od plnohodnotného fluxgate snímače jde o jednodušší kompenzační zapojení bez zpětnovazební kompenzace, vyhodnocuje se jen velikost druhé harmonické budicího signálu. Vodič s měřeným DC proudem se provléká středovým otvorem snímače Tr2.',
    image: 'dc-ampermetr-fluxgate.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 01/2025, str. 14–17, rubrika Konstrukce (Ing. Josef Jansa, Josef Jansa DiS.) — dvoudílný článek, pokračování v příštím čísle. Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce. ⚠️ V článku nejsou u IO1–IO3 (operační zesilovače) ani u IO4/IO5 (lineární regulátory napájecího zdroje) uvedeny konkrétní typy součástek — ve schématu jsou jen jako obecné bloky, bez označení výrobce/katalogového čísla. Tr1 je sekundární vinutí malého síťového transformátoru (budicí signál 50 Hz), Tr2 je vlastní proudový snímač fluxgate (1500 závitů budicí vinutí, 500 závitů snímací vinutí, středový otvor Ø 13 mm pro měřený vodič) — autor jej musí navinout sám, není to hotová součástka. Trimr P1 nastavuje převodní poměr 10 A/V, trimr P2 nulové výstupní napětí. Deska s plošnými spoji na obr. 4 a 6 (v časopise), rozměr desky ampérmetru 245×65 mm.',
    parts: [
      { label: 'Tr1 — malý síťový transformátor (sekundární vinutí jako budicí zdroj 50 Hz)', match: 'transformátor', quantity: 1 },
      { label: 'Tr2 — proudový snímač fluxgate, vlastní výroba (1500 záv. budicí + 500 záv. snímací)', match: 'proudový snímač', quantity: 1 },
      { label: 'IO1, IO2, IO3 — operační zesilovače (typ v článku neuveden)', match: 'operační zesilovač', quantity: 3 },
      { label: 'IO4, IO5 — lineární napěťové regulátory napájecího zdroje (typ v článku neuveden)', match: 'regulátor', quantity: 2 },
      { label: 'D2, D3 — usměrňovací dioda (špičkový usměrňovač)', match: 'dioda', quantity: 2 },
      { label: 'P1, P2 — trimr (převodní poměr, nulování)', match: 'trimr', quantity: 2 },
      { label: 'R0 — předřadný rezistor budicího proudu', match: 'rezistor', quantity: 1 },
      { label: 'S1, S2 — svorkovnice', match: 'svorkovnice', quantity: 2 },
    ],
  },
  {
    name: 'Domácí interkom',
    description:
      'Vítěz Konkurzu Praktické elektroniky 2024 — malá telefonní ústředna s tónovou volbou pro až 6 analogových telefonů, bez procesoru (čistě TTL logika). Přijímač DTMF volby MT8870D dekóduje volenou číslici, logika z čítačů/klopných obvodů řídí prozvánění volaného účastníka (6× RJ45, relé, optočleny PC817, tranzistory BC547C).',
    image: 'domaci-interkom.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 01/2025, str. 27–29, rubrika Konstrukce — vítěz Konkurzu 2024, 1. místo (Jiří Štěrba, jiristerba@seznam.cz). Vícedílný seriál, pokračování příště. Schéma je oříznuté ze scanu časopisu (pouze horní/hlavní část obr. 3 — spodní okraj mimo záběr) — ověřit práva k publikaci obrázku v appce. Napájení telefonů 24 V DC, řídicí logiky 5 V DC (schéma zdroje, obr. 5, L7824 + L7805 z usměrněných 2× 24 VAC toroidního transformátoru — viz komponenty 7824/7805). Přijímač DTMF MT8870D má jako jediná součástka v obvodu vlastní krystal 3,579545 MHz. Propojení telefonů do zařízení přes RJ45↔RJ11 redukci (obr. 4). POZOR — zapojení je na reálném telefonním vedení 24 V, ne na síťovém napětí.',
    parts: [
      { label: 'U1 — přijímač DTMF volby MT8870D', match: 'MT8870', quantity: 1 },
      { label: 'IO1 — časovač 555', match: '555', quantity: 1 },
      { label: 'IO2, IO3 — čítač CD4040BE / CD4044BE', match: 'CD404', quantity: 2 },
      { label: 'IO6, IO7 — dekodér SN74LS138N', match: '74LS138', quantity: 2 },
      { label: 'IO5 — klopný obvod KD74LS14 (Schmittův invertor)', match: '74LS14', quantity: 1 },
      { label: 'T1–T6 — tranzistor BC547C', match: 'BC547', quantity: 6 },
      { label: 'U1–U6 — optočlen PC817', match: 'PC817', quantity: 6 },
      { label: 'RE1–RE6 — relé M4-5HAW / M4-5H', match: 'relé', quantity: 6 },
      { label: 'KO1–KO6 — konektor RJ45 (telefonní linky)', match: 'RJ45', quantity: 6 },
      { label: 'X1 — krystal 3,579545 MHz', match: '3,579545', quantity: 1 },
      { label: 'U1 (zdroj) — regulátor 7824', match: '7824', quantity: 1 },
      { label: 'U2 (zdroj) — regulátor 7805', match: '7805', quantity: 1 },
      { label: 'D1–D4 (zdroj) — dioda 1N4007 (můstkový usměrňovač)', match: '1N4007', quantity: 4 },
      { label: 'Toroidní transformátor 2× 24 VAC', match: 'transformátor', quantity: 1 },
      { label: 'D5 — LED 3 mm zelená (indikace napájení)', match: 'LED', quantity: 1 },
    ],
  },
  {
    name: 'Nízkoúbytkové palivové čerpadlo se soft-startem (DIY náhrada AC pumpy)',
    description:
      'Jedna ze tří praktických úprav z článku „Tři v jednom" — nahrazení kontaktové AC palivové pumpy ve veteránu tichým nízkotlakým DC čerpadlem (z novějších modelů Škoda), řízeným induktivním snímačem hladiny v plovákové komoře karburátoru přes modul DC/DC měniče (LM2596) s přidaným soft-startovacím kondenzátorem Cn, aby se omezilo opotřebení čerpadla při častém spouštění.',
    image: 'palivove-cerpadlo-softstart.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 01/2025, str. 33–35, rubrika „Tři v jednom — tři nápady v jednom článku" (Ivan Dendis). Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce. ⚠️ Schéma v časopise popisuje modul jako „LM2569 DC-DC" (zřejmě tisková chyba), zatímco fotografie modulu a text článku jednotně uvádí „LM2596 DC-DC HW-411" — v appce uvedeno jako LM2596. Induktivní snímač (BN/BK/BU vývody) detekuje zaplavení plovákové komory, KC507 je fototranzistor/spínací prvek v časovacím obvodu doběhu čerpadla (kondenzátor 20 µF na bázi přes 10 kΩ, doba doběhu 2–3 s). Snímač je napájen přes nízkovýkonový 10Ω rezistor jako pojistku. Autor stejného článku popisuje i další dva nápady (kontaktní rozdělovač nahrazený bezkontaktním u Škoda Spartak/Felicia/Octavia a nízkonapěťový DC soft-start modul LM2596 bez čerpadla) — bez vlastního schématu, zde nezahrnuto.',
    parts: [
      { label: 'Modul DC-DC měniče LM2596 (HW-411)', match: 'LM2596', quantity: 1 },
      { label: 'Induktivní snímač hladiny paliva', match: 'induktivní snímač', quantity: 1 },
      { label: 'T — fototranzistor/spínač KC507', match: 'KC507', quantity: 1 },
      { label: 'D1, D2 — dioda (ochranná)', match: 'dioda', quantity: 2 },
      { label: 'LED — kontrolka zaplavení komory na palubní desce', match: 'LED', quantity: 1 },
      { label: 'Cn — kondenzátor soft-start (přidaný na výstup modulu)', match: 'kondenzátor', quantity: 1 },
      { label: 'Nízkotlaké DC palivové čerpadlo (např. ze Škoda)', match: 'Nízkotlaké palivové čerpadlo', quantity: 1 },
      { label: 'R — rezistor 10 Ω (pojistka pro napájení snímače)', match: '10 Ω', quantity: 1 },
    ],
  },
  {
    name: 'Měnič pro modrozelenou LED (RETRO)',
    description:
      'Jednoduchý DC/DC měnič napájený jediným suchým článkem 1,5 V, zvedající napětí na cca 3,3–3,6 V potřebných pro modrozelenou LED s velkou svítivostí (S-LED) jako příruční světlo — oscilátor s transformátorkem na feritovém hrníčkovém jádru a jedním spínacím tranzistorem.',
    image: 'menic-modrozelena-led.jpg',
    notes:
      'Zdroj: Praktická elektronika A Radio 01/2025, str. 41, rubrika RETRO — „O čem jsme psali před lety…", přetisk článku Zdeňka Hájka z Praktická elektronika A Radio 1/2000 (před 25 lety). Schéma je oříznuté ze scanu časopisu — ověřit práva k publikaci obrázku v appce. Oscilátorová cívka vinutá na hrníčkovém jádru 3B7, Ø 14 mm, AL=100 nH/z², lakovaný měděný drát Ø 0,1 mm: primární (budicí) vinutí 20 závitů, sekundární 60 závitů. Kmitočet oscilátoru cca 10 kHz. Použitá LED HLMP-CE23 (505 nm, modrozelená, 20 mA, 30°). Odběr při 1,2 V je 34 mA, při 1,5 V 53 mA. Měnič s LED i článkem vestavěn do malého pouzdra (např. klíčenky).',
    parts: [
      { label: 'D1 (S-LED) — LED HLMP-CE23 (modrozelená, 505 nm, 20 mA)', match: 'HLMP-CE23', quantity: 1 },
      { label: 'TR1 — tranzistor BC337', match: 'BC337', quantity: 1 },
      { label: 'C1 — kondenzátor 680 nF', match: '680 nF', quantity: 1 },
      { label: 'C2 — kondenzátor 470 nF', match: '470 nF', quantity: 1 },
      { label: 'R1 — rezistor 680 Ω', match: '680', quantity: 1 },
      { label: 'Oscilátorová cívka — hrníčkové jádro 3B7, Ø14mm, 20+60 závitů', match: 'cívka', quantity: 1 },
      { label: 'Napájecí článek 1,5 V', match: 'baterie', quantity: 1 },
    ],
  },
];

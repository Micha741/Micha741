import type { ComponentInput } from '../types/component';

interface IcSpec {
  name: string;
  packageType: string;
  value: string;
  notes: string;
  tags: string;
}

const IC_SPECS: IcSpec[] = [
  // Časovače
  {
    name: 'NE555',
    packageType: 'DIP-8 / SO-8',
    value: 'Časovač (monostabilní/astabilní), 4,5–16 V, výstup až 200 mA',
    notes:
      'Univerzální časovací obvod — generátor obdélníkových pulzů, PWM, zpoždění. ' +
      'Zapojení DIP-8: 1=GND, 2=TRIG, 3=OUT, 4=RESET, 5=CTRL, 6=THR, 7=DISCH, 8=VCC ' +
      '(standardní pinout, shodný napříč výrobci).',
    tags: 'io,časovač,555,oscilátor,pwm',
  },
  {
    name: 'NE556',
    packageType: 'DIP-14',
    value: 'Dvojitý časovač 555, 4,5–16 V',
    notes: 'Dvě nezávislé jednotky NE555 v jednom pouzdře — dva časovače/oscilátory na čipu.',
    tags: 'io,časovač,555,oscilátor',
  },

  // Operační zesilovače
  {
    name: 'LM358',
    packageType: 'DIP-8 / SO-8',
    value: 'Dvojitý OZ, jednoduché napájení 3–32 V (nebo ±1,5–16 V)',
    notes:
      'Obecný nízkopříkonový operační zesilovač, funguje i z jednoho napájecího napětí (bez záporné ' +
      'větve) — vhodný pro senzorové obvody, komparátory, filtry. Zapojení DIP-8: 1=OUT1, 2=IN1-, ' +
      '3=IN1+, 4=GND/V-, 5=IN2+, 6=IN2-, 7=OUT2, 8=VCC/V+.',
    tags: 'io,operační-zesilovač,lm358',
  },
  {
    name: 'LM324',
    packageType: 'DIP-14 / SO-14',
    value: 'Čtyřnásobný OZ, jednoduché napájení 3–32 V',
    notes: 'Čtyři operační zesilovače v pouzdře, stejná rodina jako LM358 — obecné použití, nízká cena.',
    tags: 'io,operační-zesilovač,lm324',
  },
  {
    name: 'TL071',
    packageType: 'DIP-8',
    value: 'OZ s JFET vstupem, nízký šum, ±3,5–18 V',
    notes: 'Jeden nízkošumový JFET operační zesilovač — audio, přesné analogové obvody, vysoká vstupní impedance.',
    tags: 'io,operační-zesilovač,tl071,audio',
  },
  {
    name: 'TL072',
    packageType: 'DIP-8',
    value: 'Dvojitý OZ s JFET vstupem, nízký šum, ±3,5–18 V',
    notes: 'Dvě jednotky TL071 v pouzdře — velmi časté v audio obvodech (efektové pedály, mixpulty).',
    tags: 'io,operační-zesilovač,tl072,audio',
  },
  {
    name: 'TL074',
    packageType: 'DIP-14',
    value: 'Čtyřnásobný OZ s JFET vstupem, nízký šum, ±3,5–18 V',
    notes: 'Čtyři jednotky TL071 v pouzdře — audio a přesné analogové obvody.',
    tags: 'io,operační-zesilovač,tl074,audio',
  },
  {
    name: 'LM741',
    packageType: 'DIP-8',
    value: 'Klasický OZ, ±5–18 V',
    notes:
      'Historicky nejznámější operační zesilovač, dnes už spíš pro výuku — nižší šířka pásma a vyšší ' +
      'vstupní proud než modernější typy (LM358, TL071).',
    tags: 'io,operační-zesilovač,lm741,ua741',
  },

  // Komparátory
  {
    name: 'LM393',
    packageType: 'DIP-8',
    value: 'Dvojitý komparátor, 2–36 V, výstup s otevřeným kolektorem',
    notes:
      'Napěťový komparátor (ne lineární zesilovač) — výstup s otevřeným kolektorem vyžaduje pull-up ' +
      'rezistor. Časté v jednoduchých prahových detektorech a senzorových modulech.',
    tags: 'io,komparátor,lm393',
  },
  {
    name: 'LM339',
    packageType: 'DIP-14',
    value: 'Čtyřnásobný komparátor, 2–36 V, výstup s otevřeným kolektorem',
    notes: 'Čtyři jednotky LM393 v pouzdře.',
    tags: 'io,komparátor,lm339',
  },

  // Lineární napěťové regulátory
  {
    name: '7805',
    packageType: 'TO-220 — vývody: 1=vstup (IN), 2=GND, 3=výstup (OUT)',
    value: 'Lineární regulátor +5 V / 1 A',
    notes:
      'Pevný kladný lineární regulátor řady 78xx. Potřebuje vstupní napětí alespoň o 2–3 V vyšší než ' +
      'výstup (úbytek/dropout) a keramické/elektrolytické blokovací kondenzátory na vstupu i výstupu.',
    tags: 'io,regulátor,7805,napájení',
  },
  {
    name: '7809',
    packageType: 'TO-220 — vývody: 1=vstup (IN), 2=GND, 3=výstup (OUT)',
    value: 'Lineární regulátor +9 V / 1 A',
    notes: 'Pevný kladný lineární regulátor řady 78xx, stejné zapojení jako 7805.',
    tags: 'io,regulátor,7809,napájení',
  },
  {
    name: '7812',
    packageType: 'TO-220 — vývody: 1=vstup (IN), 2=GND, 3=výstup (OUT)',
    value: 'Lineární regulátor +12 V / 1 A',
    notes: 'Pevný kladný lineární regulátor řady 78xx, stejné zapojení jako 7805.',
    tags: 'io,regulátor,7812,napájení',
  },
  {
    name: '7815',
    packageType: 'TO-220 — vývody: 1=vstup (IN), 2=GND, 3=výstup (OUT)',
    value: 'Lineární regulátor +15 V / 1 A',
    notes: 'Pevný kladný lineární regulátor řady 78xx, stejné zapojení jako 7805.',
    tags: 'io,regulátor,7815,napájení',
  },
  {
    name: '7905',
    packageType: 'TO-220 — vývody: 1=GND, 2=vstup (IN), 3=výstup (OUT)',
    value: 'Lineární regulátor -5 V / 1 A',
    notes: 'Pevný záporný lineární regulátor řady 79xx — pozor, pořadí vývodů se liší od 78xx řady!',
    tags: 'io,regulátor,7905,napájení',
  },
  {
    name: '7912',
    packageType: 'TO-220 — vývody: 1=GND, 2=vstup (IN), 3=výstup (OUT)',
    value: 'Lineární regulátor -12 V / 1 A',
    notes: 'Pevný záporný lineární regulátor řady 79xx — pozor, pořadí vývodů se liší od 78xx řady!',
    tags: 'io,regulátor,7912,napájení',
  },
  {
    name: 'LM317',
    packageType: 'TO-220 — vývody: 1=ADJ, 2=výstup (OUT), 3=vstup (IN)',
    value: 'Nastavitelný lineární regulátor +1,25 až +37 V / 1,5 A',
    notes:
      'Nastavitelný kladný regulátor — výstupní napětí se nastavuje odporovým děličem mezi OUT a ADJ ' +
      '(Vout = 1,25 V × (1 + R2/R1)).',
    tags: 'io,regulátor,lm317,napájení,nastavitelný',
  },
  {
    name: 'LM337',
    packageType: 'TO-220 — vývody: 1=ADJ, 2=výstup (OUT), 3=vstup (IN)',
    value: 'Nastavitelný lineární regulátor -1,25 až -37 V / 1,5 A',
    notes: 'Záporná obdoba LM317, pro symetrická napájení operačních zesilovačů.',
    tags: 'io,regulátor,lm337,napájení,nastavitelný',
  },

  // Logická hradla (74HC řada, 5V CMOS)
  {
    name: '74HC00',
    packageType: 'DIP-14',
    value: 'Čtyři 2-vstupá hradla NAND, 2–6 V',
    notes: 'Základní logická rodina 74HC (rychlá CMOS) — nízká spotřeba, kompatibilní s 5V i 3,3V systémy.',
    tags: 'io,logika,74hc00,nand',
  },
  {
    name: '74HC04',
    packageType: 'DIP-14',
    value: 'Šest invertorů (NOT), 2–6 V',
    notes: 'Hexadecimální invertor — často se používá i jako jednoduchý oscilátor s RC/krystalem.',
    tags: 'io,logika,74hc04,invertor',
  },
  {
    name: '74HC08',
    packageType: 'DIP-14',
    value: 'Čtyři 2-vstupá hradla AND, 2–6 V',
    notes: 'Základní logická rodina 74HC.',
    tags: 'io,logika,74hc08,and',
  },
  {
    name: '74HC32',
    packageType: 'DIP-14',
    value: 'Čtyři 2-vstupá hradla OR, 2–6 V',
    notes: 'Základní logická rodina 74HC.',
    tags: 'io,logika,74hc32,or',
  },
  {
    name: '74HC86',
    packageType: 'DIP-14',
    value: 'Čtyři 2-vstupá hradla XOR, 2–6 V',
    notes: 'Základní logická rodina 74HC — hradlo XOR se často používá pro paritu, sčítačky, komparátory bitů.',
    tags: 'io,logika,74hc86,xor',
  },

  // Klopné obvody a čítače
  {
    name: '74HC74',
    packageType: 'DIP-14',
    value: 'Dva D klopné obvody s SET/RESET, 2–6 V',
    notes: 'Dva nezávislé D flip-flopy hranou řízené hodinovým signálem — děličky kmitočtu, paměťové registry.',
    tags: 'io,logika,74hc74,klopný-obvod',
  },
  {
    name: '74HC393',
    packageType: 'DIP-14',
    value: 'Dva 4bitové binární čítače, 2–6 V',
    notes: 'Dva nezávislé asynchronní binární čítače (dělí kmitočtem /2 až /16).',
    tags: 'io,logika,74hc393,čítač',
  },
  {
    name: 'CD4017',
    packageType: 'DIP-16',
    value: 'Dekadický čítač/dělič s 10 dekódovanými výstupy, 3–18 V',
    notes:
      'Velmi oblíbený v hobby elektronice pro LED "chasery", sekvenční spínání a jednoduché stavové ' +
      'automaty — na každý hodinový pulz postupně aktivuje jeden z 10 výstupů.',
    tags: 'io,logika,cd4017,čítač,led',
  },
  {
    name: 'CD4013',
    packageType: 'DIP-14',
    value: 'Dva D klopné obvody, 3–18 V (CMOS)',
    notes: 'CMOS obdoba 74HC74 se širším rozsahem napájení — vhodné i pro obvody napájené nižším/vyšším napětím.',
    tags: 'io,logika,cd4013,klopný-obvod',
  },

  // Posuvné registry
  {
    name: '74HC595',
    packageType: 'DIP-16',
    value: '8bitový sériově vstupní/paralelně výstupní posuvný registr, 2–6 V',
    notes:
      'Velmi časté řešení pro rozšíření počtu výstupů mikrokontroléru přes 3 piny (data, clock, latch) ' +
      '— lze řetězit více kusů za sebou. Typicky se používá k ovládání LED, displejů apod.',
    tags: 'io,logika,74hc595,posuvný-registr,led',
  },
  {
    name: '74HC165',
    packageType: 'DIP-16',
    value: '8bitový paralelně vstupní/sériově výstupní posuvný registr, 2–6 V',
    notes: 'Opak 74HC595 — načte 8 paralelních vstupů (např. tlačítek) a odešle je sériově do mikrokontroléru.',
    tags: 'io,logika,74hc165,posuvný-registr',
  },

  // Dekodéry / multiplexery
  {
    name: '74HC138',
    packageType: 'DIP-16',
    value: '3 na 8 linkový dekodér/demultiplexer, 2–6 V',
    notes: 'Podle 3bitové adresy aktivuje jeden z 8 výstupů — časté pro výběr čipů (chip select) ve sběrnicových obvodech.',
    tags: 'io,logika,74hc138,dekodér',
  },
  {
    name: 'CD4051',
    packageType: 'DIP-16',
    value: '8kanálový analogový multiplexer/demultiplexer, 3–18 V (CMOS)',
    notes: 'Přepíná jeden společný vývod mezi 8 kanály podle 3bitové adresy — funguje i pro analogové signály.',
    tags: 'io,logika,cd4051,multiplexer,analogový',
  },

  // Budiče (drivery)
  {
    name: 'ULN2003',
    packageType: 'DIP-16',
    value: '7× Darlingtonův budič, 500 mA/kanál, do 50 V',
    notes:
      'Sedm výkonových Darlington tranzistorů s vestavěnými ochrannými diodami — klasika pro spínání ' +
      'relé, malých motorů a unipolárních krokových motorů přímo z mikrokontroléru (výstup s otevřeným ' +
      'kolektorem).',
    tags: 'io,budič,uln2003,relé,motor,krokový-motor',
  },
  {
    name: 'ULN2803',
    packageType: 'DIP-18',
    value: '8× Darlingtonův budič, 500 mA/kanál, do 50 V',
    notes: 'Osmikanálová verze ULN2003, jinak stejné vlastnosti a použití.',
    tags: 'io,budič,uln2803,relé,motor',
  },
  {
    name: 'L293D',
    packageType: 'DIP-16',
    value: 'Dvojitý H-můstek, 600 mA/kanál, motorové napájení do 36 V',
    notes:
      'Budič pro dva DC motory (nebo jeden krokový) s možností řízení směru otáčení a PWM regulace ' +
      'rychlosti; má vestavěné ochranné diody proti indukčním špičkám.',
    tags: 'io,budič,l293d,motor,h-můstek',
  },

  // Audio
  {
    name: 'LM386',
    packageType: 'DIP-8',
    value: 'Nízkopříkonový audio zesilovač, 4–12 V, výstup ~0,3–1 W',
    notes: 'Oblíbený jednoduchý zesilovač pro malé reproduktory — sluchátkové zesilovače, jednoduché radiopřijímače.',
    tags: 'io,audio,lm386,zesilovač',
  },

  // Reference
  {
    name: 'TL431',
    packageType: 'TO-92 — vývody: 1=katoda (K), 2=anoda (A), 3=referenční vstup (REF)',
    value: 'Nastavitelná přesná napěťová reference, 2,5–36 V',
    notes:
      'Funguje jako programovatelná Zenerova dioda — s odporovým děličem lze nastavit referenční napětí ' +
      'od 2,5 V výš; časté ve zpětnovazebních obvodech spínaných zdrojů (spolu s optočlenem).',
    tags: 'io,reference,tl431,napájení',
  },

  // Paměť a RTC
  {
    name: '24LC256',
    packageType: 'DIP-8 / SOIC-8',
    value: 'I2C EEPROM, 256 kbit (32 kB), 1,7–5,5 V',
    notes: 'Nevolatilní paměť s I2C rozhraním — ukládání konfigurace, logů apod. mezi výpadky napájení.',
    tags: 'io,paměť,eeprom,i2c,24lc256',
  },
  {
    name: 'DS1307',
    packageType: 'DIP-8 / SOIC-8',
    value: 'I2C obvod reálného času (RTC), 4,5–5,5 V, záložní baterie 3 V',
    notes: 'Hodiny reálného času s I2C rozhraním a podporou záložní baterie (CR2032) pro uchování času bez napájení.',
    tags: 'io,rtc,hodiny,i2c,ds1307',
  },
  {
    name: 'MX25L6406E',
    packageType:
      '16pin SOP 300mil, 8pin SOP 200mil, nebo 8-land WSON (8×6 mm) dle objednacího kódu — ' +
      'piny CS#, SI/SIO0, SO/SIO1, SCLK, WP#, HOLD#, VCC, GND (SPI + volitelný dual-output režim)',
    value:
      'Sériová NOR flash paměť (SPI), 64 Mbit (8 MB), VCC 2,7–3,6 V, hodinový kmitočet do 86 MHz',
    notes:
      'Macronix MX25L6406E datasheet rev. 1.1 (listopad 2010), objednací kód např. MX25L6406EMI-12G ' +
      '(16-SOP), MX25L6406EM2I-12G (8-SOP) nebo MX25L6406EZNI-12G (8-WSON) — "X" v názvu souboru ' +
      'zastupuje libovolné pouzdro, datasheet je společný pro celou rodinu balení. Organizace ' +
      'paměti: 67 108 864 × 1 bit (běžný SPI režim) nebo 33 554 432 × 2 bity (dual-output režim), ' +
      '2048 stejných sektorů po 4 KB (libovolně smazatelné jednotlivě) seskupených do 128 bloků ' +
      'po 64 KB (rovněž smazatelných jednotlivě). Programování po bajtech nebo stránkách (256 B). ' +
      'Podpora SPI Mode 0 a Mode 3, dual-output čtení (SIO0/SIO1) do 80 MHz. Rychlosti: hodinový ' +
      'kmitočet čtení (FAST_READ) do 86 MHz, obyčejné READ do 33 MHz, DREAD (dual output) do ' +
      '80 MHz. Doba programování: bajt typ. 9 µs, stránka (256 B) typ. 1,4 ms (max 5 ms). Doba ' +
      'mazání: sektor (4 KB) typ. 60 ms, blok (64 KB) typ. 0,7 s, celý čip typ. 50 s (max 80 s). ' +
      'Zabezpečení: softwarová ochrana bloků (bity BP0–BP3, 16 úrovní ochrany od 0 do celého ' +
      'čipu), hardwarová ochrana přes pin WP#, 512bitová jednorázově programovatelná paměť (OTP) ' +
      'pro unikátní identifikátor (128 bitů výrobní ESN + 384 bitů pro zákazníka, uzamykatelné ' +
      'trvale příkazem WRSCUR). Elektronická identifikace: JEDEC 1bajtový výrobní ID + 2bajtové ' +
      'ID zařízení (RDID), nebo REMS/RES příkazy. Mezní hodnoty: napětí na pinech -0,5 až +4,6 V, ' +
      'provozní teplota (Industrial grade) -40 až +85 °C, skladovací -55 až +125 °C. Proudový ' +
      'odběr: čtení @86 MHz max 25 mA, programování max 20 mA, mazání max 20–25 mA, klidový ' +
      '(standby) max 50 µA, deep power-down typ. 5 µA (max 20 µA). Vstupní/výstupní kapacita ' +
      'CIN max 6 pF, COUT max 8 pF. Spolehlivost: 100 000 cyklů mazání/zápisu (typicky), 20 let ' +
      'retence dat, ochrana proti latch-up do 100 mA v rozsahu -1 V až VCC+1 V. RoHS/bezolovnaté ' +
      'provedení (Pb-free, "G" suffix).',
    tags: 'io,paměť,flash,spi,serial-flash,mx25l6406e,macronix,64mbit',
  },
  {
    name: 'MX25L1026E',
    packageType:
      '8pin SOP 150mil — piny 1=CS#, 2=SO/SIO1, 3=WP#, 4=GND, 5=SI/SIO0, 6=SCLK, 7=HOLD#, 8=VCC ' +
      '(SPI + volitelný dual-output režim)',
    value:
      'Sériová NOR flash paměť (SPI), 1 Mbit (128 kB), VCC 2,7–3,6 V, hodinový kmitočet do 104 MHz',
    notes:
      'Macronix MX25L1026E datasheet rev. 1.3 (listopad 2013), objednací kód např. ' +
      'MX25L1026EM1I-10G (8-SOP 150mil, Industrial, Pb-free). ⚠️ Součást stejné produktové rodiny ' +
      'jako MX25L6406E (samostatný záznam), ale výrazně menší kapacita (1 Mbit vs. 64 Mbit — ' +
      '64× méně) a odlišné pouzdro (jen 8-SOP 150mil, na rozdíl od MX25L6406E dostupného i v ' +
      '16-SOP 300mil nebo WSON). Organizace paměti: 131 072 × 8 bit (1 048 576 × 1 bit), 32 ' +
      'stejných sektorů po 4 KB (libovolně smazatelné jednotlivě) seskupených do 2 bloků po 64 KB ' +
      '(rovněž smazatelných jednotlivě). Programování po bajtech nebo stránkách (256 B). Podpora ' +
      'SPI Mode 0 a Mode 3, dual-output čtení (SIO0/SIO1). Rychlosti: hodinový kmitočet FAST_READ ' +
      'a ostatní příkazy do 104 MHz, obyčejné READ do 33 MHz, DREAD (dual output) do 80 MHz. Doba ' +
      'programování: bajt typ. 9 µs, stránka (256 B) typ. 0,6 ms (max 3 ms). Doba mazání: sektor ' +
      '(4 KB) typ. 40 ms, blok (64 KB) typ. 0,4 s (max 2 s), celý čip typ. 0,8 s (max 2 s). ' +
      'Zabezpečení: softwarová ochrana bloků (bity BP0–BP1, 4 úrovně ochrany: žádná/blok 1/oba ' +
      'bloky/oba bloky), hardwarová ochrana přes pin WP#, podpora SFDP (Serial Flash Discoverable ' +
      'Parameters). Elektronická identifikace: JEDEC 2bajtové Device ID (RDID), nebo REMS/RES ' +
      'příkazy (1bajtové Device ID). Mezní hodnoty: napětí na pinech -0,5 až +4,6 V, provozní ' +
      'teplota (Industrial grade) -40 až +85 °C, skladovací -65 až +150 °C. Proudový odběr: čtení ' +
      '@104 MHz max 12 mA (@33 MHz max 4 mA), programování max 20 mA, mazání sektoru max 15 mA, ' +
      'mazání čipu max 20 mA, klidový (standby) max 25 µA, deep power-down max 10 µA. Vstupní/' +
      'výstupní kapacita CIN max 6 pF, COUT max 8 pF. Spolehlivost: min. 100 000 cyklů mazání/' +
      'zápisu, 20 let retence dat. RoHS/bezolovnaté a bezhalogenové provedení.',
    tags: 'io,paměť,flash,spi,serial-flash,mx25l1026e,macronix,1mbit',
  },

  // Paralelní flash paměti
  {
    name: 'MX29GL320ET',
    packageType:
      '48pin TSOP nebo 48-ball LFBGA (6×8 mm) — piny A0–A20 (adresa), Q0–Q15/A-1 (data/LSB ' +
      'adresy v byte módu), CE#, OE#, WE#, RESET#, WP#/ACC, RY/BY#, BYTE#, VCC, GND ' +
      '(⚠️ na rozdíl od H/L variant, samostatné záznamy, nemá samostatný pin VI/O — I/O úroveň ' +
      'je vždy shodná s VCC)',
    value:
      'Paralelní NOR flash paměť, 32 Mbit, byte/word (x8/x16) přepínatelná, "Top Boot" ' +
      '(nesymetrické sektory nahoře), VCC 2,7–3,6 V, přístupová doba 70 ns',
    notes:
      'Macronix MX29GL320E T/B datasheet rev. 1.5 (říjen 2015), objednací kód např. ' +
      'MX29GL320ETTI-70G (48-TSOP) nebo MX29GL320ETXEI-70G (48-LFBGA). ⚠️ Zcela odlišná ' +
      'architektura od SPI sériových flash MX25L1026E/MX25L6406E (samostatné záznamy) — jde o ' +
      'PARALELNÍ flash s 21bitovou adresní sběrnicí (A0–A20) a 16bitovou datovou sběrnicí ' +
      '(Q0–Q15), řízenou signály CE#/OE#/WE#, ne o SPI. Zpracována celá rodina MX29GL320E ' +
      'z jednoho datasheetu — 4 varianty: ET (Top Boot, tento záznam), EB (Bottom Boot), EH ' +
      '(uniform, Highest Address Sector Protected), EL (uniform, Lowest Address Sector ' +
      'Protected) — všechny samostatné záznamy. MX29GL320ET = "Top Boot" — sektorová architektura ' +
      'asymetrická: 63× 64KB (32Kword) uniformních sektorů + 8× 8KB (4Kword) malých boot sektorů ' +
      'umístěných na VRCHU adresního prostoru (na rozdíl od EB, kde jsou boot sektory na SPODU). ' +
      'Organizace paměti: 4 194 304 × 8 bit (byte mode) nebo 2 097 152 × 16 bit (word mode), ' +
      'volitelné pinem BYTE#. 16bajtový/8slovní stránkový čtecí buffer (page read, 25 ns), ' +
      '32bajtový/16slovní zápisový buffer (write buffer programming). Extra 128slovní bezpečnostní ' +
      'sektor (z výroby zamčený a identifikovatelný, nebo zamykatelný zákazníkem). Pokročilá ' +
      'ochrana sektorů (Persistent a Password Protect metody). WP#/ACC=Vil chrání horní dva ' +
      'sektory (boot blok) proti zápisu/mazání; stejný pin ve zvýšeném napětí (ACC, 9,5–10,5 V) ' +
      'zrychluje programování. RY/BY# výstup indikuje probíhající program/mazání. RESET# hardwarový ' +
      'reset. Kompatibilní s JEDEC standardním pinoutem/softwarem pro jednonapěťové flash paměti. ' +
      'Podpora CFI (Common Flash Memory Interface). Doba přístupu 70 ns, doba stránkového ' +
      'přístupu 25 ns, doba programování typ. 10 µs/slovo, doba mazání sektoru typ. 0,5 s (max ' +
      '3,5 s). Proudový odběr: čtení 5/15 mA @1 MHz, 10/20 mA @5 MHz, 15/30 mA @10 MHz (typ/max, ' +
      'byte mode), zápis 14/30 mA, klidový (standby) 20/100 µA, reset 20/100 µA, sleep mode ' +
      '20/100 µA, deep power-down 1/15 µA. Mezní hodnoty: skladovací teplota -65 až +150 °C, VCC ' +
      '-0,5 až +4,0 V, VI/O -0,5 až +4,0 V, A9/WP#/ACC -0,5 až +10,5 V, ostatní piny -0,5 až ' +
      'VCC+0,5 V, zkratový výstupní proud max 200 mA. Provozní: Industrial grade -40 až +85 °C, ' +
      'VCC 2,7–3,6 V. Latch-up ochrana do 100 mA v rozsahu -1 V až 1,5×VCC. Spolehlivost: typ. ' +
      '100 000 cyklů mazání/zápisu, 20 let retence dat. RoHS/bezhalogenové provedení.',
    tags: 'io,paměť,flash,paralelní,parallel-flash,mx29gl320e,macronix,32mbit,top-boot',
  },
  {
    name: 'MX29GL320EB',
    packageType:
      '48pin TSOP nebo 48-ball LFBGA (6×8 mm) — stejné piny jako MX29GL320ET (samostatný ' +
      'záznam), bez samostatného pinu VI/O (I/O úroveň vždy shodná s VCC)',
    value:
      'Paralelní NOR flash paměť, 32 Mbit, byte/word (x8/x16) přepínatelná, "Bottom Boot" ' +
      '(nesymetrické sektory dole), VCC 2,7–3,6 V, přístupová doba 70 ns',
    notes:
      'Macronix MX29GL320E T/B datasheet rev. 1.5 (říjen 2015), objednací kód např. ' +
      'MX29GL320EBTI-70G (48-TSOP) nebo MX29GL320EBXEI-70G (48-LFBGA). ⚠️ Součást stejné rodiny ' +
      'jako MX29GL320ET/EH/EL (samostatné záznamy) — MX29GL320EB je "Bottom Boot" varianta: ' +
      'stejná sektorová architektura jako ET (63× 64KB + 8× 8KB), ale malé 8KB boot sektory jsou ' +
      'umístěny na SPODU adresního prostoru (na rozdíl od ET, kde jsou nahoře) — WP#/ACC=Vil ' +
      'chrání dolní dva sektory. Všechny ostatní parametry (organizace paměti, buffery, ' +
      'bezpečnostní sektor, ochrana sektorů, elektrické charakteristiky, mezní hodnoty) shodné ' +
      's MX29GL320ET — viz jeho záznam pro plný popis.',
    tags: 'io,paměť,flash,paralelní,parallel-flash,mx29gl320e,macronix,32mbit,bottom-boot',
  },
  {
    name: 'MX29GL320EH',
    packageType:
      '56pin TSOP nebo 64-ball LFBGA (11×13 mm) — piny A0–A20, Q0–Q15/A-1, CE#, OE#, WE#, ' +
      'RESET#, WP#/ACC, RY/BY#, BYTE#, VCC, GND, ⚠️ navíc samostatný pin VI/O (na rozdíl od T/B ' +
      'variant, samostatné záznamy) — přesto musí být elektricky spojen se stejným napětím jako ' +
      'VCC (2,7–3,6 V), nejde o nezávislé napájení I/O',
    value:
      'Paralelní NOR flash paměť, 32 Mbit, byte/word (x8/x16) přepínatelná, uniformní sektory ' +
      '(Highest Address Sector Protected), VCC 2,7–3,6 V, přístupová doba 70 ns',
    notes:
      'Macronix MX29GL320E H/L datasheet rev. 1.5 (říjen 2015), objednací kód např. ' +
      'MX29GL320EHT2I-70G (56-TSOP) nebo MX29GL320EHXFI-70G (64-LFBGA). ⚠️ Součást stejné rodiny ' +
      'jako MX29GL320ET/EB/EL (samostatné záznamy), ale s uniformní sektorovou architekturou ' +
      '(64× 64KB stejně velkých sektorů, žádné malé boot sektory na rozdíl od T/B variant) — ' +
      'MX29GL320EH: WP#/ACC=Vil chrání NEJVYŠŠÍ adresní sektor (na rozdíl od EL, kde chrání ' +
      'nejnižší). Organizace paměti, buffery, bezpečnostní sektor, elektrické charakteristiky a ' +
      'mezní hodnoty jinak shodné s MX29GL320ET (viz jeho záznam pro plný popis) — 4 194 304 × ' +
      '8 bit / 2 097 152 × 16 bit, 16B/8slovní page read buffer, 32B/16slovní write buffer, ' +
      'extra 128slovní bezpečnostní sektor, CFI podpora, RY/BY#, RESET#, doba přístupu 70 ns, ' +
      'Industrial -40 až +85 °C, 100 000 cyklů, 20 let retence.',
    tags: 'io,paměť,flash,paralelní,parallel-flash,mx29gl320e,macronix,32mbit,uniform',
  },
  {
    name: 'MX29GL320EL',
    packageType:
      '56pin TSOP nebo 64-ball LFBGA (11×13 mm) — stejné piny jako MX29GL320EH (samostatný ' +
      'záznam), včetně samostatného pinu VI/O (musí být spojen se stejným napětím jako VCC)',
    value:
      'Paralelní NOR flash paměť, 32 Mbit, byte/word (x8/x16) přepínatelná, uniformní sektory ' +
      '(Lowest Address Sector Protected), VCC 2,7–3,6 V, přístupová doba 70 ns',
    notes:
      'Macronix MX29GL320E H/L datasheet rev. 1.5 (říjen 2015), objednací kód např. ' +
      'MX29GL320ELT2I-70G (56-TSOP) nebo MX29GL320ELXFI-70G (64-LFBGA). ⚠️ Součást stejné rodiny ' +
      'jako MX29GL320ET/EB/EH (samostatné záznamy) — MX29GL320EL má stejnou uniformní sektorovou ' +
      'architekturu jako EH (64× 64KB), ale WP#/ACC=Vil chrání NEJNIŽŠÍ adresní sektor (na rozdíl ' +
      'od EH, kde chrání nejvyšší). Všechny ostatní parametry shodné s MX29GL320ET/EH — viz jejich ' +
      'záznamy pro plný popis.',
    tags: 'io,paměť,flash,paralelní,parallel-flash,mx29gl320e,macronix,32mbit,uniform',
  },

  // Mikrokontroléry / SoC
  {
    name: 'ESP32-C3',
    packageType:
      'QFN32 (5×5 mm), 33 vývodů (32 pinů + spodní GND ploška), nutné vlastní napájecí ' +
      'a decouplovací obvody, RF anténní přizpůsobení a strapping rezistory dle aplikační poznámky — ' +
      'jde o holý čip, ne modul s anténou (na rozdíl např. od ESP32-WROOM)',
    value: 'Wi-Fi + BLE SoC, RISC-V 32bit @ do 160 MHz, 400 KB SRAM, 384 KB ROM, VDD 3,0–3,6 V',
    notes:
      'Espressif ESP32-C3 (rodina zahrnuje i ESP32-C3FN4/FH4 se 4 MB vestavěné flash). ' +
      '⚠️ Doplněno podle finálního datasheetu „ESP32-C3 Series" v1.1 (říjen 2021), který nahrazuje ' +
      'dříve zpracovanou preliminary verzi „ESP32-C3 Family" V0.6 — rozdíly oproti V0.6 jsou označeny ' +
      'níže. Ultra-nízkopříkonový SoC s jednojádrovým RISC-V procesorem (32bit, 4stupňová pipeline, ' +
      'RV32IMC, až 160 MHz, CoreMark skóre 407,22 @160 MHz = 2,55 CoreMark/MHz), podporuje 2,4 GHz ' +
      'Wi-Fi (802.11 b/g/n, do 150 Mbps) a Bluetooth LE (Bluetooth 5, Bluetooth mesh). ' +
      'Paměť: 384 KB ROM, 400 KB SRAM (z toho 16 KB cache), 8 KB RTC FAST SRAM, 4 kbit eFuse ' +
      '(1792 bitů pro uživatele). Podpora externí SPI/Dual-SPI/Quad-SPI/QPI flash až 16 MB. ' +
      'Periferie: 22× GPIO, 2× 12bit SAR ADC — ⚠️ upřesnění oproti V0.6 („6 kanálů" souhrnně): ADC1 ' +
      'má 5 kanálů a je tovarně kalibrovaný, ADC2 má jen 1 kanál a kalibrovaný není; ADC vzorkovací ' +
      'frekvence max 100 kSPS (⚠️ V0.6 uváděl chybně/odlišně až 2 Msps). Dále 1× teplotní senzor, ' +
      '3× SPI, 2× UART, 1× I2C, 1× I2S, RMT (IR dálkové ovládání, 2+2 kanály), 6kanálový LED PWM, ' +
      'GDMA (3+3 kanály), 1× TWAI (CAN, dle ISO 11898-1/CAN 2.0), JTAG. ' +
      '⚠️ Nově doplněný USB Serial/JTAG řadič (chybí v V0.6): plnorychlostní USB 2.0 (12 Mbit/s, ' +
      'nepodporuje 480 Mbit/s high-speed), integrovaná USB PHY, funguje jako CDC-ACM virtuální ' +
      'sériový port i JTAG adaptér, umožňuje programování flash a ladění CPU přes USB bez externího ' +
      'programátoru — piny GPIO18/GPIO19 slouží jako USB_D-/USB_D+. ' +
      'Zabezpečení: secure boot, XTS-AES šifrování flash, hardwarová akcelerace AES-128/256, SHA, ' +
      'RSA, HMAC, digitální podpis, generátor náhodných čísel. ' +
      'Napájení: VDDA(1,2)/VDD3P3_RTC/VDD3P3_CPU 3,0–3,6 V (typ. 3,3 V), doporučený zdroj proudu ' +
      '≥500 mA (pro zápis eFuse musí být VDD3P3_CPU ≤3,3 V). Absolutní max. napětí na napájecích ' +
      'pinech -0,3 až 3,6 V. ' +
      'Provozní teplota: ESP32-C3 -40 až 105 °C, ESP32-C3FN4 -40 až 85 °C, ESP32-C3FH4 -40 až 105 °C. ' +
      'Proudový odběr: aktivní TX až 335 mA @802.11b/1 Mbps/21 dBm (⚠️ V0.6 uváděl 325 mA — ' +
      'aktualizovaná hodnota z finálního měření), RX ~84–87 mA, modem-sleep 15–20 mA, ' +
      'light-sleep 130 µA, deep-sleep 5 µA, power-off 1 µA. Čtyři napájecí režimy (Active, ' +
      'Modem-sleep, Light-sleep, Deep-sleep) — finální datasheet už neuvádí samostatný ' +
      '„Hibernation mode" zmíněný v některých starších materiálech. ' +
      '⚠️ Strapping piny se liší od V0.6: finální datasheet uvádí GPIO2, GPIO8, GPIO9 ' +
      '(V0.6 uváděl GPIO8, GPIO9, GPIO10) — určují boot mód (SPI boot / download boot); ' +
      'kombinace GPIO8=0 a GPIO9=0 je neplatná. Je nutné na ně dbát při návrhu DPS ' +
      '(viz aplikační poznámky výrobce a Technical Reference Manual).',
    tags: 'io,mikrokontrolér,soc,esp32,esp32-c3,wifi,bluetooth,ble,risc-v,qfn32',
  },
  {
    name: 'ESP32',
    packageType:
      'QFN48, dvě varianty pouzdra: 6×6 mm (ESP32-D0WDQ6) nebo 5×5 mm (ESP32-D0WD, ESP32-D2WD, ' +
      'ESP32-S0WD), 48 vývodů + spodní GND ploška, piny číslovány proti směru hodinových ručiček — ' +
      'jde o holý čip, ne modul s anténou (na rozdíl např. od ESP32-WROOM-32)',
    value:
      'Wi-Fi + Bluetooth (Classic+BLE) SoC, 1–2× Xtensa LX6 32bit @ do 240 MHz, 520 KB SRAM, ' +
      '448 KB ROM, VDDA/VDD3P3 2,3–3,6 V',
    notes:
      'Espressif ESP32 Series datasheet V3.0 (2019) — starší a mnohem více periferiemi vybavený SoC ' +
      'než ESP32-C3 (samostatný záznam v této knihovně). ⚠️ Zcela odlišná architektura CPU (1 nebo 2× ' +
      'Xtensa LX6, 32bit, do 240 MHz, 7stupňová pipeline, podpora FPU a DSP instrukcí vs. ' +
      'jednojádrový RISC-V u ESP32-C3), odlišné pouzdro (QFN48 6×6/5×5 mm vs. QFN32 5×5 mm u C3), ' +
      'podporuje navíc klasický Bluetooth 4.2 BR/EDR (ne jen BLE) a řadu periferií, které ESP32-C3 ' +
      'nemá (Ethernet MAC, CAN/TWAI 2.0, Hall senzor, 2× 8bit DAC, 10× kapacitní touch senzor), ' +
      'ale na rozdíl od ESP32-C3 nemá nativní USB řadič (žádný USB Serial/JTAG). ' +
      'Rodina zahrnuje čtyři objednací kódy lišící se počtem jader, vestavěnou flash a pouzdrem: ' +
      'ESP32-D0WDQ6 (2 jádra, bez flash, QFN 6×6), ESP32-D0WD (2 jádra, bez flash, QFN 5×5), ' +
      'ESP32-D2WD (2 jádra, 16 Mbit/40 MHz vestavěná flash, QFN 5×5, provozní teplota jen -40 až ' +
      '105 °C kvůli vestavěné flash — ostatní varianty -40 až 125 °C) a ESP32-S0WD (1 jádro, bez ' +
      'flash, QFN 5×5, max. 160 MHz). Paměť: 448 KB ROM, 520 KB SRAM, 8 KB RTC FAST SRAM + 8 KB ' +
      'RTC SLOW SRAM, 1 Kbit eFuse (256 bitů systémových, 768 bitů pro uživatele). Podpora externí ' +
      'QSPI flash/SRAM až 16 MB (flash) / 8 MB (SRAM) přes cache/MMU. Wi-Fi 802.11 b/g/n do 150 Mbps ' +
      '(TX výkon do 20,5 dBm), Bluetooth v4.2 BR/EDR + BLE dual mode (TX do +12 dBm, BLE citlivost ' +
      '-97 dBm). Periferie: 34× programovatelné GPIO, 2× 12bit SAR ADC (do 18 kanálů), 2× 8bit DAC, ' +
      '10× kapacitní touch senzor, 4× SPI, 2× I2S, 2× I2C, 3× UART, 1× SD/eMMC/SDIO host, 1× SDIO/SPI ' +
      'slave, Ethernet MAC (MII/RMII, DMA, IEEE 1588), CAN 2.0 (TWAI), IR TX/RX (8 kanálů), motor ' +
      'PWM, LED PWM až 16 kanálů, Hall senzor, pulzní čítač (8 kanálů). Zabezpečení: secure boot, ' +
      'šifrování flash, 1024bit OTP (768 bitů pro zákazníka), hardwarová akcelerace AES, SHA-2, RSA, ' +
      'ECC, generátor náhodných čísel (max. délka operace 4096 bitů). ' +
      'Napájení: VDDA/VDD3P3/VDD3P3_RTC 2,3–3,6 V (typ. 3,3 V), VDD3P3_CPU 1,8–3,6 V, doporučený ' +
      'zdroj proudu ≥500 mA. Absolutní mezní hodnoty: napájecí piny -0,3 až 3,6 V, kumulativní ' +
      'výstupní proud IO max 1200 mA, skladovací teplota -40 až 150 °C. Proudový odběr (RF, 3,3 V): ' +
      'Wi-Fi TX 802.11b DSSS 1 Mbps/+19,5 dBm typ. 240 mA, TX OFDM 54 Mbps/+16 dBm typ. 190 mA, TX ' +
      '802.11g MCS7/+14 dBm typ. 180 mA, RX 802.11b/g/n typ. 95–100 mA; BT/BLE TX @0 dBm typ. 130 mA, ' +
      'RX typ. 95–100 mA. Spolehlivost: ESD HBM ±1500 V / CDM ±500 V (JEDEC), MSL3. Strapping piny: ' +
      'MTDI, GPIO0, GPIO2, MTDO, GPIO5 (určují boot mód, napětí VDD_SDIO a další nastavení při resetu).',
    tags: 'io,mikrokontrolér,soc,esp32,wifi,bluetooth,ble,xtensa,qfn48',
  },
  {
    name: 'ESP8285',
    packageType:
      'QFN32 (5×5 mm), 32 vývodů + spodní GND ploška, piny číslovány proti směru hodinových ' +
      'ručiček — jde o holý čip, ne modul; vestavěná flash je uvnitř téhož pouzdra',
    value:
      'Wi-Fi SoC, Tensilica L106 32bit @ do 160 MHz, vestavěná 1 MB SPI flash, < 50 KB uživatelské ' +
      'RAM, VDD 2,7–3,6 V',
    notes:
      'Espressif ESP8285 datasheet v1.6 (prosinec 2018). ⚠️ Odlišná čipová rodina od ESP32/ESP32-C3 ' +
      '(samostatné záznamy v této knihovně) — jednojádrové jádro Tensilica L106 32bit RISC (ne ' +
      'Xtensa LX6 ani RISC-V), pouze Wi-Fi 802.11 b/g/n (HT20, žádné HT40), bez Bluetooth/BLE. ' +
      '⚠️ Odlišné od záznamu "Adafruit Feather HUZZAH ESP8266" (modul, kategorie Modul) — ESP8285 ' +
      'má 1 MB SPI flash vestavěnou přímo v pouzdře čipu (Dual SPI režim), zatímco ESP8266EX na ' +
      'desce Feather HUZZAH používá externí flash čip na modulu ESP-12 — jinak jde v jádru o ' +
      'vylepšenou/kompaktnější verzi téhož čipu (ESP8285 = ESP8266EX + integrovaná flash v 1 pouzdře, ' +
      'menší BOM a plocha DPS). RAM < 50 KB dostupné pro uživatelský program (Heap+Data ve Station ' +
      'módu), žádné programovatelné ROM v SoC — firmware se ukládá výhradně do (vestavěné) SPI flash. ' +
      'Wi-Fi: TX výkon 802.11b +20 dBm, 802.11g +17 dBm, 802.11n +14 dBm; RX citlivost 802.11b ' +
      '-91 dBm (11 Mbps), 802.11g -75 dBm (54 Mbps), 802.11n -72 dBm (MCS7); 2× virtuální Wi-Fi ' +
      'rozhraní, automatické sledování beaconů (hw TSF), anténní diverzita, módy Station/SoftAP/' +
      'SoftAP+Station/Promiscuous. Periferie: UART, SDIO, SPI/HSPI, I2C, I2S, IR dálkové ovládání, ' +
      'GPIO, ADC (1 kanál, sdílený s funkcí TOUT), PWM, LED Light & Button. Zabezpečení: WPA/WPA2, ' +
      'šifrování WEP/TKIP/AES, aktualizace firmwaru přes UART nebo OTA (přes síť). Napájení: VDDA/' +
      'VDD3P3/VDDPST/VDDD 2,7–3,6 V (dříve v datasheetu do V1.3 udávána minimální hodnota 3,0 V, ' +
      'zpřesněno na 2,7 V od V1.4). Mezní hodnoty: I/O VIL -0,3 až 0,25×VIO, VIH 0,75×VIO až 3,6 V, ' +
      'IMAX 12 mA, provozní teplota -40 až 125 °C, max. pájecí teplota 260 °C (IPC/JEDEC J-STD-020), ' +
      'ESD HBM 2 kV / CDM 0,5 kV. Proudový odběr (RF, 3,0 V, 50% duty cycle): TX 802.11b CCK ' +
      '11 Mbps/+17 dBm typ. 170 mA, TX 802.11g OFDM 54 Mbps/+15 dBm typ. 140 mA, TX 802.11n MCS7/' +
      '+13 dBm typ. 120 mA, RX 802.11b/g/n typ. 50–56 mA; průměrný provozní proud (mix TX/RX/idle) ' +
      'typ. 80 mA. Krystal: 24–52 MHz, zátěžová kapacita max 32 pF. Strapping/boot piny: GPIO2, ' +
      'GPIO0 a MTDO volí boot mód a SDIO mód; piny SDIO_CMD/SDIO_CLK/SDIO_DATA_0/SDIO_DATA_1 jsou ' +
      'interně vyhrazeny pro připojení vestavěné flash a nedoporučuje se je použít jinak.',
    tags: 'io,mikrokontrolér,soc,esp8285,esp8266,wifi,tensilica,qfn32',
  },
  {
    name: 'ESP8089',
    packageType:
      'QFN32 (5×5 mm), 32 vývodů + spodní ploška (Exp. DAP), stejný rozměr pouzdra jako ESP8266EX/' +
      'ESP8285, ale odlišný pinout (bez SD_DATA_2/GPIO pinů 12–15 v obdobné konfiguraci)',
    value:
      'Wi-Fi adaptér (SDIO/SPI slave) pro hostitelský procesor, 802.11 b/g/n, VDD 2,5–3,6 V, ' +
      'VDDIO 1,8–3,3 V',
    notes:
      'Espressif ESP8089 datasheet v3.2 (červen 2017). ⚠️ Zásadně odlišná architektura od ESP8266/' +
      'ESP8285/ESP32/ESP32-C3 (samostatné záznamy v této knihovně) — ESP8089 NENÍ samostatně ' +
      'programovatelný SoC s uživatelským firmwarem ve flash. Je to čistě Wi-Fi "adaptér" (front-end ' +
      'radio + MAC), který se připojuje k hostitelskému aplikačnímu procesoru (typicky mobil, ' +
      'tablet, fotoaparát) přes SDIO 2.0, SPI nebo UART a poskytuje mu Wi-Fi konektivitu — nemá ' +
      'vlastní vestavěnou flash ani prostor pro uživatelský program, sám o sobě neběží žádná ' +
      'aplikační logika. Podporuje 802.11 b/g/n (HT20), Wi-Fi Direct (P2P), Miracast, SoftAP, STBC, ' +
      '1×1 a 2×1 MIMO, A-MPDU/A-MSDU agregaci s 0,4 µs guard interval. Integruje TR switch, RF balun, ' +
      'LNA, výkonový zesilovač a přizpůsobovací síť — vyžaduje minimum externích součástek (R, C, ' +
      'krystal, případně SAW filtr pro kompatibilitu s mobilními telefony). Výstupní výkon PA: ' +
      '+18,5 dBm typ. (802.11b CCK 11 Mbps), +19,5 dBm typ. (802.11b DSSS 1 Mbps), citlivost přijímače ' +
      'až -98 dBm (DSSS 1 Mbps). 16× GPIO (multiplexováno s hostitelským rozhraním, UART, SI a BT ' +
      'koexistenčními piny), vstup EXT_LFC pro externí 32,768 kHz RTC hodiny (jinak se použije ' +
      'interní LFC), předpřipravené piny pro BT/Wi-Fi koexistenci a BT clock-request. Nízkopříkonové ' +
      'režimy: OFF (CHIP_PU nízko, RTC vypnuto), DEEP_SLEEP (jen RTC, < 12 µA), SLEEP (jen RTC, ' +
      'krystal vypnut, probuzení přes MAC/host/RTC časovač/externí přerušení), WAKE-UP a ON. Spotřeba: ' +
      'deep sleep typ. 10 µA, power-save DTIM1 typ. 1,2 mA, DTIM3 typ. 0,86 mA, total shutdown ' +
      'typ. 0,5 µA, standby typ. 0,9 mA; vysílání 802.11b DSSS 1 Mbps/+19,5 dBm typ. 215 mA, CCK ' +
      '11 Mbps/+18,5 dBm typ. 197 mA, 802.11g OFDM 54 Mbps/+16 dBm typ. 145 mA, 802.11n MCS7/+14 dBm ' +
      'typ. 135 mA; příjem 60–62 mA. Mezní hodnoty: VDDIO 1,8–3,3 V, IMAX na pin 12 mA, provozní ' +
      'teplota -40 až 125 °C, skladovací -40 až 150 °C. Digitální IO piny mají obousměrnou tri-state ' +
      'strukturu s volitelnou funkcí "hold" (udržení posledního stavu při vypnutí napájení) a ' +
      'ochranu proti přepětí/ESD (snap-back obvod, ~6 V spouštěcí napětí).',
    tags: 'io,wifi,adaptér,sdio,esp8089,qfn32',
  },
  {
    name: 'ESP8684',
    packageType:
      'QFN24 (4×4 mm), 25 vývodů (24 pinů + spodní GND ploška), jde o holý čip, ne modul — nutné ' +
      'vlastní napájecí/decouplovací obvody a RF anténní přizpůsobení dle aplikační poznámky',
    value:
      'Wi-Fi + BLE SoC, RISC-V 32bit @ do 120 MHz, 272 KB SRAM, 576 KB ROM, volitelná vestavěná ' +
      'flash 2 nebo 4 MB, VDD 3,0–3,6 V',
    notes:
      'Espressif ESP8684 Series datasheet v2.0. ⚠️ Podle výrobce patří čipová řada ESP8684 do ' +
      '"skupiny ESP32-C2" (Espressif tuto řadu na trhu prodává i pod marketingovým označením ' +
      'ESP32-C2) — v knihovně veden pod přesným označením z datasheetu. ⚠️ Odlišné od ESP32-C3 ' +
      '(samostatný záznam) — menší a levnější čip: méně GPIO (14 vs. 22), nižší max. takt (120 MHz ' +
      'vs. 160 MHz), menší pouzdro (QFN24 4×4 mm vs. QFN32 5×5 mm), žádný USB Serial/JTAG řadič, ' +
      'jen 1 SAR ADC (do 5 kanálů) místo dvou u C3. Objednací kódy: ESP8684H2X (2 MB vestavěné ' +
      'flash), ESP8684H4X (4 MB vestavěné flash) — obě revize čipu v2.0 (nástupci starších ' +
      'ESP8684H2/H4 rev. v1.2 a nižší, verze v2.0 přidává cca 20 KB SRAM navíc). RISC-V ' +
      'jednojádrový 32bit procesor do 120 MHz (CoreMark 305,42 @120 MHz = 2,55 CoreMark/MHz). ' +
      'Paměť: 576 KB ROM, 272 KB SRAM (z toho 16 KB cache), 1024bit eFuse OTP (256 bitů pro ' +
      'uživatele). SPI flash v pouzdře běží standardně na 60 MHz (bez podpory auto-suspend). ' +
      'Wi-Fi 802.11 b/g/n (HT20, 1T1R do 72,2 Mbps), WMM, TX/RX A-MPDU/A-MSDU, immediate Block ACK, ' +
      'TXOP, 3 virtuální Wi-Fi rozhraní, anténní diverzita. Bluetooth LE 5,3 (certifikováno), ' +
      'vysoký výkon do +20 dBm, rychlosti 125 Kbps/500 Kbps/1 Mbps/2 Mbps, advertising extensions, ' +
      'interní koexistenční mechanismus Wi-Fi/BT sdílející jednu anténu. RF modul integruje anténní ' +
      'přepínač, balun, PA a LNA — výstupní výkon do +22 dBm (802.11b), +20 dBm (802.11n), BLE ' +
      'citlivost přijímače do -106 dBm @125 Kbps. Periferie: 3× SPI, 2× UART, I2C master, LED PWM ' +
      '(6 kanálů), GDMA (1 TX + 1 RX kanál), 12bit SAR ADC (do 5 kanálů, vzorkování do 100 kSPS), ' +
      'teplotní senzor, 54bit obecný časovač, 2× watchdog, 52bit systémový časovač, filtr glitchů ' +
      'hodinového signálu. Zabezpečení: secure boot, šifrování flash, hardwarová akcelerace ECC, ' +
      'SHA (FIPS PUB 180-4), generátor náhodných čísel. Napájecí režimy: Active, Modem-sleep, ' +
      'Light-sleep (typ. 140 µA), Deep-sleep (typ. 5 µA, zachováno napájení RTC), Power off ' +
      '(typ. 1 µA). Napájení: VDDA3P3/VDDA/VDD3P3_RTC/VDD3P3_CPU doporučeno 3,0–3,6 V (typ. 3,3 V), ' +
      'doporučený zdroj proudu ≥500 mA. Mezní hodnoty: napájecí piny -0,3 až 3,6 V, kumulativní ' +
      'výstupní proud IO max 730 mA, skladovací teplota -40 až 150 °C, doporučená okolní teplota ' +
      '-40 až 105 °C. Proudový odběr (RF, 3,3 V): Wi-Fi TX 802.11b 1 Mbps/+22 dBm špička 370 mA, ' +
      'TX 802.11g 54 Mbps/+20 dBm špička 320 mA, TX 802.11n HT20 MCS7/+19 dBm špička 300 mA, ' +
      'RX 802.11b/g/n špička 65 mA; BLE TX @20 dBm špička 320 mA, RX špička 62 mA. Spolehlivost: ' +
      'ESD HBM ±2000 V / CDM ±1000 V, HTOL/HTSL/LTSL/TCT/uHAST dle JEDEC — přísnější ESD hodnoty ' +
      'než starší ESP32-C3 (tam jen orientační údaje v revizích datasheetu).',
    tags: 'io,mikrokontrolér,soc,esp8684,esp32-c2,wifi,bluetooth,ble,risc-v,qfn24',
  },

  // Mikrokontroléry AVR
  {
    name: 'ATmega640',
    packageType: 'TQFP-100 / CBGA-100',
    value: '8bit AVR mikrokontrolér, 64 KB flash, 4 KB EEPROM, 8 KB SRAM, 86 GPIO, VCC 1,8–5,5 V',
    notes:
      'Atmel/Microchip ATmega640/1280/1281/2560/2561 (datasheet "Preliminary Summary", ' +
      'dok. 2549KS-AVR, rev. K, 01/07) — rodina pěti mikrokontrolérů sdílejících stejné jádro a ' +
      'periferie, lišících se jen velikostí paměti a počtem pinů (viz Table 2 "Configuration ' +
      'Summary" v datasheetu); zpracováno všech 5 členů rodiny v jednom kroku. ATmega640 = ' +
      'největší flash (64 KB) ve velkém pouzdru (86 GPIO). 8bit AVR RISC architektura (135 ' +
      'instrukcí, většina v 1 cyklu, 32×8 obecných pracovních registrů), do 16 MIPS @16 MHz. ' +
      'Paměť: 64 KB In-System programovatelná flash (10 000 cyklů), volitelná Boot Loader sekce ' +
      's nezávislými zámkovými bity a True Read-While-Write, 4 KB EEPROM (100 000 cyklů), 8 KB ' +
      'interní SRAM, do 64 KB volitelné externí paměti. Periferie: 2× 8bit časovač/čítač, 4× ' +
      '16bit časovač/čítač (samostatný prescaler, compare, capture), RTC s odděleným oscilátorem, ' +
      '12× 8bit PWM kanálů s rozlišením 2–16 bitů + output compare modulator, 16kanálový 10bit ' +
      'ADC, 4× programovatelný USART, master/slave SPI, TWI (I2C kompatibilní), programovatelný ' +
      'watchdog s vlastním oscilátorem, analogový komparátor, přerušení a probuzení při změně ' +
      'pinu. JTAG (IEEE std. 1149.1) s boundary-scan, on-chip debug, programování flash/EEPROM/' +
      'fuses/zámkových bitů přes JTAG. Zabezpečení: Power-on Reset, programovatelná Brown-out ' +
      'detekce, interní kalibrovaný oscilátor, externí i interní zdroje přerušení, 6 režimů ' +
      'spánku (Idle, ADC Noise Reduction, Power-save, Power-down, Standby, Extended Standby). ' +
      'Napájení/rychlost dle "speed grade": verze bez "V" 0–8 MHz @2,7–5,5 V nebo 0–16 MHz ' +
      '@4,5–5,5 V; verze "V" (nízkonapěťová, např. ATmega640V) 0–4 MHz @1,8–5,5 V nebo 0–8 MHz ' +
      '@2,7–5,5 V. Spotřeba (typ.): aktivní režim @1 MHz/1,8 V cca 510 µA, power-down @1,8 V cca ' +
      '0,1 µA. Provozní teplota -40 až 85 °C (průmyslový rozsah). RoHS/bezolovnaté provedení.',
    tags: 'io,mikrokontrolér,avr,atmega,atmega640,8bit',
  },
  {
    name: 'ATmega1280',
    packageType: 'TQFP-100 / CBGA-100',
    value: '8bit AVR mikrokontrolér, 128 KB flash, 4 KB EEPROM, 8 KB SRAM, 86 GPIO, VCC 1,8–5,5 V',
    notes:
      'Atmel/Microchip ATmega640/1280/1281/2560/2561 (dok. 2549KS-AVR, rev. K, 01/07) — součást ' +
      'stejné rodiny jako ATmega640/1281/2560/2561 (samostatné záznamy). ATmega1280 = dvojnásobná ' +
      'flash oproti ATmega640 (128 KB) ve stejném velkém pouzdru/pinoutu (86 GPIO, 12 PWM kanálů, ' +
      '4 USART, 16 ADC kanálů) — použit např. v deskách Arduino Mega. Architektura, periferie, ' +
      'JTAG, napájecí rozsahy a spotřeba shodné s ATmega640 (viz jeho záznam pro plný popis). ' +
      '4 KB EEPROM, 8 KB SRAM, do 64 KB volitelné externí paměti.',
    tags: 'io,mikrokontrolér,avr,atmega,atmega1280,8bit,arduino-mega',
  },
  {
    name: 'ATmega1281',
    packageType: 'TQFP-64 / QFN-64 (MLF-64)',
    value: '8bit AVR mikrokontrolér, 128 KB flash, 4 KB EEPROM, 8 KB SRAM, 54 GPIO, VCC 1,8–5,5 V',
    notes:
      'Atmel/Microchip ATmega640/1280/1281/2560/2561 (dok. 2549KS-AVR, rev. K, 01/07) — součást ' +
      'stejné rodiny jako ATmega640/1280/2560/2561 (samostatné záznamy). ⚠️ ATmega1281 má stejnou ' +
      'velikost flash jako ATmega1280 (128 KB), ale je v menším 64pinovém pouzdru s omezenější ' +
      'sadou periferií: 54 GPIO (ne 86), 6 PWM kanálů (ne 12), 2 USART (ne 4), 8kanálový ADC ' +
      '(ne 16) — port H, J, K, L a druhá/třetí/čtvrtá USART, DAC a 16bit časovače T/C4 a T/C5 ' +
      'jsou dostupné jen ve 100pinové verzi (ATmega1280/2560), ne zde. Architektura, JTAG, ' +
      'napájecí rozsahy a spotřeba shodné s ATmega640 (viz jeho záznam pro plný popis). ' +
      '4 KB EEPROM, 8 KB SRAM.',
    tags: 'io,mikrokontrolér,avr,atmega,atmega1281,8bit',
  },
  {
    name: 'ATmega2560',
    packageType: 'TQFP-100 / CBGA-100',
    value: '8bit AVR mikrokontrolér, 256 KB flash, 4 KB EEPROM, 8 KB SRAM, 86 GPIO, VCC 1,8–5,5 V',
    notes:
      'Atmel/Microchip ATmega640/1280/1281/2560/2561 (dok. 2549KS-AVR, rev. K, 01/07) — součást ' +
      'stejné rodiny jako ATmega640/1280/1281/2561 (samostatné záznamy). ATmega2560 = největší ' +
      'flash v rodině (256 KB) ve velkém pouzdru (86 GPIO, 12 PWM kanálů, 4 USART, 16 ADC kanálů) ' +
      '— nejpoužívanější člen rodiny, osazuje např. desky Arduino Mega 2560. Architektura, ' +
      'periferie, JTAG, napájecí rozsahy a spotřeba shodné s ATmega640 (viz jeho záznam pro plný ' +
      'popis). 4 KB EEPROM, 8 KB SRAM, do 64 KB volitelné externí paměti.',
    tags: 'io,mikrokontrolér,avr,atmega,atmega2560,8bit,arduino-mega',
  },
  {
    name: 'ATmega2561',
    packageType: 'TQFP-64 / QFN-64 (MLF-64)',
    value: '8bit AVR mikrokontrolér, 256 KB flash, 4 KB EEPROM, 8 KB SRAM, 54 GPIO, VCC 1,8–5,5 V',
    notes:
      'Atmel/Microchip ATmega640/1280/1281/2560/2561 (dok. 2549KS-AVR, rev. K, 01/07) — součást ' +
      'stejné rodiny jako ATmega640/1280/1281/2560 (samostatné záznamy). ⚠️ ATmega2561 má stejnou ' +
      'velikost flash jako ATmega2560 (256 KB), ale je v menším 64pinovém pouzdru s omezenější ' +
      'sadou periferií (obdoba vztahu ATmega1281↔ATmega1280): 54 GPIO (ne 86), 6 PWM kanálů ' +
      '(ne 12), 2 USART (ne 4), 8kanálový ADC (ne 16) — porty H/J/K/L, DAC a časovače T/C4, T/C5 ' +
      'nejsou dostupné. Architektura, JTAG, napájecí rozsahy a spotřeba shodné s ATmega640 (viz ' +
      'jeho záznam pro plný popis). 4 KB EEPROM, 8 KB SRAM.',
    tags: 'io,mikrokontrolér,avr,atmega,atmega2561,8bit',
  },
  {
    name: 'AT90CAN128',
    packageType:
      '64pin TQFP (balení "A2 64", gull-wing) nebo 64pin QFN (balení "Z64-2", exponovaná ' +
      'chladicí ploška 6,0×6,0 mm, interně spojená s GND, nutno připájet/přilepit pro mechanickou ' +
      'stabilitu) — 53 programovatelných GPIO, porty A–G (A/B/C/D/E 8bit, F 8bit sdílený s ADC, ' +
      'G 5bit)',
    value:
      '8bit AVR mikrokontrolér s vestavěným CAN 2.0A/2.0B řadičem (ISO 16845 certifikován), ' +
      '128 KB flash, 4 KB EEPROM, 4 KB SRAM, do 16 MIPS @16 MHz, VCC 2,7–5,5 V',
    notes:
      'Atmel AT90CAN128 (datasheet "Preliminary Summary", dok. 4250CS-CAN, rev. 03/04). ' +
      '⚠️ Doplněno dle novějšího společného datasheetu "AT90CAN32/64/128" (dok. 7679HS-CAN, ' +
      'rev. 08/08), který AT90CAN32/64/128 popisuje jednotně: CAN 2.0A/2.0B řadič je ISO 16845 ' +
      'certifikován (nezmíněno v původním 2004 datasheetu). ⚠️ Přesné objednací/pouzdrové kódy: ' +
      'TQFP64 = "A2 64", QFN64 pro AT90CAN128/64 = "Z64-2" (exponovaná ploška 6,0 mm — odlišná ' +
      'od AT90CAN32, který má menší QFN "Z64-1" s exponovanou ploškou 5,4 mm, viz záznam ' +
      'AT90CAN32). Dostupné i bezolovnaté "Green"/RoHS varianty (přípona "U" v objednacím kódu, ' +
      'např. AT90CAN128-16AU/16MU) vedle standardních "I" variant. ⚠️ Rozpor mezi zdroji: brožura ' +
      'Atmel "Microcontroller Solutions for CAN Networking" (dok. 4012D-CAN, 07/05) uváděla i ' +
      'automotive gradovanou variantu -40 až +125 °C, ale společný datasheet 7679HS-CAN (2008) ' +
      'v objednací tabulce uvádí jen "Industrial (-40° to +85°C)" a jeho disclaimer explicitně ' +
      'píše "Atmels products are not intended, authorized, or warranted for use in automotive ' +
      'applications" — u aktuálně kupované součástky je třeba ověřit u výrobce, zda automotive ' +
      'varianta skutečně existuje/je stále vyráběna. Stejné jádro AVR RISC jako rodina ' +
      'ATmega640/1280/1281/2560/2561 (samostatné záznamy), ale navíc obsahuje vestavěný CAN ' +
      'řadič 2.0A/2.0B — funkce, kterou ATmega640 řada nemá; výrobce navíc uvádí, že ATmega128 ' +
      'lze zpětně zkompatibilnit s AT90CAN128 dle aplikační poznámky AVR096. ' +
      '133 instrukcí (většina v 1 cyklu), 32×8 obecných pracovních registrů, on-chip 2cyklová ' +
      'násobička, do 16 MIPS @16 MHz. Paměť: 128 KB In-System programovatelná flash (10 000 ' +
      'cyklů) s volitelnou Boot Loader sekcí (1K/2K/4K/8K bytů, programovatelná přes CAN nebo ' +
      'UART), 4 KB EEPROM (100 000 cyklů), 4 KB interní SRAM, do 64 KB volitelné externí paměti, ' +
      'zámek programu proti kopírování. CAN řadič 2.0A/2.0B: 15 plně nezávislých message objektů ' +
      's vlastními identifikátory a maskami, režimy Transmit/Receive/Automatic Reply/Frame Buffer ' +
      'Receive, max. přenosová rychlost 1 Mbit/s @8 MHz, časové razítko zpráv, TTC (Time Trigger ' +
      'Communication) a Listening mode s podporou autobaud detekce. JTAG (IEEE std. 1149.1) ' +
      's boundary-scan, on-chip debug, programování flash/EEPROM/zámkových/fuse bitů přes JTAG. ' +
      'Periferie: 8bit synchronní časovač/čítač T/C0 (10bit prescaler, output compare/8bit PWM), ' +
      '8bit asynchronní T/C2 (10bit prescaler, output compare/8bit PWM, 32,768kHz oscilátor pro ' +
      'RTC), 2× 16bit synchronní T/C1 a T/C3 (10bit prescaler, input capture s potlačením šumu, ' +
      '3× output compare/16bit PWM, output compare modulator), 8kanálový 10bit SAR ADC (8 ' +
      'single-ended, 7 diferenciálních, 2 diferenciální s programovatelným ziskem 1×/10×/200×), ' +
      'analogový komparátor, 2vodičové sériové rozhraní (TWI/I2C kompatibilní), 2× programovatelný ' +
      'USART, master/slave SPI (hardwarové ISP programování). Zabezpečení: Power-on Reset, ' +
      'programovatelná Brown-out detekce, interní kalibrovaný RC oscilátor, 8 externích zdrojů ' +
      'přerušení, 5 režimů spánku (Idle, ADC Noise Reduction, Power-save, Power-down, Standby), ' +
      'softwarově volitelný hodinový kmitočet, globální vypnutí interních pull-up rezistorů. ' +
      'Napájení/rychlost: VCC 2,7–5,5 V, max. 8 MHz @2,7 V nebo 16 MHz @4,5 V (průmyslový ' +
      'teplotní rozsah). Provozní teplota -40 až +85 °C (industrial). ⚠️ Datasheet je "Preliminary ' +
      'Summary" — elektrické charakteristiky (DC parametry, přesné mezní hodnoty) v něm chybí, ' +
      'typické hodnoty vycházejí ze simulací a charakterizace příbuzných AVR čipů na stejné ' +
      'technologii, min/max hodnoty budou doplněny po charakterizaci konkrétního čipu výrobcem. ' +
      'Součást produktové řady AT90CAN32/64/128 (AVR jádro) a T89C51CC01/02, AT89C51CC03 (8051 ' +
      'jádro, samostatné záznamy) — všech 6 typů sdílí kompatibilní CAN periferii a jsou ' +
      'doporučeny s párovým CAN transceiverem ATA6660.',
    tags: 'io,mikrokontrolér,avr,at90can128,can,8bit,tqfp64,qfn64',
  },
  {
    name: 'AT90CAN32',
    packageType:
      '64pin TQFP (balení "A2 64", gull-wing) nebo 64pin QFN (balení "Z64-1", ⚠️ menší exponovaná ' +
      'chladicí ploška 5,4×5,4 mm — odlišná od AT90CAN64/128, které mají "Z64-2" s plochou ' +
      '6,0×6,0 mm) — porty A/B/C/D/E/F/G shodné s AT90CAN128',
    value:
      '8bit AVR mikrokontrolér s vestavěným CAN 2.0A/2.0B řadičem (ISO 16845 certifikován), ' +
      '32 KB flash, 1 KB EEPROM, 2 KB SRAM, do 16 MIPS @16 MHz, VCC 2,7–5,5 V',
    notes:
      'Atmel AT90CAN32 — nejmenší člen řady AT90CAN32/64/128 (samostatné záznamy AT90CAN64, ' +
      'AT90CAN128; plný popis architektury, periferií a CAN řadiče viz záznam AT90CAN128). ' +
      '⚠️ Doplněno dle společného datasheetu "AT90CAN32/64/128" (dok. 7679HS-CAN, rev. 08/08), ' +
      'který nahrazuje dříve zpracovanou brožuru Atmel "Microcontroller Solutions for CAN ' +
      'Networking" (dok. 4012D-CAN, 07/05, jen souhrnná tabulka) — nyní k dispozici skutečný ' +
      'sdílený datasheet pro AT90CAN32/64/128 (registrová mapa, pinout, pouzdra), byť stále bez ' +
      'detailní tabulky DC elektrických charakteristik. Flash 32 KB (+ volitelná boot sekce do ' +
      '8 KB), EEPROM 1 KB, SRAM 2 KB. CAN řadič: 15 programovatelných message objektů, ISO 16845 ' +
      'certifikován. Sebeprogramování přes CAN i UART jen pomocí vlastního (custom) bootloaderu. ' +
      'SPI, JTAG, detekce výpadku napájení (power fail detect) — vše přítomno stejně jako u ' +
      'AT90CAN128. 4× 16bit časovač (0/1/2/3), 8kanálový PWM, 8kanálový 10bit ADC, 21bit ' +
      'watchdog, 2× UART, TWI (I2C kompatibilní). Napájení 2,7–5,5 V, max. 16 MHz. Provozní ' +
      'teplota dle objednací tabulky jen -40 až +85 °C (Industrial) — ⚠️ dřívější brožura uváděla ' +
      'i automotive variantu -40 až +125 °C, ale ta v tomto novějším oficiálním datasheetu není ' +
      'uvedena a jeho disclaimer výslovně říká, že produkty nejsou určeny pro automotive aplikace; ' +
      'u konkrétního nakupovaného kusu ověř aktuální stav u výrobce. Dostupné i bezolovnaté ' +
      '"Green"/RoHS varianty (přípona "U", např. AT90CAN32-16AU/16MU). Starší AVR čipy tohoto ' +
      'typu bývají postupně nahrazovány novějšími řadami (např. ATmega32/64/128M1 s CAN) — ověř ' +
      'aktuální dostupnost u výrobce.',
    tags: 'io,mikrokontrolér,avr,at90can32,can,8bit,tqfp64,qfn64',
  },
  {
    name: 'AT90CAN64',
    packageType:
      '64pin TQFP (balení "A2 64", gull-wing) nebo 64pin QFN (balení "Z64-2", exponovaná ' +
      'chladicí ploška 6,0×6,0 mm — shodné s AT90CAN128) — porty A/B/C/D/E/F/G shodné s ' +
      'AT90CAN128',
    value:
      '8bit AVR mikrokontrolér s vestavěným CAN 2.0A/2.0B řadičem (ISO 16845 certifikován), ' +
      '64 KB flash, 2 KB EEPROM, 4 KB SRAM, do 16 MIPS @16 MHz, VCC 2,7–5,5 V',
    notes:
      'Atmel AT90CAN64 — prostřední člen řady AT90CAN32/64/128 (samostatné záznamy AT90CAN32, ' +
      'AT90CAN128; plný popis architektury, periferií a CAN řadiče viz záznam AT90CAN128). ' +
      '⚠️ Doplněno dle společného datasheetu "AT90CAN32/64/128" (dok. 7679HS-CAN, rev. 08/08), ' +
      'který nahrazuje dříve zpracovanou brožuru Atmel "Microcontroller Solutions for CAN ' +
      'Networking" (dok. 4012D-CAN, 07/05, jen souhrnná tabulka). Flash 64 KB (+ volitelná boot ' +
      'sekce do 8 KB), EEPROM 2 KB, SRAM 4 KB — shodná paměť SRAM jako AT90CAN128, ale poloviční ' +
      'flash. CAN řadič: 15 programovatelných message objektů, ISO 16845 certifikován. ' +
      'Sebeprogramování přes CAN i UART jen pomocí vlastního (custom) bootloaderu. SPI, JTAG, ' +
      'detekce výpadku napájení — vše přítomno stejně jako u AT90CAN128. 4× 16bit časovač ' +
      '(0/1/2/3), 8kanálový PWM, 8kanálový 10bit ADC, 21bit watchdog, 2× UART, TWI. Napájení ' +
      '2,7–5,5 V, max. 16 MHz. Provozní teplota dle objednací tabulky jen -40 až +85 °C ' +
      '(Industrial) — ⚠️ dřívější brožura uváděla i automotive variantu -40 až +125 °C, ale ta ' +
      'v tomto novějším oficiálním datasheetu není uvedena a jeho disclaimer výslovně říká, že ' +
      'produkty nejsou určeny pro automotive aplikace; u konkrétního nakupovaného kusu ověř ' +
      'aktuální stav u výrobce. Dostupné i bezolovnaté "Green"/RoHS varianty (přípona "U", ' +
      'např. AT90CAN64-16AU/16MU).',
    tags: 'io,mikrokontrolér,avr,at90can64,can,8bit,tqfp64,qfn64',
  },

  // Mikrokontroléry 8051
  {
    name: 'T89C51CC02',
    packageType: 'SOIC24, SOIC28, PLCC28 nebo TQFP32',
    value:
      '8051 (C51) mikrokontrolér s vestavěným CAN 2.0A/2.0B řadičem, 16 KB flash, 2 KB EEPROM, ' +
      '0,5 KB RAM, do 5 MIPS @30 MHz, VCC 3–5,5 V',
    notes:
      'Atmel T89C51CC02 — nejmenší/nejlevnější člen řady CAN mikrokontrolérů na architektuře ' +
      'Intel 8051 (na rozdíl od AVR jádra u AT90CAN32/64/128, samostatné záznamy). Zpracováno ' +
      'dle srovnávací tabulky v brožuře Atmel "Microcontroller Solutions for CAN Networking" ' +
      '(dok. 4012D-CAN, 07/05) — obsahuje jen souhrnné parametry, ne plný detailní datasheet. ' +
      '5 MIPS @30 MHz (6 hodinových cyklů/instrukce — díky tomu dosahuje 1 Mbit/s CAN přenosové ' +
      'rychlosti už s levným 8MHz krystalem a nižším EMI rušením). Flash 16 KB (+ 2 KB boot ' +
      'sekce), EEPROM 2 KB, RAM jen 0,5 KB. CAN řadič: pouze 4 programovatelné message objekty ' +
      '(oproti 15 u ostatních dílů řady — nejomezenější CAN implementace v rodině). Sebeprogramování ' +
      'přes CAN i UART. Bez SPI, bez JTAG, bez detekce výpadku napájení. 3× 16bit časovač ' +
      '(0/1/2), 2 kanály PCA (Programmable Counter Array), 2kanálový PWM, 8kanálový 10bit ADC, ' +
      '21bit watchdog, 1× UART. Porty 0/1/2/3 (standardní 8051 značení). Napájení 3–5,5 V, max. ' +
      '60 MHz. Provozní teplota -40 až +85 °C (bez uvedené automotive varianty na rozdíl od ' +
      'ostatních dílů řady). Podpora vyšších protokolových vrstev CANopen, DeviceNet, J1939, OSEK.',
    tags: 'io,mikrokontrolér,8051,c51,t89c51cc02,can',
  },
  {
    name: 'T89C51CC01',
    packageType: 'TQFP44, PLCC44, BGA64, TQFP64 nebo PLCC52',
    value:
      '8051 (C51) mikrokontrolér s vestavěným CAN 2.0A/2.0B řadičem, 32 KB flash, 2 KB EEPROM, ' +
      '1,2 KB RAM, do 5 MIPS @30 MHz, VCC 3–5,5 V',
    notes:
      'Atmel T89C51CC01 — střední člen řady 8051 CAN mikrokontrolérů (viz T89C51CC02 pro ' +
      'nejmenší a AT89C51CC03 pro největší; oba samostatné záznamy). Zpracováno dle srovnávací ' +
      'tabulky v brožuře Atmel "Microcontroller Solutions for CAN Networking" (dok. 4012D-CAN, ' +
      '07/05). 5 MIPS @30 MHz. Flash 32 KB (+ 2 KB boot sekce, dostupná i ROM verze), EEPROM ' +
      '2 KB, RAM 1,2 KB. CAN řadič: 15 programovatelných message objektů (na rozdíl od jen 4 ' +
      'u T89C51CC02). Sebeprogramování přes CAN i UART. Bez SPI, bez JTAG, bez detekce výpadku ' +
      'napájení. 3× 16bit časovač (0/1/2), 5 kanálů PCA, 5kanálový PWM, 8kanálový 10bit ADC, ' +
      '21bit watchdog, 1× UART. Porty 0/1/2/3. Napájení 3–5,5 V, max. 60 MHz. Provozní teplota ' +
      '-40 až +85 °C (industrial), dostupná i automotive gradovaná varianta -40 až +125 °C.',
    tags: 'io,mikrokontrolér,8051,c51,t89c51cc01,can',
  },
  {
    name: 'AT89C51CC03',
    packageType: 'TQFP44, PLCC44 nebo BGA64',
    value:
      '8051 (C51) mikrokontrolér s vestavěným CAN 2.0A/2.0B řadičem, 64 KB flash, 2 KB EEPROM, ' +
      '2,2 KB RAM, do 5 MIPS @30 MHz, VCC 3–5,5 V',
    notes:
      'Atmel AT89C51CC03 — největší/nejvybavenější člen řady 8051 CAN mikrokontrolérů (viz ' +
      'T89C51CC01/T89C51CC02, samostatné záznamy). Zpracováno dle srovnávací tabulky v brožuře ' +
      'Atmel "Microcontroller Solutions for CAN Networking" (dok. 4012D-CAN, 07/05). 5 MIPS ' +
      '@30 MHz. Flash 64 KB (+ 2 KB boot sekce), EEPROM 2 KB, RAM 2,2 KB — nejvíc RAM z celé ' +
      '8051 CAN řady. CAN řadič: 15 programovatelných message objektů. Sebeprogramování přes ' +
      'CAN i UART. ⚠️ Jediný z 8051 trojice s vestavěným SPI a s detekcí výpadku napájení (Power ' +
      'Fail Detect) — T89C51CC01/CC02 tyto periferie nemají. Bez JTAG. 3× 16bit časovač (0/1/2), ' +
      '5 kanálů PCA, 5kanálový PWM, 8kanálový 10bit ADC, 21bit watchdog, 1× UART. Porty 0/1/2/3. ' +
      'Napájení 3–5,5 V, max. 60 MHz. Provozní teplota -40 až +85 °C (industrial), dostupná i ' +
      'automotive gradovaná varianta -40 až +125 °C.',
    tags: 'io,mikrokontrolér,8051,c51,at89c51cc03,can',
  },

  // Senzory
  {
    name: 'DS18B20',
    packageType:
      'TO-92 (3 vývody: 1=GND, 2=DQ, 3=VDD, model DS18B20), 8pin SO 150 mil (model DS18B20Z: ' +
      '3=VDD, 4=DQ, 5=GND, ostatní NC) nebo 8pin µSOP (model DS18B20U: 1=DQ, 4=GND, 8=VDD, ' +
      'ostatní NC) — vyžaduje externí pull-up rezistor ~4,7 kΩ na DQ (open-drain 1-Wire výstup)',
    value:
      'Digitální teploměr s programovatelným rozlišením, 1-Wire rozhraní, -55 až +125 °C, ' +
      '±0,5 °C přesnost (-10 až +85 °C), VDD 3,0–5,5 V (nebo parazitní napájení z DQ)',
    notes:
      'Maxim Integrated DS18B20 "Programmable Resolution 1-Wire Digital Thermometer" (finální ' +
      'produkční datasheet REV: 042208) — ⚠️ doplněno podle finální verze, která nahrazuje dříve ' +
      'zpracovaný Preliminary datasheet Dallas Semiconductor (dok. 050400); rozdíly oproti němu ' +
      'jsou označeny níže. ⚠️ Přibylo třetí pouzdro — 8pin µSOP (DS18B20U), vedle již uvedených ' +
      'TO-92 (DS18B20) a 8pin SO (DS18B20Z); kompletní objednací matice zahrnuje i bezolovnaté ' +
      '"+" varianty a balení tape&reel (T&R). ⚠️ Nově uvedena softwarová kompatibilita s DS1822 ' +
      '(chybí v Preliminary verzi). ⚠️ Přidána nová specifikace "Drift" ±0,2 °C (na základě ' +
      '1000hodinového zátěžového testu @125 °C/VDD=5,5 V) a "Time to Strong Pullup On" tSPON ' +
      'max 10 µs (upřesnění dřívějšího obecného požadavku "do 10 µs" ze sekce Parasite Power). ' +
      'Komunikuje po jediném datovém vodiči (1-Wire, DQ) + zemi — napájení lze odebírat přímo ' +
      'z datové linky ("parazitní napájení" přes interní kondenzátor, VDD pin se pak musí ' +
      'uzemnit) nebo připojit externí VDD 3,0–5,5 V. Každý kus má unikátní 64bit laserem vypálený ' +
      'ROM kód (8bit rodinný kód 28h + 48bit sériové číslo + 8bit CRC), takže lze na jednu 1-Wire ' +
      'sběrnici připojit libovolný počet čidel současně (multidrop) a adresovat je jednotlivě ' +
      'příkazy Match ROM / Search ROM / Skip ROM / Alarm Search. Rozlišení převodu teploty ' +
      'programovatelné 9–12 bitů (konfigurační registr, výchozí nastavení z výroby 12 bitů = ' +
      '0,0625 °C/LSB) s dobou převodu závislou na rozlišení: 9bit max 93,75 ms, 10bit max ' +
      '187,5 ms, 11bit max 375 ms, 12bit max 750 ms. Nonvolatilní EEPROM (min. 50 000 zápisů, ' +
      '10 let retence dat @+55 °C) uchovává uživatelsky nastavitelné meze alarmu TH/TL (nebo je ' +
      'lze použít jako obecnou 2bajtovou paměť) a konfigurační registr rozlišení. Příkaz "Alarm ' +
      'Search" umožňuje na sběrnici okamžitě identifikovat jen čidla, jejichž poslední naměřená ' +
      'teplota překročila nastavené meze, bez nutnosti číst všechna čidla. Mezní hodnoty: napětí ' +
      'na libovolném pinu vůči zemi -0,5 až +6,0 V, provozní/skladovací teplota -55 až +125 °C, ' +
      'pájecí teplota dle IPC/JEDEC J-STD-020. Doporučené provozní podmínky: VDD 3,0–5,5 V, log. 1 ' +
      '(VIH) min 2,2 V (local power) / min 3,0 V (parasite power), log. 0 (VIL) max 0,8 V. ' +
      'Proudový odběr: klidový (standby) typ. 750 nA (max 1000 nA, měřeno do 70 °C, při 125 °C ' +
      'typicky 3 µA), aktivní (převod teploty nebo zápis do EEPROM) typ. 1 mA (max 1,5 mA @VDD=5V; ' +
      'zápis do EEPROM odebírá navíc cca 200 µA po dobu až 10 ms). Chyba teploměru: ±0,5 °C ' +
      'v rozsahu -10 až +85 °C, ±2 °C v rozsahu -55 až +125 °C. Vstupní/výstupní kapacita DQ ' +
      'max 25 pF. Časování 1-Wire sběrnice (nutné dodržet v aplikaci): reset pulz min. 480 µs, ' +
      'time slot 60–120 µs, zotavovací doba min. 1 µs mezi bity; při parazitním napájení může ' +
      'tRSTL > 960 µs vyvolat power-on reset.',
    tags: 'io,senzor,teploměr,ds18b20,1-wire,dallas,maxim',
  },
  {
    name: 'DS1822',
    packageType:
      'TO-92 (3 vývody: 1=GND, 2=DQ, 3=VDD, model DS1822) nebo DS1822Z 8pin SO 150 mil ' +
      '(funkční piny 3=VDD, 4=DQ, 5=GND, ostatní NC) — vyžaduje externí pull-up rezistor ' +
      '~4,7 kΩ na DQ (open-drain 1-Wire výstup)',
    value:
      'Digitální teploměr "Econo" s programovatelným rozlišením, 1-Wire rozhraní, -55 až ' +
      '+125 °C, ±2,0 °C přesnost (-10 až +85 °C), VDD 3,0–5,5 V (nebo parazitní napájení z DQ)',
    notes:
      'Dallas/Maxim DS1822 "Econo 1-Wire Digital Thermometer" (dok. 101107). ⚠️ Odlišný ' +
      'objednací díl od DS18B20 (samostatný záznam) — DS1822 je levnější "econo" verze se ' +
      'stejným pouzdrem, pinoutem a softwarovým/protokolovým rozhraním (uvádí se jako ' +
      'softwarově kompatibilní s DS18B20 a lze jej naprogramovat/číst stejnými příkazy), ale ' +
      's výrazně horší přesností měření: ±2,0 °C v rozsahu -10 až +85 °C a ±3 °C v rozsahu ' +
      '-55 až +125 °C (u DS18B20 ±0,5 °C resp. ±2 °C). Má také jiný 1-Wire rodinný kód v ROM ' +
      '(22h, zatímco DS18B20 má 28h) — na stejné sběrnici jsou proto oba typy rozlišitelné a ' +
      'vzájemně zaměnitelné jen na úrovni funkce, ne na úrovni typu čidla. Komunikuje po ' +
      'jediném datovém vodiči (1-Wire, DQ) + zemi — napájení lze odebírat přímo z datové linky ' +
      '("parazitní napájení" přes interní kondenzátor, VDD pin se pak musí uzemnit) nebo ' +
      'připojit externí VDD 3,0–5,5 V. Každý kus má unikátní 64bit laserem vypálený ROM kód ' +
      '(8bit rodinný kód 22h + 48bit sériové číslo + 8bit CRC), takže lze na jednu 1-Wire ' +
      'sběrnici připojit libovolný počet čidel současně (multidrop) a adresovat je jednotlivě ' +
      'příkazy Match ROM / Search ROM / Skip ROM / Alarm Search. Rozlišení převodu teploty ' +
      'programovatelné 9–12 bitů (konfigurační registr, výchozí nastavení z výroby 12 bitů = ' +
      '0,0625 °C/LSB) s dobou převodu závislou na rozlišení: 9bit max 93,75 ms, 10bit max ' +
      '187,5 ms, 11bit max 375 ms, 12bit max 750 ms. Nonvolatilní EEPROM (uchovává uživatelsky ' +
      'nastavitelné meze alarmu TH/TL nebo obecnou 2bajtovou paměť) a konfigurační registr ' +
      'rozlišení. Příkaz "Alarm Search" umožňuje na sběrnici okamžitě identifikovat jen čidla, ' +
      'jejichž poslední naměřená teplota překročila nastavené meze. Mezní hodnoty: napětí na ' +
      'libovolném pinu vůči zemi -0,5 až +6,0 V, provozní/skladovací teplota -55 až +125 °C, ' +
      'pájení dle IPC/JEDEC J-STD-020A (dip) nebo do +220 °C (reflow). Doporučené provozní ' +
      'podmínky: VDD 3,0–5,5 V, log. 1 (VIH) min 2,2 V (local power) / min 3,0 V (parasite ' +
      'power), log. 0 (VIL) max 0,8 V. Proudový odběr: klidový (standby) typ. 750 nA (max ' +
      '1000 nA, měřeno do 70 °C, při 125 °C typicky 3 µA), aktivní (převod teploty nebo zápis ' +
      'do EEPROM) typ. 1 mA (max 1,5 mA @VDD=5V). Drift ±0,2 °C (1000hodinový zátěžový test ' +
      '@125 °C/VDD=5,5 V). Vstupní/výstupní kapacita DQ max 25 pF. Časování 1-Wire sběrnice: ' +
      'reset pulz min. 480 µs, time slot 60–120 µs, zotavovací doba min. 1 µs mezi bity.',
    tags: 'io,senzor,teploměr,ds1822,1-wire,dallas,maxim,econo',
  },
  {
    name: 'TC625',
    packageType:
      'TO-92-3 (model "VZB": 1=DOUT, 2=VDD, 3=GND) nebo SOT-23A-5 (model "VNT", ekv. EIAJ ' +
      'SC-74A: 1=DOUT, 2=VDD, 3=GND, piny 4 a 5 nezapojené) — bez nutnosti externích součástek',
    value:
      'Jednovodičový (pulzně-šířkový) digitální teploměr, -25 až +100 °C, ±1 °C typ. přesnost ' +
      '(±1,5 °C v celém rozsahu), VDD 2,7–5,5 V',
    notes:
      'TelCom Semiconductor TC625 "1-Wire Digital Thermometer" (Preliminary Information, dok. ' +
      'TC625-01, 5/1997). ⚠️ Přes shodný název "1-Wire" jde o zcela odlišnou technologii než ' +
      'Dallas/Maxim DS18B20 a DS1822 (samostatné záznamy) — TC625 NEPOUŽÍVÁ digitální sběrnicový ' +
      'protokol s ROM adresací ani příkazovou sadu (Convert T, Match ROM apod.). Místo toho ' +
      'monolitický snímač (teplota→napětí převodník + delta-sigma modulátor) generuje na jediném ' +
      'pinu DOUT prostý pulzní signál, jehož poměr doby vysoké/nízké úrovně je přímo úměrný ' +
      'teplotě čipu — mikrokontrolér tak teplotu určí měřením času (čítačem/časovačem), bez ADC ' +
      'a bez sériového protokolu. Nelze proto adresovat více kusů na jedné sběrnici (žádný ' +
      'multidrop, žádné ROM kódy) tak jako u DS18B20/DS1822. Dva výstupní typy dle objednacího ' +
      'kódu: TC625C (komplementární/push-pull výstup DOUT, kódy TC625CVNT v SOT-23A-5 a ' +
      'TC625CVZB v TO-92-3) a TC625N (výstup s otevřeným kolektorem/drain, vyžaduje externí ' +
      'pull-up, kódy TC625NVNT v SOT-23A-5 a TC625NVZB v TO-92-3) — jinak elektricky shodné. ' +
      'Nevyžaduje žádné externí součástky (na rozdíl od DS18B20/DS1822 se doporučuje jen pro ' +
      'variantu N externí pull-up na DOUT, pro variantu C není potřeba nic). Nízkonapěťový ' +
      'provoz VDD 2,7–5,5 V. K dispozici byla vývojová sada TC625EV (evaluační kit pro TC625 ' +
      'a TC12 — není součástka, nedošlo k jejímu přidání do knihovny).',
    tags: 'io,senzor,teploměr,tc625,1-wire,telcom,pwm',
  },
  {
    name: 'DHT11',
    packageType:
      '4pin jednořadý THT modul (modrá plastová krabička), piny 1=VDD, 2=DATA, 3=nezapojen ' +
      '(NC), 4=GND — obsahuje interní 8bit mikrokontrolér, kombinovaný odporový vlhkoměr + NTC ' +
      'teploměr; k dispozici i speciální pouzdra na vyžádání u výrobce',
    value:
      'Digitální senzor vlhkosti a teploty, 20–90 %RH (±5 %RH), 0–50 °C (±2 °C), jednovodičové ' +
      'sériové rozhraní (proprietární, ne Dallas 1-Wire), VDD 3,0–5,5 V',
    notes:
      '"DHT11 Humidity & Temperature Sensor" datasheet (překlad výrobce, distribuce OSEPP). ' +
      '⚠️ Přes občasné označení "single-wire"/"1-wire" NEJDE o Dallas/Maxim 1-Wire protokol ' +
      '(na rozdíl od DS18B20/DS1822, samostatné záznamy) — DHT11 používá vlastní proprietární ' +
      'obousměrný jednovodičový protokol bez ROM adresace a bez možnosti více senzorů na jedné ' +
      'sběrnici (multidrop). ⚠️ Také odlišné od TC625 (samostatný záznam, čistě pulzně-šířkový ' +
      'výstup) — DHT11 posílá strukturovaný 40bitový datový rámec, ne prostý PWM signál. Na ' +
      'rozdíl od obou zmíněných teploměrů DHT11 navíc měří i relativní vlhkost vzduchu. Obsahuje ' +
      'odporový vlhkoměrný člen a NTC teploměrný člen připojené k vestavěnému 8bit ' +
      'mikrokontroléru s kalibračními koeficienty uloženými v OTP paměti. Rozlišení 1 %RH / 1 °C ' +
      '(8bit), opakovatelnost ±1 %RH / ±1 °C, přesnost vlhkosti ±4 %RH @25 °C (±5 %RH v celém ' +
      'rozsahu 0–50 °C), přesnost teploty ±2 °C, hystereze vlhkosti ±1 %RH, dlouhodobá stabilita ' +
      'typ. ±1 %RH/rok. Rozsah měření vlhkosti závisí na teplotě: @0 °C 30–90 %RH, @25 °C ' +
      '20–90 %RH, @50 °C 20–80 %RH. Doba odezvy (63 % hodnoty, 25 °C, proudění vzduchu 1 m/s): ' +
      'vlhkost 6–15 s, teplota 6–30 s. Komunikační protokol: MCU stáhne datovou linku na nízkou ' +
      'úroveň min. 18 ms (start signál), pustí ji a čeká 20–40 µs na odezvu; DHT11 odpoví 80 µs ' +
      'nízko + 80 µs vysoko, poté odešle 40 bitů dat (8bit celá část RH + 8bit desetinná část RH ' +
      '+ 8bit celá část T + 8bit desetinná část T + 8bit kontrolní součet) — každý bit začíná ' +
      '50 µs nízkou úrovní, délka následující vysoké úrovně určuje hodnotu bitu (26–28 µs = "0", ' +
      '70 µs = "1"). Jeden komunikační cyklus trvá cca 4 ms, minimální perioda vzorkování 1 s ' +
      '(nelze číst častěji). Doporučen pull-up rezistor 5 kΩ na DATA (kabel do 20 m) a ' +
      'filtrační kondenzátor 100 nF mezi VDD a GND. Proudový odběr: měření 0,5–2,5 mA, průměr ' +
      '0,2–1 mA, klidový (standby) 100–150 µA. Pájecí teplota max 260 °C, kontakt max 10 s. ' +
      'Skladování 10–40 °C, <60 %RH. Nedoporučeno pro bezpečnostní/nouzové aplikace.',
    tags: 'io,senzor,vlhkoměr,teploměr,dht11,jednovodičový',
  },
  {
    name: 'SHT71',
    packageType:
      'Kolíkové (pin-type) pouzdro 19,5 × 5,08 × 3,1 mm, hmotnost 168 mg (hlava senzoru 73 mg), ' +
      '4 vývody: 1=SCK, 2=VDD, 3=GND, 4=DATA — LCP krytka s epoxidovým zálitkem na FR4 substrátu, ' +
      'piny Cu/Be slitina pokovená Ni/Au, integrovaný 100nF kondenzátor mezi VDD/GND na rubu ' +
      'desky; piny lze pájet nebo vsadit do patice (např. Preci-dip/Mill-Max 851-93-004-20-001)',
    value:
      'Digitální senzor vlhkosti a teploty, 0–100 %RH (±3,0 %RH typ.), -40 až +123,8 °C ' +
      '(±0,4 °C typ.), digitální 2vodičové rozhraní (SCK+DATA), VDD 2,4–5,5 V',
    notes:
      'Sensirion "Datasheet SHT7x (SHT71, SHT75)" v4.1 (červenec 2008) — pokrývá dvě přesnostní ' +
      'třídy téže konstrukce sensoru v jednom dokumentu, zpracovány obě (SHT71 = základní ' +
      'přesnost, SHT75 = vyšší přesnost, samostatný záznam). ⚠️ Zcela odlišný komunikační ' +
      'protokol než ostatní senzory v knihovně — DS18B20/DS1822 používají adresovatelnou Dallas ' +
      '1-Wire sběrnici, DHT11 proprietární asynchronní jednovodičový protokol založený na časování ' +
      'pulzů, TC625 čistý PWM výstup — SHT7x má skutečné synchronní 2vodičové sériové rozhraní ' +
      '(SCK jako hodinový signál vždy řízený mikrokontrolérem, DATA obousměrný tri-state), ' +
      'elektricky podobné I2C, ale NENÍ I2C kompatibilní (nelze adresovat více senzorů standardním ' +
      'I2C protokolem, podporována jen adresa "000"). Kombinuje kapacitní vlhkoměrný člen a ' +
      'band-gap teploměrný člen s 14bit A/D převodníkem a OTP kalibrační pamětí na jednom čipu ' +
      '(CMOSens technologie). Vlhkost: rozlišení volitelné 8/12 bit (0,5/0,03 %RH), ' +
      'opakovatelnost ±0,1 %RH, hystereze ±1 %RH, nelinearita syrových dat ±3 %RH (po linearizaci ' +
      '<<1 %RH), doba odezvy τ63% 8 s, rozsah měření 0–100 %RH, dlouhodobý drift <0,5 %RH/rok. ' +
      'Teplota: rozlišení volitelné 12/14 bit (0,04/0,01 °C), opakovatelnost ±0,1 °C, rozsah ' +
      'měření -40 až +123,8 °C, doba odezvy τ63% 5–30 s, dlouhodobý drift <0,04 °C/rok. SHT71 ' +
      'přesnost: vlhkost typ. ±3,0 %RH (max dle grafu, nejhorší v krajních bodech 0 %RH a ' +
      '100 %RH), teplota typ. ±0,4 °C. Napájení VDD 2,4–5,5 V (doporučeno 3,3 V pro nejvyšší ' +
      'přesnost). Spotřeba: sleep 2–5 µW, měření typ. 3 mW, průměr 150 µW. Skladování 10–50 °C ' +
      '(krátkodobě do 80 °C), 20–60 %RH. Volitelný interní ohřívač (+5 až +10 °C nad okolí, ' +
      'odběr cca 8 mA @5 V) pro funkční diagnostiku. Detekce nízkého napájecího napětí (<2,47 V). ' +
      'Příkazy (přes status registr/command bity): Measure Temperature (00011), Measure RH ' +
      '(00101), Read/Write Status Register (00111/00110), Soft reset (11110, min. 11 ms čekání ' +
      'před dalším příkazem). Volitelný CRC-8 kontrolní součet.',
    tags: 'io,senzor,vlhkoměr,teploměr,sht71,sht7x,sensirion,2vodičové',
  },
  {
    name: 'SHT75',
    packageType:
      'Kolíkové (pin-type) pouzdro 19,5 × 5,08 × 3,1 mm, hmotnost 168 mg (hlava senzoru 73 mg), ' +
      '4 vývody: 1=SCK, 2=VDD, 3=GND, 4=DATA — shodná konstrukce jako SHT71 (samostatný záznam)',
    value:
      'Digitální senzor vlhkosti a teploty (vyšší přesnost), 0–100 %RH (±1,8 %RH typ.), -40 až ' +
      '+123,8 °C (±0,3 °C typ.), digitální 2vodičové rozhraní (SCK+DATA), VDD 2,4–5,5 V',
    notes:
      'Sensirion "Datasheet SHT7x (SHT71, SHT75)" v4.1 (červenec 2008). ⚠️ SHT75 = přesnostně ' +
      'vyšší třída téhož senzoru jako SHT71 (samostatný záznam) — mechanicky, elektricky a ' +
      'protokolem naprosto identická (viz záznam SHT71 pro plný popis rozhraní, rozlišení, ' +
      'spotřeby a příkazů), liší se pouze binováním přesnosti: SHT75 typ. ±1,8 %RH (vs. ±3,0 %RH ' +
      'u SHT71) a typ. ±0,3 °C (vs. ±0,4 °C u SHT71). Vyšší cena oproti SHT71 za lepší garantovanou ' +
      'přesnost ze stejné výrobní linky (třídění dle kalibrace).',
    tags: 'io,senzor,vlhkoměr,teploměr,sht75,sht7x,sensirion,2vodičové',
  },
  {
    name: '22DTH-51M',
    packageType:
      'Kanálový (duct) sondový senzor: sonda délky 140 mm, ø19,5 mm, hlava z lexanu (oranžová, ' +
      'UV odolná) 73,2×65,6×44,8 mm, montážní příruba (přiložena, typ A-22D-A34), kabelová ' +
      'průchodka ø6–8 mm (přiložen i 1/2" NPT adaptér), odnímatelná pružinová svorkovnice max ' +
      '2,5 mm² (UB+, GND, AOU1, AOU2, ST+/ST-), krytí IP65/NEMA 4X, hmotnost 0,14 kg',
    value:
      'Aktivní snímač vlhkosti a teploty do potrubí (duct), analogový výstup DC 0–5/10 V ' +
      '(propojkou volitelné), 0–100 %RH, teplota volitelná ze 4 rozsahů (výchozí -20 až +80 °C), ' +
      'napájení 15–24 Vdc nebo 24 Vac ±10 %',
    notes:
      'Belimo 22DTH-51M "Duct Sensor Humidity/Temperature" (dok. en-us, 2019-08-20). ⚠️ Zcela ' +
      'jiný typ senzoru než ostatní teplotní/vlhkostní senzory v knihovně (DHT11, SHT71/SHT75, ' +
      'DS18B20/DS1822, Pt100, samostatné záznamy) — jde o kompletní aktivní převodník ' +
      '(transduktor) s kalibrovaným ANALOGOVÝM napěťovým výstupem 0–5 V nebo 0–10 V (propojkou ' +
      'volitelné, min. zátěž 10 kΩ), ne o digitální komunikační rozhraní. Určeno k montáži přímo ' +
      'do vzduchotechnického potrubí (duct) pro měření v HVAC systémech, ne pro obecné DIY ' +
      'projekty. Senzorová technologie: polymerový kapacitní vlhkoměrný člen chráněný nerezovou ' +
      'drátěnou síťkou (vyměnitelná, náhradní díl A-22D-A06). Měřené veličiny (propojkou ' +
      'volitelné na výstupu AOU1 — vždy jen jedna z nich současně): relativní vlhkost (rH), ' +
      'absolutní vlhkost (absH), entalpie (EntH) nebo rosný bod (TPkt/Dew); teplota je vždy na ' +
      'druhém výstupu AOU2. Rozsah vlhkosti 0–100 %RH nekondenzující. Rozsah teploty volitelný ' +
      'propojkami ze 4 nastavení: S0 -40 až +60 °C, S1 0 až +50 °C, S2 -15 až +35 °C, S3 -20 až ' +
      '+80 °C (výrobní nastavení S3). Rozsah absolutní vlhkosti nastavitelný 0–50 g/m³ (výchozí) ' +
      'nebo 0–80 g/m³. Rozsah entalpie 0–85 kJ/kg. Rozsah rosného bodu nastavitelný 0–50 °C ' +
      '(výchozí) nebo -20 až +80 °C. Přesnost vlhkosti ±2 % mezi 10–90 %RH @21 °C. Přesnost ' +
      'teploty ±0,5 °C @25 °C. Napájení 15–24 Vdc ±10 % (0,4 W) nebo 24 Vac ±10 % (0,8 VA) — ' +
      'doporučeno napájet konstantním napětím ±0,2 V, změny napájení ovlivňují přesnost kvůli ' +
      'vlastnímu oteplení elektroniky (nejnižší chyba při standardním 24 V). Rekalibrace možná ' +
      'trimrem přímo na desce senzoru — nedotýkat se citlivého vlhkoměrného čidla (ruší záruku). ' +
      'Materiály: kabelová průchodka PA6 černá, kryt/tělo lexan oranžový, těsnění NBR70 černé ' +
      '(UV odolné). Okolní/médiová teplota -35 až +50 °C, max. rychlost proudění vzduchu 12 m/s, ' +
      'okolní vlhkost max. 95 %RH nekondenzující (krátkodobá kondenzace na médiu přípustná). ' +
      'Třída ochrany III (SELV), UL Class 2 Supply. Certifikace IEC/EN 60730-1, cULus dle ' +
      'UL60730-1A/-2-9/-2-13, CAN/CSA E60730. 5letá záruka na výrobek, kalibrační záruka přesnosti ' +
      'vlhkosti 2 roky za standardních podmínek (agresivní plyny jako chlor/ozon/čpavek nebo ' +
      'extrémní vlhkost/teplo mohou vlhkoměrný člen degradovat mimo záruku).',
    tags: 'io,senzor,vlhkoměr,teploměr,duct,hvac,belimo,analogový,0-10v',
  },
  {
    name: 'SHT85',
    packageType:
      '4pinové jednořadé kolíkové pouzdro (SIL), pouzdro epoxidová licí hmota (housing shodné se ' +
      'SHT35-DIS), 1,27 mm rozteč pinů, celková výška 17,8 mm, čip 3,7×2,3 mm, PTFE membrána nad ' +
      'otvorem senzoru (ochrana IP67 proti kapalinám/prachu). Piny: 1=SCL (jen vstup), 2=VDD, ' +
      '3=VSS, 4=SDA (obousměrný) — pozlacená zadní strana hlavy senzoru je interně spojena s VSS, ' +
      'integrovaný 100nF kondenzátor mezi VDD/GND. Lze pájet nebo vsadit do patice (Preci-Dip ' +
      '851-87-004-10-001101/-20-001101, Harwin M50-3030442 nebo podobné)',
    value:
      'Vysoce přesný digitální senzor vlhkosti a teploty, standardní I2C rozhraní (adresa 0x44), ' +
      '±1,5 %RH / ±0,1 °C typ. přesnost, 0–100 %RH, -40 až +105 °C (čip do 125 °C), VDD 2,15–5,5 V',
    notes:
      'Sensirion Datasheet SHT85 v3 (srpen 2020) — nejpřesnější "pin-type" senzor vlhkosti/teploty ' +
      'Sensirion, postavený na novější generaci čipu SHT3x-DIS (CMOSens technologie). ⚠️ Zcela ' +
      'odlišné komunikační rozhraní než SHT71/SHT75 (samostatné záznamy, starší generace SHT7x) ' +
      '— ty používají proprietární 2vodičové SCK/DATA rozhraní bez skutečné I2C adresace (jen ' +
      '"000"), zatímco SHT85 komunikuje standardním I2C (I2C Fast Mode do 400 kHz, volitelně až ' +
      '1 MHz), pevná 7bit adresa 0x44 (binárně 1000100) — lze sdílet I2C sběrnici s dalšími ' +
      'zařízeními. Rovněž odlišné od DHT11 (proprietární asynchronní jednovodičový protokol) a od ' +
      'DS18B20/DS1822 (Dallas 1-Wire), samostatné záznamy. ⚠️ Výrazně vyšší přesnost než DHT11 ' +
      '(±1,5 %RH/±0,1 °C zde vs. ±5 %RH/±2 °C u DHT11) a navíc IP67 ochrana senzorového otvoru ' +
      'PTFE membránou (odolnost proti stříkající vodě a prachu) — na rozdíl od holých senzorových ' +
      'elementů ostatních dílů v knihovně. Vlhkost: přesnost typ. ±1,5 %RH (max. dle grafu, ' +
      'nejhorší v krajních bodech; ±2 %RH @40 °C/40–70 %RH, ±1,5 %RH @40 °C/40–60 %RH), ' +
      'opakovatelnost 0,21/0,15/0,08 %RH (nízká/střední/vysoká repeatabilita), rozlišení 0,01 %RH, ' +
      'rozsah 0–100 %RH nekondenzující, doba odezvy τ63% 8 s (s aktivovanou ART funkcí 2× rychlejší), ' +
      'dlouhodobý drift typ. <0,25 %RH/rok. Teplota: přesnost typ. ±0,1 °C (20–50 °C), ' +
      'opakovatelnost 0,15/0,08/0,04 °C, rozlišení 0,01 °C, rozsah -40 až +105 °C (čip a DPS do ' +
      '125 °C, konektor limitován na 105 °C), doba odezvy τ63% >2 s, dlouhodobý drift max ' +
      '<0,03 °C/rok. Doporučený provozní rozsah pro nejlepší výkon 5–60 °C / 20–80 %RH — dlouhodobé ' +
      'vystavení mimo tento rozsah (zejména vysoká vlhkost) může dočasně posunout signál (např. ' +
      '+3 %RH po 60 h @>80 %RH), senzor se sám postupně vrátí do kalibrovaného stavu. Napájení: ' +
      'VDD 2,15–5,5 V, VPOR (power-up práh) typ. 2,1 V, max. slew rate napájení 20 V/ms. Proudový ' +
      'odběr: klidový (single-shot mód) typ. 0,2 µA @25 °C (max 12 µA, max 6 µA @125 °C), klidový ' +
      '(periodický mód) typ. 45 µA, měření typ. 600 µA (max 1500 µA), průměr typ. 1,7 µA ' +
      '(1 měření/s, nejnižší repeatabilita). Výkon vestavěného ohřívače (jen pro kontrolu ' +
      'funkčnosti, ne pro běžné odstranění kondenzace) 3,6–33 mW. Mezní hodnoty: VDD -0,3 až 6 V, ' +
      'napětí na SCL/SDA -0,3 až VDD+0,5 V, vstupní proud ±100 mA, provozní/skladovací teplota ' +
      '-40 až +105 °C (doporučené skladování 10–50 °C), ESD HBM 4 kV / CDM 750 V. Podporuje ' +
      'jednorázová měření (single shot, 3 úrovně repeatability) i periodická měření (0,5/1/2/4/10 ' +
      'měření/s × 3 úrovně repeatability), ART funkci (Accelerated Response Time, 4 Hz), softwarový ' +
      'i hardwarový reset, čtecí stavový registr a unikátní 32bit výrobní sériové číslo (příkaz ' +
      '0x3682) pro individuální identifikaci kusu. Všechny příkazy a data chráněny CRC kontrolním ' +
      'součtem. RoHS (bez Pb/Cd/Hg), kvalifikace dle JEDEC JESD47.',
    tags: 'io,senzor,vlhkoměr,teploměr,sht85,sht3x,sensirion,i2c',
  },
  {
    name: 'TH10',
    packageType:
      'SMD pouzdro (malý QFN/DFN-like čip na kondenzátorové aplikační destičce dle fotografie ' +
      'datasheetu), piny VDD, SDA, SCL, GND (+ v absolutních mezních hodnotách zmíněny i ADDR a ' +
      'ALERT/nRESET piny pro plnou 6pinovou variantu)',
    value:
      'Digitální I2C senzor vlhkosti a teploty, plně kalibrovaný/linearizovaný, přesnost ±1,5 % ' +
      'RH a ±0,2 °C, I2C do 1 MHz, VDD 2,4–5,5 V',
    notes:
      'HOPERF (Hope Microelectronics) "TH10" senzor vlhkosti a teploty (dok. TH10_DataSheet_EN_' +
      'V1.0) — podobná kategorie jako SHT85/DHT11 v této knihovně (plně kalibrovaný digitální ' +
      'I2C senzor RH/teploty), od výrobce s 15letou historií ve výrobě vlhkostních senzorů. Dva ' +
      'uživatelsky volitelné I2C adresy (pin ADDR), komunikační rychlost až 1 MHz (⚠️ výrazně ' +
      'vyšší než standardní 400 kHz Fast Mode u SHT85), alert výstupní pin s nastavitelnou budicí ' +
      'silou (0,8–2,1×VDD, do cca 1,5 mA typ.), integrovaný ohřívač (heater) pro kontrolu ' +
      'funkčnosti/odstranění kondenzace (výkon 4,5–33 mW dle napájecího napětí). Napájení VDD ' +
      '2,4–5,5 V, VPOR (power-up práh) typ. 2,3 V. Proudový odběr: klidový v single-shot módu ' +
      'typ. 0,2 µA (max 2,0 µA), klidový v periodickém módu typ. 45 µA (max 70 µA), při měření ' +
      'typ. 800 µA (max 1500 µA), průměrný typ. 2 µA (1 měření/s, nejnižší repeatabilita). ' +
      'Timing: power-up doba typ. 0,5 ms (max 1 ms), soft reset doba typ. 0,5 ms (max 1 ms), ' +
      'doba měření dle repeatability: nízká typ. 2,5 ms (max 4 ms), střední typ. 4,5 ms (max ' +
      '6 ms), vysoká typ. 12,5 ms (max 15 ms). Vlhkost: přesnost typ. ±1,5 %RH, opakovatelnost ' +
      'nízká/střední/vysoká 0,25/0,15/0,1 %RH, rozlišení 0,01 %RH, hystereze ±0,8 %RH @25 °C, ' +
      'rozsah 0–100 %RH, doba odezvy τ63% 86 s, dlouhodobý drift <0,25 %RH/rok. Teplota: přesnost ' +
      '±0,2 °C (-40 až 90 °C), opakovatelnost nízká/střední/vysoká 0,24/0,12/0,06 °C, rozlišení ' +
      '0,015 °C, rozsah -40 až +125 °C, doba odezvy τ63% >2 s, dlouhodobý drift <0,03 °C/rok. ' +
      'Doporučený provozní rozsah pro nejlepší výkon 5–60 °C/20–80 %RH — dlouhodobé vystavení ' +
      'mimo tento rozsah (zejména vysoká vlhkost) může dočasně posunout signál, senzor se sám ' +
      'postupně vrátí do kalibrovaného stavu. Mezní hodnoty: VDD -0,3 až 6 V, napětí na pinech ' +
      '-0,3 až VDD+0,3 V, vstupní proud ±100 mA, provozní teplota -40 až +125 °C, skladovací -40 ' +
      'až +150 °C, ESD HBM 4 kV/CDM 750 V. Max. rychlost změny napájecího napětí 20 V/ms (rychlejší ' +
      'změny mohou vést k nechtěnému resetu).',
    tags: 'io,senzor,vlhkoměr,teploměr,th10,hoperf,i2c',
  },
  {
    name: 'IRA-S410ST03',
    packageType:
      'TO-5 kovové pouzdro (metal-can), 3 vývody (drátové, "lead type"), Ø8,2 mm, s optickým ' +
      'filtrem a výstupkem (tab) pro orientaci vůči Fresnelově čočce; piny d (drain — napájení), ' +
      's (source — výstup), g (ground — zem); niklované vývody',
    value:
      'Duální pyroelektrický (PIR) pohybový senzor s integrovaným JFET zesilovačem, zorné pole ' +
      '38°/45°, citlivost typ. 7,0 mV, napájení 2–15 V',
    notes:
      'Murata "IRA-S410ST03" (dok. Product Search Data Sheet, staženo z murata.com, ' +
      'aktualizováno 27. 10. 2017 — pozn. výrobce: může být neaktuální, doporučeno stáhnout ' +
      'nejnovější verzi) — pasivní infračervený (PIR) pohybový senzor s DVĚMA pyroelektrickými ' +
      'elementy zapojenými diferenčně (elektrody 2,3 mm mezera 0,3 mm × 1,0 mm × 2) — pohyb ' +
      'tepelného zdroje (osoby) přes zorné pole způsobí postupnou nerovnováhu signálu mezi oběma ' +
      'elementy, zatímco statické pozadí/souhlasné rušení (např. teplotní drift okolí) se ' +
      'diferenčně potlačí. Integrovaný JFET v zapojení source-follower (piny d/s/g) pro impedanční ' +
      'přizpůsobení vysokoimpedančního pyroelektrického výstupu k dalšímu zpracování (typicky ' +
      'externí OZ/komparátor). Optický filtr typu "5 micro meter Long Pass" (propouští jen ' +
      'dlouhovlnné IR záření nad ~5 µm, odpovídající tepelnému záření lidského těla, blokuje ' +
      'viditelné/blízké IR světlo a tím falešné spouštění). Zorné pole (bez čočky) theta1=38°, ' +
      'theta2=45°. Citlivost (responsivity) typ. 7,0 mV. Napájecí napětí 2–15 V. Provozní teplota ' +
      '-40 až +70 °C, skladovací -40 až +85 °C. Určeno pro detektory pohybu/přítomnosti osob ' +
      '(bezpečnostní čidla, automatické osvětlení, HVAC) — ⚠️ NENÍ určeno pro automobilové ' +
      'aplikace ("Not available for Automotive usage" dle datasheetu). Pro rozšíření/tvarování ' +
      'zorného pole se typicky kombinuje s externí Fresnelovou čočkou — viz související záznam ' +
      'Murata IML-0638 v kategorii Ostatní (čočka pro příbuznou "IRA-E" řadu se stejným ' +
      'mechanickým TO-5 pouzdrem).',
    tags: 'io,senzor,pir,pyroelektrický,pohybový,murata,ira-s410st03,jfet',
  },
  {
    name: 'IRA-S230ST01',
    packageType:
      'TO-5 kovové pouzdro (metal-can), 3 vývody (drátové, "lead type"), Ø8,2 mm, s optickým ' +
      'filtrem a výstupkem (tab) pro orientaci vůči Fresnelově čočce; piny d (drain — napájení), ' +
      's (source — výstup), g (ground — zem); niklované vývody',
    value:
      'Duální pyroelektrický (PIR) pohybový senzor s integrovaným JFET zesilovačem, zorné pole ' +
      '45°/45°, citlivost typ. 4,6 mV, napájení 2–15 V',
    notes:
      'Murata "IRA-S230ST01" (dok. Product Search Data Sheet, staženo z murata.com, aktualizováno ' +
      '27. 10. 2017 — pozn. výrobce: může být neaktuální, doporučeno stáhnout nejnovější verzi) — ' +
      '⚠️ sourozenecký model k IRA-S410ST03 v této knihovně (samostatný záznam): stejné mechanické ' +
      'provedení (TO-5, lead type, piny d/s/g, integrovaný JFET, optický filtr 5µm long pass), ' +
      'stejný napájecí rozsah (2–15 V) i teplotní rozsahy (provozní -40 až +70 °C, skladovací -40 ' +
      'až +85 °C), stejně NENÍ určen pro automobilové aplikace — ale liší se v optickém/citlivostním ' +
      'kompromisu: IRA-S230ST01 má ŠIRŠÍ zorné pole theta1=theta2=45°/45° (oproti 38°/45° u ' +
      'IRA-S410ST03) za cenu NIŽŠÍ citlivosti typ. 4,6 mV (oproti 7,0 mV u IRA-S410ST03) — širší ' +
      'pokrytí prostoru na úkor dosahu/citlivosti detekce. Elektrody pyroelektrického elementu ' +
      'udány přímo v datasheetu jako (2,0×1,0 mm)×2 — ⚠️ přesný vzájemný rozestup elektrod v tomto ' +
      'stručném "Product Search" datasheetu specifikován není (na rozdíl od odhadu u IRA-S410ST03 ' +
      'z mechanického výkresu), nejistota uvedena explicitně. Princip funkce (diferenční zapojení ' +
      'dvou pyroelektrických elementů potlačující souhlasné rušení, JFET source-follower pro ' +
      'impedanční přizpůsobení) shodný s IRA-S410ST03 — viz tam pro obecný popis. Pro rozšíření/ ' +
      'tvarování zorného pole se typicky kombinuje s externí Fresnelovou čočkou — viz související ' +
      'záznamy Murata IML-0637 a IML-0638 v kategorii Ostatní.',
    tags: 'io,senzor,pir,pyroelektrický,pohybový,murata,ira-s230st01,jfet',
  },
  {
    name: 'IRA-S510ST01',
    packageType:
      'TO-5 kovové pouzdro (metal-can), 3 vývody (drátové, "lead type"), Ø8,2 mm, s optickým ' +
      'filtrem a výstupkem (tab) pro orientaci vůči Fresnelově čočce; piny d (drain — napájení), ' +
      's (source — výstup), g (ground — zem); niklované vývody',
    value:
      'Kvadrátní (4prvkový) pyroelektrický (PIR) pohybový senzor s integrovaným JFET zesilovačem, ' +
      'zorné pole 44°/44°, citlivost typ. 3,3 mV, napájení 2–15 V',
    notes:
      'Murata "IRA-S510ST01" (dok. Product Search Data Sheet, staženo z murata.com, aktualizováno ' +
      '27. 10. 2017 — pozn. výrobce: může být neaktuální, doporučeno stáhnout nejnovější verzi) — ' +
      '⚠️ další sourozenecký model k IRA-S410ST03 a IRA-S230ST01 v této knihovně (samostatné ' +
      'záznamy), stejné mechanické provedení (TO-5, lead type, piny d/s/g, integrovaný JFET, ' +
      'optický filtr 5µm long pass), stejný napájecí rozsah (2–15 V) i teplotní rozsahy (provozní ' +
      '-40 až +70 °C, skladovací -40 až +85 °C), stejně NENÍ určen pro automobilové aplikace — ale ' +
      'oproti oběma zmíněným má KVADRÁTNÍ (čtyřprvkové) uspořádání pyroelektrických elementů ' +
      '(1,0×1,0 mm)×4 v mřížce 2×2, NIKOLI duální (dvouprvkové) uspořádání jako IRA-S410ST03/ ' +
      'IRA-S230ST01 — čtyřprvkové zapojení typicky umožňuje lepší potlačení souhlasného rušení a/ ' +
      'nebo jemnější prostorové rozlišení pohybu (detekci směru) oproti jednoduššímu duálnímu ' +
      'zapojení, na úkor nižší citlivosti typ. 3,3 mV (nejnižší ze všech tří sourozeneckých ' +
      'modelů — IRA-S410ST03 7,0 mV, IRA-S230ST01 4,6 mV, IRA-S510ST01 3,3 mV). Zorné pole (bez ' +
      'čočky) theta1=theta2=44°. Princip funkce (diferenční/maticové zapojení elementů potlačující ' +
      'souhlasné rušení, JFET source-follower pro impedanční přizpůsobení) obdobný IRA-S410ST03 — ' +
      'viz tam pro obecný popis. Pro rozšíření/tvarování zorného pole se typicky kombinuje s ' +
      'externí Fresnelovou čočkou — viz související záznamy Murata IML-0637 a IML-0638 v kategorii ' +
      'Ostatní.',
    tags: 'io,senzor,pir,pyroelektrický,pohybový,murata,ira-s510st01,jfet,kvadrátní',
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
      'TSU-20G/TSU-70G/TSU-100G v této knihovně (ty mají vlastní napájení a frekvenční výstup, ' +
      'proto jsou zařazeny do kategorie "Modul"); i přes absenci vlastní elektroniky je zde ' +
      'zařazen do kategorie "IO"/Senzory jako samostatný snímací prvek. Výstupem je elektrický ' +
      'náboj úměrný zrychlení/rázu (typ "electric charge sensitivity type"), pro použitelný ' +
      'napěťový signál vyžaduje externí nábojový zesilovač (charge amplifier). Provozní/ ' +
      'skladovací teplota -40 až +85 °C. Sklon primární osy citlivosti (primary axis inclined ' +
      'angle) 0°. Izolační odpor min. 500 MΩ. Nelinearita typ. 1 %. Rázová odolnost 1500 G (doba ' +
      'trvání 0,5 ms). Frekvenční charakteristika má výraznou rezonanční špičku okolo 20 kHz (viz ' +
      'graf v datasheetu) — mimo tuto oblast prakticky rovný výstup v rozsahu cca 1 Hz–10 kHz. ' +
      'Určeno pro spotřební elektroniku (detekce pádu/nárazu, ochrana disků, alarmy apod.).',
    tags: 'io,senzor,piezoelektrický,rázový,vibrační,náboj,murata,pkgs,shock-sensor',
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
    tags: 'io,senzor,piezoelektrický,rázový,vibrační,napěťový,murata,pkgs,shock-sensor,automotive,tpms,aec-q200',
  },
  {
    name: 'PKGS-25WXP1-R',
    packageType:
      'SMD pouzdro 2,8×2,0×1,05 mm, 2 elektrody (Electrode A, Electrode B) na spodní straně, ' +
      'značka polarity (Polarity Marking) na horní straně, páskování 180 mm embossed tape ' +
      '(min. objednací množství 3000 ks)',
    value:
      'Piezoelektrický rázový/vibrační senzorový element (shock sensor), elektrický náboj ' +
      '(charge output) typu, citlivost 0,168 pC/G typ., kapacita 550 pF typ., rezonanční ' +
      'kmitočet 42 kHz, sklon primární osy citlivosti 25°',
    notes:
      'Murata "PKGS-25WXP1-R" (dok. Product Search Data Sheet, staženo z murata.com, aktualizováno ' +
      '27. 10. 2017 — pozn. výrobce: může být neaktuální, doporučeno stáhnout nejnovější verzi) — ' +
      '⚠️ další sourozenecký typ ze stejné produktové řady "PKGS" piezoelektrických rázových senzorů ' +
      'Murata jako PKGS-00LDP1-R a PKGS-45TAV-R v této knihovně (samostatné záznamy): shodně s ' +
      'PKGS-00LDP1-R jde o typ "electric charge sensitivity" (výstup elektrický náboj v pC/G, pro ' +
      'spotřební elektroniku, bez AEC-Q200 automotive kvalifikace), ale s odlišnou geometrií ' +
      'snímací osy (sklon primární osy 25°, oproti 0° u PKGS-00LDP1-R a 45° u PKGS-45TAV-R) a ' +
      'odlišnými elektrickými parametry (citlivost 0,168 pC/G typ. — výrazně nižší než 0,84 pC/G u ' +
      'PKGS-00LDP1-R; kapacita 550 pF typ.; rezonanční kmitočet 42 kHz — vyšší než 20 kHz u ' +
      'PKGS-00LDP1-R). Provozní/skladovací teplota -40 až +85 °C (shodná s PKGS-00LDP1-R). ' +
      'Izolační odpor min. 100 MΩ (nižší než 500 MΩ u PKGS-00LDP1-R). Nelinearita typ. 1 %. Rázová ' +
      'odolnost 3000 G (doba trvání 0,3 ms — shodná s automotive PKGS-45TAV-R, vyšší než 1500 G u ' +
      'PKGS-00LDP1-R). Výstupem je elektrický náboj úměrný zrychlení/rázu, pro použitelný napěťový ' +
      'signál vyžaduje externí nábojový zesilovač (charge amplifier) — viz záznam PKGS-00LDP1-R pro ' +
      'obecné vysvětlení principu. Určeno pro spotřební elektroniku.',
    tags: 'io,senzor,piezoelektrický,rázový,vibrační,náboj,murata,pkgs,shock-sensor',
  },
  {
    name: 'BD3852MUZ-Z',
    packageType:
      'VQFN16Z3030A, 3,0×3,0×0,4 mm (max výška), 16 vývodů: 1=EN, 2=NC, 3=REF2, 4=A2IP, 5=A2O, ' +
      '6=A2IM, 7=FO, 8=NC, 9=A1O, 10=NC, 11=NC, 12=VCC, 13=A1IP, 14=A1IM, 15=REF1, 16=GND, ' +
      'exponovaná plocha (EXP-PAD) připojena na GND',
    value:
      'Zesilovací/kondicionovací IC pro rázový (nárazový) senzor (Shock Sensor IC) — nábojový ' +
      'předzesilovač + notch filtr + druhý stupeň OZ zesilovače, napájení 1,6–2,3 V, notch ' +
      'kmitočet typ. 31 kHz, odběr typ. 3,9 mA',
    notes:
      'ROHM "BD3852MUZ-Z — Shock Sensor (Impact Sensor) IC" (TSZ02201-0E3E0FZ00890-1-2, Rev.001, ' +
      '11. 3. 2020) — ⚠️ jde o zesilovací/kondicionovací IC, KTERÁ SE PŘIPOJUJE K EXTERNÍMU ' +
      'rázovému senzoru (piezoelektrický element), sama senzor neobsahuje — koncepčně přímo ' +
      'navazuje na piezoelektrické rázové senzorové elementy Murata PKGS-00LDP1-R/PKGS-45TAV-R/ ' +
      'PKGS-25WXP1-R v této knihovně (ty jsou pasivní nábojové/napěťové snímací elementy bez ' +
      'vlastní elektroniky, BD3852MUZ-Z je typický příklad externího zesilovacího obvodu, který ' +
      'takový element potřebuje pro použitelný výstupní signál). Architektura: OP-AMP1 pracuje ' +
      'jako nábojový zesilovač (charge amplifier) detekující náboj generovaný rázovým senzorem ' +
      '(piny A1IP/A1IM/A1O), následovaný filtrem s předzesilovačem (zesílení 13,9 dB) a vestavěným ' +
      'notch filtrem (útlum max -23 dB) laděným na typický rezonanční kmitočet rázových senzorů ' +
      '(fo typ. 31 kHz — pro potlačení nežádoucí rezonanční špičky senzoru, viz frekvenční ' +
      'charakteristiky senzorů PKGS v této knihovně), výstup na pinu FO. OP-AMP2 (piny A2IP/A2IM/ ' +
      'A2O) slouží jako druhý zesilovací stupeň s uživatelsky nastavitelným ziskem/filtrací pomocí ' +
      'externích R/C prvků. VREF generuje referenční napětí REF1 (0,40 V typ.) a REF2 (0,80 V ' +
      'typ.). EN pin (H=zapnuto, L=úsporný režim se spotřebou <10 µA, interní pull-down 50 kΩ) ' +
      'umožňuje řízené uspávání. Napájecí napětí 1,6–2,3 V (typ. 1,8 V), odběr typ. 3,9 mA ' +
      '(max 4,5 mA) v aktivním režimu. Šířka pásma zesilovačů (GBW) typ. 1,5 MHz u obou stupňů. ' +
      'Absolutní maximum: VCC 4,5 V, TJmax 150 °C, Tstg -55 až +150 °C. Doporučená provozní ' +
      'teplota -40 až +85 °C. Určeno primárně pro detekci nárazu/rázu a ochranu proti zápisu u ' +
      'HDD nebo optických pickup mechanismů, případně pro feedforward kompenzaci setrvačných sil ' +
      'u téhož typu mechanismů.',
    tags: 'io,zesilovač,nábojový-zesilovač,rázový-senzor,shock-sensor,notch-filtr,rohm,bd3852muz,vqfn',
  },
  {
    name: 'LSM330DL',
    packageType:
      'LGA-28 (LLGA28), 7,5 × 4,4 × 1,1 mm, 28 vývodů (samostatné napájení a I2C/SPI rozhraní ' +
      'pro akcelerometr i gyroskop: SDA/SDI_A, SDO_A, SCL_A, CS_A, INT1_A, INT2_A, Vdd_IO_A pro ' +
      'akcelerometr; SDA/SDI_G, SDO_G, SCL_G, CS_G, INT1_G, DRDY_G/INT2_G, Vdd_IO_G pro gyroskop; ' +
      'společné Vdd, GND, VCONT)',
    value:
      '6osý MEMS inerciální modul — 3D akcelerometr + 3D gyroskop v jednom pouzdře, I2C/SPI, ' +
      'rozsah zrychlení ±2/±4/±8/±16 g, rozsah úhlové rychlosti ±250/±500/±2000 dps, Vdd 2,4–3,6 V',
    notes:
      'STMicroelectronics "LSM330DL — Linear sensor module, 3D accelerometer sensor and 3D ' +
      'gyroscope sensor" (Doc ID 022018 Rev 1, "Preliminary data", červenec 2011) — kombinovaný ' +
      '6osý inerciální modul (IMU) obsahující ve společném LGA pouzdře DVA nezávislé MEMS ' +
      'senzorové čipy s vlastními napájecími a komunikačními rozhraními (samostatné piny/adresy ' +
      'pro akcelerometr "_A" a gyroskop "_G", lze číst nezávisle přes I2C nebo SPI 16bitový ' +
      'výstup). Akcelerometr: dynamický uživatelsky volitelný rozsah ±2/±4/±8/±16 g, citlivost ' +
      '1/2/4/12 mg/digit dle rozsahu, proudový odběr typ. 11 µA @ODR=50Hz (normal mode) až 0,5 µA ' +
      '(power-down). Gyroskop: dynamický volitelný rozsah ±250/±500/±2000 dps, citlivost ' +
      '8,75/17,5/70 mdps/digit dle rozsahu, proudový odběr typ. 6,1 mA (normal mode), 1,5 mA ' +
      '(sleep), 5 µA (power-down). Šumová hustota zrychlení typ. 220 µg/√Hz (normal mode, ' +
      'ODR=100Hz), šumová hustota úhlové rychlosti typ. 0,03 dps/√Hz (BW=50Hz). Integrovaný ' +
      'teplotní senzor (výstup jen relativní změna, -1 °C/digit typ., obnovovací kmitočet 1 Hz). ' +
      'Programovatelný generátor přerušení pro detekci volného pádu (free-fall) a pohybu ' +
      '(motion detection), FIFO buffer pro oba senzory, integrovaný vysokopásmový filtr ' +
      '(high-pass) s volitelným cutoff kmitočtem, funkce detekce poklepání (click/double-click) u ' +
      'akcelerometru. Napájení Vdd 2,4–3,6 V (analogová část), Vdd_IO 1,71 V až Vdd+0,1 V ' +
      '(digitální I/O, nezávislé pro akcelerometr a gyroskop). I2C až 400 kHz (fast mode), SPI ' +
      'až 10 MHz (4-vodičový i 3-vodičový režim). Provozní teplota -40 až +85 °C. Absolutní ' +
      'maximum: Vdd/Vdd_IO -0,3 až 4,8 V, zrychlení (nárazová odolnost) 3000 g/0,5 ms nebo ' +
      '10000 g/0,1 ms (napájený i nenapájený), ESD 2 kV (HBM). Mechanicky citlivá součástka ' +
      '(MEMS) — nutná opatrná manipulace. Typické aplikace: GPS navigace, rozpoznávání a ' +
      'logování nárazů, herní/VR ovladače, detekce pohybu, úsporné řízení spotřeby přenosných ' +
      'zařízení, monitorování/kompenzace vibrací, detekce volného pádu, 6D orientace.',
    tags: 'io,senzor,akcelerometr,gyroskop,imu,mems,6osý,i2c,spi,st,lsm330dl',
  },
  {
    name: 'XV-8000CB',
    packageType:
      'SMD pouzdro 5,0×3,2×1,3 mm, 8 vývodů (rozteč 1,27 mm): 1=N.C., 2=GND, 3=VDD, 4=N.C., ' +
      '5=N.C., 6=VOUT, 7=VTEMP, 8=N.C. (nezapojené "N.C." piny nesmí být připojeny k žádnému ' +
      'externímu obvodu)',
    value:
      'Jednoosý vibrační křemenný (piezoelektrický) gyroskop (senzor úhlové rychlosti), ' +
      'analogový ratiometrický výstup, rozsah ±60°/s, citlivost 25 mV/(°/s) typ., napájení ' +
      '5,0 V ±0,25 V',
    notes:
      'Epson Toyocom "XV-8000CB — Ultra Miniature Size Gyro Sensor (for Car Navigation System)" — ' +
      'jednoosý (yaw rate) analogový gyroskop založený na vibrujícím křemenném rezonátoru ' +
      '(QMEMS — Quartz MEMS, na rozdíl od klasického křemíkového MEMS), NA ROZDÍL od digitálního ' +
      '6osého MEMS akcelerometru/gyroskopu LSM330DL v této knihovně (ten má I2C/SPI digitální ' +
      'výstup a integruje i akcelerometr) — XV-8000CB je jednoosý, čistě analogový (napěťový ' +
      'ratiometrický výstup úměrný VDD) senzor bez akcelerometru. Určeno primárně pro navigační ' +
      'systémy vozidel (dead-reckoning navigace při ztrátě GPS signálu, detekce natočení/zatáčení ' +
      'vozidla). Rozsah měřené úhlové rychlosti ±60°/s. Citlivost (scale factor) typ. 25 mV/(°/s). ' +
      'Klidové napětí (bias, výstup bez rotace) 50 % VDD @25 °C. Nelinearita max ±0,5 % FS @25 °C. ' +
      'Šířka pásma (frekvenční odezva) typ. 10 Hz (fázové zpoždění 90°). Křížová citlivost (cross ' +
      'axes) max ±5 % @25 °C. Proudový odběr typ. 4 mA (výstup nezatížen). Klidový šum typ. 3 mVpp. ' +
      'Dodatečný výstupní pin VTEMP pro integrovaný teplotní senzor (pro teplotní kompenzaci ' +
      'citlivosti v externím obvodu). Napájení VDD 5,0 V ±0,25 V (VSS=0V). Provozní/skladovací ' +
      'teplota -40 až +85 °C. RoHS.',
    tags: 'io,senzor,gyroskop,úhlová-rychlost,křemenný,qmems,epson-toyocom,xv-8000cb,analogový,automotive',
  },
  {
    name: 'ZMC10',
    packageType:
      'Modifikované pouzdro DIL-14 (THT), 13 vývodů (pozice 1–13, rozteč 2,54 mm, pin 7 chybí/ ' +
      'není vyveden do řady s piny 8–13 — samostatná skupina 1–7 a 8–13), izolační napětí 2 kV; ' +
      'piny 1,2,7 nezapojeny, 3=+VO, 4=-VB, 5=-VO, 6=+VB, 8/9/10=výstup proudové dráhy (current ' +
      'output), 11/12/13=vstup proudové dráhy (current input) — vnitřní vodič vedoucí měřený ' +
      'proud je integrální součástí pouzdra mezi piny 11-13 a 8-10',
    value:
      'Galvanicky oddělený magnetorezistivní senzor proudu (Wheatstoneův můstek z tenkovrstvého ' +
      'permalloy), měřitelný stejnosměrný/střídavý proud do 10 A, napájení 12 V, citlivost ' +
      'nakrátko 0,5 (mV/V)/A typ.',
    notes:
      'Katalogový list "Current Sensor ZMC10" (výřez z většího katalogu, str. 16–17, výrobce v ' +
      'tomto dokumentu explicitně neuveden — dle typového značení a technologie pravděpodobně ' +
      'Siemens/Sensitec magnetorezistivní senzorová řada, nejistota uvedena explicitně, nelze ' +
      'potvrdit bez dalšího zdroje). Princip funkce: magnetický senzorový čip využívající ' +
      'magnetorezistivní jev tenké vrstvy permalloy měří magnetické pole generované vnitřním ' +
      'vodičem vedoucím měřený proud (piny 11,12,13 → 8,9,10) — bezkontaktní, galvanicky ' +
      'oddělené měření proudu (izolační napětí 2 kV) BEZ nutnosti přídavného budicího pole HX ' +
      '(na rozdíl od některých jiných magnetorezistivních senzorů vyžadujících kompenzační ' +
      'budicí cívku). Vnitřní vodič snese přetížení 300 A po dobu 10 ms @Tamb=25°C. Elektrické ' +
      'parametry: odpor můstku Rbr 1,2–2,2 kΩ (typ. 1,7 kΩ), offset napětí max ±2 mV/V, citlivost ' +
      'nakrátko (open circuit sensitivity) typ. 0,5 (mV/V)/A, odpor vnitřního vodiče typ. 0,7 mΩ, ' +
      'max. pracovní kmitočet 100 kHz, teplotní koeficient citlivosti max -0,3 %/K. Napájecí ' +
      'napětí VB 12 V. Provozní teplota -40 až +120 °C, skladovací -65 až +120 °C. Určeno pro ' +
      'bezkontaktní měření stejnosměrného i střídavého proudu v průmyslových a energetických ' +
      'aplikacích (proudové senzory, ochrany, měřicí přístroje).',
    tags: 'io,senzor,proud,magnetorezistivní,proudový-senzor,galvanické-oddělení,zmc10,dil-14',
  },
  {
    name: 'ACS752SCA-050',
    packageType:
      'Pouzdro "CA" (TO-220-podobné, modifikované), 14,0×17,5 mm tělo, 5 vývodů celkem: 3 ' +
      'signálové piny (1=Vcc, 2=Gnd, 3=Output, rozteč 1,9 mm) + 2 silové terminály primárního ' +
      'vodiče (4=Ip+, 5=Ip-, rozteč 10 mm), creepage/clearance mezi silovými terminály a ' +
      'signálovými piny 7,25 mm, hmotnost typ. 4,18 g, bezolovnaté (matné cínové) vývody, UL94V-0',
    value:
      'Hallův lineární izolovaný senzor proudu, obousměrný ±50 A, citlivost 40 mV/A typ., ' +
      'napájení 5,0 V, izolační napětí 3 kV',
    notes:
      'Allegro MicroSystems "ACS752SCA-050" (ACS75250-DS Rev. 3, 2003) — ⚠️ POZOR na záměnu s ' +
      'jinak koncipovaným proudovým senzorem ZMC10 v této knihovně (samostatný záznam): oba jsou ' +
      'galvanicky oddělené senzory proudu s integrovaným primárním vodičem v pouzdře, ale ' +
      'založené na ODLIŠNÉM fyzikálním principu — ZMC10 využívá magnetorezistivní (permalloy) ' +
      'Wheatstoneův můstek, zatímco ACS752SCA-050 využívá lineární Hallův článek (monolitický ' +
      'Hall IC optimalizovaný interním magnetickým obvodem) — ACS752 má navíc oproti ZMC10 ' +
      'integrovaný analogový výstupní zesilovač/filtr přímo na čipu (viz blokové schéma: Hall ' +
      'článek → dynamické potlačení offsetu → zesilovač → filtr → výstupní stupeň), takže ' +
      'poskytuje přímo použitelný napěťový výstup bez nutnosti externího zesilovače. Primární ' +
      'vodič (terminály 4=Ip+, 5=Ip-) má nízký odpor (typ. 130 µΩ) pro minimální výkonové ztráty ' +
      'a je galvanicky oddělen od signálních pinů (izolační napětí 3 kV mezi piny 1-3 a 4-5, ' +
      '60 Hz/1 min). Výstup má kladnou strmost (>Vcc/2 při rostoucím proudu ve směru terminál ' +
      '4→5). Rozsah měřeného proudu ±50 A. Citlivost 40,0 mV/A typ. (38,0–42,0 mV/A). Klidové ' +
      'výstupní napětí (0 A) typ. 2,5 V (=Vcc/2). Nelinearita max ±4 %. Symetrie 97,5–102,5 %. ' +
      'Celková chyba výstupu (včetně všech offsetů) max ±1 % @25°C / ±7,5 % v celém teplotním ' +
      'rozsahu. Magnetický offset (po přebuzení 100 A) max ±0,65 A. Šířka pásma (-3dB) 50 kHz, ' +
      'doba náběhu typ. 7 µs, doba odezvy typ. 8 µs, doba zpoždění (propagation) typ. 4 µs. ' +
      'Napájení Vcc 4,5–5,5 V (typ. 5,0 V), odběr typ. 7 mA (max 10 mA). Provozní teplota -20 až ' +
      '+85 °C, max. teplota přechodu 165 °C, max. skladovací teplota 170 °C. UL rozpoznáno. ' +
      'Doporučen externí blokovací kondenzátor 0,1 µF na Vcc. Určeno pro řízení motorů, detekci/ ' +
      'management zátěže, spínané zdroje, nadproudovou ochranu, elektrická vozidla.',
    tags: 'io,senzor,proud,hallův-jev,proudový-senzor,galvanické-oddělení,allegro,acs752,izolovaný',
  },
  {
    name: 'ACS754xCB-050',
    packageType:
      'Pouzdro "CB" ve 3 variantách tvaru vývodů: CB-PFF (formované signálové piny i silové ' +
      'terminály), CB-PSF (formované piny, rovné terminály), CB-PSS (rovné piny i terminály) — ' +
      'kompaktní SIP-podobné pouzdro s 3 signálovými piny (1=VCC, 2=GND, 3=VOUT) + 2 silovými ' +
      'terminály primárního vodiče (4=IP+, 5=IP-)',
    value:
      'Hallův lineární izolovaný senzor proudu (chopper-stabilizovaný BiCMOS Hall IC), obousměrný ' +
      '±50 A, citlivost 40 mV/A typ., napájení 5,0 V, izolační napětí 3 kVRMS, dostupný v ' +
      'průmyslové (S, -20 až +85 °C) i automotive (L, -40 až +150 °C) teplotní verzi',
    notes:
      'Allegro MicroSystems "ACS754xCB-050" katalogový datasheet (ACS754050-DS, Rev. 3) — sourozenec ' +
      'ACS752SCA-050 v této knihovně v rámci téže výrobcem deklarované rodiny "ACS75x" (shodná ' +
      'základní technologie: chopper-stabilizovaný BiCMOS Hall IC s integrovaným měděným ' +
      'vodivým můstkem primárního proudu v blízkosti čipu), ale s odlišným pouzdrem (kompaktnější ' +
      '"CB" místo "CA"/TO-220-like u ACS752) a nižším odporem primárního vodiče (typ. 100 µΩ vs. ' +
      '130 µΩ u ACS752). Datasheet pokrývá celou modelovou řadu lišící se tvarem vývodů (PFF/PSF/ ' +
      'PSS) a teplotním rozsahem — dle katalogové tabulky: ACS754LCB-050-PFF/PSF/PSS (automotive, ' +
      '-40 až +150 °C, TA "L" řada) a ACS754SCB-050-PFF/PSF/PSS (standardní, -20 až +85 °C, TA "S" ' +
      'řada) — do knihovny přidán jako jeden souhrnný záznam pro celou "xCB" řadu, konkrétní ' +
      'kombinace teplotního rozsahu a tvaru vývodů se volí dle aplikace. Princip funkce shodný s ' +
      'ACS752SCA-050 (viz tam pro obecný popis Hallova senzoru s integrovaným výstupním zesilovačem/ ' +
      'filtrem) — navíc obsahuje interní stabilizovaný napěťový regulátor a trimovací obvody ' +
      '(Gain/Temperature Coefficient/Offset trim control) přímo na čipu, viditelné v blokovém ' +
      'schématu. Rozsah měřeného proudu ±50 A. Citlivost 40 mV/A typ. (S řada: 37,8–42,0 mV/A ' +
      '@-20~85°C; L řada: 36,0–42,8 mV/A @-40~150°C). Klidové výstupní napětí (0 A) VCC/2 (typ. ' +
      '2,5 V). Nelinearita max ±1,5 % (S) / ±1,8 % (L). Symetrie 98–102 %. Celková chyba výstupu ' +
      'max ±1,0 % @25°C / ±5,0 % (S) resp. ±9,9 % (L) v celém teplotním rozsahu. Magnetický offset ' +
      '(po přebuzení 100 A) max ±0,30 A (S) / ±0,40 A (L). Šířka pásma (-3dB) 35 kHz (nižší než ' +
      '50 kHz u ACS752SCA-050), doba náběhu typ. 11 µs, doba odezvy typ. 12 µs, doba zpoždění typ. ' +
      '4 µs. Napájení VCC 4,5–5,5 V (typ. 5,0 V), odběr typ. 8 mA (max 10 mA). Izolační napětí ' +
      '3 kVRMS mezi piny 1-3 a terminály 4-5 (60 Hz, 1 minuta), TÜV certifikace (America, ' +
      'certifikát U8V 04 11 54214 001). Max. teplota přechodu 165 °C, max. skladovací teplota ' +
      '170 °C. Určeno pro řízení motorů, servo systémy, průmyslové a automotive aplikace, ' +
      'konverzi výkonu, monitorování baterií.',
    tags: 'io,senzor,proud,hallův-jev,proudový-senzor,galvanické-oddělení,allegro,acs754,izolovaný,chopper,automotive',
  },
  {
    name: 'SCD40',
    packageType:
      'LGA 10,1×10,1×6,5 mm, 21 vývodů (VDD, VDDH, GND, SDA, SCL, zbytek DNC — nutno pájet i ' +
      'nepoužité DNC piny na plovoucí plošku), MSL 3',
    value:
      'Miniaturní fotoakustický CO2 senzor s integrovaným senzorem vlhkosti/teploty (SHT4x), I2C ' +
      'rozhraní (adr. 0x62), rozsah 0–40 000 ppm, přesnost ±(50 ppm + 5 %) v 400–2000 ppm, VDD 2,4–5,5 V',
    notes:
      'Sensirion "SCD4x — Breaking the size barrier in CO2 sensing" (verze 1.1, duben 2021) — ' +
      'nejmenší CO2 senzorový modul Sensirion, založený na patentované fotoakustické senzorové ' +
      'technologii PASens® (IR vysílač + akustický snímač tlakové vlny vzniklé absorpcí IR záření ' +
      'molekulami CO2, místo klasické NDIR optické lavice) — umožňuje SMD/reflow montáž a výrazně ' +
      'menší rozměry než tradiční NDIR CO2 senzory. Integruje i senzor relativní vlhkosti a teploty ' +
      '(postavený na čipu SHT4x) pro on-chip kompenzaci CO2 výstupu. SCD40 = základní přesnostní ' +
      'třída, specifikovaný rozsah 400–2000 ppm (viz odlišná, přesnější varianta SCD41 v ' +
      'samostatném záznamu, s rozšířeným rozsahem 400–5000 ppm a podporou single-shot měření). ' +
      'CO2: výstupní rozsah 0–40 000 ppm, přesnost ±(50 ppm + 5 % z hodnoty) v rozsahu 400–2000 ppm, ' +
      'opakovatelnost typ. ±10 ppm, doba odezvy τ63% typ. 60 s, drift přesnosti při aktivním ASC ' +
      '(Automatic Self-Calibration) typ. ±(5 ppm + 0,5 %)/rok — ASC vyžaduje pravidelné vystavení ' +
      'senzoru venkovnímu vzduchu (~400 ppm). Vlhkost: 0–100 %RH, přesnost typ. ±6 %RH ' +
      '(15–35 °C/20–65 %RH) až ±9 %RH (celý rozsah), opakovatelnost ±0,4 %RH, doba odezvy 90 s. ' +
      'Teplota: -10 až +60 °C, přesnost typ. ±0,8 °C (15–35 °C) až ±1,5 °C (celý rozsah), ' +
      'opakovatelnost ±0,1 °C, doba odezvy 120 s. Napájení VDD=VDDH 2,4–5,5 V (typ. 3,3 nebo 5 V, ' +
      'oba piny nutno propojit blízko senzoru); průměrný odběr při periodickém měření 15–18 mA ' +
      '(3,3 V) / 11–13 mA (5 V), v low-power periodickém režimu jen 3,2–3,5 mA (3,3 V), špičkový ' +
      'odběr až 175–205 mA (3,3 V). I2C standard-mode do 100 kHz (adresa 0x62), 16bit ' +
      'příkazy/data + 8bit CRC kontrolní součet, power-up doba 1000 ms po dosažení VDD≥2,25 V. ' +
      'Provozní teplota -10 až +60 °C, MSL úroveň 3, ESD HBM 2 kV/CDM 500 V, udávaná životnost ' +
      '>10 let. REACH a RoHS compliant.',
    tags: 'io,senzor,co2,vlhkoměr,teploměr,scd40,scd4x,sensirion,i2c,pasens',
  },
  {
    name: 'SCD41',
    packageType:
      'LGA 10,1×10,1×6,5 mm, 21 vývodů (VDD, VDDH, GND, SDA, SCL, zbytek DNC — nutno pájet i ' +
      'nepoužité DNC piny na plovoucí plošku), MSL 3',
    value:
      'Miniaturní fotoakustický CO2 senzor, vyšší přesnostní třída s podporou single-shot měření ' +
      '— rozsah 400–5000 ppm, přesnost ±(40 ppm + 5 %), jinak elektricky shodný se SCD40',
    notes:
      'Sensirion "SCD4x" (verze 1.1, duben 2021) — vyšší přesnostní varianta ve stejné rodině ' +
      'jako SCD40 (samostatný záznam, viz tam pro plný popis fotoakustické PASens® technologie, ' +
      'integrovaného SHT4x senzoru vlhkosti/teploty, napájení, I2C rozhraní a mezních hodnot — ' +
      'elektricky/rozměrově shodné pouzdro i piny). SCD41: CO2 přesnost ±(40 ppm + 5 % z hodnoty) ' +
      've specifikovaném rozsahu 400–5000 ppm (oproti ±(50 ppm + 5 %) v 400–2000 ppm u SCD40). ' +
      'Navíc jako jediný díl v rodině podporuje "low power single shot" měřicí režim (příkazy ' +
      'measure_single_shot / measure_single_shot_rht_only) — jednorázové měření na vyžádání s ' +
      'volitelným intervalem místo kontinuálního periodického měření, s odběrem již jen ' +
      '0,36–0,5 mA průměrně při 1 měření/5 minut (@3,3–5 V) — výhodné pro bateriové aplikace s ' +
      'řídkým vzorkováním (např. bateriové monitory kvality vzduchu). Sdílí stejnou paletu ' +
      'příkazů jako SCD40 (field kalibrace, ASC, nastavení výškové/tlakové kompenzace, teplotní ' +
      'offset, persist_settings do NVM, self-test, factory reset, unikátní sériové číslo).',
    tags: 'io,senzor,co2,vlhkoměr,teploměr,scd41,scd4x,sensirion,i2c,pasens,single-shot',
  },

  // USB mosty
  {
    name: 'FT200XD',
    packageType:
      'DFN-10 (3×3 mm), piny: 4=VCC, 7=VCCIO, 3=3V3OUT, 9=GND, 11=centrální ploška (GND, nutno ' +
      'připájet), 1=USBDM, 10=USBDP, 2=RESET# (aktivní nízká úroveň), 8=SDA (I2C data, ' +
      'open-drain), 6=SCL (I2C hodiny, jen vstup), 5=CBUS0 (konfigurovatelný I/O pin)',
    value:
      'USB-I2C most (single-chip USB to I2C interface), USB 2.0 Full Speed, I2C do 3,4 MHz ' +
      '(High Speed mode), VCC 2,97–5,5 V',
    notes:
      'FTDI (Future Technology Devices International) FT200XD "USB I2C Slave IC Datasheet" ' +
      'v1.3 (dok. FT_000628). Jednočipové řešení USB↔I2C bez nutnosti psát USB firmware — celý ' +
      'USB protokol (deskriptory, enumerace) je zpracován uvnitř čipu a uložen ve vestavěné ' +
      '2048bajtové vícenásobně programovatelné (MTP) paměti spolu s unikátním USB sériovým ' +
      'číslem (přednastaveným z výroby) a konfigurací CBUS I/O pinu — žádná externí EEPROM ani ' +
      'externí krystal nejsou potřeba (plně integrovaná generace hodinového signálu z interního ' +
      '12MHz oscilátoru). Funguje výhradně jako I2C SLAVE (ne master) — nutný externí I2C master ' +
      '(mikrokontrolér) na sběrnici. Podpora I2C do 3,4 MHz (High Speed mode). 512bajtový RX a ' +
      '512bajtový TX FIFO buffer s vyrovnávací technologií pro vyšší propustnost. Ovladače: ' +
      'bezplatný FTDI VCP (Virtual COM Port) nebo D2XX (přímé USB API + DLL) pro Windows, Mac ' +
      'OS X, Linux, Android, Windows CE — odpadá nutnost psaní vlastního USB ovladače. ' +
      'Konfigurovatelný CBUS0 pin (funkce nastavitelná v MTP paměti nástrojem FT_PROG): ' +
      'tri-state, pevná log. 0/1, PWREN# (řízení externího P-kanálového MOSFET spínače napájení), ' +
      'SLEEP# (indikace USB suspend), hodinový výstup 24/12/6 MHz, bit-bang GPIO, BCD Charger ' +
      '(detekce nabíjecího USB portu s vyšším proudem), I2C_TXE#/RXF# (stav FIFO bufferů), VBUS ' +
      'Sense, Time Stamp (přepínání při každém USB SOF), Keep_Awake#. Tři konfigurace napájení: ' +
      'USB bus-powered, self-powered, nebo bus-powered s přepínáním napájení (PWREN# řídí externí ' +
      'P-MOSFET). Integrovaný +3,3V level converter pro USB I/O, interní 3V3/1V8 LDO regulátory, ' +
      'plně integrované AVCC filtrování (bez nutnosti externích filtračních obvodů). Detekce USB ' +
      'nabíječky (Battery Charger Detection) pro zvýšení nabíjecího proudu periferií. Mezní ' +
      'hodnoty: VCC -0,3 až +5,5 V, VCCIO -0,3 až +4,0 V, DC vstupní napětí USBDP/USBDM -0,5 až ' +
      '+3,63 V, DC výstupní proud 22 mA, provozní teplota (napájeno) -40 až +85 °C, skladovací ' +
      '-65 až +150 °C. ESD: HBM >±2 kV, MM >±200 V, CDM >±500 V, latch-up >±200 mA. Provozní ' +
      'napětí: VCC 2,97–5,5 V typ. 5 V, VCCIO 1,62–3,63 V, proudový odběr typ. 8 mA (aktivní ' +
      'normální provoz), typ. 125 µA (USB suspend). Výstup 3V3OUT 2,97–3,63 V @ max 50 mA (může ' +
      'napájet VCCIO nebo externí logiku). I/O výstupní proudová síla konfigurovatelná 4/8/12/16 mA ' +
      '(v MTP paměti). Certifikováno USB-IF (USB 2.0 Full Speed), RoHS.',
    tags: 'io,usb,i2c,most,bridge,ft200xd,ftdi,dfn10',
  },

  // RS-485/RS-422 přijímače
  {
    name: 'ISL32173E',
    packageType: '16 LD SOIC / 16 LD TSSOP, VCC 3,0–5,5 V',
    value:
      'Počtvrtý (4×) RS-485/RS-422 přijímač, 80 Mbps, ±16,5 kV ESD (IEC61000-4-2) na sběrnicových ' +
      'pinech, společný EN/EN̄',
    notes:
      'Renesas (dříve Intersil) ISL32173E/32175E/32177E/32273E/32275E/32277E "Quad Receivers" ' +
      '(dok. FN7529 rev. 4.00, duben 2016) — jedna rodina 6 čipů se stejnou základní funkcí (4× ' +
      'RS-485/RS-422 diferenciální přijímač do jednoho pouzdra), lišících se rychlostí (80 Mbps vs. ' +
      '20 Mbps verze), typem enable pinů a pouzdrem/počtem vývodů — zpracována celá rodina, ' +
      'samostatné záznamy. Společné vlastnosti: ±16,5 kV IEC61000-4-2 ESD ochrana na vstupech A/B ' +
      '(vzduchový výboj), ±8 kV kontaktní výboj, >8 kV HBM na ostatních pinech; napájení 3,0–5,5 V; ' +
      'nízký vstupní proud ±200 µA (1/4 unit load → až 128 přijímačů na jedné RS-485 sběrnici); ' +
      'široký rozsah souhlasného napětí sběrnice -7 až +12 V; fail-safe chování při plovoucím/' +
      'zkratovaném vstupu (výstup RO=1 při rozpojeném vstupu); tri-state výstupy s hot-plug ' +
      'funkcí (bezpečné připojení za provozu bez rušení sběrnice); nízký klidový (shutdown) proud. ' +
      'ISL32173E (toto): 16vývodové pouzdro (SOIC/TSSOP), průmyslově standardní pinout, jeden ' +
      'společný pár enable pinů EN/EN̄ pro všechny 4 kanály. Rychlost 80 Mbps, max. zpoždění ' +
      'tPLH/tPHL 11 ns typ (16 ns max), part-to-part skew 8 ns max (klíčová vlastnost — umožňuje ' +
      'přesné párování více kanálů/čipů). Odběr: 15 mA max (aktivní), shutdown proud max 15 µA ' +
      '(v režimu SHDN) / 60 µA (jiný způsob vypnutí, dle poznámky výrobce). Teplotní rozsah ' +
      '-40 až +85 °C (EIBZ/EIVZ) nebo -40 až +125 °C (EFBZ/EFVZ). Použití: telekomunikační ' +
      'zařízení, řízení motorů/enkodéry, PLC, průmyslové/procesní sítě.',
    tags: 'io,rs485,rs422,přijímač,receiver,isl32173e,transceiver,soic,tssop',
  },
  {
    name: 'ISL32175E',
    packageType: '16 LD SOIC / 16 LD TSSOP, VCC 3,0–5,5 V',
    value:
      'Počtvrtý (4×) RS-485/RS-422 přijímač, 80 Mbps, ±16,5 kV ESD, párové enable EN12/EN34 — ' +
      '⚠️ NEDOSTUPNÝ (doporučená náhrada ISL32173E)',
    notes:
      'Renesas/Intersil "Quad Receivers" — součást stejné rodiny 6 čipů jako ISL32173E/32177E/' +
      '32273E/32275E/32277E (samostatné záznamy) — viz záznam ISL32173E pro plný popis společných ' +
      'vlastností rodiny. ISL32175E: stejné 16vývodové pouzdro a pinout jako ISL32173E, ale místo ' +
      'jednoho společného EN/EN̄ má dvojici párových enable pinů EN12 (kanály 1+2) a EN34 (kanály ' +
      '3+4) — umožňuje nezávisle povolit/zakázat dvě dvojice výstupů. Rychlost 80 Mbps, jinak ' +
      'elektricky shodné s ISL32173E. ⚠️ Dle datasheetu (2016) je tento díl "No longer available" ' +
      '— výrobcem doporučená náhrada je ISL32173E (s jiným typem enable pinů, EN/EN̄ místo EN12/' +
      'EN34 — nutná úprava zapojení).',
    tags: 'io,rs485,rs422,přijímač,receiver,isl32175e,transceiver,soic,tssop,nedostupné',
  },
  {
    name: 'ISL32177E',
    packageType: '24 LD QFN (4×4 mm), VCC 3,0–5,5 V, VL 1,4–VCC (samostatný logický napájecí pin)',
    value:
      'Počtvrtý (4×) RS-485/RS-422 přijímač, 80 Mbps, ±16,5 kV ESD, individuální + skupinové ' +
      'enable, VL pin pro smíšené logické napětí',
    notes:
      'Renesas/Intersil "Quad Receivers" — součást stejné rodiny 6 čipů jako ISL32173E/32175E/' +
      '32273E/32275E/32277E (samostatné záznamy) — viz záznam ISL32173E pro plný popis společných ' +
      'vlastností rodiny. ISL32177E: nejvybavenější varianta — o 26 % menší QFN pouzdro (24 vývodů, ' +
      '4×4 mm) místo SOIC/TSSOP, individuální enable pro každý kanál (EN1–EN4) i skupinové EN/EN̄, ' +
      'navíc SHDNEN pin pro řízený vstup do nízkopříkonového shutdown režimu (klidový proud max ' +
      '15 µA), a samostatný logický napájecí pin VL (1,4 V až VCC) pro přizpůsobení úrovní ' +
      'vstupů/výstupů logiky nižšímu napětí (např. 1,8V mikrokontrolér při VCC=5V na sběrnici) — ' +
      'VOH/VOL a prahy vstupů se řídí VL, ne VCC. Rychlost 80 Mbps, max. tPLH/tPHL 16 ns, part-to-' +
      'part skew 8 ns. Odběr: 15 mA max (plné zatížení), 8,5 mA (poloviční), 2,5 mA (SHDN via ' +
      'SHDNEN). Nutno napájet VCC dříve než VL (pokud odděleně).',
    tags: 'io,rs485,rs422,přijímač,receiver,isl32177e,transceiver,qfn,shdn',
  },
  {
    name: 'ISL32273E',
    packageType: '16 LD SOIC / 16 LD TSSOP, VCC 3,0–5,5 V',
    value:
      'Počtvrtý (4×) RS-485/RS-422 přijímač, 20 Mbps (redukovaný odběr), ±16,5 kV ESD, společný ' +
      'EN/EN̄',
    notes:
      'Renesas/Intersil "Quad Receivers" — součást stejné rodiny 6 čipů jako ISL32173E/32175E/' +
      '32177E/32275E/32277E (samostatné záznamy) — viz záznam ISL32173E pro plný popis společných ' +
      'vlastností rodiny. ISL32273E: nízkopříkonová (redukovaná rychlost) obdoba ISL32173E — ' +
      'stejné 16vývodové pouzdro, pinout i EN/EN̄, ale max. datový tok jen 20 Mbps výměnou za ' +
      'výrazně nižší odběr: 5,5 mA max (aktivní, plné zatížení) oproti 15 mA u 80Mbps verze. ' +
      'tPLH/tPHL max 55 ns, part-to-part skew max 20 ns (vyšší než u 80Mbps verze — nižší nároky ' +
      'na přesné párování kanálů při pomalejších datových tocích).',
    tags: 'io,rs485,rs422,přijímač,receiver,isl32273e,transceiver,soic,tssop,nízký-odběr',
  },
  {
    name: 'ISL32275E',
    packageType: '16 LD SOIC / 16 LD TSSOP, VCC 3,0–5,5 V',
    value:
      'Počtvrtý (4×) RS-485/RS-422 přijímač, 20 Mbps (redukovaný odběr), ±16,5 kV ESD, párové ' +
      'enable EN12/EN34',
    notes:
      'Renesas/Intersil "Quad Receivers" — součást stejné rodiny 6 čipů jako ISL32173E/32175E/' +
      '32177E/32273E/32277E (samostatné záznamy) — viz záznam ISL32173E pro plný popis společných ' +
      'vlastností rodiny. ISL32275E: nízkopříkonová (20 Mbps) obdoba ISL32175E — stejné ' +
      '16vývodové pouzdro a párové enable piny EN12/EN34 (na rozdíl od ISL32273E se společným ' +
      'EN/EN̄), odběr max 5,5 mA (plné zatížení) / 3,5 mA (poloviční zatížení přes EN12/EN34).',
    tags: 'io,rs485,rs422,přijímač,receiver,isl32275e,transceiver,soic,tssop,nízký-odběr',
  },
  {
    name: 'ISL32277E',
    packageType: '24 LD QFN (4×4 mm), VCC 3,0–5,5 V, VL 1,4–VCC (samostatný logický napájecí pin)',
    value:
      'Počtvrtý (4×) RS-485/RS-422 přijímač, 20 Mbps (redukovaný odběr), ±16,5 kV ESD, ' +
      'individuální + skupinové enable, VL pin',
    notes:
      'Renesas/Intersil "Quad Receivers" — součást stejné rodiny 6 čipů jako ISL32173E/32175E/' +
      '32177E/32273E/32275E (samostatné záznamy) — viz záznam ISL32173E pro plný popis společných ' +
      'vlastností rodiny. ISL32277E: nízkopříkonová (20 Mbps) obdoba ISL32177E — shodné 24LD QFN ' +
      'pouzdro, individuální + skupinové enable, SHDNEN pin a VL logický napájecí pin pro smíšené ' +
      'napěťové systémy, ale nižší max. datový tok (20 Mbps) výměnou za nižší odběr: max 5,5 mA ' +
      '(plné zatížení) / 3,5 mA (poloviční) / 1,2 mA (SHDN via SHDNEN), oproti 15/8,5/2,5 mA ' +
      'u 80Mbps verze ISL32177E.',
    tags: 'io,rs485,rs422,přijímač,receiver,isl32277e,transceiver,qfn,shdn,nízký-odběr',
  },

  // Napájecí IC pro TFT-LCD displeje (automotive)
  {
    name: 'MAX25220',
    packageType: '32 TQFN-EP / 32 SWTQFN-EP (5×5 mm), AEC-Q100 Grade 1, -40 až +125 °C',
    value:
      '4kanálový automotive TFT-LCD napájecí obvod (BEZ VCOM bufferu) — AVDD 4,2–10,5 V @200 mA, ' +
      'NAVDD do -200 mA, VGON 7,6–20,2 V @15 mA, VGOFF -18,2 až -5,6 V @15 mA',
    notes:
      'Maxim Integrated (nyní Analog Devices) "MAX25220/MAX25221/MAX25221B — Automotive ' +
      '4-Channel TFT-LCD Power Supply with VCOM Buffer" (dok. 19-100803, rev. 4, 11/2020) — ' +
      'jednočipový zdroj všech napětí potřebných pro TFT-LCD panel (zdrojové/gate budiče) v ' +
      'automotive infotainmentech, přístrojových deskách a centrálních displejích. Integruje: ' +
      'synchronní boost regulátor pro symetrické kladné AVDD (4,2–10,5 V, do 200 mA, nastavitelné ' +
      'v krocích 0,1 V přes I2C); invertující regulátor NAVDD (záporné napětí, do -200 mA, ' +
      'regulace NAVDD vůči AVDD ±34 mV); pozitivní nábojovou pumpu VGON (gate-on napětí pro TFT ' +
      'budiče, 7,6–20,2 V @ 15 mA, krok 0,2 V, 3× násobič); negativní nábojovou pumpu VGOFF ' +
      '(gate-off napětí, -18,2 až -5,6 V @ 15 mA, zdvojovač). Spínací frekvence 420 kHz nebo ' +
      '2,1 MHz s volitelným spread-spectrum ditherem (±6 %) pro nízké EMI. Řízené sekvenční ' +
      'zapínání/vypínání všech výstupů (programovatelné pořadí). I2C řídicí/diagnostické rozhraní ' +
      's FLTB (přerušovacím) výstupem, podvýkonová (UV) diagnostika na všech výstupech, tepelné ' +
      'varování a vypnutí. Nezávislý stand-alone režim po naprogramování (bez nutnosti trvalého ' +
      'I2C řízení) i I2C-only (read-only) režim. Nevolatilní paměť (NV memory) umožňuje uložit ' +
      'kalibrované hodnoty všech výstupů (AVDD/NAVDD/VGON/VGOFF/sekvenci) — zapisovatelná ' +
      'max. 5× za život součástky (BURN příkaz), s auto-refresh funkcí. IN 2,65–5,5 V, interní ' +
      'V18 LDO 1,8 V @60 mA pro logiku. MAX25220 je základní varianta BEZ integrovaného VCOM ' +
      'bufferu (jen 4kanálové napájení TFT budičů) — viz samostatné záznamy MAX25221 (s VCOM ' +
      'bufferem a NTC teplotní kompenzací) a MAX25221B (s VCOM bufferem a odlišným chováním EN ' +
      'pinu při zapnutí) pro rozdíly v rámci rodiny.',
    tags: 'io,napájecí-obvod,tft-lcd,automotive,max25220,boost,i2c,aec-q100',
  },
  {
    name: 'MAX25221',
    packageType: '32 TQFN-EP / 32 SWTQFN-EP (5×5 mm), AEC-Q100 Grade 1, -40 až +125 °C',
    value:
      '4kanálový automotive TFT-LCD napájecí obvod S VCOM bufferem a NTC teplotní kompenzací — ' +
      'VCOM +1 V až -2,49 V v krocích 6,83 mV, jinak shodné s MAX25220',
    notes:
      'Maxim/Analog Devices "MAX25220/MAX25221/MAX25221B" (dok. 19-100803, rev. 4, 11/2020) — ' +
      'součást stejné rodiny jako MAX25220 (bez VCOM bufferu) a MAX25221B (samostatné záznamy) — ' +
      'viz záznam MAX25220 pro plný popis společných funkcí (boost AVDD, NAVDD, VGON/VGOFF ' +
      'nábojové pumpy, sekvenování, I2C, NV paměť, AEC-Q100). MAX25221 navíc integruje VCOM ' +
      'buffer (výstupní zesilovač pro řízení referenčního napětí LCD panelu VCOM) s výstupním ' +
      'rozsahem +1 V až -2,49 V v krocích 6,83 mV, a blok měření teploty (8bit ADC) s podporou ' +
      'externího NTC senzoru pro teplotní kompenzaci VCOM napětí (kompenzace driftu VCOM v ' +
      'závislosti na teplotě panelu — typicky nutné pro udržení konstantního kontrastu/potlačení ' +
      'flickeru LCD napříč provozní teplotou). Dostupný i v 32 TQFN-EP i 32 SWTQFN-EP (side-' +
      'wettable, pro AOI kontrolu pájených spojů) pouzdru — SWTQFN varianta byla v době ' +
      'vydání datasheetu označena jako "future product".',
    tags: 'io,napájecí-obvod,tft-lcd,automotive,max25221,vcom,boost,i2c,aec-q100,ntc',
  },
  {
    name: 'MAX25221B',
    packageType: '32 TQFN-EP (5×5 mm), AEC-Q100 Grade 1, -40 až +125 °C',
    value:
      '4kanálový automotive TFT-LCD napájecí obvod S VCOM bufferem, varianta s odlišným ' +
      'chováním EN pinu při zapnutí — jinak shodné s MAX25221',
    notes:
      'Maxim/Analog Devices "MAX25220/MAX25221/MAX25221B" (dok. 19-100803, rev. 4, 11/2020) — ' +
      'součást stejné rodiny jako MAX25220 (bez VCOM bufferu) a MAX25221 (samostatné záznamy) — ' +
      'viz záznamy MAX25220 a MAX25221 pro plný popis společných funkcí. MAX25221B je elektricky ' +
      'shodný s MAX25221 (VCOM buffer + NTC teplotní kompenzace), liší se pouze chováním ' +
      'startovací sekvence řízené EN pinem ("EN pin turn-on" varianta dle objednacího kódu ' +
      'výrobce) — určeno pro aplikace vyžadující odlišné řízení zapínání oproti standardnímu ' +
      'I2C/stand-alone sekvenování MAX25221. Dostupný pouze v 32 TQFN-EP pouzdru (bez SWTQFN ' +
      'varianty).',
    tags: 'io,napájecí-obvod,tft-lcd,automotive,max25221b,vcom,boost,i2c,aec-q100',
  },
  {
    name: 'MAX25520',
    packageType: '16 TQFN-EP / 16 SWTQFN-EP (3×3 mm), AEC-Q100 Grade 1, -40 až +125 °C',
    value:
      '2kanálový (jen AVDD+NAVDD) automotive TFT-LCD napájecí obvod — symetrická/asymetrická ' +
      'kladná/záporná napětí do ±10,5 V (±12 V u ATEC) @200 mA, bez VGON/VGOFF a bez I2C',
    notes:
      'Maxim/Analog Devices "MAX25520 — Automotive 2-Channel TFT-LCD Power Supply" ' +
      '(dok. 19-100974, rev. 0, 1/2021) — ⚠️ zjednodušená, menší (16pin, 3×3 mm) sesterská ' +
      'součástka k rodině MAX25220/MAX25221/MAX25221B (samostatné záznamy, 4kanálové, 32pin, ' +
      's I2C řízením a NV pamětí) — MAX25520 poskytuje POUZE symetrická/asymetrická kladná ' +
      '(AVDD) a záporná (NAVDD) napětí do ±10,5 V @200 mA (±12 V @200 mA u varianty ATEC), BEZ ' +
      'nábojových pump VGON/VGOFF pro gate-budiče a BEZ VCOM bufferu — jde o čistě analogovou/' +
      'pinově řízenou součástku (žádné I2C rozhraní, žádná NV paměť pro kalibraci) s jednoduchým ' +
      'nastavením výstupů externími odporovými děliči (FBP/FBN) a nezávislými enable piny ENP/ENN ' +
      '(umožňují buď nezávislé řízení obou výstupů, nebo jejich vzájemné sledování/"tracking"). ' +
      'Integruje: fully-integrated current-mode synchronní boost converter pro AVDD (LXP/HVINP, ' +
      'proudový limit 1,64–2,3 A, soft-start 5 ms) a current-mode invertující regulátor pro NAVDD ' +
      's externím usměrňovačem (LXN/INN, proudový limit 1,55–2,25 A). Spínací frekvence 420 kHz ' +
      '(ATEA) nebo 2,1 MHz (ATEB/ATEC) se spread-spectrum ditherem ±6 % pro nízké EMI. Ochrany: ' +
      'UV diagnostika na obou výstupech (AVDD i NAVDD, práh 80–90 % nastavené hodnoty), zkratová ' +
      'ochrana (40 % prahu), fault timeout 30 ms s automatickým retry po 1,9 s, FLTB chybový ' +
      'výstup (open-drain). IN 2,65–5,5 V (ATEC vyžaduje 4,5–5,5 V), interní V18 LDO 1,8 V @50 mA. ' +
      'Varianty: ATEA (420 kHz, AVDD/HVINP do 10,5 V), ATEB (2,1 MHz, do 10,5 V), ATEC (2,1 MHz, ' +
      'do 12 V, vyšší min. IN 4,5 V). Dostupný v TQFN-EP i SWTQFN-EP (side-wettable) pouzdru.',
    tags: 'io,napájecí-obvod,tft-lcd,automotive,max25520,boost,invertor,aec-q100',
  },
  {
    name: 'ISL97652',
    packageType: '48 Ld 7×7 mm QFN, tepelně vylepšené (exponovaný termální pad), -40 až +85 °C',
    value:
      '4kanálový integrovaný LCD napájecí obvod s duálními VCOM zesilovači — AVDD boost do ' +
      '19,5 V (OVP), VON až 34 V, VOFF do -15 V, VLOGIC buck 1,5–3,3 V, vstup 8–15 V',
    notes:
      'Intersil (nyní Renesas) "ISL97652 — 4-Channel Integrated LCD Supply with Dual VCOM ' +
      'Amplifiers" (dok. FN9287.1, 2. 11. 2007) — vysoce výkonný integrovaný napájecí obvod pro ' +
      'velkoplošné LCD panely (LCD-TV do 40", průmyslové/zdravotnické displeje) — funkčně ' +
      'podobná kategorie jako novější automotive rodina Maxim MAX25220/21/21B v této knihovně, ' +
      'ale odlišný (starší generace, non-automotive) výrobek. Integruje: vysokovýkonný boost ' +
      'měnič pro AVDD generaci s integrovaným 2,8A špičkovým boost FET (typ. účinnost 91 %, ' +
      'rDS(on) 125–200 mΩ, OVP práh 18,8–20 V/typ. 19,5 V s hysterezí 0,8 V); AVDD zpožďovací ' +
      '("delay") spínač s integrovaným 2A FET pro sekvenování a zkratovou ochranu výstupu (RDS(on) ' +
      '180–240 mΩ, RMS proudový limit 1,5–2 A); duální řadiče nábojových pump pro VON (2× nebo 3× ' +
      'násobič, rozsah VSUP+2 V až 34 V) a VOFF (1× invertor, rozsah VSUP+1,4 V až 0 V); ' +
      'asynchronní buck regulátor pro VLOGIC (logické napájení panelu) s integrovaným 2,5A ' +
      'špičkovým FET (typ. účinnost 85 %, rozsah výstupu 1,5–3,3 V); VON-SLICE obvod pro potlačení ' +
      'flickeru (ořezávání VON signálu); dva rychlé VCOM operační zesilovače (trvale aktivní, ' +
      'pokud je přítomno AVIN) s vysokým slew rate 50 V/µs, gain-bandwidth 30 MHz, CMRR 70 dB, ' +
      'PSRR 85 dB, offset max 20 mV, výstupní proud do 50 mA/kanál (zkratový limit 300–400 mA). ' +
      'Spínací frekvence volitelná pinem FREQ: 650 kHz (FREQ=GND) nebo 1,3 MHz (FREQ=VIN) — sdílená ' +
      'pro boost, buck, VON i VOFF. Vstupní napětí PVIN 8–15 V (typ. 12 V), VSUP (napájení ' +
      'nábojových pump) 8–20 V, VGH (napájení VON-SLICE) 8–30 V, AVIN (napájení op-zesilovačů) ' +
      '4,5–20 V. Ochrany: UVLO (7,6–8,0 V na PVIN), tepelné vypnutí při 150 °C (reset při 100 °C), ' +
      'programovatelný soft-start (SS/SSB/DLY1/DLY2 piny) pro řízené sekvenování všech výstupů. ' +
      'Dostupný jako ISL97652IRZ (48 Ld 7×7 QFN, i v -T/-TK verzích pro pásmo/cívku).',
    tags: 'io,napájecí-obvod,lcd-tv,vcom,boost,buck,nábojová-pumpa,isl97652,intersil,qfn',
  },
  {
    name: 'ISL78010',
    packageType: '32 Ld 5×5 mm TQFP, AEC-Q100 tested, -40 až +105 °C',
    value:
      'Automotive TFT-LCD napájecí obvod — boost (VBOOST 5,5–20 V @2 A FET) + 2× kladné LDO ' +
      '(VON, VLOGIC) + 1× záporné LDO (VOFF), programovatelná sekvence',
    notes:
      'Renesas (dříve Intersil) "ISL78010 — Automotive Grade TFT-LCD Power Supply" (dok. FN6501, ' +
      'rev. 2.00, 4. 12. 2013) — ⚠️ jiná architektura než ostatní LCD napájecí IC v této knihovně ' +
      '(ISL97652 používá nábojové pumpy pro VON/VOFF a buck pro VLOGIC; rodina Maxim MAX2522x ' +
      'používá jen boost+invertor) — ISL78010 generuje VON i VOFF pomocí LINEÁRNÍCH regulátorů ' +
      '(LDO) řízených externím tranzistorem (open-drain DRVP/DRVN/DRVL budicí výstupy, VON přes ' +
      'externí NPN, VOFF přes externí PNP, VLOGIC přes externí N-kanál), nikoli nábojovou pumpou ' +
      '— jednodušší, ale s nižší účinností při vyšším proudovém odběru VON/VOFF větví. Integruje: ' +
      'jediný boost converter s integrovaným 2A spínacím FET (RDS(on) 320 mΩ, do 20 V výstup, ' +
      'regulace ±1 %, účinnost 85–92 %, oscilátor 1 MHz), přepínatelný mezi P-mode (rychlejší ' +
      'přechodová odezva, pin CINT na VDD) a PI-mode (lepší zátěžová regulace, CINT přes externí ' +
      'kondenzátor 4,7 nF na SGND); VON LDO (FBP zpětná vazba, reguluje na 1,2 V, DRVP báze ' +
      'externího NPN); VOFF LDO (FBN zpětná vazba, reguluje na 0,203 V, DRVN báze externího PNP); ' +
      'VLOGIC LDO (FBL zpětná vazba, reguluje na 1,2 V, DRVL gate externího N-FET, do 500 mA). ' +
      'Programovatelná startovací sekvence (přes kondenzátor CDLY): VLOGIC→VBOOST→VOFF→VON nebo ' +
      'VLOGIC→VOFF→VBOOST→VON, s nastavitelným zpožděním mezi kroky (tDEL1/tDEL2 typ. 10/17 ms ' +
      'při CDLY=0,22 µF). Plná poruchová ochrana na všech 4 kanálech (VBOOST/VON/VOFF/VLOGIC) — ' +
      'při detekci poruchy se obvod zablokuje (latch-off), dokud není cyklováno VDD nebo EN pin ' +
      '(u VLOGIC poruchy nezávisle na EN); tepelné vypnutí při 140 °C; push-pull PG výstup pro ' +
      'externí ochranný FET. Bandgap reference VREF s bypass kondenzátorem. Vstup VDD 3–5,5 V, ' +
      'klidový proud 1,7 mA (aktivní)/750 µA (disabled). Dostupný jako ISL78010ANZ (32 Ld 5×5 ' +
      'TQFP), i s evaluačním kitem ISL78010EVAL1Z.',
    tags: 'io,napájecí-obvod,tft-lcd,automotive,ldo,boost,isl78010,renesas,intersil,tqfp',
  },
  {
    name: 'EC9223',
    packageType: '16-pin WQFN 3×3 mm (exponovaný termální pad)',
    value:
      'Malý integrovaný TFT-LCD napájecí obvod — boost (20 V/1,8 A NFET, 1,2 MHz) + VGH/VGL ' +
      'nábojové pumpy + unity-gain VCOM buffer (±150 mA), VIN 2,5–5,5 V',
    notes:
      'E-CMOS Corp. (Tchaj-wan) "EC9223 — Multi-Channel TFT LCD Supply" (dok. 5E26N-Rev. F001) ' +
      '— kompaktní (16pin WQFN 3×3 mm) all-in-one napájecí řešení pro malé až středně velké TFT ' +
      'LCD panely (notebooky, tablety, navigace, přenosná zařízení) — podobná kategorie jako ' +
      'ISL78010/ISL97652/MAX2522x v této knihovně, ale menší/jednodušší a od jiného (tchajwanského) ' +
      'výrobce. Integruje: proudově řízený (current-mode) PWM boost converter s integrovaným ' +
      '20V/1,8A N-kanálovým FET (RDS(on) 700 mΩ), pevná spínací frekvence 1,2 MHz, účinnost do ' +
      '90 %, výstupní přesnost ±1 % (FB reguluje na 1,2 V, nastavení AVDD externím odporovým ' +
      'děličem), soft-start 7 ms, proudový limit 1,4–2,2 A; kladnou nábojovou pumpu VGH (FBP ' +
      'reguluje na 1,2 V, AVDD napájení 6–16 V, spínací frekvence 600 kHz, nastavení externím ' +
      'děličem); zápornou nábojovou pumpu VGL (FBN reguluje na 0,24 V nominal); integrovaný ' +
      'unity-gain operační zesilovač pro buzení LCD VCOM (napájení AVDD 6–16 V, výstupní zkratový ' +
      'proud ±100–150 mA, slew rate 8–12 V/µs, šířka pásma 12 MHz, vstupní offset ±15 mV); a ' +
      'obvod detekce podpětí (low-voltage detector) generující reset signál RSTnn (aktivní v ' +
      'L, open-drain) při poklesu VIN pod 2,6 V, s 120ms blanking dobou při power-on. Soft-start ' +
      'a časované zpožděné poruchové zablokování (fault latch) na všech výstupech, tepelné ' +
      'vypnutí. VIN 2,5–5,5 V, aktivní enable pin (EN) se 4µA pull-down. Dostupný jako ' +
      'EC9223NNQ1R.',
    tags: 'io,napájecí-obvod,tft-lcd,vcom,boost,nábojová-pumpa,ec9223,e-cmos,wqfn',
  },
  {
    name: 'XC9516',
    packageType: 'QFN-20 (4×4 mm), -40 až +85 °C',
    value:
      'Trojvýstupový napájecí obvod pro TFT-LCD (step-up DC/DC + 2× nábojová pumpa) — VOUT ' +
      '5,5–19 V (DC/DC), VIN 2,5–5,5 V, externí N-kanálové MOSFET budiče pro VGH/VGL',
    notes:
      'Torex Semiconductor "XC9516 Series — Triple Output Power Supply for TFT-LCD" (dok. ' +
      'ETR0707-009) — podobná kategorie jako EC9223/ISL78010/ISL97652/MAX2522x v této knihovně ' +
      '(japonský výrobce). Na rozdíl od EC9223/ISL78010 (integrované nábojové pumpy s vlastním ' +
      'budicím FET) používá XC9516 EXTERNÍ N-kanálové MOSFETy jako budiče kladné i záporné ' +
      'nábojové pumpy (DRV1/DRV2 piny — open-drain řídicí výstupy pro externí tranzistory), což ' +
      'umožňuje škálovat výstupní proud/napětí volbou externích součástek. Integruje: step-up ' +
      '(boost) DC/DC měnič pro zdrojový budič (AVDD, VOUT), s nastavitelným výstupem 5,5–19 V ' +
      '(externím odporovým děličem na FB, přesnost ±1,5 %), oscilátor nastavitelný externím ' +
      'odporem (ROSC) v rozsahu 300 kHz–1,2 MHz, proudový limit LX spínače 1,1–1,5 A (typ. 1,3 A), ' +
      'maximální duty cycle 92–98 %, soft-start 2–5 ms; kladnou nábojovou pumpu (FB2, error amp + ' +
      'externí FET přes DRV2/CP2SWB) a zápornou nábojovou pumpu (FB1, error amp + externí FET ' +
      'přes DRV1) pro generování VGH/VGL napětí pro gate budič LCD panelu — v příkladové aplikaci ' +
      'VOUT=9,2 V, VGL=-5,3 V, VGH=12 V. Integrovaná sekvence zapínání (power-on sequencing) pro ' +
      'omezení nárazového proudu při náběhu výstupů — step-up výstup lze navíc řadit do sekvence ' +
      'přidáním externího P-kanálového FET, který zároveň umožňuje úplné odpojení vstupní větve ' +
      'při CE=L. Ochrany: přepěťová ochrana step-up výstupu (nastavitelná objednacím kódem, typ. ' +
      '21 V), zkratová ochrana step-up i obou nábojových pump (s nastavitelným zpožděním přes CD ' +
      'pin), tepelné vypnutí 150 °C, UVLO 1,87 V (hystereze 0,44 V). Objednací kód XC9516①②③④⑤⑥-⑦ ' +
      'kóduje UVLO práh, přepěťový a nadproudový limit a variantu balení (např. ' +
      'XC9516A21AZR-G = UVLO 1,87 V, OVP 21 V, OCP 1,3 A, QFN-20, 1000 ks/cívka, bezhalogenová ' +
      '"-G" verze). RoHS/Pb-free.',
    tags: 'io,napájecí-obvod,tft-lcd,boost,nábojová-pumpa,xc9516,torex,qfn',
  },
];

export function buildIcSeed(): ComponentInput[] {
  return IC_SPECS.map((spec) => ({
    name: spec.name,
    category: 'IO',
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

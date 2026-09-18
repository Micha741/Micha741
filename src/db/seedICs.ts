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

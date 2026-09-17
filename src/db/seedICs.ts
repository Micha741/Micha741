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

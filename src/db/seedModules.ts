import type { ComponentInput } from '../types/component';

interface ModuleSpec {
  name: string;
  packageType: string;
  value: string;
  notes: string;
  tags: string;
}

const MODULE_SPECS: ModuleSpec[] = [
  {
    name: 'ESP32-C3-MINI-1',
    packageType:
      'SMD modul 13,2 × 16,6 × 2,4 mm, 53 pinů (pod modulem, castellated), z toho 15 GPIO ' +
      '(3 strapping GPIO), EN, 3V3, GND — deska pod modulem musí mít vyhrazenou "keepout zónu" ' +
      'bez mědi pod integrovanou PCB anténou (viz Hardware Design Guidelines výrobce)',
    value: 'Wi-Fi + BLE modul, ESP32-C3FH4 (4 MB flash), integrovaná PCB anténa, VDD 3,0–3,6 V',
    notes:
      'Espressif ESP32-C3-MINI-1 (datasheet v2.0), malý SMD modul postavený na čipu ESP32-C3FH4 ' +
      '(RISC-V 32bit, do 160 MHz, Wi-Fi 802.11b/g/n + Bluetooth 5/LE) se 4 MB flash integrovanou ' +
      'přímo v pouzdře čipu, 40 MHz krystalem a přizpůsobovacím RF obvodem na desce modulu — na ' +
      'rozdíl od holého čipu ESP32-C3 (samostatný záznam v kategorii IO) nevyžaduje vlastní anténu ' +
      'ani krystal, stačí napájení a případně RC obvod na pinu EN. ' +
      '⚠️ Sesterská varianta „ESP32-C3-MINI-1U" má stejné parametry, ale místo integrované PCB ' +
      'antény má konektor pro externí anténu (U.FL/MHF3/AMMC kompatibilní, rozměr 13,2×12,5×2,4 mm) ' +
      '— pokud je potřeba modul s konektorem, jde o odlišný ordering code, ne o tento díl. ' +
      'K dispozici i teplotní varianty: „-N4X"/-N4 (85 °C) a „-H4X"/-H4 (105 °C), novější revize ' +
      'čipu v1.1 má cca o 10 KB více dostupné SRAM než starší v0.4 (viz ESP32-C3 Series SoC Errata). ' +
      'Paměť/CPU: 384 KB ROM, 400 KB SRAM (16 KB cache), 8 KB RTC SRAM, 4 MB Quad-SPI flash v pouzdře. ' +
      'Periferie vyvedené na modulu: SPI, UART (U0RXD/U0TXD na GPIO20/21), I2C, I2S, RMT, LED PWM, ' +
      'GDMA, TWAI (CAN dle ISO 11898-1), USB Serial/JTAG (GPIO18=USB_D-, GPIO19=USB_D+), teplotní ' +
      'senzor, SAR ADC (ADC1 5 kanálů kalibrovaných, ADC2 1 kanál nekalibrovaný). ' +
      'Mezní hodnoty: VDD33=-0,3 až 3,6 V, doporučeno 3,0–3,6 V (typ. 3,3 V), doporučený zdroj ' +
      'proudu ≥500 mA. Skladovací teplota -40 až 105 °C (dle varianty -40 až 85 °C nebo -40 až 105 °C). ' +
      'Proudový odběr: Wi-Fi TX až 350 mA (802.11b/1 Mbps/20,5 dBm), Wi-Fi RX 82–84 mA, ' +
      'BLE TX až 340 mA (@20 dBm), BLE RX 86 mA, modem-sleep 16–28 mA (dle CPU frekvence/zátěže), ' +
      'light-sleep 130 µA, deep-sleep 5 µA, power-off 1 µA. ' +
      'Strapping piny GPIO2/GPIO8/GPIO9 určují boot mód (SPI boot / joint download boot přes ' +
      'USB-Serial-JTAG nebo UART) — GPIO9 má interní pull-up (výchozí log. 1), GPIO2 a GPIO8 jsou ' +
      've výchozím stavu plovoucí. Pin EN (enable) nesmí zůstat nezapojený — doporučeno RC zpoždění ' +
      '(R=10 kΩ, C=1 µF) pro stabilní náběh napájení. ' +
      'Certifikace: RoHS/REACH, ESD HBM ±2000 V / CDM ±500 V, MSL3 (nutno zpracovat do 168 h po ' +
      'vybalení nebo předsušit).',
    tags:
      'modul,esp32,esp32-c3,esp32-c3-mini-1,wifi,bluetooth,ble,risc-v,smd,pcb-anténa,mikrokontrolér',
  },
  {
    name: 'ESP32-C3-WROOM-02',
    packageType:
      'SMD modul 18,0 × 20,0 × 3,2 mm, 19 pinů (18 po obvodu + spodní EPAD), z toho 15 GPIO ' +
      '(3 strapping GPIO), EN, 3V3, GND — deska pod modulem musí mít vyhrazenou "keepout zónu" ' +
      'bez mědi pod integrovanou PCB anténou (viz Hardware Design Guidelines výrobce)',
    value: 'Wi-Fi + BLE modul, ESP32-C3 (bare chip) + externí SPI flash 4 MB, integrovaná PCB anténa, VDD 3,0–3,6 V',
    notes:
      '⚠️ Odlišný od „ESP32-C3-MINI-1" (samostatný záznam) — WROOM-02 je větší modul (18×20 mm ' +
      'vs. 13,2×16,6 mm u MINI-1) používající holý čip „ESP32-C3" (bez vestavěné flash v pouzdře ' +
      'čipu) a samostatný externí SPI flash čip na desce modulu (standardně 4 MB Quad-SPI, na ' +
      'objednávku 8 nebo 16 MB), zatímco MINI-1 má flash integrovanou přímo v pouzdře čipu ' +
      '(ESP32-C3FH4). Espressif ESP32-C3-WROOM-02 (datasheet v1.5). ' +
      'Sesterská varianta „ESP32-C3-WROOM-02U" má stejné parametry, ale místo integrované PCB ' +
      'antény má konektor pro externí anténu (U.FL/MHF-I/AMC kompatibilní, rozměr 18×14,3×3,2 mm). ' +
      'K dispozici i teplotní varianty „-N4" (85 °C) a „-H4" (105 °C). ' +
      'RISC-V 32bit procesor do 160 MHz, Wi-Fi 802.11b/g/n (do 150 Mbps) + Bluetooth 5/LE. ' +
      'Paměť/CPU: 384 KB ROM, 400 KB SRAM (16 KB cache), 8 KB RTC SRAM, externí SPI flash ' +
      '(výchozí 4 MB, na objednávku až 16 MB, max. takt 80 MHz standardně / 120 MHz na vyžádání). ' +
      'Periferie vyvedené na modulu: SPI, UART (RXD/TXD na GPIO20/21), I2C, I2S, RMT, LED PWM, ' +
      'GDMA, TWAI (CAN dle ISO 11898-1), USB Serial/JTAG (GPIO18=USB_D-, GPIO19=USB_D+), teplotní ' +
      'senzor, SAR ADC (ADC1 5 kanálů kalibrovaných, ADC2 1 kanál nekalibrovaný). ' +
      'Mezní hodnoty: VDD33=-0,3 až 3,6 V, doporučeno 3,0–3,6 V (typ. 3,3 V), doporučený zdroj ' +
      'proudu ≥500 mA. Skladovací/provozní teplota dle varianty -40 až 85 °C nebo -40 až 105 °C. ' +
      'Proudový odběr: Wi-Fi TX až 345 mA (802.11b/1 Mbps/20,5 dBm), Wi-Fi RX 82–84 mA, ' +
      'BLE TX -24 až +20 dBm rozsah, modem-sleep 16–28 mA (dle CPU frekvence/zátěže), ' +
      'light-sleep 130 µA, deep-sleep 5 µA, power-off 1 µA. ' +
      'Strapping piny GPIO2/GPIO8/GPIO9 určují boot mód (SPI boot / joint download boot přes ' +
      'USB-Serial-JTAG nebo UART) — GPIO9 má interní pull-up (výchozí log. 1), GPIO2 a GPIO8 jsou ' +
      've výchozím stavu plovoucí. Pin EN nesmí zůstat nezapojený — doporučeno RC zpoždění ' +
      '(R=10 kΩ, C=1 µF) pro stabilní náběh napájení. ' +
      'Certifikace: RoHS/REACH, ESD HBM ±2000 V / CDM ±500 V, MSL3 (nutno zpracovat do 168 h po ' +
      'vybalení nebo předsušit).',
    tags:
      'modul,esp32,esp32-c3,esp32-c3-wroom-02,wifi,bluetooth,ble,risc-v,smd,pcb-anténa,mikrokontrolér',
  },
  {
    name: 'Adafruit Feather HUZZAH ESP8266',
    packageType:
      'Vývojová deska ve formátu Feather, THT, 51 × 23 × 8 mm (bez pinových lišt), hmotnost 6 g, ' +
      '16 vývodů podél dvou delších hran (z toho 9 aktivních GPIO, zbytek NC pro kompatibilitu ' +
      's ostatními deskami řady Feather), micro USB konektor, 2pinový JST konektor pro LiPo baterii, ' +
      'tlačítka RESET a GPIO0, 4 montážní otvory',
    value:
      'Wi-Fi vývojová deska, ESP8266 (jádro Tensilica L106 32bit) @ 80/160 MHz, 4 MB (32 Mbit) ' +
      'flash, 3,3 V logika, onboard USB-sériový převodník CP2104, LiPo nabíječka 100 mA',
    notes:
      'Adafruit Feather HUZZAH ESP8266 (Adafruit Learning System guide, aktualizace 2018-01-11, ' +
      'produkt #2821) — hotová vývojová deska postavená na Wi-Fi modulu ESP-12 (čip ESP8266EX), ' +
      'ne bare chip ani samostatný radiový modul. ⚠️ Zcela odlišná čipová rodina od ESP32/ESP32-C3 ' +
      '(samostatné záznamy v kategorii IO) — ESP8266 má jednojádrové jádro Tensilica L106 32bit ' +
      '(ne Xtensa LX6 ani RISC-V) a podporuje pouze Wi-Fi 802.11 b/g/n, žádné Bluetooth/BLE. ⚠️ Na ' +
      'rozdíl od modulů ESP32-C3-MINI-1/WROOM-02 (samostatné záznamy) jde o kompletní vývojovou ' +
      'desku s vlastním USB-sériovým převodníkem (Silicon Labs CP2104, do 921600 baud, auto-reset ' +
      'pro nahrávání firmwaru bez nutnosti ručně mačkat tlačítka) a LiPo nabíjecí obvodem — ne o holý ' +
      'radiový modul určený k pájení na vlastní DPS. Deska láme na konektor jen 9 z GPIO pinů čipu: ' +
      'GPIO0, GPIO2, GPIO4, GPIO5, GPIO12, GPIO13, GPIO14, GPIO15, GPIO16 (plus 1 analogový vstup ' +
      '"A", max. 1,0 V). Výchozí přiřazení: I2C SDA=GPIO4/SCL=GPIO5, SPI SCK=GPIO14/MOSI=GPIO13/' +
      'MISO=GPIO12 — piny lze softwarově přemapovat. Boot-mode piny: GPIO0 (musí být při startu LOW ' +
      'pro vstup do bootloaderu, jinak HIGH pro normální běh; ovládá i červenou LED), GPIO2 (musí ' +
      'zůstat HIGH při startu, interní pull-up, ovládá modrou LED u antény), GPIO15 (musí zůstat LOW ' +
      'při startu, má externí pull-down — nesmí být vytažen nahoru při startu). GPIO16 slouží k ' +
      'probuzení z deep-sleep (nutno propojit s pinem RST). Piny RST a EN (CH_PD) jsou aktivní ' +
      'v log. 0, interně vytaženy nahoru, 3,3 V logika. RX je 5V tolerantní (úrovňový převodník na ' +
      'desce), TX je pouze 3,3 V výstup. Maximální proud na GPIO pin 12 mA. Napájení: micro USB 5 V ' +
      '→ interní 3,3V/500mA špičkový regulátor (doporučeno počítat s cca 250 mA trvale, ESP8266 může ' +
      'krátkodobě odebírat špičky 250+ mA) nebo LiPo baterie 3,7/4,2 V přes JST konektor s vestavěnou ' +
      'nabíječkou 100 mA (automatické přepnutí na USB napájení a dobíjení baterie při připojení USB, ' +
      '"hotswap" — baterie zůstává jako záložní zdroj). Pin EN uzemněním vypíná 3,3V regulátor (piny ' +
      'BAT a USB zůstávají napájené). Není určeno pro 5V logiku kromě pinu RX.',
    tags: 'modul,esp8266,esp-12,huzzah,feather,wifi,vývojová-deska,tensilica,adafruit',
  },
  {
    name: 'ESP8684-MINI-1',
    packageType:
      'SMD modul 13,2 × 16,6 × 2,4 mm, 53 pinů (pod modulem, castellated), z toho 14 GPIO ' +
      '(2 strapping GPIO), EN, 3V3, GND — deska pod modulem musí mít vyhrazenou "keepout zónu" ' +
      'bez mědi pod integrovanou PCB anténou (viz Hardware Design Guidelines výrobce)',
    value:
      'Wi-Fi + BLE modul, ESP8684H2X/H4X (2/4 MB vestavěná flash), integrovaná PCB anténa, ' +
      'VDD 3,0–3,6 V',
    notes:
      'Espressif ESP8684-MINI-1 (datasheet v1.0), malý SMD modul postavený na čipu ESP8684 ' +
      '(RISC-V 32bit, do 120 MHz, Wi-Fi 802.11 b/g/n + Bluetooth LE 5,3) se 26 MHz krystalem, ' +
      'SPI flash a přizpůsobovacím RF obvodem integrovanými na desce modulu. ⚠️ Odlišné od modulů ' +
      'ESP32-C3-MINI-1/WROOM-02 (samostatné záznamy) — čip ESP8684 patří dle výrobce do "skupiny ' +
      'ESP32-C2" (menší, levnější, méně GPIO než ESP32-C3, žádný USB Serial/JTAG). ' +
      '⚠️ Sesterská varianta "ESP8684-MINI-1U" má stejné parametry, ale místo integrované PCB ' +
      'antény má konektor pro externí anténu a mírně menší rozměr desky (13,2×12,5×2,4 mm, bez ' +
      'antenní keepout zóny) — pokud je potřeba modul s konektorem, jde o odlišný ordering code, ' +
      'ne o tento díl. Obě varianty existují ve dvou verzích dle velikosti vestavěné flash: ' +
      '"-H2X" (2 MB) a "-H4X" (4 MB), obě na revizi čipu v2.0. ' +
      'Paměť/CPU: 576 KB ROM, 272 KB SRAM (16 KB cache), SPI flash v pouzdře čipu (výchozí takt ' +
      '60 MHz, bez podpory auto-suspend). Periferie vyvedené na modulu: 14 GPIO (IO0–IO10, IO18, ' +
      'RXD0=GPIO19, TXD0=GPIO20), SPI, UART, I2C master, LED PWM (6 kanálů), obecný DMA řadič, ' +
      '12bit SAR ADC (do 5 kanálů), teplotní senzor, obecné a systémové časovače, watchdogy. ' +
      'Mezní hodnoty: napájení 3,0–3,6 V (typ. 3,3 V), doporučený zdroj proudu ≥500 mA. Provozní ' +
      'okolní teplota -40 až 105 °C. ' +
      'Proudový odběr: Wi-Fi TX až 370 mA špička (802.11b/1 Mbps/+22 dBm), Wi-Fi RX špička 65 mA, ' +
      'BLE TX až 320 mA špička (@20 dBm), BLE RX špička 62 mA, modem-sleep 9,4–15,6 mA (dle CPU ' +
      'frekvence/zátěže), light-sleep 140 µA, deep-sleep 5 µA, power-off 1 µA. ' +
      'Strapping piny GPIO8 a GPIO9 určují boot mód — GPIO9 má výchozí interní pull-up (log. 1), ' +
      'GPIO8 je ve výchozím stavu plovoucí (N/A). Pin EN (enable) nesmí zůstat nezapojený. ' +
      'Piny IO0, IO1, IO3 a IO5/MTDI mají při náběhu napájení krátké nízkoúrovňové zákmity (viz ' +
      'datasheet). ' +
      'Certifikace: RoHS/REACH, HTOL/HTSL/uHAST/TCT/ESD/Latch-up dle JEDEC.',
    tags:
      'modul,esp8684,esp32-c2,wifi,bluetooth,ble,risc-v,smd,pcb-anténa,mikrokontrolér',
  },
];

export function buildModuleSeed(): ComponentInput[] {
  return MODULE_SPECS.map((spec) => ({
    name: spec.name,
    category: 'Modul',
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

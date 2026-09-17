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

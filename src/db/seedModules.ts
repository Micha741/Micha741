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
  {
    name: 'ESP-12S',
    packageType:
      'SMD-16 modul, 24 × 16 × 3 mm (±0,2 mm), hmotnost 0,45 g, 16 pinů (8 po každé straně), ' +
      'z toho 9 využitelných I/O portů (RST, ADC, EN, IO16, IO14, IO12, IO13, VCC na jedné straně; ' +
      'TXD, RXD, IO5, IO4, IO0, IO2, IO15, GND na druhé), integrovaná PCB anténa (zisk 2 dBi)',
    value:
      'Wi-Fi modul, ESP8266 (model ESP-12) @ do 160 MHz, vestavěná SPI flash 32 Mbit (4 MB), ' +
      'VDD 3,0–3,6 V',
    notes:
      'ESP-12S 802.11 b/g/n Wi-Fi Module V1.1 (výrobce RF Solutions / AI-Thinker), modulový model ' +
      '"ESP-12" — nejmenší balení modulu na bázi čipu ESP8266 v aktuální revizi "S". ⚠️ Odlišné od ' +
      'záznamu "Adafruit Feather HUZZAH ESP8266" (samostatný záznam, kategorie Modul) — ten používá ' +
      'stejnou rodinu modulů ESP-12 jako součástku osazenou na hotové vývojové desce s USB-sériovým ' +
      'převodníkem a LiPo nabíječkou, zatímco ESP-12S je samotný holý SMD modul určený k přímému ' +
      'pájení na vlastní DPS (bez USB, bez napájecí/nabíjecí elektroniky) — nejmenší stavební ' +
      'jednotka pro vlastní návrh. ⚠️ Stejná čipová rodina (ESP8266) jako ESP8285 a ESP8089 ' +
      '(samostatné záznamy v kategorii IO), ale architektonicky odlišná od ESP32/ESP32-C3/ESP8684 ' +
      '(ty používají RISC-V nebo Xtensa LX6, ESP8266 uvnitř ESP-12S má jádro Tensilica L106). ' +
      'Integrované Wi-Fi MAC/BB/RF/PA/LNA, vestavěný lwIP protokolový zásobník, podpora režimů ' +
      'STA/AP/STA+AP, Smart Config/AirKiss, obecné AT příkazy, vzdálená aktualizace firmwaru (FOTA). ' +
      'Rozhraní: UART (300–4 608 000 bps, výchozí 115 200), HSPI, I2C, PWM, 10bit ADC. Frekvenční ' +
      'rozsah 2412–2484 MHz. Výstupní výkon: 802.11b 16±dBm @11 Mbps, 802.11g 14±2 dBm @54 Mbps, ' +
      '802.11n 13±dBm @HT20/MCS7. Citlivost přijímače: CCK 1 Mbps -90 dBm, CCK 11 Mbps -85 dBm, ' +
      '6 Mbps (1/2 BPSK) -88 dB, 54 Mbps (3/4 64-QAM) -70 dBm. Proudový odběr (typ.): nepřetržité ' +
      'vysílání průměr 71 mA / špička 300 mA, modem-sleep 20 mA, light-sleep 2 mA, deep-sleep ' +
      '0,02 mA (20 µA). Zabezpečení WEP/WPA-PSK/WPA2-PSK. Napájení 3,0–3,6 V, doporučený zdroj ' +
      'proudu >300 mA. Provozní teplota -20 až 85 °C, skladovací prostředí -40 až 90 °C při <90 % RH. ' +
      'Certifikace FCC, CE.',
    tags: 'modul,esp8266,esp-12,esp-12s,wifi,smd,pcb-anténa,tensilica',
  },
  {
    name: 'PT10 (Alfatronix PowerTector)',
    packageType:
      '155 × 30 × 15 mm, 45 g, izolované faston konektory 6,3 mm, montáž stahovací páskou ' +
      'přímo na kabeláž (bez nutnosti šasi) — nejmenší model řady, in-line zapojení do jednoho ' +
      'konkrétního spotřebiče',
    value:
      'Programovatelný nízkonapěťový odpojovač baterie (Low Voltage Disconnect), 10 A trvale, ' +
      'VIN 9–32 Vdc (auto. reference), IP65',
    notes:
      'Alfatronix PowerTector Series "Low Voltage Disconnect" / solidstátový "Battery Guard" ' +
      '(dok. EU-EN-PV-0710). Elektronický modul, který sleduje napětí baterie a při poklesu pod ' +
      'naprogramovanou mez odpojí připojenou zátěž — chrání olověnou baterii (typ. startovací ' +
      'baterii vozidla) před hlubokým vybitím. ⚠️ Součást šestičlenné řady PT10/PT20/PT40/PT60/' +
      'PT100/PT200 (samostatné záznamy) lišící se proudovou zátěží, konektory a rozměry/hmotností ' +
      '— PT10 je nejmenší model, elektricky shodný s PT20 (stejné rozměry/konektory/montáž, jen ' +
      'nižší jmenovitý proud). Vstupní napětí 9–32 Vdc s automatickou referencí, výstupní napětí ' +
      '= vstupní (max. úbytek 100 mV na svorkách při sepnutí). Přechodová nadproudová odolnost: ' +
      '110 % jmen. proudu 10 s, 200 % 1 s, 300 % <0,5 ms; po vybavení nadproudové ochrany ' +
      'automatický pokus o restart každých 30 s. Klidový odběr typ. 2 mA @13,6 V (vypnuto). ' +
      'Galvanické oddělení vstup/výstup/kryt >400 Vrms. Odolnost proti rázům dle ISO 7637-2 ' +
      '(24V vozidla), ESD dle ISO 10605/ISO 14892 (>8 kV kontaktní, 15 kV vzduchová). Provozní ' +
      'teplota -25 až +60 °C, skladovací -25 až +100 °C, krytí IP65 (pružná zalévací hmota, ' +
      'odolnější dlouhodobě než tvrdý epoxid). Odpojovací napětí programovatelné přes ' +
      'programovací terminál (kabel součástí dodávky), stav indikuje zelená LED. Vývod pro ' +
      'externí alarm (zvukový/optický v přístrojové desce). ⚠️ Na rozdíl od modelů PT40 a vyšších ' +
      'nemá PT10/PT20 vývod pro ovládání přes zapalování/ruční spínač (ten je až od 40 A výše). ' +
      'Ochrany: nadproud (proudové čidlo), přehřátí (teplotní čidlo), přechodové jevy (filtry), ' +
      'katastrofická porucha řešena externí vstupní pojistkou (dle aplikace) + zemnicí pojistkou ' +
      '1 A.',
    tags: 'modul,alfatronix,powertector,battery-guard,low-voltage-disconnect,odpojovač-baterie',
  },
  {
    name: 'PT20 (Alfatronix PowerTector)',
    packageType:
      '155 × 30 × 15 mm, 45 g, izolované faston konektory 6,3 mm, montáž stahovací páskou ' +
      'přímo na kabeláž (bez nutnosti šasi)',
    value:
      'Programovatelný nízkonapěťový odpojovač baterie (Low Voltage Disconnect), 20 A trvale, ' +
      'VIN 9–32 Vdc (auto. reference), IP65',
    notes:
      'Alfatronix PowerTector Series (dok. EU-EN-PV-0710). ⚠️ Součást řady PT10/PT20/PT40/PT60/' +
      'PT100/PT200 (samostatné záznamy) — PT20 sdílí s PT10 (samostatný záznam) stejné pouzdro, ' +
      'konektory, montáž i klidový odběr, liší se pouze jmenovitým proudem (20 A vs 10 A). Funkce ' +
      'a elektrické parametry shodné jako u PT10: vstupní napětí 9–32 Vdc s automatickou ' +
      'referencí, výstup = vstup (max. úbytek 100 mV), přechodová nadproudová odolnost 110 %/10 s, ' +
      '200 %/1 s, 300 %/<0,5 ms s automatickým restartem po 30 s, klidový odběr typ. 2 mA @13,6 V, ' +
      'galvanické oddělení >400 Vrms, ISO 7637-2 (rázy), ISO 10605/ISO 14892 (ESD >8 kV kontaktní/' +
      '15 kV vzduchová), provozní teplota -25 až +60 °C, skladovací -25 až +100 °C, IP65. ' +
      'Programovatelná odpojovací mez, zelená LED indikace, vývod pro externí alarm. Bez vývodu ' +
      'pro zapalování/ruční spínač (dostupné až od PT40 výše). Ochrany: nadproud, přehřátí, ' +
      'přechodové jevy, externí vstupní pojistka (dle aplikace) + zemnicí pojistka 1 A.',
    tags: 'modul,alfatronix,powertector,battery-guard,low-voltage-disconnect,odpojovač-baterie',
  },
  {
    name: 'PT40 (Alfatronix PowerTector)',
    packageType:
      '76 × 78 × 33 mm, 155 g, konektory M6 mosazné šrouby (ring tongues), třibodová montáž ' +
      '(3× pozi šroub) na šasi/desku pro potlačení mechanického namáhání na nerovném povrchu, ' +
      'litá hliníková skříň s krytem z polykarbonátu plněného sklem, odvod tepla do skříně bez ' +
      'nutnosti externího chladiče',
    value:
      'Programovatelný nízkonapěťový odpojovač baterie (Low Voltage Disconnect), 40 A trvale, ' +
      'VIN 9–32 Vdc (auto. reference), IP65',
    notes:
      'Alfatronix PowerTector Series (dok. EU-EN-PV-0710). ⚠️ Součást řady PT10/PT20/PT40/PT60/' +
      'PT100/PT200 (samostatné záznamy) — PT40 je elektricky shodný s PT60 (stejné rozměry/' +
      'konektory/montáž, jen nižší jmenovitý proud), ale ⚠️ odlišný od PT10/PT20 (jiné pouzdro — ' +
      'litá hliníková skříň místo tie-wrap in-line pouzdra, jiné konektory — M6 šrouby místo ' +
      'faston, vyšší klidový odběr, navíc má vývod pro zapalování/ruční spínač). Vstupní napětí ' +
      '9–32 Vdc s automatickou referencí, výstup = vstup (max. úbytek 100 mV). Přechodová ' +
      'nadproudová odolnost 110 %/10 s, 200 %/1 s, 300 %/<0,5 ms, automatický restart po 30 s. ' +
      'Klidový odběr typ. 4 mA @13,6 V (vyšší než u PT10/PT20). Galvanické oddělení >400 Vrms, ' +
      'ISO 7637-2 (rázy), ISO 10605/ISO 14892 (ESD >8 kV kontaktní/15 kV vzduchová). Provozní ' +
      'teplota -25 až +60 °C, skladovací -25 až +100 °C, IP65. ⚠️ Od 40 A výše nabízí navíc ' +
      '"Manual Shutdown Facility" — vývod pro spínaný kabel k přímému ovládání přes zapalování ' +
      'nebo ruční spínač (u PT10/PT20 chybí). Programovatelná odpojovací mez, zelená LED indikace, ' +
      'vývod pro externí alarm. Ochrany: nadproud, přehřátí, přechodové jevy, externí vstupní ' +
      'pojistka (dle aplikace) + zemnicí pojistka 1 A.',
    tags: 'modul,alfatronix,powertector,battery-guard,low-voltage-disconnect,odpojovač-baterie',
  },
  {
    name: 'PT60 (Alfatronix PowerTector)',
    packageType:
      '76 × 78 × 33 mm, 155 g, konektory M6 mosazné šrouby (ring tongues), třibodová montáž ' +
      '(3× pozi šroub) na šasi/desku, litá hliníková skříň s krytem z polykarbonátu plněného ' +
      'sklem',
    value:
      'Programovatelný nízkonapěťový odpojovač baterie (Low Voltage Disconnect), 60 A trvale, ' +
      'VIN 9–32 Vdc (auto. reference), IP65',
    notes:
      'Alfatronix PowerTector Series (dok. EU-EN-PV-0710). ⚠️ Součást řady PT10/PT20/PT40/PT60/' +
      'PT100/PT200 (samostatné záznamy) — PT60 sdílí s PT40 (samostatný záznam) stejné pouzdro, ' +
      'konektory, montáž i klidový odběr, liší se pouze jmenovitým proudem (60 A vs 40 A). Funkce ' +
      'a elektrické parametry shodné jako u PT40: vstupní napětí 9–32 Vdc s automatickou ' +
      'referencí, výstup = vstup (max. úbytek 100 mV), přechodová nadproudová odolnost 110 %/10 s, ' +
      '200 %/1 s, 300 %/<0,5 ms s automatickým restartem po 30 s, klidový odběr typ. 4 mA @13,6 V, ' +
      'galvanické oddělení >400 Vrms, ISO 7637-2 (rázy), ISO 10605/ISO 14892 (ESD >8 kV kontaktní/' +
      '15 kV vzduchová), provozní teplota -25 až +60 °C, skladovací -25 až +100 °C, IP65. Vývod ' +
      '"Manual Shutdown Facility" pro zapalování/ruční spínač (dostupné od 40 A výše). ' +
      'Programovatelná odpojovací mez, zelená LED indikace, vývod pro externí alarm. Ochrany: ' +
      'nadproud, přehřátí, přechodové jevy, externí vstupní pojistka (dle aplikace) + zemnicí ' +
      'pojistka 1 A.',
    tags: 'modul,alfatronix,powertector,battery-guard,low-voltage-disconnect,odpojovač-baterie',
  },
  {
    name: 'PT100 (Alfatronix PowerTector)',
    packageType:
      '124 × 97 × 51 mm, 530 g, konektory M10 ring tongues + přepínač pro ruční override, ' +
      'třibodová montáž (3× pozi šroub) na šasi/desku, litá hliníková skříň s krytem ' +
      'z polykarbonátu plněného sklem',
    value:
      'Programovatelný nízkonapěťový odpojovač baterie (Low Voltage Disconnect), 100 A trvale, ' +
      'VIN 9–32 Vdc (auto. reference), IP65',
    notes:
      'Alfatronix PowerTector Series (dok. EU-EN-PV-0710). ⚠️ Součást řady PT10/PT20/PT40/PT60/' +
      'PT100/PT200 (samostatné záznamy) — ⚠️ NEZAMĚŇOVAT s "Pt100" v kategorii Rezistor (samostatný ' +
      'záznam) — jde o naprosto odlišný produkt: platinový teplotní senzor vs. tento výkonový ' +
      'odpojovač baterie 100 A, shoda je jen v názvu/čísle. PT100 je elektricky obdobný PT200 ' +
      '(stejné rozměry/konektory/montáž, jen nižší jmenovitý proud), ale ⚠️ odlišný od PT40/PT60 ' +
      '(větší/těžší pouzdro, M10 místo M6 konektorů, vyšší klidový odběr) i od PT10/PT20 (zcela ' +
      'jiné pouzdro a konektory). Vstupní napětí 9–32 Vdc s automatickou referencí, výstup = ' +
      'vstup (max. úbytek 100 mV). Přechodová nadproudová odolnost 110 %/10 s, 200 %/1 s, ' +
      '300 %/<0,5 ms, automatický restart po 30 s. Klidový odběr typ. 6 mA @13,6 V (nejvyšší ' +
      'v řadě). Galvanické oddělení >400 Vrms, ISO 7637-2 (rázy), ISO 10605/ISO 14892 (ESD ' +
      '>8 kV kontaktní/15 kV vzduchová). Provozní teplota -25 až +60 °C, skladovací -25 až ' +
      '+100 °C, IP65. ⚠️ Jen modely PT100 a PT200 mají navíc ruční přepínač (manual override ' +
      'switch) pro nucené odblokování po vybavení ochrany — vynucuje, aby obsluha nejprve ' +
      'prošetřila příčinu odpojení před resetem. Programovatelná odpojovací mez, zelená LED ' +
      'indikace, vývod pro externí alarm i zapalování/ruční spínač. Ochrany: nadproud, přehřátí, ' +
      'přechodové jevy, externí vstupní pojistka (dle aplikace) + zemnicí pojistka 1 A.',
    tags: 'modul,alfatronix,powertector,battery-guard,low-voltage-disconnect,odpojovač-baterie',
  },
  {
    name: 'PT200 (Alfatronix PowerTector)',
    packageType:
      '124 × 97 × 51 mm, 530 g, konektory M10 ring tongues + přepínač pro ruční override, ' +
      'třibodová montáž (3× pozi šroub) na šasi/desku, litá hliníková skříň s krytem ' +
      'z polykarbonátu plněného sklem',
    value:
      'Programovatelný nízkonapěťový odpojovač baterie (Low Voltage Disconnect), 200 A trvale, ' +
      'VIN 9–32 Vdc (auto. reference), IP65',
    notes:
      'Alfatronix PowerTector Series (dok. EU-EN-PV-0710). ⚠️ Součást řady PT10/PT20/PT40/PT60/' +
      'PT100/PT200 (samostatné záznamy) — nejvýkonnější a poslední model řady, sdílí s PT100 ' +
      '(samostatný záznam) stejné pouzdro, konektory, montáž i klidový odběr, liší se pouze ' +
      'jmenovitým proudem (200 A vs 100 A). Funkce a elektrické parametry shodné jako u PT100: ' +
      'vstupní napětí 9–32 Vdc s automatickou referencí, výstup = vstup (max. úbytek 100 mV), ' +
      'přechodová nadproudová odolnost 110 %/10 s, 200 %/1 s, 300 %/<0,5 ms s automatickým ' +
      'restartem po 30 s, klidový odběr typ. 6 mA @13,6 V, galvanické oddělení >400 Vrms, ' +
      'ISO 7637-2 (rázy), ISO 10605/ISO 14892 (ESD >8 kV kontaktní/15 kV vzduchová), provozní ' +
      'teplota -25 až +60 °C, skladovací -25 až +100 °C, IP65. Ruční přepínač (manual override) ' +
      'pro nucené odblokování po vybavení ochrany. Programovatelná odpojovací mez, zelená LED ' +
      'indikace, vývod pro externí alarm i zapalování/ruční spínač. Ochrany: nadproud, přehřátí, ' +
      'přechodové jevy, externí vstupní pojistka (dle aplikace) + zemnicí pojistka 1 A.',
    tags: 'modul,alfatronix,powertector,battery-guard,low-voltage-disconnect,odpojovač-baterie',
  },
  {
    name: 'LEO-S55',
    packageType:
      'Samostatná bezdrátová jednotka (ne modul k pájení na DPS), plastové pouzdro 88,5 × 85,3 × ' +
      '27 mm, hmotnost 130 g, IP67 (UV odolné, vodotěsné), vnitřní tlačítko napájení, integrovaná ' +
      'NFC anténa pro konfiguraci, 2× vyměnitelná lithiová baterie ER18505 (4000 mAh každá)',
    value:
      'LoRaWAN bezdrátový senzor teploty a vlhkosti, dosah 100 m+ (přímá viditelnost), ' +
      '-30 až +70 °C (±0,3/±0,6 °C), 0–100 %RH (±3/±5 %), výdrž baterie ~5 let',
    notes:
      'Advantech LEO-S55 "LoRaWAN Temperature/Humidity Sensor" (datasheet, aktualizace ' +
      '19-05-2023). ⚠️ Na rozdíl od ostatních modulů v této knihovně (ESP32-C3-MINI-1 apod., ' +
      'určených k pájení na vlastní DPS) jde o hotovou bateriovou bezdrátovou jednotku pro ' +
      'monitoring IoT/průmyslových prostor — komunikuje protokolem LoRaWAN s bránou (gateway), ' +
      'ne přímo s mikrokontrolérem po sběrnici. Vyžaduje kompatibilní LoRaWAN bránu, např. ' +
      'Advantech USM-S67 (samostatné záznamy — plná verze podporuje až 100 senzorů LEO-S, ' +
      'kompaktní/kotoučová verze až 20). Frekvenční pásma dle regionu (objednací kód): ' +
      'LEO-S552-THG0 = US915/AU915/KR920/AS923 (915MHz skupina pásem), LEO-S552-THC0 = CN470. ' +
      'Konfigurace přes NFC (bez nutnosti otevírat kryt). Napájení 2× lithiová baterie ER18505 ' +
      '(3,6 V, 4000 mAh, vyměnitelná), typická výdrž baterie 5 let při intervalu hlášení 10 min ' +
      '@25 °C (laboratorní údaj, orientační). Bezdrátový dosah 100 m+ při přímé viditelnosti ' +
      '(laboratorní podmínky, orientační). Teplota: rozsah -30 až +70 °C, přesnost ±0,3 °C ' +
      '(0 až 70 °C) / ±0,6 °C (-30 až 0 °C), rozlišení 0,1 °C. Vlhkost: rozsah 0–100 %RH, přesnost ' +
      '±3 % (10–90 %RH) / ±5 % (pod 10 % nebo nad 90 %RH), rozlišení 0,5 %. Provozní teplota ' +
      '-30 až +70 °C, provozní vlhkost 0–100 % nekondenzující @25 °C. Certifikace FCC, TELEC, ' +
      'CE (dle konkrétního projektu). Kompatibilní se standardními LoRaWAN bránami a síťovými ' +
      'servery (ne jen s Advantech USM-S67).',
    tags: 'modul,lorawan,senzor,teploměr,vlhkoměr,iot,advantech,baterie,ip67',
  },
  {
    name: 'USM-S67 (LoRaWAN & Wi-Fi Gateway)',
    packageType:
      'Plastové pouzdro pro montáž na stůl/stěnu/stožár, 180 × 110 × 56,5 mm, IP65, DC jack ' +
      'konektor (9–24 Vdc) + RJ45 (Ethernet, podporuje 802.3af PoE), 2× interní + 1× externí ' +
      'anténa (SMA), 1× tlačítko reset, LED indikátory POWER/STATUS/LoRa/Wi-Fi/Ethernet',
    value:
      'LoRaWAN + Wi-Fi brána (gateway), čtyřjádrový ARM Cortex-A53 1,5 GHz, 512 MB RAM, 8 GB ' +
      'eMMC, čip SX1302 (8 kanálů), podporuje až 100 senzorů LEO-S',
    notes:
      'Advantech USM-S67 "LoRaWAN Gateway" (datasheet, aktualizace 17-10-2022) — plnohodnotná ' +
      '(větší) varianta brány, určená k příjmu dat z bezdrátových senzorů řady LEO-S (např. ' +
      'LEO-S55, samostatný záznam) a jejich přeposílání do LoRaWAN síťového serveru. ⚠️ Pod stejným ' +
      'označením "USM-S67" existuje i zcela odlišná fyzická varianta — kompaktní kotoučová brána ' +
      '(samostatný záznam "USM-S67 (Compact)") se slabším procesorem, bez Wi-Fi, s nižším krytím ' +
      'IP30 a jinými rozměry — objednací kódy se liší příponou ("-G0WP0"/"-C0WP0" pro tuto plnou ' +
      'verzi vs. "-G00P0"/"-C00P0" pro kompaktní), ale samotné číslo modelu je shodné, což může ' +
      'vést k záměně. CPU: čtyřjádrový 64bit ARM Cortex-A53 @1,5 GHz, 512 MB DDR4 RAM, 8 GB eMMC ' +
      'flash. LoRaWAN čip SX1302, 8 poloduplexních/plně duplexních kanálů, frekvenční pásma dle ' +
      'objednacího kódu US915/AU915/KR920/AS923 (915MHz skupina, kód "-G0WP0") nebo CN470 (kód ' +
      '"-C0WP0"). 2× interní + 1× externí anténa, dosah 100 m+ (přímá viditelnost, laboratorní ' +
      'údaj). Připojitelnost: Ethernet 10/100/1000 Base-T, Wi-Fi 802.11 b/g/n 2,4 GHz (záložní ' +
      'konektivita/backhaul). Podporuje až 100 senzorů LEO-S (závisí na scénáři použití). ' +
      'Napájení: DC jack 9–24 Vdc, nebo 802.3af PoE. Provozní teplota -40 až +70 °C, skladovací ' +
      '-40 až +85 °C, provozní vlhkost 0–95 % nekondenzující @25 °C. Zabezpečení: vestavěná ' +
      'podpora VPN (IPsec/OpenVPN/L2TP/PPTP/DMVPN). Vestavěný síťový server, MQTT/HTTP/HTTPS API, ' +
      'vestavěné Python SDK pro vlastní vývoj, programovatelné přes Node-RED. Certifikace CE, FCC.',
    tags: 'modul,lorawan,gateway,brána,wifi,advantech,arm,sx1302,iot',
  },
  {
    name: 'USM-S67 (Compact)',
    packageType:
      'Kompaktní kotoučové (kulaté) pouzdro pro montáž na strop/stěnu, ø115 × 21 mm, IP30 (jen ' +
      'vnitřní použití), RJ45 (Ethernet, podporuje 802.3af PoE) + USB Type-C (napájení), ' +
      '2× interní anténa (bez externí anténní přípojky), 1× tlačítko reset, LED SYS/LoRa',
    value:
      'LoRaWAN brána (gateway), kompaktní verze, ARM Cortex-A7 528 MHz, 256 MB RAM, 4 GB eMMC, ' +
      'podporuje až 20 senzorů LEO-S, IP30 (jen vnitřní prostory)',
    notes:
      'Advantech USM-S67 "Compact LoRaWAN Gateway" (datasheet, aktualizace 17-10-2022). ⚠️ Sdílí ' +
      'označení modelu "USM-S67" s plnohodnotnou (větší) verzí brány (samostatný záznam "USM-S67 ' +
      '(LoRaWAN & Wi-Fi Gateway)"), ale jde o fyzicky i výkonově zcela odlišné zařízení — menší ' +
      'CPU, méně RAM/flash, bez Wi-Fi a bez externí antény, nižší krytí IP30 (vhodné jen do ' +
      'vnitřních prostor, ne venku jako IP65 plná verze), a podporuje jen 20 senzorů LEO-S místo ' +
      '100. Rozlišuje se objednacím kódem: "-G00P0"/"-C00P0" (kompaktní) vs. "-G0WP0"/"-C0WP0" ' +
      '(plná). CPU: ARM Cortex-A7 @528 MHz, 256 MB DDR4 RAM, 4 GB eMMC flash. Frekvenční pásma ' +
      'dle objednacího kódu US915/AU915/KR920/AS923 (kód "-G00P0") nebo CN470 (kód "-C00P0"). ' +
      '2× interní anténa, dosah 100 m+ (přímá viditelnost, laboratorní údaj). Připojitelnost: jen ' +
      'Ethernet 10/100 Base-T (bez Wi-Fi). Podporuje až 20 senzorů LEO-S. Napájení: 802.3af PoE, ' +
      'nebo 5 V/1 A přes USB Type-C. Provozní teplota -20 až +50 °C (užší rozsah než plná verze), ' +
      'skladovací -40 až +85 °C, provozní vlhkost 0–95 % nekondenzující @25 °C. Umí detekovat a ' +
      'analyzovat úroveň rušení (noise level) s přehledným diagramem pro plánování instalace — ' +
      'funkce, kterou plná verze v datasheetu neuvádí. Stejná podpora VPN, vestavěný síťový ' +
      'server a MQTT/HTTP/HTTPS API jako plná verze.',
    tags: 'modul,lorawan,gateway,brána,advantech,arm,iot,kompaktní',
  },
  {
    name: 'ETHSA',
    packageType:
      'Samostatná bezdrátová jednotka (ne modul k pájení), bílé pouzdro (RAL 9010), rozměry bez ' +
      'nástěnné destičky 76,2 × 22 × 15 mm, s nástěnnou destičkou 79 × 23,8 × 18,6 mm, se stojánkem ' +
      'a trojúhelníkovým krytem (jen jednotlivé balení) 85 × 30 × 30 mm, vnitřní helix anténa, ' +
      'IP40, jen pro vnitřní použití; přiložena nalepovací podložka, u jednotlivého balení i kovový ' +
      'stojánek a náhradní trojúhelníkový kryt',
    value:
      'Bezdrátový solární senzor teploty a vlhkosti (EnOcean, 868,300 MHz, +5 dBm), -20 až +60 °C ' +
      '(±0,5 K), 0–100 %RH (±4,5 %), bez baterie (jen záložní CR1225), dosah 300 m volný prostor',
    notes:
      'EnOcean ETHSA/ETHSU "EASYFIT Temperature & Humidity Sensor" (datasheet, duben 2022) — ' +
      'zpracovány oba typy z jednoho dokumentu (ETHSA pro EU/UK, ETHSU pro US/CA, samostatný ' +
      'záznam). ⚠️ Solárně napájený bezúdržbový bezdrátový senzor s energy harvesting technologií ' +
      '— na rozdíl od LEO-S55 (samostatný záznam, primárně bateriové napájení 2× ER18505) nemá ' +
      'žádnou baterii v základní výbavě, jen volitelnou zálohu CR1225 (neobsažena v balení) pro ' +
      'provoz ve tmě. ETHSA: EnOcean rádio 868,300 MHz, +5 dBm vysílací výkon, schválení EU/UK ' +
      'CE/UKCA, objednací kódy S3001-C350 (jednotlivé balení) a S3001-T350 (tray balení, 56 ks). ' +
      'Primární napájení: vnitřní osvětlení min. 50 lx (solární článek). Vnitřní helix anténa, ' +
      'dosah 300 m volný prostor, typ. 30 m ve vnitřních prostorách. EnOcean Equipment Profile ' +
      '(EEP) A5-04-03 (naměřená teplota a vlhkost), SIGNAL 0x06 (hlášení úrovně energie), SIGNAL ' +
      '0x0E (vstup do transportního režimu). Zabezpečení: VAES 128, CMAC, RLC čítač proti replay ' +
      'útokům. Teplota: rozsah -20 až +60 °C, rozlišení 0,1 K, přesnost ±0,5 K v celém rozsahu. ' +
      'Vlhkost: rozsah 0–100 %RH, rozlišení 0,4 %RH, přesnost ±4,5 %RH v celém rozsahu (±3 %RH ' +
      'mezi 20–80 %RH). Měřicí cyklus jednou za 100 s. Okamžité vysílání při změně >±0,5 K nebo ' +
      '>±3 %RH oproti poslední zprávě; jinak pravidelné "sign-of-life" hlášení každých 11–24 min ' +
      '(náhodně). Doba náběhu z vybitého úložiště energie typ. <2,5 min @400 lx/25 °C. Minimální ' +
      'podmínka pro bezbateriový provoz: 1200 lx·h/den @25 °C. Provozní doba ve tmě >10 dní (plně ' +
      'nabité úložiště, jen sign-of-life zprávy, 25 °C) — dlouhodobé vystavení >30 °C postupně ' +
      'degraduje kapacitu úložiště energie, nutno dobít po max. 36 měsících v transportním režimu. ' +
      'Teach-in (párování) tlačítkem s LED indikací. Provozní podmínky -20 až +60 °C, 0–93 %RH ' +
      'nekondenzující, IP40, jen vnitřní použití. Skladovací podmínky doporučeně +10 až 30 °C, ' +
      '<60 %RH, max. 36 měsíců v transportním režimu.',
    tags: 'modul,enocean,easyfit,senzor,teploměr,vlhkoměr,solární,bezdrátový,ethsa',
  },
  {
    name: 'ETHSU',
    packageType:
      'Samostatná bezdrátová jednotka (ne modul k pájení), bílé pouzdro (RAL 9010), rozměry bez ' +
      'nástěnné destičky 76,2 × 22 × 15 mm, s nástěnnou destičkou 79 × 23,8 × 18,6 mm, se stojánkem ' +
      'a trojúhelníkovým krytem (jen jednotlivé balení) 85 × 30 × 30 mm, vnitřní helix anténa, ' +
      'IP40, jen pro vnitřní použití',
    value:
      'Bezdrátový solární senzor teploty a vlhkosti (EnOcean, 902,875 MHz, +99 dBµV/m), -20 až ' +
      '+60 °C (±0,5 K), 0–100 %RH (±4,5 %), bez baterie (jen záložní CR1225), dosah 300 m ' +
      'volný prostor',
    notes:
      'EnOcean ETHSA/ETHSU "EASYFIT Temperature & Humidity Sensor" (datasheet, duben 2022). ' +
      '⚠️ ETHSU = severoamerická/kanadská regionální varianta ETHSA (samostatný záznam) — ' +
      'shodná konstrukce, mechanika a senzorové parametry, liší se jen frekvencí/výkonem rádia ' +
      'a certifikací: EnOcean rádio 902,875 MHz, vysílací výkon +99 dBµV/m (jiná jednotka než ' +
      'ETHSA kvůli odlišné regulaci FCC/ISED oproti evropské +5 dBm), schválení US/CA FCC/ISED. ' +
      'Objednací kód S3051-C350 (jen jednotlivé balení, na rozdíl od ETHSA nemá v datasheetu ' +
      'uvedenou tray varientu). Všechny ostatní parametry (senzor teploty/vlhkosti, EEP profil, ' +
      'zabezpečení, napájení, mechanika, provozní/skladovací podmínky) shodné s ETHSA — viz jeho ' +
      'záznam pro plný popis.',
    tags: 'modul,enocean,easyfit,senzor,teploměr,vlhkoměr,solární,bezdrátový,ethsu',
  },
  {
    name: 'ATM0680L2A-CT',
    packageType:
      '6,86" TFT-LCD modul s integrovaným kapacitním dotykovým panelem, aktivní plocha ' +
      '60,22×160,59 mm, celkové rozměry modulu 66,6×181×6,6 mm; 40pin FPC konektor pro LCD ' +
      '(MIPI-DSI), doporučený konektor pro dotykový panel Hirose FH12-6S-1SH(55) nebo ' +
      'kompatibilní; struktura dotykového panelu: krycí sklo (coverlens) + FPC + ITO sklo',
    value:
      '6,86" IPS TFT displej 480×1280 (RGB stripe), 16,7M barev, MIPI-DSI 4-lane, jas 920 cd/m² ' +
      'typ., s 5bodovým kapacitním dotykovým panelem (I2C, FT7311)',
    notes:
      'AZ Displays "ATM0680L2A-CT TFT Module" (specifikace ver. 1.1, srpen 2019) — kompletní ' +
      'displejový modul (LCD panel + řadič + LED podsvícení + kapacitní dotykový senzor), první ' +
      'zástupce kategorie hotových LCD/dotykových modulů v této knihovně. LCD panel: a-Si TFT ' +
      'aktivní matice, normally black, IPS (In-Plane Switching, široký pozorovací úhel), ' +
      'transmisivní, rozlišení 480×(RGB)×1280, dot pitch 0,04182×0,12546 mm, pixel pitch ' +
      '0,12546×0,12546 mm, povrch čirý (clear), pozorovací úhel 80/80/80/80° (L/P/nahoru/dolů). ' +
      'Řadič: EK79030 nebo kompatibilní, rozhraní MIPI-DSI 4-lane (piny D0P/D0N…D3P/D3N + ' +
      'CLKP/CLKN, diferenciální). LED podsvícení: napájecí napětí 8,5–10,5 V typ. 9,0 V (6× LED ' +
      'řetězec á 50 mA = 300 mA celkem), životnost LED 20 000 h (do poklesu jasu na 50 %), max. ' +
      'proud/LED 80 mA, max. zpětné napětí/LED 5 V (Zenerova dioda 60 mA). Dotykový panel: ' +
      'kapacitní, řadič FocalTech FT7311, rozhraní I2C (piny SDA/SCL/RST/INT/VDD/GND), VDD ' +
      '2,8–3,3 V, VIO 2,8–3,3 V, podpora 5bodového multitouch. Napájení LCD: VDD (logika) ' +
      '3,0–3,6 V typ. 3,3 V, I/O napájení (IOVcc) 1,6–2,0 V typ. 1,8 V. Mezní hodnoty: VDD -0,3 ' +
      'až 3,6 V, VCC (I/O) -0,3 až 3,0 V, VSP (kladné napájení zdrojových budičů) 4,5–6,0 V, VSN ' +
      '(záporné) -4,5 až -6,0 V, provozní teplota -20 až +70 °C, skladovací -30 až +80 °C. ' +
      'Definovaná sekvence zapínání/vypínání napájení (VDD→RESETB→interní STBYB→OTP loading→ ' +
      'VDD_IO→VCSW1/2→VSP/VSN→…→normální zobrazení). RoHS.',
    tags: 'modul,displej,lcd,tft,ips,dotykový-panel,kapacitní,mipi-dsi,az-displays,ek79030,ft7311',
  },
  {
    name: 'ATM0680L2A',
    packageType:
      '6,86" TFT-LCD modul BEZ dotykového panelu, aktivní plocha 60,22×160,59 mm, celkové ' +
      'rozměry modulu 66,6×181×4,5 mm (⚠️ tenčí než dotyková verze -CT, 4,5 mm vs. 6,6 mm — bez ' +
      'vrstvy krycího skla/ITO dotykového senzoru), hmotnost 81 g typ., 40pin FPC konektor ' +
      '(MIPI-DSI) — shodný s -CT verzí',
    value:
      '6,86" IPS TFT displej 480×1280 (RGB stripe), 16,7M barev, MIPI-DSI 4-lane, jas 1100 cd/m² ' +
      'typ. — bez dotykové vrstvy',
    notes:
      'AZ Displays "ATM0680L2A TFT Module" (specifikace ver. 1.3, srpen 2019) — ⚠️ stejný LCD ' +
      'panel/řadič/podsvícení jako dotyková verze ATM0680L2A-CT (samostatný záznam), ale BEZ ' +
      'integrovaného kapacitního dotykového panelu (touch panel/touch controller: "N.A." v ' +
      'datasheetu) — viz záznam ATM0680L2A-CT pro plný popis LCD parametrů, řadiče a ' +
      'podsvícení, které jsou identické. Rozdíly oproti -CT verzi: bez dotykové vrstvy je modul ' +
      'tenčí (4,5 mm vs. 6,6 mm hloubka) a má vyšší udávaný jas 1100 cd/m² typ. (vs. 920 cd/m² u ' +
      '-CT — dotyková vrstva/krycí sklo u -CT verze část světla pohlcuje/odráží). Pinout ' +
      '40pinového LCD FPC konektoru identický s -CT verzí (piny GND/D0P-D3N/CLKP-CLKN/VCC_1V8/ ' +
      'BIST/RST/STBYB/K/A/VDD). Elektrické parametry (VDD, IOVcc, VSP/VSN, mezní hodnoty, ' +
      'sekvence zapínání) shodné s ATM0680L2A-CT.',
    tags: 'modul,displej,lcd,tft,ips,mipi-dsi,az-displays,ek79030,bez-dotyku',
  },
  {
    name: 'N 142',
    packageType:
      'Povrchová montáž s dutou hřídelí (hollow shaft) Ø20 mm nebo Ø25 mm, pouzdro 56×100×62,5 mm, ' +
      'polykarbonát černý UL94V-0, hmotnost cca 200 g, IP65; konektory M16 (5pin SPA/napájení+ ' +
      'RS485, 12pin motorový), kabelový výstup 30 cm nebo přímo motorový kabel 0,5/1,5 m',
    value:
      'Polohový displej vřetene (spindle position display) — absolutní multiturn odměřovací ' +
      'systém, LCD 2řádkový podsvícený displej, rozlišení 2304 kroků/otáčku ±4096 otáček, ' +
      'RS485, 24 VDC',
    notes:
      'Baumer IVO "N 142 — Spindle Position Displays" (dok. 30. 10. 2008) — kompaktní modul pro ' +
      'automatické polohování/formátové seřízení vřeten obráběcích strojů (např. přestavování ' +
      'dorazů/pilových kotoučů na míru), montuje se přímo na hřídel skrz dutý střed. Absolutní ' +
      'multiturn odměřovací systém (nevyžaduje homing po výpadku napájení) s rozlišením 2304 ' +
      'kroků/otáčku a rozsahem ±4096 otáček (12bit), stoupání vřetene do 23 mm. LCD displej ' +
      '(7segmentový, 2 řádky, podsvícený) zobrazuje aktuální i cílovou hodnotu, rozsah měření ' +
      '-999,99…+9999,99 mm (nebo -99,999…+999,999 palců). Dvě membránové ovládací klávesy pro ' +
      'formátové seřízení "touch by touch" — "multiconDrive" systém: modul komunikuje přímo s EC ' +
      'motorem (signály clockwise/counterclockwise/rotation speed přes motorový konektor), ' +
      'operátor edituje polohu s přesností ±1/100 mm pod přímou vizuální kontrolou; nastavené ' +
      'polohy lze uložit jako profil (s externím řadičem pamětí N 242, až 100 profilů teach-in). ' +
      'Rozhraní RS485 (ASCII protokol), síť až 32 modulů na PC/PLC. Data: parametrická paměť ' +
      'EEPROM, aktuální hodnota zálohována integrovanou 3V lithiovou baterií (>10 let). Napájení ' +
      '24 VDC ±10 %, odběr max 40 mA. Programovatelné parametry: orientace displeje, měrná ' +
      'jednotka mm/palec, směr počítání, stoupání a tolerance vřetene, směr polohování, ' +
      'zaokrouhlování aj. Provozní teplota -10 až +50 °C, skladovací -20 až +70 °C, vlhkost do ' +
      '80 % nekondenzující, ochrana IP65, provozní otáčky do 600 ot/min (krátkodobě). Shoda s ' +
      'DIN EN 61010-1 (třída ochrany II, kategorie přepětí II, stupeň znečištění 2), EMC dle DIN ' +
      'EN 61000-6-2/6-3, schválení UL/cUL. Objednací kód např. N 142.13A01 (Ø25mm hřídel, ' +
      'nakloněný displej, 24 VDC, kabelový výstup 0,5m motor. kabel, RS485).',
    tags: 'modul,polohový-displej,enkodér,multiturn,rs485,baumer,ivo,n142,vřeteno,duté-hřídel',
  },
  {
    name: 'N 152',
    packageType:
      'Povrchová montáž s dutou hřídelí (hollow shaft) Ø14 mm, pouzdro 37×75×45 mm, polyamid ' +
      'černý UL94V-0, hmotnost cca 120 g, IP65; konektory M8 (4pin napájení+RS485), M16 (12pin ' +
      'motorový); kabelový výstup 15 cm nebo motorový kabel 0,5/1,5 m',
    value:
      'Polohový displej vřetene (spindle position display), menší varianta — absolutní multiturn ' +
      'odměřovací systém, LCD 2řádkový podsvícený displej, rozlišení 1440 kroků/otáčku ±4096 ' +
      'otáček, RS485, 24 VDC',
    notes:
      'Baumer IVO "N 152 — Spindle Position Displays" (dok. 11. 11. 2008) — ⚠️ menší sesterský ' +
      'model k N 142 (samostatný záznam) pro tenčí vřetena — stejný účel a princip funkce ' +
      '(multiconDrive automatické formátové seřízení, přímá komunikace s EC motorem, absolutní ' +
      'multiturn měření, RS485, EEPROM + 3V lithiová záložní baterie), ale menší duté hřídel ' +
      '(Ø14 mm vs. Ø20/25 mm u N 142), menší/lehčí pouzdro (37×75×45 mm/120 g vs. 56×100×62,5 mm/ ' +
      '200 g), nižší rozlišení (1440 vs. 2304 kroků/otáčku), menší max. stoupání vřetene (14 mm ' +
      'vs. 23 mm) a menší konektory (M8 4pin místo M16 5pin pro napájení/RS485). Rozsah měření ' +
      '-99,99…+999,99 mm (nebo -9,999…+99,999 palců). Zbylé parametry shodné s N 142: rozsah ' +
      'otáček ±4096 (12bit), dvě membránové klávesy pro formátové seřízení, kompatibilní s ' +
      'řadičem pamětí N 242 (až 100 profilů), provozní teplota -10 až +50 °C, skladovací -20 až ' +
      '+70 °C, vlhkost do 80 % nekondenzující, ochrana IP65, provozní otáčky do 600 ot/min ' +
      '(krátkodobě), napájení 24 VDC ±10 %, odběr max 40 mA. Shoda s DIN EN 61010-1, EMC dle DIN ' +
      'EN 61000-6-2/6-3, schválení UL/cUL. Displej dostupný nakloněný (A) nebo horizontální ' +
      'vpředu (B) — na rozdíl od N 142, který má jen nakloněnou variantu.',
    tags: 'modul,polohový-displej,enkodér,multiturn,rs485,baumer,ivo,n152,vřeteno,duté-hřídel',
  },
  {
    name: 'PVC200403',
    packageType:
      'PCB modul (skleněný LCD panel + budicí/řadičový čip osazený na malé DPS s pinovou ' +
      'lištou) — rozměr modulu 98,0×60,0 mm (14,0 mm hloubka s EL podsvícením), zobrazovací ' +
      'plocha 76,0×25,2 mm, velikost znaku 2,95×4,75 mm',
    value:
      'Znakový dot-matrix LCD modul, 20 sloupců × 4 řádky, technologie TN/STN šedá/STN žlutá ' +
      '(dle varianty), duty 1/16, bez LED podsvícení (možnost EL podsvícení)',
    notes:
      'PICVUE Electronics Ltd. znakový LCD modul PVC200403, distribuovaný přes katalog Beck GmbH ' +
      '& Co. Elektronik Bauelemente KG "Liquid Crystal Displays — LCD Modules and Panels" — ' +
      'standardní znakový (character) dot-matrix LCD modul s řadičovým čipem osazeným přímo na ' +
      'modulu (na rozdíl od holých skleněných panelů GD-342AP/GD-458P v této knihovně, samostatné ' +
      'záznamy, které vyžadují externí budicí obvod) — proto zařazen do kategorie Modul, ne ' +
      'Ostatní. Součást rozsáhlé produktové řady PICVUE "Dot Matrix Modules" zahrnující desítky ' +
      'kombinací velikost (10×3 až 40×4 znaků) × technologie (TN/STN šedá/STN žlutá/FSTN ' +
      'černobílá) × podsvícení (bez/LED/EL) × pouzdro (PCB s pinovou lištou / TCP s řadičem na ' +
      'flexfólii) — do knihovny přidán jen konkrétní pojmenovaný díl PVC200403 z názvu souboru ' +
      '(20×4 znaky), ne celý katalog. Duty rate (multiplex poměr) 1/16. Dostupný ve variantách ' +
      'TN, STN šedá nebo STN žlutá technologie (volba technologie kódována 2. identifikačním ' +
      'znakem v objednacím čísle — v datasheetu uvedeno obecně jako "**"), bez LED podsvícení, s ' +
      'možností EL (elektroluminiscenčního) podsvícení. Pouzdro PCB (tištěný spoj s pinovou ' +
      'lištou), na rozdíl od TCP (tape carrier package, řadič integrovaný na flex-fólii bez PCB) ' +
      'u jiných dílů stejné řady. Distributor Beck GmbH poskytuje širokou nabídku LCD ' +
      'modulů/panelů více výrobců (PICVUE, Ampire, Dalian Dongfu, Tianma) — tento konkrétní díl je ' +
      'od PICVUE.',
    tags: 'modul,displej,lcd,znakový,dot-matrix,picvue,pvc200403,beck,20x4',
  },
  {
    name: 'TSU-20G',
    packageType:
      'Kovové pouzdro z nerezové oceli SUS304, cca 40×34×22,5 mm, hmotnost 200 g, tlakový ' +
      'přívod 1/8" závitová přípojka (fitting), 3vodičový kabelový výstup (červený=Vcc, ' +
      'černý=GND, modrý=P_OUT)',
    value:
      'Křemenný (kmitočtový) tlakový senzor, rozsah 0–200 kPa, výstup 39 kHz typ. (bez tlaku), ' +
      'změna kmitočtu 4 kHz typ. (plný rozsah), 12 V',
    notes:
      'Seiko Epson "TSU series — Quartz Pressure Sensor/Transducer" — tlakový senzor založený ' +
      'na křemenném rezonátoru, jehož kmitočet se mění úměrně přiloženému tlaku (frekvenční ' +
      'výstup místo analogového napěťového/proudového) — vysoké rozlišení a přesnost, výborná ' +
      'opakovatelnost s minimální hysterezí, vysoká teplotní stabilita, výstupní kmitočet ' +
      'neovlivněný délkou přívodního/výstupního kabelu (na rozdíl od analogových napěťových ' +
      'senzorů citlivých na úbytek/kapacitu vedení). Určeno pro průmyslové měření tlaku. ' +
      'Zpracována celá řada 3 tlakových rozsahů z jednoho datasheetu (TSU-20G, TSU-70G, ' +
      'TSU-100G, samostatné záznamy), lišících se jen tlakovým rozsahem a max. změnou kmitočtu. ' +
      'TSU-20G: rozsah 0–200 kPa. Společné parametry celé řady: linearita po linearizaci max ' +
      '0,01 %FS, přesnost (linearita+opakovatelnost+hystereze) max 0,023 %FS, provozní teplota ' +
      '-10 až +70 °C, skladovací -20 až +80 °C, korekce náklonu (tilt correction) integrována, ' +
      'volitelný vestavěný teplotní senzor, výstupní kmitočet bez tlaku typ. 39 kHz, výstupní ' +
      'napětí min 3,2 Vpp (zátěž 600 Ω, useknutá sinusovka, DC odděleno kondenzátorem), napájení ' +
      '12 V (standardní), odběr typ. 2 mA (4 mA typ. s vestavěným teplotním senzorem). TSU-20G: ' +
      'max. změna kmitočtu (na plném rozsahu) typ. 4 kHz. RoHS.',
    tags: 'modul,senzor,tlak,křemenný,frekvenční,seiko-epson,tsu-20g,průmyslový',
  },
  {
    name: 'TSU-70G',
    packageType:
      'Kovové pouzdro z nerezové oceli SUS304, cca 40×34×22,5 mm, hmotnost 200 g, tlakový ' +
      'přívod 1/8" fitting, 3vodičový kabelový výstup (Vcc/GND/P_OUT)',
    value:
      'Křemenný (kmitočtový) tlakový senzor, rozsah 0–700 kPa, výstup 39 kHz typ. (bez tlaku), ' +
      'změna kmitočtu 7 kHz typ. (plný rozsah), 12 V',
    notes:
      'Seiko Epson "TSU series — Quartz Pressure Sensor/Transducer" — součást stejné řady 3 ' +
      'tlakových rozsahů jako TSU-20G a TSU-100G (samostatné záznamy) — viz záznam TSU-20G pro ' +
      'plný popis principu funkce (křemenný rezonátor s tlakově závislým kmitočtem) a společných ' +
      'parametrů (přesnost, teplotní rozsah, napájení, mechanika). TSU-70G: rozsah 0–700 kPa, ' +
      'max. změna kmitočtu typ. 7 kHz (shodná s TSU-100G).',
    tags: 'modul,senzor,tlak,křemenný,frekvenční,seiko-epson,tsu-70g,průmyslový',
  },
  {
    name: 'TSU-100G',
    packageType:
      'Kovové pouzdro z nerezové oceli SUS304, cca 40×34×22,5 mm, hmotnost 200 g, tlakový ' +
      'přívod 1/8" fitting, 3vodičový kabelový výstup (Vcc/GND/P_OUT)',
    value:
      'Křemenný (kmitočtový) tlakový senzor, rozsah 0–1 MPa, výstup 39 kHz typ. (bez tlaku), ' +
      'změna kmitočtu 7 kHz typ. (plný rozsah), 12 V — nejvyšší tlakový rozsah v řadě',
    notes:
      'Seiko Epson "TSU series — Quartz Pressure Sensor/Transducer" — součást stejné řady 3 ' +
      'tlakových rozsahů jako TSU-20G a TSU-70G (samostatné záznamy) — viz záznam TSU-20G pro ' +
      'plný popis principu funkce a společných parametrů. TSU-100G: rozsah 0–1 MPa (nejvyšší v ' +
      'řadě), max. změna kmitočtu typ. 7 kHz (shodná s TSU-70G).',
    tags: 'modul,senzor,tlak,křemenný,frekvenční,seiko-epson,tsu-100g,průmyslový',
  },
  {
    name: 'RPR-0521RS-EVK-001',
    packageType:
      'Malá evaluační/breakout deska (PCB0064 Rev.C), konektor CN1 (pinová lišta) pro připojení ' +
      'k "SensorShield" (ROHM Shield-EVK-001, Arduino shield), na desce osazen čip RPR-0521RS ' +
      'plus podpůrné pasivní součástky: C1 blokovací kondenzátor VDD 10 µF, C2 blokovací ' +
      'kondenzátor VDD 0,1 µF, C3 blokovací kondenzátor LEDA 0,1 µF, R1/R2/R3 pull-up rezistory ' +
      'pro SDA/SCL/INT (na desce standardně NEOSAZENY — "N.M." = No Mount)',
    value:
      'Evaluační deska pro ROHM RPR-0521RS — kombinovaný senzor přiblížení (PS) a okolního ' +
      'osvětlení (ALS), I2C rozhraní, piny VDD/GND/SDA/SCL/INT',
    notes:
      'ROHM "RPR-0521RS-EVK-001 Manual" (User\'s Guide, dok. č. 60UG059E Rev.001, leden 2018) — ' +
      '⚠️ jde o User\'s Guide k evaluační desce, NIKOLI o plný datasheet čipu RPR-0521RS — obsahuje ' +
      'jen postup zapojení s Arduino Uno přes "SensorShield" (ROHM Shield-EVK-001), instalaci ' +
      'knihovny/příkladu v Arduino IDE a přehled osazení desky, BEZ podrobných elektrických ' +
      'parametrů samotného senzoru (rozsah/rozlišení přiblížení, citlivost ALS v lx, I2C adresa, ' +
      'napájecí rozsah, proudová spotřeba apod.) — tyto parametry v tomto dokumentu chybí, ' +
      'nejistota uvedena explicitně, pro plné specifikace čipu by byl potřeba samostatný datasheet ' +
      'RPR-0521RS. Deska se připojuje do I2C slotu na SensorShieldu, napájecí napětí SensorShieldu ' +
      'nutno nastavit na 3,0 V. Příkladový výstup ze sériové konzole (dle datasheetu, ilustrativní): ' +
      '"RPR0521RS Part ID Register Value = 0xA", "RPR0521RS MANUFACT_ID Register Value = 0xE0", ' +
      'proximity v jednotkách [count], ambient light v [lx]. Deska obsahuje jen minimální podpůrné ' +
      'obvody (blokovací kondenzátory, nepovinné pull-up rezistory) — o funkčnosti se stará ' +
      'integrovaný čip RPR-0521RS, proto zařazeno do kategorie "Modul" jako kompletní osazená ' +
      'deska s vlastním řídicím čipem, ne jako holý senzorový element.',
    tags: 'modul,senzor,přiblížení,proximity,okolní-osvětlení,als,rohm,rpr-0521rs,i2c,eval-board,arduino',
  },
  {
    name: 'WTB250-2N1131',
    packageType:
      'Pravoúhlé plastové pouzdro (ABS) 20 × 65 × 43,9 mm, hmotnost 150 g, optika PMMA, kryt IP67, ' +
      'montážní otvory Ø4,2 mm pro M4 šroub (na obou stranách, dodávána montážní konzole ' +
      'BEF-W250), 4vodičový kabel 2 m (hnědý=+, modrý=-, černý=Q výstup, bílý=L/D volba režimu), ' +
      'na čelní straně potenciometr pro nastavení dosahu (2 otáčky, poziční ukazatel 270°), ' +
      'zelená LED (indikace stability) a žlutá LED (indikace přijatého signálu)',
    value:
      'Optoelektronický (fotoelektrický) snímač přiblížení s potlačením pozadí (background ' +
      'suppression), viditelné červené světlo (BrightLight LED), dosah 100–300 mm nastavitelný, ' +
      'NPN výstup s otevřeným kolektorem, 10–30 V DC',
    notes:
      'SICK AG "W250-2, Photoelectric proximity sensor, Background suppression — WTB250-2N1131" ' +
      '(Online Data Sheet, díl. č. 6044672, staženo 15. 3. 2016) — kompletní průmyslový ' +
      'optoelektronický senzor s vlastní elektronikou/výstupním obvodem v uzavřeném pouzdře, ' +
      'proto zařazen do kategorie "Modul", ne "IO". Princip "background suppression" (potlačení ' +
      'pozadí) umožňuje spolehlivě detekovat objekt v nastaveném dosahu bez ohledu na odrazivost ' +
      'pozadí za ním (na rozdíl od jednoduchého difuzního senzoru citlivého i na jasné pozadí za ' +
      'objektem) — viz charakteristické křivky v datasheetu pro černý/šedý/bílý objekt na bílém ' +
      'pozadí. Světelný zdroj: viditelné červené světlo, BrightLight LED (průměrná životnost ' +
      '100 000 h @25 °C), úhel rozptylu cca 3°, velikost světelné stopy Ø30 mm @300 mm. Dosah ' +
      'nastavitelný potenciometrem v rozsahu 100–300 mm. Výstup NPN s otevřeným kolektorem, ' +
      'volitelný režim spínání světlo/tma (light/dark) přes ovládací vodič (L/D), max. výstupní ' +
      'proud 100 mA, doba odezvy max 3 ms, spínací kmitočet 160 Hz (poměr světlo/tma 1:1). ' +
      'Napájení 10–30 V DC (zvlnění max 5 Vpp), odběr max 35 mA (bez zátěže). Ochrany: A ' +
      '(přepólování napájení), B (přepólování vstupů/výstupu), C (odrušení), D (nadproudová/ ' +
      'zkratová ochrana výstupů). Krytí IP67, třída ochrany III. Provozní teplota -25 až +55 °C, ' +
      'skladovací -40 až +70 °C. UL certifikace (NRKH2.E300503 a NRKH8.E300503), shoda EN ' +
      '60947-5-2. Existuje i varianta se šroubovacím otočným M12 konektorem místo kabelu a ' +
      'varianta pro univerzální 24–240 V AC/DC napájení (dle popisu produktové řady) — nahraný ' +
      'díl WTB250-2N1131 je konkrétně kabelová 10–30 V DC verze.',
    tags: 'modul,senzor,optoelektronický,fotoelektrický,přiblížení,proximity,background-suppression,sick,wtb250,npn,ip67,průmyslový',
  },
  {
    name: 'WTB250-2N1151',
    packageType:
      'Pravoúhlé plastové pouzdro (ABS) 20 × 65 × 43,9 mm, hmotnost 150 g, optika PMMA, kryt IP67, ' +
      'montážní otvory Ø4,2 mm pro M4 šroub (na obou stranách, dodávána montážní konzole ' +
      'BEF-W250), 4vodičový kabel 2 m (hnědý=+, modrý=-, černý=Q výstup, bílý=L/D volba režimu), ' +
      'na čelní straně potenciometr pro nastavení dosahu (2 otáčky, poziční ukazatel 270°), ' +
      'zelená LED (indikace stability) a žlutá LED (indikace přijatého signálu)',
    value:
      'Optoelektronický (fotoelektrický) snímač přiblížení s potlačením pozadí (background ' +
      'suppression), viditelné červené světlo (BrightLight LED), dosah 200–1000 mm nastavitelný, ' +
      'NPN výstup s otevřeným kolektorem, 10–30 V DC',
    notes:
      'SICK AG "W250-2, Photoelectric proximity sensor, Background suppression — WTB250-2N1151" ' +
      '(Online Data Sheet, díl. č. 6044686, staženo 15. 3. 2016) — ⚠️ dlouhodosahová varianta ' +
      'WTB250-2N1131 v této knihovně (samostatný záznam): naprosto shodné mechanické provedení, ' +
      'elektrické parametry výstupu, napájení, krytí i certifikace, LIŠÍ SE POUZE v nastavitelném ' +
      'dosahu (200–1000 mm zde vs. 100–300 mm u WTB250-2N1131) a odpovídající velikosti světelné ' +
      'stopy (Ø35 mm @1000mm zde vs. Ø30 mm @300mm) — jiný optický systém/čočka pro delší dosah, ' +
      'jinak identická produktová řada "W250-2" se stejným principem potlačení pozadí (background ' +
      'suppression) — viz záznam WTB250-2N1131 pro plný popis principu funkce a společných ' +
      'elektrických parametrů. Výstup NPN s otevřeným kolektorem, volitelný režim spínání ' +
      'světlo/tma přes ovládací vodič L/D, max. výstupní proud 100 mA, doba odezvy max 3 ms, ' +
      'spínací kmitočet 160 Hz. Napájení 10–30 V DC, odběr max 35 mA. Krytí IP67, třída ochrany ' +
      'III. Provozní teplota -25 až +55 °C, skladovací -40 až +70 °C. UL certifikace, shoda EN ' +
      '60947-5-2. Kabelová verze s 10–30 V DC napájením (existují i M12 konektor a univerzální ' +
      'AC/DC varianty dle produktové řady).',
    tags: 'modul,senzor,optoelektronický,fotoelektrický,přiblížení,proximity,background-suppression,sick,wtb250,npn,ip67,průmyslový',
  },
  {
    name: 'MAXREFDES103#',
    packageType:
      'Kompletní náramkový (wristband) referenční design — dvě desky (Micro board + Sensor ' +
      'board) v uzavřeném plastovém pouzdře na silikonovém řemínku, USB Type-C konektor pro ' +
      'nabíjení/PC komunikaci, 2× tlačítko (napájení + "F"/logování), stavová RGB LED, zadní ' +
      'strana s optickými okénky pro LED/fotodiody (kontakt s pokožkou), vestavěná baterie',
    value:
      'Wearable reference-design zdravotní senzorový náramek — optický PPG biosenzor (tep, SpO2, ' +
      'HRV, dechová frekvence) + IMU + Bluetooth LE, embedded algoritmy pro výpočet srdečních ' +
      'parametrů',
    notes:
      'Maxim Integrated "MAXREFDES103# Health Sensor Band User Guide" (UG7145, Rev 0, leden 2020) ' +
      '— komplexní hotový referenční produkt/vývojová platforma, ne jednotlivá součástka — do ' +
      'knihovny přidán jako jeden souhrnný záznam kategorie "Modul" (obdobně jako ostatní hotové ' +
      'moduly/eval-boardy v této knihovně), namísto rozepisování všech dílčích integrovaných ' +
      'obvodů zvlášť. Systém tvoří dvě desky: "Micro board" (řídicí/komunikační) obsahuje MCU ' +
      'MAX32630 (Arm Cortex-M4F, hlavní řadič), PMIC MAX20303 (správa napájení/nabíjení), modul ' +
      'PAN1326B (duální Bluetooth Classic/BLE), sériovou flash paměť MX25U51245GZ4I54 (64 MB, ' +
      'QSPI), hostitelský akcelerometr BMI160 a USB-C konektor. "Sensor board" (senzorový ' +
      'subsystém, "Sensor Hub") obsahuje samostatný MCU MAX32664 s vestavěným (embedded) ' +
      'algoritmem výpočtu tepové frekvence, optický analogový front-end/PPG senzor MAX86141 ' +
      '(1× zelená LED, 1× červená LED, 1× IR LED, 2 fotodiody), volitelný 3osý akcelerometr ' +
      'KX122, a MAX4740 (čtyřnásobný SPDT přepínač pro konfiguraci zapojení LED/fotodiod dle ' +
      'aktuálně měřeného parametru). Funkce: optické měření tepové frekvence (PPG), pulzní ' +
      'oxymetrie (SpO2), variabilita srdečního tepu (HRV), dechová frekvence, hodnocení kvality ' +
      'spánku — vyhodnocováno buď algoritmy na palubě (MAX32664), nebo streamováno do PC GUI ' +
      '(Maxim DeviceStudio) či Android aplikace (Maxim Health Sensor Platform) přes USB nebo ' +
      'Bluetooth LE. Ovládání: tlačítko napájení (krátký stisk = zap/vyp LED, 3s = vypnutí ' +
      'zařízení, 12s = tvrdý reset), tlačítko "F" (start/stop záznamu do flash paměti). Stavová ' +
      'RGB LED signalizuje mj. stav USB/BLE připojení, stav baterie, chybové stavy. K programování/ ' +
      'aktualizaci firmwaru micro-boardu je potřeba přídavná deska MAXDAP Pico Adapter (není ' +
      'součástí balení senzorového náramku samotného, uvedena v seznamu vybavení datasheetu). ' +
      'Napájeno interní baterií, nabíjení přes USB Type-C.',
    tags: 'modul,senzor,ppg,biosenzor,tepová-frekvence,spo2,wearable,náramek,maxim,maxrefdes103,bluetooth,ble,imu',
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

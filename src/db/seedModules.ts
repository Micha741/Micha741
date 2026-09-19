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
  {
    name: 'HPM-100GD-A01',
    packageType:
      'Přírubová (flange-mount) konektorová verze, tělo cca 50×22,6×20,5 mm, kruhová příruba ' +
      'Ø8,8 mm s tlakovým otvorem (Ø6 mm) a 2× montážní otvor Ø4,5 mm, 3pinový konektor (VOUT, ' +
      'GND, VCC), kompatibilní s pouzdrem J.S.T. XMP-03V',
    value:
      'MEMS piezoresistivní tlakový senzorový modul s vestavěnou EEPROM digitální kompenzací, ' +
      'kmitočtový (frekvenční) výstup, měřitelný tlak -90 až 980 kPa (dle rodiny), napájení 5 V ' +
      '(přírubová verze i 12 V), odběr typ. 0,7 mA',
    notes:
      'HOKURIKU Electric Industry (HDK) "Pressure Sensor HPM Series", model HPM-100GD-A01 (dok. ' +
      '2012.7.10) — tlakový senzorový modul vyrobený polovodičovou mikroobráběcí (MEMS) ' +
      'technologií, s vestavěnou EEPROM pro digitální kompenzaci (teplotní/linearizační), vysoká ' +
      'přesnost a stabilita. ⚠️ Koncepčně příbuzný křemenným (quartz) tlakovým senzorům Seiko ' +
      'Epson TSU-20G/TSU-70G/TSU-100G v této knihovně (oba typy mají frekvenční výstup a podobné ' +
      'kovové/plastové pouzdro s konektorovým výstupem), ale založený na ODLIŠNÉ technologii — ' +
      'HPM-100GD-A01 využívá MEMS piezorezistivní snímací element s digitální EEPROM kompenzací, ' +
      'zatímco TSU řada využívá křemenný rezonátor s tlakově závislým kmitočtem — nejde o ' +
      'zaměnitelné náhrady. Kód dílu dle výrobcova schématu značení: HPM-①-②③-④ = HPM (model) + ' +
      '"100G" (② celkový rozsah tlaku, přesná hodnota v kPa není v tomto stručném datasheetu ' +
      'explicitně uvedena — nejistota vyznačena) + "D" (③ typ výstupu: D=digitální/frekvenční, ' +
      'A=analogový/napěťový) + "A01" (④ tvar/vlastní specifikace: A=přírubová konektorová verze, ' +
      'B=diskrétní verze bez konektoru). Výstupní funkce (frekvenční): f = 26−[a×(P[kPa]+29,4)], ' +
      'a=20/98 kHz/kPa — příklad: výstup 26 kHz @P=29,4kPa, výstup 6 kHz @P=68,6kPa (kmitočet ' +
      'KLESÁ s rostoucím tlakem, opačně než u TSU řady). Přesnost výstupu ±2 %FS. Odběr typ. ' +
      '0,7 mA (max 1,0 mA). Napájecí napětí základní 5 V (rozsah -0,3 až 6,5 V), přírubová verze ' +
      'může pracovat i při 12 V. Celkový měřitelný rozsah tlaku v rámci produktové řady -90 až ' +
      '980 kPa (absolutní i přetlak dle konkrétního modelu). Provozní teplota -10 až +60 °C, ' +
      'skladovací -40 až +85 °C, provozní vlhkost 0–95 %RH (nekondenzující). Dostupná i diskrétní ' +
      '(bezkonektorová) a analogová (napěťový výstup) varianta v rámci téže produktové řady dle ' +
      'schématu značení.',
    tags: 'modul,senzor,tlak,mems,piezorezistivní,frekvenční,eeprom,hokuriku,hdk,hpm-100gd',
  },
  {
    name: 'BI1.5U-EG08-RP6X-H1341',
    packageType:
      'Válcové závitové pouzdro M8×1 (threaded barrel), nerezová ocel 1.4427, aktivní čelní ' +
      'plocha z plastu PA12-GF30, délka 57 mm, indikační žlutá LED, konektor M12×1 (samčí, ' +
      '3pinový: 1=BN/+, 3=BU/-, 2=WH/výstup Q), max. utahovací moment matice pouzdra 5 Nm',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, spínací vzdálenost 1,5 mm, PNP výstup ' +
      'rozpínací (NC) kontakt, 3vodičové zapojení, 10–30 V DC, "Factor 1" — stejný dosah pro ' +
      'všechny kovy, odolný vůči magnetickým polím',
    notes:
      'TURCK "uprox® — Inductive Sensor BI1.5U-EG08-RP6X-H1341" (Ident-No. 4600541, Rev. B, ' +
      '2019-02-08) — kompletní průmyslový indukční snímač s vlastní elektronikou/výstupním ' +
      'obvodem v uzavřeném závitovém pouzdře, proto zařazen do kategorie "Modul", ne "IO" — ' +
      'obdobně jako fotoelektrické snímače SICK WTB250-2N1131/WTB250-2N1151 v této knihovně. ' +
      'Princip "uprox Factor 1": patentovaný bezferitový vícecívkový systém (ferrite-coreless ' +
      'multicoil), na rozdíl od klasických indukčních senzorů s feritovým jádrem detekuje ' +
      'VŠECHNY kovy (ocel, hliník, mosaz, měď...) se STEJNOU spínací vzdáleností (tzv. "Factor 1" ' +
      '— korekční faktor 1,0 nezávisle na materiálu) a je navíc odolný vůči rušení vnějšími ' +
      'magnetickými poli — u klasických feritových indukčních senzorů se spínací vzdálenost u ' +
      'neželezných kovů výrazně zkracuje (korekční faktor <1). Jmenovitá spínací vzdálenost Sn ' +
      '1,5 mm (montáž zápustná/flush), zajištěná spínací vzdálenost max 0,81×Sn, opakovatelnost ' +
      'max 2 %FS, teplotní drift max ±10 % (±15 % v rozšířeném rozsahu -25 až +70°C), hystereze ' +
      '3–15 %. Výstup: 3vodičové PNP zapojení, rozpínací (NC) kontakt, max. proud 150 mA, klidový ' +
      'proud max 15 mA, zbytkový proud max 0,1 mA, úbytek napětí max 1,8 V, spínací kmitočet ' +
      '2 kHz, ochrana proti zkratu (cyklická), přepólování a přerušení vodiče (kompletní). ' +
      'Napájení 10–30 V DC, zvlnění max 10 %. Izolační zkušební napětí 0,5 kV. Odolnost proti ' +
      'vibracím 55 Hz (1 mm), proti rázům 30 g (11 ms). Krytí IP67 (dle štítku), IP68 (dle popisu ' +
      'funkcí). Provozní teplota -30 až +85 °C. MTTF 874 let dle SN 29500 @40°C. Průměr aktivní ' +
      'plochy Ø8 mm. Dodává se řada montážních příslušenství (konzole QM-08/BST-08B/MW-08/BSS-08/ ' +
      'MBS80).',
    tags: 'modul,senzor,indukční,přibližovací,proximity,uprox,factor1,turck,pnp,m8,ip67,průmyslový',
  },
  {
    name: 'BI1-EG05K-AN6X-V1331',
    packageType:
      'Válcové závitové pouzdro M5×0,5 (threaded barrel), nerezová ocel 1.4427, délka 27,7 mm, ' +
      'indikační žlutá LED, konektor M8×1 (samčí, 4pinový: 1=BN/+, 3=BU/-, 4=BK/výstup Q), max. ' +
      'utahovací moment matice pouzdra 5 Nm',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, klasický feritový typ, spínací vzdálenost ' +
      '1 mm, NPN výstup spínací (NO) kontakt, 3vodičové zapojení, 10–30 V DC',
    notes:
      'TURCK "Inductive Sensor BI1-EG05K-AN6X-V1331" (Ident-No. 4609769, 2019-02-08) — ⚠️ POZOR ' +
      'na záměnu s BI1.5U-EG08-RP6X-H1341 v této knihovně (samostatný záznam): oba jsou indukční ' +
      'přibližovací spínače od stejného výrobce (TURCK) ve stejném typu pouzdra (nerezový závitový ' +
      'válec), ale BI1-EG05K-AN6X-V1331 je KLASICKÝ feritový typ (RLC obvod s feritovou cívkou), ' +
      'NIKOLI "uprox Factor 1" bezferitový typ jako BI1.5U-EG08-RP6X-H1341 — proto má pro různé ' +
      'kovy RŮZNÉ korekční faktory spínací vzdálenosti (St37/ocel=1,0; Al/hliník=0,3; nerez=0,7; ' +
      'Ms/mosaz=0,4), na rozdíl od "Factor 1" senzoru se stejným dosahem pro všechny kovy. Další ' +
      'rozdíly: menší závit M5×0,5 (vs M8×1), kratší tělo 27,7 mm (vs 57 mm), menší konektor M8×1 ' +
      '(vs M12×1), nižší spínací vzdálenost Sn 1 mm (vs 1,5 mm), NPN výstup se SPÍNACÍM (NO) ' +
      'kontaktem (vs PNP s ROZPÍNACÍM/NC kontaktem u BI1.5U-EG08-RP6X-H1341) — elektricky ani ' +
      'mechanicky nejde o zaměnitelné náhrady. Zajištěná spínací vzdálenost max 0,81×Sn, ' +
      'opakovatelnost max 2 %FS, teplotní drift max ±10 %, hystereze 3–15 %. Výstup: 3vodičové ' +
      'NPN zapojení, spínací (NO) kontakt, max. proud 100 mA, klidový proud max 15 mA, zbytkový ' +
      'proud max 0,1 mA, úbytek napětí max 1,8 V, spínací kmitočet 2 kHz, ochrana proti zkratu ' +
      '(cyklická), přepólování a přerušení vodiče (kompletní). Napájení 10–30 V DC, zvlnění max ' +
      '10 %. Izolační zkušební napětí 0,5 kV. Odolnost proti vibracím 55 Hz (1 mm), proti rázům ' +
      '30 g (11 ms). Krytí IP67. Provozní teplota -25 až +70 °C (užší rozsah než "uprox" varianta). ' +
      'MTTF 2283 let dle SN 29500 @40°C. Průměr aktivní plochy Ø5 mm.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,turck,npn,m5,ip67,průmyslový',
  },
  {
    name: 'Q130RA',
    packageType:
      'Kompaktní pouzdro ABS/polykarbonát, integrovaný 5pinový M12/Euro-style konektor (quick ' +
      'disconnect), nerezové montážní závity a konektor, 4 LED indikátory (zelená=napájení, ' +
      'červená=síla signálu, 2× žlutá=výstup 1/2), pinout: 1=hnědý (+), 2=bílý (NPN výstup 1), ' +
      '3=modrý (-), 4=černý (PNP výstup 2), 5=šedý (dálkové TEACH)',
    value:
      'Radarový (FMCW) senzor pro detekci pohybujících se i stacionárních cílů, kmitočet ' +
      '24,050–24,250 GHz (pásmo ISM), dosah 1–24 m (model -9076) nebo 1–40 m (model -2450), ' +
      'bipolární NPN/PNP výstup, 12–30 V DC',
    notes:
      'Banner Engineering "R-GAGE® Q130RA Sensor" (Quick Start Guide, P/N 208830 Rev. B, ' +
      '15. 5. 2019) — kompletní průmyslový radarový snímač s vlastní elektronikou, konektorem a ' +
      'konfiguračním softwarem (Banner Radar Configuration), proto zařazen do kategorie "Modul". ' +
      'Princip funkce: FMCW (Frequency Modulated Continuous-Wave) radar v pásmu 24 GHz (ISM), ' +
      'na rozdíl od optických/indukčních senzorů v této knihovně detekuje objekty na dálku bez ' +
      'ohledu na světelné podmínky nebo optickou průzračnost prostředí — reaguje na objekty ' +
      'obsahující kov, vodu nebo podobné vysoce dielektrické materiály. Dostupné dvě varianty ' +
      'dosahu: "-9076" (1–24 m) a "-2450" (1–40 m), obě se stejnou elektronikou/konektorem, liší ' +
      'se jen anténním/zpracovacím nastavením pro danou vzdálenost — do knihovny přidán jako ' +
      'jeden souhrnný záznam "Q130RA" (přesná varianta -9076/-2450 nespecifikována v tomto Quick ' +
      'Start Guide, plné specifikace v samostatném Instruction Manual p/n 208831 — nejistota ' +
      'uvedena explicitně). Maximální vysílací výkon: ERP 3,3 mW (5 dBm), EIRP 100 mW (20 dBm). ' +
      'Výstupy: bipolární — Load 1 na pinu 2 (bílý) = NPN, Load 2 na pinu 4 (černý) = PNP, max ' +
      '50 mA na výstup, saturace <3,5V @50mA, ochrana proti zkratu. Doba odezvy softwarově ' +
      'volitelná (50/50, 100/100, 50/500, 50/1000 ms ON/OFF). Napájení 12–30 V DC, odběr <50 mA ' +
      '@24V (normální režim, 1,2 W), ochrana proti přepólování a přechodovým přepětím, zpoždění ' +
      'po zapnutí <3 s. Konfigurace/diagnostika přes PC software (Banner Radar Configuration, ' +
      'USB přes Pro Converter Cable) nebo přímo přes červenou LED síly signálu na zařízení. ' +
      'Odolnost proti vibracím (10–55 Hz, 1mm p-p) a rázům (30g, 11ms) dle IEC 60947-5-2. Krytí ' +
      'IEC IP67. Provozní teplota -40 až +65 °C. UL certifikace (E224071), ETSI/EN 300 440, FCC ' +
      'ID UE3RGAGE1XX. ⚠️ Výrobcem výslovně vyloučeno pro aplikace ochrany osob (nemá redundantní ' +
      'bezpečnostní obvody).',
    tags: 'modul,senzor,radar,fmcw,proximity,detekce-pohybu,banner,r-gage,q130ra,24ghz,ip67,průmyslový',
  },
  {
    name: 'BC10-PT30-AZ3X',
    packageType:
      'Válcové závitové pouzdro M30×1,5 (threaded barrel), plast PVDF (pouzdro i aktivní čelní ' +
      'plocha), délka 60 mm, potenciometr pro jemné doladění citlivosti, indikační žlutá LED, ' +
      'kabelový výstup, max. utahovací moment matice pouzdra 2 Nm',
    value:
      'Kapacitní (bezkontaktní) přibližovací spínač, spínací vzdálenost 10 mm (zápustná montáž) ' +
      '/ 15 mm (nezápustná), AC 2vodičové zapojení, spínací (NO) kontakt, 20–250 V AC',
    notes:
      'TURCK "Capacitive Sensor BC10-PT30-AZ3X" (Ident-No. 2350001, 2019-02-08) — ⚠️ POZOR na ' +
      'záměnu s indukčními senzory TURCK BI1.5U-EG08-RP6X-H1341/BI1-EG05K-AN6X-V1331 v této ' +
      'knihovně (samostatné záznamy): jde o zcela odlišný princip snímání — kapacitní senzor ' +
      'detekuje změnu kapacity elektrického pole u své aktivní plochy, a proto reaguje NA ' +
      'ELEKTRICKY VODIVÉ I NEVODIVÉ materiály (kovy, plasty, sklo, dřevo, kapaliny, sypké ' +
      'materiály), zatímco indukční senzory reagují VÝHRADNĚ na kovy — typické použití kapacitních ' +
      'senzorů: detekce hladiny/naplnění nádob i skrz nekovovou stěnu (viz příslušenství MAP-M30 ' +
      '"sensor replacement with filled container possible" — umožňuje výměnu senzoru bez ' +
      'vyprázdnění nádoby), detekce plastových/nekovových objektů. Další zásadní rozdíl: senzor ' +
      'je AC (20–250 V AC, 50–60 Hz), NIKOLI DC jako indukční senzory TURCK v této knihovně ' +
      '(10–30 V DC), a má pouze 2vodičové zapojení (bez samostatného napájecího a signálového ' +
      'páru). Citlivost jemně nastavitelná potenciometrem (po úpravě přestávají platit tovární ' +
      'specifikace datasheetu). Jmenovitá spínací vzdálenost Sn 10 mm (zápustná montáž) / 15 mm ' +
      '(nezápustná), zajištěná spínací vzdálenost max 0,72×Sn, hystereze 2–20 %, teplotní drift ' +
      'typ. 20 %, opakovatelnost max 2 %FS. Výstup: 2vodičové AC zapojení, spínací (NO) kontakt, ' +
      'max. proud 500 mA, min. provozní proud 5 mA, zbytkový proud max 1,7 mA, úbytek napětí max ' +
      '7 V, spínací kmitočet 0,02 kHz (20 Hz — výrazně pomalejší než DC indukční senzory). ' +
      'Izolační zkušební napětí 1,5 kV. Odolnost proti vibracím 55 Hz (1 mm), proti rázům 30 g ' +
      '(11 ms). Krytí IP67. Provozní teplota -25 až +70 °C. MTTF 1080 let dle SN 29500 @40°C. ' +
      'Průměr aktivní plochy Ø30 mm.',
    tags: 'modul,senzor,kapacitní,přibližovací,proximity,hladina,turck,ac,m30,pvdf,ip67,průmyslový',
  },
  {
    name: 'BC10-Q14-VN4X2',
    packageType:
      'Pravoúhlé kvádrové pouzdro "Q14" (aktivní plocha nahoře), rozměry 55,5×30×14 mm, plast ' +
      'PBT-GF30-V0, potenciometr pro jemné doladění citlivosti, zelená LED (napájení) + žlutá ' +
      'LED (spínací stav), kabelový výstup (Ø5,2 mm, LifYY-11Y, PUR, 2 m, 4×0,34 mm²), v balení ' +
      'přiložena montážní konzole MH-Q14',
    value:
      'Kapacitní (bezkontaktní) přibližovací spínač, spínací vzdálenost 10 mm (zápustná i ' +
      'nezápustná montáž), 4vodičové DC zapojení, komplementární NPN výstup (NO+NC současně), ' +
      '10–65 V DC',
    notes:
      'TURCK "Capacitive Sensor BC10-Q14-VN4X2" (Ident-No. 2530030, 2019-02-08) — ⚠️ POZOR na ' +
      'záměnu s BC10-PT30-AZ3X v této knihovně (samostatný záznam): oba jsou kapacitní ' +
      'přibližovací spínače stejného výrobce se stejnou jmenovitou spínací vzdáleností Sn 10 mm, ' +
      'ale mechanicky i elektricky zcela odlišné — BC10-Q14-VN4X2 má pravoúhlé kvádrové pouzdro ' +
      '"Q14" (55,5×30×14mm, aktivní plocha nahoře) místo válcového závitového M30, je napájen ' +
      'stejnosměrně (10–65 V DC, 4vodičové zapojení) místo střídavě (20–250 V AC, 2vodičové), a ' +
      'má KOMPLEMENTÁRNÍ NPN výstup — tzn. SOUČASNĚ poskytuje jak spínací (NO), tak ' +
      'rozpínací (NC) signál na oddělených vodičích (BK a WH dle schématu zapojení), zatímco ' +
      'BC10-PT30-AZ3X má jen jediný spínací (NO) 2vodičový AC výstup. Citlivost jemně ' +
      'nastavitelná potenciometrem. Jmenovitá spínací vzdálenost Sn 10 mm (shodná pro zápustnou i ' +
      'nezápustnou montáž, na rozdíl od BC10-PT30-AZ3X kde se liší 10mm/15mm), zajištěná spínací ' +
      'vzdálenost max 0,72×Sn, hystereze 2–20 %, teplotní drift typ. 20 %, opakovatelnost max ' +
      '2 %FS. Výstup: 4vodičové DC zapojení, komplementární kontakt NPN, max. proud 200 mA, ' +
      'klidový proud max 15 mA, zbytkový proud max 0,1 mA, úbytek napětí max 1,8 V, spínací ' +
      'kmitočet 0,1 kHz (5× rychlejší než BC10-PT30-AZ3X), ochrana proti zkratu (cyklická), ' +
      'přepólování a přerušení vodiče (kompletní). Napájení 10–65 V DC, zvlnění max 10 %. ' +
      'Izolační zkušební napětí 0,5 kV. UL certifikace. Odolnost proti vibracím 55 Hz (1 mm), ' +
      'proti rázům 30 g (11 ms). Krytí IP67. Provozní teplota -25 až +70 °C. MTTF 1080 let dle ' +
      'SN 29500 @40°C.',
    tags: 'modul,senzor,kapacitní,přibližovací,proximity,turck,dc,npn,komplementární,q14,ip67,průmyslový',
  },
  {
    name: 'BC10-QF5.5-RN6X2',
    packageType:
      'Tenké ploché pravoúhlé pouzdro "QF5,5" (aktivní plocha nahoře), rozměry 54×20,3×5,5 mm ' +
      '(výrazně tenčí než Q14), plast PP, montážní otvory Ø3,2 mm (M3×20 DIN 963), potenciometr ' +
      'pro jemné doladění citlivosti, zelená LED (napájení) + žlutá LED (spínací stav), kabelový ' +
      'výstup (Ø3 mm, LifYY-11Y, PUR, 2 m, 3×0,14 mm²) — dle ilustrace v datasheetu určeno mj. k ' +
      'upevnění na zakřivený povrch (např. trubku/válec) pomocí stahovacích pásků',
    value:
      'Kapacitní (bezkontaktní) přibližovací spínač, plochý tvar, spínací vzdálenost 10 mm ' +
      '(zápustná i nezápustná montáž), 3vodičové DC zapojení, rozpínací (NC) NPN výstup, ' +
      '10–30 V DC',
    notes:
      'TURCK "Capacitive Sensor BC10-QF5.5-RN6X2" (Ident-No. 2620128, Rev. B, 2019-02-08) — ⚠️ ' +
      'třetí varianta v rámci kapacitní řady TURCK BC10 v této knihovně (spolu s BC10-PT30-AZ3X a ' +
      'BC10-Q14-VN4X2, samostatné záznamy), tentokrát v extrémně tenkém plochém pouzdru "QF5,5" ' +
      '(pouhých 5,5 mm tloušťky, plast PP) — vhodné pro montáž do stísněných prostor nebo obtočení ' +
      'kolem zakřivených povrchů (trubky/válce) pomocí stahovacích pásků, na rozdíl od objemnějšího ' +
      'bloku Q14 nebo válcového závitového M30 u ostatních dvou sourozenců. Elektricky nejbližší ' +
      'BC10-Q14-VN4X2 (oba DC, 10–30 V u tohoto dílu vs. 10–65 V u Q14), ale liší se počtem vodičů ' +
      'a typem výstupu: BC10-QF5.5-RN6X2 má 3vodičové zapojení s jediným rozpínacím (NC) NPN ' +
      'výstupem, zatímco BC10-Q14-VN4X2 má 4vodičové zapojení s komplementárním (současně NO+NC) ' +
      'výstupem — a oproti BC10-PT30-AZ3X (AC, 2vodičový, jen NO) jde o zcela odlišnou elektrickou ' +
      'koncepci. Citlivost jemně nastavitelná potenciometrem. Jmenovitá spínací vzdálenost Sn ' +
      '10 mm (shodná pro zápustnou i nezápustnou montáž), zajištěná spínací vzdálenost max ' +
      '0,72×Sn, hystereze 2–20 %, teplotní drift typ. 20 %, opakovatelnost max 2 %FS. Výstup: ' +
      '3vodičové DC zapojení, rozpínací (NC) kontakt, NPN, max. proud 200 mA, klidový proud max ' +
      '15 mA, zbytkový proud max 0,1 mA, úbytek napětí max 1,8 V, spínací kmitočet 0,1 kHz, ' +
      'ochrana proti zkratu (cyklická), přepólování a přerušení vodiče (kompletní). Napájení ' +
      '10–30 V DC, zvlnění max 10 %. Izolační zkušební napětí 0,5 kV. UL certifikace. Odolnost ' +
      'proti vibracím 55 Hz (1 mm), proti rázům 30 g (11 ms). Krytí IP67. Provozní teplota -25 ' +
      'až +70 °C. MTTF 1080 let dle SN 29500 @40°C. Průměr aktivní plochy Ø20 mm.',
    tags: 'modul,senzor,kapacitní,přibližovací,proximity,turck,dc,npn,plochý,qf5,ip67,průmyslový',
  },
  {
    name: 'BC20-Q20-RZ3X2',
    packageType:
      'Pravoúhlé kvádrové pouzdro "Q20" (aktivní plocha nahoře), rozměry 68×40×20 mm (větší než ' +
      'Q14), plast PBT-GF30-V0, potenciometr pro jemné doladění citlivosti, zelená LED (napájení) ' +
      '+ červená LED (spínací stav — na rozdíl od žluté u ostatních BC senzorů v této knihovně), ' +
      'kabelový výstup (Ø5,2 mm, LifYY, PVC, 2 m, 3×0,34 mm²), v balení přiložena montážní ' +
      'konzole MH-Q20',
    value:
      'Kapacitní (bezkontaktní) přibližovací spínač, vyšší dosahová řada "BC20", spínací ' +
      'vzdálenost 20 mm, AC 2vodičové zapojení, rozpínací (NC) kontakt, 20–250 V AC',
    notes:
      'TURCK "Capacitive Sensor BC20-Q20-RZ3X2" (Ident-No. 4352001, 2019-02-08) — ⚠️ POZOR na ' +
      'záměnu s produktovou řadou "BC10" v této knihovně (BC10-PT30-AZ3X, BC10-Q14-VN4X2, ' +
      'BC10-QF5.5-RN6X2, samostatné záznamy) — BC20-Q20-RZ3X2 patří do VYŠŠÍ dosahové řady "BC20" ' +
      's dvojnásobnou jmenovitou spínací vzdáleností Sn 20 mm (oproti 10 mm u řady BC10), a to ' +
      'shodně pro zápustnou i nezápustnou montáž. Elektricky nejbližší BC10-PT30-AZ3X — oba AC ' +
      '2vodičové (20–250 V AC, 50–60 Hz), ale BC20-Q20-RZ3X2 má rovnou rozpínací (NC) kontakt bez ' +
      'alternativy (BC10-PT30-AZ3X má spínací/NO), a pravoúhlé kvádrové pouzdro Q20 (68×40×20mm) ' +
      'místo válcového závitového M30 — mechanicky odpovídá spíše bloku BC10-Q14-VN4X2 (ale ten je ' +
      'DC, ne AC). Citlivost jemně nastavitelná potenciometrem. Zajištěná spínací vzdálenost max ' +
      '0,72×Sn, hystereze 2–20 %, teplotní drift typ. 20 %, opakovatelnost max 2 %FS. Výstup: ' +
      '2vodičové AC zapojení, rozpínací (NC) kontakt, max. proud 500 mA, min. provozní proud ' +
      '5 mA, zbytkový proud max 1,7 mA, úbytek napětí max 7 V, spínací kmitočet 0,02 kHz (20 Hz). ' +
      'Izolační zkušební napětí 1,5 kV. Odolnost proti vibracím 55 Hz (1 mm), proti rázům 30 g ' +
      '(11 ms). Krytí IP67. Provozní teplota -25 až +70 °C. MTTF 1080 let dle SN 29500 @40°C.',
    tags: 'modul,senzor,kapacitní,přibližovací,proximity,turck,ac,nc,q20,ip67,průmyslový',
  },
  {
    name: 'NBB3-V3-Z4',
    packageType:
      'Malé ploché kvádrové pouzdro 27,8×16×10,3 mm, plast PBT (pouzdro i aktivní čelní plocha), ' +
      '2 montážní otvory, indikační žlutá LED, integrovaný kabel PVC 130 mm (Ø3 mm, 2 žíly ' +
      '0,14 mm², BN=L+, BU=L-), hmotnost 7,5 g',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, klasický feritový typ, spínací vzdálenost ' +
      '3 mm (zápustná montáž), 2vodičové DC zapojení, spínací (NO) kontakt, 5–60 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB3-V3-Z4" (301158_eng.xml, vydáno 5. 8. 2019) — ⚠️ jiný ' +
      'výrobce než indukční senzory TURCK v této knihovně (BI1.5U-EG08-RP6X-H1341, ' +
      'BI1-EG05K-AN6X-V1331) — Pepperl+Fuchs je samostatná firma, ne TURCK, přestože oba nabízejí ' +
      'obdobné produktové řady indukčních senzorů. Elektricky/konstrukčně nejbližší TURCK ' +
      'BI1-EG05K-AN6X-V1331 (oba klasické feritové senzory s různými korekčními faktory dle ' +
      'materiálu cíle — zde rAl=0,45, rCu=0,35, r304/nerez=0,8, rBrass/mosaz=0,5 — místo ' +
      'jednotného "Factor 1" jako u TURCK uprox BI1.5U-EG08-RP6X-H1341), ale v miniaturním plochém ' +
      'kvádrovém pouzdru s integrovaným kabelem místo válcového závitového pouzdra s konektorem. ' +
      '2vodičové zapojení (na rozdíl od 3vodičových TURCK senzorů v této knihovně) — zátěž je ' +
      'zapojena v sérii se senzorem, napájecí a signálový obvod sdílejí stejné dva vodiče. ' +
      'Jmenovitá spínací vzdálenost sn 3 mm (zápustná montáž), zajištěná spínací vzdálenost 0–2,4 ' +
      'mm, skutečná spínací vzdálenost typ. 2,7–3,3 mm, hystereze typ. 0,2 mm. Napájecí napětí ' +
      '5–60 V DC (širší rozsah než TURCK senzory), spínací kmitočet 0–2000 Hz, provozní proud ' +
      '4–100 mA, min. provozní proud 4 mA, zbytkový proud typ. 0,46 mA (0,4–0,55 mA), úbytek ' +
      'napětí max 4 V (typ. 3,6 V @IL=10mA), zpoždění dostupnosti po zapnutí max 1 ms. Ochrana ' +
      'proti přepólování a indukčnímu přepětí, BEZ zkratové ochrany (⚠️ na rozdíl od TURCK ' +
      'senzorů, které mají cyklickou zkratovou ochranu — nutno zajistit externí ochranu). ' +
      'Funkční bezpečnostní parametry: MTTFd 1552 let, doba mise 20 let, diagnostické pokrytí 0 %. ' +
      'Krytí IP67. Provozní teplota -25 až +85 °C (širší než TURCK varianty). Shoda EN/IEC ' +
      '60947-5-2, UL/CSA/CCC certifikace.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb3,2vodičový,ip67,průmyslový',
  },
  {
    name: 'NBB4-12GM75-US',
    packageType:
      'Válcové závitové pouzdro M12×1 (threaded barrel), mosaz s niklovým povlakem, délka 58,5 ' +
      'mm (53,5 mm závitové části), aktivní čelo PBT, indikační LED (zelená=napájení, žlutá= ' +
      'spínací stav), kabelový výstup (PUR, 2 m, 0,34 mm², 3 žíly: BN=AC/DC, BU=AC/DC, GN/YE= ' +
      'zemnicí/ochranný vodič), v balení 2 pojistné matice',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, klasický feritový typ, spínací vzdálenost ' +
      '4 mm (zápustná montáž), UNIVERZÁLNÍ 2vodičové AC/DC zapojení, spínací (NO) kontakt, ' +
      '20–250 V AC / 20–300 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB4-12GM75-US" (197866_eng.xml, vydáno 5. 8. 2019) — ⚠️ ' +
      'sourozenecký díl NBB3-V3-Z4 v této knihovně (samostatný záznam), stejný výrobce a princip ' +
      '(klasický feritový senzor s korekčními faktory dle materiálu cíle — zde rAl=0,5, rCu=0,45, ' +
      'r304/nerez=0,75), ale zásadně odlišné provedení: NBB4-12GM75-US má UNIVERZÁLNÍ napájení ' +
      '20–250 V AC NEBO 20–300 V DC (funguje na obojí bez rozlišení polarity/typu proudu), ' +
      'zatímco NBB3-V3-Z4 je čistě DC (5–60 V) — navíc mechanicky odlišné: válcové závitové ' +
      'pouzdro M12×1 z poniklované mosazi s kabelovým výstupem (na rozdíl od malého plochého ' +
      'kvádrového pouzdra s integrovaným kabelem u NBB3-V3-Z4), vyšší jmenovitá spínací ' +
      'vzdálenost 4 mm (vs 3 mm). Kabel má navíc třetí (zemnicí/ochranný, GN/YE) vodič nutný pro ' +
      'AC provoz, funkčně jde ale stále o "2-wire" (signálové) zapojení zátěže v sérii se ' +
      'senzorem. Spínací kmitočet 30 Hz (výrazně nižší než 2000 Hz u NBB3-V3-Z4 — typické pro AC/ ' +
      'DC univerzální senzory kvůli nutnosti detekce síťové frekvence). Hystereze 3–15 % (typ. ' +
      '5 %). Ochrana: tolerantní vůči přepólování, SE zkratovou ochranou (⚠️ na rozdíl od ' +
      'NBB3-V3-Z4, který zkratovou ochranu nemá). Úbytek napětí max 8 V. Provozní proud 8–200 mA ' +
      'AC/DC, zbytkový proud max 0,8 mA. Krytí IP67. Provozní teplota -25 až +70 °C. Shoda EN/IEC ' +
      '60947-5-2, UL/CSA/CCC certifikace. Dostupné příslušenství: rychloupínací montážní konzole ' +
      'EXG-12 s pevným dorazem.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb4,ac-dc,m12,mosaz,ip67,průmyslový',
  },
  {
    name: 'NBB5-18GM40-Z0-V1',
    packageType:
      'Válcové závitové pouzdro M18×1 (threaded barrel), mosaz s niklovým povlakem, délka 45 mm ' +
      '(40 mm závitové části), aktivní čelo PBT, indikační vícedírková ("Multihole") žlutá LED, ' +
      'zásuvný konektor M12×1, 4pinový (device connector, NE integrální kabel — na rozdíl od ' +
      'NBB3-V3-Z4/NBB4-12GM75-US v této knihovně), piny 1=BN(hnědý)/L+, 3=BU(modrý)/L-, 2,4 ' +
      'nezapojeny (2vodičové zapojení využívá jen piny 1 a 3)',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, klasický feritový typ, spínací vzdálenost ' +
      '5 mm (zápustná montáž), rozšířený teplotní rozsah -40 až +70 °C, 2vodičové DC zapojení, ' +
      'spínací (NO) kontakt, 5–60 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB5-18GM40-Z0-V1" (088201_eng.xml, vydáno 21. 5. 2012) — ' +
      '⚠️ třetí sourozenecký díl v rámci řady Pepperl+Fuchs NBB v této knihovně (spolu s ' +
      'NBB3-V3-Z4 a NBB4-12GM75-US, samostatné záznamy): stejný princip (klasický feritový ' +
      'senzor s korekčními faktory dle materiálu cíle — zde rAl=0,34, rCu=0,31, r304/nerez=0,72), ' +
      'ale jde o VĚTŠÍ senzor v M18×1 pouzdře (vs M12×1 u NBB4-12GM75-US) s vyšší jmenovitou ' +
      'spínací vzdáleností 5 mm (vs 4 mm u NBB4, 3 mm u NBB3), a hlavně MÁ ZÁSUVNÝ M12 KONEKTOR ' +
      'místo integrálního kabelu (NBB3-V3-Z4) nebo pevně připojeného kabelu (NBB4-12GM75-US) — ' +
      'vyžaduje samostatně objednaný konektorový kabel (např. příslušenství V1-G-2M-PUR/ ' +
      'V1-W-2M-PUR) nebo pole-montovatelný konektor V1-G/V1-W. Elektricky nejbližší NBB3-V3-Z4 ' +
      '(oba čistě DC, 5–60 V), ale s pulzní (pulsing) zkratovou ochranou (na rozdíl od NBB3-V3-Z4 ' +
      'bez zkratové ochrany a NBB4-12GM75-US se standardní zkratovou ochranou). "Extended ' +
      'temperature range" -40 až +70 °C. Zajištěná spínací vzdálenost 0–4,05 mm (-25 až 70°C) ' +
      'nebo 0–3,8 mm (-40 až -25°C, užší rozsah za extrémně nízkých teplot). Spínací kmitočet ' +
      '0–500 Hz. Hystereze 1–10 % (typ. 5 %). Provozní proud 2–100 mA, min. provozní proud 2 mA, ' +
      'zbytkový proud typ. 0–0,5 mA. Úbytek napětí max 5 V. Funkční bezpečnostní parametry: ' +
      'MTTFd 1870 let, doba mise 20 let, diagnostické pokrytí 0 %. Krytí IP67. Shoda EN/IEC ' +
      '60947-5-2, UL/CSA/CCC certifikace. Dostupné příslušenství: montážní příruba BF 18, ' +
      'rychloupínací konzole EXG-18.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb5,m18,mosaz,konektor,ip67,průmyslový',
  },
  {
    name: 'NBB8-18GM50-E2',
    packageType:
      'Válcové závitové pouzdro M18×1 (threaded barrel), mosaz s niklovým povlakem, délka 47 mm ' +
      '(24 mm závitové části), aktivní čelo PBT, indikační žlutá LED, integrální kabel PVC 2 m ' +
      '(Ø4,8 mm, 3 žíly 0,34 mm²: BN=L+, BK=výstup, BU=L-)',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, klasický feritový typ ("Basic series"), ' +
      'spínací vzdálenost 8 mm (zápustná montáž, "increased operating distance"), 3vodičové DC ' +
      'zapojení, PNP výstup, spínací (NO) kontakt, 10–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB8-18GM50-E2" (085499_eng.xml, vydáno 5. 8. 2019) — ⚠️ ' +
      'čtvrtý sourozenecký díl v rámci řady Pepperl+Fuchs NBB v této knihovně (spolu s ' +
      'NBB3-V3-Z4, NBB4-12GM75-US, NBB5-18GM40-Z0-V1, samostatné záznamy) a PRVNÍ s klasickým ' +
      '3vodičovým PNP výstupem (samostatný napájecí pár + spínaný výstupní pin), zatímco ' +
      'předchozí tři jsou 2vodičové (zátěž v sérii se senzorem, sdílené napájecí/signálové ' +
      'vodiče) — NBB8-18GM50-E2 tedy vyžaduje standardní PLC vstupní zapojení (jako indukční ' +
      'senzory TURCK v této knihovně), ne sériové zapojení zátěže. Stejné M18×1 pouzdro jako ' +
      'NBB5-18GM40-Z0-V1 (samostatný záznam), ale s VYŠŠÍ jmenovitou spínací vzdáleností 8 mm ' +
      '(vs 5 mm) — dle výrobce označeno jako "increased operating distance" varianta téhož ' +
      'mechanického formátu ("Basic series" — bez rozšířeného teplotního rozsahu na rozdíl od ' +
      'NBB5-18GM40-Z0-V1, zde standardní -25 až +70°C). Korekční faktory dle materiálu cíle: ' +
      'rAl=0,45, rCu=0,4, r304/nerez=0,7. Zajištěná spínací vzdálenost 0–6,48 mm. Spínací ' +
      'kmitočet 0–500 Hz. Hystereze typ. 5 %. Ochrana proti přepólování a pulzní zkratová ' +
      'ochrana. Úbytek napětí max 3 V. Provozní proud 0–200 mA, klidový proud max 15 mA, ' +
      'zbytkový proud typ. 0,5 mA (0,1 µA @25°C — velmi nízký v ustáleném stavu). Zpoždění ' +
      'dostupnosti po zapnutí max 20 ms. Funkční bezpečnostní parametry: MTTFd 1190 let, doba ' +
      'mise 20 let, diagnostické pokrytí 0 %. Krytí IP67. Shoda EN/IEC 60947-5-2, UL/CSA ' +
      'certifikace (CCC nevyžadováno pro produkty ≤36V). Dostupné příslušenství: montážní ' +
      'příruba BF 18, rychloupínací konzole EXG-18 (shodné s NBB5-18GM40-Z0-V1).',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb8,pnp,3vodičový,m18,mosaz,ip67,průmyslový',
  },
  {
    name: 'NBB1-4GM22-E0',
    packageType:
      'Miniaturní válcové závitové pouzdro M4×0,5 (nejmenší v řadě NBB v této knihovně), ' +
      'nerezová ocel 1.4305/AISI 303 (na rozdíl od poniklované mosazi u ostatních sourozenců), ' +
      'délka 22 mm (16,5 mm závitové části), aktivní čelo polykarbonát (PC), indikační žlutá ' +
      'LED, integrální tenký kabel PUR 2 m (0,055 mm² — výrazně tenčí žíly než ostatní NBB v ' +
      'této knihovně kvůli miniaturnímu průměru)',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, miniaturní provedení, zapustitelný ' +
      '("embeddable") — celá aktivní plocha může být zapuštěna do kovu bez ovlivnění parametrů, ' +
      'spínací vzdálenost 1 mm, 3vodičové DC zapojení, NPN výstup, spínací (NO) kontakt, ' +
      '10–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB1-4GM22-E0" (206384_eng.xml, vydáno 9.–10. 2. 2012) — ' +
      '⚠️ nejmenší sourozenecký díl v rámci řady Pepperl+Fuchs NBB v této knihovně (spolu s ' +
      'NBB3-V3-Z4, NBB4-12GM75-US, NBB5-18GM40-Z0-V1, NBB8-18GM50-E2, samostatné záznamy) — ' +
      'miniaturní závit M4×0,5 (vs M12/M18 u ostatních), pouzdro z NEREZOVÉ OCELI (vs poniklovaná ' +
      'mosaz u NBB4/NBB5/NBB8), a instalace typu "embeddable" (zapustitelný — na rozdíl od ' +
      '"flush" u ostatních; u skutečně zapustitelného senzoru zůstává spínací vzdálenost ' +
      'nezměněna i při zapuštění celé aktivní plochy do okolního kovu, což je přísnější ' +
      'konstrukční požadavek než běžná zápustná montáž). Elektricky nejbližší NBB8-18GM50-E2 ' +
      '(oba 3vodičové DC s klasickým výstupním tranzistorem), ale s NPN výstupem (na rozdíl od ' +
      'PNP u NBB8-18GM50-E2) — ⚠️ nutno rozlišovat polaritu výstupu při návrhu vstupního obvodu ' +
      'PLC/řídicí elektroniky. Korekční faktory dle materiálu cíle: rAl=0,4, rCu=0,29, r304/ ' +
      'nerez=0,76, rBrass/mosaz=0,46. Jmenovitá spínací vzdálenost sn 1 mm, zajištěná spínací ' +
      'vzdálenost 0–0,81 mm. Spínací kmitočet 0–700 Hz (nejvyšší v rodině díky miniaturním ' +
      'rozměrům). Hystereze typ. 5 %. Ochrana proti přepólování a pulzní zkratová ochrana. ' +
      'Úbytek napětí max 3 V. Provozní proud 0–100 mA, klidový proud max 10 mA, zbytkový proud ' +
      'typ. 0,1 mA @25°C. Krytí IP67. Provozní teplota -25 až +70 °C. Shoda EN/IEC 60947-5-2, ' +
      'UL/CSA certifikace (CCC nevyžadováno pro produkty ≤36V). Dostupné příslušenství: montážní ' +
      'příruba BF 4.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb1,npn,miniaturní,m4,nerez,ip67,průmyslový',
  },
  {
    name: 'NBB2-8GM25-E0-V3',
    packageType:
      'Válcové závitové pouzdro M8×1 (threaded barrel), mosaz s niklovým povlakem, délka 40 mm ' +
      '(25 mm závitové části), aktivní čelo LCP, indikační vícedírková žlutá LED, zásuvný ' +
      'konektor M8×1, 3pinový (device connector, NE integrální kabel), piny 1=BN(hnědý)/L+, ' +
      '4=BK(černý)/výstup, 3=BU(modrý)/L-, v balení 2 šestihranné matice',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, spínací vzdálenost 2 mm (zápustná montáž, ' +
      '"increased operating distance" pro M8), rozšířený teplotní rozsah -40 až +85 °C, ' +
      '3vodičové DC zapojení, NPN výstup, spínací (NO) kontakt, 5–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB2-8GM25-E0-V3" (304615-0029_eng.xml, vydáno 8.–9. 1. ' +
      '2018) — ⚠️ další sourozenecký díl v rámci řady Pepperl+Fuchs NBB v této knihovně, v ' +
      'menším M8×1 pouzdru (mezi miniaturním M4 u NBB1-4GM22-E0 a M12 u NBB4-12GM75-US, ' +
      'samostatné záznamy). Elektricky nejbližší NBB8-18GM50-E2/NBB1-4GM22-E0 (3vodičové DC s ' +
      'klasickým výstupním tranzistorem), zde NPN výstup (shodně s NBB1-4GM22-E0, opačně vůči ' +
      'PNP u NBB8-18GM50-E2). Má ZÁSUVNÝ M8 konektor (jako NBB5-18GM40-Z0-V1 s M12 konektorem) — ' +
      'vyžaduje samostatně objednaný konektorový kabel (příslušenství V3-WM-2M-PUR) nebo pole- ' +
      'montovatelný konektor V3-GM/V3-WM. Korekční faktory dle materiálu cíle: rAl=0,4, rCu=0,3, ' +
      'r304/nerez=0,75, rBrass/mosaz=0,45. Referenční akční prvek pro test dosahu: měkká ocel ' +
      '(1.0037/SR235JR, dříve St37-2), 8×8×1 mm. Jmenovitá spínací vzdálenost sn 2 mm, zajištěná ' +
      'spínací vzdálenost 0–1,62 mm. Spínací kmitočet až 6000 Hz (nejvyšší z celé rodiny NBB v ' +
      'této knihovně, díky malému rozměru a nízké indukčnosti cívky). Hystereze typ. 5 %. Úbytek ' +
      'napětí max 1,5 V (nejnižší v rodině). Provozní proud 0–100 mA, klidový proud max 10 mA, ' +
      'zbytkový proud max 0,2 mA. Zpoždění dostupnosti po zapnutí max 100 ms. Funkční ' +
      'bezpečnostní parametry: MTTFd 960 let, doba mise 20 let, diagnostické pokrytí 0 %. ' +
      'Rozšířený provozní/skladovací teplotní rozsah -40 až +85 °C (shodně s NBB5-18GM40-Z0-V1 ' +
      'variantou pro nízké teploty, ale zde navíc s vyšší horní mezí +85°C). Krytí IP67. UL ' +
      'certifikace (Class 2 Power Source). Dostupné příslušenství: montážní příruba BF 8, ' +
      'rychloupínací konzole EXG-08.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb2,npn,3vodičový,m8,konektor,ip67,průmyslový',
  },
  {
    name: 'NBB2-8GM25-E2-V3',
    packageType:
      'Válcové závitové pouzdro M8×1 (threaded barrel), mosaz s niklovým povlakem, délka 40 mm ' +
      '(25 mm závitové části), aktivní čelo LCP, indikační vícedírková žlutá LED, zásuvný ' +
      'konektor M8×1, 3pinový, piny 1=BN(hnědý)/L+, 4=BK(černý)/výstup, 3=BU(modrý)/L-, v balení ' +
      '2 šestihranné matice',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, spínací vzdálenost 2 mm (zápustná montáž), ' +
      'rozšířený teplotní rozsah -40 až +85 °C, 3vodičové DC zapojení, PNP výstup, spínací (NO) ' +
      'kontakt, 5–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB2-8GM25-E2-V3" (304615-0031_eng.xml, vydáno 8.–9. 1. ' +
      '2018) — ⚠️ elektrický komplement NBB2-8GM25-E0-V3 v této knihovně (samostatný záznam): ' +
      'zcela identické mechanické provedení, rozměry, konektor a všechny parametry (přesnost, ' +
      'teplotní rozsah, korekční faktory rAl=0,4/rCu=0,3/r304=0,75/rBrass=0,45, spínací kmitočet ' +
      'až 6000 Hz atd.), LIŠÍ SE POUZE v polaritě výstupního tranzistoru — zde PNP (výstupní pin ' +
      'spíná kladné napětí na zátěž), zatímco NBB2-8GM25-E0-V3 má NPN (výstupní pin spíná zátěž ' +
      'k zápornému pólu) — typický "sourozenecký pár" v katalozích indukčních senzorů, kde ' +
      'výrobce nabízí stejný fyzický senzor v obou výstupních polaritách pro kompatibilitu s ' +
      'různými vstupními obvody PLC. Viz záznam NBB2-8GM25-E0-V3 pro plný popis společných ' +
      'parametrů. Dostupné příslušenství: montážní příruba BF 8, konektorové kabely V3-GM/V3-WM/ ' +
      'V3-WM-2M-PUR, rychloupínací konzole EXG-08 (shodné s NBB2-8GM25-E0-V3).',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb2,pnp,3vodičový,m8,konektor,ip67,průmyslový',
  },
  {
    name: 'NBB2-8GM40-E2-V1',
    packageType:
      'Válcové závitové pouzdro M8×1 (snímací závitová část), stupňovité tělo prodloužené na ' +
      'zadní straně na větší M12×1 konektorovou objímku, mosaz s niklovým povlakem, celková ' +
      'délka 65 mm (delší než NBB2-8GM25-E0-V3/E2-V3 kvůli většímu konektoru), hmotnost 20 g, ' +
      'aktivní čelo LCP, indikační vícedírková žlutá LED, zásuvný konektor M12×1, 4pinový, piny ' +
      '1=BN(hnědý)/L+, 4=BK(černý)/výstup, 3=BU(modrý)/L-, 2=WH(bílý) nezapojen, v balení 2 ' +
      'šestihranné matice',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, spínací vzdálenost 2 mm (zápustná montáž), ' +
      'rozšířený teplotní rozsah -40 až +85 °C, 3vodičové DC zapojení, PNP výstup, spínací (NO) ' +
      'kontakt, 5–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB2-8GM40-E2-V1" (304615-0058_eng.xml, vydáno 8.–9. 1. ' +
      '2018) — ⚠️ elektricky IDENTICKÝ s NBB2-8GM25-E2-V3 v této knihovně (samostatný záznam) — ' +
      'stejná spínací vzdálenost, korekční faktory (rAl=0,4/rCu=0,3/r304=0,75/rBrass=0,45), ' +
      'spínací kmitočet 6000 Hz, teplotní rozsah i PNP výstup — LIŠÍ SE POUZE délkou a typem ' +
      'konektoru: "GM40" (namísto "GM25") značí delší tělo (65 mm vs 40 mm) kvůli VĚTŠÍMU 4pinovému ' +
      'M12 konektoru (namísto 3pinového M8 konektoru u "V3" varianty — kód "V1" v označení dílu ' +
      'odpovídá konektorové rodině M12, "V3" rodině M8), přičemž samotné snímací závitové ' +
      'M8-závitové čelo zůstává stejné jako u NBB2-8GM25 dvojice. M12 konektor umožňuje použití ' +
      'standardizovaných průmyslových M12 kabelů/konektorů (příslušenství V1-G/V1-W/V1-G-2M-PUR/ ' +
      'V1-W-2M-PUR) — stejná konektorová rodina jako u NBB5-18GM40-Z0-V1 v této knihovně. Viz ' +
      'záznam NBB2-8GM25-E2-V3 pro plný popis společných elektrických parametrů. Dostupné ' +
      'příslušenství: montážní příruba BF 8, rychloupínací konzole EXG-08.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb2,pnp,m8,m12,konektor,ip67,průmyslový',
  },
  {
    name: 'NBB2-8GM50-E0',
    packageType:
      'Válcové závitové pouzdro M8×1 (threaded barrel), mosaz s niklovým povlakem, délka 50 mm, ' +
      'aktivní čelo LCP, indikační žlutá LED, integrální kabel PVC 2 m (Ø3,5 mm, 3 žíly 0,14 mm²: ' +
      'BN=L+, BK=výstup, BU=L-) — na rozdíl od konektorových variant NBB2-8GM25/40 v této ' +
      'knihovně, v balení 2 šestihranné matice',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, spínací vzdálenost 2 mm (zápustná montáž), ' +
      'rozšířený teplotní rozsah -40 až +85 °C, 3vodičové DC zapojení, NPN výstup, spínací (NO) ' +
      'kontakt, 5–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB2-8GM50-E0" (304615-0066_eng.xml, vydáno 3. 7. 2019) — ' +
      '⚠️ další varianta v rámci skupiny "NBB2-8GM" v této knihovně (spolu s NBB2-8GM25-E0-V3, ' +
      'NBB2-8GM25-E2-V3, NBB2-8GM40-E2-V1, samostatné záznamy) — elektricky nejbližší ' +
      'NBB2-8GM25-E0-V3 (oba NPN, shodné parametry), ale s INTEGRÁLNÍM KABELEM (bez "V" kódu v ' +
      'označení = bez konektoru) namísto zásuvného M8 konektoru, což vysvětluje i delší tělo ' +
      '(50 mm vs 40 mm — o délku navíc potřebnou pro vývod kabelu místo konektorové objímky). ' +
      '⚠️ Drobný datový rozdíl oproti NBB2-8GM25-E0-V3/E2-V3/NBB2-8GM40-E2-V1: korekční faktor ' +
      'rBrass (mosaz) je zde 0,5, zatímco u ostatních tří sourozenců v této knihovně je uveden ' +
      'jako 0,45 — může jít o revizní zpřesnění datasheetu (tento dokument vydán 2019-07-03, ' +
      'ostatní tři 2018-01-09) nebo o skutečně odlišnou charakteristiku dané konstrukční varianty, ' +
      'nelze bez dalšího zdroje rozhodnout — nejistota uvedena explicitně. Ostatní korekční ' +
      'faktory shodné (rAl=0,4, rCu=0,3, r304/nerez=0,75). Zajištěná spínací vzdálenost 0–1,62 ' +
      'mm. Spínací kmitočet až 6000 Hz. Hystereze typ. 5 %. Úbytek napětí max 1,5 V. Provozní ' +
      'proud 0–100 mA, klidový proud max 10 mA, zbytkový proud max 0,2 mA. Zpoždění dostupnosti ' +
      'po zapnutí max 100 ms. Funkční bezpečnostní parametry: MTTFd 960 let, doba mise 20 let, ' +
      'diagnostické pokrytí 0 %. Krytí IP67. UL certifikace (Class 2 Power Source). Dostupné ' +
      'příslušenství: montážní příruba BF 8, rychloupínací konzole EXG-08 (shodné s ostatními ' +
      'NBB2-8GM variantami).',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb2,npn,kabel,m8,ip67,průmyslový',
  },
  {
    name: 'NBB2-8GM50-E2-5M',
    packageType:
      'Válcové závitové pouzdro M8×1 (threaded barrel), mosaz s niklovým povlakem, délka 50 mm, ' +
      'aktivní čelo LCP, indikační žlutá LED, integrální kabel PVC 5 m (Ø3,5 mm, 3 žíly ' +
      '0,14 mm²: BN=L+, BK=výstup, BU=L-), v balení 2 šestihranné matice',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, spínací vzdálenost 2 mm (zápustná montáž), ' +
      'rozšířený teplotní rozsah -40 až +85 °C, 3vodičové DC zapojení, PNP výstup, spínací (NO) ' +
      'kontakt, 5–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB2-8GM50-E2-5M" (304615-0070_eng.xml, vydáno 3. 7. ' +
      '2019) — ⚠️ dvojí sourozenecký vztah v rámci skupiny "NBB2-8GM" v této knihovně: (1) ' +
      'elektrický komplement NBB2-8GM50-E0 (samostatný záznam) — mechanicky IDENTICKÝ díl (50 mm ' +
      'tělo, integrální kabel, stejné korekční faktory rAl=0,4/rCu=0,3/r304=0,75/rBrass=0,5), ' +
      'liší se pouze výstupní polaritou (zde PNP vs NPN u NBB2-8GM50-E0); (2) kabelová obdoba ' +
      'NBB2-8GM25-E2-V3/NBB2-8GM40-E2-V1 (stejné PNP, jinak konektorové provedení) — přípona ' +
      '"-5M" v označení dílu značí délku integrálního kabelu 5 metrů (namísto standardních 2 m u ' +
      'NBB2-8GM50-E0), pro aplikace vyžadující delší kabelové vedení bez nutnosti prodlužovacího ' +
      'konektorového kabelu. Zajištěná spínací vzdálenost 0–1,62 mm. Spínací kmitočet až 6000 Hz. ' +
      'Hystereze typ. 5 %. Úbytek napětí max 1,5 V. Provozní proud 0–100 mA, klidový proud max ' +
      '10 mA, zbytkový proud max 0,2 mA. Zpoždění dostupnosti po zapnutí max 100 ms. Funkční ' +
      'bezpečnostní parametry: MTTFd 960 let, doba mise 20 let, diagnostické pokrytí 0 %. Krytí ' +
      'IP67. UL certifikace (Class 2 Power Source). Dostupné příslušenství: montážní příruba ' +
      'BF 8, rychloupínací konzole EXG-08.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb2,pnp,kabel,5m,m8,ip67,průmyslový',
  },
  {
    name: 'NBB2-8GS35-E2-V1',
    packageType:
      'Válcové závitové pouzdro M8×1 (snímací závitová část), stupňovité tělo prodloužené na ' +
      'zadní straně na M12×1 konektorovou objímku, NEREZOVÁ OCEL 1.4305/AISI 303 (na rozdíl od ' +
      'poniklované mosazi u "GM" variant v této knihovně), celková délka 60 mm, hmotnost 19 g, ' +
      'aktivní čelo LCP, indikační vícedírková žlutá LED, zásuvný konektor M12×1, 4pinový, piny ' +
      '1=BN(hnědý)/L+, 4=BK(černý)/výstup, 3=BU(modrý)/L-, 2=WH(bílý) nezapojen',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, NEREZOVÁ provedení, spínací vzdálenost 2 mm ' +
      '(zápustná montáž), rozšířený teplotní rozsah -40 až +85 °C, 3vodičové DC zapojení, PNP ' +
      'výstup, spínací (NO) kontakt, 5–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB2-8GS35-E2-V1" (304615-0083_eng.xml, vydáno 8.–9. 1. ' +
      '2018) — ⚠️ nerezová ("GS" = stainless steel) obdoba mosazné ("GM") skupiny NBB2-8GM v této ' +
      'knihovně (NBB2-8GM25-E0-V3/E2-V3, NBB2-8GM40-E2-V1, NBB2-8GM50-E0/E2-5M, samostatné ' +
      'záznamy) — mechanicky velmi podobná NBB2-8GM40-E2-V1 (stejný stupňovitý tvar s M8 ' +
      'snímacím závitem a M12 konektorem, podobná délka 60mm vs 65mm), ale s pouzdrem z ' +
      'NEREZOVÉ OCELI místo poniklované mosazi — nerez je odolnější vůči korozi a chemikáliím ' +
      '(vhodné pro potravinářský, farmaceutický nebo chemický průmysl), ale MÁ VÝRAZNĚ NIŽŠÍ ' +
      'korekční faktory (rAl=0,2, rCu=0,1, r304/nerez=0,55, rBrass=0,25 — všechny cca poloviční ' +
      'oproti "GM" mosazným variantám s rAl=0,4/rCu=0,3/r304=0,75/rBrass=0,45) — nerezové pouzdro ' +
      'samo o sobě částečně tlumí magnetické pole senzoru, což snižuje efektivní dosah pro ' +
      'neželezné kovy citelněji než u mosazného pouzdra. Jmenovitá spínací vzdálenost, zajištěná ' +
      'spínací vzdálenost (0–1,62 mm), spínací kmitočet (6000 Hz), hystereze (typ. 5 %) a ' +
      'ostatní elektrické parametry shodné s NBB2-8GM40-E2-V1 — viz tam pro plný popis. UL ' +
      'certifikace (Class 2 Power Source). Dostupné příslušenství: montážní příruba BF 8, ' +
      'konektorové kabely V1-G/V1-W/V1-G-2M-PUR/V1-W-2M-PUR, rychloupínací konzole EXG-08.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb2,pnp,nerez,m8,m12,konektor,ip67,průmyslový',
  },
  {
    name: 'NBB2-8GS40-E2-5M-PUR',
    packageType:
      'Válcové závitové pouzdro M8×1 (threaded barrel), NEREZOVÁ OCEL 1.4305/AISI 303, délka ' +
      '40 mm, aktivní čelo LCP, indikační žlutá LED, integrální kabel PUR 5 m (Ø3,3 mm, 3 žíly ' +
      '0,14 mm²: BN=L+, BK=výstup, BU=L-), v balení 2 šestihranné matice',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, NEREZOVÉ provedení, spínací vzdálenost 2 mm ' +
      '(zápustná montáž), rozšířený teplotní rozsah -40 až +85 °C, 3vodičové DC zapojení, PNP ' +
      'výstup, spínací (NO) kontakt, 5–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB2-8GS40-E2-5M-PUR" (304615-0091_eng.xml, vydáno 5. 8. ' +
      '2019) — ⚠️ kabelová (integrální PUR kabel 5 m) obdoba konektorového NBB2-8GS35-E2-V1 v ' +
      'této knihovně (samostatný záznam) — shodné nerezové pouzdro a korekční faktory (rAl=0,2, ' +
      'rCu=0,1, r304/nerez=0,55, rBrass=0,25), shodná elektrika (PNP, 2mm, 5–30V DC, 6000 Hz), ' +
      'ale bez konektoru — kratší tělo (40 mm vs 60 mm u konektorové verze, protože chybí M12 ' +
      'konektorová objímka) s přímo vyvedeným kabelem PUR (odolnější vůči olejům/chemikáliím než ' +
      'PVC) namísto zásuvného M12 konektoru. Zároveň nerezová obdoba mosazného NBB2-8GM50-E2-5M v ' +
      'této knihovně (oba PNP s integrálním 5m kabelem) — liší se materiálem pouzdra (nerez vs ' +
      'mosaz) a tím i korekčními faktory (viz NBB2-8GS35-E2-V1 pro srovnání s "GM" mosaznou ' +
      'skupinou). Zajištěná spínací vzdálenost 0–1,62 mm. Hystereze typ. 5 %. Úbytek napětí max ' +
      '1,5 V. Provozní proud 0–100 mA, klidový proud max 10 mA, zbytkový proud max 0,2 mA. ' +
      'Zpoždění dostupnosti po zapnutí max 100 ms. Funkční bezpečnostní parametry: MTTFd 960 ' +
      'let, doba mise 20 let, diagnostické pokrytí 0 %. Krytí IP67. UL certifikace (Class 2 ' +
      'Power Source). Dostupné příslušenství: montážní příruba BF 8, rychloupínací konzole ' +
      'EXG-08.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb2,pnp,nerez,kabel,5m,pur,m8,ip67,průmyslový',
  },
  {
    name: 'NBB2-12GM60-A2',
    packageType:
      'Válcové závitové pouzdro M12×1 (threaded barrel), mosaz s niklovým povlakem, délka 60 mm, ' +
      'aktivní čelo PBT, indikační žlutá LED, integrální kabel PVC 2 m (0,14 mm², 4 žíly: ' +
      'BN=L+, BK=NO výstup, WH=NC výstup, BU=L-), v balení 2 pojistné matice',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, zapustitelný ("embeddable"), spínací ' +
      'vzdálenost 2 mm, 4vodičové DC zapojení, KOMPLEMENTÁRNÍ PNP výstup (současně NO i NC), ' +
      '10–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB2-12GM60-A2" (083762_eng.xml, vydáno 2011/2012) — ⚠️ ' +
      'jiné pouzdro (M12 místo M8) a JINÝ typ instalace než skupina "NBB2-8GM/GS" v této knihovně ' +
      '(NBB2-8GM25-E0-V3/E2-V3, NBB2-8GM40-E2-V1, NBB2-8GM50-E0/E2-5M, NBB2-8GS35-E2-V1, ' +
      'NBB2-8GS40-E2-5M-PUR, samostatné záznamy) — přestože číslo "2" v označení v obou případech ' +
      'značí jmenovitou spínací vzdálenost 2 mm, "NBB2-12" je zapustitelný ("embeddable" — jako ' +
      'NBB1-4GM22-E0, na rozdíl od zápustného/"flush" NBB2-8) a má navíc KOMPLEMENTÁRNÍ PNP ' +
      'výstup (současně poskytuje NO i NC signál na oddělených vodičích BK/WH) — analogický ' +
      'princip jako komplementární NPN výstup u kapacitního senzoru TURCK BC10-Q14-VN4X2 v této ' +
      'knihovně, zde ovšem PNP a u indukčního senzoru. Korekční faktory dle materiálu cíle: ' +
      'rAl=0,25, rCu=0,15, r304/nerez=0,66. Zajištěná spínací vzdálenost 0–1,62 mm. Spínací ' +
      'kmitočet 0–1000 Hz. Hystereze typ. 5 %. Úbytek napětí max 3 V. Provozní proud 0–200 mA, ' +
      'klidový proud max 20 mA, zbytkový proud typ. 0,5 mA (0,1 µA @25°C). Funkční bezpečnostní ' +
      'parametry: MTTFd 3220 let (nejvyšší v celé rodině NBB v této knihovně), doba mise 20 let, ' +
      'diagnostické pokrytí 0 %. Krytí IP67. Provozní teplota -25 až +70 °C. Shoda EN/IEC ' +
      '60947-5-2, UL/CSA certifikace. Dostupné příslušenství: montážní příruba BF 12, ' +
      'rychloupínací konzole EXG-12 (shodné s NBB4-12GM75-US).',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb2,pnp,komplementární,m12,embeddable,ip67,průmyslový',
  },
  {
    name: 'NBB4-12GM30-E2-V3',
    packageType:
      'Válcové závitové pouzdro M12×1 (snímací závitová část), stupňovité tělo zúžené na zadní ' +
      'straně na menší M8×1 konektorovou objímku (opačná kombinace než NBB2-8GM40-E2-V1 v této ' +
      'knihovně, kde je snímací závit M8 a konektor M12), mosaz s niklovým povlakem, celková ' +
      'délka 44 mm, hmotnost 30 g, aktivní čelo PBT, indikační vícedírková žlutá LED, zásuvný ' +
      'konektor M8×1, 3pinový, piny 1=BN(hnědý)/L+, 4=BK(černý)/výstup, 3=BU(modrý)/L-',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, spínací vzdálenost 4 mm (zápustná montáž, ' +
      '"increased operating distance" pro M12), 3vodičové DC zapojení, PNP výstup, spínací (NO) ' +
      'kontakt, 10–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB4-12GM30-E2-V3" (087737_eng.xml, vydáno 16. 6. 2016) — ' +
      '⚠️ POZOR na záměnu s dalšími M12 senzory řady NBB v této knihovně: na rozdíl od ' +
      'NBB4-12GM75-US (stejný snímací závit M12, ale 2vodičové UNIVERZÁLNÍ AC/DC 20–250V/20–300V ' +
      's integrálním kabelem, bez konektoru) je NBB4-12GM30-E2-V3 čistě DC (10–30 V), 3vodičové ' +
      'PNP se zásuvným M8 konektorem; na rozdíl od NBB2-12GM60-A2 (stejné M12 pouzdro, ale 2mm ' +
      'zapustitelný typ s komplementárním NO+NC výstupem) má NBB4-12GM30-E2-V3 vyšší spínací ' +
      'vzdálenost 4 mm, běžnou zápustnou ("flush") montáž a jednoduchý NO výstup. Korekční ' +
      'faktory dle materiálu cíle: rAl=0,45, rCu=0,35, r304/nerez=0,7. Zajištěná spínací ' +
      'vzdálenost 0–3,24 mm. Spínací kmitočet 0–500 Hz. Hystereze typ. 5 %. Ochrana proti ' +
      'přepólování a pulzní zkratová ochrana. Úbytek napětí max 3 V. Provozní proud 0–150 mA, ' +
      'klidový proud max 15 mA, zbytkový proud typ. 0,5 mA (0,1 µA @25°C). Zpoždění dostupnosti ' +
      'po zapnutí max 20 ms. Funkční bezpečnostní parametry: MTTFd 1770 let, doba mise 20 let, ' +
      'diagnostické pokrytí 0 %. Krytí IP67. Provozní teplota -25 až +70 °C. Shoda EN/IEC ' +
      '60947-5-2, EAC (TR CU 020/2011), UL/CSA certifikace. Dostupné příslušenství: montážní ' +
      'příruba BF 12, rychloupínací konzole EXG-12, konektorové kabely V3-GM/V3-WM/V3-WM-2M-PUR.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb4,pnp,m12,m8,konektor,ip67,průmyslový',
  },
  {
    name: 'NBB4-12GM35-A2-V1-M1',
    packageType:
      'Válcové závitové pouzdro M12×1 (threaded barrel), mosaz s niklovým povlakem, délka 51 mm ' +
      '(35 mm závitové části), hmotnost 15 g, aktivní čelo PBT, indikační žlutá LED, zásuvný ' +
      'konektor M12×1, 4pinový, piny 1=BN(hnědý)/L+, 4=BK(černý)/NO výstup, 3=BU(modrý)/L-, ' +
      '2=WH(bílý)/NC výstup, v balení 2 pojistné matice',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, AUTOMOTIVE provedení (E1-Type approval), ' +
      'spínací vzdálenost 4 mm (zápustná montáž), krytí IP68/IP69K (vyšší než běžné IP67), ' +
      '4vodičové DC zapojení, KOMPLEMENTÁRNÍ PNP výstup (současně NO i NC), 7–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB4-12GM35-A2-V1-M1" (293454-0077_eng.xml, vydáno 7. 3. ' +
      '2017) — ⚠️ AUTOMOTIVE varianta v rámci M12 skupiny NBB4/NBB2 v této knihovně ' +
      '(NBB4-12GM30-E2-V3, NBB4-12GM75-US, NBB2-12GM60-A2, samostatné záznamy) — jediná se ' +
      'schválením "E1-Type approval" (10R-04, homologace pro automobilový průmysl dle předpisu ' +
      'EHK OSN č. 10) a rozšířenou EMC odolností testovanou dle automotive standardů (ISO 7637-2 ' +
      '— rušení vedením v palubní síti, EN 61000-4-2 ESD 8/15kV, EN 61000-4-3 vyzařované pole ' +
      '36V/m, EN 61000-4-4 rychlé přechodové jevy 2kV, EN 61000-4-6 vysokofrekvenční rušení, EN ' +
      '55011 třída A). Zvýšené těsnění IP68/IP69K (odolnost vůči ponoření i vysokotlakému/ ' +
      'horkému mytí — typické pro automotive/venkovní aplikace), oproti běžnému IP67 u ostatních ' +
      'senzorů NBB v této knihovně. Elektricky nejbližší NBB2-12GM60-A2 (oba KOMPLEMENTÁRNÍ PNP ' +
      'výstup, 4vodičové), ale s vyšší spínací vzdáleností 4 mm (vs 2 mm) a rozšířeným teplotním ' +
      'rozsahem -40 až +85°C (vs -25 až +70°C). Korekční faktory dle materiálu cíle: rAl=0,4, ' +
      'rCu=0,3, r304/nerez=0,75, rBrass/mosaz=0,45. Referenční akční prvek: měkká ocel, 12×12×1 ' +
      'mm (větší než 8×8×1mm u "NBB2-8"/"NBB4-12GM30" skupiny, odpovídá větší spínací ' +
      'vzdálenosti). Zajištěná spínací vzdálenost 0–3,24 mm. Spínací kmitočet až 2200 Hz. ' +
      'Hystereze typ. 5 %. Úbytek napětí max 2 V. Provozní proud 0–200 mA, klidový proud max ' +
      '10 mA, zbytkový proud typ. 0,5 mA (4 µA @25°C). Zpoždění dostupnosti po zapnutí max 100 ' +
      'ms. Funkční bezpečnostní parametry: MTTFd 1723 let, doba mise 20 let, diagnostické ' +
      'pokrytí 0 %. UL certifikace (Class 2 Power Source). Dostupné příslušenství: montážní ' +
      'příruba BF 12, konektorové kabely V1-G/V1-W/V1-G-2M-PUR/V1-W-2M-PUR.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb4,pnp,komplementární,automotive,e1,ip68,ip69k,m12,průmyslový',
  },
  {
    name: 'NBB4-12GM50-E2-3G-3D',
    packageType:
      'Válcové závitové pouzdro M12×1 (threaded barrel), mosaz s niklovým povlakem, délka 50 mm, ' +
      'aktivní čelo PBT, indikační žlutá LED, integrální kabel PVC 2 m (Ø3,5 mm, 3 žíly ' +
      '0,14 mm²: BN=L+, BK=výstup, BU=L-)',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, ATEX certifikovaný pro výbušné prostředí ' +
      '(zóna 2 — plyny, zóna 22 — prach), spínací vzdálenost 4 mm (zápustná montáž), 3vodičové ' +
      'DC zapojení, PNP výstup, spínací (NO) kontakt, 10–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB4-12GM50-E2-3G-3D" (212060_eng.xml, vydáno 5. 8. 2019) ' +
      '— ⚠️ PRVNÍ ATEX certifikovaný senzor v rámci rodiny NBB v této knihovně — na rozdíl od ' +
      'automotive varianty NBB4-12GM35-A2-V1-M1 (E1-Type approval, ISO 7637-2/EMC pro palubní ' +
      'sítě vozidel) jde o certifikaci pro PROSTŘEDÍ S NEBEZPEČÍM VÝBUCHU: kategorie 3G (zóna 2 ' +
      '— občasný výskyt výbušné atmosféry plynů/par, ochrana "Ex nA IIC T6 Gc" dle EN 60079-0/ ' +
      'EN 60079-15, "ignition protection category n" — bezjiskrové provedení) a 3D (zóna 22 — ' +
      'občasný výskyt hořlavého prachu, ochrana "Ex tc IIIC T80°C Dc" dle EN 60079-0/EN 60079-31 ' +
      '— ochrana krytem). Certifikát PF 15CERT3754 X. ⚠️ ZVLÁŠTNÍ PODMÍNKY POUŽITÍ: max. ' +
      'přípustná okolní teplota závisí na zátěžovém proudu a napájecím napětí — @UBmax=30V/ ' +
      'IL=150mA max 45°C, @UBmax=30V/IL=100mA max 49°C (vyšší proudy/napětí nejsou v Ex prostředí ' +
      'přípustné, zkraty zátěže zakázány) — pro plné podmínky nutno konzultovat instrukční ' +
      'manuál výrobce, ne jen tento datasheet. Elektricky/mechanicky nejbližší NBB4-12GM30-E2-V3 ' +
      'v této knihovně (oba PNP, 3vodičové, M12 snímací pouzdro), ale s integrálním kabelem ' +
      'místo konektoru a nižším spínacím kmitočtem 1000 Hz (vs 500 Hz u GM30 — pozor, zde je ' +
      'VYŠŠÍ). Korekční faktory: rAl=0,45, rCu=0,35, r304/nerez=0,7. Zajištěná spínací vzdálenost ' +
      '0–3,24 mm. Hystereze typ. 5 %. Úbytek napětí max 3 V. Doba dostupnosti po zapnutí max ' +
      '5 ms (nejrychlejší v rodině NBB4-12 v této knihovně). Funkční bezpečnostní parametry: ' +
      'MTTFd 1820 let, doba mise 20 let, diagnostické pokrytí 0 %. Krytí IP67. Provozní teplota ' +
      '-25 až +70 °C (standardní, viz ovšem výše uvedené Ex-specifické teplotní omezení dle ' +
      'proudu/napětí). UL/CSA certifikace. Dostupné příslušenství: montážní příruba BF 12, ' +
      'rychloupínací konzole EXG-12.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb4,pnp,atex,ex,výbušné-prostředí,m12,ip67,průmyslový',
  },
  {
    name: 'NBB10-30GM50-E0',
    packageType:
      'Válcové závitové pouzdro M30×1,5 (threaded barrel — největší v rodině NBB v této ' +
      'knihovně), mosaz s niklovým povlakem, délka 50 mm, aktivní čelo PBT, indikační ' +
      'kruhová/všesměrová ("all direction") žlutá LED, integrální kabel PVC 2 m (0,34 mm², ' +
      '3 žíly: BN=L+, BK=výstup, BU=L-)',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, spínací vzdálenost 10 mm (zápustná montáž — ' +
      'nejvyšší v rodině NBB v této knihovně), 3vodičové DC zapojení, NPN výstup, spínací (NO) ' +
      'kontakt, 10–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB10-30GM50-E0" (083998_eng.xml, vydáno 5.–7. 2. 2018) — ' +
      'NEJVĚTŠÍ a NEJDÁLEDOSAHOVĚJŠÍ senzor v rámci rodiny Pepperl+Fuchs NBB v této knihovně ' +
      '(závit M30×1,5, oproti M4/M8/M12/M18 u ostatních sourozenců NBB1/NBB2/NBB4/NBB5/NBB8, ' +
      'samostatné záznamy) se jmenovitou spínací vzdáleností 10 mm (vs max 8 mm u NBB8-18GM50-E2) ' +
      '— "Basic series" (standardní provedení bez rozšířeného teplotního rozsahu, ATEX certifikace ' +
      'nebo automotive homologace, na rozdíl od specializovaných variant NBB4-12GM35-A2-V1-M1 a ' +
      'NBB4-12GM50-E2-3G-3D). Korekční faktory dle materiálu cíle: rAl=0,3, rCu=0,3 (shodné, na ' +
      'rozdíl od menších senzorů kde bývá rCu obvykle nižší než rAl), r304/nerez=0,8. Zajištěná ' +
      'spínací vzdálenost 0–8,1 mm. Spínací kmitočet jen 0–200 Hz (nejnižší v rodině — typický ' +
      'kompromis za větší dosah u velkých indukčních senzorů, delší doba náběhu magnetického ' +
      'pole ve větší cívce). Hystereze typ. 5 %. Úbytek napětí max 3 V. Provozní proud 0–200 mA, ' +
      'klidový proud max 20 mA, zbytkový proud max 10 µA (velmi nízký). Funkční bezpečnostní ' +
      'parametry: MTTFd 1374 let, doba mise 20 let, diagnostické pokrytí 0 %. Krytí IP67. ' +
      'Provozní teplota -25 až +70 °C. Shoda EN/IEC 60947-5-2, UL/CSA certifikace. Dostupné ' +
      'příslušenství: montážní příruba BF 30, rychloupínací konzole EXG-30.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb10,npn,m30,velký-dosah,ip67,průmyslový',
  },
  {
    name: 'NBB4-12GM30-E3',
    packageType:
      'Válcové závitové pouzdro M12×1 (threaded barrel), mosaz s niklovým povlakem, délka 30 mm, ' +
      'hmotnost 30 g, aktivní čelo PBT (Ø10,4 mm), indikační vícedírková žlutá LED, integrální ' +
      'kabel PVC 2 m (0,14 mm², 3 žíly: BN=L+, BK=výstup, BU=L-)',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, spínací vzdálenost 4 mm (zápustná montáž), ' +
      '3vodičové DC zapojení, PNP výstup, ROZPÍNACÍ (NC) kontakt, 10–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB4-12GM30-E3" (087742_eng.xml, vydáno 15. 1. 2015) — ⚠️ ' +
      'POZOR na záměnu s NBB4-12GM30-E2-V3 v této knihovně (samostatný záznam) — přes velmi ' +
      'podobné označení (liší se jen "-E3" vs "-E2-V3") jde o odlišný díl: NBB4-12GM30-E3 má ' +
      'ROZPÍNACÍ (NC) kontakt (přípona "E3"), zatímco NBB4-12GM30-E2-V3 má spínací (NO) kontakt ' +
      '(přípona "E2") — opačná spínací logika při stejném PNP výstupním tranzistoru; navíc ' +
      'NBB4-12GM30-E3 má integrální kabel PVC 2m místo zásuvného M8 konektoru (bez kódu "V3" v ' +
      'označení). Mechanicky shodné pouzdro M12 se stejnými korekčními faktory (rAl=0,45, ' +
      'rCu=0,35, r304/nerez=0,7). Zajištěná spínací vzdálenost 0–3,24 mm. Spínací kmitočet ' +
      '0–500 Hz. Hystereze typ. 5 %. Ochrana proti přepólování a pulzní zkratová ochrana. Úbytek ' +
      'napětí max 3 V. Provozní proud 0–150 mA, klidový proud max 15 mA, zbytkový proud typ. ' +
      '0,5 mA (0,1 µA @25°C). Zpoždění dostupnosti po zapnutí max 20 ms. Funkční bezpečnostní ' +
      'parametry: MTTFd 1770 let, doba mise 20 let, diagnostické pokrytí 0 %. Krytí IP67. ' +
      'Provozní teplota -25 až +70 °C. Shoda EN/IEC 60947-5-2, UL/CSA certifikace. Dostupné ' +
      'příslušenství: montážní příruba BF 12, rychloupínací konzole EXG-12.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb4,pnp,nc,m12,kabel,ip67,průmyslový',
  },
  {
    name: 'NBB10-30GM50-E2-C3-V1',
    packageType:
      'Válcové závitové pouzdro M30×1,5 (threaded barrel), mosaz s POVLAKEM PTFE (teflon — ' +
      'odolnost proti přilnutí svařovacích rozstřiků), délka 65 mm, aktivní čelo s KERAMICKÝM ' +
      'POVLAKEM (odolné proti oděru/rozstřiku při svařování), indikační LED (zelená=napájení, ' +
      'žlutá=spínací stav), zásuvný konektor M12×1, 4pinový, piny 1=BN(hnědý)/L+, 4=BK(černý)/ ' +
      'výstup, 3=BU(modrý)/L-, 2=WH(bílý) nezapojen',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, SPECIÁLNÍ PROVEDENÍ PRO SVAŘOVACÍ ROBOTY ' +
      '("Weld Immune") s vysokou odolností proti magnetickým polím (150 mT), spínací vzdálenost ' +
      '10 mm, 3vodičové DC zapojení, PNP výstup, spínací (NO) kontakt, 10–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB10-30GM50-E2-C3-V1" (910208_eng.xml, vydáno 5. 2. 2019) ' +
      '— ⚠️ specializovaná svařovací ("Weld Immune") varianta téhož M30 pouzdra jako ' +
      'NBB10-30GM50-E0 v této knihovně (samostatný záznam, standardní "Basic series") — určeno ' +
      'pro montáž přímo na ramena svařovacích robotů v blízkosti bodového/obloukového svařování, ' +
      'kde běžné indukční senzory selhávají kvůli silným magnetickým polím a přilnutí kovových ' +
      'rozstřiků. Klíčové rozdíly oproti NBB10-30GM50-E0: (1) pouzdro s POVLAKEM PTFE (teflon) ' +
      'zabraňujícím přilnutí svařovacích rozstřiků k tělu senzoru, (2) aktivní čelo s KERAMICKÝM ' +
      'POVLAKEM místo PBT plastu (odolnější proti tepelnému/mechanickému poškození), (3) ' +
      'specifikovaná odolnost vůči konstantnímu i střídavému magnetickému poli 150 mT (typické ' +
      'pro elektromagnetické rušení svařovacích proudů), (4) výrazně NIŽŠÍ spínací kmitočet jen ' +
      '0–10 Hz (vs 0–200 Hz u NBB10-30GM50-E0 — záměrně pomalejší/stabilnější odezva pro ' +
      'potlačení falešného spínání vlivem rušení), (5) PNP výstup (vs NPN u NBB10-30GM50-E0), ' +
      '(6) zásuvný M12 konektor místo integrálního kabelu. Dostupné i speciální TPE konektorové ' +
      'kabely odolné proti přilnutí svařovacích kapek (příslušenství V1-G-OR2M-POC/ ' +
      'V1-W-OR2M-POC), vedle standardních PUR kabelů (V1-G-2M-PUR/V1-W-2M-PUR). Korekční ' +
      'faktory dle materiálu cíle: rAl=0,3, rCu=0,2, r304/nerez=0,6. Zajištěná spínací vzdálenost ' +
      '0–8,1 mm. Hystereze typ. 5 %. Úbytek napětí max 3 V. Provozní proud 0–200 mA, klidový ' +
      'proud max 15 mA, zbytkový proud typ. 0,5 mA (0,1 µA @25°C). Funkční bezpečnostní ' +
      'parametry: MTTFd 1835 let, doba mise 20 let, diagnostické pokrytí 0 %. Krytí IP67. ' +
      'Provozní teplota -25 až +70 °C. UL/CSA certifikace. Dostupné příslušenství: montážní ' +
      'příruba BF 30, rychloupínací konzole EXG-30.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb10,pnp,svařovací,weld-immune,keramika,ptfe,m30,ip67,průmyslový',
  },
  {
    name: 'NBB20-L3M-A2-C3-V1',
    packageType:
      'Pravoúhlé kvádrové ("L3M" styl) pouzdro ze slitiny zinku GD-ZnAl4Cu1 s povrchovou úpravou ' +
      '(coated), rozměry 67×40×40 mm, pozinkovaná/potažená kovová montážní příruba se 4 otvory ' +
      'Ø5,5 mm, aktivní čelo z tvrzeného plastu (Duroplast/thermoset — vysoce odolné proti ' +
      'mechanickému a tepelnému poškození), "2-way" LED indikace (žlutá-zelená-žlutá, viditelná ' +
      'ze dvou stran pouzdra), zásuvný konektor M12×1, 4pinový, piny 1=BN(hnědý)/L+, 4=BK(černý)/ ' +
      'NO výstup, 3=BU(modrý)/L-, 2=WH(bílý)/NC výstup',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, SPECIÁLNÍ PROVEDENÍ PRO SVAŘOVACÍ ROBOTY ' +
      '("Weld Immune") s velmi vysokou odolností proti magnetickým polím (200 mT), spínací ' +
      'vzdálenost 20 mm (největší v této knihovně), 4vodičové DC zapojení, KOMPLEMENTÁRNÍ PNP ' +
      'výstup (současně NO i NC), 10–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB20-L3M-A2-C3-V1" (187558_eng.xml, vydáno 13. 11. 2018) ' +
      '— ⚠️ další svařovací ("Weld Immune") varianta v této knihovně vedle NBB10-30GM50-E2-C3-V1 ' +
      '(samostatný záznam), ale MECHANICKY ZCELA ODLIŠNÁ: namísto válcového závitového pouzdra ' +
      'jde o pravoúhlé kvádrové pouzdro ("L3M" styl) z lité zinkové slitiny (GD-ZnAl4Cu1) s ' +
      'montážní přírubou (4 otvory), typické pro montáž na svařovací kleště/přípravky, kde je ' +
      'potřeba pevná mechanická fixace. Nejvyšší jmenovitá spínací vzdálenost v celé rodině NBB ' +
      'v této knihovně (20 mm, dvojnásobek NBB10-30GM50 dvojice) a nejvyšší odolnost proti ' +
      'magnetickému poli (200 mT vs 150 mT u NBB10-30GM50-E2-C3-V1). Aktivní čelo z tvrzeného ' +
      'plastu Duroplast (reaktoplast/thermoset) místo keramiky — jiný přístup k odolnosti proti ' +
      'svařovacím rozstřikům, ale stejný účel. KOMPLEMENTÁRNÍ výstup (současně NO+NC na ' +
      'oddělených vodičích) — na rozdíl od NBB10-30GM50-E2-C3-V1 (jen NO). Extrémně nízký ' +
      'spínací kmitočet 0–5 Hz (ještě pomalejší než 10 Hz u NBB10-30GM50-E2-C3-V1 — maximální ' +
      'potlačení rušení pro nejnáročnější svařovací aplikace). Korekční faktory dle materiálu ' +
      'cíle: rAl=0,42, rCu=0,38, r304/nerez=0,75, rBrass/mosaz=0,49. Zajištěná spínací vzdálenost ' +
      '0–16,2 mm, skutečná spínací vzdálenost 18–22 mm. Hystereze typ. 5 %. Ochrana proti ' +
      'přepólování a pulzní zkratová ochrana. Úbytek napětí max 3 V. Provozní proud 0–200 mA, ' +
      'klidový proud max 20 mA, zbytkový proud max 0,5 mA. Zpoždění dostupnosti po zapnutí 80 ms. ' +
      'Funkční bezpečnostní parametry: MTTFd 1420 let, doba mise 20 let, diagnostické pokrytí ' +
      '0 %. Krytí IP67. Rozšířený provozní rozsah -25 až +85 °C (skladovací -40 až +85 °C — ' +
      'nejširší v rodině NBB v této knihovně vedle NBB4-12GM35-A2-V1-M1). UL certifikace.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb20,pnp,komplementární,svařovací,weld-immune,duroplast,m12,ip67,průmyslový',
  },
  {
    name: 'NBB20-U1-A2-T',
    packageType:
      'Pravoúhlé pouzdro "U1" (VariKont styl) s OTOČNOU OBOUSMĚRNOU snímací hlavou (lze natočit ' +
      'dle potřeby montáže), materiál PA/kov s epoxidovým práškovým nátěrem, plastová základna, ' +
      'rozměry 118×40×40 mm, hmotnost 225 g (nejtěžší v rodině NBB v této knihovně), 4 LED ' +
      'indikátory (2× žlutá, 2× zelená) pro viditelnost z libovolného úhlu (360°), připojení ' +
      'šroubovými svorkami (≤2,5 mm², utahovací moment pouzdra 1,8 Nm, svorek 1,0 Nm) — na ' +
      'rozdíl od kabelu/konektoru u ostatních senzorů NBB v této knihovně, montážní otvory pro ' +
      'M20×1,5 objímku',
    value:
      'Indukční (bezkontaktní) přibližovací spínač s otočnou hlavou, spínací vzdálenost 20 mm, ' +
      '4vodičové DC zapojení, krytí IP68/IP69K, rozšířený teplotní rozsah -25 až +100 °C ' +
      '(nejširší v rodině NBB v této knihovně), 10–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB20-U1-A2-T" (296370_eng.xml, vydáno 22. 3. 2017) — ⚠️ ' +
      'mechanicky zcela odlišné provedení oproti NBB20-L3M-A2-C3-V1 v této knihovně (obě mají ' +
      'shodnou spínací vzdálenost 20 mm, ale odlišný účel a konstrukci): NBB20-U1-A2-T má ' +
      'charakteristickou OTOČNOU ("bidirectional and rotatable") snímací hlavu VariKont řady ' +
      '"U1" umožňující dodatečné doladění orientace senzoru po montáži, PŘIPOJENÍ ŠROUBOVÝMI ' +
      'SVORKAMI (jediný senzor v rodině NBB v této knihovně bez kabelu/konektoru) a nejširší ' +
      'teplotní rozsah -25 až +100 °C (oproti max +85°C u ostatních senzorů NBB v této knihovně) ' +
      '— vhodné pro trvalou montáž v teplotně náročném prostředí (sušičky, pece, horké provozy), ' +
      'na rozdíl od NBB20-L3M-A2-C3-V1 určeného specificky pro odolnost proti magnetickým polím ' +
      'svařování. ⚠️ Datasheet v tomto stručném výřezu neuvádí explicitně spínací funkci ' +
      '(NO/NC/komplementární) — vzhledem k 4vodičovému zapojení shodnému s komplementárními ' +
      'senzory NBB2-12GM60-A2/NBB4-12GM35-A2-V1-M1/NBB20-L3M-A2-C3-V1 v této knihovně je ' +
      'pravděpodobné komplementární zapojení, ale nejistota uvedena explicitně, nepotvrzeno. ' +
      'Korekční faktory dle materiálu cíle: rAl=0,33, rCu=0,31, r304/nerez=0,74, rBrass/ ' +
      'mosaz=0,41. Zajištěná spínací vzdálenost 0–16,2 mm. Spínací kmitočet 0–440 Hz. Hystereze ' +
      'typ. 5 %. Ochrana proti přepólování a pulzní zkratová ochrana. Úbytek napětí max 2 V. ' +
      'Provozní proud 0–200 mA, klidový proud max 20 mA, zbytkový proud max 0,5 mA. Zpoždění ' +
      'dostupnosti po zapnutí 80 ms. Funkční bezpečnostní parametry: MTTFd 1230 let, doba mise ' +
      '20 let, diagnostické pokrytí 0 %. Krytí IP68/IP69K (shodné s NBB4-12GM35-A2-V1-M1 ' +
      'automotive variantou). Shoda EN/IEC 60947-5-2, EAC (TR CU 020/2011), UL certifikace. ' +
      'Dostupné příslušenství: zásuvky V1-M20-80 (M12/M20 plastová verze), modulární montážní ' +
      'konzole MHW 01, montážní pomůcka MH 04-2681F pro VariKont/+U1+/+U9* řady.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb20,otočná-hlava,varikont,šroubové-svorky,ip68,ip69k,průmyslový',
  },
  {
    name: 'NBN3-F31K-E8-K',
    packageType:
      'Kompaktní krabicové pouzdro pro přímou montáž na standardní pneumatické pohony ' +
      '("aktuátory", řada F31), rozměry cca 65×40×77,5 mm, plast PBT, DVA nezávislé indukční ' +
      'snímací kanály (I, II) uvnitř jednoho pouzdra, připojení systémové (senzory) i ventilové ' +
      '(elektromagnetický ventil) přes pružinové svorky ("cage tension spring terminals", ' +
      '1,5/2,5 mm² ohebný/pevný vodič), kabelové průchodky M20×1,5 (systémová strana) a M12×1,5 ' +
      '(ventilová strana), zaslepovací zátky proti vlhkosti/nečistotám na nepoužitých vstupech, ' +
      'LED indikace napájení + 2× spínacího stavu senzorů + stavu ventilu',
    value:
      'Kompaktní senzorová jednotka pro pneumatické pohony s integrovaným výstupem pro ovládání ' +
      'elektromagnetického ventilu — 2× indukční spínač (NO, PNP, fixní nastavení, sn=3mm) + ' +
      'ventilový budicí okruh (max 32V DC/240mA), 4vodičové DC zapojení, 10–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBN3-F31K-E8-K" (097638_eng.xml, vydáno 17. 7. 2019) — ⚠️ ' +
      'POZOR: jiná produktová řada než "NBB" senzory v této knihovně — "NBN" (ne "NBB") značí ' +
      'jinou konstrukční koncepci: NBN3-F31K-E8-K NENÍ samostatný válcový/kvádrový přibližovací ' +
      'senzor, ale KOMPLETNÍ KOMPAKTNÍ SENZOROVÁ JEDNOTKA pro přímou montáž na standardní ' +
      'pneumatické pohony (ventilové aktuátory) řady "F31", obsahující DVA nezávislé indukční ' +
      'snímací kanály (I, II — typicky pro koncové polohy otevřeno/zavřeno u kulových/klapkových ' +
      'ventilů) SOUČASNĚ S integrovaným výstupním okruhem pro přímé ovládání elektromagnetického ' +
      'ventilu (solenoid valve) — funguje tedy jako kombinovaná polohová zpětná vazba + ovládání ' +
      'pohonu v jednom pouzdře. "Fixed setting" — pevně nastavená spínací vzdálenost (bez ' +
      'možnosti doladění, na rozdíl od potenciometrem laditelných kapacitních senzorů TURCK BC10 ' +
      'v této knihovně), aktivována specializovanými "activator" cvočky/vačkami montovanými na ' +
      'hřídel pohonu (příslušenství BT65A/BT65X/BT65B/BT115A/BT115X/BT115B pro řadu F31). ' +
      'Senzorové kanály: 2× spínací (NO), PNP, sn 3 mm, korekční faktory rAl=0,5, rCu=0,4, ' +
      'r304/nerez=1,0, rSt37/měkká ocel=1,2 (⚠️ faktor >1 — u tohoto konkrétního aktivátorového ' +
      'uspořádání je efektivní dosah pro ocelový aktivátor VĚTŠÍ než jmenovitá hodnota, neobvyklé ' +
      'oproti běžným senzorům NBB v této knihovně, kde jsou všechny faktory ≤1). Zajištěná ' +
      'spínací vzdálenost 0–2,43 mm, skutečná 2,7–3,3 mm typ. Spínací kmitočet 0–500 Hz. ' +
      'Ventilový okruh: max. napětí 32 V DC, max. proud 240 mA, BEZ zkratové ochrany (⚠️ na ' +
      'rozdíl od senzorové části), s ochranou proti přepólování (při obráceném zapojení výstupu ' +
      'přestane fungovat indikační LED, ale ventil dostává více výkonu — zvláštní chování ' +
      'uvedené přímo výrobcem). Provozní teplota -25 až +70 °C. Krytí IP67. UL/CSA certifikace.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,ventilová-jednotka,pneumatický-pohon,solenoid,pepperl-fuchs,nbn3,f31,dvoukanálový,ip67,průmyslový',
  },
  {
    name: 'NEN6-8GM40-E2-PUR',
    packageType:
      'Válcové závitové pouzdro M8×1 (threaded barrel), mosaz s niklovým povlakem, délka 40 mm, ' +
      'hmotnost 33 g, aktivní čelo LCP (Ø6,4 mm), indikační žlutá LED, integrální kabel PUR 2 m ' +
      '(Ø3,3 mm, 3 žíly 0,14 mm²: BN=L+, BK=výstup, BU=L-), v balení 2 šestihranné matice',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, NEZÁPUSTNÝ ("non-flush") typ montáže, ' +
      'spínací vzdálenost 6 mm, rozšířený teplotní rozsah -40 až +85 °C, 3vodičové DC zapojení, ' +
      'PNP výstup, spínací (NO) kontakt, 5–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NEN6-8GM40-E2-PUR" (304615-0186_eng.xml, vydáno 5. 8. ' +
      '2019) — ⚠️ POZOR: jiná produktová řada "NEN" (ne "NBB" ani "NBN") v této knihovně — ' +
      'písmeno "E" v "NEN" signalizuje NEZÁPUSTNÝ ("non-flush") typ montáže, na rozdíl od ' +
      '"flush" (zápustných) senzorů řady NBB v této knihovně (např. NBB2-8GM25-E0-V3/E2-V3, ' +
      'stejné M8 pouzdro) — nezápustná montáž vyžaduje volný prostor kolem senzoru bez okolního ' +
      'kovu (senzor nesmí být zapuštěn do kovové desky), ale výměnou získává VYŠŠÍ spínací ' +
      'vzdálenost pro daný průměr závitu (zde 6 mm u M8×1, oproti max 2 mm u zápustných NBB2-8GM ' +
      'senzorů stejného závitu v této knihovně — cca 3× větší dosah). Referenční akční prvek: ' +
      'měkká ocel, 18×18×1 mm (větší než 8×8×1mm u zápustné NBB2-8GM skupiny, odpovídá širšímu ' +
      'elektromagnetickému poli nezápustné konstrukce). Korekční faktory dle materiálu cíle: ' +
      'rAl=0,5, rCu=0,45, r304/nerez=0,75, rBrass/mosaz=0,55. Zajištěná spínací vzdálenost ' +
      '0–4,86 mm. Spínací kmitočet až 1500 Hz. Hystereze typ. 5 %. Ochrana proti přepólování a ' +
      'pulzní zkratová ochrana. Úbytek napětí max 1,5 V. Provozní proud 0–100 mA, klidový proud ' +
      'max 10 mA, zbytkový proud max 0,2 mA. Zpoždění dostupnosti po zapnutí max 100 ms. Funkční ' +
      'bezpečnostní parametry: MTTFd 960 let, doba mise 20 let, diagnostické pokrytí 0 %. Krytí ' +
      'IP67. Rozšířený provozní rozsah -25 až +85 °C (skladovací -40 až +85 °C). UL certifikace ' +
      '(Class 2 Power Source). Dostupné příslušenství: montážní příruba BF 8.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nen6,pnp,nezápustný,non-flush,m8,ip67,průmyslový',
  },
  {
    name: 'NBB8-18GM50-A0-V1-M1',
    packageType:
      'Válcové závitové pouzdro M18×1 (snímací závitová část), stupňovité tělo zúžené na zadní ' +
      'straně na M12×1 konektorovou objímku, mosaz s niklovým povlakem, celková délka 65 mm, ' +
      'hmotnost 45 g, aktivní čelo PBT, indikační žlutá LED, zásuvný konektor M12×1, 4pinový, ' +
      'piny 1=BN(hnědý)/L+, 4=BK(černý)/NO výstup, 3=BU(modrý)/L-, 2=WH(bílý)/NC výstup, v ' +
      'balení 2 pojistné matice',
    value:
      'Indukční (bezkontaktní) přibližovací spínač, AUTOMOTIVE provedení (E1-Type approval), ' +
      'spínací vzdálenost 8 mm (zápustná montáž), krytí IP68/IP69K, 4vodičové DC zapojení, ' +
      'KOMPLEMENTÁRNÍ NPN výstup (současně NO i NC), 7–30 V DC',
    notes:
      'Pepperl+Fuchs "Inductive sensor NBB8-18GM50-A0-V1-M1" (293454-0030_eng.xml, vydáno 7. 3. ' +
      '2017) — ⚠️ M18 automotive protějšek NBB4-12GM35-A2-V1-M1 v této knihovně (samostatný ' +
      'záznam) — obě mají E1-Type approval (10R-04), rozšířenou EMC odolnost dle automotive ' +
      'standardů (ISO 7637-2, EN 61000-4-2/3/4/6, EN 55011 Class A), krytí IP68/IP69K a ' +
      'KOMPLEMENTÁRNÍ výstup na 4 vodičích, ale NBB8-18GM50-A0-V1-M1 má větší M18 snímací závit ' +
      '(vs M12), vyšší spínací vzdálenost 8 mm (vs 4 mm) a NPN výstup (vs PNP u ' +
      'NBB4-12GM35-A2-V1-M1). Zároveň mechanicky nejbližší standardnímu (neautomotive) ' +
      'NBB8-18GM50-E2 v této knihovně (shodný M18 snímací závit a stupňovité tělo s M12 ' +
      'konektorem, shodná spínací vzdálenost 8 mm), ale s KOMPLEMENTÁRNÍM NPN výstupem místo ' +
      'jednoduchého PNP NO, rozšířeným teplotním rozsahem -40 až +85°C (vs -25 až +70°C) a ' +
      'vyšším krytím IP68/IP69K (vs IP67) — cena za automotive kvalifikaci. Korekční faktory ' +
      'dle materiálu cíle: rAl=0,4, rCu=0,3, r304/nerez=0,7, rBrass/mosaz=0,45. Referenční akční ' +
      'prvek: měkká ocel, 24×24×1 mm. Zajištěná spínací vzdálenost 0–6,48 mm. Spínací kmitočet ' +
      'až 1600 Hz. Hystereze typ. 5 %. Úbytek napětí max 2 V. Provozní proud 0–200 mA, klidový ' +
      'proud max 10 mA, zbytkový proud typ. 0,5 mA (4 µA @25°C). Zpoždění dostupnosti po zapnutí ' +
      'max 100 ms. Funkční bezpečnostní parametry: MTTFd 1484 let, doba mise 20 let, ' +
      'diagnostické pokrytí 0 %. Shoda EN/IEC 60947-5-2, EN 12895:2015, UL certifikace (Class 2 ' +
      'Power Source). Dostupné příslušenství: montážní příruba BF 18, konektorové kabely V1-G/ ' +
      'V1-W/V1-G-2M-PUR/V1-W-2M-PUR.',
    tags: 'modul,senzor,indukční,přibližovací,proximity,feritový,pepperl-fuchs,nbb8,npn,komplementární,automotive,e1,ip68,ip69k,m18,průmyslový',
  },
  {
    name: 'GRSE18S-N2421V',
    packageType:
      'Sada 2 válcových závitových pouzder M18×1 (vysílač + přijímač), nerezová ocel V4A ' +
      '(1.4404, 316L), délka 55,9 mm, optika PMMA, zásuvný konektor M12×1, 4pinový (na obou ' +
      'jednotkách), 4× LED indikátor, dodávané upevňovací matice (4×), max. utahovací moment ' +
      '90 Nm',
    value:
      'Jednocestná závora (through-beam) fotoelektrický senzor, pár vysílač+přijímač, IR světlo ' +
      '850 nm, dosah 0–10 m (max 15 m), komplementární NPN výstup (přijímač), 10–30 V DC',
    notes:
      'SICK AG "GRSE18S-N2421V — GR18 Inox" (Online Data Sheet, díl. č. 1085766, 7. 12. 2017) — ' +
      '⚠️ jde o SADU DVOU samostatných jednotek (vysílač + přijímač) prodávanou pod jedním ' +
      'objednacím číslem — "S" (vysílač, samostatný díl 2091197 "GRS18S-D2421V") a "E" (přijímač, ' +
      'samostatný díl 2091200 "GRE18S-N2411V") — narozdíl od reflexního senzoru Honeywell ' +
      'HOA0709-011 v této knihovně (kde jsou emitor i detektor v JEDNOM společném pouzdře), tady ' +
      'jde o DVĚ FYZICKY ODDĚLENÉ jednotky umístěné proti sobě přes sledovanou dráhu — princip ' +
      '"through-beam" (jednocestná závora): paprsek musí projít od vysílače k přijímači bez ' +
      'překážky, objekt detekován přerušením paprsku — umožňuje výrazně delší dosah (až 15 m) ' +
      'než reflexní/difuzní senzory, ale vyžaduje instalaci a zapojení obou jednotek na ' +
      'protilehlých stranách sledované dráhy. Nerezové pouzdro V4A (potravinářský/chemický ' +
      'průmysl), IR LED zdroj (životnost 100 000 h @25°C), vlnová délka 850 nm, velikost ' +
      'světelné stopy Ø420 mm @10m. Bez možnosti seřízení citlivosti ("Adjustment: None"). ' +
      'Přijímač: výstup NPN, KOMPLEMENTÁRNÍ funkce (Q=spínací + NOT_Q=rozpínací současně na ' +
      'oddělených pinech), signálové napětí HIGH≈VS/LOW≤3V, max. výstupní proud 100 mA (50 mA ' +
      'při VS>24V nebo teplotě >49°C), doba odezvy <500 µs, spínací kmitočet ±1000 Hz. Test ' +
      'vstup na vysílači (BK pin) umožňuje vypnutí vysílače pro diagnostiku ("Test" = 0V vypne ' +
      'sender). Napájení 10–30 V DC, odběr max 30 mA. Ochrany: A (přepólování napájení), B ' +
      '(přepólování vstupů/výstupu), D (nadproudová/zkratová ochrana výstupů). Krytí IP67/IP68 ' +
      '(10m/24h dle EN 60529)/IP69K (dle ISO 20653) — vysoký stupeň krytí vhodný pro mytí pod ' +
      'tlakem. Certifikace ECOLAB (odolnost vůči čisticím prostředkům v potravinářství), UL. ' +
      'Provozní teplota -25 až +55 °C, skladovací -30 až +75 °C. Zařazeno do kategorie "Modul" ' +
      'jako kompletní osazený produkt s vlastní elektronikou/konektorem, obdobně jako fotoelektrické ' +
      'snímače SICK WTB250-2N1131/WTB250-2N1151 v této knihovně.',
    tags: 'modul,senzor,fotoelektrický,optický,through-beam,jednocestná-závora,sick,gr18-inox,nerez,m18,ip69k,průmyslový',
  },
  {
    name: 'LI-OS05A20-MIPI-110H',
    packageType:
      'Kompletní kamerový modul s objektivem, rozměry 40,5×22,0×24,4 mm, FPC 24pinový konektor, ' +
      'M12×0,5P závit objektivu, kovová (Steel) konstrukce, ohniskovost 2,8 mm, F/2,4, RoHS',

    value:
      'MIPI CSI-2 (2-lane) kamerový modul s barevným snímačem OmniVision OS05A20 (5 Mpx, ' +
      '2688×1944), zorný úhel 110°(H), SCCB (I2C-kompatibilní) řídicí rozhraní, napájení ' +
      'AVDD 2,8 V / DVDD 1,2 V / DOVDD 1,8 V',
    notes:
      'Leopard Imaging Inc. "LI-OS05A20-MIPI-110H Specification" (rev. 1.0, 12.12.2018) — ⚠️ NOVÁ ' +
      'TŘÍDA v této knihovně: první kompletní kamerový modul (image sensor module) s vlastním ' +
      'objektivem a MIPI CSI-2 sériovým video výstupem — dosud žádný podobný typ nebyl ' +
      'katalogizován (odlišné od bare optických/proximity senzorů jako LTR-706PS-01/LTR-329ALS-01 ' +
      'v kategorii IO, které nemají zobrazovací funkci ani objektiv). Zařazeno do kategorie ' +
      '"Modul" jako kompletní osazený produkt s vlastní deskou/FPC konektorem a namontovanou ' +
      'optikou, obdobně jako evaluační deska ROHM RPR-0521RS-EVK-001 nebo wearable modul Maxim ' +
      'MAXREFDES103# v této knihovně. Snímač OmniVision OS05A20: 1/2,7" formát, velikost pixelu ' +
      '2×2 µm, citlivost 13 000 e-/Lux-sec, dynamický rozsah 74 dB @16x gain, rolling shutter, ' +
      'max. S/N poměr 39 dB, max. přenosová rychlost obrazu 2688×1944 @60fps, výstup surová RGB ' +
      'data (RGB Raw). Objektiv: ohnisková vzdálenost 2,8 mm, clona F/2,4, zorný úhel 110°(H), TV ' +
      'distorze < -25 %, rozsah zaostření 20 cm–nekonečno, hlavní paprskový úhel (CRA) 11° ' +
      'lineárně, integrovaný IR cut filtr. Rozhraní: MIPI CSI-2 2-lane (diferenciální páry ' +
      'MCP/MCN hodiny + MDP0/MDN0, MDP1/MDN1 data), SCCB řídicí sběrnice (SDA/SCL, ' +
      'kompatibilní s I2C, max 400 kHz), vstupní hodinový kmitočet XCLK 6–27 MHz (doporučeno, ' +
      'absolutní rozsah snímače 6–64 MHz). Řídicí piny: XSHUTDOWN (reset/power down, aktivní ' +
      'nízký), PWDN (power down, aktivní nízký), STROBE (I/O, blesk/synchronizace), SID (výběr ' +
      'ID čipu). Spotřeba: aktivní režim 210 mW, standby 2 mA, XSHUTDOWN (vypnuto) 2 µA. Provozní ' +
      'teplota (do 90 fps) -30 až +85 °C (junction), stabilní obrazová teplota 0 až +60 °C. ' +
      'Absolutní max.: VDD-A 4,5 V, VDD-D 3 V, VDD-IO 4,5 V, ESD (HBM) 2000 V, skladovací teplota ' +
      '-40 až +125 °C. 24pinový FPC konektor (piny 1-SDA, 2-SCL, 3-DOVDD1.8V, 4-MCP, 5-MCN, ' +
      '6/9/12/24-DGND, 7-MDP0, 8-MDN0, 10-MDP1, 11-MDN1, 13-PWDN, 14-ATEST, 15-AGND, 16/23-NC, ' +
      '17-SID, 18-DVDD1.2V, 19-XCLK, 20-STROBE, 21-XSHUTDOWN, 22-AVDD2.8).',
    tags: 'modul,kamera,kamerový-modul,mipi,csi-2,os05a20,leopard-imaging,snímač-obrazu,sccb,objektiv',
  },
  {
    name: 'SME-8M-DS-24V-K-5,0-OE',
    packageType:
      'Tyčinkové pouzdro pro vsazení do drážky pneumatického válce shora ("insertable from ' +
      'above"), pouzdro PA + vysoce legovaná nerezová ocel, integrovaný kabel s volným koncem ' +
      '(open end), 3 vodiče, délka kabelu 5 m, plášť kabelu TPE-U(PUR), hmotnost 58,3 g',
    value:
      'Polohový snímač pístu pneumatického válce (proximity sensor), princip magnetický jazýčkový ' +
      'kontakt (reed), spínací funkce N/O (spínací), bipolární, 5–30 V AC/DC, max. spínací proud ' +
      '500 mA',
    notes:
      'Festo AG & Co. KG "Proximity sensor SME-8M-DS-24V-K-5,0-OE" (obj. č. 543863, datový list ' +
      '5.3.2021) — magnetický jazýčkový (reed) snímač polohy pístu pro pneumatické válce ' +
      '(snímání polohy skrz nemagnetickou stěnu válce pomocí magnetu na pístu) — zařazeno do ' +
      'kategorie "Modul" jako kompletní osazený produkt s vlastním kabelem/konektorem, obdobně ' +
      'jako indukční/kapacitní přibližovací spínače TURCK BI1/BC10/BC20 a Pepperl+Fuchs NBB/NBN/' +
      'NEN v této knihovně — ⚠️ POZOR: na rozdíl od těch (bezkontaktní, elektronické — indukční ' +
      'vířivé proudy nebo kapacitní pole) používá Festo SME-8M čistě MECHANICKÝ princip — ' +
      'magnetický JAZÝČKOVÝ KONTAKT (reed switch), tedy dva feromagnetické kontaktní jazýčky ' +
      'uzavřené ve skleněné trubičce, které se sepnou/rozepnou fyzickým přitažením vlivem ' +
      'vnějšího magnetického pole (od magnetu v pístu válce) — jde tedy o spínací kontakt ' +
      '(mechanický, bipolární, N/O), NE o polovodičový/elektronický spínací výstup. Zapojení: 3 ' +
      'vodiče (BN = +/~, BK = výstup přes zátěž RL, BU = -/~), bez ochrany proti zkratu a ' +
      'přepólování. Napájení AC/DC 5–30 V, min. spínací výkon AC 10 VA, max. spínací výkon DC ' +
      '10 W (2,4 W/2,4 VA při použití v montážních sadách s omezeným proudem 80 mA), úbytek ' +
      'napětí 1,875 V. Optická indikace sepnutí žlutou LED. Materiál bez mědi a PTFE, odolný ' +
      'proti oleji, RoHS. Kabel testován na ohybovou pevnost (5 milionů cyklů v kabelovém řetězu, ' +
      'poloměr ohybu 75 mm). Provozní teplota -40 až +70 °C (s pevnou instalací kabelu), -5 až ' +
      '+70 °C (s pohyblivou instalací kabelu). Krytí IP65/IP68. Certifikace: c UL us (Listed), CE ' +
      '(EU EMC), RCM.',
    tags: 'modul,senzor,proximity,poloha-pístu,reed,jazýčkový-kontakt,magnetický,festo,sme-8m,pneumatika',
  },
  {
    name: 'SMT-8M-A-PS-24V-E-0,3-M8D',
    packageType:
      'Tyčinkové pouzdro pro vsazení do T-drážky pneumatického válce shora, mosazné pouzdro ' +
      '(niklované) + PA výztuž + vysoce legovaná nerezová ocel, černá barva, konektor M8×1 ' +
      'A-kódovaný (EN 61076-2-104) na konci 0,3m kabelu (šedý plášť TPE-U/PUR), 3 vodiče, ' +
      'hmotnost 8,9 g',
    value:
      'Polohový snímač pístu pneumatického válce (proximity sensor), princip magnetorezistivní ' +
      '(bezkontaktní, polovodičový), PNP spínací výstup (N/O), 5–30 V DC, max. spínací kmitočet ' +
      '180 Hz, opakovatelnost 0,2 mm',
    notes:
      'Festo AG & Co. KG "Proximity sensor SMT-8M-A-PS-24V-E-0,3-M8D" (obj. č. 574334, datový ' +
      'list 5.3.2021) — polohový snímač pístu pneumatického válce, přímý sourozenec Festo ' +
      'SME-8M-DS-24V-K-5,0-OE v této knihovně (stejná aplikace — snímání polohy pístu skrz stěnu ' +
      'válce), ale zásadně odlišný snímací princip — ⚠️ SMT-8M je MAGNETOREZISTIVNÍ ' +
      '(bezkontaktní, polovodičový prvek měnící odpor v magnetickém poli, elektronicky ' +
      'zpracovaný na PNP spínací výstup), zatímco SME-8M je čistě MECHANICKÝ magnetický ' +
      'jazýčkový kontakt (reed switch) — SMT-8M má proto výrazně rychlejší a přesnější ' +
      'charakteristiky: zapínací doba ≤1,3 ms / vypínací ≤1,4 ms, max. spínací kmitočet 180 Hz ' +
      '(oproti mechanickému kontaktu SME-8M, který takové parametry v datasheetu vůbec neuvádí ' +
      'a je principiálně pomalejší/opotřebovatelnější), navíc má SMT-8M zkratovou i přepěťovou ' +
      'ochranu a ochranu proti přepólování na všech vývodech (SME-8M nemá žádnou z těchto ' +
      'ochran). Zařazeno do kategorie "Modul" jako kompletní osazený produkt s vlastním kabelem/ ' +
      'konektorem, stejně jako SME-8M a indukční/kapacitní přibližovací spínače TURCK/Pepperl+' +
      'Fuchs v této knihovně. Konstrukce pro zasunutí do T-drážky válce shora, max. utahovací ' +
      'moment 0,6 Nm, libovolná montážní poloha. Konektorový kabel testován na cyklickou ' +
      'ohybovou (5 milionů cyklů, poloměr 28 mm) i torzní odolnost (>300000 cyklů, ±270°/0,1 m) ' +
      'pro použití v energetických řetězech a robotických aplikacích. Dvojí LED indikace — žlutá ' +
      '(sepnutí) a oranžová (funkční rezerva). Provozní teplota -40 až +85 °C (pevná instalace), ' +
      '-20 až +85 °C (pohyblivá instalace kabelu). Krytí IP65/IP68/IP69K. Certifikace: c UL us ' +
      '(Listed), CE (EU EMC + RoHS), KC EMC, RCM. Odolný proti oleji, bez mědi/PTFE, bez ' +
      'halogenu, RoHS.',
    tags: 'modul,senzor,proximity,poloha-pístu,magnetorezistivní,pnp,festo,smt-8m,pneumatika,m8',
  },
  {
    name: 'SMT-8M-A-PS-24V-E-2,5-OE',
    packageType:
      'Tyčinkové pouzdro pro vsazení do T-drážky pneumatického válce shora, pouzdro PA výztuž + ' +
      'vysoce legovaná nerezová ocel (bez mosazi), černá barva, integrovaný kabel s volným ' +
      'koncem (open end), délka 2,5 m (šedý plášť TPE-U/PUR), 3 vodiče, hmotnost 29,1 g',
    value:
      'Polohový snímač pístu pneumatického válce (proximity sensor), princip magnetorezistivní ' +
      '(bezkontaktní, polovodičový), PNP spínací výstup (N/O), 5–30 V DC, max. spínací kmitočet ' +
      '180 Hz, opakovatelnost 0,2 mm',
    notes:
      'Festo AG & Co. KG "Proximity sensor SMT-8M-A-PS-24V-E-2,5-OE" (obj. č. 574335, datový ' +
      'list 5.3.2021) — elektricky/funkčně TOTOŽNÝ magnetorezistivní snímač polohy pístu jako ' +
      'SMT-8M-A-PS-24V-E-0,3-M8D (obj. č. 574334) v této knihovně — stejné parametry: PNP N/O ' +
      'výstup, zapínací ≤1,3 ms/vypínací ≤1,4 ms, max. 180 Hz, 5–30 V DC, IP65/68/69K, zkratová i ' +
      'přepěťová ochrana — ⚠️ liší se POUZE konstrukcí kabelového zakončení a materiálem pouzdra: ' +
      'zatímco 574334 má KRÁTKÝ kabel (0,3 m) zakončený zásuvným konektorem M8×1 A-kódovaným ' +
      '(pro připojení prodlužovacího kabelu) a pouzdro z NIKLOVANÉ MOSAZI + PA výztuž, tato ' +
      'varianta 574335 má DLOUHÝ kabel (2,5 m) s VOLNÝM KONCEM (open end, přímo pro připojení do ' +
      'svorkovnice/PLC) a pouzdro POUZE z PA výztuže + nerezové oceli (bez mosazné části) — proto ' +
      'i vyšší hmotnost (29,1 g vs 8,9 g, way delší kabel). Zařazeno do kategorie "Modul" jako ' +
      'kompletní osazený produkt s vlastním kabelem, stejně jako SME-8M-DS-24V-K-5,0-OE a ' +
      'SMT-8M-A-PS-24V-E-0,3-M8D v této knihovně. Konstrukce pro zasunutí do T-drážky válce ' +
      'shora, max. utahovací moment 0,6 Nm, libovolná montážní poloha. Kabel testován na ' +
      'cyklickou ohybovou (5 milionů cyklů, poloměr 28 mm) i torzní odolnost (>300000 cyklů, ' +
      '±270°/0,1 m) pro energetické řetězy/robotické aplikace. Dvojí LED indikace — žlutá ' +
      '(sepnutí) a oranžová (funkční rezerva). Provozní teplota -40 až +85 °C (pevná instalace), ' +
      '-20 až +85 °C (pohyblivá instalace kabelu). Certifikace: c UL us (Listed), CE (EU EMC + ' +
      'RoHS), KC EMC, RCM. Odolný proti oleji, bez mědi/PTFE, bez halogenu, RoHS.',
    tags: 'modul,senzor,proximity,poloha-pístu,magnetorezistivní,pnp,festo,smt-8m,pneumatika,open-end',
  },
  {
    name: 'SMT-8M-A-PS-24V-E-0,3-M12',
    packageType:
      'Tyčinkové pouzdro pro vsazení do T-drážky pneumatického válce shora, pouzdro niklovaná ' +
      'mosaz + PA výztuž + vysoce legovaná nerezová ocel, černá barva, konektor M12×1 A-kódovaný ' +
      '(EN 61076-2-101) na konci 0,3m kabelu (šedý plášť TPE-U/PUR), 3 vodiče, hmotnost 15,9 g',
    value:
      'Polohový snímač pístu pneumatického válce (proximity sensor), princip magnetorezistivní ' +
      '(bezkontaktní, polovodičový), PNP spínací výstup (N/O), 5–30 V DC, max. spínací kmitočet ' +
      '180 Hz, opakovatelnost 0,2 mm',
    notes:
      'Festo AG & Co. KG "Proximity sensor SMT-8M-A-PS-24V-E-0,3-M12" (obj. č. 574337, datový ' +
      'list 5.3.2021) — elektricky/funkčně TOTOŽNÝ magnetorezistivní snímač polohy pístu jako ' +
      'SMT-8M-A-PS-24V-E-0,3-M8D (obj. č. 574334) a SMT-8M-A-PS-24V-E-2,5-OE (obj. č. 574335) v ' +
      'této knihovně — stejné elektrické parametry: PNP N/O výstup, zapínací ≤1,3 ms/vypínací ' +
      '≤1,4 ms, max. 180 Hz, 5–30 V DC, IP65/68/69K, zkratová i přepěťová ochrana — ⚠️ liší se ' +
      'POUZE typem konektoru na konci krátkého 0,3m kabelu: zatímco 574334 má konektor M8×1 ' +
      'A-kódovaný (EN 61076-2-101), TATO varianta 574337 má o řád VĚTŠÍ konektor M12×1 ' +
      'A-kódovaný (EN 61076-2-101) — jiný objednací kód konektorového vzoru (00995573 vs 00991155 ' +
      'u M8D varianty) i mírně odlišná hmotnost (15,9 g vs 8,9 g, větší konektor). Narozdíl od ' +
      '574335 (dlouhý 2,5m kabel s volným koncem, pouzdro BEZ mosazi) má 574337 stejně jako ' +
      '574334 pouzdro Z NIKLOVANÉ MOSAZI + PA výztuž (mosazná část typická pro konektorové ' +
      'varianty s krátkým kabelem/plug). Zařazeno do kategorie "Modul" jako kompletní osazený ' +
      'produkt s vlastním kabelem/konektorem, stejně jako ostatní Festo SME-8M/SMT-8M snímače v ' +
      'této knihovně. Konstrukce pro zasunutí do T-drážky válce shora, max. utahovací moment ' +
      '0,6 Nm, libovolná montážní poloha. Kabel testován na cyklickou ohybovou (5 milionů cyklů, ' +
      'poloměr 28 mm) i torzní odolnost (>300000 cyklů, ±270°/0,1 m) pro energetické řetězy/' +
      'robotické aplikace. Dvojí LED indikace — žlutá (sepnutí) a oranžová (funkční rezerva). ' +
      'Provozní teplota -40 až +85 °C (pevná instalace), -20 až +85 °C (pohyblivá instalace ' +
      'kabelu). Certifikace: c UL us (Listed), CE (EU EMC + RoHS), KC EMC, RCM. Odolný proti ' +
      'oleji, bez mědi/PTFE, bez halogenu, RoHS.',
    tags: 'modul,senzor,proximity,poloha-pístu,magnetorezistivní,pnp,festo,smt-8m,pneumatika,m12',
  },
  {
    name: 'SMT-8M-A-ZS-24V-E-5,0-OE-EX2',
    packageType:
      'Tyčinkové pouzdro pro vsazení do T-drážky pneumatického válce shora, pouzdro PA výztuž + ' +
      'vysoce legovaná nerezová ocel (bez mosazi), černá barva, integrovaný kabel s volným ' +
      'koncem, délka 5 m (šedý plášť TPE-U/PUR), 2 vodiče, hmotnost 57,1 g',
    value:
      'ATEX certifikovaný polohový snímač pístu pneumatického válce (proximity sensor) pro ' +
      'výbušné prostředí, princip magnetorezistivní, bezkontaktní 2vodičový výstup (N/O), ' +
      '7–30 V DC, max. spínací kmitočet 180 Hz',
    notes:
      'Festo AG & Co. KG "Proximity sensor SMT-8M-A-ZS-24V-E-5,0-OE-EX2" (obj. č. 574341, ' +
      'datový list 5.3.2021) — ATEX (Ex) varianta magnetorezistivního snímače polohy pístu z ' +
      'řady Festo SMT-8M v této knihovně (SMT-8M-A-PS-24V-E-0,3-M8D/2,5-OE/0,3-M12) — ⚠️ oproti ' +
      'PS variantám (typový kód "-PS-", 3vodičové PNP zapojení s N/O tranzistorovým výstupem, ' +
      'BEZ certifikace do výbušného prostředí) má tato ZS varianta typový kód "-ZS-" a zásadně ' +
      'odlišné elektrické zapojení: BEZKONTAKTNÍ 2VODIČOVÝ výstup (jen BN/BU, bez odděleného ' +
      'napájecího a signálového vodiče — zátěž RL zapojena v sérii s napájecí smyčkou, typické ' +
      'pro jiskrově bezpečné/Ex aplikace kde se minimalizuje počet průchozích vodičů), vyšší ' +
      'napájecí rozsah (7–30 V DC oproti 5–30 V DC u PS variant kvůli úbytku napětí na zátěži), ' +
      'úbytek napětí na snímači až 6 V (výrazně vyšší než <1,5 V u PS variant — typické pro ' +
      '2vodičové zapojení), nižší max. výstupní proud (80 mA vs 100 mA) a rychlejší spínací časy ' +
      '(≤1 ms/≤1 ms vs ≤1,3/1,4 ms). ATEX certifikace: kategorie II 3G pro plyny (zóna 2, typ ' +
      'ochrany Ex nA IIC T4 X Gc) a II 3D pro prach (zóna 22, typ ochrany Ex tc IIIC T120°C X ' +
      'Dc), provozní teplota ve výbušném prostředí -40 až +70 °C. Zařazeno do kategorie "Modul" ' +
      'jako kompletní osazený produkt s vlastním kabelem, stejně jako ostatní Festo SME-8M/' +
      'SMT-8M snímače polohy pístu v této knihovně — obdobně jako u indukčního snímače Pepperl' +
      '+Fuchs NBB4-12GM50-E2-3G-3D (rovněž ATEX 3G/3D) jde o certifikovanou variantu pro použití ' +
      'v prostředí s nebezpečím výbuchu (např. chemický/farmaceutický/potravinářský průmysl s ' +
      'hořlavým prachem nebo plyny). Konstrukce pro zasunutí do T-drážky válce shora, max. ' +
      'utahovací moment 0,6 Nm, libovolná montážní poloha. Kabel testován na cyklickou ohybovou ' +
      '(5 milionů cyklů, poloměr 28 mm) i torzní odolnost (>300000 cyklů, ±270°/0,1 m). Dvojí LED ' +
      'indikace — žlutá (sepnutí) a oranžová (funkční rezerva). Krytí IP65/IP68/IP69K. ' +
      'Certifikace: c UL us (Listed), CE (EU EMC + ATEX + RoHS), KC EMC, RCM. Odolný proti oleji, ' +
      'bez mědi/PTFE, bez halogenu, RoHS.',
    tags: 'modul,senzor,proximity,poloha-pístu,magnetorezistivní,atex,ex,festo,smt-8m,pneumatika,výbušné-prostředí',
  },
  {
    name: 'SDBT-BSW-1L-PU-W-0.3-N-M12',
    packageType:
      'Tyčinkové pouzdro pro vsazení do T-drážky pneumatického válce shora, pouzdro epoxidová ' +
      'pryskyřice + PA výztuž + vysoce legovaná nerezová ocel, převlečná matice niklovaná mosaz, ' +
      'černá barva, konektor M12×1 A-kódovaný (pozlacené kontakty) na konci 0,3m kabelu ' +
      '(šedý plášť PVC, síťovaný ozářením, odolný proti svařovacím jiskrám), 3 vodiče, ' +
      'hmotnost 23,3 g',
    value:
      'Polohový snímač pístu pneumatického válce odolný proti svařovacímu poli (weld-field ' +
      'resistant), princip magnetorezistivní, PNP spínací výstup (N/O), 10–30 V DC, max. spínací ' +
      'kmitočet 25 Hz',
    notes:
      'Festo AG & Co. KG "Proximity sensor SDBT-BSW-1L-PU-W-0.3-N-M12" (obj. č. 2476855, datový ' +
      'list 5.3.2021) — magnetorezistivní snímač polohy pístu, stejný snímací princip jako ' +
      'Festo SMT-8M-xxx v této knihovně, ale zcela JINÁ produktová řada (typový kód "SDBT-BSW" ' +
      'místo "SMT") specificky konstruovaná pro provoz V BLÍZKOSTI SVAŘOVACÍCH PRACOVIŠŤ ' +
      '(analogicky ke svařovacímu provedení "Weld Immune" u indukčního snímače Pepperl+Fuchs ' +
      'NBB20-L3M-A2-C3-V1 v této knihovně, zde ale u magnetorezistivního snímače polohy pístu) ' +
      '— ⚠️ POZOR: má výrazně POMALEJŠÍ spínací charakteristiky než standardní SMT-8M-A-PS ' +
      'varianty (zapínací ≤15 ms/vypínací ≤25 ms, max. 25 Hz oproti ≤1,3/1,4 ms a 180 Hz u ' +
      'SMT-8M) — kompromis nutný kvůli odolnosti proti rušení svářecím polem: výstupní signál ' +
      'se během svařovacího procesu "zamrzne" (zachová poslední platný stav) místo chybného ' +
      'přepnutí. Necitlivost na magnetická pole: AC (50–60 Hz) < 200 mT, MFDC (1000 Hz) < 200 mT, ' +
      'konstrukčně necitlivý i na permanentní magnetická pole pod prahovou hodnotou Bon. Odolnost ' +
      'proti UV záření, oleji, svařovacím jiskrám (kabel síťovaný ozářením). Max. rychlost pohybu ' +
      'snímaného pístu 1 m/s. Zařazeno do kategorie "Modul" jako kompletní osazený produkt s ' +
      'vlastním kabelem/konektorem, stejně jako ostatní Festo SME-8M/SMT-8M snímače polohy pístu ' +
      'v této knihovně. Konstrukce pro zasunutí do T-drážky válce shora, max. utahovací moment ' +
      '0,6 Nm, libovolná montážní poloha. Dvojí LED indikace — žlutá (sepnutí) a oranžová ' +
      '(funkční rezerva). Provozní teplota -25 až +85 °C (pevná instalace), -5 až +80 °C ' +
      '(pohyblivá instalace kabelu). Krytí IP65/IP68. Certifikace: c UL us (Listed), CE (EU EMC), ' +
      'KC EMC, RCM. Bez mědi/PTFE, RoHS.',
    tags: 'modul,senzor,proximity,poloha-pístu,magnetorezistivní,svařování,weld-resistant,festo,sdbt-bsw,pneumatika,m12',
  },
  {
    name: 'SME-8-K5-LED-24',
    packageType:
      'Tyčinkové pouzdro pro upnutí do T-drážky podélně (bez šroubování), pouzdro epoxidová ' +
      'pryskyřice + PC + PET + vysoce legovaná nerezová ocel, integrovaný kabel s volným koncem, ' +
      'délka 5 m (plášť TPE-U/PUR), 3 vodiče, hmotnost 60 g',
    value:
      'Polohový snímač pístu pneumatického válce (proximity sensor), princip magnetický jazýčkový ' +
      'kontakt (reed), spínací funkce N/O (spínací), bipolární, 12–30 V AC/DC, max. spínací ' +
      'kmitočet 800 Hz',
    notes:
      'Festo AG & Co. KG "Proximity sensor SME-8-K5-LED-24" (obj. č. 175404, datový list ' +
      '5.3.2021) — magnetický jazýčkový (reed) snímač polohy pístu, stejná snímací technologie ' +
      'jako SME-8M-DS-24V-K-5,0-OE (obj. č. 543863) v této knihovně, ale jiná subvarianta ' +
      'označení typu ("K5" místo "DS", vyšší max. napětí 30V shodné, ale spodní hranice napájení ' +
      '12V místo 5V) a zejména jiný ZPŮSOB UCHYCENÍ do T-drážky — ⚠️ SME-8-K5 se do drážky ' +
      'UPÍNÁ PODÉLNĚ ("clamped in T slot, can be inserted in slot lengthwise", utahovací moment ' +
      'jen 0,2 Nm), zatímco SME-8M-DS se do drážky ŠROUBUJE SHORA ("screwed tightly, can be ' +
      'inserted in slot from above") — odlišný montážní systém, nejsou vzájemně zaměnitelné. ' +
      'Elektricky je SME-8-K5 VÝRAZNĚ RYCHLEJŠÍ než SME-8M-DS (zapínací ≤0,5 ms/vypínací jen ' +
      '0,03 ms, max. 800 Hz oproti nespecifikovaným — ale principiálně pomalejším — hodnotám ' +
      'DS varianty) a má lepší opakovatelnost polohy (±0,1 mm uvedeno explicitně). Shodně s ' +
      'DS variantou: bez zkratové a přepěťové ochrany, bez ochrany proti přepólování, žlutá LED ' +
      'indikace sepnutí, materiál bez mědi a PTFE, RoHS. Doplňkové parametry uvedené jen u této ' +
      'varianty: izolační napětí 50 V, odolnost proti rázovému přepětí 0,8 kV, stupeň znečištění ' +
      '3. Zařazeno do kategorie "Modul" jako kompletní osazený produkt s vlastním kabelem, stejně ' +
      'jako ostatní Festo SME-8M/SMT-8M/SDBT-BSW snímače polohy pístu v této knihovně. Provozní ' +
      'teplota -40 až +70 °C (pevná instalace), -5 až +70 °C (pohyblivá instalace kabelu). Krytí ' +
      'IP65/IP67. Certifikace: CE (EU EMC), RCM.',
    tags: 'modul,senzor,proximity,poloha-pístu,reed,jazýčkový-kontakt,magnetický,festo,sme-8-k5,pneumatika',
  },
  {
    name: 'SME-8-S-LED-24',
    packageType:
      'Tyčinkové pouzdro pro upnutí do T-drážky podélně (bez šroubování), pouzdro epoxidová ' +
      'pryskyřice + PC + PET + vysoce legovaná nerezová ocel, konektor M8×1 (pozlacené/niklované ' +
      'mosazné kontakty, 3piny) na konci 0,3m kabelu (plášť TPE-U/PUR), hmotnost 8 g',
    value:
      'Polohový snímač pístu pneumatického válce (proximity sensor), princip magnetický jazýčkový ' +
      'kontakt (reed), spínací funkce N/O (spínací), bipolární, 12–30 V AC/DC',
    notes:
      'Festo AG & Co. KG "Proximity sensor SME-8-S-LED-24" (obj. č. 150857, datový list ' +
      '5.3.2021) — elektricky TOTOŽNÝ magnetický jazýčkový (reed) snímač polohy pístu jako ' +
      'SME-8-K5-LED-24 (obj. č. 175404) v této knihovně — shodná mechanika upnutí (podélné ' +
      'zasunutí do T-drážky, utahovací moment 0,2 Nm), shodné elektrické parametry (reed N/O ' +
      'bipolární, 12–30 V AC/DC, 500 mA, zapínací 0,5 ms/vypínací 0,03 ms, opakovatelnost ' +
      '±0,1 mm, izolační napětí 50 V, rázové přepětí 0,8 kV, stupeň znečištění 3) — ⚠️ liší se ' +
      'POUZE typem kabelového zakončení: zatímco SME-8-K5-LED-24 má DLOUHÝ 5m kabel s volným ' +
      'koncem (open end, pro přímé zapojení do svorkovnice), tato varianta SME-8-S-LED-24 má ' +
      'KRÁTKÝ 0,3m kabel zakončený zásuvným konektorem M8×1 (pro připojení prodlužovacího ' +
      'kabelu) — proto i výrazně nižší hmotnost (8 g vs 60 g). Krytí u konektorové varianty ' +
      'pouze IP67 (bez IP65, na rozdíl od K5-LED-24 varianty s otevřeným kabelem, která má ' +
      'IP65/IP67). Zařazeno do kategorie "Modul" jako kompletní osazený produkt s vlastním ' +
      'kabelem/konektorem, stejně jako ostatní Festo SME-8M/SMT-8M/SDBT-BSW/SME-8 snímače polohy ' +
      'pístu v této knihovně. Žlutá LED indikace sepnutí. Materiál bez mědi a PTFE. Provozní ' +
      'teplota -40 až +70 °C (pevná instalace), -5 až +70 °C (pohyblivá instalace kabelu). ' +
      'Certifikace: CE (EU EMC), RCM.',
    tags: 'modul,senzor,proximity,poloha-pístu,reed,jazýčkový-kontakt,magnetický,festo,sme-8-s,pneumatika,m8',
  },
  {
    name: 'SMEO-8E-K-24-S6',
    packageType:
      'Kompaktní kvádrové pouzdro s příčným výstupem kabelu (pro upevnění pomocí příslušenství/ ' +
      'svorky, ne přímým zasunutím do T-drážky), pouzdro TPE-U(PU), integrovaný kabel s volným ' +
      'koncem, délka 2,5 m (plášť TPE-S), 2 vodiče, hmotnost 40 g',
    value:
      'Vysokoteplotní polohový snímač pístu pneumatického válce (proximity sensor), princip ' +
      'magnetický jazýčkový kontakt (reed), 2vodičové zapojení, N/O kontakt, 0–30 V AC/DC, ' +
      'provozní teplota -40 až +120 °C',
    notes:
      'Festo AG & Co. KG "Proximity sensor SMEO-8E-K-24-S6" (obj. č. 171158, datový list ' +
      '5.3.2021) — magnetický jazýčkový (reed) snímač polohy pístu, stejný snímací princip jako ' +
      'SME-8-K5-LED-24/SME-8-S-LED-24/SME-8M-DS-24V-K-5,0-OE v této knihovně, ale JINÁ produktová ' +
      'řada (typový kód "SMEO" místo "SME") — ⚠️ dvě zásadní odlišnosti: (1) VÝRAZNĚ ŠIRŠÍ ' +
      'provozní teplotní rozsah -40 až +120 °C (oproti max. +70/+85 °C u SME/SMT řad — vhodné ' +
      'pro válce v horkých provozech, např. v blízkosti pecí/lisů), umožněný pouzdrem z odolného ' +
      'TPE-U místo epoxidové pryskyřice+PC+PET; (2) JINÝ ZPŮSOB MONTÁŽE — "With accessories" ' +
      '(upevnění pomocí přídavného příslušenství/svorky), NE přímým zasunutím/šroubováním do ' +
      'T-drážky jako u SME/SMT/SDBT-BSW řad, a kabel vyveden PŘÍČNĚ (transverse) místo podélně/ ' +
      'longitudinálně. Elektricky jde stále o mechanický reed kontakt (Switching output ' +
      '"Contact-based"), ale se zapojením jen 2 vodiče (BN, BU — bez odděleného 3. signálového ' +
      'vodiče jako u SME-8/SME-8M řad), širší napěťový rozsah 0–30 V AC/DC ' +
      '(oproti 12–30 V u SME-8-K5/S), ochrana proti přepólování na všech vývodech (na rozdíl od ' +
      'SME-8 řady, která ji nemá). Zapínací čas ≤0,5 ms/vypínací 0,03 ms, max. spínací kmitočet ' +
      '500 Hz, opakovatelnost ±0,1 mm, izolační napětí 50 V, stupeň znečištění 3. Zařazeno do ' +
      'kategorie "Modul" jako kompletní osazený produkt s vlastním kabelem, stejně jako ostatní ' +
      'Festo SME/SMT/SDBT-BSW snímače polohy pístu v této knihovně. Krytí IP65/IP67, max. ' +
      'utahovací moment upevňovacího příslušenství 0,5 Nm. Bez mědi a PTFE.',
    tags: 'modul,senzor,proximity,poloha-pístu,reed,jazýčkový-kontakt,magnetický,festo,smeo-8e,pneumatika,vysokoteplotní',
  },
  {
    name: 'SMEO-8E-M12-LED-24',
    packageType:
      'Kompaktní kvádrové pouzdro s integrovaným zásuvným konektorem M12×1 A-kódovaným ' +
      '(EN 61076-2-101, mosazné kontakty, 3piny) přímo na těle senzoru, BEZ vlastního kabelu, ' +
      'pouzdro tvářená hliníková slitina + TPE-U(PU) + vysoce legovaná nerezová ocel, montáž ' +
      'příslušenstvím, příčný výstup konektoru, hmotnost 9 g',
    value:
      'Polohový snímač pístu pneumatického válce (proximity sensor), princip magnetický ' +
      'jazýčkový kontakt (reed), bipolární N/O kontakt, 12–30 V AC/DC, max. spínací kmitočet ' +
      '800 Hz',
    notes:
      'Festo AG & Co. KG "Proximity sensor SMEO-8E-M12-LED-24" (obj. č. 171164, datový list ' +
      '5.3.2021) — magnetický jazýčkový (reed) snímač polohy pístu ze stejné produktové řady ' +
      'SMEO jako SMEO-8E-K-24-S6 (obj. č. 171158) v této knihovně (stejný způsob montáže ' +
      '"With accessories" — příslušenstvím, ne přímo do T-drážky, a stejná orientace výstupu ' +
      '"Transverse" — příčná) — ⚠️ zásadní rozdíl: SMEO-8E-M12-LED-24 NEMÁ integrovaný kabel, má ' +
      'místo něj PŘÍMO NA TĚLE senzoru našroubovaný zásuvný konektor M12×1 (typ "Plug", ' +
      'připojovací kabel se dokupuje samostatně) — zatímco SMEO-8E-K-24-S6 má napevno ' +
      'integrovaný 2,5m kabel s volným koncem. Další odlišnosti: M12-LED-24 má užší provozní ' +
      'teplotní rozsah (-40 až +60 °C oproti -40 až +120 °C u K-24-S6 — kovové hliníkové pouzdro ' +
      'zde neposkytuje takovou teplotní odolnost jako čistě TPE-U pouzdro K-24-S6 varianty), ' +
      '3vodičové zapojení s odděleným signálovým vodičem BK (oproti 2vodičovému u K-24-S6), užší ' +
      'napájecí rozsah 12–30 V (oproti 0–30 V), ale VYŠŠÍ max. spínací kmitočet (800 Hz oproti ' +
      '500 Hz) a BEZ ochrany proti přepólování (na rozdíl od K-24-S6, která ji má). Žlutá LED ' +
      'indikace sepnutí. Zařazeno do kategorie "Modul" jako kompletní osazený produkt s ' +
      'integrovaným konektorem, stejně jako ostatní Festo SME/SMT/SDBT-BSW/SMEO snímače polohy ' +
      'pístu v této knihovně. Krytí IP65/IP67, rázové přepětí 0,8 kV, stupeň znečištění 3, max. ' +
      'utahovací moment upevňovacího příslušenství 0,5 Nm. Bez mědi a PTFE, RoHS. Certifikace: ' +
      'CE (EU EMC), RCM.',
    tags: 'modul,senzor,proximity,poloha-pístu,reed,jazýčkový-kontakt,magnetický,festo,smeo-8e,pneumatika,m12,konektor',
  },
  {
    name: 'SMEO-8E-M12-LED-230',
    packageType:
      'Kompaktní kvádrové pouzdro s integrovaným zásuvným konektorem M12×1 A-kódovaným ' +
      '(EN 61076-2-101, 3piny) přímo na těle senzoru, BEZ vlastního kabelu, pouzdro tvářená ' +
      'hliníková slitina + TPE-U(PU) + vysoce legovaná nerezová ocel, montáž příslušenstvím, ' +
      'podélný výstup konektoru, hmotnost 9 g',
    value:
      'Univerzální (síťové) polohový snímač pístu pneumatického válce (proximity sensor), princip ' +
      'magnetický jazýčkový kontakt (reed), bipolární N/O kontakt, široký rozsah 3–230 V AC / ' +
      '3–250 V DC',
    notes:
      'Festo AG & Co. KG "Proximity sensor SMEO-8E-M12-LED-230" (obj. č. 171160, datový list ' +
      '5.3.2021) — magnetický jazýčkový (reed) snímač polohy pístu ze stejné produktové řady a ' +
      'stejného konstrukčního provedení (hliníkové pouzdro s integrovaným M12 konektorem, montáž ' +
      'příslušenstvím) jako SMEO-8E-M12-LED-24 (obj. č. 171164) v této knihovně — ⚠️ zásadní ' +
      'rozdíl je v napájecím rozsahu: zatímco "-24" varianta pracuje jen v úzkém pásmu 12–30 V ' +
      '(nízké napětí, DC/průmyslová automatizace), tato "-230" varianta pokrývá ŠIROKÝ UNIVERZÁLNÍ ' +
      'rozsah 3–230 V AC / 3–250 V DC — umožňuje přímé spínání síťového napětí 230 V AC bez ' +
      'meziobvodu, CE certifikace navíc dle směrnice o nízkém napětí (Low Voltage Directive), ' +
      'vyšší odolnost proti rázovému přepětí (4 kV oproti 0,8 kV u "-24" varianty). Za cenu tohoto ' +
      'širšího rozsahu má nižší max. výstupní proud (120 mA oproti 500 mA), pomalejší zapínací ' +
      'čas (≤2 ms oproti ≤0,5 ms) a nižší max. spínací kmitočet (500 Hz oproti 800 Hz), vyšší ' +
      'úbytek napětí (3,9 V oproti nespecifikovanému nízkému úbytku u "-24"), užší teplotní rozsah ' +
      '(-20 až +60 °C oproti -40 až +60 °C) a orientaci konektoru PODÉLNOU místo příčné. Datasheet ' +
      'uvádí u tohoto typu poznámku "Without LED function" u řádku spínacího výstupu, přesto je ' +
      'níže samostatně uvedena žlutá LED indikace sepnutí — pravděpodobně jde o poznámku k ' +
      'variantám bez LED dostupným v rámci stejné produktové skupiny, tento konkrétní kus (LED-230) ' +
      'LED indikaci dle tabulky parametrů má. Zařazeno do kategorie "Modul" jako kompletní osazený ' +
      'produkt s integrovaným konektorem, stejně jako ostatní Festo SME/SMT/SDBT-BSW/SMEO snímače ' +
      'polohy pístu v této knihovně. Krytí IP65/IP67, stupeň znečištění 3, max. utahovací moment ' +
      'upevňovacího příslušenství 0,5 Nm. Bez mědi a PTFE. Certifikace: CE (EU EMC + Low Voltage), ' +
      'RCM.',
    tags: 'modul,senzor,proximity,poloha-pístu,reed,jazýčkový-kontakt,magnetický,festo,smeo-8e,pneumatika,m12,síťové-napětí',
  },
  {
    name: 'SMPO-8E',
    packageType:
      'Kompaktní kvádrové pouzdro s pneumatickou přípojkou M5, pouzdro eloxovaný hliník + PA + ' +
      'vysoce legovaná nerezová ocel, montáž průchozím otvorem/příslušenstvím se zasunutím do ' +
      'T-drážky shora, hmotnost 11 g',
    value:
      'Magneticky ovládaný PNEUMATICKÝ (nikoliv elektrický) polohový snímač pístu ve funkci ' +
      '3/2 ventilu, provozní tlak 2–8 bar, ATEX certifikace pro zóny 1/2/21/22',
    notes:
      'Festo AG & Co. KG "Proximity sensor SMPO-8E" (obj. č. 178563, datový list 5.3.2021) — ⚠️ ' +
      'ZÁSADNĚ jiný princip než ostatní snímače polohy pístu v této knihovně (SME-8/SME-8M/' +
      'SMT-8M/SDBT-BSW/SMEO-8E): SMPO-8E NEMÁ ŽÁDNÉ ELEKTRICKÉ PŘIPOJENÍ ani elektrický výstup ' +
      '— místo elektrického reed/magnetorezistivního snímače jde o čistě PNEUMATICKÝ prvek — ' +
      'magneticky ovládaný 3/2 ventil (Valve function "3/2", pneumatická přípojka M5), který ' +
      'magnet v pístu válce (stejný typ magnetu jako u elektrických snímačů SME/SMT řad) přímo ' +
      'PŘEPÍNÁ TLAKOVÝ VZDUCH (bez elektroniky/elektřiny) — typické využití pro čistě pneumatické ' +
      'logické obvody nebo v prostředích, kde je elektrické jiskření nepřípustné i s Ex ' +
      'certifikací (zde ATEX zóny 1/2 pro plyny i 21/22 pro prach — ŠIRŠÍ pokrytí zón než ' +
      'elektrický Festo SMT-8M-A-ZS-24V-E-5,0-OE-EX2, který pokrývá jen zóny 2/22, protože ' +
      'čistě pneumatický prvek je z principu jiskrově bezpečný ve všech zónách). Vizuální ' +
      '(optická, ne LED elektrická) indikace přepnutí. Provozní médium: stlačený vzduch dle ISO ' +
      '8573-1:2010 [6:4:4], BEZ olejového mazání (nekompatibilní s mazaným vzduchem). Montáž ' +
      'průchozím otvorem s příslušenstvím, zasunutí do T-drážky shora. Zapínací doba 22 ms / ' +
      'vypínací 52 ms (výrazně pomalejší než elektrické reed/magnetorezistivní varianty — typické ' +
      'pro pneumatické přepínání). Opakovatelnost polohy ±0,2 mm. Provozní teplota -15 až +60 °C. ' +
      'Krytí IP65. Zařazeno do kategorie "Modul" jako kompletní osazený produkt pro montáž na ' +
      'pneumatický válec, stejně jako elektrické Festo SME/SMT/SDBT-BSW/SMEO snímače polohy ' +
      'pístu v této knihovně — i přes odlišný (čistě pneumatický) princip funkce jde o ' +
      'mechanicky/aplikačně identickou kategorii produktů (snímače polohy pístu pro T-drážku ' +
      'pneumatického válce).',
    tags: 'modul,senzor,proximity,poloha-pístu,pneumatický,ventil,magnetický,atex,festo,smpo-8e,pneumatika',
  },
  {
    name: 'SMTSO-8E-NS-M12-LED-24',
    packageType:
      'Kompaktní kvádrové pouzdro s integrovaným zásuvným konektorem M12×1 A-kódovaným ' +
      '(EN 61076-2-101, 3piny) přímo na těle senzoru, pouzdro tvářená hliníková slitina + PA + ' +
      'PUR + vysoce legovaná nerezová ocel, upnutí do T-drážky svorkou s příslušenstvím ' +
      '(zasunutí shora), příčný výstup konektoru, hmotnost 10 g',
    value:
      'Polohový snímač pístu pneumatického válce odolný proti svařovacímu poli, princip ' +
      'magnetoindukční, NPN spínací výstup (N/O), 10–30 V DC',
    notes:
      'Festo AG & Co. KG "Proximity sensor SMTSO-8E-NS-M12-LED-24" (obj. č. 175825, datový list ' +
      '5.3.2021) — ⚠️ NOVÁ produktová řada snímačů polohy pístu v této knihovně (typový kód ' +
      '"SMTSO", odlišný od SME/SME-8M/SMT-8M/SDBT-BSW/SMEO-8E/SMPO-8E) a NOVÝ snímací princip — ' +
      '"magneto-inductive" (magnetoindukční), odlišný jak od magnetického jazýčkového kontaktu ' +
      '(SME/SME-8M/SMEO-8E), tak od magnetorezistivního principu (SMT-8M/SDBT-BSW) — indukční ' +
      'cívka reaguje na změnu magnetického pole od pístního magnetu, výstup zpracován elektronicky ' +
      'na NPN tranzistorový spínací výstup (N/O). Podobně jako Festo SDBT-BSW-1L-PU-W-0.3-N-M12 v ' +
      'této knihovně je i SMTSO-8E-NS konstruován pro odolnost proti SVAŘOVACÍMU POLI (weld field ' +
      'resistant, odolný proti svařovacím jiskrám) a stejně pomalejší spínací charakteristiky ' +
      '(zapínací ≤38 ms/vypínací ≤20 ms — ještě pomalejší než SDBT-BSW s ≤15/25 ms) kvůli filtraci ' +
      'rušení od svářecího pole (udávaná konkrétní odolnost proti střídavému magnetickému poli ' +
      '45–65 Hz). Na rozdíl od SDBT-BSW (integrovaný kabel s M12 konektorem na konci) má ' +
      'SMTSO-8E-NS konektor M12 PŘÍMO NA TĚLE senzoru (bez kabelu, "Electrical connection type: ' +
      'Plug"). Zkratová ochrana pulzní (Pulsed), přepěťová ochrana k dispozici, ochrana proti ' +
      'přepólování na všech vývodech. Max. výstupní proud 200 mA, max. spínací výkon DC 6 W, ' +
      'zbytkový proud ≤0,01 mA, úbytek napětí ≤3 V. Žlutá LED indikace sepnutí. Zařazeno do ' +
      'kategorie "Modul" jako kompletní osazený produkt s integrovaným konektorem, stejně jako ' +
      'ostatní Festo snímače polohy pístu v této knihovně. Krytí IP65/IP67, opakovatelnost ' +
      '±0,2 mm, max. utahovací moment upevňovacího příslušenství 0,5 Nm. Provozní teplota -25 až ' +
      '+70 °C. Bez mědi a PTFE. Certifikace: CE (EU EMC), RCM.',
    tags: 'modul,senzor,proximity,poloha-pístu,magnetoindukční,svařování,weld-resistant,npn,festo,smtso-8e,pneumatika,m12',
  },
  {
    name: 'SMT-10G-PS-24V-E-2,5Q-OE',
    packageType:
      'Tyčinkové pouzdro pro upnutí do KRUHOVÉ drážky (round slot) podélným zasunutím, pouzdro ' +
      'PA výztuž, integrovaný kabel s volným koncem, délka 2,5 m (plášť TPE-U/PU), 3 vodiče, ' +
      'příčný výstup kabelu',
    value:
      'Polohový snímač pístu KULATÉHO pneumatického válce (proximity sensor), princip ' +
      'magnetorezistivní (bezkontaktní, polovodičový), PNP spínací výstup (N/O), 10–30 V DC',
    notes:
      'Festo AG & Co. KG "Proximity sensor SMT-10G-PS-24V-E-2,5Q-OE" (obj. č. 547862, datový ' +
      'list 5.4.2021) — magnetorezistivní snímač polohy pístu ze stejné "SMT" produktové řady ' +
      'jako SMT-8M-A-PS-24V-E-0,3-M8D/2,5-OE/0,3-M12 v této knihovně (typový kód "SMT", princip ' +
      'magnetorezistivní, PNP N/O výstup, zkratová i přepěťová ochrana, ochrana proti ' +
      'přepólování), ale s označením "10G" místo "8M" — ⚠️ určeno pro JINÝ TYP VÁLCE: SMT-8M je ' +
      'konstruován pro upnutí do PROFILOVÉ T-drážky (typické pro kompaktní/profilové pneumatické ' +
      'válce), zatímco SMT-10G se upíná do KRUHOVÉ drážky ("Clamped in round slot" — typické pro ' +
      'kulaté/kruhové pneumatické válce dle ISO 6432 s obvodovou drážkou v plášti válce) — jiný ' +
      'mechanický upínací systém, senzory nejsou vzájemně zaměnitelné. Elektricky má SMT-10G ' +
      'zjednodušené pouzdro (pouze PA výztuž, bez mosazi/nerezi jako SMT-8M varianty) a užší ' +
      'provozní teplotní rozsah (-20 až +70 °C oproti -40 až +85 °C u SMT-8M). Kabel vyveden ' +
      'PŘÍČNĚ (transverse), na rozdíl od podélné orientace u SMT-8M rodiny. Kabel testován na ' +
      'cyklickou ohybovou (5 milionů cyklů, poloměr 28 mm) i torzní odolnost (>300000 cyklů, ' +
      '±270°/0,1 m) pro energetické řetězy/robotické aplikace. Zařazeno do kategorie "Modul" ' +
      'jako kompletní osazený produkt s vlastním kabelem, stejně jako ostatní Festo snímače ' +
      'polohy pístu v této knihovně. Krytí IP65/IP68. Certifikace: c UL us (Listed), CE (EU EMC), ' +
      'KC EMC, RCM. RoHS.',
    tags: 'modul,senzor,proximity,poloha-pístu,magnetorezistivní,pnp,festo,smt-10g,pneumatika,kruhová-drážka',
  },
  {
    name: 'SME-10M-ZS-24V-E-2,5-Q-OE',
    packageType:
      'Tyčinkové pouzdro pro šroubování shora do KRUHOVÉ drážky (round slot), pouzdro PA výztuž ' +
      '+ vysoce legovaná nerezová ocel, integrovaný kabel s volným koncem, délka 2,5 m (plášť ' +
      'TPE-U/PUR), 2 vodiče, příčný výstup kabelu, hmotnost 14,6 g',
    value:
      'Polohový snímač pístu KULATÉHO pneumatického válce (proximity sensor), princip magnetický ' +
      'jazýčkový kontakt (reed), 2vodičové bipolární zapojení, N/O kontakt, 5–30 V AC/DC',
    notes:
      'Festo AG & Co. KG "Proximity sensor SME-10M-ZS-24V-E-2,5-Q-OE" (obj. č. 551370, datový ' +
      'list 5.4.2021) — magnetický jazýčkový (reed) snímač polohy pístu ze stejné "SME" ' +
      'produktové řady jako SME-8M-DS-24V-K-5,0-OE/SME-8-K5-LED-24/SME-8-S-LED-24 v této ' +
      'knihovně, ale s označením "10M" a "for round slot" — ⚠️ podobně jako u páru SMT-8M/' +
      'SMT-10G (rovněž v této knihovně) jde o variantu KONSTRUOVANOU PRO KRUHOVOU DRÁŽKU válce ' +
      '(ISO 6432 typu) místo profilové T-drážky — mechanicky nezaměnitelná se svými "8M/8/8-K5/ ' +
      '8-S" T-drážkovými sourozenci. Typový kód "ZS" (stejně jako u SMT-8M-A-ZS-24V-E-5,0-OE-EX2 ' +
      'v této knihovně) značí BEZKONTAKTNÍ 2VODIČOVÉ zapojení (jen BN/BU, zátěž RL v sérii se ' +
      'smyčkou napájení) — i když jde stále o mechanický reed kontakt (Switching output ' +
      '"Contact-based, bipolar"), elektrické zapojení je 2vodičové jako u polovodičových "ZS" ' +
      'variant, ne 3vodičové jako u "DS/K5/S" reed variant SME-8 řady. Pomalejší spínací ' +
      'kmitočet (max. 50 Hz) než SME-8 T-drážkové varianty (500–800 Hz) — typické pro menší/ ' +
      'kompaktnější kulaté válce s nižšími rychlostmi pohybu. Ochrana proti přepólování ' +
      'bipolární. Kabel testován na cyklickou ohybovou (5 milionů cyklů, poloměr 28 mm) i torzní ' +
      'odolnost (>300000 cyklů, ±270°/0,1 m). Zařazeno do kategorie "Modul" jako kompletní ' +
      'osazený produkt s vlastním kabelem, stejně jako ostatní Festo snímače polohy pístu v této ' +
      'knihovně. Žlutá LED indikace sepnutí. Krytí IP65/IP68. Provozní teplota -40 až +70 °C ' +
      '(pevná instalace), -20 až +70 °C (pohyblivá instalace kabelu). Certifikace: CE (EU EMC), ' +
      'RCM. Odolný proti oleji, bez mědi/PTFE, bez halogenu, RoHS.',
    tags: 'modul,senzor,proximity,poloha-pístu,reed,jazýčkový-kontakt,magnetický,festo,sme-10m,pneumatika,kruhová-drážka',
  },
  {
    name: 'SIEH-3B-PS-S-L',
    packageType:
      'Válcové pouzdro Ø3 mm, vysoce legovaná nerezová ocel, konektor M8×1 (3piny) na konci ' +
      '0,15m kabelu (plášť TPE-U/PUR, izolace PVC), zápustná montáž (flush), upevnění svorkou, ' +
      'hmotnost 4 g',
    value:
      'Miniaturní indukční přibližovací spínač, jmenovitá spínací vzdálenost 1 mm (zaručená ' +
      '0,81 mm), PNP výstup (N/O), 10–30 V DC, max. spínací kmitočet 3000 Hz',
    notes:
      'Festo AG & Co. KG "Proximity sensor SIEH-3B-PS-S-L" (obj. č. 538263, datový list ' +
      '5.6.2021) — ⚠️ ZCELA JINÁ kategorie senzoru než ostatní Festo snímače v této knihovně ' +
      '(SME/SMT/SDBT-BSW/SMEO/SMPO/SMTSO), které jsou specificky konstruovány pro SNÍMÁNÍ POLOHY ' +
      'PÍSTU pneumatického válce skrz jeho stěnu (reagují na magnet v pístu) — SIEH-3B-PS-S-L je ' +
      'naproti tomu OBECNÝ MALOROZMĚROVÝ INDUKČNÍ přibližovací spínač (princip vířivých proudů, ' +
      'reaguje na jakýkoliv kovový objekt v dosahu, ne specificky na magnet), určený pro obecné ' +
      'průmyslové snímání přítomnosti kovových předmětů — funkčně a principiálně analogický spíše ' +
      'k TURCK BI1/Pepperl+Fuchs NBB1 (nejmenší velikosti) v této knihovně než ke zbytku Festo ' +
      'snímačů. Extrémně malé pouzdro Ø3 mm (menší než nejmenší NBB1-4GM22-E0 v knihovně), ' +
      'redukční faktory pro různé kovy udané explicitně (hliník 0,5, nerez ocel 0,8, měď 0,45, ' +
      'mosaz 0,6, ocel St37 = referenční 1,0). Rychlá odezva (zapínací doba jen 0,02 ms, max. ' +
      'spínací kmitočet 3000 Hz — výrazně rychlejší než piston-position varianty). Vestavěný ' +
      'induktivní ochranný obvod (aktivní při výstupním proudu <100 mA a spínacím kmitočtu ' +
      '<10 Hz). Zkratová ochrana pulzní, ochrana proti přepólování na všech vývodech. Krytí IP67, ' +
      'korozní odolnost CRC třída 1 (nízké korozní namáhání). Zařazeno do kategorie "Modul" jako ' +
      'kompletní osazený produkt s vlastním kabelem/konektorem, stejně jako ostatní indukční ' +
      'přibližovací spínače (TURCK/Pepperl+Fuchs/Festo) v této knihovně. Žlutá LED indikace ' +
      'sepnutí. Provozní teplota -25 až +70 °C (pevná instalace), -5 až +70 °C (pohyblivá ' +
      'instalace kabelu). Certifikace: c UL us (Listed), CE (EU EMC), RCM. Bez mědi a PTFE.',
    tags: 'modul,senzor,proximity,indukční,pnp,festo,sieh-3b,miniaturní,m8,průmyslový',
  },
  {
    name: 'SPAN-B11R-M5F-PNLK-PNVBA-L1',
    packageType:
      'Kompaktní panelová/nástěnná jednotka s podsvíceným LCD displejem a tlačítky, pouzdro PA ' +
      'výztuž, díly ve styku s médiem FPM/niklovaná mosaz/NBR/PA, pneumatická přípojka vnitřní ' +
      'závit M5, konektor (4piny, zapojení L1J), montáž na panel/závitem/nástěnnou konzolí, ' +
      'hmotnost 34 g',
    value:
      'Tlakový senzor/spínač s displejem (piezorezistivní princip), měřicí rozsah -1 až 10 bar ' +
      '(max. přetížení 15 bar), 2× PNP/NPN přepínatelný spínací výstup + analogový výstup ' +
      '(0-10V/4-20mA/1-5V), IO-Link, 15–30 V DC',
    notes:
      'Festo AG & Co. KG "Pressure sensor SPAN-B11R-M5F-PNLK-PNVBA-L1" (obj. č. 610282, datový ' +
      'list 14.5.2021) — ⚠️ zcela jiná kategorie senzoru než ostatní Festo produkty v této ' +
      'knihovně (SME/SMT/SDBT-BSW/SMEO/SMPO/SMTSO — snímače polohy pístu; SIEH-3B — obecný ' +
      'indukční spínač): SPAN-B11R je TLAKOVÝ senzor/spínač s VLASTNÍM DISPLEJEM a ovládacími ' +
      'tlačítky pro nastavení přímo na jednotce — kompletní přístroj, ne holý prvek. Piezorezistivní ' +
      'měřicí princip (relativní tlak), rozsah -1 až 10 bar, přesnost ±1,5 %FS, opakovatelnost ' +
      '±0,3 %FS, teplotní koeficient ±0,05 %FS/K. Duální spínací výstup (2× PNP nebo 2× NPN, ' +
      'přepínatelný, N/O nebo N/C, přepínatelný) s volitelnou spínací funkcí (okenní komparátor, ' +
      'prahový komparátor, automatické sledování diference) PLUS nezávislý analogový výstup ' +
      '(napěťový 0-10V/1-5V nebo proudový 4-20mA). Podporuje IO-Link (verze protokolu V1.1, profil ' +
      '"Smart sensor", komunikace COM2 38,4 kBd, port třídy A, 14bit process data variable pro tlak ' +
      '+ 2bit binary data channel pro monitorování) — umožňuje digitální parametrizaci a čtení ' +
      'naměřených hodnot nadřazeným PLC bez nutnosti analogového/spínacího zapojení. Podsvícený LCD ' +
      'displej zobrazuje tlak v 9 volitelných jednotkách (MPa, bar, inchH2O, inchHg, kPa, kgf/cm², ' +
      'mbar, mmHg, psi). Nastavení prahů přes IO-Link, teach-in tlačítko nebo displej, ochrana proti ' +
      'neoprávněné manipulaci přes IO-Link nebo PIN kód. Médium: stlačený vzduch (ISO 8573-1:2010 ' +
      '[7:4:4]) nebo inertní plyn, provoz s olejovým mazáním možný. Zařazeno do kategorie "Modul" ' +
      'jako kompletní přístroj s vlastním displejem/ovládáním/konektorem. Krytí jen IP40 (určeno ' +
      'pro montáž uvnitř rozvaděče/panelu, ne pro přímé venkovní vystavení jako IP65+ snímače polohy ' +
      'pístu v této knihovně). Korozní odolnost CRC třída 2 (střední korozní namáhání). Provozní ' +
      'teplota média i okolí 0 až +50 °C. Certifikace: c UL us (Listed, UL E322346), CE (EU EMC + ' +
      'RoHS), RCM.',
    tags: 'modul,senzor,tlak,tlakový-spínač,piezorezistivní,io-link,pnp,npn,analogový,festo,span-b11r,displej',
  },
  {
    name: 'SPAN-B-B11R-R18M-PN-L1+2.5S',
    packageType:
      'Kompaktní panelová/nástěnná jednotka s podsvíceným LCD displejem a tlačítky, pouzdro PA ' +
      'výztuž, díly ve styku s médiem FPM/niklovaná mosaz/NBR/PA, pneumatická přípojka vnější ' +
      'závit R1/8, konektor (4piny, zapojení L1J), montáž na panel/závitem/nástěnnou konzolí, ' +
      'hmotnost 31 g',
    value:
      'Základní ("Basic") tlakový senzor/spínač s displejem (piezorezistivní princip), měřicí ' +
      'rozsah -1 až 10 bar (max. přetížení 15 bar), 1× PNP/NPN přepínatelný spínací výstup, ' +
      '10,8–30 V DC',
    notes:
      'Festo AG & Co. KG "Pressure sensor SPAN-B-B11R-R18M-PN-L1+2.5S" (obj. č. 8114768, datový ' +
      'list 14.5.2021) — "Basic" (typový kód "SPAN-B" s příponou "B" oproti "SPAN") verze ' +
      'tlakového senzoru/spínače ze stejné rodiny jako SPAN-B11R-M5F-PNLK-PNVBA-L1 v této ' +
      'knihovně (shodný piezorezistivní princip, shodný měřicí rozsah -1 až 10 bar/15 bar ' +
      'přetížení, shodná přesnost ±1,5 %FS) — ⚠️ jde o ZJEDNODUŠENOU/LEVNĚJŠÍ variantu s ' +
      'omezenější funkcí: má jen JEDEN přepínatelný spínací výstup (PNP/NPN, N/O/N/C) místo ' +
      'DVOU nezávislých výstupů u plné "SPAN" varianty, NEMÁ analogový výstup (0-10V/4-20mA/1-5V) ' +
      'ani podporu IO-Link (nastavení pouze přes teach-in tlačítko nebo displej, ochrana proti ' +
      'manipulaci pouze PIN kódem, ne přes IO-Link) — chybí tedy digitální komunikační rozhraní i ' +
      'analogový výstup plné verze. Další rozdíly: pneumatická přípojka VNĚJŠÍ závit R1/8 (místo ' +
      'vnitřního závitu M5 u plné verze — jiný typ připojení, ne vzájemně zaměnitelné), vyšší ' +
      'minimální napájecí napětí (10,8 V oproti 15 V), nižší max. výstupní proud (80 mA oproti ' +
      '100 mA), vyšší teplotní koeficient (0,1 %FS/K oproti 0,05 %FS/K — nižší teplotní stabilita), ' +
      'méně zobrazovaných jednotek na displeji (6 oproti 9 — chybí inchH2O a kgf/cm²). Zařazeno ' +
      'do kategorie "Modul" jako kompletní přístroj s vlastním displejem/ovládáním/konektorem, ' +
      'stejně jako plná verze SPAN-B11R-M5F-PNLK-PNVBA-L1. Médium: stlačený vzduch (ISO ' +
      '8573-1:2010 [7:4:4]) nebo inertní plyn, provoz s olejovým mazáním možný. Krytí IP40, ' +
      'korozní odolnost CRC třída 2. Provozní teplota média i okolí 0 až +50 °C. Certifikace: CE ' +
      '(EU EMC + RoHS), RCM.',
    tags: 'modul,senzor,tlak,tlakový-spínač,piezorezistivní,pnp,npn,festo,span-b-b11r,displej,basic',
  },
  {
    name: 'SDE5-D10-C3-Q6E-P-K',
    packageType:
      'Kompaktní kvádrové pouzdro, materiál PA + POM, pneumatická přípojka zásuvná QS-6 (rychlo' +
      'spojka pro hadičku Ø6 mm), integrovaný kabel, délka 2,5 m, 3 vodiče, montáž ' +
      'příslušenstvím, hmotnost 47 g',
    value:
      'Jednoduchý tlakový spínač bez displeje (piezorezistivní princip), měřicí rozsah 0–10 bar, ' +
      '1× PNP spínací výstup (okenní komparátor, N/C), 15–30 V DC',
    notes:
      'Festo AG & Co. KG "Pressure sensor SDE5-D10-C3-Q6E-P-K" (obj. č. 542896, datový list ' +
      '14.5.2021) — ⚠️ JINÁ produktová řada tlakových spínačů než SPAN-B11R-M5F-PNLK-PNVBA-L1/ ' +
      'SPAN-B-B11R-R18M-PN-L1+2.5S v této knihovně (typový kód "SDE5" místo "SPAN") — narozdíl ' +
      'od obou SPAN variant NEMÁ ŽÁDNÝ DISPLEJ ani ovládací tlačítka (jen žlutá LED indikace ' +
      'sepnutí), prahová hodnota se tedy nastavuje jinak (přes potenciometr/servisní vstup, v ' +
      'datasheetu blíže nespecifikováno, jen rozsah nastavení 0–100 %) — jde o jednodušší, ' +
      'levnější typ tlakového spínače bez interaktivního uživatelského rozhraní. Měřicí rozsah je ' +
      'navíc jen KLADNÝ 0–10 bar (na rozdíl od SPAN variant s rozsahem -1 až 10 bar zahrnujícím i ' +
      'podtlak). Pneumatické připojení řešeno zásuvnou rychlospojkou QS-6 pro hadičku 6 mm (na ' +
      'rozdíl od závitového M5/R1/8 u SPAN variant) — přímé zasunutí hadičky bez nutnosti ' +
      'šroubení. Integrovaný pevný 2,5m kabel (na rozdíl od odnímatelného zásuvného konektoru u ' +
      'SPAN variant). Jediný spínací výstup (PNP, okenní komparátor, N/C kontakt) — bez volby ' +
      'PNP/NPN přepínání, bez analogového výstupu, bez IO-Link. Zkratová ochrana, ochrana proti ' +
      'přepólování na všech vývodech. Zařazeno do kategorie "Modul" jako kompletní osazený ' +
      'produkt s vlastním kabelem, stejně jako SPAN tlakové senzory v této knihovně. Krytí IP40, ' +
      'korozní odolnost CRC třída 2. Provozní teplota média i okolí 0 až +50 °C. Certifikace: ' +
      'c UL us (Recognized), CE (EU EMC + RoHS), RCM.',
    tags: 'modul,senzor,tlak,tlakový-spínač,piezorezistivní,pnp,festo,sde5,qs-konektor',
  },
  {
    name: 'SDE5-D10-C-Q4E-P-M8',
    packageType:
      'Kompaktní kvádrové pouzdro, materiál PA + POM, pneumatická přípojka zásuvná QS-4 (rychlo' +
      'spojka pro hadičku Ø4 mm), elektrický konektor M8×1 (3piny, kruhové provedení), montáž ' +
      'příslušenstvím, hmotnost 19 g',
    value:
      'Jednoduchý tlakový spínač bez displeje (piezorezistivní princip), měřicí rozsah 0–10 bar, ' +
      '1× PNP spínací výstup (prahová hodnota s pevnou hysterezí, N/C), 15–30 V DC',
    notes:
      'Festo AG & Co. KG "Pressure sensor SDE5-D10-C-Q4E-P-M8" (obj. č. 542889, datový list ' +
      '14.5.2021) — elektricky/funkčně velmi podobný SDE5-D10-C3-Q6E-P-K (obj. č. 542896) v této ' +
      'knihovně (stejná "SDE5" řada, stejný piezorezistivní princip, stejný rozsah 0–10 bar, PNP ' +
      'N/C výstup, bez displeje, jen LED indikace) — ⚠️ liší se ve třech ohledech: (1) elektrické ' +
      'připojení ZÁSUVNÝM KONEKTOREM M8×1 (odnímatelný, kruhové provedení) místo INTEGROVANÉHO ' +
      '2,5m kabelu u "-C3-...-K" varianty — proto výrazně nižší hmotnost (19 g vs 47 g); (2) menší ' +
      'pneumatická rychlospojka QS-4 pro hadičku Ø4 mm místo QS-6 pro Ø6 mm; (3) spínací funkce ' +
      '"Threshold value with fixed hysteresis" (jednoduchý prahový komparátor s pevnou hysterezí) ' +
      'místo "Window comparator" (okenní komparátor s nastavitelnými dvěma mezemi) u "-C3-...-K" ' +
      'varianty — jednodušší spínací logika. Zkratová ochrana, ochrana proti přepólování na všech ' +
      'vývodech. Zařazeno do kategorie "Modul" jako kompletní osazený produkt s vlastním ' +
      'konektorem, stejně jako ostatní Festo SDE5/SPAN tlakové senzory v této knihovně. Krytí ' +
      'IP40, korozní odolnost CRC třída 2. Provozní teplota média i okolí 0 až +50 °C. ' +
      'Certifikace: c UL us (Recognized), CE (EU EMC + RoHS), RCM.',
    tags: 'modul,senzor,tlak,tlakový-spínač,piezorezistivní,pnp,festo,sde5,qs-konektor,m8',
  },
  {
    name: 'SDE5-D10-NF-Q6E-V-K',
    packageType:
      'Kompaktní kvádrové pouzdro, materiál PA + POM, pneumatická přípojka zásuvná QS-6 (rychlo' +
      'spojka pro hadičku Ø6 mm), integrovaný kabel, délka 2,5 m, 3 vodiče, montáž ' +
      'příslušenstvím, hmotnost 47 g',
    value:
      'Analogový tlakový snímač bez displeje (piezorezistivní princip), měřicí rozsah 0–10 bar, ' +
      'lineární napěťový výstup 0–10 V, 15–30 V DC',
    notes:
      'Festo AG & Co. KG "Pressure sensor SDE5-D10-NF-Q6E-V-K" (obj. č. 567471, datový list ' +
      '14.5.2021) — ⚠️ ANALOGOVÝ tlakový SNÍMAČ (transmitter), ne spínač — na rozdíl od ' +
      'SDE5-D10-C3-Q6E-P-K (obj. č. 542896) v této knihovně (typový kód "-C3-...-P-", PNP spínací ' +
      'výstup s oknovým komparátorem, žlutá LED indikace SEPNUTÍ) má tato varianta typový kód ' +
      '"-NF-...-V-" a poskytuje POUZE spojitý lineární analogový napěťový výstup 0–10 V úměrný ' +
      'tlaku (0 bar → 0 V, 10 bar → 10 V) — BEZ jakékoliv spínací/prahové funkce, přesnost ' +
      'analogového výstupu ±3 %FS, chyba linearity ±0,3 %FS. Zelená LED indikuje pouze stav ' +
      'připravenosti přístroje ("Ready status"), ne stav spínání (protože žádný spínací výstup ' +
      'neexistuje). Jinak mechanicky a v základních parametrech shodné se SDE5-D10-C3-Q6E-P-K ' +
      '(stejné pouzdro PA/POM, stejná QS-6 pneumatická přípojka, stejný 2,5m integrovaný kabel, ' +
      'stejný piezorezistivní princip a rozsah 0–10 bar, stejná hmotnost 47 g). Zkratová ochrana, ' +
      'ochrana proti přepólování na všech vývodech. Zařazeno do kategorie "Modul" jako kompletní ' +
      'osazený produkt s vlastním kabelem, stejně jako ostatní Festo SDE5/SPAN tlakové senzory v ' +
      'této knihovně. Krytí IP40, korozní odolnost CRC třída 2. Provozní teplota média i okolí ' +
      '0 až +50 °C. Certifikace: c UL us (Recognized), CE (EU EMC + RoHS), RCM.',
    tags: 'modul,senzor,tlak,analogový,piezorezistivní,festo,sde5,qs-konektor,transmitter',
  },
  {
    name: 'SDE5-D10-NF-Q6E-V-M8',
    packageType:
      'Kompaktní kvádrové pouzdro, materiál PA + POM, pneumatická přípojka zásuvná QS-6 (rychlo' +
      'spojka pro hadičku Ø6 mm), elektrický konektor M8×1 (3piny, kruhové provedení), montáž ' +
      'příslušenstvím, hmotnost 19 g',
    value:
      'Analogový tlakový snímač bez displeje (piezorezistivní princip), měřicí rozsah 0–10 bar, ' +
      'lineární napěťový výstup 0–10 V, 15–30 V DC',
    notes:
      'Festo AG & Co. KG "Pressure sensor SDE5-D10-NF-Q6E-V-M8" (obj. č. 567465, datový list ' +
      '14.5.2021) — elektricky/funkčně TOTOŽNÝ analogový tlakový snímač jako SDE5-D10-NF-Q6E-V-K ' +
      '(obj. č. 567471) v této knihovně (stejný piezorezistivní princip, rozsah 0–10 bar, lineární ' +
      'analogový výstup 0–10 V, přesnost ±3 %FS, linearita ±0,3 %FS, zelená LED "ready") — ⚠️ liší ' +
      'se POUZE typem elektrického připojení: zatímco "-...-V-K" varianta má INTEGROVANÝ 2,5m ' +
      'kabel, tato varianta "-...-V-M8" má ODNÍMATELNÝ zásuvný konektor M8×1 (kruhové provedení) ' +
      '— stejný vztah jako mezi dvojicí SDE5-D10-C3-Q6E-P-K/SDE5-D10-C-Q4E-P-M8 (spínací varianty) ' +
      'v této knihovně, zde ale u ANALOGOVÉHO výstupu a se shodnou QS-6 pneumatickou přípojkou ' +
      '(ne zmenšenou na QS-4 jako u spínacích M8 variant). Nižší hmotnost díky absenci kabelu ' +
      '(19 g vs 47 g). Zkratová ochrana, ochrana proti přepólování na všech vývodech. Zařazeno do ' +
      'kategorie "Modul" jako kompletní osazený produkt s vlastním konektorem, stejně jako ostatní ' +
      'Festo SDE5/SPAN tlakové senzory v této knihovně. Krytí IP40, korozní odolnost CRC třída 2. ' +
      'Provozní teplota média i okolí 0 až +50 °C. Certifikace: c UL us (Recognized), CE (EU EMC ' +
      '+ RoHS), RCM.',
    tags: 'modul,senzor,tlak,analogový,piezorezistivní,festo,sde5,qs-konektor,m8,transmitter',
  },
  {
    name: 'SDE5-D10-O-Q6E-P-M8',
    packageType:
      'Kompaktní kvádrové pouzdro, materiál PA + POM, pneumatická přípojka zásuvná QS-6 (rychlo' +
      'spojka pro hadičku Ø6 mm), elektrický konektor M8×1 (3piny, kruhové provedení), montáž ' +
      'příslušenstvím, hmotnost 19 g',
    value:
      'Jednoduchý tlakový spínač bez displeje (piezorezistivní princip), měřicí rozsah 0–10 bar, ' +
      '1× PNP spínací výstup (prahová hodnota s pevnou hysterezí, N/O), 15–30 V DC',
    notes:
      'Festo AG & Co. KG "Pressure sensor SDE5-D10-O-Q6E-P-M8" (obj. č. 527467, datový list ' +
      '14.5.2021) — velmi podobný SDE5-D10-C-Q4E-P-M8 (obj. č. 542889) v této knihovně (stejná ' +
      'SDE5 řada, stejný piezorezistivní princip, rozsah 0–10 bar, M8×1 konektor, spínací funkce ' +
      '"threshold value with fixed hysteresis") — ⚠️ liší se ve dvou detailech: (1) spínací ' +
      'element je N/O (spínací) kontakt, zatímco SDE5-D10-C-Q4E-P-M8 má N/C (rozpínací) kontakt — ' +
      'opačná polarita spínání; (2) větší pneumatická rychlospojka QS-6 pro hadičku Ø6 mm místo ' +
      'QS-4 pro Ø4 mm. Zkratová ochrana, ochrana proti přepólování na všech vývodech, max. ' +
      'výstupní proud 100 mA. Žlutá LED indikace sepnutí. Zařazeno do kategorie "Modul" jako ' +
      'kompletní osazený produkt s vlastním konektorem, stejně jako ostatní Festo SDE5/SPAN ' +
      'tlakové senzory v této knihovně. Krytí IP40, korozní odolnost CRC třída 2. Provozní ' +
      'teplota média i okolí 0 až +50 °C. Certifikace: c UL us (Recognized), CE (EU EMC + RoHS), ' +
      'RCM.',
    tags: 'modul,senzor,tlak,tlakový-spínač,piezorezistivní,pnp,festo,sde5,qs-konektor,m8,no-kontakt',
  },
  {
    name: 'SDE5-V1-NF-Q6-V-M8',
    packageType:
      'Kompaktní kvádrové pouzdro, materiál PA + POM, pneumatická přípojka zásuvná QS-6 (rychlo' +
      'spojka pro hadičku Ø6 mm), elektrický konektor M8×1 (3piny, kruhové provedení), montáž ' +
      'příslušenstvím, hmotnost 19 g',
    value:
      'Analogový VAKUOVÝ tlakový snímač bez displeje (piezorezistivní princip), měřicí rozsah ' +
      '0 až -1 bar (podtlak), lineární napěťový výstup 0–10 V, 15–30 V DC',
    notes:
      'Festo AG & Co. KG "Pressure sensor SDE5-V1-NF-Q6-V-M8" (obj. č. 567464, datový list ' +
      '14.5.2021) — ⚠️ VAKUOVÁ (podtlaková) varianta analogového tlakového snímače ze stejné SDE5 ' +
      'rodiny jako SDE5-D10-NF-Q6E-V-M8 (obj. č. 567465) v této knihovně — typový kód "V1" místo ' +
      '"D10" signalizuje měřicí rozsah OD 0 DO -1 BAR (čistý podtlak/vakuum), zatímco "D10" ' +
      'varianta měří KLADNÝ tlak 0 až +10 bar — jde tedy o senzor pro zcela jiný typ aplikace ' +
      '(měření podtlaku, typicky u vakuových přísavek/manipulátorů, na rozdíl od měření tlaku ' +
      'stlačeného vzduchu). Jinak elektricky/mechanicky shodný s "D10-...-M8" analogovou variantou ' +
      '— stejný piezorezistivní princip, lineární analogový výstup 0–10 V (0 bar → 0 V, -1 bar → ' +
      '10 V), přesnost ±3 %FS, linearita ±0,3 %FS, zelená LED "ready", stejné pouzdro PA/POM, ' +
      'stejný M8×1 konektor a QS-6 přípojka, stejná hmotnost 19 g. Zkratová ochrana, ochrana ' +
      'proti přepólování na všech vývodech. Zařazeno do kategorie "Modul" jako kompletní osazený ' +
      'produkt s vlastním konektorem, stejně jako ostatní Festo SDE5/SPAN tlakové senzory v této ' +
      'knihovně. Krytí IP40, korozní odolnost CRC třída 2. Provozní teplota média i okolí 0 až ' +
      '+50 °C. Certifikace: c UL us (Recognized), CE (EU EMC + RoHS), RCM.',
    tags: 'modul,senzor,tlak,vakuum,podtlak,analogový,piezorezistivní,festo,sde5,qs-konektor,m8,transmitter',
  },
  {
    name: 'SPAN-B11R-M5F-PN-PN-L1',
    packageType:
      'Kompaktní panelová/nástěnná jednotka s podsvíceným LCD displejem a tlačítky, pouzdro PA ' +
      'výztuž, díly ve styku s médiem FPM/niklovaná mosaz/NBR/PA, pneumatická přípojka vnitřní ' +
      'závit M5, konektor (4piny, zapojení L1J), montáž na panel/závitem/nástěnnou konzolí, ' +
      'hmotnost 34 g',
    value:
      'Tlakový senzor/spínač s displejem (piezorezistivní princip), measuring rozsah -1 až 10 ' +
      'bar (max. přetížení 15 bar), 2× PNP/NPN přepínatelný spínací výstup, BEZ analogového ' +
      'výstupu a BEZ IO-Link, 15–30 V DC',
    notes:
      'Festo AG & Co. KG "Pressure sensor SPAN-B11R-M5F-PN-PN-L1" (obj. č. 8134893, datový list ' +
      '14.5.2021) — mechanicky i measurementově TOTOŽNÝ s plnou verzí SPAN-B11R-M5F-PNLK-PNVBA-L1 ' +
      '(obj. č. 610282) v této knihovně (stejné pouzdro s displejem, stejný piezorezistivní ' +
      'princip, stejný rozsah -1 až 10 bar/15 bar přetížení, stejná přesnost ±1,5 %FS, stejná M5 ' +
      'pneumatická přípojka) — ⚠️ typový kód "-PN-PN-" (místo "-PNLK-PNVBA-") signalizuje ' +
      'OSEKANOU funkční výbavu: má POUZE duální přepínatelný spínací výstup (2× PNP nebo 2× NPN, ' +
      'okenní komparátor/prahový komparátor/auto difference monitoring — stejné spínací funkce ' +
      'jako plná verze), ale zcela CHYBÍ ANALOGOVÝ VÝSTUP (0-10V/4-20mA/1-5V) i PODPORA IO-LINK ' +
      '(nastavení pouze přes teach-in tlačítko nebo displej, ochrana proti manipulaci pouze PIN ' +
      'kódem, ne přes IO-Link) — jde tedy o čistě SPÍNACÍ variantu bez digitální komunikace a bez ' +
      'analogového měřicího výstupu, cenově/funkčně mezi plnou "PNLK-PNVBA" verzí (2 výstupy + ' +
      'analog + IO-Link) a zjednodušenou "Basic" verzí SPAN-B-B11R-R18M-PN-L1+2.5S (1 výstup, ' +
      'jiná pneumatická přípojka R1/8) v této knihovně. Zařazeno do kategorie "Modul" jako ' +
      'kompletní přístroj s vlastním displejem/ovládáním/konektorem, stejně jako ostatní Festo ' +
      'SPAN/SDE5 tlakové senzory v této knihovně. Médium: stlačený vzduch (ISO 8573-1:2010 ' +
      '[7:4:4]) nebo inertní plyn, provoz s olejovým mazáním možný. Krytí IP40, korozní odolnost ' +
      'CRC třída 2. Provozní teplota média i okolí 0 až +50 °C. Certifikace: c UL us (Listed, UL ' +
      'E322346), CE (EU EMC + RoHS), RCM.',
    tags: 'modul,senzor,tlak,tlakový-spínač,piezorezistivní,pnp,npn,festo,span-b11r,displej,bez-io-link',
  },
  {
    name: 'SPAW-P100R-G12M-2N-M12',
    packageType:
      'Válcové pouzdro s LED displejem, materiál ABS + vysoce legovaná nerezová ocel (smáčené ' +
      'díly celokovové z nerezi), těsnicí kroužek NBR, pneumatická přípojka vnější závit G1/2, ' +
      'konektor M12×1 (4piny, kruhové provedení), montáž vnějším závitem, hmotnost 230 g',
    value:
      'Vysokotlaký průmyslový tlakový senzor/spínač s displejem (kovový tenkovrstvý princip), ' +
      'měřicí rozsah 0–100 bar (max. přetížení 200 bar), 2× NPN volně programovatelný spínací ' +
      'výstup, 15–35 V DC',
    notes:
      'Festo AG & Co. KG "Pressure sensor SPAW-P100R-G12M-2N-M12" (obj. č. 8022775, datový list ' +
      '25.5.2021) — ⚠️ zcela JINÁ produktová řada tlakových senzorů než SPAN/SDE5 v této knihovně ' +
      '(typový kód "SPAW") — určena pro VYSOKOTLAKÉ PRŮMYSLOVÉ aplikace: měřicí rozsah 0–100 bar ' +
      '(desetinásobně vyšší než SPAN 10 bar, stonásobně vyšší než SDE5), max. přetížení 200 bar. ' +
      'Měřicí princip KOVOVÝ TENKOVRSTVÝ SNÍMAČ (metal thin-film), ne piezorezistivní křemíkový ' +
      'čip jako SPAN/SDE5 — celokovová konstrukce smáčených dílů z vysoce legované nerezi ' +
      '(žádné plastové/pryžové díly ve styku s médiem kromě NBR těsnění) umožňuje měřit i ' +
      'AGRESIVNÍ/VISKÓZNÍ KAPALNÁ a plynná média (ne jen čistý stlačený vzduch jako SPAN/SDE5) — ' +
      'korozní odolnost CRC třída 4 "Particularly high corrosion stress" (nejvyšší třída v této ' +
      'knihovně, oproti třídě 2 u SPAN/SDE5). Širší teplotní rozsah média -20 až +85 °C, okolí ' +
      '0 až +80 °C. Duální VOLNĚ PROGRAMOVATELNÝ NPN spínací výstup (2×NPN, max. proud 250 mA, ' +
      'doba náběhu 3 ms). LED displej (4místný alfanumerický, ne LCD jako SPAN), červená LED ' +
      'indikace sepnutí. Nastavení pouze přes displej a tlačítka (bez teach-in, bez IO-Link), ' +
      'ochrana PIN kódem. Krytí IP65/IP67 (vyšší než IP40 u SPAN/SDE5, vhodné pro přímé venkovní/ ' +
      'průmyslové vystavení). Zařazeno do kategorie "Modul" jako kompletní přístroj s vlastním ' +
      'displejem/ovládáním/konektorem, stejně jako SPAN/SDE5 tlakové senzory v této knihovně. ' +
      'Zkratová ochrana, ochrana proti přepólování napájení. Obsahuje látky ovlivňující smáčivost ' +
      'nátěru (paint-wetting impairment substances). Certifikace: c UL us (Listed), CE (EU EMC), ' +
      'RCM. RoHS.',
    tags: 'modul,senzor,tlak,vysokotlaký,tenkovrstvý,npn,festo,spaw-p100r,displej,g12,nerez',
  },
  {
    name: 'SPAW-B11R-G14F-2P-M12',
    packageType:
      'Válcové pouzdro s LED displejem, materiál ABS + vysoce legovaná nerezová ocel (smáčené ' +
      'díly celokovové z nerezi), pneumatická přípojka vnitřní závit G1/4, konektor M12×1 ' +
      '(4piny, kruhové provedení), montáž vnitřním závitem/příslušenstvím, hmotnost 230 g',
    value:
      'Průmyslový tlakový senzor/spínač s displejem (kovový tenkovrstvý princip), měřicí rozsah ' +
      '-1 až 10 bar (max. přetížení 20 bar), 2× PNP volně programovatelný spínací výstup, ' +
      '15–35 V DC',
    notes:
      'Festo AG & Co. KG "Pressure sensor SPAW-B11R-G14F-2P-M12" (obj. č. 8022741, datový list ' +
      '25.5.2021) — nižší-tlaká varianta ze stejné SPAW rodiny (kovový tenkovrstvý senzor, ' +
      'celokovové smáčené díly z nerezi, LED displej, IP65/67, CRC třída 4) jako ' +
      'SPAW-P100R-G12M-2N-M12 (obj. č. 8022775) v této knihovně — typový kód "B11R" (stejné ' +
      'základní označení jako u SPAN-B11R senzorů) signalizuje měřicí rozsah -1 až 10 bar/20 bar ' +
      'přetížení (na rozdíl od "P100R" varianty s rozsahem 0–100 bar/200 bar) — pokrývá tedy ' +
      'stejný tlakový rozsah jako SPAN-B11R-M5F-PNLK-PNVBA-L1/SPAN-B11R-M5F-PN-PN-L1 v této ' +
      'knihovně, ale v ROBUSTNĚJŠÍM celokovovém provedení pro agresivní/kapalná média a vyšší ' +
      'korozní zátěž (CRC třída 4 oproti třídě 2 u plastových SPAN). Další rozdíly oproti ' +
      'SPAW-P100R-G12M-2N-M12: menší pneumatická přípojka vnitřní závit G1/4 (místo vnějšího ' +
      'G1/2), 2× PNP výstup (místo 2× NPN), montáž i příslušenstvím (ne jen vnějším závitem). ' +
      'Volně programovatelná spínací funkce, max. proud 250 mA, doba náběhu 3 ms. Zařazeno do ' +
      'kategorie "Modul" jako kompletní přístroj s vlastním displejem/ovládáním/konektorem, ' +
      'stejně jako ostatní Festo SPAW/SPAN/SDE5 tlakové senzory v této knihovně. Teplota média ' +
      '-20 až +85 °C, okolí 0 až +80 °C. Zkratová ochrana, ochrana proti přepólování napájení. ' +
      'Obsahuje látky ovlivňující smáčivost nátěru. Certifikace: c UL us (Listed), CE (EU EMC), ' +
      'RCM. RoHS.',
    tags: 'modul,senzor,tlak,tenkovrstvý,pnp,festo,spaw-b11r,displej,g14,nerez',
  },
  {
    name: 'SPAW-B2R-G12M-2P-M12',
    packageType:
      'Válcové pouzdro s LED displejem, materiál ABS + vysoce legovaná nerezová ocel (smáčené ' +
      'díly celokovové z nerezi), těsnicí kroužek NBR, pneumatická přípojka vnější závit G1/2, ' +
      'konektor M12×1 (4piny, kruhové provedení), montáž vnějším závitem, hmotnost 230 g',
    value:
      'Nízkotlaký průmyslový tlakový senzor/spínač s displejem, měřicí rozsah -1 až 1 bar (max. ' +
      'přetížení 2 bar), 2× PNP volně programovatelný spínací výstup, 15–35 V DC',
    notes:
      'Festo AG & Co. KG "Pressure sensor SPAW-B2R-G12M-2P-M12" (obj. č. 8022749, datový list ' +
      '25.5.2021) — nejnižší tlakový rozsah ze SPAW rodiny v této knihovně (vedle ' +
      'SPAW-P100R-G12M-2N-M12 s rozsahem 0–100 bar a SPAW-B11R-G14F-2P-M12 s rozsahem -1 až ' +
      '10 bar) — typový kód "B2R" značí úzký rozsah -1 až +1 bar/2 bar přetížení, vhodný pro ' +
      'přesné měření nízkých tlaků/mírného podtlaku. ⚠️ NA ROZDÍL od obou ostatních SPAW variant ' +
      '(metal thin-film princip) používá tato nejnižší-rozsahová varianta PIEZOREZISTIVNÍ princip ' +
      '(stejný jako SPAN/SDE5 v této knihovně) — u tak úzkého rozsahu (±1 bar) je piezorezistivní ' +
      'křemíkový snímač citlivější než kovový tenkovrstvý senzor optimalizovaný pro vyšší tlaky. ' +
      'Mechanicky a funkčně jinak shodná se SPAW-P100R-G12M-2N-M12 (stejné celokovové pouzdro ' +
      'ABS+nerez, LED displej, G1/2 vnější závit, M12 konektor, IP65/67, CRC třída 4, 2× PNP ' +
      'volně programovatelný výstup, max. proud 250 mA, doba náběhu 3 ms, teplota média -20 až ' +
      '+85 °C). Zařazeno do kategorie "Modul" jako kompletní přístroj s vlastním displejem/ ' +
      'ovládáním/konektorem, stejně jako ostatní Festo SPAW/SPAN/SDE5 tlakové senzory v této ' +
      'knihovně. Zkratová ochrana, ochrana proti přepólování napájení. Obsahuje látky ' +
      'ovlivňující smáčivost nátěru. Certifikace: c UL us (Listed), CE (EU EMC), RCM. RoHS.',
    tags: 'modul,senzor,tlak,piezorezistivní,pnp,festo,spaw-b2r,displej,g12,nerez,nízkotlaký',
  },
  {
    name: 'SPAW-B11R-G14F-2N-M12',
    packageType:
      'Válcové pouzdro s LED displejem, materiál ABS + vysoce legovaná nerezová ocel (smáčené ' +
      'díly celokovové z nerezi), pneumatická přípojka vnitřní závit G1/4, konektor M12×1 ' +
      '(4piny, kruhové provedení), montáž vnitřním závitem/příslušenstvím, hmotnost 230 g',
    value:
      'Průmyslový tlakový senzor/spínač s displejem (kovový tenkovrstvý princip), měřicí rozsah ' +
      '-1 až 10 bar (max. přetížení 20 bar), 2× NPN volně programovatelný spínací výstup, ' +
      '15–35 V DC',
    notes:
      'Festo AG & Co. KG "Pressure sensor SPAW-B11R-G14F-2N-M12" (obj. č. 8022759, datový list ' +
      '25.5.2021) — elektricky/mechanicky TOTOŽNÝ se SPAW-B11R-G14F-2P-M12 (obj. č. 8022741) v ' +
      'této knihovně (stejný kovový tenkovrstvý princip, stejný rozsah -1 až 10 bar/20 bar ' +
      'přetížení, stejné celokovové pouzdro ABS+nerez, stejný G1/4 vnitřní závit, LED displej, ' +
      'IP65/67, CRC třída 4) — ⚠️ liší se POUZE polaritou spínacího výstupu: 2× NPN místo 2× PNP ' +
      '— standardní výrobní pár variant pro odlišné vstupní obvody PLC (sinking vs sourcing ' +
      'logika). Volně programovatelná spínací funkce, max. proud 250 mA, doba náběhu 3 ms. ' +
      'Zařazeno do kategorie "Modul" jako kompletní přístroj s vlastním displejem/ovládáním/ ' +
      'konektorem, stejně jako ostatní Festo SPAW/SPAN/SDE5 tlakové senzory v této knihovně. ' +
      'Teplota média -20 až +85 °C, okolí 0 až +80 °C. Zkratová ochrana, ochrana proti ' +
      'přepólování napájení. Obsahuje látky ovlivňující smáčivost nátěru. Certifikace: c UL us ' +
      '(Listed), CE (EU EMC), RCM. RoHS.',
    tags: 'modul,senzor,tlak,tenkovrstvý,npn,festo,spaw-b11r,displej,g14,nerez',
  },
  {
    name: 'SPAW-P100R-G14F-2N-M12',
    packageType:
      'Válcové pouzdro s LED displejem, materiál ABS + vysoce legovaná nerezová ocel (smáčené ' +
      'díly celokovové z nerezi), pneumatická přípojka vnitřní závit G1/4, konektor M12×1 ' +
      '(4piny, kruhové provedení), montáž vnitřním závitem/příslušenstvím, hmotnost 230 g',
    value:
      'Vysokotlaký průmyslový tlakový senzor/spínač s displejem (kovový tenkovrstvý princip), ' +
      'měřicí rozsah 0–100 bar (max. přetížení 200 bar), 2× NPN volně programovatelný spínací ' +
      'výstup, 15–35 V DC',
    notes:
      'Festo AG & Co. KG "Pressure sensor SPAW-P100R-G14F-2N-M12" (obj. č. 8022766, datový list ' +
      '25.5.2021) — elektricky TOTOŽNÝ vysokotlaký senzor jako SPAW-P100R-G12M-2N-M12 (obj. č. ' +
      '8022775) v této knihovně (stejný kovový tenkovrstvý princip, stejný rozsah 0–100 bar/ ' +
      '200 bar přetížení, stejný 2× NPN volně programovatelný výstup, stejné celokovové pouzdro, ' +
      'LED displej, IP65/67, CRC třída 4) — ⚠️ liší se POUZE typem pneumatické přípojky: zatímco ' +
      '"-G12M-" varianta má VNĚJŠÍ závit G1/2 (montáž vnějším závitem přímo do potrubí/nádoby), ' +
      'tato varianta "-G14F-" má VNITŘNÍ závit G1/4 (menší, montáž i s příslušenstvím) — stejný ' +
      'vztah mezi typy přípojek jako u dvojice SPAW-B11R-G12M.../SPAW-B11R-G14F... v této ' +
      'knihovně, zde ale u vysokotlaké "P100R" varianty. Max. proud 250 mA, doba náběhu 3 ms. ' +
      'Zařazeno do kategorie "Modul" jako kompletní přístroj s vlastním displejem/ovládáním/ ' +
      'konektorem, stejně jako ostatní Festo SPAW/SPAN/SDE5 tlakové senzory v této knihovně. ' +
      'Teplota média -20 až +85 °C, okolí 0 až +80 °C. Zkratová ochrana, ochrana proti ' +
      'přepólování napájení. Obsahuje látky ovlivňující smáčivost nátěru. Certifikace: c UL us ' +
      '(Listed), CE (EU EMC), RCM. RoHS.',
    tags: 'modul,senzor,tlak,vysokotlaký,tenkovrstvý,npn,festo,spaw-p100r,displej,g14,nerez',
  },
  {
    name: 'SPAW-P50R-G12M-2N-M12',
    packageType:
      'Válcové pouzdro s LED displejem, materiál ABS + vysoce legovaná nerezová ocel (smáčené ' +
      'díly celokovové z nerezi), těsnicí kroužek NBR, pneumatická přípojka vnější závit G1/2, ' +
      'konektor M12×1 (4piny, kruhové provedení), montáž vnějším závitem, hmotnost 230 g',
    value:
      'Vysokotlaký průmyslový tlakový senzor/spínač s displejem (kovový tenkovrstvý princip), ' +
      'měřicí rozsah 0–50 bar (max. přetížení 100 bar), 2× NPN volně programovatelný spínací ' +
      'výstup, 15–35 V DC',
    notes:
      'Festo AG & Co. KG "Pressure sensor SPAW-P50R-G12M-2N-M12" (obj. č. 8022774, datový list ' +
      '25.5.2021) — třetí tlakový rozsah ze SPAW rodiny v této knihovně (vedle SPAW-B2R -1 až ' +
      '1 bar, SPAW-B11R -1 až 10 bar a SPAW-P100R 0–100 bar) — typový kód "P50R" značí střední ' +
      'vysokotlaký rozsah 0–50 bar/100 bar přetížení, přesně mezi rozsahy "B11R" a "P100R". ' +
      'Mechanicky a funkčně shodná se SPAW-P100R-G12M-2N-M12 (obj. č. 8022775) v této knihovně ' +
      '(stejný kovový tenkovrstvý princip, stejné celokovové pouzdro ABS+nerez, LED displej, ' +
      'vnější závit G1/2, M12 konektor, 2× NPN volně programovatelný výstup, IP65/67, CRC ' +
      'třída 4) — liší se pouze samotným měřicím rozsahem (0–50 bar místo 0–100 bar). Max. proud ' +
      '250 mA, doba náběhu 3 ms. Zařazeno do kategorie "Modul" jako kompletní přístroj s vlastním ' +
      'displejem/ovládáním/konektorem, stejně jako ostatní Festo SPAW/SPAN/SDE5 tlakové senzory v ' +
      'této knihovně. Teplota média -20 až +85 °C, okolí 0 až +80 °C. Zkratová ochrana, ochrana ' +
      'proti přepólování napájení. Obsahuje látky ovlivňující smáčivost nátěru. Certifikace: ' +
      'c UL us (Listed), CE (EU EMC), RCM. RoHS.',
    tags: 'modul,senzor,tlak,vysokotlaký,tenkovrstvý,npn,festo,spaw-p50r,displej,g12,nerez',
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

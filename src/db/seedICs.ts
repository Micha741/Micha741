import type { ComponentInput } from '../types/component';

interface IcSpec {
  name: string;
  packageType: string;
  value: string;
  notes: string;
  tags: string;
  schematicImage?: string;
}

const IC_SPECS: IcSpec[] = [
  // Časovače
  {
    name: 'NE555',
    packageType:
      'DIP-8/SOIC-8/SO-8/TSSOP-8 (NE555, komerční teplotní rozsah 0 až 70°C), piny: 1=GND, ' +
      '2=TRIG, 3=OUT, 4=RESET, 5=CONT, 6=THRES, 7=DISCH, 8=VCC (standardní pinout, shodný ' +
      'napříč výrobci)',
    value:
      'Přesný časovač (monostabilní/astabilní), napájení 4,5–16 V, výstup (sink/source) do ' +
      '±200 mA, teplotní koeficient časového intervalu 50 ppm/°C (monostabilní)/150 ppm/°C ' +
      '(astabilní)',
    notes:
      'Texas Instruments "NA555, NE555, SA555, SE555 — xx555 Precision Timers" (dok. SLFS022K, ' +
      'září 1973, revidováno březen 2026) — enriched z obecného placeholderu na plné ' +
      'datasheetové specifikace. Univerzální přesný časovací obvod — v monostabilním režimu ' +
      'generuje přesné zpoždění řízené jedním externím RC článkem, v astabilním režimu ' +
      'oscilátor s kmitočtem a střídou nastavitelnými nezávisle dvěma rezistory a ' +
      'kondenzátorem. Vnitřní komparátory: spouštěcí (trigger) úroveň ~1/3 VCC, prahová ' +
      '(threshold) úroveň ~2/3 VCC (obě lze změnit přes pin CONT). RESET má přednost před ' +
      'ostatními vstupy. Když je výstup nízký, DISCH poskytuje nízkoimpedanční cestu k GND pro ' +
      'vybití časovacího kondenzátoru. Absolutní maximum: VCC max 18V, VI (CONT/RESET/THRES/ ' +
      'TRIG) max VCC, IO max ±225mA, TJ max 150°C, Tstg -65 až +150°C. ESD odolnost HBM ±500V, ' +
      'CDM ±1500V. Doporučené provozní podmínky: VCC 4,5-16V (NE555), IO max ±200mA, TA 0-70°C ' +
      '(NE555, komerční verze — sourozenecké verze NA555: -40 až +105°C, SA555: -40 až +85°C, ' +
      'SE555: -55 až +125°C, shodné elektricky, jen jiný teplotní rozsah a VCC max 18V u ' +
      'SE555). THRES napěťová úroveň typ. 3,3V @VCC=5V / 10V @VCC=15V (~2/3 VCC). TRIG napěťová ' +
      'úroveň typ. 1,67V @VCC=5V / 5V @VCC=15V (~1/3 VCC), TRIG proud typ. 0,5µA. RESET ' +
      'napěťová úroveň typ. 0,7V. Výstup nízké úrovně (VOL) typ. 0,1V @IOL=10mA až 2V @IOL=100mA ' +
      '(VCC=15V). Výstup vysoké úrovně (VOH) typ. 13,3V @IOH=-100mA/VCC=15V. Proudový odběr ICC ' +
      'typ. 10mA (výstup nízko, bez zátěže, VCC=15V) / 3mA (VCC=5V). Doba náběhu/doběhu výstupu ' +
      'tr/tf typ. 100ns/max 300ns @CL=15pF. Tepelný odpor přechod-okolí RθJA 125,4°C/W (SOIC-8) ' +
      '/ 98,5°C/W (PDIP-8) / 124,5°C/W (SO-8) / 164,2°C/W (TSSOP-8). Typické zapojení: pulzní ' +
      'tvarovací obvody, detektory chybějícího pulzu, PWM/PPM modulátory, sekvenční časovače, ' +
      'generátory pulzů, kmitočtové děličky, průmyslové řízení.',
    tags: 'io,časovač,555,ne555,oscilátor,pwm,monostabilní,astabilní,ti',
  },
  {
    name: 'NE556',
    packageType: 'DIP-14',
    value: 'Dvojitý časovač 555, 4,5–16 V',
    notes: 'Dvě nezávislé jednotky NE555 v jednom pouzdře — dva časovače/oscilátory na čipu.',
    tags: 'io,časovač,555,oscilátor',
  },
  {
    name: 'TS555',
    packageType: 'SO-8 (SO8 plastové mikropouzdro), piny shodné s NE555: 1=GND, 2=Trigger, ' +
      '3=Output, 4=Reset, 5=Control Voltage, 6=Threshold, 7=Discharge, 8=VCC',
    value:
      'Nízkopříkonový CMOS přesný časovač (monostabilní/astabilní), napájení 2–16 V, klidový ' +
      'proud typ. 110 µA @VCC=5V, max. astabilní kmitočet 2,7 MHz',
    notes:
      'STMicroelectronics "TS555 — Low-power single CMOS timer" (dok. DocID4077 Rev. 4, ' +
      'červen 2015). Pinově a funkčně kompatibilní s bipolárním NE555 (viz jeho záznam v této ' +
      'knihovně pro obecný kontext architektury 555 — trigger/threshold komparátory, RS ' +
      'klopný obvod, výstupní budič, vybíjecí tranzistor DISCH), ale postavený v CMOS ' +
      'technologii namísto bipolární — ⚠️ VÝRAZNĚ NIŽŠÍ SPOTŘEBA (ICC typ. 110µA @5V / 90µA ' +
      '@3V, oproti ~3mA u bipolárního NE555) a VYŠŠÍ MAX. KMITOČET (2,7MHz astabilně, oproti ' +
      '0,1MHz u NE555) — vhodné pro bateriové/nízkopříkonové aplikace a vysokorychlostní ' +
      'časování/generování pulzů, kde by bipolární NE555 byl příliš proudově náročný nebo ' +
      'pomalý. Redukované proudové špičky při přechodech výstupu umožňují menší dekapl ' +
      'kondenzátory než u NE555. Vysoká vstupní impedance (10¹²Ω na Threshold/Trigger) ' +
      'umožňuje použít menší časovací kondenzátory. Výstup kompatibilní s TTL, CMOS a logic ' +
      'MOS. Absolutní maximum: VCC max 18V, IOUT max ±100mA, TJ max 150°C, Tstg -65 až +150°C, ' +
      'RθJA 125°C/W, RθJC 40°C/W. ESD odolnost HBM 1500V, MM 200V, CDM 1000V. Doporučené ' +
      'provozní podmínky: VCC 2-16V, IOUT sink 10mA/source 50mA, Toper -40 až +125°C (širší ' +
      'rozsah než NE555). Elektrické char. @VCC=2V/25°C: ICC typ. 65µA/max 200µA, VCL (control ' +
      'voltage) typ. 1,3V, VDIS (saturační napětí Discharge) typ. 0,05V/max 0,2V @Idis=1mA, ' +
      'VOL typ. 0,1V/max 0,3V @Isink=1mA, VOH typ. 1,9V/min 1,5V @Isource=-0,3mA, VTRIG typ. ' +
      '0,67V, ITRIG/ITH/IRESET typ. 10pA (extrémně nízké díky CMOS vstupům), VRESET typ. 1,1V. ' +
      '@VCC=3V/25°C: ICC typ. 90µA/max 230µA, VCL typ. 2V, VOH typ. 2,9V/min 2,5V. Funkční ' +
      'tabulka RS-FF shodná s klasickým 555 (Reset má přednost před Trigger/Threshold).',
    tags: 'io,časovač,555,ts555,cmos,st,nízkopříkonový,oscilátor,pwm,monostabilní,astabilní',
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

  // Video obvody
  {
    name: 'ISL59837',
    packageType: '16 Ld QSOP (MDP0040)',
    value:
      'Trojitý (RGB/YPbPr) single-supply video buffer/driver s integrovanou nábojovou pumpou, ' +
      'fixní zisk 2×, 200 MHz (-3dB), napájení +3,0 až +3,6 V',
    notes:
      'Renesas/Intersil "ISL59837 — 200MHz Single Supply Video Driver with Charge Pump and Power ' +
      'Down" (FN6335 rev. 1.00, 5.3.2007). Revoluční vlastnost: umožňuje skutečně jednonapájecí ' +
      'provoz video zesilovačů, které potřebují výstup pod úrovní GND (typicky pro NTSC video se ' +
      'synchronizačními impulzy jdoucími do záporu), aniž by byl potřeba záporný zdroj — interní ' +
      'nábojová pumpa (charge pump) generuje zápornou napájecí větev VEE až -1,6 V pod GND (rozsah ' +
      '4,9 V při jediném napájení 3,3 V). DC-přesná vazba na 75Ω zdvojeně zakončené lince, bez ' +
      'výstupního blokovacího kondenzátoru. Tři jednotky s pevným ziskem 2× (6dB), integrovaný ' +
      'gain-setting odpor (netřeba externí rezistory). Napěťová reference (pin REF) posouvá úroveň ' +
      'video signálu na výstupu o zadanou hodnotu (Vout = 2×Vin - Vref). ' +
      'Šířka pásma: 200 MHz (-3dB, Vout=200mVpp), 100 MHz (-3dB, Vout=2Vpp), 0,1dB pásmo 50 MHz. ' +
      'Slew rate min 500 V/µs. Diferenciální zisk 0,07 %, diferenciální fáze 0,06°. Zkřížený ' +
      'přeslech (hostile crosstalk) -90 dB @6MHz, vstup-výstup izolace -70 dB @6MHz. Kmitočet ' +
      'nábojové pumpy typ. 168 MHz. Výstupní proud +80/-40 mA typ (do 10Ω zátěže). Zesílení výkonu ' +
      'chybí (gain error) max 1,5 %, zesílení mezi kanály (matching) max 0,5 %. Napájecí proud typ. ' +
      '97 mA (zapnuto), 60 mA (jen zesilovače vypnuty přes EN), 0,1 mA typ (power-down přes PD — ' +
      'vypne i nábojovou pumpu). Funkce Power-Down (PD, pin 10) vypíná zesilovače i nábojovou ' +
      'pumpu (vyšší úspora), Enable (EN, pin 12, aktivní v L) vypíná jen zesilovače. Turn-off ' +
      'doba cca 25 ns, turn-on cca 200 ns. Výstupy ve vysoké impedanci (500 kΩ typ) v power-down ' +
      'stavu. Bez interní zkratové ochrany — max. výstupní proud ±40 mA trvale (elektromigrační ' +
      'limit), krátkodobě 80 mA (sourcing)/150 mA (sinking) přes interní 10Ω výstupní odpor. ' +
      'Absolutní max.: VCC 5 V (mezi VS a GND), Vin/Vref VCC+0,3V/VEE-0,3V, napětí mezi Vin a Vref ' +
      '±2 V, max. trvalý výstupní proud 30 mA, provozní teplota -40 až +85 °C, Tj max 150 °C, ' +
      'skladovací -65 až +150 °C, pájecí teplota +260 °C. ESD: HBM 2000V, MM 200V. ' +
      'Zapojení pinů (16 Ld QSOP): 1=RIN, 2=GIN, 3=BIN, 4=REF, 5=VEE (substrát, záporné napájení ' +
      'zesilovačů), 6=GND, 7=VEEOUT (výstup nábojové pumpy), 8=DGND (zem nábojové pumpy), ' +
      '9=DVCC (napájení nábojové pumpy), 10=PD (power-down, aktivní H), 11,13=VCC, 12=EN ' +
      '(enable, aktivní L), 14=BOUT, 15=GOUT, 16=ROUT. Doporučené blokování: 4,7µF tantalový + ' +
      '0,1µF keramický na VS-/VCC pin. Pb-free verze dostupná (ISL59837IAZ, ISL59837IAZ-T7 na ' +
      'pásce/cívce 7").',
    tags: 'io,video,zesilovač,buffer,rgb,ypbpr,charge-pump,nábojová-pumpa,renesas,intersil,isl59837,qsop,ntsc',
  },
  {
    name: 'MT9V135C12STC',
    packageType: '48-pin CLCC (Ceramic Leadless Chip Carrier), Pb-free',
    value:
      '1/4" SOC VGA NTSC/PAL CMOS obrazový snímač (kompletní kamerový systém na čipu), 640×480 ' +
      'aktivních pixelů, 30 fps (NTSC)/25 fps (PAL), kompozitní video + LVDS + CCIR 656 výstupy',
    notes:
      'Micron "MT9V135 — 1/4-Inch System-On-A-Chip (SOC) VGA NTSC/PAL CMOS Digital Image Sensor" ' +
      '(dok. MT9V135_LDS, rev. B, 3/2007, Preliminary) — kompletní jednočipový kamerový systém ' +
      '(SOC), vyžaduje jen napájení, objektiv a hodinový signál 27 MHz. Micron DigitalClarity CMOS ' +
      'technologie (nízký šum, CCD-kvalitní obraz při výhodách CMOS — velikost, cena, spotřeba). ' +
      'Interně: sensor core (pixelové pole 695×512, analogový řetězec, 10bit ADC) + Image Flow ' +
      'Processor (IFP, dělí se na colorpipe a camera controller — koriguje barvy/expozici) + ' +
      'NTSC/PAL enkodér a DAC + LVDS formatter. Tři nezávislé/současné výstupní porty: kompozitní ' +
      'analogové video (single-ended nebo diferenciální), LVDS sériový výstup, CCIR 656 ' +
      'prokládaný digitální výstup (paralelní 8bit). Umožňuje současný kompozitní+digitální ' +
      'výstup pro instalaci/zaostření síťových kamer pomocí analogového monitoru. Automatické ' +
      'funkce: auto exposure, auto white balance (AWB), auto black reference (ABR), auto flicker ' +
      'avoidance (50/60Hz), auto color saturation, auto defekt identification/correction (2D). ' +
      'Lens shading correction, barevná korekční matice (CCM) programovatelná uživatelem, gamma ' +
      'korekce, ostření (aperture correction). Barevný filtr RGB Paired Bayer pattern. Elektronická ' +
      'rolling shutter (ERS) závěrka. Konfigurace přes 2vodičové sériové rozhraní (I²C-like). ' +
      'Klíčové parametry: optický formát 1/4" (4:3), aktivní snímací plocha 3,63×2,78mm (4,57mm ' +
      'úhlopříčka), pixel 5,6×5,6µm, NTSC výstup 720×486, PAL výstup 720×576, max. datová rychlost ' +
      '13,5 Mp/s (master clock 27 MHz), integrační čas 16µs-33ms (NTSC)/16µs-40ms (PAL), 10bit ' +
      'ADC, responsivita 5 V/lux-sec @550nm, dynamický rozsah pixelu 70dB, SNRmax 39dB, spotřeba ' +
      '320 mW @2,8V/25°C (v aktivním módu; NTSC/PAL a LVDS nelze provozovat současně), standby ' +
      '0,56 mW. Napájení: I/O digital, core digital i analog 2,5-3,1V (2,8V nominal, všechny musí ' +
      'být na stejném potenciálu VDD=VAA=VAAPIX kvůli proudovým ztrátám). Provozní teplota -30 až ' +
      '+70°C (⚠️ pro širší rozsah teplot výrobce doporučuje příbuzný model MT9V125), skladovací ' +
      '-30 až +125°C. Leakage proud v STANDBY (bez hodin) max 10µA. Video DAC: rozlišení 10 bit, ' +
      'výstupní proud 0,6-37,9mA dle kódu, diferenciální výstupní mid-level 0,72V. ' +
      'Zapojení pinů (48pin CLCC, klíčové): 17=EXTCLK (master clock vstup), 19=RESET_BAR (aktivní ' +
      'L, asynchronní reset), 22=SADDR (volba I2C adresy: 1=0xBA, 0=0x90), 21=SCLK, 20=SDATA, ' +
      '18=STANDBY, 24=HORIZ_FLIP, 25=NTSC_PAL_SELECT, 27=PEDESTAL, 26=LVDS_ENABLE (musí být H pro ' +
      'použití LVDS), 6-13=DIN[7:0] (externí video vstup pro overlay), 14=DIN_CLK, piny ' +
      '1-5,46-48=DOUT[7:0] (CCIR656 výstup), 42=FRAME_VALID, 41=LINE_VALID, 43=PIXCLK, ' +
      '35/33/31=DAC_POS/DAC_NEG/DAC_REF (kompozitní video DAC), 39/38=LVDS_POS/LVDS_NEG, ' +
      '29=AGND, 15/32/37=DGND, 28=VAA, 30=VAAPIX, 16/36=VDD, 34=VDDDAC, 40=VDDPLL. Aplikace: ' +
      'bezpečnostní/CCTV kamery, síťové (IP) kamery s aktivním/pasivním overlay, 900MHz/2,4GHz ' +
      'bezdrátové kamery, "smart" kamery.',
    tags: 'io,senzor,obrazový-senzor,kamera,cmos,soc,vga,ntsc,pal,lvds,ccir656,micron,mt9v135,clcc',
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
    name: 'KA78L05AZ',
    packageType: 'TO-92, 3 vývody: 1=výstup (OUT), 2=GND, 3=vstup (IN)',
    value: 'Pevný LDO lineární regulátor +5 V / max. 100 mA, tolerance ±5 %',
    notes:
      'Fairchild Semiconductor "KA78LXXA/KA78L05AA — 3-Terminal 0.1A Positive Voltage Regulator" ' +
      '(rev. 1.0.4, 2002) — nízkoproudá TO-92 obdoba řady 7805/78xx (ta zvládá 1A, tahle jen ' +
      '100 mA). Součást 9dílné TO-92 modelové řady (KA78L05AZ–KA78L24AZ, tolerance ±5 %), stejný ' +
      'datasheet pokrývá i verze v pouzdrech 8-SOP (KA78L05AD/08AD/12AD) a SOT-89 ' +
      '(KA78L05AM/08AM/12AM) se stejnými elektrickými parametry, jen jiné pouzdro/pinout, a ' +
      'přesnější TO-92 variantu KA78L05AAZ (tolerance ±2 % místo ±5 %) — viz sourozenecké záznamy ' +
      'KA78L06AZ–KA78L24AZ pro zbytek napěťové řady. Tepelná ochrana (thermal shutdown) a proudové ' +
      'omezení (short-circuit protection) integrované na čipu. ' +
      'Výstupní napětí 4,8–5,0–5,2 V (@TJ=25°C). Dropout napětí typ. 1,7 V. Klidový proud (Iq) typ. ' +
      '2,0 mA (max 5,5 mA). Line regulation typ 8 mV (max 150 mV, 7-20V), load regulation typ ' +
      '11 mV (max 60 mV, 1-100mA). Ripple rejection typ 80 dB (min 41 dB) @120Hz. Výstupní šumové ' +
      'napětí typ 40 µV/Vo (10Hz-100kHz). Absolutní max.: Vin 30 V (pro Vo=5V/8V), TJ provozní ' +
      '0 až +150 °C, skladovací -65 až +150 °C. Doporučené blokovací kondenzátory: 0,33 µF na ' +
      'vstupu, 0,1 µF na výstupu (co nejblíže pouzdru).',
    tags: 'io,regulátor,ldo,pevný,fairchild,ka78l,ka78l05az,to-92,5v',
  },
  {
    name: 'KA78L06AZ',
    packageType: 'TO-92, 3 vývody: 1=výstup (OUT), 2=GND, 3=vstup (IN)',
    value: 'Pevný LDO lineární regulátor +6 V / max. 100 mA, tolerance ±5 %',
    notes:
      'Součást 9dílné TO-92 řady KA78LXXA (Fairchild) — viz poznámka u KA78L05AZ pro plné společné ' +
      'specifikace. Výstupní napětí 5,75–6,0–6,25 V. Ripple rejection typ 46 dB (min 40 dB) @120Hz ' +
      '(nižší než ostatní hodnoty řady dle datasheetu).',
    tags: 'io,regulátor,ldo,pevný,fairchild,ka78l,ka78l06az,to-92,6v',
  },
  {
    name: 'KA78L08AZ',
    packageType: 'TO-92, 3 vývody: 1=výstup (OUT), 2=GND, 3=vstup (IN)',
    value: 'Pevný LDO lineární regulátor +8 V / max. 100 mA, tolerance ±5 %',
    notes:
      'Součást 9dílné TO-92 řady KA78LXXA (Fairchild) — viz poznámka u KA78L05AZ pro plné společné ' +
      'specifikace. Výstupní napětí 7,7–8,0–8,3 V. Ripple rejection typ 70 dB (min 39 dB) @120Hz. ' +
      'Dostupná i v pouzdrech 8-SOP (KA78L08AD) a SOT-89 (KA78L08AM).',
    tags: 'io,regulátor,ldo,pevný,fairchild,ka78l,ka78l08az,to-92,8v',
  },
  {
    name: 'KA78L09AZ',
    packageType: 'TO-92, 3 vývody: 1=výstup (OUT), 2=GND, 3=vstup (IN)',
    value: 'Pevný LDO lineární regulátor +9 V / max. 100 mA, tolerance ±5 %',
    notes:
      'Součást 9dílné TO-92 řady KA78LXXA (Fairchild) — viz poznámka u KA78L05AZ pro plné společné ' +
      'specifikace. Výstupní napětí 8,64–9,0–9,36 V. Ripple rejection typ 44 dB (min 38 dB) @120Hz.',
    tags: 'io,regulátor,ldo,pevný,fairchild,ka78l,ka78l09az,to-92,9v',
  },
  {
    name: 'KA78L10AZ',
    packageType: 'TO-92, 3 vývody: 1=výstup (OUT), 2=GND, 3=vstup (IN)',
    value: 'Pevný LDO lineární regulátor +10 V / max. 100 mA, tolerance ±5 %',
    notes:
      'Součást 9dílné TO-92 řady KA78LXXA (Fairchild) — viz poznámka u KA78L05AZ pro plné společné ' +
      'specifikace. Výstupní napětí 9,6–10,0–10,4 V. Ripple rejection typ 43 dB (min 38 dB) @120Hz.',
    tags: 'io,regulátor,ldo,pevný,fairchild,ka78l,ka78l10az,to-92,10v',
  },
  {
    name: 'KA78L12AZ',
    packageType: 'TO-92, 3 vývody: 1=výstup (OUT), 2=GND, 3=vstup (IN)',
    value: 'Pevný LDO lineární regulátor +12 V / max. 100 mA, tolerance ±5 %',
    notes:
      'Součást 9dílné TO-92 řady KA78LXXA (Fairchild) — viz poznámka u KA78L05AZ pro plné společné ' +
      'specifikace. Výstupní napětí 11,5–12,0–12,5 V. Ripple rejection typ 65 dB (min 37 dB) ' +
      '@120Hz. Abs. max Vin=35V (od 12V verze výše). Dostupná i v pouzdrech 8-SOP (KA78L12AD) a ' +
      'SOT-89 (KA78L12AM).',
    tags: 'io,regulátor,ldo,pevný,fairchild,ka78l,ka78l12az,to-92,12v',
  },
  {
    name: 'KA78L15AZ',
    packageType: 'TO-92, 3 vývody: 1=výstup (OUT), 2=GND, 3=vstup (IN)',
    value: 'Pevný LDO lineární regulátor +15 V / max. 100 mA, tolerance ±5 %',
    notes:
      'Součást 9dílné TO-92 řady KA78LXXA (Fairchild) — viz poznámka u KA78L05AZ pro plné společné ' +
      'specifikace. Výstupní napětí 14,4–15,0–15,6 V. Ripple rejection typ 60 dB (min 34 dB) ' +
      '@120Hz. Abs. max Vin=35V.',
    tags: 'io,regulátor,ldo,pevný,fairchild,ka78l,ka78l15az,to-92,15v',
  },
  {
    name: 'KA78L18AZ',
    packageType: 'TO-92, 3 vývody: 1=výstup (OUT), 2=GND, 3=vstup (IN)',
    value: 'Pevný LDO lineární regulátor +18 V / max. 100 mA, tolerance ±5 %',
    notes:
      'Součást 9dílné TO-92 řady KA78LXXA (Fairchild) — viz poznámka u KA78L05AZ pro plné společné ' +
      'specifikace. Výstupní napětí 17,3–18,0–18,7 V. Ripple rejection typ 48 dB (min 34 dB) ' +
      '@120Hz. Abs. max Vin=35V.',
    tags: 'io,regulátor,ldo,pevný,fairchild,ka78l,ka78l18az,to-92,18v',
  },
  {
    name: 'KA78L24AZ',
    packageType: 'TO-92, 3 vývody: 1=výstup (OUT), 2=GND, 3=vstup (IN)',
    value: 'Pevný LDO lineární regulátor +24 V / max. 100 mA, tolerance ±5 %',
    notes:
      'Součást 9dílné TO-92 řady KA78LXXA (Fairchild) — viz poznámka u KA78L05AZ pro plné společné ' +
      'specifikace. Výstupní napětí 23–24–25 V (@TJ=25°C). Line regulation typ 160 mV (max 300 mV, ' +
      '27-38V), load regulation typ 40 mV (max 200 mV, 1-100mA). Ripple rejection typ 45 dB (min ' +
      '34 dB) @120Hz. Klidový proud typ 2,2 mA (max 6,0 mA). Nejvyšší napěťová varianta řady — abs. ' +
      'max Vin=40 V (jediná v této hodnotě, ostatní verze 30 nebo 35 V).',
    tags: 'io,regulátor,ldo,pevný,fairchild,ka78l,ka78l24az,to-92,24v',
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
    packageType:
      'TO-220 (T suffix, case 221AB/221A) — vývody: 1=ADJ, 2=výstup (Vout), 3=vstup (Vin), ' +
      'chladicí ploška spojena s pinem 2 (Vout); dostupné i v D²PAK-3 (D2T suffix, case 936, ' +
      'stejný pinout a stejně spojená chladicí ploška)',
    schematicImage: 'LM317.jpg',
    value:
      'Nastavitelný kladný lineární regulátor, výstup 1,2 až 37 V, výstupní proud přes 1,5 A, ' +
      'Vref 1,25 V typ.',
    notes:
      'onsemi "LM317, NCV317 — Voltage Regulator, Adjustable Output, Positive, 1.5 A" (dok. ' +
      'LM317/D, rev. 18, 2026) — nastavitelný kladný regulátor, výstupní napětí se nastavuje ' +
      'odporovým děličem mezi Vout a Adjust (Vout = Vref×(1+R2/R1) + IAdj×R2, Vref=1,25V typ). ' +
      'Interní tepelná ochrana (thermal shutdown, typ 180°C), zkratová proudová ochrana s ' +
      'teplotní kompenzací, safe-area kompenzace výstupního tranzistoru, plovoucí (floating) ' +
      'zapojení umožňuje provoz i při vysokých napětích vůči zemi. ⚠️ Existuje automotive verze ' +
      'NCV317 (AEC-Q100, PPAP capable, širší teplotní rozsah TJ -55 až +150°C) se stejnými ' +
      'elektrickými parametry. ' +
      'Mezní hodnoty: VI-VO=-0,3 až 40 V. TJ provozní 0 až +125°C (T/D2T standard), -40 až +125°C ' +
      '(BT/BD2T), nebo -55 až +150°C (NCV317 BT/BD2T). Tstg -65 až +150°C. PD interně omezen, ' +
      'θJA=65°C/W, θJC=5,0°C/W (TO-220); θJA=70°C/W, θJC=5,0°C/W (D²PAK-3). ' +
      'Vref min 1,2 V/typ 1,25 V/max 1,3 V (3,0≤VI-VO≤40V, 10mA≤IO≤Imax). Line regulation typ ' +
      '0,01 %/V (max 0,04 %/V, 3,0≤VI-VO≤40V). Load regulation (VO≤5V) typ 5,0 mV (max 25 mV); ' +
      '(VO≥5V) typ 0,1 %VO (max 0,5 %VO), 10mA≤IO≤Imax. Thermal regulation typ 0,03 %VO/W (max ' +
      '0,07 %VO/W, 20ms pulz). Proud pinu Adjust typ 50 µA (max 100 µA), jeho změna ΔIAdj typ ' +
      '0,2 µA (max 5,0 µA). Minimální zátěžový proud pro udržení regulace typ 3,5 mA (max 10 mA, ' +
      'VI-VO=40V). Imax (T pouzdro): typ 2,2 A/min 1,5 A @VI-VO≤15V; typ 0,4 A/min 0,15 A ' +
      '@VI-VO=40V/TA=25°C. RMS šum typ 0,003 %VO. Ripple rejection (VO=10V/f=120Hz): typ 65 dB ' +
      'bez CAdj, typ 80 dB s CAdj=10µF. Dlouhodobá stabilita typ 0,3 %VO/1000h (max 1,0 %VO/1000h). ' +
      'Doporučené externí součástky: Cin=0,1µF (pokud je regulátor dál od filtračního ' +
      'kondenzátoru zdroje), Co=1,0µF (zlepšuje přechodovou odezvu, není nutný pro stabilitu), ' +
      'R1 typicky 240Ω. Ochranné diody (1N400x) doporučeny při Vout>25V nebo Co>25µF/CAdj>10µF, ' +
      'aby se kondenzátory nevybíjely zpět do IC při zkratu vstupu/výstupu. Pb-free, halogen/BFR ' +
      'free, RoHS.',
    tags: 'io,regulátor,lm317,ncv317,napájení,nastavitelný,onsemi,to-220,d2pak',
  },
  {
    name: 'LM337',
    packageType: 'TO-220 — vývody: 1=ADJ, 2=výstup (OUT), 3=vstup (IN)',
    value: 'Nastavitelný lineární regulátor -1,25 až -37 V / 1,5 A',
    notes: 'Záporná obdoba LM317, pro symetrická napájení operačních zesilovačů.',
    tags: 'io,regulátor,lm337,napájení,nastavitelný',
  },
  {
    name: 'L1117L',
    packageType: 'SOT-223 (SMD), 3 vývody: 1=Adjust/GND, 2=výstup (OUT, i TAB), 3=vstup (IN)',
    value: 'Nastavitelný LDO lineární regulátor, VREF=1,25 V, 1 A, dropout 1,2 V typ. (max 1,45 V @1 A)',
    notes:
      'NIKO-SEM "L1117 Series — 1A Fixed and Adjustable Low Dropout Linear Regulator (LDO)" ' +
      '(dok. FN..., rev. 27.7.2001). Nízkoúbytkový (LDO) regulátor s referencí trimovanou na ±2 %. ' +
      'Chráněn proti nadproudu, přehřátí, přepólování vstupu i obráceně vloženým vývodům, přepětím. ' +
      'Součást 12dílné modelové řady lišící se pouzdrem (SOT-223/TO-220/TO-252/TO-263) a výstupním ' +
      'napětím (nastavitelné ADJ, nebo pevné 2,5/2,85/3,3/5 V) — viz sourozenecké záznamy L1117D, ' +
      'L1117L-2.5, L1117L-2.85, L1117L-3.3, L1117D-3.3, L1117L-5, L1117D-5, L1117T, L1117T-3.3, ' +
      'L1117T-5, L1117S-5. Tento model (L1117L, SOT-223, ADJ) je základní/referenční záznam s ' +
      'plnými specifikacemi společnými pro celou řadu. ' +
      'Reference VREF 1,25 V typ. (1,23–1,27 V), nastavení výstupu Vo = Vref×(1+R2/R1) + Iadj×R2. ' +
      'Line regulation 0,5 % typ (max 2 %), load regulation 0,5 % typ (max 2,5 %, ADJ verze; ' +
      '0,5–2,0 % dle napětí u fixních verzí). Proud pinu Adjust 55 µA typ (max 100 µA). Proudové ' +
      'omezení 1,2 A typ (min 1,1 A) @Vin-Vout=2V. RMS výstupní šum 0,003 % Vout. Ripple rejection ' +
      '72 dB typ (min 60 dB) @120Hz, Cadj/Co=22µF. Minimální zátěžový proud 10 mA. ' +
      'Absolutní max.: Vin max 15 V (⚠️ při trvalém zkratu na GND a Vin>10V nesmí rozdíl Vin-Vout ' +
      'překročit cca 2-3V, jinak hrozí překročení ztrátového výkonu a zničení součástky), Tj ' +
      'provozní 0 až 125 °C, skladovací -40 až 150 °C, pájecí teplota (10s) 260 °C. ' +
      'θJC (junction-to-case) 16 °C/W shodné pro všechna pouzdra. θJA (junction-to-ambient): ' +
      'SOT-223 158 °C/W, TO-252 70 °C/W, TO-220 50 °C/W, TO-263 60 °C/W. ' +
      'Pinout shodný napříč pouzdry: 1=Adjust/GND (u fixních verzí = GND), 2=výstup (OUT, shodné ' +
      's TAB pouzdra), 3=vstup (IN). Aplikace: 2,85V aktivní SCSI terminátory, 8-15V→5V regulace, ' +
      '5V→2,5V/3,3V regulace, nízkonapěťové mikrokontroléry, nabíječky baterií, post-regulátor za ' +
      'spínaným zdrojem. Typické zapojení vyžaduje Cin 10µF a Cout 10-22µF (elektrolytické/ ' +
      'tantalové) pro stabilitu.',
    tags: 'io,regulátor,ldo,nastavitelný,niko-sem,l1117,l1117l,sot-223',
  },
  {
    name: 'L1117D',
    packageType: 'TO-252/DPAK (SMD), 3 vývody: 1=Adjust/GND, 2=výstup (OUT, i TAB), 3=vstup (IN)',
    value: 'Nastavitelný LDO lineární regulátor, VREF=1,25 V, 1 A, dropout 1,2 V typ. (max 1,45 V @1 A)',
    notes:
      'Součást 12dílné rodiny L1117 (NIKO-SEM LDO regulátor) — TO-252 verze nastavitelného (ADJ) ' +
      'modelu, elektricky shodná s L1117L (SOT-223). Viz poznámka u L1117L pro plné společné ' +
      'specifikace. θJA (TO-252) = 70 °C/W.',
    tags: 'io,regulátor,ldo,nastavitelný,niko-sem,l1117,l1117d,to-252',
  },
  {
    name: 'L1117L-2.5',
    packageType: 'SOT-223 (SMD), 3 vývody: 1=GND, 2=výstup (OUT, i TAB), 3=vstup (IN)',
    value: 'Pevný LDO lineární regulátor +2,5 V, 1 A, dropout 1,2 V typ. (max 1,45 V @1 A)',
    notes:
      'Součást 12dílné rodiny L1117 (NIKO-SEM LDO regulátor) — pevná 2,5V verze v SOT-223. Viz ' +
      'poznámka u L1117L pro plné společné specifikace. Výstupní napětí 2,45–2,55 V (@Vin=5V, ' +
      'Iout=10mA).',
    tags: 'io,regulátor,ldo,pevný,niko-sem,l1117,l1117l-2.5,sot-223,2.5v',
  },
  {
    name: 'L1117L-2.85',
    packageType: 'SOT-223 (SMD), 3 vývody: 1=GND, 2=výstup (OUT, i TAB), 3=vstup (IN)',
    value: 'Pevný LDO lineární regulátor +2,85 V, 1 A, dropout 1,2 V typ. (max 1,45 V @1 A)',
    notes:
      'Součást 12dílné rodiny L1117 (NIKO-SEM LDO regulátor) — pevná 2,85V verze v SOT-223, ' +
      'určená mj. pro aktivní SCSI terminátory (18-27 linek). Viz poznámka u L1117L pro plné ' +
      'společné specifikace. Výstupní napětí 2,793–2,907 V (@Vin=5V, Iout=10mA), max Vin pro tuto ' +
      'variantu jen 8V (ne 15V jako ostatní).',
    tags: 'io,regulátor,ldo,pevný,niko-sem,l1117,l1117l-2.85,sot-223,scsi',
  },
  {
    name: 'L1117L-3.3',
    packageType: 'SOT-223 (SMD), 3 vývody: 1=GND, 2=výstup (OUT, i TAB), 3=vstup (IN)',
    value: 'Pevný LDO lineární regulátor +3,3 V, 1 A, dropout 1,2 V typ. (max 1,45 V @1 A)',
    notes:
      'Součást 12dílné rodiny L1117 (NIKO-SEM LDO regulátor) — pevná 3,3V verze v SOT-223, časté ' +
      'napájení pro FPGA/mikrokontroléry z 5V. Viz poznámka u L1117L pro plné společné specifikace. ' +
      'Výstupní napětí 3,234–3,367 V (@Vin=5V, Iout=10mA).',
    tags: 'io,regulátor,ldo,pevný,niko-sem,l1117,l1117l-3.3,sot-223,3.3v',
  },
  {
    name: 'L1117D-3.3',
    packageType: 'TO-252/DPAK (SMD), 3 vývody: 1=GND, 2=výstup (OUT, i TAB), 3=vstup (IN)',
    value: 'Pevný LDO lineární regulátor +3,3 V, 1 A, dropout 1,2 V typ. (max 1,45 V @1 A)',
    notes:
      'Součást 12dílné rodiny L1117 (NIKO-SEM LDO regulátor) — TO-252 verze pevné 3,3V varianty, ' +
      'elektricky shodná s L1117L-3.3. Viz poznámka u L1117L pro plné společné specifikace. θJA ' +
      '(TO-252) = 70 °C/W.',
    tags: 'io,regulátor,ldo,pevný,niko-sem,l1117,l1117d-3.3,to-252,3.3v',
  },
  {
    name: 'L1117L-5',
    packageType: 'SOT-223 (SMD), 3 vývody: 1=GND, 2=výstup (OUT, i TAB), 3=vstup (IN)',
    value: 'Pevný LDO lineární regulátor +5 V, 1 A, dropout 1,2 V typ. (max 1,45 V @1 A)',
    notes:
      'Součást 12dílné rodiny L1117 (NIKO-SEM LDO regulátor) — pevná 5V verze v SOT-223. Viz ' +
      'poznámka u L1117L pro plné společné specifikace. Výstupní napětí 4,90–5,10 V (@Vin=8V, ' +
      'Iout=10mA), vyžaduje Vin>6,5V.',
    tags: 'io,regulátor,ldo,pevný,niko-sem,l1117,l1117l-5,sot-223,5v',
  },
  {
    name: 'L1117D-5',
    packageType: 'TO-252/DPAK (SMD), 3 vývody: 1=GND, 2=výstup (OUT, i TAB), 3=vstup (IN)',
    value: 'Pevný LDO lineární regulátor +5 V, 1 A, dropout 1,2 V typ. (max 1,45 V @1 A)',
    notes:
      'Součást 12dílné rodiny L1117 (NIKO-SEM LDO regulátor) — TO-252 verze pevné 5V varianty, ' +
      'elektricky shodná s L1117L-5. Viz poznámka u L1117L pro plné společné specifikace. θJA ' +
      '(TO-252) = 70 °C/W.',
    tags: 'io,regulátor,ldo,pevný,niko-sem,l1117,l1117d-5,to-252,5v',
  },
  {
    name: 'L1117T',
    packageType: 'TO-220, 3 vývody: 1=Adjust/GND, 2=výstup (OUT, i TAB), 3=vstup (IN)',
    value: 'Nastavitelný LDO lineární regulátor, VREF=1,25 V, 1 A, dropout 1,2 V typ. (max 1,45 V @1 A)',
    notes:
      'Součást 12dílné rodiny L1117 (NIKO-SEM LDO regulátor) — TO-220 verze nastavitelného (ADJ) ' +
      'modelu, elektricky shodná s L1117L (SOT-223). Viz poznámka u L1117L pro plné společné ' +
      'specifikace. θJA (TO-220) = 50 °C/W (nejnižší z celé řady).',
    tags: 'io,regulátor,ldo,nastavitelný,niko-sem,l1117,l1117t,to-220',
  },
  {
    name: 'L1117T-3.3',
    packageType: 'TO-220, 3 vývody: 1=GND, 2=výstup (OUT, i TAB), 3=vstup (IN)',
    value: 'Pevný LDO lineární regulátor +3,3 V, 1 A, dropout 1,2 V typ. (max 1,45 V @1 A)',
    notes:
      'Součást 12dílné rodiny L1117 (NIKO-SEM LDO regulátor) — TO-220 verze pevné 3,3V varianty. ' +
      'Viz poznámka u L1117L pro plné společné specifikace. θJA (TO-220) = 50 °C/W.',
    tags: 'io,regulátor,ldo,pevný,niko-sem,l1117,l1117t-3.3,to-220,3.3v',
  },
  {
    name: 'L1117T-5',
    packageType: 'TO-220, 3 vývody: 1=GND, 2=výstup (OUT, i TAB), 3=vstup (IN)',
    value: 'Pevný LDO lineární regulátor +5 V, 1 A, dropout 1,2 V typ. (max 1,45 V @1 A)',
    notes:
      'Součást 12dílné rodiny L1117 (NIKO-SEM LDO regulátor) — TO-220 verze pevné 5V varianty. ' +
      'Viz poznámka u L1117L pro plné společné specifikace. θJA (TO-220) = 50 °C/W.',
    tags: 'io,regulátor,ldo,pevný,niko-sem,l1117,l1117t-5,to-220,5v',
  },
  {
    name: 'L1117S-5',
    packageType: 'TO-263/D²PAK (SMD), 3 vývody: 1=GND, 2=výstup (OUT, i TAB), 3=vstup (IN)',
    value: 'Pevný LDO lineární regulátor +5 V, 1 A, dropout 1,2 V typ. (max 1,45 V @1 A)',
    notes:
      'Součást 12dílné rodiny L1117 (NIKO-SEM LDO regulátor) — TO-263 (D²PAK, SMD) verze pevné 5V ' +
      'varianty, jediná v pouzdru pro povrchovou montáž s výkonovou tabulí. Viz poznámka u L1117L ' +
      'pro plné společné specifikace. θJA (TO-263) = 60 °C/W.',
    tags: 'io,regulátor,ldo,pevný,niko-sem,l1117,l1117s-5,to-263,d2pak,5v,smd',
  },

  // Spínané napájecí řadiče
  {
    name: 'TPS51716',
    packageType: '20-pin QFN (RUK), 3×3 mm, s termální podložkou (thermal pad na GND)',
    value:
      'Kompletní napájecí řešení pro DDR2/DDR3/DDR3L/LPDDR3 paměti: synchronní buck řadič ' +
      '(VDDQ) + 2A sink/source sledovací LDO (VTT) + pufferovaná reference (VTTREF)',
    schematicImage: 'TPS51716.jpg',
    notes:
      'Texas Instruments "TPS51716 — Complete DDR2, DDR3, DDR3L, and LPDDR3 Memory Power ' +
      'Solution" (dok. SLUSB94, říjen 2012). Integruje synchronní buck regulátor (D-CAP2™ mód, ' +
      'bez potřeby externí kompenzace, funguje jen s keramickými výstupními kondenzátory) pro ' +
      'VDDQ (0,7–1,8 V, konverzní napětí 3–28 V), sledovací LDO pro VTT (sleduje VDDQ/2 s ±0,8% ' +
      'přesností, 2A špičkový zdrojový/propadový proud, stačí jen 10 µF keramický výstupní ' +
      'kondenzátor) a pufferovaný nízkošumový výstup VTTREF (10 mA, ±0,8% přesnost). Přepínatelná ' +
      'spínací frekvence 500 kHz nebo 670 kHz (volba rezistorem na pin MODE). Auto-skip funkce pro ' +
      'optimalizaci účinnosti při lehké zátěži. Podporuje soft-off (postupné vybití VDDQ/VTT/ ' +
      'VTTREF) ve stavech S4/S5, vysokou impedanci výstupů ve stavu S3. Ochrany: OCL/OCP (nastavení ' +
      'rezistorem na pin TRIP, sense přes RDS(on) spodního FETu), negative OCL, OVP (120% typ), UVP ' +
      '(68% typ), V5IN UVLO (4,4V typ wake-up/3,9V shutdown), tepelná ochrana (140°C typ, ' +
      'hystereze 10°C). Powergood výstup (PGOOD, open-drain) sleduje VDDQ v rozsahu 92-108% ' +
      '(vstup) / 84-116% (výstup z okna). ' +
      'Absolutní max.: VBST -0,3 až 36V (33,5V doporučeno max), SW -5 až 30V, VLDOIN/VDDQSNS/REFIN/ ' +
      'VTTSNS -0,3 až 3,6V, V5IN/S3/S5/TRIP/MODE -0,3 až 6V, TJ 125°C, Tstg -55 až +150°C. ' +
      'Doporučené provozní podmínky: V5IN 4,5-5,5V, TA -40 až +85°C. ' +
      'Klidová spotřeba V5IN: 590 µA (S0, no load), 500 µA (S3), 1 µA (shutdown). VLDOIN: 5 µA ' +
      '(S0/S3), 5 µA (shutdown). ' +
      'Zapojení pinů (20-pin QFN): 1=VTTSNS, 2=VLDOIN, 3=VTT (výstup), 4=VTTGND, 5=VTTREF (výstup), ' +
      '6=VREF (1,8V referenční výstup), 7=GND, 8=REFIN (referenční vstup pro VDDQ, typ. dělič z ' +
      'VREF), 9=VDDQSNS, 10=PGND, 11=DRVL (výstup budiče spodního FETu), 12=V5IN (5V napájení ' +
      'budičů a logiky), 13=SW, 14=DRVH (výstup budiče horního FETu), 15=VBST (bootstrap), ' +
      '16=S5, 17=S3, 18=TRIP, 19=MODE, 20=PGOOD, + termální podložka (GND, nutno propojit vícero ' +
      'prokovy na zemní rovinu). Aplikace: napájení DDR2/DDR3/DDR3L/LPDDR3 pamětí, SSTL_18/15/135 ' +
      'a HSTL terminace.',
    tags: 'io,řadič,spínaný-zdroj,buck,ldo,ddr,vtt,vddq,pamětový-zdroj,texas-instruments,ti,tps51716,qfn,d-cap2',
  },

  // Napájecí spínače (load switch)
  {
    name: 'NCP330MUTBG',
    packageType: 'UDFN4 (1,2×1,6 mm, rozteč 0,5 mm), exponovaná ploška PAD1',
    schematicImage: 'NCP330MUTBG.jpg',
    value:
      'Napájecí spínač (load switch) s pozvolným náběhem (soft-start), N-MOSFET RDS(on) 26 mΩ ' +
      'typ., DC proud až 3 A, VIN 1,8–5,5 V',
    notes:
      'onsemi (ON Semiconductor) "NCP330/NCV330 — Soft-Start Controlled Load Switch" (dok. ' +
      'NCP330/D, rev. 4, 2026). Vysoký-side N-kanálový MOSFET spínač pro připojení/odpojení ' +
      'napájecí větve (např. baterie k systému, USB port) s řízeným náběhem 2 ms, aby se omezily ' +
      'proudové/napěťové špičky. Automaticky se zapne přivedením napětí na pin IN (aktivní High ' +
      'na EN, interní pull-down drží vypnuto bez napájení). Nízký RDS(on) 26 mΩ typ. (max 50 mΩ ' +
      'v celém teplotním rozsahu) umožňuje trvalý proud až 3 A, špičkový až 5 A (1 ms @217 Hz, ' +
      'GSM kalibrace). Ochrana proti zpětnému napětí (reverse voltage protection) — tělová dioda ' +
      'MOSFETu brání vybíjení výstupu zpět do vstupu při vypnutém stavu. Nízký klidový odběr ' +
      '(100 µA typ., 200 µA max, no load) pro dlouhou výdrž baterie. Aktivní High se integrovaným ' +
      'můstkem (active High with integrated bridge). ' +
      'Elektrické parametry: VIN 1,8–5,5 V, RDS(on) 26 mΩ typ. @VIN=3V nebo 5V/TJ=25°C (max 50 mΩ ' +
      'v celém rozsahu -40 až 125°C), Ton (zapnutí) 2 ms typ. (0,5-4 ms dle podmínek), Tr/Tf ' +
      '(nástupná/sestupná hrana výstupu) 2 ms typ., VIH (log. 1 na EN) min 1,15 V, VIL (log. 0) ' +
      'max 0,85 V, IREV (zpětný proud při VIN=0V/Vout=4,2V) 0,15 µA typ. (max 1 µA), Iq (klidový ' +
      'odběr, no load) 100 µA typ. (max 200 µA). Doporučené blokovací kondenzátory: min 1 µF na ' +
      'IN i OUT (co nejblíže pouzdru), pro shodu s IEC61000-4-2 úroveň 4. ' +
      'Absolutní max.: VIN/VOUT/VEN -0,3 až +7,0 V, VIN-VOUT (mezi piny) -7,0 až +7,0 V, ESD IEC ' +
      '61000-4-2 15 kV (vzduchový výboj)/8 kV (kontaktní, s 1µF blokováním), ESD HBM 4000V, ESD MM ' +
      '200V, latch-up ±100 mA, TJ -40 až +125°C, Tstg -40 až +150°C, MSL 1. Compliance IEC61000-4-2 ' +
      'úroveň 4 (8kV kontakt/15kV vzduch). ' +
      'Zapojení pinů (UDFN4): 1=IN (vstupní napětí spínače, přes 1µF blokovací C ke GND), 2=GND, ' +
      '3=EN (enable vstup, log. H zapíná), 4=OUT (výstup spínače, přes 1µF blokovací C ke GND), ' +
      'PAD1=exponovaná ploška (propojit na GND rovinu kvůli chlazení). Značení na pouzdře: "3A M" ' +
      '(NCP330) nebo "3V M" (NCV330 — automotive verze, AEC-Q100). Aplikace: mobilní telefony, ' +
      'tablety, digitální fotoaparáty, GPS, počítače — spínání napájení z baterie/USB do systému.',
    tags: 'io,spínač,load-switch,napájecí-spínač,soft-start,mosfet,onsemi,ncp330,ncv330,udfn4',
  },

  // Napájecí/osvětlovací řadiče
  {
    name: 'IRS2580DSPbF',
    packageType: '8pin SOIC',
    value:
      '"COMBO8" — kombinovaný PFC (boost, critical-conduction mode) + poloviční most (half-bridge) ' +
      'řadič pro elektronické předřadníky (balastní jednotky) zářivek, VOFFSET 600 V',
    notes:
      'International Rectifier "IRS2580DSPbF — COMBO8 PFC + Half-Bridge Ballast IC" (produktový ' +
      'přehled, 2011) — ⚠️ jde jen o jednostránkový produktový souhrn (product summary), ne o ' +
      'plný datasheet s tabulkou vývodů a elektrickými parametry — pro detailní návrh (přesné meze, ' +
      'zapojení pinů 1-8) je potřeba plný datasheet od výrobce (dnes Infineon, po akvizici IR). ' +
      'Integruje v jednom čipu: PFC řadič (kritický vodivostní režim, boost topologie, interní ' +
      'snímání a regulace VBUS, interní kompenzace smyčky, programovatelná nadproudová ochrana) + ' +
      'řadič předřadníku zářivky (ballast control) + budič polovičního mostu (half-bridge driver). ' +
      'Funkce: regulace zapalovacího napětí (proudová nebo napěťová), ochrana proti non-ZVS ' +
      '(zero-voltage switching) polovičního mostu, nadproudová ochrana mostu přes RDS(on) spodního ' +
      'MOSFETu, programovatelná doba/kmitočet předehřevu (preheat), programovatelná rampa zapálení ' +
      '(ignition ramp), programovatelný běžný kmitočet (run frequency), analogový VCO vstup, ' +
      'latchovaný EOL (end-of-life) okenní komparátor na VCC s interním EOL časovačem, pevná mrtvá ' +
      'doba (dead-time) 1,7 µs typ., podpětová ochrana DC sběrnice s resetem, auto-restart při ' +
      'vložení lampy, mikro-výkonový start-up proud, UVLO (under-voltage lock-out) režim. ' +
      'Topologie: Boost (PFC) + Half-Bridge (rezonanční výstup pro lampu). VOFFSET 600 V (max. ' +
      'napětí mezi VS a COM/GND budiče horního spínače). Výstupní budicí proud IO+ 180 mA / IO- ' +
      '260 mA (typ.). Bezolovnaté (Pb-free) provedení. Typická aplikace: elektronický předřadník ' +
      '(balast) zářivkových trubic — blokové schéma: EMI filtr → usměrňovač → Boost PFC → ' +
      'rezonanční výstupní obvod (half-bridge) → lampa, s řídicím IC poskytujícím PFC control, ' +
      'UVLO, Resonant control a zpracování Lamp Fault signálu.',
    tags: 'io,řadič,ballast,pfc,half-bridge,předřadník,zářivka,international-rectifier,ir,irs2580,soic',
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
    packageType:
      'DIP-16/SOIC-16/SSOP-16/TSSOP-16 (SN74HC595, komerční teplotní rozsah -40 až +85°C) nebo ' +
      'CDIP-16/LCCC-20 (SN54HC595, vojenský rozsah -55 až +125°C), piny: 1-7=QB-QH, 8=GND, ' +
      '9=QH\' (sériový výstup pro kaskádování), 10=SRCLR (aktivní v L, přímý reset posuvného ' +
      'registru), 11=SRCLK (hodiny posuvného registru), 12=RCLK (hodiny paměťového registru/ ' +
      'latch), 13=OE (aktivní v L, povolení výstupů), 14=SER (sériový vstup), 15=QA, 16=VCC',
    value:
      '8bitový sériově vstupní/paralelně výstupní posuvný registr s výstupním registrem se ' +
      '3-stavovými výstupy, napájení 2–6 V, IOH/IOL do ±6mA @5V (do 15 LSTTL zátěží)',
    notes:
      'Texas Instruments "SN54HC595, SN74HC595 — SNx4HC595 8-Bit Shift Registers With 3-State ' +
      'Output Registers" (dok. SCLS041J, prosinec 1982, revidováno říjen 2021) — enriched z ' +
      'obecného placeholderu na plné datasheetové specifikace. Velmi časté řešení pro rozšíření ' +
      'počtu výstupů mikrokontroléru přes 3 piny (SER/data, SRCLK/clock, RCLK/latch) — obsahuje ' +
      'DVA nezávislé registry: 8bitový posuvný registr (plněný na SRCLK, s přímým vstupem SRCLR ' +
      'pro reset) a 8bitový D-typ paměťový (storage/latch) registr s odděleným hodinovým ' +
      'vstupem RCLK, jehož 3-stavové výstupy se ovládají signálem OE — díky oddělení posuvu od ' +
      'zápisu na výstup lze plnit registr, aniž by se měnil aktuální stav výstupů, a teprve ' +
      'jedním impulzem RCLK "překlopit" nový obsah na výstupy najednou. Sériový výstup QH\' ' +
      '(pin 9) umožňuje řetězení (kaskádování) libovolného počtu kusů za sebou — typicky pro ' +
      'ovládání LED, displejů, relé apod. Absolutní maximum: VCC -0,5 až 7V, vstupní/výstupní ' +
      'svorkovací proud ±20mA, trvalý výstupní proud ±35mA/pin (±70mA přes VCC/GND celkem), TJ ' +
      'max 150°C. ESD odolnost HBM 2000V/CDM 1000V. Doporučené provozní podmínky: VCC 2-6V, ' +
      'VIH min 1,5V@2V/3,15V@4,5V/4,2V@6V, VIL max 0,5V@2V/1,35V@4,5V/1,8V@6V. Výstupní napětí ' +
      '(SN74HC595, TA=25°C): VOH min 4,4V@4,5V/IOH=-4mA nebo 5,8V@6V/IOH=-5,2mA (na výstupu QA ' +
      'proti ostatním o 2mA nižší zátěž kvůli sdílenému výstupnímu tranzistoru); VOL max ' +
      '0,4V@4,5V/IOL=4mA nebo 0,33V@6V/IOL=5,2mA. Vstupní proud II max ±1000nA @VCC=6V ' +
      '(SN74HC595, TA=25°C). Proudový odběr ICC max 80µA @VCC=6V/VI=VCC nebo 0/IO=0. Vstupní ' +
      'kapacita CI max 10pF. Kmitočet hodin fclock: SN74HC595 min 25MHz @4,5V / 29MHz @6V / ' +
      '5MHz @2V. Tepelný odpor přechod-okolí RθJA: 73°C/W (SOIC-16) / 108°C/W (TSSOP-16) / ' +
      '67°C/W (PDIP-16) dle konkrétního pouzdra. Provozní teplota SN74HC595: -40 až +85°C.',
    tags: 'io,logika,74hc595,posuvný-registr,shift-register,3-state,latch,led,ti',
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
    packageType:
      'DIP-18, 18 vývodů: 1-8=IN1-8, 9=GND, 10=společné zpětné (flyback) diody, 11-18=OUT8-1 ' +
      '(pořadí výstupů zrcadlově obráceno vůči vstupům pro snadnější návrh DPS)',
    value:
      '8× Darlingtonův budič se společnými emitory, kolektorový proud 500 mA trvale/600 mA ' +
      'špičkově na kanál, výstupní napětí do 50 V, vstupní odpor 2,7 kΩ (verze pro 5V TTL/CMOS)',
    schematicImage: 'ULN2803.jpg',
    notes:
      'STMicroelectronics "ULN2801A, ULN2802A, ULN2803A, ULN2804A — Eight Darlington array" ' +
      '(dok. DocID1536 Rev. 3, listopad 2012) — konkrétně varianta ULN2803A (vstupní odpor ' +
      '2,7kΩ, optimalizováno pro 5V TTL/CMOS logiku). Osm Darlingtonových tranzistorů se ' +
      'společnými emitory a vestavěnými zpětnými (flyback/suppression) diodami se společnou ' +
      'katodou (pin 10) — pro spínání induktivních zátěží (relé, solenoidy) přímo z logického ' +
      'výstupu bez nutnosti vnější ochranné diody. Výstupy lze paralelizovat pro vyšší proudovou ' +
      'kapacitu. Součást rodiny ULN2801A/2802A/2803A/2804A lišící se jen vstupním odporovým ' +
      'děličem pro různé logické rodiny (viz sourozenecké záznamy "ULN2801A"/"ULN2802A"/ ' +
      '"ULN2804A" v této knihovně) — jinak elektricky i mechanicky shodné. IC(max) 500mA (trvale) ' +
      '/600mA (špičkově), IB(max) 25mA, VO(max) 50V, Ptot 1W/pár (2,25W celé pouzdro), hFE min ' +
      '1000 @VCE=2V/IC=350mA. VCE(sat): 0,9-1,1V @IC=100mA, 1,1-1,3V @IC=200mA, 1,3-1,6V ' +
      '@IC=350mA. Vstupní proud II(ON) 0,93-1,35mA @VI=3,85V. Vstupní kapacita CI 15-25pF. Doba ' +
      'zapnutí/vypnutí tPLH/tPHL 0,25-1µs. Výstupní svodový proud ICEX max 50µA @VCE=50V/70°C. ' +
      'Napětí flyback diody VF typ. 1,7V/max 2V @IF=350mA. Tepelný odpor přechod-okolí RthJA ' +
      '55°C/W. Provozní teplota -20 až +85°C, skladovací -55 až +150°C.',
    tags: 'io,budič,uln2803,uln2803a,darlington-array,st,relé,motor,dip-18',
  },
  {
    name: 'ULN2801A',
    packageType: 'shodné s ULN2803 (DIP-18) — viz jeho záznam pro plné mechanické specifikace',
    value:
      '8× Darlingtonův budič se společnými emitory, kolektorový proud 500 mA trvale na kanál, ' +
      'výstupní napětí do 50 V, obecná verze pro PMOS/CMOS s vestavěným omezovacím rezistorem',
    schematicImage: 'ULN2803.jpg',
    notes:
      'STMicroelectronics "ULN2801A/2802A/2803A/2804A" — součást rodiny, viz záznam "ULN2803" ' +
      'v této knihovně pro plné společné elektrické/mechanické specifikace. Obecná (general ' +
      'purpose) varianta s odporovým vstupním děličem 7,2kΩ/3kΩ bez sériového omezovacího ' +
      'rezistoru navíc (na rozdíl od ostatních variant řady) — vhodná pro PMOS-CMOS logiku s ' +
      'vlastním omezením proudu na vstupu.',
    tags: 'io,budič,uln2801,uln2801a,darlington-array,st,relé,motor,dip-18',
  },
  {
    name: 'ULN2802A',
    packageType: 'shodné s ULN2803 (DIP-18) — viz jeho záznam pro plné mechanické specifikace',
    value:
      '8× Darlingtonův budič se společnými emitory, kolektorový proud 500 mA trvale na kanál, ' +
      'výstupní napětí do 50 V, vstupní odpor 10,5 kΩ se Zenerovou diodou pro 14-25V PMOS',
    schematicImage: 'ULN2803.jpg',
    notes:
      'STMicroelectronics "ULN2801A/2802A/2803A/2804A" — součást rodiny, viz záznam "ULN2803" ' +
      'v této knihovně pro plné společné elektrické/mechanické specifikace. Varianta s ' +
      'omezovacím rezistorem 10,5kΩ a Zenerovou diodou na vstupu, určená pro vyšší logická ' +
      'napětí 14-25V PMOS. Max. vstupní napětí VI 30V (na rozdíl od ULN2801A). Doc. tento ' +
      'konkrétní soubor (ULN2802A.pdf) je datasheet pro celou rodinu ULN2801A-2804A.',
    tags: 'io,budič,uln2802,uln2802a,darlington-array,st,relé,motor,dip-18,pmos',
  },
  {
    name: 'ULN2804A',
    packageType: 'shodné s ULN2803 (DIP-18) — viz jeho záznam pro plné mechanické specifikace',
    value:
      '8× Darlingtonův budič se společnými emitory, kolektorový proud 500 mA trvale na kanál, ' +
      'výstupní napětí do 50 V, vstupní odpor 10,5 kΩ pro 6-15V CMOS/PMOS',
    schematicImage: 'ULN2803.jpg',
    notes:
      'STMicroelectronics "ULN2801A/2802A/2803A/2804A" — součást rodiny, viz záznam "ULN2803" ' +
      'v této knihovně pro plné společné elektrické/mechanické specifikace. Varianta s ' +
      'omezovacím rezistorem 10,5kΩ (bez Zenerovy diody, na rozdíl od ULN2802A), určená pro ' +
      'nižší logická napětí 6-15V CMOS/PMOS. Max. vstupní napětí VI 30V.',
    tags: 'io,budič,uln2804,uln2804a,darlington-array,st,relé,motor,dip-18,cmos',
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
      'změny mohou vést k nechtěnému resetu). Součást produktové řady HOPERF "Humiture Sensor" ' +
      '(dle katalogu HOPERFCatalog2020.pdf) — levnější sesterské typy se stejným DFN6 pouzdrem: ' +
      'TH08 (přesnost ±0,3°C/±2%RH) a TH06 (±0,5°C/±5%RH), a teplotní (bez vlhkosti) varianta ' +
      'T06 v pouzdře SOT23-5 (viz jejich samostatné záznamy v této knihovně pro katalogové ' +
      'souhrnné parametry).',
    tags: 'io,senzor,vlhkoměr,teploměr,th10,hoperf,i2c',
  },
  {
    name: 'TH08',
    packageType: 'SMD DFN6 (shodné pouzdro jako TH10)',
    value:
      'Digitální I2C senzor vlhkosti a teploty, přesnost ±0,3 °C / ±2 %RH, VDD 1,9–3,6 V',
    notes:
      'HOPERF "TH08" — dle katalogu "HOPERF Catalog 2020" (HOPERFCatalog2020.pdf, str. 5, ' +
      'tabulka "Humiture Sensor") — ⚠️ SOUHRNNÝ KATALOGOVÝ ZÁZNAM (jen tabulková data ze ' +
      'selection guide, ne plný datasheet — na rozdíl od TH10, který má vlastní kompletní ' +
      'datasheet, viz jeho záznam v této knihovně). Levnější/méně přesná sesterská varianta ' +
      'TH10 se stejným pouzdrem DFN6 a I2C rozhraním. Teplotní rozsah -40 až +125°C, vlhkostní ' +
      'rozsah 0-100%RH, klidový (sleep) proud typ. 0,06µA, rozměry 10,8×9,1×1,8mm.',
    tags: 'io,senzor,vlhkoměr,teploměr,th08,hoperf,i2c',
  },
  {
    name: 'TH06',
    packageType: 'SMD DFN6 (shodné pouzdro jako TH10)',
    value:
      'Digitální I2C senzor vlhkosti a teploty, přesnost ±0,5 °C / ±5 %RH, VDD 1,9–3,6 V',
    notes:
      'HOPERF "TH06" — dle katalogu "HOPERF Catalog 2020" (HOPERFCatalog2020.pdf, str. 5) — ⚠️ ' +
      'SOUHRNNÝ KATALOGOVÝ ZÁZNAM (viz poznámka u "TH08"). Nejlevnější/nejméně přesná varianta ' +
      'řady TH10/TH08/TH06, jinak mechanicky a rozhraním shodná (DFN6, I2C). Teplotní rozsah ' +
      '-40 až +125°C, vlhkostní rozsah 0-100%RH, klidový proud typ. 0,05µA, rozměry ' +
      '10,8×9,1×1,8mm.',
    tags: 'io,senzor,vlhkoměr,teploměr,th06,hoperf,i2c',
  },
  {
    name: 'T06',
    packageType: 'SMD SOT23-5',
    value: 'Digitální I2C senzor teploty (BEZ vlhkosti), přesnost ±0,3 °C, VDD 1,7–5,5 V',
    notes:
      'HOPERF "T06" — dle katalogu "HOPERF Catalog 2020" (HOPERFCatalog2020.pdf, str. 5) — ⚠️ ' +
      'SOUHRNNÝ KATALOGOVÝ ZÁZNAM (viz poznámka u "TH08"). Na rozdíl od TH10/TH08/TH06 (senzory ' +
      'vlhkosti I teploty) měří T06 POUZE teplotu — v katalogu uveden jako "Humiture Sensor" ' +
      'skupina, ale bez humidity range/resolution (tabulka N/A), v menším a levnějším pouzdře ' +
      'SOT23-5 (namísto DFN6). Teplotní rozsah -40 až +125°C, klidový proud typ. 0,05µA, I2C ' +
      'rozhraní.',
    tags: 'io,senzor,teploměr,t06,hoperf,i2c,sot23-5',
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
    schematicImage: 'XV-8000CB.jpg',
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
    schematicImage: 'ACS754xCB-050.jpg',
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
    name: 'ACS754xCB-150',
    packageType:
      'Pouzdro "CB" ve 3 variantách tvaru vývodů: CB-PFF (formované signálové piny i silové ' +
      'terminály), CB-PSF (formované piny, rovné terminály), CB-PSS (rovné piny i terminály) — ' +
      'shodné mechanické provedení jako ACS754xCB-050 v této knihovně, 3 signálové piny ' +
      '(1=VCC, 2=GND, 3=VOUT) + 2 silové terminály primárního vodiče (4=IP+, 5=IP-)',
    value:
      'Hallův lineární izolovaný senzor proudu (chopper-stabilizovaný BiCMOS Hall IC), obousměrný ' +
      '±150 A, citlivost 13,3 mV/A typ., napájení 5,0 V, izolační napětí 3 kVRMS, dostupný v ' +
      'průmyslové (S, -20 až +85 °C) i automotive (K, -40 až +125 °C) teplotní verzi',
    schematicImage: 'ACS754xCB-150.jpg',
    notes:
      'Allegro MicroSystems "ACS754xCB-150" katalogový datasheet (ACS754150-DS, Rev. 4) — ⚠️ ' +
      'vyšší-proudová varianta ACS754xCB-050 v této knihovně (samostatný záznam): stejné ' +
      'mechanické pouzdro (CB-PFF/PSF/PSS), stejný princip funkce (chopper-stabilizovaný Hall IC ' +
      's integrovaným měděným vodivým můstkem primárního proudu, typ. odpor 100 µΩ) a stejné ' +
      'napájení/izolace, ale rozsah měřeného proudu ±150 A (oproti ±50 A u -050 verze) za cenu ' +
      'úměrně nižší citlivosti 13,3 mV/A typ. (oproti 40 mV/A u -050 verze) — daný stejným ' +
      'napěťovým rozkmitem výstupu roztaženým na širší proudový rozsah. ⚠️ POZOR: teplotní verze ' +
      'automotive rozsahu je zde označena písmenem "K" (-40 až +125 °C), NIKOLI "L" jako u ' +
      'ACS754xCB-050 (tam "L" = -40 až +150 °C) — odlišné písmenné kódy pro odlišné rozsahy v ' +
      'rámci téže produktové řady, nutno pečlivě rozlišovat při objednávání. Objednací kódy: ' +
      'ACS754KCB-150-PFF/PSF/PSS (automotive, -40 až +125 °C) a ACS754SCB-150-PFF/PSF/PSS ' +
      '(standardní, -20 až +85 °C) — do knihovny přidán jako jeden souhrnný záznam pro celou ' +
      '"xCB-150" řadu. Citlivost: S řada 12,8–14,0 mV/A @-20~85°C; K řada 12,3–14,2 mV/A ' +
      '@-40~125°C. Nelinearita max ±0,8 % (S) / ±1,3 % (K). Symetrie 98–102 %. Celková chyba ' +
      'výstupu max ±1,0 % @25°C / ±5,0 % (S) resp. ±7,4 % (K). Magnetický offset (po přebuzení ' +
      '150 A) max ±0,30 A (S) / ±0,40 A (K). Šířka pásma (-3dB) 35 kHz, doba náběhu typ. 10 µs, ' +
      'doba odezvy typ. 11 µs, doba zpoždění typ. 4 µs. Napájení VCC 4,5–5,5 V (typ. 5,0 V), ' +
      'odběr typ. 8 mA (max 10 mA). Izolační napětí 3 kVRMS (60 Hz, 1 minuta), TÜV certifikace ' +
      '(certifikát U8V 04 11 54214 001, shodný s ACS754xCB-050). Max. teplota přechodu 165 °C, ' +
      'max. skladovací teplota 170 °C. Určeno pro řízení motorů, servo systémy, konverzi výkonu, ' +
      'monitorování baterií, průmyslové a automotive aplikace.',
    tags: 'io,senzor,proud,hallův-jev,proudový-senzor,galvanické-oddělení,allegro,acs754,izolovaný,chopper,automotive',
  },
  {
    name: 'ACS755xCB-050',
    packageType:
      'Pouzdro "CB" ve 3 variantách tvaru vývodů: CB-PFF (formované signálové piny i silové ' +
      'terminály, celková délka 17,7 mm), CB-PSF (formované piny, rovné terminály, 24,0 mm), ' +
      'CB-PSS (rovné piny i terminály, 24,0 mm) — mechanicky příbuzné, ale rozměrově odlišné od ' +
      'ACS752/ACS754 v této knihovně (šířka těla 14,2 mm, hmotnost typ. 4,63 g), 3 signálové ' +
      'piny (1=VCC, 2=GND, 3=VOUT) + 2 silové terminály primárního vodiče (4=IP+, 5=IP-)',
    value:
      'Hallův lineární izolovaný senzor proudu (chopper-stabilizovaný BiCMOS Hall IC), ' +
      'JEDNOSMĚRNÝ (unipolární) 0–50 A, citlivost 60 mV/A typ., klidové výstupní napětí 0,6 V, ' +
      'napájení 5,0 V, izolační napětí 3 kVRMS',
    schematicImage: 'ACS755xCB-050.jpg',
    notes:
      'Allegro MicroSystems "ACS755xCB-050" katalogový datasheet (ACS755050-DS, Rev. 2, 2005) — ' +
      'další sourozenec ACS752SCA-050/ACS754xCB-050/ACS754xCB-150 v této knihovně v rámci téže ' +
      'výrobcem deklarované rodiny "ACS75x" (shodná technologie: chopper-stabilizovaný BiCMOS ' +
      'Hall IC s integrovaným měděným vodivým můstkem primárního proudu, typ. odpor 100 µΩ, 3kV ' +
      'izolace), ale ⚠️ ZÁSADNÍ ROZDÍL oproti nim: ACS755xCB-050 měří proud POUZE JEDNOSMĚRNĚ ' +
      '(0–50 A, unipolární), NIKOLI obousměrně (±50 A jako ACS752/ACS754) — tomu odpovídá i jiné ' +
      'klidové výstupní napětí VOUT(Q) = 0,6 V (pevná hodnota blízko GND, ne VCC/2=2,5V jako u ' +
      'obousměrných variant), takže při záporném/opačném směru proudu by výstup byl mimo platný ' +
      'rozsah — nelze zaměňovat za obousměrné senzory stejné rodiny. Datasheet pokrývá modely ' +
      'ACS755LCB-050-PFF/PSF/PSS (automotive, teplotní kód "L", -40 až +150 °C) a ACS755SCB-050- ' +
      'PFF/PSF/PSS (standardní, kód "S", -20 až +85 °C) — do knihovny přidán jako jeden souhrnný ' +
      'záznam pro celou "755xCB-050" řadu. Citlivost 60 mV/A typ. (53–65 mV/A přes plný rozsah a ' +
      'teplotu). Nelinearita max ±2,8 %. Celková chyba výstupu max ±1,0 % @25°C / ±10,0 % (S, ' +
      '-20~85°C) resp. ±11,0 % (L, -40~150°C) v celém rozsahu. Magnetický offset (po přebuzení ' +
      '100 A) max ±0,15 A. Šířka pásma (-3dB) 18 kHz (nižší než u ACS752/ACS754), doba náběhu ' +
      'typ. 20 µs, doba odezvy typ. 20 µs, doba zpoždění typ. 4 µs. Napájení VCC 4,5–5,5 V (typ. ' +
      '5,0 V), odběr typ. 8 mA (max 10 mA). Izolační napětí 3 kVRMS (60 Hz, 1 minuta), stejná TÜV ' +
      'certifikace jako ACS752/ACS754 v této knihovně (certifikát U8V 04 11 54214 001). Shoda ' +
      'UL60950-1, EN60950-1, CAN/CSA C22.2 No. 60950-1. Max. teplota přechodu 165 °C, max. ' +
      'skladovací teplota 170 °C. Určeno pro automotive, průmyslové systémy, konverzi výkonu, ' +
      'monitorování baterií.',
    tags: 'io,senzor,proud,hallův-jev,proudový-senzor,galvanické-oddělení,allegro,acs755,izolovaný,chopper,jednosměrný,automotive',
  },
  {
    name: 'CSXX05B series',
    packageType:
      'THT SIP pouzdro 15×15×20 mm, plast PBT, 6 vývodů (piny fosforová bronz s cínovým ' +
      'povlakem, rozteč 2,54 mm): 1=+5V, 2=NC, 3=výstup (V), 4=0V/GND, 5=+vstup (A, primární ' +
      'proud), 6=-vstup (A) — primární vodič integrován v pouzdře jako průchozí otvory Ø0,6–1,7 ' +
      'mm dle proudového rozsahu, hmotnost 8 g',
    value:
      'Hallův (open loop) izolovaný senzor proudu, obousměrný (bipolární), detekuje směr proudu, ' +
      'jeden kanál, napájení 5 V, analogový napěťový výstup — dostupný v rozsazích ±3/±5/±10/ ' +
      '±15/±20 A dle modelu',
    notes:
      'CUI Inc "CSXX05B Series — Current Sensor" (dok. rev. 1.0, 9. 3. 2019) — ⚠️ další rodina ' +
      'Hallových izolovaných proudových senzorů v této knihovně vedle Allegro ACS752/ACS754/ ' +
      'ACS755 (samostatné záznamy), ale zásadně odlišné konstrukční řešení: CSXX05B je typu ' +
      '"open loop" s malým THT pouzdrem SIP a primárním vodičem vedeným přímo skrz otvory v ' +
      'pouzdře (bez integrovaného měděného vodivého můstku jako u Allegro ACS75x) — kompaktnější, ' +
      'ale bez vestavěného výstupního zesilovače/filtru na takové úrovni integrace jako ACS75x ' +
      '(žádný interní trim regulátor zisku/offsetu zmíněný v datasheetu). Datasheet pokrývá celou ' +
      'modelovou řadu lišící se jmenovitým proudovým rozsahem (a průměrem otvoru pro primární ' +
      'vodič): CS0305B (±3A, ØA 0,6mm/ØB 1,2mm), CS0505B (±5A, 0,9/1,5mm), CS1005B (±10A, 1,1/ ' +
      '1,7mm), CS1505B (±15A, 1,4/2,0mm), CS2005B (±20A, 1,7/2,3mm) — do knihovny přidán jako ' +
      'jeden souhrnný záznam pro celou "CSXX05B" řadu, konkrétní proudový rozsah se volí dle ' +
      'požadované aplikace. Výstupní napětí: 4,50 V typ. @+If (plný jmenovitý proud v kladném ' +
      'směru), 0,50 V typ. @-If (plný proud v záporném směru), klidové (nulový proud) napětí ' +
      '2,50 V typ. (po demagnetizaci). Linearita výstupu ±0,5 %. Doba odezvy typ. 7 µs. ' +
      'Teplotní koeficient výstupního napětí ±0,1 %/°C, ofsetu ±1,5 mV/°C. Hystereze 8 mV ' +
      '(@+If→0A). Max. primární přetížení proudu 10×If po dobu max 50 ms (bez poškození). ' +
      'Napájecí napětí 5,00 V (4,75–5,25 V), odběr max 25 mA. Izolační pevnost (výdrž) 2000 VAC/ ' +
      '1 minuta mezi cívkou a každým vývodem, izolační odpor min 500 MΩ @500VDC. Provozní ' +
      'teplota -10 až +75 °C (derating křivka — plný jmenovitý proud jen do +45°C, nad touto ' +
      'teplotou klesá lineárně na cca 60 % @75°C), skladovací -30 až +90 °C. Bezpečnostní ' +
      'certifikace UL 508, hořlavost UL94V-0. Doporučen externí blokovací kondenzátor 1 µF mezi ' +
      'piny 4 (GND) a 1 (+5V) pro potlačení šumu.',
    tags: 'io,senzor,proud,hallův-jev,proudový-senzor,galvanické-oddělení,cui,csxx05b,open-loop,izolovaný,sip',
  },
  {
    name: 'HOA0709-011',
    packageType:
      'THT černé termoplastické (polykarbonátové) pouzdro s vestavěnou optikou, IRED a detektor ' +
      'zabudovány vedle sebe se sbíhajícími se optickými osami (zaostřeno na společný bod před ' +
      'čelní stranou), integrovaný IR propustný filtr blokující viditelné světlo a hladké optické ' +
      'čelo bránící usazování prachu, seřiditelný montážní otvor (slot), 4 čtvercové vývody ' +
      '(A=anoda IRED, K=katoda IRED, E=emitor detektoru, C=kolektor detektoru), pájecí teplota ' +
      '240 °C/5 s',
    value:
      'Reflexní (odrazový) optický senzor — IR LED vysílač + NPN fotodarlingtonový detektor v ' +
      'jednom pouzdře se vzájemně sbíhajícími optickými osami, s integrovaným filtrem okolního ' +
      'světla, VCEO(detektor) 15 V, IC(ON) 1,0 mA min @IF=40mA',
    notes:
      'Honeywell "HOA0708/0709 — Reflective Sensor" (katalogový list, str. 232–235) — kombinovaný ' +
      'optoelektronický senzor obsahující ve společném pouzdře IR vysílací diodu (IRED) a ' +
      'detektor uspořádané bok po boku se sbíhajícími optickými osami tak, že detektor reaguje na ' +
      'záření IRED pouze tehdy, když se v zorném poli objeví odrazivý objekt (na rozdíl od ' +
      'přerušovacích/slotových optických závor, kde vysílač a přijímač míří proti sobě přes ' +
      'štěrbinu) — typicky pro detekci přítomnosti/pozice reflexních značek, počítadla otáček, ' +
      'detekci konce pásky/papíru apod. Datasheet pokrývá celou rodinu: HOA0708-xxx (výstup ' +
      'fototranzistor, VCEO 30V) vs. HOA0709-xxx (výstup fotodarlington, VCEO 15V, vyšší ' +
      'citlivost/pomalejší odezva) × "-001" (bez filtru) vs. "-011" (integrovaný IR propustný/ ' +
      'viditelné-světlo-blokující filtr + hladké čelo proti prachu) — do knihovny přidán konkrétně ' +
      'pojmenovaný díl HOA0709-011 (fotodarlington + filtr) z názvu souboru. IR emitor: VF typ. ' +
      '1,6 V @IF=20mA, IR reverse leakage max 10 µA @VR=3V, max výkonová ztráta 70 mW, max trvalý ' +
      'proud 50 mA. Detektor (fotodarlington, HOA0709): V(BR)CEO min 15 V @IC=100µA, V(BR)ECO min ' +
      '5,0 V @IE=100µA, temný proud ICEO max 250 nA @VCE=10V, max výkonová ztráta 70 mW, max ' +
      'kolektorový proud 30 mA. Spřažené (coupled) parametry: spínací proud IC(ON) min 1,0 mA ' +
      '@VCE=5V/IF=40mA (test na Eastman Kodak bílé testovací kartě, 90% odrazivost, 3,80 mm od ' +
      'čela), saturační napětí VCE(sat) max 1,1 V, doba náběhu/poklesu (tr/tf) typ. 75 µs @VCC=5V/ ' +
      'IC=1mA/RL=100Ω — výrazně pomalejší než u ekvivalentní fototranzistorové varianty HOA0708 ' +
      '(typ. 15 µs), typické pro darlingtonové zapojení (vyšší zesílení na úkor rychlosti). ' +
      'Provozní/skladovací teplota -40 až +85 °C. Optimální detekční vzdálenost od odrazné plochy ' +
      'cca 0,15" (3,8 mm) dle grafu závislosti kolektorového proudu na vzdálenosti.',
    tags: 'io,senzor,reflexní,optický,photodarlington,ired,honeywell,hoa0709,proximity',
  },
  {
    name: 'SFH 7051',
    packageType:
      'COB ("chip on board") vícečipové SMD pouzdro 4,7×2,5×0,9 mm, 8 vývodů (piny 1,2=LED1 ' +
      'anoda/katoda, 3=LED2 katoda, 4,5=fotodioda anoda/katoda, 6=LED2 anoda, 7,8=LED3 katoda/ ' +
      'anoda), vestavěná optická přepážka (light barrier) mezi emitory a detektorem proti ' +
      'optickému přeslechu, hmotnost cca 18 mg, MSL úroveň 4',
    value:
      '"BioMon" optický senzor pro tepovou frekvenci (PPG) — 3 zelené LED (530 nm) + 1 PIN ' +
      'fotodioda v jednom pouzdře, IF max 25 mA (jeden emitor)/15 mA (všechny emitory), ' +
      'fotoproud typ. 0,42 µA @0,1 mW/cm²',
    notes:
      'OSRAM Opto Semiconductors "SFH 7051 — BioMon Sensor" (Datasheet v1.1, 25. 4. 2016) — ' +
      'vícečipová optoelektronická sestava pro optické měření tepové frekvence (fotopletysmografie ' +
      '— PPG), obsahující TŘI zelené LED emitory (λpeak=530nm, poloviční úhel ±60°) a JEDNU PIN ' +
      'fotodiodu (spektrální rozsah citlivosti 400–1100 nm, špička @920nm, citlivost 0,27 A/W ' +
      '@535nm) integrované do jednoho miniaturního COB pouzdra s vestavěnou světelnou přepážkou ' +
      'bránící přímému optickému přeslechu mezi emitory a detektorem (nutnou podmínkou funkčního ' +
      'PPG měření — signál musí procházet tkání/kůží, ne přímou cestou uvnitř pouzdra). ⚠️ Bez ' +
      'jakékoli vlastní zesilovací/vyhodnocovací elektroniky (čistě pasivní optický front-end) — ' +
      'koncepčně analogický optickému senzorovému bloku MAX86141 uvnitř zdravotního náramku Maxim ' +
      'MAXREFDES103# v této knihovně (tam ovšem MAX86141 zahrnuje i analogový front-end/zesilovač ' +
      'přímo na čipu, zatímco SFH 7051 je čistě diskrétní optická sestava vyžadující externí ' +
      'zesilovací/vyhodnocovací obvod). Určeno pro nositelnou elektroniku (chytré hodinky, fitness ' +
      'náramky) a mobilní zařízení s funkcí měření tepové frekvence. Zelený emitor (jednotlivě): ' +
      'λpeak typ. 530 nm, centroidní vlnová délka 535 nm (±10), spektrální šířka 34 nm, VF typ. ' +
      '3,2 V (max 3,7 V), IF max 25 mA (jeden emitor) / 15 mA (všechny 3 aktivní současně), doba ' +
      'náběhu/poklesu typ. 32 ns, zářivá intenzita typ. 1,4 mW/sr, celkový zářivý tok typ. 3,4 mW ' +
      '@IF=20mA. Detektor (fotodioda): plocha 1,7 mm² (1,3×1,3 mm), fotoproud typ. 0,42 µA ' +
      '@Ee=0,1mW/cm²/535nm/VR=5V, temný proud typ. 1 nA (max 5 nA) @VR=5V, kapacita typ. 5 pF ' +
      '@VR=5V/1MHz, VR max 16 V. Provozní/skladovací teplota -40 až +85 °C. ESD odolnost 2 kV ' +
      '(HBM).',
    tags: 'io,senzor,ppg,biomon,tepová-frekvence,fotodioda,zelená-led,osram,sfh7051,wearable,optický',
  },
  {
    name: 'SFH7050',
    packageType:
      'COB ("chip on board") vícečipové SMD pouzdro 4,7×2,5×0,9 mm, 8 vývodů (piny 1,2=zelená ' +
      'LED katoda/anoda, 3=červená LED anoda, 4,5=fotodioda anoda/katoda, 6=červená LED katoda, ' +
      '7,8=IR LED anoda/katoda), vestavěná optická přepážka (light barrier) mezi emitory a ' +
      'detektorem proti optickému přeslechu',
    value:
      '"BioMon" multispektrální optický senzor pro tepovou frekvenci a pulzní oxymetrii (PPG + ' +
      'SpO2) — 1× zelená LED (525 nm) + 1× červená LED (660 nm) + 1× IR LED (950 nm) + 1 PIN ' +
      'fotodioda v jednom pouzdře',
    notes:
      'OSRAM Opto Semiconductors "SFH7050 — BioMon Sensor" (Datasheet v1.1, 20. 4. 2016) — ⚠️ ' +
      'sourozenecký díl SFH 7051 v této knihovně (samostatný záznam): stejné mechanické pouzdro ' +
      '(COB, 4,7×2,5×0,9 mm, stejný typ fotodiodového detektoru — shodná plocha 1,7 mm²/1,3×1,3mm, ' +
      'temný proud typ. 1 nA, kapacita typ. 5 pF), ale zásadně odlišná sada emitorů: SFH 7051 má ' +
      'TŘI STEJNÉ zelené LED (pouze pro tepovou frekvenci), zatímco SFH7050 má TŘI RŮZNOBAREVNÉ ' +
      'emitory — zelenou (525 nm), červenou (660 nm) a infračervenou (950 nm) — kombinace nutná ' +
      'pro pulzní oxymetrii (SpO2), kde se saturace kyslíku v krvi počítá z poměru absorpce ' +
      'červeného a IR záření okysličeným/neokysličeným hemoglobinem, zatímco zelená složka slouží ' +
      'pro přesnější detekci tepové frekvence (menší citlivost na pohybové artefakty u povrchových ' +
      'cév). Bez vlastní zesilovací elektroniky (čistě diskrétní optický front-end, vyžaduje ' +
      'externí analogový front-end/zesilovač — viz koncepčně příbuzný MAX86141 uvnitř Maxim ' +
      'MAXREFDES103# v této knihovně). Emitory (jednotlivě, IF=20mA): Zelená — λpeak 525 nm, VF ' +
      'typ. 3,4 V (max 4,4 V), Ie typ. 1,3 mW/sr, Φe typ. 2,9 mW, tr/tf typ. 32 ns, IF max 25 mA. ' +
      'Červená — λpeak 660 nm, VF typ. 2,1 V (max 2,8 V), Ie typ. 2,6 mW/sr, Φe typ. 6,4 mW, tr/tf ' +
      'typ. 17 ns, IF max 40 mA. Infračervená — λpeak 950 nm, VF typ. 1,3 V (max 1,8 V), Ie typ. ' +
      '2 mW/sr, Φe typ. 5,3 mW, tr/tf typ. 16 ns, IF max 60 mA (nejvyšší z trojice, odpovídá i ' +
      'nejvyššímu povolenému surge proudu 1 A). Detektor: fotoproud typ. 0,42 µA @530nm, 0,76 µA ' +
      '@655nm, 1,3 µA @940nm (všechny @Ee=0,1mW/cm²/VR=5V) — spektrální citlivost roste s vlnovou ' +
      'délkou (0,26 A/W @530nm až 0,77 A/W @940nm), špička citlivosti @920nm, rozsah 400–1100 nm. ' +
      'Provozní/skladovací teplota -40 až +85 °C. ESD odolnost 2 kV (HBM). Určeno pro nositelnou ' +
      'elektroniku (chytré hodinky, fitness náramky) a mobilní zařízení s funkcí měření tepové ' +
      'frekvence a saturace kyslíku v krvi.',
    tags: 'io,senzor,ppg,spo2,pulzní-oxymetrie,biomon,tepová-frekvence,fotodioda,osram,sfh7050,wearable,optický',
  },
  {
    name: 'SFH7060',
    packageType:
      'COB ("chip on board") vícečipové SMD pouzdro 7,2×2,5×0,9 mm (delší než SFH7050/SFH 7051 ' +
      'kvůli 5 emitorům), 12 vývodů (piny 1,2=červená LED anoda/katoda, 3,4=zelená LED1 katoda/ ' +
      'anoda, 5=zelená LED2 anoda, 6,7=fotodioda anoda/katoda, 8=zelená LED2 katoda, 9,10=zelená ' +
      'LED3 anoda/katoda, 11,12=IR LED katoda/anoda), vestavěná optická přepážka mezi emitory a ' +
      'detektorem, "vylepšená geometrie pro optimalizovanou kvalitu signálu" dle výrobce',
    value:
      '"BioMon" multispektrální optický senzor pro tepovou frekvenci a pulzní oxymetrii (PPG + ' +
      'SpO2) — TŘI zelené LED (530 nm) + 1× červená LED (660 nm) + 1× IR LED (950 nm) + 1 PIN ' +
      'fotodioda v jednom pouzdře',
    notes:
      'OSRAM Opto Semiconductors "SFH7060 — BioMon Sensor" (Datasheet v1.1, 20. 4. 2016) — ⚠️ ' +
      'nejúplnější/"vlajkový" díl rodiny BioMon v této knihovně, kombinující vlastnosti obou ' +
      'předchozích sourozenců SFH 7051 a SFH7050 (samostatné záznamy): má TŘI zelené emitory jako ' +
      'SFH 7051 (pro robustní detekci tepové frekvence s potlačením pohybových artefaktů) A ' +
      'ZÁROVEŇ červený + IR emitor jako SFH7050 (pro pulzní oxymetrii/SpO2) — dohromady 5 emitorů ' +
      '+ 1 detektor v jednom pouzdře, což vyžaduje delší/větší pouzdro (7,2×2,5×0,9 mm oproti ' +
      '4,7×2,5×0,9 mm u obou předchozích) a 12 vývodů místo 8. Detektorový čip je shodný s ' +
      'SFH7050 (stejné spektrální charakteristiky/citlivost @535/655/940nm, stejná plocha ' +
      '1,7 mm², temný proud typ. 1 nA, kapacita typ. 5 pF). Bez vlastní zesilovací elektroniky ' +
      '(diskrétní optický front-end, vyžaduje externí analogový front-end/zesilovač — viz ' +
      'koncepčně příbuzný MAX86141 uvnitř Maxim MAXREFDES103# v této knihovně). Emitory ' +
      '(jednotlivě, IF=20mA) — parametry shodné s odpovídajícími emitory SFH7050/SFH 7051: ' +
      'zelená λpeak 530 nm/VF typ. 3,2V(max 3,70V)/Ie typ. 1,4mW/sr/Φe typ. 3,4mW/IF max 25mA ' +
      '(jeden)/15mA (všechny 3 zelené současně); červená λpeak 660nm/VF typ. 2,1V(max 2,8V)/Ie ' +
      'typ. 2,6mW/sr/Φe typ. 6,4mW/IF max 40mA; infračervená λpeak 950nm/VF typ. 1,3V(max 1,8V)/ ' +
      'Ie typ. 2mW/sr/Φe typ. 5,3mW/IF max 60mA (surge 1A, nejvyšší z pětice). Provozní/ ' +
      'skladovací teplota -40 až +85 °C. ESD odolnost 2 kV (HBM). Určeno pro nositelnou ' +
      'elektroniku (chytré hodinky, fitness náramky) a mobilní zařízení s nejvyššími nároky na ' +
      'přesnost měření tepové frekvence a SpO2.',
    tags: 'io,senzor,ppg,spo2,pulzní-oxymetrie,biomon,tepová-frekvence,fotodioda,osram,sfh7060,wearable,optický',
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
    schematicImage: 'FT200XD.jpg',
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
  {
    name: 'LTR-706PS-01',
    packageType:
      'Ultra-malé ChipLed L pouzdro (SMD), 8 vývodů, rozměry cca 2,36×3,94×1,35 mm (bez čoček), ' +
      'výška profilu 2,10 mm, integrovaný VCSEL emitor + fotodioda detektor, olovnaté-free',
    value:
      'I2C proximity senzor (PS) s vestavěným VCSEL emitorem, napájení 2,7–3,6 V, I2C rozhraní ' +
      '(Fast Mode 400 kbit/s), 11bitové rozlišení, detekční vzdálenost ~100 mm (18% šedá karta)',
    notes:
      'LITE-ON Optoelectronics "LTR-706PS-01 — Optical Sensor Product Data Sheet" (Spec. č. ' +
      'DS86-2017-0014, účinnost 30.6.2017) — integrovaný nízkonapěťový I2C proximity senzor s ' +
      'vestavěným emitorem (VCSEL 850 nm) i detektorem (PS dioda) v jednom miniaturním SMD ' +
      'pouzdře — zařazeno do kategorie "IO" jako bare package s digitálním I2C rozhraním (bez ' +
      'vlastní PCB/konektoru), podobně jako OSRAM SFH7050/SFH7051/SFH7060 (PPG optické senzory) ' +
      'a Honeywell HOA0709-011 (reflexní senzor) v této knihovně — narozdíl od těch je LTR-706PS-01 ' +
      'čistě proximity (vzdálenostní) senzor bez funkce měření okolního osvětlení (ALS), s ' +
      'digitálním I2C výstupem (ne analogovým). VCSEL budič integrován na čipu s programovatelným ' +
      'nastavením budicího proudu (2–14 mA) a počtem pulzů (1–64), pulzní frekvence VCSEL 125 kHz, ' +
      'duty cycle 25 %. Funkce 2úrovňové detekce poruchy VCSEL (fault detection) — chrání proti ' +
      'neúmyslnému spuštění VCSEL proudu nebo zkratovému přepětí, s digitálním výstupem En-b pro ' +
      'řízení externího PMOS spínače VCSEL napájení (doporučeno NTA4151PT1G nebo ekvivalent). ' +
      'Přerušovací výstup INT (open-drain) eliminuje nutnost pollingu. Vysoké potlačení okolního ' +
      'světla až 50 klux (přímé sluneční záření). Vlastní teplotní kompenzační obvod a tovární ' +
      'jednorázové trimování pro minimalizaci rozptylu mezi kusy. Piny: 1-SDA, 2-INT, 3-NC, ' +
      '4-En-b (řízení externího PMOS), 5-LEDA (anoda VCSEL), 6-GND, 7-SCL, 8-VDD. Absolutní max.: ' +
      'VDD 3,8 V, VCSEL proud 15 mA, ESD (HBM) 2000 V (200 V na LEDA pinu kvůli VCSEL). Provozní ' +
      'teplota -30 až +70 °C. Aplikace: detekce přiblížení objektu, touch panel control v mobilních/' +
      'přenosných zařízeních. RoHS a bez halogenu.',
    tags: 'io,senzor,proximity,i2c,vcsel,liteon,ltr-706ps-01,optický,chipled',
  },
  {
    name: 'LTR-329ALS-01',
    packageType:
      'Ultra-malé ChipLED pouzdro (SMD), 4 vývody, rozměry 2,00×2,00×1,00 mm (bez čoček), plocha ' +
      'detektoru 0,32×0,29 mm², olovnaté-free',
    value:
      'I2C digitální senzor okolního osvětlení (ALS), duální kanál (viditelné+IR / pouze IR), ' +
      'napájení 2,4–3,6 V, rozsah 0,01–64 klux, 16bitové rozlišení, 6 nastavitelných zesílení ' +
      '(1×/2×/4×/8×/48×/96×)',
    notes:
      'LITE-ON Optoelectronics "LTR-329ALS-01 — Optical Sensor Product Data Sheet" (Spec. č. ' +
      'DS86-2014-0006, rev. B, účinnost 9.4.2014) — digitální senzor okolního osvětlení (ambient ' +
      'light sensor), přímý párový/rodinný protějšek k proximity senzoru LTR-706PS-01 v této ' +
      'knihovně (stejná řada LTR-3xx/7xx od LITE-ON, podobná I2C architektura a ChipLED pouzdro), ' +
      'ale zcela odlišná funkce — ⚠️ LTR-329ALS-01 NEMÁ vlastní emitor (žádný VCSEL/LED), pouze ' +
      'DVA fotodetektory (Ch0 = viditelné+IR spektrum, Ch1 = pouze IR spektrum), zatímco ' +
      'LTR-706PS-01 je aktivní proximity senzor s vestavěným VCSEL emitorem i detektorem — jde ' +
      'tedy o měření okolního osvětlení (pasivní), ne o detekci přiblížení objektu (aktivní). ' +
      'Zařazeno do kategorie "IO" jako bare package s I2C rozhraním, podobně jako LTR-706PS-01. ' +
      'Spektrální odezva blízká lidskému oku (Ch0, špička ~460 nm) + separátní IR kanál (Ch1, ' +
      'špička ~800 nm) umožňují výpočtem poměru Ch1/(Ch0+Ch1) kompenzovat různé typy světelných ' +
      'zdrojů (denní světlo/žárovka/LED) při převodu ADC počtu na lux. Automatické potlačení ' +
      'blikání zářivkového osvětlení 50/60 Hz, odolnost vůči IR/UV zdrojům světla. Piny: 1-VDD, ' +
      '2-GND, 3-SDA (I2C data, open-drain), 4-SCL (I2C hodiny, open-drain vstup). Plný rozsah ADC ' +
      '0–65535 count, temný proud (dark count) max 6 count na obou kanálech. Absolutní max.: VDD ' +
      '3,8 V, skladovací teplota -40 až +100 °C. Provozní teplota -30 až +70 °C, I2C Fast Mode ' +
      '400 kbit/s. Aplikace: automatické řízení jasu podsvícení displeje (mobilní telefony, ' +
      'notebooky, monitory, TV, navigace, digitální fotorámečky, palubní desky). RoHS a bez ' +
      'halogenu.',
    tags: 'io,senzor,als,okolní-osvětlení,i2c,liteon,ltr-329als-01,optický,chipled',
  },
  {
    name: 'MQ-131',
    packageType:
      'Kovové TO-like pouzdro s antiexplozní síťkou (nerezová ocel SUS316, 100mesh), pryskyřičná ' +
      '(bakelitová) základna, 6 pinů (4 signálové + 2 topné), Ø16,8×9,2 mm',
    value:
      'Polovodičový (SnO2) plynový senzor ozónu (O3), odporový typ, detekční rozsah 10 ppb–2 ppm ' +
      'O3, napájení senzoru Vc 5 V AC/DC, topné napětí Vh 6 V AC/DC, topný odpor 31 Ω, spotřeba ' +
      'topení < 1100 mW',
    schematicImage: 'MQ-131.jpg',
    notes:
      'Hanwei Electronics "MQ-131 Gas Sensor — Technical Data" — ⚠️ NOVÁ TŘÍDA senzoru v této ' +
      'knihovně: první polovodičový (metal-oxidový) plynový senzor, dosud žádný podobný typ ' +
      'nebyl katalogizován. Princip: aktivní vrstva SnO2 (oxid cíničitý) na mikro trubičkové ' +
      'keramice Al2O3, se zlatými elektrodami (Au), platinovou elektrodovou linkou (Pt) a topnou ' +
      'cívkou z Ni-Cr slitiny — mění svůj elektrický odpor (Rs) v přítomnosti plynu O3, princip je ' +
      'čistě chemicko-odporový (heated metal-oxide gas sensor), NE optický/kapacitní/indukční jako ' +
      'ostatní senzory v knihovně. Vyžaduje neustálé předehřátí (>24 h před prvním použitím) a ' +
      'externí zátěžový rezistor RL (doporučeno ~100 kΩ, rozsah 50–200 kΩ) pro převod odporové ' +
      'změny na měřitelné napětí — bez vlastní elektroniky pro digitalizaci/kompenzaci (na rozdíl ' +
      'od IO senzorů s integrovaným ADC/I2C jako LTR-329ALS-01/LTR-706PS-01), proto zařazeno do ' +
      'kategorie "IO" jako bare senzorový element vyžadující externí měřicí obvod (doporučené ' +
      'zapojení s LM7806 regulátorem, LM324 komparátory a NPN tranzistorem pro buzení relé/bzučáku ' +
      'je v datasheetu uvedeno jako referenční aplikační obvod). Citlivostní odezva Rs/Ro klesá s ' +
      'rostoucí koncentrací O3 (typický sklon 0,65 dekády mezi 50 a 100 ppb), senzor reaguje také ' +
      '(křížová citlivost) na NOx a Cl2, i když s nižší citlivostí než na O3 — nutná selektivní ' +
      'kalibrace pro cílovou aplikaci. Provozní teplota -10 až +50 °C, skladovací -20 až +70 °C, ' +
      'relativní vlhkost < 95 % RH. 2 kruhové otvory v horní/dolní straně pouzdra umožňují lepší ' +
      'výměnu plynu s okolím (rychlejší odezva/zotavení, zejména s ventilátorem). Aplikace: ' +
      'monitorování kvality vzduchu v budovách/kancelářích (detekce ozónu).',
    tags: 'io,senzor,plyn,ozón,o3,sno2,polovodičový,hanwei,mq-131,gas-sensor',
  },
  {
    name: 'TRA 1 Series',
    packageType:
      'Zalévaný (potted) SIP modul, nevodivý plast UL94V-0, 4 THT vývody (jednovýstupová verze) ' +
      'nebo 6 vývodů (dvouvýstupová verze) v roztečích 2,54 mm, rozměry 19,5×10,2×7,1 mm (24V ' +
      'vstupní varianty) nebo 6,1 mm výška (5V/12V varianty), hmotnost 2,2–2,6 g, průmyslový SIP ' +
      'pinout',
    value:
      'Izolovaný DC/DC měnič, 1 W, vstup 5/12/24 V DC ±10 %, jednovýstupové (5/9/12/15 V) nebo ' +
      'dvouvýstupové (±5/±12/±15 V) provedení, izolace 1000 VDC, účinnost až 88,5 %',
    notes:
      'TRACO POWER "TRA 1 Series, 1 Watt DC/DC Converters" (katalogový list, rev. 29.7.2022) — ' +
      '⚠️ POZOR NA ZÁMĚNU NÁZVU: naprosto stejné označení "TRA1"/"TRA 1" nese i elektromagnetické ' +
      'výkonové relé Tianbo Electronics TRA1 v kategorii "Spínač/Relé" v této knihovně — jde o ' +
      'DVA ÚPLNĚ ODLIŠNÉ PRODUKTY DVOU RŮZNÝCH VÝROBCŮ (Tianbo relé vs. TracoPower DC/DC měnič) ' +
      'sdílející pouze shodný alfanumerický kód, nijak spolu nesouvisející — nutno pečlivě ' +
      'rozlišovat při vyhledávání/objednávání. TRA 1 Series (tento záznam) je malý IZOLOVANÝ ' +
      'DC/DC MĚNIČ s polořízenou (semi-regulated) výstupní regulací, průmyslovým standardním ' +
      'SIP pinoutem, určený k napájení řídicích obvodů/budičů tam, kde neregulované DC/DC měniče ' +
      'nevyhovují vstupnímu napěťovému rozsahu při změně zátěže. ⚠️ Datasheet dokumentuje celou ' +
      'parametrickou řadu 21 kombinací vstup/výstup (objednací kód TRA1-<vstup><výstup>, např. ' +
      'TRA1-1212 = 12V vstup, 12V jednoduchý výstup 84mA, TRA1-2423 = 24V vstup, ±15V duální ' +
      'výstup ±34mA) — do knihovny přidána jako jeden souhrnný záznam pro celou řadu, ne každá ' +
      'kombinace zvlášť. Vstupní napětí 5/12/24 V DC ±10 %, odběr naprázdno/plné zátěži 30/240 mA ' +
      '(5V modely) až 11/50 mA (24V modely). Izolační napětí vstup/výstup 1000 VDC (60s), izolační ' +
      'odpor >1000 MΩ, izolační kapacita 60 pF typ. Spínací kmitočet 50–120 kHz (frekvenční ' +
      'modulace). Regulace při změně vstupu ±1,05 % typ./±1,2 % max., zvlnění a šum (20 MHz ' +
      'pásmo) max. 60 mVp-p. Teplotní koeficient ±0,01 %/K typ. Zkratová ochrana (omezená, max ' +
      '0,5 s). Kapacitní zátěž max 220 µF (jednoduchý výstup) / 100 µF na výstup (duální). ' +
      'Provozní teplota -40 až +95 °C (derating 5 %/K nad +85°C), skladovací -50 až +125 °C, ' +
      'vlhkost max 95 % nekondenzující. Provoz do nadmořské výšky 5000 m. MTBF >2 000 000 h (dle ' +
      'MIL-HDBK-217F @25°C). Pájecí teplota max 260°C/10s. Certifikace: CB scheme (IEC 60950-1), ' +
      'UL 60950-1, CSA 60950-1-07. RoHS 2011/65/EU, REACH.',
    tags: 'io,dc-dc,měnič,izolovaný,napájecí-obvod,tracopower,tra1,sip,1w',
  },
  {
    name: 'BM28720MUV',
    packageType: 'VQFN032V5050 (32pin, 5,00×5,00×1,00 mm, reverzní chlazení/heat-radiation typ)',
    value:
      'Plně digitální (full digital) Class-D zesilovač reproduktoru s vestavěným DSP, 20 W+20 W ' +
      '(VCC=18,5V, RL=8Ω), I²S/LJ/RJ digitální vstup, I²S digitální výstup, 10–24 V DC (VCC)',
    notes:
      'ROHM Semiconductor "Middle Power Class-D Speaker Amplifier series — 20W+20W Full Digital ' +
      'Speaker Amplifier with built-in DSP" (dok. TSZ02201-0C1C0E900060-1-2, rev. 003, ' +
      '10.6.2016) — IC pro ploché TV a podobné prostorově/výkonově omezené aplikace, kombinuje ' +
      'vestavěný DSP (Digital Sound Processor: 12pásmový EQ na kanál, 3pásmový DRC, pre-scaler, ' +
      'channel mixer, fine master volume, hard clipper, level meter) s Class-D výkonovým stupněm ' +
      'BCD procesem (bipolární+CMOS+DMOS), eliminujícím ztráty vedení odporu sepnutí (turn-on ' +
      'resistance) a interní ztráty vedením — dosahuje vysoké účinnosti (~85-90 % dle grafů) bez ' +
      'nutnosti externího chladiče i při výkonu 40 W celkem. Digitální audio vstup I²S/LJ (left- ' +
      'justified)/RJ (right-justified) formát BEZ nutnosti master clocku, LRCLK 32k/44,1k/48 kHz, ' +
      'BCLK 32fs/48fs/64fs, SDATA 16/20/24 bitů; digitální I²S výstup (SDATAO) rovněž 16/20/24 ' +
      'bitů — umožňuje kaskádové zapojení/daisy-chain. Monaurální výstupní konfigurace (redukuje ' +
      'počet externích součástek). Ochranné funkce: přehřátí, podpětí, zkrat výstupu, přepětí DC, ' +
      'zastavení hodinového signálu. Soft-muting technologie eliminuje pop-noise při zapnutí/ ' +
      'vypnutí napájení (viz waveform grafy soft start/soft mute). Absolutní max.: VCC -0,3 až ' +
      '34 V (piny 17, 24), DVDD -0,3 až 4,5 V (pin 10), Tjmax +150 °C, provozní teplota -25 až ' +
      '+85 °C. Doporučený provozní rozsah: VCC 10–24 V, DVDD 3–3,6 V, min. zátěžová impedance ' +
      '5,4 Ω (VCC 18–24V) nebo 3,6 Ω (VCC<18V). Elektrické parametry @VCC=18V/DVDD=3,3V/f=1kHz/ ' +
      'RL=8Ω: klidový proud ICC1 typ 45 mA, THD+N typ 0,07 % @1W AES17, přeslechy (crosstalk) typ ' +
      '80 dB, výstupní šum typ 80 µVrms (A-vážený). PWM vzorkovací kmitočet 256/352,8/384 kHz dle ' +
      'fs=32/44,1/48 kHz. Aplikace: ploché TV (LCD/OLED), domácí audio, desktop PC, zábavní ' +
      'zařízení, elektronické hudební nástroje.',
    tags: 'io,zesilovač,audio,class-d,dsp,digitální,rohm,bm28720muv,reproduktor,i2s,vqfn',
  },
  {
    name: 'BM28723MUV',
    packageType: 'VQFN032V5050 (32pin, 5,00×5,00×1,00 mm, reverzní chlazení/heat-radiation typ)',
    value:
      'Plně digitální (full digital) Class-D zesilovač reproduktoru s vestavěným DSP, 17 W+17 W ' +
      '(VCCP1/2=18V, RL=8Ω), I²S/LJ/RJ digitální vstup, I²S digitální výstup, 10–24 V DC',
    notes:
      'ROHM Semiconductor "Middle Power Class-D Speaker Amplifier series — 17W+17W Full Digital ' +
      'Speaker Amplifier with built-in DSP" (dok. TSZ02201-0C1C0E900290-1-2, rev. 002, ' +
      '11.5.2018) — nižší výkonová varianta ze stejné produktové řady jako BM28720MUV v této ' +
      'knihovně (shodné pouzdro VQFN032V5050, shodný pinout, shodný princip s vestavěným DSP a ' +
      'BCD procesem) — ⚠️ rozdíly oproti BM28720MUV: (1) nižší výkon 17W+17W @VCCP=18V (oproti ' +
      '20W+20W u BM28720MUV) — dle popisu shodné pouzdro s menším chladicím reverzním ' +
      'plochým typem umožňuje jen tento nižší výkon bez externího chladiče; (2) NEVYŽADUJE ' +
      'EXTERNÍ SNUBBER OBVOD (No Snubber Circuit Required) díky řízení Slew Rate na výstupu — ' +
      'BM28720MUV naproti tomu ve svých měřicích podmínkách explicitně uvádí snubber obvod ' +
      '(Rsnb=5,6Ω, Csnb=680pF) na výstupním terminálu; (3) NOVÝ "Output Feedback Circuit" — ' +
      'zpětnovazební obvod z výstupu potlačující degradaci kvality zvuku při kolísání napájecího ' +
      'napětí, eliminuje nutnost velkých elektrolytických blokovacích kondenzátorů na Vcc (funkce ' +
      'u BM28720MUV neuvedena); (4) NOVÁ ochranná funkce "DC Voltage Protection for speaker" ' +
      '(ochrana reproduktoru proti stejnosměrné složce na výstupu) a přidaný pin ERRORX (13) — ' +
      'chybový příznak (High=normální provoz, Low=chyba), aktivovaný při zkratové/DC/tepelné ' +
      'ochraně — BM28720MUV tento diagnostický pin nemá (odpovídající pin 13 u BM28720MUV je ' +
      'ERROR bez explicitního "X" značení a bez podrobného popisu). Piny shodné číslování jako ' +
      'BM28720MUV (ADDR, BCLK, LRCLK, SDATA, PLL, REG15, DGND, SDATAO, RSTX, MUTEX, SCL, SDA, ' +
      'VCCP1/2, GNDP1/2, BSP/OUT 1P/1N/2P/2N). Absolutní max.: VCC(max) 30 V (piny 17, 24, nižší ' +
      'než 34V u BM28720MUV), DVDD(max) 4,5 V, Tjmax +150 °C, provozní teplota -25 až +85 °C. ' +
      'Doporučený napájecí rozsah 10–24 V. Zařazeno do kategorie "IO", stejně jako BM28720MUV v ' +
      'této knihovně. Aplikace: TV (LCD/OLED), domácí audio, desktop PC, zábavní zařízení, ' +
      'elektronické hudební nástroje.',
    tags: 'io,zesilovač,audio,class-d,dsp,digitální,rohm,bm28723muv,reproduktor,i2s,vqfn',
  },
  {
    name: 'BMP280',
    packageType:
      '8pin LGA kovové víko (metal-lid), rozměry pouzdra 2,0×2,5 mm, výška 0,95 mm',
    value:
      'Digitální absolutní barometrický tlakový senzor (piezorezistivní + mixed-signal ASIC), ' +
      'rozsah 300–1100 hPa, I²C (do 3,4 MHz) nebo SPI (3/4-vodičové, do 10 MHz), 1,71–3,6 V',
    notes:
      'Bosch Sensortec "BMP280 — Digital Pressure Sensor" (dok. BST-BMP280-DS001-26, rev. 1.26, ' +
      'říjen 2021) — nástupce staršího BMP180 (viz srovnávací tabulka v datasheetu), stejná ' +
      'proprietární Bosch APSM (Advanced Porous Silicon Membrane) MEMS technologie plně CMOS ' +
      'kompatibilní s hermeticky utěsněnou kavitou. Pouzdro o 63 % menší než BMP180 (2,0×2,5 mm ' +
      'vs 3,6×3,8 mm), přidána SPI sběrnice (BMP180 měla jen I²C) a nové IIR filtrovací režimy. ' +
      'Relativní přesnost ±0,12 hPa (ekv. ±1 m) v rozsahu 700–900 hPa @25°C, absolutní přesnost ' +
      'typ. ±1 hPa (950–1050 hPa, 0–40°C), teplotní koeficient offsetu 1,5 Pa/K (ekv. 12,6 cm/K). ' +
      'Spotřeba 2,7 µA @1 Hz vzorkovací rychlosti (nejnižší výkonový režim), špičkový proud během ' +
      'měření tlaku typ. 720 µA. Tři výkonové režimy: sleep (žádné měření), forced (jedno měření ' +
      'a návrat do sleep), normal (automatický cyklus měření/nečinnost). Volitelný oversampling ' +
      'tlaku i teploty nezávisle 0–16× (kombinace ultra low power až ultra high resolution, max. ' +
      'rozlišení 20 bit/0,16 Pa u tlaku, 20 bit/0,0003°C u teploty). Vestavěný IIR filtr ' +
      '(koeficient 0/2/4/8/16) pro potlačení krátkodobých rušení (např. bouchnutí dveří). Datový ' +
      'výstup přes surové ADC hodnoty + kompenzační koeficienty uložené ve výrobě (NVM), ' +
      'vyžadující výpočet kompenzačního vzorce hostitelským MCU (vzorce pro plovoucí řádovou ' +
      'čárku i 32bit pevnou řádovou čárku uvedeny v příloze datasheetu). Doba náběhu (start-up) ' +
      '2 ms max. Max. vzorkovací kmitočet 157–182 Hz (osrs_t=osrs_p=1). Provozní teplota -40 až ' +
      '+85 °C (plná přesnost 0–65°C), tlak 300–1100 hPa (ekv. +9000 až -500 m nad/pod hladinou ' +
      'moře). Absolutní max.: napájení -0,3 až 4,25 V, tlak 0–20000 hPa, ESD HBM ±2kV/CDM ±500V/ ' +
      'MM ±200V. RoHS, bez halogenů, MSL 1. Aplikace: vylepšení GPS navigace (time-to-first-fix, ' +
      'dead-reckoning), detekce podlaží ve výtahu, outdoor navigace, předpověď počasí, indikace ' +
      'vertikální rychlosti (výstup/sestup). Cílová zařízení: mobilní telefony, tablety, GPS ' +
      'zařízení, domácí meteostanice, letecké hračky, hodinky.',
    tags: 'io,senzor,tlak,barometrický,i2c,spi,mems,piezorezistivní,bosch,bmp280,lga',
  },
  {
    name: 'BME280',
    packageType:
      '8pin LGA kovové víko (metal-lid) s ventilačním otvorem, rozměry pouzdra 2,5×2,5×0,93 mm, ' +
      'rozteč pinů 0,65 mm, pad 0,35×0,35 mm',
    value:
      'Kombinovaný digitální senzor vlhkosti, tlaku a teploty, rozsah 0–100 % RH / 300–1100 hPa / ' +
      '-40 až +85 °C, I²C (do 3,4 MHz) nebo SPI (3/4-vodičové, do 10 MHz), VDD 1,71–3,6 V, ' +
      'VDDIO 1,2–3,6 V',
    notes:
      'Bosch Sensortec "BME280 — Combined humidity and pressure sensor" (dok. BST-BME280-DS002-15, ' +
      'rev. 1.6, září 2018) — registrově a výkonově kompatibilní s BMP280 v této knihovně (viz ' +
      'kap. 5.2 datasheetu), rozšířený o kapacitní senzor relativní vlhkosti s velmi rychlou ' +
      'odezvou. I²C adresa 0x76 (SDO=GND) nebo 0x77 (SDO=VDDIO), 7bitová, 6 MSB fixních (111011x). ' +
      'SPI mód 00 nebo 11 (auto-detekce dle SCK po sestupné hraně CSB), CSB musí být připojen na ' +
      'VDDIO pro aktivaci I²C. ' +
      'Spotřeba: 1,8 µA @1 Hz (vlhkost+teplota), 2,8 µA @1 Hz (tlak+teplota), 3,6 µA @1 Hz ' +
      '(vlhkost+tlak+teplota), 0,1 µA v sleep módu. Tři výkonové režimy: sleep/forced/normal ' +
      '(stejné jako BMP280), volitelný oversampling 0–16× nezávisle pro každou veličinu, ' +
      'IIR filtr (koeficient 0/2/4/8/16) pro tlak a teplotu (u vlhkosti nepoužit, není potřeba). ' +
      'Vlhkost: response time (τ63%) 1 s, absolutní přesnost ±3 %RH (20–80 %RH/25°C, včetně ' +
      'hystereze), hystereze ±1 %RH, nelinearita 1 %RH, rozlišení 0,008 %RH, šum (RMS) 0,02 %RH ' +
      'při nejvyšším oversamplingu, dlouhodobá stabilita 0,5 %RH/rok. ' +
      'Tlak: RMS šum 0,2 Pa (ekv. 1,7 cm) při nejvyšším oversamplingu a redukované šířce pásma, ' +
      'teplotní koeficient offsetu ±1,5 Pa/K (ekv. ±12,6 cm/K), absolutní přesnost ±1,0 hPa ' +
      '(300–1100 hPa/0–65°C plná přesnost), ±1,7 hPa mimo tento rozsah (-20 až 0°C), relativní ' +
      'přesnost ±0,12 hPa (700–900 hPa/25–40°C @VDD=3,3V), rozlišení 0,18 Pa při nejvyšším ' +
      'oversamplingu, dlouhodobá stabilita ±1,0 hPa/rok, max. vzorkovací kmitočet 157–182 Hz. ' +
      'Teplota: přesnost ±0,5°C @25°C (0–65°C plný rozsah ±1,0°C), rozlišení 0,01°C, šum (RMS) ' +
      '0,005°C při nejnižším oversamplingu. ' +
      'Absolutní max.: napájení (VDD/VDDIO) -0,3 až 4,25 V, tlak 0–20000 hPa, skladovací teplota ' +
      '-45 až +85°C (≤65 %RH), ESD HBM ±2kV/CDM ±500V/MM ±200V. RoHS, bez halogenů, MSL 1. ' +
      'Doba náběhu (start-up) 2 ms max. Aplikace: kontextové uvědomění (detekce změny místnosti), ' +
      'fitness/wellbeing, domácí automatizace (HVAC), IoT, GPS enhancement, indoor navigace ' +
      '(detekce patra), předpověď počasí, indikace vertikální rychlosti. Cílová zařízení: mobilní ' +
      'telefony, tablety, GPS zařízení, navigační systémy, herní ovladače, kamery, domácí ' +
      'meteostanice, letecké hračky, hodinky.',
    tags: 'io,senzor,vlhkost,tlak,teplota,barometrický,i2c,spi,mems,bosch,bme280,lga',
  },
  {
    name: 'REZ Series',
    packageType:
      '7pin SIP THT pouzdro, plast UL94V-0, rozměry 19,65×10,2×7,05 mm, hmotnost 2,7 g, piny ' +
      'v rozteči 2,54 mm (4 aktivní piny 1/2/4/6, zbylé pouze mechanické/neosazené pozice)',
    value:
      'Neregulovaný (unregulated) izolovaný DC/DC měnič, 2 W, vstup 5/9/12/15/24 V DC ±10 %, ' +
      'jednoduchý výstup 3,3/5/9/12/15/24 V DC, izolace 1000 VDC (nebo 2000 VDC u "H" varianty)',
    notes:
      'RECOM "ECONOLINE DC/DC-Converter REZ Series" (katalogový list, červenec 2006) — ⚠️ jiný ' +
      'výrobce a jiná řada než TRACO POWER TRA 1 Series v této knihovně (obě jsou izolované DC/DC ' +
      'měniče podobného výkonového rozsahu, ale nesouvisí) — na rozdíl od TRA 1 Series (semi- ' +
      'regulated výstup, aktivní regulace zátěže) je REZ Series čistě NEREGULOVANÝ měnič (výstupní ' +
      'napětí kolísá přímo úměrně vstupnímu napětí a zátěži, bez zpětnovazební regulace) — nižší ' +
      'cena, ale horší regulace zátěže (10-20 % dle výstupního napětí, oproti ±1,2 %/1 % typ. u ' +
      'TRA 1 Series). Vyšší výkon 2 W (oproti 1 W u TRA 1 Series), větší SIP7 pouzdro (oproti SIP4/ ' +
      '6 u TRA 1 Series), ale méně využitých pinů (jen 4 aktivní: 1=+Vin, 2=-Vin, 4=-Vout, 6=+Vout ' +
      '— piny 3, 5, 7 jsou jen mechanické). ⚠️ Datasheet dokumentuje CELOU PARAMETRICKOU ŘADU — 6 ' +
      'výstupních napětí (3,3/5/9/12/15/24 V) × 5 vstupních napětí (5/9/12/15/24 V) = 30 ' +
      'kombinací (objednací kód REZ-<vstup><výstup>S, např. REZ-0505S = 5V vstup, 5V výstup; ' +
      'přípona "H" pro 2000VDC izolaci; přípona "P" pro trvalou zkratovou ochranu místo ' +
      'jednosekundové) — do knihovny přidána jako jeden souhrnný záznam pro celou řadu, ne každá ' +
      'kombinace zvlášť. Provozní kmitočet 35 kHz min./50 kHz typ./85 kHz max. Účinnost při plné ' +
      'zátěži 70 % min./80 % typ. (nejvyšší 85 % u výstupů 12/15/24V). Zvlnění a šum (20MHz limit) ' +
      'max 150 mVp-p. Izolační kapacita 40-115 pF, izolační odpor min 10 GΩ. Zkratová ochrana 1s ' +
      '(standard) nebo trvalá ("P" varianta). Provozní teplota -40 až +85 °C (s deratingem dle ' +
      'grafu nad určitou teplotou), skladovací -55 až +125 °C, vlhkost 95 % RH. MTBF @25°C ' +
      '915×10³ hodin, @85°C 170×10³ hodin (dle MIL-HDBK 217F). Zařazeno do kategorie "IO", stejně ' +
      'jako TRA 1 Series v této knihovně. Pouzdro UL94V-0.',
    tags: 'io,dc-dc,měnič,izolovaný,neregulovaný,napájecí-obvod,recom,econoline,rez-series,sip7,2w',
  },

  // Optočleny
  {
    name: 'LTV-356T',
    packageType:
      'SMD mini-flat pouzdro (4 vývody typu gull-wing), rozměry cca 5,3×3,85×2,0 mm, rozteč ' +
      'vývodů 2,54 mm, taping 12mm/3000ks na cívce (varianta -TP nebo bez přípony), MSL1',
    value:
      'Optočlen (fototranzistorový optočlen) s galvanickým oddělením, proudový přenosový ' +
      'poměr CTR 50–600 % @IF=5mA/VCE=5V dle rankové třídy, izolační napětí Viso 3750 Vrms, ' +
      'VCEO 80 V',
    notes:
      'LITE-ON Optoelectronics "LTV-356T series — Photocoupler" (dok. DS70-2001-010, rev. R, ' +
      'účinnost 23.3.2024). ⚠️ NOVÁ SUB-KATEGORIE v "IO": první optočlen (photocoupler) v této ' +
      'knihovně — dvojice IR LED (vstup) + fototranzistor (výstup) v jednom pouzdře, poskytující ' +
      'galvanické oddělení mezi vstupním a výstupním obvodem (na rozdíl od "tripolárních" ' +
      'TLP140/200/270 v této knihovně, což jsou navzdory podobnému názvu Toshiba TLP série ' +
      'TRISIL přepěťové ochrany, ne optočleny). Zapojení pinů: 1=Anoda, 2=Katoda, 3=Emitor, ' +
      '4=Kolektor. Vstup (LED): VF typ. 1,2V/max 1,4V @IF=20mA, IF max 50mA (trvale), IFP max ' +
      '1A (impulzně 100µs/100Hz), VR max 6V, IR max 10µA @VR=4V, CT max 250pF, výkonová ztráta ' +
      'P max 70mW. Výstup (fototranzistor): VCEO 80V, VECO 6V, IC max 50mA, PC max 150mW, ' +
      'ICEO max 100nA @VCE=20V/IF=0. CTR (proudový přenosový poměr, IC/IF×100%) 50–600% ' +
      '@IF=5mA/VCE=5V — dostupné rankové třídy A (80-160%), B (130-260%), C (200-400%), D ' +
      '(300-600%), nebo neroztříděné (50-600%). VCE(sat) max 0,2V @IF=20mA/IC=1mA. Izolační ' +
      'odpor Riso 5×10¹⁰–1×10¹¹ Ω @DC500V/40-60% RH. Plovoucí kapacita Cf typ. 0,6pF/max 1pF ' +
      '@f=1MHz. Doba odezvy: náběh tr typ. 4µs/max 18µs, doběh tf typ. 3µs/max 18µs @VCC=5V/ ' +
      'IC=2mA/RL=100Ω. Celkový ztrátový výkon Ptot 170mW. Izolační napětí Viso 3750Vrms (AC, ' +
      '1 min, měřeno mezi zkratovanou anodou/katodou a zkratovaným kolektorem/emitorem). ' +
      'Provozní teplota -55 až +110°C, skladovací -55 až +150°C, pájecí teplota 260°C. ' +
      'Certifikace: UL1577, VDE DIN EN60747-5-5 (VDE 0884-5), CSA CA5A, CQC GB4943.1-2022/ ' +
      'GB8898-2011, FIMKO/DEMKO/SEMKO/NEMKO. ESD odolnost HBM 8000V/MM2000V/CDM2000V. RoHS, ' +
      'MSL1, k dispozici i bezhalogenová varianta.',
    tags: 'io,optočlen,photocoupler,fototranzistor,galvanické-oddělení,liteon,ltv-356t,mini-flat,smd',
  },
  {
    name: 'EL817 Series',
    packageType:
      'standardní THT DIP-4 (6,5×4,58mm, rozteč 2,54mm), volitelně varianta "M" (širší rozteč ' +
      'vývodů 0,4"/10,16mm) nebo SMD lead-formy S/S1 (povrchová montáž, standardní/nízkoprofilová) ' +
      '/S2 (gull-wing), páskování TA/TB/TU/TD, volitelný železný nebo měděný rámeček vývodů',
    value:
      'Optočlen (fototranzistorový optočlen) s galvanickým oddělením, proudový přenosový poměr ' +
      'CTR 50–600 % @IF=5mA/VCE=5V dle rankové třídy, izolační napětí Viso 5000 Vrms, VCEO 35 V',
    schematicImage: 'EL817.jpg',
    notes:
      'Everlight Electronics "EL817 Series — 4 Pin DIP Phototransistor Photocoupler" (dok. ' +
      'DPC-0000046, rev. 10, vydáno 21.4.2010/aktualizováno 2010-05-29). Druhý optočlen v této ' +
      'knihovně vedle LITE-ON LTV-356T (viz jeho záznam pro obecný kontext optočlenů) — na ' +
      'rozdíl od LTV-356T (výhradně SMD mini-flat pouzdro, Viso 3750Vrms, VCEO 80V) jde o klasický ' +
      'THT DIP-4 optočlen (s volitelnými SMD variantami leadformu) s vyšší izolační pevností ' +
      '(5000Vrms) a vyšší kreepage/clearance vzdáleností (>7,62mm), ale nižším VCEO (35V). ' +
      'Zapojení pinů shodné s LTV-356T: 1=Anoda, 2=Katoda, 3=Emitor, 4=Kolektor. Objednací kód ' +
      'EL817(X)(Y)(Z)-FV: X=leadform (S/S1/S2/M/prázdné), Y=CTR ranková třída (A/B/C/D/X/Y/ ' +
      'prázdné), Z=páskování (TA/TB/TU/TD/prázdné), F=materiál rámečku vývodů (F=železo, ' +
      'prázdné=měď), V=volitelná VDE certifikace. Rankové třídy CTR (@IF=5mA/VCE=5V): základní ' +
      'EL817 (50–600%), A (80–160%), B (130–260%), C (200–400%), D (300–600%), X (100–200%), Y ' +
      '(150–300%). Vstup (LED): VF typ. 1,2V/max 1,4V @IF=20mA, IF max 60mA (trvale), IFP max 1A ' +
      '(impulzně 1µs), VR max 6V, IR max 10µA @VR=4V, Cin max 250pF @1kHz, PD max 100mW ' +
      '(derating 2,9mW/°C nad 100°C). Výstup (fototranzistor): VCEO 35V, VECO 6V, IC max 50mA, ' +
      'PC max 150mW (derating 5,8mW/°C nad 100°C), ICEO max 100nA @VCE=20V/IF=0. VCE(sat) typ. ' +
      '0,1V/max 0,2V @IF=20mA/IC=1mA. Izolační odpor RIO min 5×10¹⁰Ω @VIO=500VDC/40-60%RH. ' +
      'Plovoucí kapacita CIO typ. 0,6pF/max 1,0pF @VIO=0/f=1MHz. Mezní kmitočet fc typ. 80kHz ' +
      '(-3dB) @VCE=5V/IC=2mA/RL=100Ω. Doba náběhu tr typ. 4µs/max 18µs, doba doběhu tf typ. ' +
      '3µs/max 18µs (shodné podmínky jako LTV-356T). Celkový ztrátový výkon PTOT max 200mW. ' +
      'Provozní teplota -55 až +110°C, skladovací -55 až +125°C, pájecí teplota 260°C/10s. ' +
      'Certifikace: UL (E214129), VDE (132249), SEMKO (716108), NEMKO (P08209467), DEMKO ' +
      '(314683), FIMKO (FI 224433), CSA (1143601). Pb-free, RoHS.',
    tags: 'io,optočlen,photocoupler,fototranzistor,galvanické-oddělení,everlight,el817,dip-4,tht',
  },
  {
    name: 'PC817 Series',
    packageType:
      'THT DIP-4, epoxidová pryskyřice, rozměry 6,5×4,60mm, rozteč vývodů 2,54mm, vývody z ' +
      'měděné slitiny, povrchová úprava dle obchodního označení — SnBi povlak (1-4% Bi, ' +
      'business dealing name "...NSZ1B") nebo čistý cín (business dealing name "...CSZ9F"), ' +
      'hmotnost ~0,23g',
    value:
      'Optočlen (fototranzistorový optočlen) s galvanickým oddělením, kolektorový proud IC ' +
      '2,5–30 mA @IF=5mA/VCE=5V dle rankové třídy (rank A 4,0–8,0 mA, rank B 6,5–13 mA aj. — ' +
      'viz poznámka), izolační napětí Viso 5000 Vrms, VCEO 80 V',
    notes:
      'Sharp Corporation "Specifications — Photocoupler, Model No. PC817" — dvě verze téhož ' +
      'datasheetu evidované v této knihovně: business dealing name "PC817X1NSZ1B" (rank A, ' +
      'spec. ED-16P010, vydáno 7.10.2016, tovární označení "K" = Kyushu Denshi Japonsko, SnBi ' +
      'povlak vývodů) a "PC817X2CSZ9F" (rank B, spec. ED-14P010, vydáno 24.9.2014, tovární ' +
      'označení "W" = Lite-ON OPTO Technology Changzhou Čína, čistý cín na vývodech) — obě mají ' +
      'shodnou elektro-optickou charakteristiku, liší se jen konkrétním rankem/suffixem, ' +
      'výrobním závodem a povrchovou úpravou vývodů. Třetí optočlen v této knihovně vedle ' +
      'LITE-ON LTV-356T a Everlight EL817 (viz jejich záznamy) — patrně nejrozšířenější a ' +
      'nejčastěji citovaný obecný optočlen na trhu (mnoho jiných výrobců nabízí přímé "PC817" ' +
      'ekvivalenty/klony). Zapojení pinů shodné s ostatními optočleny v knihovně: 1=Anoda, ' +
      '2=Katoda, 3=Emitor, 4=Kolektor. Základní řada "PC817" zahrnuje širokou škálu rankových ' +
      'tříd dle tabulky obchodních označení (přípona "NSZ1B" nebo "CSZ9F" dle výše): PC817XN.. ' +
      '(bez/s libovolným rankem, Ic 2,5-30mA), PC817X1..=A (4,0-8,0mA), X2=B (6,5-13mA), X3=C ' +
      '(10-20mA), X4=D (15-30mA), X5=A nebo B (4,0-13mA), X6=B nebo C (6,5-20mA), X7=C nebo D ' +
      '(10-30mA), X8=A, B nebo C (4,0-20mA), X9=B, C nebo D (6,5-30mA), X0=A, B, C nebo D ' +
      '(4,0-30mA) — testováno @IF=5mA/VCE=5V/Ta=25°C. Vstup (LED): VF typ. 1,2V/max 1,4V @IF=20mA, VFM (impulzní) max ' +
      '3,0V @IFM=0,5A, IF max 50mA (trvale), IFM max 1A (impulzně, šířka ≤100µs, duty ≤0,001), ' +
      'VR max 6V, IR max 10µA @VR=4V, Ct max 250pF @V=0/f=1kHz, P max 70mW. Výstup ' +
      '(fototranzistor): VCEO 80V, VECO 6V, IC max 50mA, PC max 150mW, ICEO (dark current) max ' +
      '100nA @VCE=50V/IF=0, BVCEO min 80V @IC=0,1mA/IF=0, BVECO min 6V @IE=10µA/IF=0. VCE(sat) ' +
      'typ. 0,1V/max 0,2V @IF=20mA/IC=1mA. Izolační odpor RISO 5×10¹⁰–10¹¹ Ω @DC500V/40-60%RH. ' +
      'Plovoucí kapacita Cf typ. 0,6pF/max 1,0pF @V=0/f=1MHz. Mezní kmitočet fc typ. 80kHz ' +
      '(-3dB) @VCE=5V/IC=2mA/RL=100Ω. Doba náběhu tr typ. 4µs/max 18µs, doba doběhu tf typ. ' +
      '3µs/max 18µs. Celkový ztrátový výkon Ptot max 200mW. Provozní teplota -30 až +100°C ' +
      '(užší rozsah než LTV-356T/EL817, jejichž Topr sahá do -55°C), skladovací -55 až +125°C, ' +
      'pájecí teplota 270°C/10s. Schváleno UL (E64380, "under preparation" v tomto dok.), CSA ' +
      '("under preparation"). Shoda s RoHS (2011/65/EU), bez ODS látek a bromovaných retardérů ' +
      'hoření (PBB/PBDE). Datum kódu na pouzdru: 3místný kód (rok+týden výroby).',
    tags: 'io,optočlen,photocoupler,fototranzistor,galvanické-oddělení,sharp,pc817,dip-4,tht',
  },
  {
    name: 'ILD205T',
    packageType:
      'SMD SOIC-8A, rozteč vývodů 1,27mm (0,05"), páskové balení (jediná dostupná varianta ' +
      'balení), Pb-free (e3)',
    value:
      'DVOUKANÁLOVÝ optočlen (2× fototranzistorový optočlen v jednom pouzdře) s galvanickým ' +
      'oddělením, CTR 40–80 % @IF=10mA/VCE=5V, izolační napětí Viso 3000 Vrms, BVCEO 70 V',
    schematicImage: 'ILD205T.jpg',
    notes:
      'Vishay Semiconductors "ILD205T/206T/207T/211T/213T/217T — Optocoupler, Phototransistor ' +
      'Output, Dual Channel, SOIC-8 package" (dok. č. 83647, rev. 1.4, 26.10.2004). ⚠️ NOVÁ ' +
      'SUB-KATEGORIE mezi optočleny v této knihovně: první DVOUKANÁLOVÝ optočlen (2 nezávislé ' +
      'LED+fototranzistor páry v jediném SOIC-8 pouzdře) — na rozdíl od jednokanálových LTV-356T/ ' +
      'EL817/PC817 (viz jejich záznamy) umožňuje galvanicky oddělit dva signály najednou v ' +
      'kompaktním SMD pouzdře bez průchozích otvorů, vhodné pro aplikace s vysokou hustotou ' +
      'osazení. Vyšší BVCEO (70V) oproti běžnému průmyslovému standardu 30V dává vyšší ' +
      'bezpečnostní rezervu. Zapojení pinů: 1=Anoda(ch1), 2=Katoda(ch1), 3=Anoda(ch2), ' +
      '4=Katoda(ch2), 5=Emitor(ch2), 6=Kolektor(ch2), 7=Emitor(ch1), 8=Kolektor(ch1). Nejnižší ' +
      'CTR varianta řady (viz sourozenecké záznamy ILD206T/207T/211T/213T/217T pro plné ' +
      'specifikace CTR). Vstup (na kanál): VR max 6,0V, špičkový impulzní proud 1,0A ' +
      '(1,0µs/300pps), trvalý propustný proud 30mA, Pdiss 50mW (derating 0,66mW/°C nad 25°C), ' +
      'VF typ. 1,2V/max 1,55V @IF=10mA, IR max 100µA @VR=6V, CO typ. 25pF @VR=0. Výstup (na ' +
      'kanál): BVCEO 70V, BVECO 7,0V, Pdiss 125mW (derating 1,67mW/°C nad 25°C), ICEO typ. ' +
      '5,0nA/max 50nA @VCE=10V/IF=0, CCE typ. 10pF @VCE=0. Coupler: celkový výkon pouzdra Ptot ' +
      '300mW (2 LED + 2 detektory, derating 4,0mW/°C nad 25°C), VCE(sat) max 0,4V @IF=10mA/ ' +
      'IC=2,5mA, CIO typ. 0,5pF, izolační odpor RIO typ. 100 GΩ, izolační zkušební napětí VISO ' +
      '3000Vrms (t=1s). CTRDC @VCE=5V/IF=10mA: min 40/max 80%; @VCE=5V/IF=1mA: min 13/typ. ' +
      '30%. Doba zapnutí ton typ. 5,0µs, doba vypnutí toff typ. 4,0µs (@IC=2mA/RL=100Ω/VCC=5V). ' +
      'Provozní teplota -55 až +100°C, skladovací -55 až +150°C, pájecí teplota 260°C/10s. ' +
      'Certifikace UL1577 (File E52744, System Code Y). RoHS 2002/95/EC, WEEE 2002/96/EC, bez ' +
      'ODS látek (potvrzeno prohlášením výrobce).',
    tags: 'io,optočlen,photocoupler,fototranzistor,galvanické-oddělení,dvoukanálový,vishay,ild205t,soic-8,smd',
  },
  {
    name: 'ILD206T',
    packageType: 'shodné s ILD205T — viz jeho záznam pro plné mechanické specifikace',
    value:
      'DVOUKANÁLOVÝ optočlen, CTR 63–125 % @IF=10mA/VCE=5V, izolační napětí Viso 3000 Vrms, ' +
      'BVCEO 70 V',
    schematicImage: 'ILD205T.jpg',
    notes:
      'Vishay "ILD205T/206T/207T/211T/213T/217T" — součást řady, viz záznam "ILD205T" v této ' +
      'knihovně pro plné společné elektrické/mechanické specifikace. CTRDC @VCE=5V/IF=10mA: ' +
      'min 63/max 125%; @VCE=5V/IF=1mA: min 22/typ. 45%.',
    tags: 'io,optočlen,photocoupler,fototranzistor,galvanické-oddělení,dvoukanálový,vishay,ild206t,soic-8,smd',
  },
  {
    name: 'ILD207T',
    packageType: 'shodné s ILD205T — viz jeho záznam pro plné mechanické specifikace',
    value:
      'DVOUKANÁLOVÝ optočlen, CTR 100–200 % @IF=10mA/VCE=5V, izolační napětí Viso 3000 Vrms, ' +
      'BVCEO 70 V',
    schematicImage: 'ILD205T.jpg',
    notes:
      'Vishay "ILD205T/206T/207T/211T/213T/217T" — součást řady, viz záznam "ILD205T" v této ' +
      'knihovně pro plné společné elektrické/mechanické specifikace. Nejvyšší CTR varianta s ' +
      'definovaným rozsahem (X-, XXX- a Y- varianty mají jen jednostranně ohraničené minimum). ' +
      'CTRDC @VCE=5V/IF=10mA: min 100/max 200%; @VCE=5V/IF=1mA: min 34/typ. 70%.',
    tags: 'io,optočlen,photocoupler,fototranzistor,galvanické-oddělení,dvoukanálový,vishay,ild207t,soic-8,smd',
  },
  {
    name: 'ILD211T',
    packageType: 'shodné s ILD205T — viz jeho záznam pro plné mechanické specifikace',
    value: 'DVOUKANÁLOVÝ optočlen, CTR > 20 % @IF=10mA/VCE=5V, izolační napětí Viso 3000 Vrms, ' +
      'BVCEO 70 V',
    schematicImage: 'ILD205T.jpg',
    notes:
      'Vishay "ILD205T/206T/207T/211T/213T/217T" — součást řady, viz záznam "ILD205T" v této ' +
      'knihovně pro plné společné elektrické/mechanické specifikace. ⚠️ Datasheet uvádí pro ' +
      'tento typ pouze jednostranně ohraničené minimum CTR (bez max. hodnoty) — CTRDC ' +
      '@VCE=5V/IF=10mA: min 20% (max. neudáno).',
    tags: 'io,optočlen,photocoupler,fototranzistor,galvanické-oddělení,dvoukanálový,vishay,ild211t,soic-8,smd',
  },
  {
    name: 'ILD213T',
    packageType: 'shodné s ILD205T — viz jeho záznam pro plné mechanické specifikace',
    value: 'DVOUKANÁLOVÝ optočlen, CTR > 100 % @IF=10mA/VCE=5V, izolační napětí Viso 3000 Vrms, ' +
      'BVCEO 70 V',
    schematicImage: 'ILD205T.jpg',
    notes:
      'Vishay "ILD205T/206T/207T/211T/213T/217T" — součást řady, viz záznam "ILD205T" v této ' +
      'knihovně pro plné společné elektrické/mechanické specifikace. ⚠️ Datasheet uvádí pro ' +
      'tento typ pouze jednostranně ohraničené minimum CTR (bez max. hodnoty) — CTRDC ' +
      '@VCE=5V/IF=10mA: min 100% (max. neudáno).',
    tags: 'io,optočlen,photocoupler,fototranzistor,galvanické-oddělení,dvoukanálový,vishay,ild213t,soic-8,smd',
  },
  {
    name: 'ILD217T',
    packageType: 'shodné s ILD205T — viz jeho záznam pro plné mechanické specifikace',
    value: 'DVOUKANÁLOVÝ optočlen, CTR > 100 % @IF=1mA/VCE=5V, izolační napětí Viso 3000 Vrms, ' +
      'BVCEO 70 V',
    schematicImage: 'ILD205T.jpg',
    notes:
      'Vishay "ILD205T/206T/207T/211T/213T/217T" — součást řady, viz záznam "ILD205T" v této ' +
      'knihovně pro plné společné elektrické/mechanické specifikace. ⚠️ POZOR: na rozdíl od ' +
      'ostatních členů řady je CTR pro ILD217T testován a specifikován při NIŽŠÍM budicím ' +
      'proudu IF=1mA (ne 10mA) — CTRDC @VCE=5V/IF=1mA: min 100/typ. 120% (hodnota @IF=10mA v ' +
      'datasheetu neuvedena).',
    tags: 'io,optočlen,photocoupler,fototranzistor,galvanické-oddělení,dvoukanálový,vishay,ild217t,soic-8,smd',
  },
  {
    name: 'LTV-817 (LTV-8X7 Series, 1-kanálový)',
    packageType:
      'THT DIP-4 (standardní rozteč 2,54mm), varianta "M" (širší rozteč vývodů 0,4"/10,16mm) ' +
      'nebo SMD "S" (povrchová montáž), tape&reel varianty -TA/-TA1/-TP u "S" provedení',
    value:
      'Optočlen (fototranzistorový optočlen) s galvanickým oddělením, CTR 50–600 % @IF=5mA/ ' +
      'VCE=5V dle rankové třídy, izolační napětí Viso 5000 Vrms, VCEO 35 V',
    notes:
      'LITE-ON Optoelectronics "LTV-8X7 Series — Photocoupler" (dok. DS-70-96-0016, rev. U, ' +
      'účinnost 3.12.2024). Čtvrtý optočlen v této knihovně vedle LTV-356T, EL817, PC817 a ' +
      'dvoukanálové řady Vishay ILD205T (viz jejich záznamy) — 1-kanálová (jediný LED+ ' +
      'fototranzistor pár) základní varianta řady "8X7", elektricky téměř totožná s Everlight ' +
      'EL817 (stejné VCEO=35V, Viso=5000Vrms) — pravděpodobně přímý konkurenční ekvivalent. Na ' +
      'rozdíl od EL817/PC817 nabízí LTV-8X7 řada navíc VÍCEKANÁLOVÉ varianty ve stejné rodině ' +
      '(LTV-827 = 2-kanálový DIP-8, LTV-847 = 4-kanálový DIP-16, viz jejich záznamy), sdílející ' +
      'shodné elektrické parametry jednoho kanálu. Zapojení pinů shodné s ostatními jedno' +
      'kanálovými optočleny v knihovně: 1=Anoda, 2=Katoda, 3=Emitor, 4=Kolektor. Rankové třídy ' +
      'CTR (@IF=5mA/VCE=5V/Ta=25°C): L (50-100%), A (80-160%), B (130-260%), C (200-400%), D ' +
      '(300-600%), bez binu (50-600%). Vstup (LED): VF typ. 1,2V/max 1,4V @IF=20mA, IF max ' +
      '50mA, IFP max 1A (impulzně 100µs/100Hz), VR max 6V, IR max 10µA @VR=4V, Ct max 250pF ' +
      '@1kHz, P max 70mW. Výstup (fototranzistor): VCEO 35V, VECO 6V, IC max 50mA, PC max ' +
      '150mW, ICEO max 100nA @VCE=20V/IF=0. VCE(sat) typ. 0,1V/max 0,2V @IF=20mA/IC=1mA. ' +
      'Izolační odpor RISO 5×10¹⁰–10¹¹ Ω @DC500V/40-60%RH. Plovoucí kapacita Cf typ. 0,6pF/max ' +
      '1,0pF @V=0/f=1MHz. Mezní kmitočet fc typ. 80kHz (-3dB) @VCE=5V/IC=2mA/RL=100Ω. Doba ' +
      'náběhu tr typ. 4µs/max 18µs, doba doběhu tf typ. 3µs/max 18µs. Celkový ztrátový výkon ' +
      'Ptot max 200mW. Provozní teplota LTV-817 -55 až +110°C (širší než LTV-827/847, které ' +
      'mají -40 až +105°C), skladovací -55 až +125°C, pájecí teplota 260°C/10s. Certifikace ' +
      'UL1577, VDE DIN EN60747-5-5 (VDE 0884-5), CSA CA5A, CQC GB4943.1-2022, Nordic Safety ' +
      '(FIMKO/NEMKO/SEMKO/DEMKO), BSI. RoHS, MSL1, halogenová volná varianta k dispozici.',
    tags: 'io,optočlen,photocoupler,fototranzistor,galvanické-oddělení,liteon,ltv-817,dip-4,tht,1-kanálový',
  },
  {
    name: 'LTV-827 (LTV-8X7 Series, 2-kanálový)',
    packageType:
      'THT DIP-8 (standardní rozteč 2,54mm), varianta "M" (širší rozteč vývodů) nebo SMD "S" ' +
      '(povrchová montáž), tape&reel varianty -TA/-TA1 u "S" provedení',
    value:
      'DVOUKANÁLOVÝ optočlen (2× fototranzistorový optočlen v jednom pouzdře) s galvanickým ' +
      'oddělením, CTR 50–600 % @IF=5mA/VCE=5V dle rankové třídy (na kanál), izolační napětí ' +
      'Viso 5000 Vrms, VCEO 35 V',
    notes:
      'LITE-ON "LTV-8X7 Series" — součást řady, viz záznam "LTV-817" v této knihovně pro plné ' +
      'společné elektrické parametry jednoho kanálu. Druhý dvoukanálový optočlen v této ' +
      'knihovně vedle Vishay ILD205T (viz jeho záznam) — na rozdíl od ILD205T (SOIC-8 SMD, ' +
      'VCEO=70V, Viso=3000Vrms) jde o klasické THT DIP-8 pouzdro (i SMD "S" varianta) s nižším ' +
      'VCEO (35V) a vyšší izolací (5000Vrms). Zapojení pinů: 1=Anoda(ch1), 2=Katoda(ch1), ' +
      '3=Anoda(ch2), 4=Katoda(ch2), 5=Emitor(ch2), 6=Kolektor(ch2), 7=Emitor(ch1), ' +
      '8=Kolektor(ch1) — shodné s Vishay ILD205T. Rankové třídy CTR (na kanál, @IF=5mA/VCE=5V): ' +
      'bez binu (50-600%), A (80-160%), B (130-260%), C (200-400%), D (300-600%), BC ' +
      '(130-400%), CD (200-600%). ⚠️ Provozní teplota LTV-827 užší než LTV-817: -40 až +105°C.',
    tags: 'io,optočlen,photocoupler,fototranzistor,galvanické-oddělení,dvoukanálový,liteon,ltv-827,dip-8,tht',
  },
  {
    name: 'LTV-847 (LTV-8X7 Series, 4-kanálový)',
    packageType:
      'THT DIP-16 (standardní rozteč 2,54mm), varianta "M" (širší rozteč vývodů) nebo SMD "S" ' +
      '(povrchová montáž)',
    value:
      'ČTYŘKANÁLOVÝ optočlen (4× fototranzistorový optočlen v jednom pouzdře) s galvanickým ' +
      'oddělením, CTR 50–600 % @IF=5mA/VCE=5V dle rankové třídy (na kanál), izolační napětí ' +
      'Viso 5000 Vrms, VCEO 35 V',
    notes:
      'LITE-ON "LTV-8X7 Series" — součást řady, viz záznam "LTV-817" v této knihovně pro plné ' +
      'společné elektrické parametry jednoho kanálu. ⚠️ NOVÁ SUB-KATEGORIE mezi optočleny v ' +
      'této knihovně: první ČTYŘKANÁLOVÝ optočlen (4 nezávislé LED+fototranzistor páry v ' +
      'jediném DIP-16 pouzdře) — nejvyšší hustota integrace optočlenů v této knihovně, vhodné ' +
      'pro paralelní galvanické oddělení sběrnice/více signálů (např. datová sběrnice, více ' +
      'diskrétních signálů). Zapojení pinů: 1,2=Anoda/Katoda(ch1), 3,4=Anoda/Katoda(ch2), ' +
      '5,6=Anoda/Katoda(ch3), 7,8=Anoda/Katoda(ch4), 9,10=Emitor/Kolektor(ch4), 11,12=Emitor/ ' +
      'Kolektor(ch3), 13,14=Emitor/Kolektor(ch2), 15,16=Emitor/Kolektor(ch1) (přesné pořadí ' +
      'anoda/katoda a emitor/kolektor viz vnitřní schéma v datasheetu). Rankové třídy CTR (na ' +
      'kanál, @IF=5mA/VCE=5V): bez binu (50-600%), BC (130-400%), CD (200-600%) — užší nabídka ' +
      'ranků než LTV-817/827 (bez samostatných A/B/C/D tříd). ⚠️ Provozní teplota shodná s ' +
      'LTV-827: -40 až +105°C (užší než LTV-817).',
    tags: 'io,optočlen,photocoupler,fototranzistor,galvanické-oddělení,čtyřkanálový,liteon,ltv-847,dip-16,tht',
  },

  // Ethernet kontroléry
  {
    name: 'W5500',
    packageType:
      'SMD LQFP-48 (7×7mm, rozteč 0,5mm), vyžaduje externí 25MHz krystal (piny XI/CLKIN, XO), ' +
      'externí referenční rezistor 12,4kΩ/1% (pin EXRES1), externí referenční kondenzátor ' +
      '4,7µF (pin TOCAP), síťový (LAN) transformátor 1:1/350µH mezi PHY a RJ45 konektorem',
    value:
      'Plně hardwarový (hardwired) TCP/IP embedded Ethernet kontrolér s integrovaným 10/100 ' +
      'Ethernet MAC+PHY, SPI rozhraní (SPI mód 0/3), 32KB interní TX/RX paměť, 8 nezávislých ' +
      'hardwarových socketů',
    notes:
      'WIZnet "W5500 Datasheet Version 1.0" (srpen 2013). ⚠️ NOVÝ TYP součástky v této ' +
      'knihovně: první hardwarový TCP/IP síťový kontrolér — na rozdíl od Wi-Fi ' +
      'mikrokontrolérů ESP32/ESP8285/ESP8684 v této knihovně (které běží vlastní firmware/ ' +
      'RTOS a implementují síťový zásobník softwarově) jde o čistě HARDWAROVOU implementaci ' +
      'celého TCP/IP zásobníku (TCP, UDP, ICMP, IPv4, ARP, IGMP v1/v2, PPPoE) v křemíku — ' +
      'hostitelský mikrokontrolér komunikuje jen přes jednoduché SPI registrové rozhraní a ' +
      'socket API, bez nutnosti vlastní implementace síťového zásobníku. Nepodporuje IP ' +
      'fragmentaci. Podporuje Wake-on-LAN přes UDP a power-down mód pro úsporu energie. LED ' +
      'výstupy: Full/Half duplex, Link, Speed, Active. SPI podporuje teoretickou rychlost až ' +
      '80MHz, garantovaná (testovaná/změřená) rychlost 33,3MHz. Napájení 3,3V (VDD/AVDD, ' +
      '2,97-3,63V) s 5V tolerantními I/O vstupy. Interní 1,2V regulátor (pin 1V2O). Absolutní ' +
      'maximum: VDD -0,5 až 4,6V, VIN -0,5 až 6V, VOUT -0,5 až 4,6V, IIN ±5mA, Top -40 až ' +
      '+85°C, Tstg -65 až +150°C. ESD: HBM 2000V (třída 2), MM 200V (třída B), CDM 500V ' +
      '(třída III). Odběr proudu: normální provoz typ. 132mA, power-down mód typ. 13mA, ' +
      '100M link typ. 128mA, 10M link typ. 75mA, un-link (auto-negotiation) typ. 65mA. Reset ' +
      'cyklus TRC min 500µs, doba do PLL lock TPL max 1ms. Doba probuzení napěťového ' +
      'regulátoru 10µs. Krystal: 25MHz, tolerance ±30ppm, stínová kapacita max 7pF, zátěžová ' +
      'kapacita 18pF, stárnutí max ±3ppm/rok. SPI časování: SCK vysoký/nízký čas min 6ns, SCSn ' +
      'vysoký čas min 30ns, setup/hold časy 3-5ns. Nepodporuje auto-MDIX — nutné rozlišovat ' +
      'přímý/křížený kabel dle připojeného zařízení. Cílové aplikace: síťové zásuvné moduly, ' +
      'sériové/paralelní/USB-na-Ethernet převodníky, bezpečnostní systémy (DVR, IP kamery), ' +
      'průmyslová a budovní automatizace, zdravotnická monitorovací zařízení, vestavěné ' +
      'servery.',
    tags: 'io,ethernet,tcp-ip,síťový-kontrolér,wiznet,w5500,spi,lqfp-48,hardwired',
  },

  // Napěťové supervizory (reset obvody)
  {
    name: 'TPS3809J25',
    packageType: '3-pinové SOT-23 (DBV), rozměry 2,90×1,60mm, piny: 1=GND, 2=RESET, 3=VDD',
    value:
      'Napěťový supervizor (reset obvod), fixní záporně čítaný práh VIT- = 2,25 V (typ.), ' +
      'push-pull výstup RESET (aktivní v L), klidový proud typ. 9µA',
    notes:
      'Texas Instruments "TPS3809J25, TPS3809L30, TPS3809K33, TPS3809I50 — TPS3809x 3-Pin ' +
      'Supply Voltage Supervisors" (dok. SLVS228D, srpen 1999, revidováno prosinec 2020). ⚠️ ' +
      'NOVÝ TYP součástky v této knihovně: první napěťový supervizor/obvod pro sledování ' +
      'napájení a generování resetu — jednoduchý 3pinový obvod (bez externích součástek) pro ' +
      'inicializaci a časovou supervizi systému, typicky u DSP/procesorových systémů — hlídá ' +
      'napájecí napětí VDD a drží výstup RESET aktivní (nízko), dokud VDD nepřekročí prahové ' +
      'napětí VIT, poté ještě po interním zpožďovacím časovači (typ. 200ms) teprve uvolní ' +
      'RESET do neaktivního stavu (vysoko) — zajišťuje spolehlivý reset systému po zapnutí i ' +
      'při krátkých poklesech napájení (brownout). Pin-kompatibilní s MAX809. Novější ' +
      'alternativa se stejnými piny/funkcemi/elektrickými parametry: TLV809E. Součást rodiny ' +
      'TPS3809 lišící se jen prahovým napětím VIT (viz sourozenecké záznamy "TPS3809L30"/ ' +
      '"TPS3809K33"/"TPS3809I50" pro ostatní prahy) — objednací kód TPS380<funkce><práh><pouzdro>' +
      '<balení>, např. TPS3809J25DBVR = funkce 9 (tento typ), práh J (2,25V), pouzdro DBV ' +
      '(SOT-23), balení R (cívka). Během power-on je RESET aktivní, dokud VDD nepřekročí 1,1V, ' +
      'pak obvod sleduje práh VIT. Absolutní maximum: VDD max 6,5V (ne déle než 1000h ' +
      'nepřetržitě), ostatní piny -0,3 až 6,5V, IOL max 5mA, IOH max -5mA, vstupní/výstupní ' +
      'svorkovací proud ±20mA, Top -40 až +85°C, Tstg -65 až +150°C. Doporučené provozní ' +
      'podmínky: VDD 2-6V, proud RESET sink při startu max 50µA. Ztrátový výkon (DBV pouzdro) ' +
      '437mW @TA<25°C, derating 3,5mW/°C, 280mW @70°C, 227mW @85°C. VOH min VDD-0,2V @IOH=-500µA/ ' +
      'VDD=2,5-6V (nebo VDD-0,4V @IOH=-2 až -4mA). VOL max 0,3V @IOL=500µA (nebo max 0,4V ' +
      '@IOL=2-4mA). Napětí "power-up reset" (nejnižší napájecí napětí, při kterém je RESET ' +
      'ještě aktivní) max 0,2V @VDD≥1,1V/IOL=50µA. Prahová hystereze Vhys 30mV (typ., pro tento ' +
      'typ J25). Klidový proud IDD typ. 9µA @VDD=2V / typ. 20µA @VDD=6V. Vstupní kapacita CI ' +
      'typ. 5pF. Šířka pulzu tw min 10µs. Doba zpoždění td (od VDD≥VIT+0,2V do uvolnění RESET) ' +
      'min 120ms/typ. 200ms/max 280ms. Doba šíření tPHL (VDD do RESET, sestupná hrana) typ. ' +
      '10µs. Doporučen bypass keramický kondenzátor 0,1µF na VDD pro stabilitu prahového ' +
      'napětí.',
    tags: 'io,supervizor,reset,napěťový-supervizor,voltage-supervisor,ti,tps3809,tps3809j25,sot-23,2.25v',
  },
  {
    name: 'TPS3809L30',
    packageType: 'shodné s TPS3809J25 (SOT-23-3) — viz jeho záznam pro plné mechanické specifikace',
    value:
      'Napěťový supervizor (reset obvod), fixní záporně čítaný práh VIT- = 2,64 V (typ.), ' +
      'push-pull výstup RESET (aktivní v L)',
    notes:
      'TI "TPS3809x" — součást rodiny TPS3809, viz záznam "TPS3809J25" v této knihovně pro ' +
      'plné společné elektrické/mechanické specifikace. Prahové napětí VIT- 2,58-2,7V (min-max), ' +
      'hystereze Vhys 35mV (typ.). Objednací kód TPS3809L30DBVR (funkce 9, práh L=2,64V).',
    tags: 'io,supervizor,reset,napěťový-supervizor,voltage-supervisor,ti,tps3809,tps3809l30,sot-23,2.64v',
  },
  {
    name: 'TPS3809K33',
    packageType: 'shodné s TPS3809J25 (SOT-23-3) — viz jeho záznam pro plné mechanické specifikace',
    value:
      'Napěťový supervizor (reset obvod), fixní záporně čítaný práh VIT- = 2,93 V (typ.), ' +
      'push-pull výstup RESET (aktivní v L)',
    notes:
      'TI "TPS3809x" — součást rodiny TPS3809, viz záznam "TPS3809J25" v této knihovně pro ' +
      'plné společné elektrické/mechanické specifikace. Prahové napětí VIT- 2,87-2,99V (min-max), ' +
      'hystereze Vhys 40mV (typ.). Objednací kód TPS3809K33DBVR (funkce 9, práh K=2,93V). Podle ' +
      'aplikačního schématu v datasheetu typicky použit se supervizí 3,3V sběrnice (např. TI ' +
      'TMS320LC54x DSP).',
    tags: 'io,supervizor,reset,napěťový-supervizor,voltage-supervisor,ti,tps3809,tps3809k33,sot-23,2.93v',
  },
  {
    name: 'TPS3809I50',
    packageType: 'shodné s TPS3809J25 (SOT-23-3) — viz jeho záznam pro plné mechanické specifikace',
    value:
      'Napěťový supervizor (reset obvod), fixní záporně čítaný práh VIT- = 4,55 V (typ.), ' +
      'push-pull výstup RESET (aktivní v L)',
    notes:
      'TI "TPS3809x" — součást rodiny TPS3809, viz záznam "TPS3809J25" v této knihovně pro ' +
      'plné společné elektrické/mechanické specifikace. Nejvyšší prahová varianta celé řady ' +
      '(určeno pro supervizi 5V sběrnice). Prahové napětí VIT- 4,45-4,65V (min-max), hystereze ' +
      'Vhys 60mV (typ.). Objednací kód TPS3809I50DBVR (funkce 9, práh I=4,55V).',
    tags: 'io,supervizor,reset,napěťový-supervizor,voltage-supervisor,ti,tps3809,tps3809i50,sot-23,4.55v',
  },
  {
    name: 'MSP430G2553',
    packageType:
      '20-PDIP/20-TSSOP (16 I/O), 28-TSSOP (24 I/O) nebo 32-QFN (24 I/O), napájení DVCC 1,8-3,6V, ' +
      'Spy-Bi-Wire (2vodičové JTAG) rozhraní pro programování/ladění',
    value:
      '16bitový RISC mikrokontrolér (MSP430 rodina), 16KB Flash / 512B RAM, 16MHz CPU (62,5ns ' +
      'instrukční cyklus), aktivní odběr typ. 230µA @1MHz/2,2V, standby 0,5µA, off (RAM ' +
      'retence) 0,1µA',
    notes:
      'Texas Instruments "MSP430G2x53, MSP430G2x13 — Mixed Signal Microcontroller" (dok. ' +
      'SLAS735J, duben 2011, revidováno květen 2013) — nejvýbavenější člen rodiny MSP430G2x53 ' +
      '(16KB Flash/512B RAM, součást širší tabulky "Available Options" zahrnující G2553/2453/ ' +
      '2353/2253/2153 s klesající pamětí 16-1KB a sesterskou rodinu G2x13 bez ADC10). 16bitová ' +
      'RISC architektura s 16 registry (4 vyhrazené: PC/SP/SR/CG, 12 obecných), 51 instrukcí, ' +
      '7 adresovacích módů, výkon 1 instrukce/cyklus u registr-registr operací. Periferie: ' +
      '2× Timer_A3 (3 capture/compare registry), 8kanálový 10bitový 200ksps ADC (interní ' +
      'reference, sample&hold, autoscan), 8kanálový analogový komparátor (Comp_A+, i pro ' +
      'kapacitní dotykové senzory — až 24 kapacitních I/O pinů), USCI (Universal Serial ' +
      'Communication Interface) s UART (auto baudrate/LIN), IrDA kodér/dekodér, synchronní SPI ' +
      'a I2C, watchdog timer/interval timer, brownout detektor. Hodinový systém: interní ' +
      'kalibrovaný DCO (digitally controlled oscillator) do 16MHz ve 4 kalibrovaných ' +
      'frekvencích, interní nízkopříkonový LF oscilátor, externí 32kHz krystal nebo externí ' +
      'digitální hodinový zdroj — probuzení z low-power módu do aktivního režimu za <1µs. ' +
      'Šest operačních režimů: aktivní (AM, všechny hodiny běží) a pět úsporných LPM0-LPM4 ' +
      '(postupně vypínají CPU, MCLK/SMCLK, DCO, ACLK a krystalový oscilátor). Palubní sériové ' +
      'programování bez nutnosti externího programovacího napětí, programovatelná ochrana kódu ' +
      '(security fuse), on-chip emulační logika (2 breakpointy) přes Spy-Bi-Wire. Vektor ' +
      'přerušení 0FFC0h-0FFFFh, 16bitová adresa handleru, priorita 0(nejnižší)-31(reset, ' +
      'nejvyšší). ADC10 dostupný pouze na G2x53 devices (chybí na sesterské G2x13 řadě). ' +
      'Typické aplikace: nízkonákladové senzorové systémy (např. základ populárního TI ' +
      'LaunchPad vývojového kitu MSP-EXP430G2).',
    tags: 'io,mikrokontrolér,mcu,msp430,msp430g2553,ti,risc,16bit,nízkopříkonový,launchpad,adc,usci',
  },
  {
    name: 'MSPM0L1306',
    packageType:
      '32-VQFN (RHB, 5×5mm), napájení VDD 1,62-3,6V, rozšířený teplotní rozsah -40 až +125°C, ' +
      '2vodičové SWD (Serial Wire Debug) rozhraní',
    value:
      '32bitový mikrokontrolér Arm Cortex-M0+ (MSPM0 rodina), 64KB Flash / 4KB SRAM, do 32MHz, ' +
      '12bitový 1,68Msps ADC (až 10 kanálů), režim RUN 71µA/MHz, STANDBY 1,0µA, SHUTDOWN 61nA',
    notes:
      'Texas Instruments "MSPM0L1346, MSPM0L1345, MSPM0L1344, MSPM0L1343, MSPM0L1306, ' +
      'MSPM0L1305, MSPM0L1304, MSPM0L1303 — MSPM0L130x Mixed-Signal Microcontrollers" (dok. ' +
      'SLASEX0D, říjen 2022, revidováno leden 2024) — nejvýbavenější člen podskupiny MSPM0L130x ' +
      '(64KB Flash/4KB SRAM, 10 ADC kanálů, 28 GPIO). ⚠️ NOVÁ MCU ARCHITEKTURA v této knihovně ' +
      'vedle MSP430G2553 (viz jeho záznam) — na rozdíl od proprietární 16bitové RISC ' +
      'architektury MSP430 jde o standardní 32bitové jádro Arm Cortex-M0+ s NVIC, novější a ' +
      'výkonnější řada MCU od TI. Analogové periferie: 12bitový 1,68Msps ADC (konfigurovatelná ' +
      'interní reference 1,4V/2,5V), dva zero-drift zero-crossover chopper operační zesilovače ' +
      '(OPA, drift 0,5µV/°C, vstupní klidový proud 6pA, programovatelné zesílení 1-32×), jeden ' +
      'obecný zesilovač (GPAMP), jeden vysokorychlostní komparátor (COMP, 32ns zpoždění, 8bitový ' +
      'referenční DAC, nízkopříkonový mód <1µA), integrovaný teplotní senzor. Digitální ' +
      'periferie: 3kanálový DMA řadič, 3kanálový systém událostí (event fabric) pro ' +
      'propojení periferií bez zásahu CPU, čtyři 16bitové obecné časovače (každý 2 capture/ ' +
      'compare registry, celkem 8 PWM kanálů, podpora nízkopříkonového provozu ve STANDBY), ' +
      'okénkový watchdog (WWDT), CRC-16/32 akcelerátor. Komunikace: 2× UART (podpora LIN, IrDA, ' +
      'DALI, Smart Card, Manchester, nízkopříkonový provoz ve STANDBY), 2× I2C (jeden FM+ do ' +
      '1Mbit/s, oba SMBus/PMBus, probuzení ze STOP), 1× SPI do 16Mbit/s. Hodinový systém: ' +
      'interní 4-32MHz oscilátor (SYSOSC, přesnost ±1,2%), interní 32kHz nízkopříkonový ' +
      'oscilátor (LFOSC, ±3%) — bez nutnosti externího krystalu. Nízkopříkonové režimy: RUN ' +
      '71µA/MHz (CoreMark), STOP 151µA @4MHz / 44µA @32kHz, STANDBY 1,0µA (16bitový časovač na ' +
      '32kHz běží, SRAM/registry zachovány, probuzení za 3,2µs), SHUTDOWN 61nA (s možností ' +
      'probuzení přes I/O). Až 28 GPIO, 2 piny s 5V tolerancí a open-drain výstupem s fail-safe ' +
      'ochranou. Součást širší rodiny MSPM0L13x3-x6 lišící se pamětí (8-64KB Flash, 2-4KB RAM) ' +
      'a počtem GPIO/ADC kanálů dle pouzdra (16-32 pinů). Vývojová podpora: LP-MSPM0L1306 ' +
      'LaunchPad kit, MSP Software Development Kit (SDK), Code Composer Studio IDE.',
    tags: 'io,mikrokontrolér,mcu,mspm0,mspm0l1306,ti,arm,cortex-m0+,32bit,nízkopříkonový,launchpad,adc,opa',
  },
  {
    name: 'MSP430F149',
    packageType:
      '64-pin LQFP (PM), TQFP (PAG) nebo VQFN (RTD), rozměry cca 10×10mm (LQFP/TQFP), napájení ' +
      'DVCC/AVCC 1,8-3,6V, 4vodičové JTAG (TMS/TCK/TDI-TCLK/TDO-TDI) pro programování/ladění, ' +
      'bez externího programovacího napětí, programovatelná ochrana kódu (security fuse)',
    value:
      '16bitový RISC mikrokontrolér (MSP430F14x rodina), 60KB+256B Flash / 2KB RAM, 16bit ADC12 ' +
      '(8 kanálů, interní reference, autoscan), 2× USART, hardwarová násobička, 48 I/O',
    notes:
      'Texas Instruments "MSP430F14x, MSP430F14x1, MSP430F13x Mixed-Signal Microcontrollers" ' +
      '(dok. SLAS272H, červenec 2000, revidováno květen 2018) — MSP430F149 je nejvýbavenější ' +
      'člen rodiny MSP430F14x. Starší/klasická generace MSP430 (rok 2000) vedle MSP430G2553 a ' +
      'MSPM0L1306 v této knihovně (viz jejich záznamy) — na rozdíl od G2553 (USCI, ADC10, bez ' +
      'hardwarové násobičky) nabízí F149 přesnější 12bitový ADC12 (namísto 10bitového ADC10), ' +
      'DVĚ nezávislé USART jednotky (namísto jedné USCI), integrovanou hardwarovou násobičku ' +
      '(MPY/MPYS/MAC/MACS registry pro rychlé násobení/MAC operace bez zatížení CPU) a dvakrát ' +
      'více paměti (60KB Flash/2KB RAM vs. 16KB/512B) — typický "vyšší" MSP430 pro náročnější ' +
      'aplikace metrologie/monitoringu, zatímco G2553/MSPM0L1306 cílí na levné/kompaktní ' +
      'aplikace. Periferie: Timer_A3 (3 capture/compare registry), Timer_B7 (7 capture/compare/ ' +
      'shadow registrů — bohatší než Timer_A), on-chip komparátor (Comparator_A), watchdog ' +
      'timer (15/16bit). 12bitový ADC12: 8 kanálů, vzorkovač/hold, autoscan funkce, vestavěná ' +
      'reference, konverze <10µs. USART0/USART1: funkce jako asynchronní UART nebo synchronní ' +
      'SPI rozhraní. Hodinový systém: interní DCO s probuzením z low-power módu do aktivního ' +
      'režimu za <6µs, externí XT2 krystalový oscilátor (navíc k standardnímu LFXT1/32kHz), ' +
      'ACLK/SMCLK/MCLK odvozené hodiny. Nízkopříkonové režimy: aktivní 280µA @1MHz/2,2V, ' +
      'standby 1,6µA, off (RAM retence) 0,1µA — pět softwarově volitelných úsporných režimů ' +
      '(LPM0-LPM4, shodná koncepce jako u MSP430G2553). 16bitová RISC architektura, 125ns ' +
      'instrukční cyklus, 16 registrů (4 vyhrazené + 12 obecných), stejná instrukční sada/ ' +
      'adresovací módy jako MSP430G2553. Rodina zahrnuje MSP430F149/F1491 (60KB/2KB), F148/ ' +
      'F1481 (48KB/2KB), F147/F1471 (32KB/1KB), F135 (16KB/512B), F133 (8KB/256B) — všechny se ' +
      '48 I/O, 8kanálovým ADC12 a shodným 64pinovým pouzdrem. Aplikace: senzorové systémy, ' +
      'průmyslové řízení, ruční měřicí přístroje.',
    tags: 'io,mikrokontrolér,mcu,msp430,msp430f149,ti,risc,16bit,nízkopříkonový,adc12,usart,hardwarová-násobička',
  },
  {
    name: 'MSP430F1121A',
    packageType:
      '20-pin SOWB (DW), 20-pin TSSOP (PW), 20-pin TVSOP (DGV) nebo 24-pin QFN (RGE), napájení ' +
      'VCC 1,8-3,6V, JTAG (test/emulace) přes piny TDO-TDI/TDI-TCLK/TMS/TCK sdílené s Port 1',
    value:
      '16bitový RISC mikrokontrolér (MSP430F11x1A rodina), 4KB Flash / 256B RAM, 14 I/O, ' +
      'Timer_A3, on-chip komparátor (bez vestavěného ADC), aktivní odběr typ. 160µA @1MHz/2,2V',
    notes:
      'Texas Instruments "MSP430C11x1, MSP430F11x1A — Mixed Signal Microcontroller" (dok. ' +
      'SLAS241I, září 1999, revidováno prosinec 2008) — MSP430F1121A je nejvýbavenější Flash ' +
      'člen rodiny MSP430F11x1A. Nejmenší/nejjednodušší MSP430 v této knihovně vedle G2553/ ' +
      'F149/MSPM0L1306 (viz jejich záznamy) — na rozdíl od nich NEMÁ vestavěný analogově- ' +
      'digitální převodník (ADC10/ADC12) — obsahuje pouze analogový komparátor (Comparator_A) ' +
      'umožňující tzv. "slope A/D" konverzi (jednosměrný/sklonový převod) přes externí RC ' +
      'obvod a rezistivní senzor přímo na I/O pinu, vhodné pro jednoduché RF senzorové ' +
      'front-endy a nízkonákladové aplikace, kde plnohodnotný ADC není potřeba. Výrazně méně ' +
      'I/O (14, oproti 24 u G2553 nebo 48 u F149) a menší pouzdro (20/24 pinů). Rodina zahrnuje ' +
      'i variantu s maskovanou ROM pamětí místo Flash (MSP430C1101/C1111/C1121 — levnější pro ' +
      'velkosériovou výrobu bez potřeby přeprogramování) a dvě menší Flash varianty F1101A ' +
      '(1KB Flash/128B RAM) a F1111A (2KB Flash/128B RAM), F1121A (4KB Flash/256B RAM) je ' +
      'největší. Periferie: jediný Timer_A3 (3 capture/compare registry), Comparator_A, ' +
      'watchdog timer (15/16bit). Hodinový systém: interní DCO (různé interní rezistory nebo ' +
      'jeden externí rezistor pro nastavení kmitočtu), 32kHz krystal, vysokofrekvenční ' +
      'krystal, rezonátor, nebo externí hodinový zdroj — probuzení ze standby do aktivního ' +
      'režimu za <6µs. Nízkopříkonové režimy: aktivní 160µA @1MHz/2,2V, standby 0,7µA, off ' +
      '(RAM retence) 0,1µA — pět softwarově volitelných úsporných režimů LPM0-LPM4 (shodná ' +
      'koncepce jako u ostatních MSP430 v této knihovně). 16bitová RISC architektura, 125ns ' +
      'instrukční cyklus, 16 registrů, 51 instrukcí, 7 adresovacích módů (shodné jako u ' +
      'MSP430G2553/F149). Palubní sériové programování bez externího programovacího napětí, ' +
      'programovatelná ochrana kódu (security fuse). Aplikace: jednoduché senzorové systémy, ' +
      'samostatné RF senzorové front-endy.',
    tags: 'io,mikrokontrolér,mcu,msp430,msp430f1121a,ti,risc,16bit,nízkopříkonový,komparátor,malé-pouzdro',
  },

  // RF vysílače/přijímače
  {
    name: 'CMOSTEK CMT2xxx Series (RF IC)',
    packageType:
      'SMD, dle konkrétního typu SOT23-6/QFN16/QFN40/QFN48/TSSOP28/SOP8/SOP14, rozměry ' +
      '3×3mm až 9,7×6,4mm',
    value:
      'RF vysílač/přijímač/transceiver IC (OOK/(G)FSK/MSK modulace), frekvenční rozsah ' +
      '27–1020 MHz dle typu, výstupní výkon do 20 dBm, citlivost do -126 dBm',
    notes:
      'CMOSTEK (distribuováno přes HOPERF) "Selection Guide of CMT Series — NextGenRF™" (dle ' +
      'katalogu HOPERF Catalog 2020, HOPERFCatalog2020.pdf, str. 2). ⚠️ SOUHRNNÝ KATALOGOVÝ ' +
      'ZÁZNAM — 70stránkový katalog obsahuje jen výběrovou tabulku (frekvence/modulace/ ' +
      'citlivost/výkon/pouzdro) bez podrobných elektrických parametrů, zde evidováno jako ' +
      'reprezentativní shrnutí celé řady holých RF IC čipů (bez PCB antény/štítu, na rozdíl od ' +
      'RF/LoRa modulů HOPERF v této knihovně — viz kategorie Modul). Zahrnuje TX (vysílač), RX ' +
      '(přijímač) a TRX/SoC (transceiver s integrovaným 8051 nebo Cortex-M0+ jádrem) varianty: ' +
      'např. CMT2300A (TRX, QFN16, 3×1 wire SPI), CMT2380F16/F32 (TRX+SoC s 8051/Cortex-M0+), ' +
      'CMT2119A/B (TX, SOT23-6/QFN16), CMT2110A (TX, 1-wire), CMT2189C (TX+SoC, PIC-like MCU), ' +
      'CMT2150L/2157B/2156A/2159A (TX s enkodérem a klávesnicí/energy harvesting), CMT2219A/B ' +
      '(RX, QFN16), CMT2218B (RX, direct mode), CMT2210LB/LH/217LB/217B (standalone RX s Dout ' +
      'výstupem), CMT2280F2/2281F2 (RX+SoC s PIC-like MCU), CMT2163A/2168A (TX+SoC s 8051, LF ' +
      'wakeup). Deklarované výhody výrobce: plně softwarově konfigurovatelné parametry (bez ' +
      'nutnosti přeprogramování), 100% shoda s CE/FCC, pin-kompatibilní náhrady napříč řadou, ' +
      'vestavěné EEPROM (volitelně).',
    tags: 'io,rf,vysílač,přijímač,transceiver,cmostek,cmt,hoperf,sub-ghz,ook,fsk',
  },
  {
    name: 'HOPERF HPxxx / HP5xxx Series (tlakový senzor)',
    packageType:
      'SMD DFN6/DFN8/LGA8/SOP6-DIP6 dle typu, u vodotěsné varianty WP10 kovové pouzdro se ' +
      'závitem G1/4"',
    value:
      'Kapacitní/piezorezistivní senzor tlaku, rozsah 300 Pa až 2000 kPa dle typu, digitální ' +
      'I2C (nebo I2C/SPI) rozhraní, VDD 1,7–5,5 V',
    notes:
      'HOPERF "Pressure Sensor" produktová řada — dle katalogu "HOPERF Catalog 2020" ' +
      '(HOPERFCatalog2020.pdf, str. 5). ⚠️ SOUHRNNÝ KATALOGOVÝ ZÁZNAM (viz poznámka u "CMOSTEK ' +
      'CMT2xxx Series" pro kontext katalogu) — série pokrývá desítky tlakových senzorů pro ' +
      'různé aplikace: barometrické/výškoměrné senzory nízkého rozsahu HP100 (150/700/2000kPa, ' +
      'analogový MV výstup, SOP6/DIP6), přesné diferenciální senzory HP303S/F/B (300-1200hPa, ' +
      'přesnost 0,2-0,5hPa, LGA8, I2C/SPI, vhodné pro výškoměry/dronové autopiloty), voděodolné ' +
      'typy HP206C/F/203B/N/W (s membránou pro přímý kontakt s kapalinou, DFN6/8), vysoký ' +
      'rozsah HP209-002G (2000-200000kPa/1%FSO), a nová generace HP5804/5834/5806 (30kPa- ' +
      '2000kPa, přesnost až 0,01kPa, DFN6, nižší spotřeba: sleep proud <0,1-0,5µA). ' +
      'Průmyslová vodotěsná verze WP10 (0-2000kPa) v kovovém pouzdře se závitem G1/4" pro ' +
      'přímou instalaci do potrubí/nádrže. Typické aplikace: měření nadmořské výšky/relativní ' +
      'výšky, předpověď počasí, detekce pádu/potápění, lokalizace GPS+tlak, měření tlaku ' +
      'uhelného/výfukového plynu.',
    tags: 'io,senzor,tlakový,tlakoměr,barometr,hoperf,i2c,spi,vodotěsný',
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
    schematicImage: spec.schematicImage ?? null,
    notes: spec.notes,
    tags: spec.tags,
  }));
}

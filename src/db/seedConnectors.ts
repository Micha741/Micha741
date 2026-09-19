import type { ComponentInput } from '../types/component';

interface ConnectorSpec {
  name: string;
  packageType: string;
  value: string;
  notes: string;
  tags: string;
}

const CONNECTOR_SPECS: ConnectorSpec[] = [
  {
    name: 'ESP-100-POE',
    packageType:
      'Průchozí (in-line) modul mezi dvěma stíněnými RJ45 zásuvkami, litá kovová (hliníková) ' +
      'krabička 83 × 25,4 × 25,4 mm (s konektory 94 × 25,4 × 25,4 mm), hmotnost 80 g, montážní ' +
      'nožičky pro uzemnění na kovové šasi + samostatný uzemňovací vodič 14 AWG, 275 mm',
    value:
      'Ethernet/PoE přepěťová ochrana (bleskojistka), 7,5 V clamping na datových párech, 70 V ' +
      'clamping na PoE párech, 100 Mbps, 802.3at (PoE+)',
    notes:
      'Laird ESP-100-POE "Network Lightning/Surge Protector" — NENÍ aktivní elektronická ' +
      'součástka ani modul s čipem, jde o pasivní ochranný prvek (přepěťová/bleskojistková ' +
      'ochrana) vkládaný do síťového kabelu mezi zdroj a chráněné zařízení (router, IP kamera, ' +
      'AP, PoE switch apod.) — proto je zařazen do kategorie Konektor (in-line RJ45-RJ45 prvek), ' +
      'ne jako aktivní modul či polovodičová součástka. Chrání všech 8 pinů RJ45: datové páry ' +
      '1, 2, 3, 6 mají clamping napětí 7,5 V, PoE napájecí páry 4, 5, 7, 8 mají clamping napětí ' +
      '70 V (kompatibilní s 48 V PoE systémy dle 802.3at). Max. svodový impulzní proud 5 kA ' +
      '(vlna 8/20 µs), špičkový pulzní proud 100 A (vlna 10/1000 µs), doba odezvy < 5 ns. Režim ' +
      'ochrany diferenciální i souhlasný (L-L, L-G). Izolační impedance > 1000 MΩ, max. paralelní ' +
      'kapacita < 25 pF (nezhoršuje signálovou integritu při 100 Mbps datovém toku, CAT5e/CAT6 ' +
      'kompatibilní). Stíněné RJ45 konektory a celokovové pouzdro pro potlačení EMI. Určeno pro ' +
      'montáž co nejblíže chráněnému zařízení, pro vnitřní i venkovní použití (venku jen ve ' +
      'vodotěsném krytu). Provozní teplota -40 až +85 °C, skladovací -40 až +85 °C, vlhkost ' +
      '0–95 % nekondenzující. Shoda s IEC 61643-21.',
    tags: 'konektor,rj45,ethernet,poe,přepěťová-ochrana,bleskojistka,surge-protector',
  },
  {
    name: 'HB12201',
    packageType:
      'THT kolíková lišta (pin header), 1 řada, přímé (straight) vývody, rozteč 2,54 mm (0,1"), ' +
      'čtvercové kolíky 0,64 mm (0,025"), 20 pozic/pinů, izolátor termoplastický nylon UL94V-0 ' +
      '(černý), kontakty fosforový bronz s tvrdým zlacením 15 µ" (gold flash)',
    value:
      'Nešroubovaná (break-away) jednořadá kolíková lišta, 20 pinů, rozteč 2,54 mm, pozlacené ' +
      'kontakty, 250 V AC, do +105 °C',
    notes:
      'Foxconn "HB/HC Series — Non-Shrouded Headers, Break Away Header, .025" (0,64 mm) Square ' +
      'Posts" katalogový datasheet — rozsáhlá modulární řada kolíkových lišt/hlavic dekódovaná ' +
      'dle vlastního číslování výrobce: HB12201 = HB (jednořadá provedení, řada HC by byla ' +
      'dvouřadá) + 12 (styl ukončení "Single Row Straight", mating length C=0,230"/tail length ' +
      'D=0,125") + 20 (počet kontaktních pozic, 1–40 dle objednávky) + 1 (povrchová úprava ' +
      'kontaktů: gold flash — tenká zlatá vrstva; ostatní dostupné úpravy dle katalogu: 0=cín/' +
      'olovo, 7=15µ" tvrdé zlato, 3=30µ" tvrdé zlato). "Break away" znamená, že lištu lze podle ' +
      'potřeby zlomit/zkrátit na menší počet pozic. Elektrické parametry (společné pro celou ' +
      'řadu): izolační odpor min 5000 MΩ, dielektrická pevnost min 1000 V AC (na hladině moře), ' +
      'jmenovité napětí 250 V AC, provozní teplota -55 až +105 °C, retenční síla kontaktu min ' +
      '2 lb. Součást širší modulární řady zahrnující i variantu s pravoúhlými (right angle) ' +
      'vývody (HB02/04/14/15) a dvouřadé varianty HC (přímé HC11/12/08/13, pravoúhlé HC02/04/14/' +
      '15) se stejným systémem kódování stylu/pozic/povrchové úpravy — do knihovny přidán jen ' +
      'konkrétní pojmenovaný díl HB12201 z názvu souboru.',
    tags: 'konektor,pin-header,kolíková-lišta,break-away,foxconn,hb-series,tht,2,54mm',
  },
  {
    name: '09 14 001 0722',
    packageType:
      'Modulární pouzdro (hood/housing) pro průmyslové konektory Han-Modular ECO, kabel-kabel ' +
      'provedení, horní vstup kabelu (top entry), zaklapávací (snap-in) zámky, materiál ' +
      'polykarbonát (PC), barva RAL 7032 (kamenná šedá), průměr kabelu 3–14,5 mm, hmotnost 33,44 g',
    value:
      'Prázdné pouzdro/hood pro modulární průmyslový konektor Han-Modular ECO, krytí IP20, BEZ ' +
      'PE (ochranného zemnicího) kontaktu, ≥500 spojovacích cyklů, -40 až +85 °C',
    notes:
      'HARTING Electric GmbH & Co. KG "Han-Modular ECO coupler IP20, without PE" (obj. č. ' +
      '09 14 001 0722, katalogový list, 26.3.2020) — ⚠️ POZOR: jde o SAMOTNÉ PRÁZDNÉ POUZDRO ' +
      '(hood/housing) modulárního průmyslového konektorového systému Han-Modular ECO, NE o ' +
      'kompletní osazený konektor s kontakty/moduly — pouzdro se teprve osazuje jednotlivými ' +
      'modulárními vložkami (signálové/napájecí/datové moduly dle potřeby aplikace, prodávané ' +
      'samostatně) podle modulárního konceptu Han-Modular. Verze "coupler" = kabel-kabel spojka ' +
      '(cable to cable housing, spojuje dva kabely přes konektor, ne kabel-panel). "Bez PE" ' +
      'znamená, že toto konkrétní provedení NEMÁ vyhrazenou pozici pro ochranný zemnicí kontakt ' +
      '(na rozdíl od PE variant stejné řady, zde nekatalogizovaných) — vhodné jen pro aplikace ' +
      'nevyžadující funkční zemnění přes konektor. Zaklapávací (snap-in) zámky pro rychlé ' +
      'spojení/rozpojení bez nářadí. Horní vstup kabelu (top entry) s průchodkou pro kabel ' +
      'průměru 3–14,5 mm. Nižší krytí IP20 (jen ochrana proti prstům/malým předmětům, nevhodné ' +
      'pro venkovní/prašné/vlhké prostředí) — odlišuje se od plně krytých IP65/IP67+ variant ' +
      'Han-Modular určených pro průmyslové venkovní použití. Materiál polykarbonát (samozhášivý, ' +
      'UL94 V-0), barva RAL 7032 kamenná šedá. Provozní teplota -40 až +85 °C, min. 500 spojovacích ' +
      'cyklů. Zařazeno do kategorie "Konektor". Shoda EN 60664-1, IEC 61984, CE. RoHS/ELV ' +
      'compliant, bez REACH SVHC látek.',
    tags: 'konektor,průmyslový,han-modular,eco,pouzdro,hood,harting,ip20,kabel-kabel',
  },
  {
    name: '09 14 001 0321',
    packageType:
      'Modulární pouzdro (hood/housing) pro průmyslové konektory Han-Modular ECO, provedení pro ' +
      'montáž na panel/přepážku (bulkhead mounted housing), zaklapávací (snap-in) zámky, ' +
      'materiál polykarbonát (PC), barva RAL 7032 (kamenná šedá), těsnění NBR, hmotnost 14,26 g',
    value:
      'Panelové (přepážkové) pouzdro/hood pro modulární průmyslový konektor Han-Modular ECO, ' +
      'krytí IP65, S PE (ochranným zemnicím) označením — pin 1 = PE, ≥500 spojovacích cyklů, ' +
      '-40 až +85 °C',
    notes:
      'HARTING Electric GmbH & Co. KG "Han-Modular ECO base panel (with PE mark)" (obj. č. ' +
      '09 14 001 0321, katalogový list, 26.3.2020) — ⚠️ jiné provedení pouzdra ze stejné ' +
      'modulární řady Han-Modular ECO jako 09 14 001 0722 v této knihovně, se dvěma zásadními ' +
      'rozdíly: (1) typ montáže "bulkhead mounted housing" (PANELOVÉ/PŘEPÁŽKOVÉ provedení pro ' +
      'pevnou montáž do stěny rozvaděče/stroje), na rozdíl od "coupler" (kabel-kabel spojka) u ' +
      '09 14 001 0722; (2) toto provedení MÁ vyhrazenou a označenou pozici pro PE (ochranný ' +
      'zemnicí) kontakt (pin 1 = PE, viditelně značeno na pouzdru), zatímco 09 14 001 0722 je ' +
      'výslovně "without PE" — nutno vybrat správnou variantu dle požadavku na funkční zemnění v ' +
      'dané aplikaci. Rovněž VYŠŠÍ krytí IP65 (oproti IP20 u kabelové spojky) díky těsnění NBR — ' +
      'vhodné pro průmyslové prostředí s vlhkostí/prachem. Stejně jako u 09 14 001 0722 jde o ' +
      'PRÁZDNÉ POUZDRO čekající na osazení modulárními vložkami dle konkrétní aplikace (signálové/ ' +
      'napájecí/datové moduly, prodávané samostatně). Zaklapávací (snap-in) zámky. Materiál ' +
      'polykarbonát (samozhášivý, UL94 V-0), barva RAL 7032 kamenná šedá. Provozní teplota -40 až ' +
      '+85 °C, min. 500 spojovacích cyklů. Zařazeno do kategorie "Konektor". Shoda EN 60664-1, ' +
      'IEC 61984, CE. RoHS/ELV compliant, bez REACH SVHC látek.',
    tags: 'konektor,průmyslový,han-modular,eco,pouzdro,hood,harting,ip65,panelové,pe',
  },
  {
    name: 'BM28B0.6-*DS/2-0.35V(**) / BM28B0.6-*DP/2-0.35V(**)',
    packageType:
      'SMD board-to-board / board-to-FPC konektorový pár (receptacle DS + header DP), rozteč ' +
      'kontaktů 0,35 mm, výška po spojení 0,6 mm, izolátor LCP (černý, UL94V-0), kontakty ' +
      'měděná slitina se zlacením, počet signálních kontaktů 6/10/16/20/24/30/34/40/44/50/60 + ' +
      '2 vyhrazené výkonové kontakty (odlišné, větší rozměry kontaktu), bez polarizace',
    value:
      'Miniaturní konektorový pár pro tenká/malá zařízení (mobilní telefony, wearables, tablety), ' +
      '2 výkonové kontakty do 5 A + signální kontakty 0,2–0,3 A (dle počtu), 30 V AC/DC, podpora ' +
      'USB3.1 Gen.2 (10 Gbps)',
    notes:
      'Hirose Electric "BM28 Series — 0.35mm pitch, 0.6mm height, Board to Board or Board to FPC ' +
      'Connectors with Rated Current Up to 5A" (katalogový list, 1.5.2018) — ⚠️ POZOR NA ZÁMĚNU ' +
      'NÁZVU: prefix "BM28" zde NENÍ nijak spojen s IC zesilovači ROHM BM28720MUV/BM28723MUV ' +
      '(kategorie IO) v této knihovně — jde o zcela odlišný produkt (konektor) jiného výrobce ' +
      '(Hirose), shoda číselného kódu je čistě náhodná. Klíčová vlastnost řady: koncentrace ' +
      'NAPÁJECÍCH linek do POUZE 2 VÝHRAZENÝCH VÝKONOVÝCH KONTAKTŮ (s vlastním 2bodovým ' +
      'kontaktním designem pro vysokou spolehlivost) místo rozprostření napájení přes více ' +
      'běžných signálních kontaktů jako u konvenčních konektorů stejné rozteče — umožňuje ' +
      'zmenšit celkový počet pozic konektoru při zachování napájecí kapacity (např. BM28 10pos. ' +
      '+2pos. pro napájení nahrazuje konvenční 20pos. konektor). Vodicí žebra (guide ribs) ' +
      'zajišťují samovystředění ±0,3 mm a hmatatelné cvaknutí při správném spojení, zabraňující ' +
      'částečnému zapojení. ⚠️ Datasheet dokumentuje CELOU MODULÁRNÍ ŘADU (11 variant počtu ' +
      'signálních kontaktů × receptacle/header pár, plus 2 varianty balení zlacení 51/53) — do ' +
      'knihovny přidána jako jeden souhrnný záznam pro celou řadu (kompletní tabulka rozměrů/ ' +
      'objednacích kódů HRS No. v datasheetu), ne každá kombinace zvlášť. Jmenovitý proud: ' +
      'výkonový kontakt 5 A, signální kontakt max. 40 kontaktů 0,3 A / min. 44 kontaktů 0,2 A ' +
      '(u konektorů s ≥50 signálními kontakty platí souhrnná kapacita 10 A pro všechny signální ' +
      'kontakty dohromady). Jmenovité napětí 30 V AC/DC. Odpor kontaktu: signální max 100 mΩ, ' +
      'výkonový max 30 mΩ. Izolační odpor min 1000 MΩ, elektrická pevnost 150 V AC/1min bez ' +
      'průrazu. Odolnost: 10 spojovacích cyklů, vibrace 10–55 Hz (0,75mm), rázy 450 m/s²/11ms, ' +
      'vlhkost 96h @40°C/90-95%RH, teplotní cyklování -55 až +85°C (5 cyklů), pájecí teplo (reflow ' +
      'max 250°C nebo ruční pájení 350°C/3s). Provozní teplota -40 až +85 °C, skladovací -10 až ' +
      '+60 °C. Halogen-free (dle IEC 61249-2-21). Aplikace: propojení baterie/NFC/USB/LCD/kamery/ ' +
      'sluchátkového konektoru k hlavní desce v tenkých/kompaktních zařízeních. Zařazeno do ' +
      'kategorie "Konektor".',
    tags: 'konektor,board-to-board,board-to-fpc,smd,hirose,bm28,0,35mm,výkonový-kontakt,usb3-1',
  },
];

export function buildConnectorSeed(): ComponentInput[] {
  return CONNECTOR_SPECS.map((spec) => ({
    name: spec.name,
    category: 'Konektor',
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

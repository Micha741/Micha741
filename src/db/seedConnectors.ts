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

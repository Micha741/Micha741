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

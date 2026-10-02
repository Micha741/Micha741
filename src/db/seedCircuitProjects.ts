import type { CircuitProjectInput } from '../types/circuit';

export const CIRCUIT_LIBRARY_VERSION = 1;

/**
 * Přesný počet kusů u drobných pasivních součástek (rezistory) je odhad podle
 * schématu zdroje, ne ověřená kusovka — před nákupem si ověř podle vlastního
 * zapojení.
 */
export const SEED_CIRCUIT_PROJECTS: CircuitProjectInput[] = [
  {
    name: 'Arduino relé modul s Bluetooth a IR ovládáním',
    description:
      'Arduino Nano ovládá 4 relé přes optočleny PC817, spínané buď přes Bluetooth modul HC-05, nebo IR dálkovým ovladačem (přijímač 1738/TSOP1738). Přepínání mezi BT a IR režimem přes tlačítko.',
    image: null,
    notes:
      'Zdroj: TechStudyCell / easyelectronicsproject.com — přidáno podle referenčního schématu, bez naskenovaného obrázku (ten appka zatím neobsahuje, lze doplnit nahráním souboru).',
    parts: [
      { label: 'Arduino Nano', match: 'Arduino Nano', quantity: 1 },
      { label: 'HC-05 Bluetooth modul', match: 'HC-05', quantity: 1 },
      { label: 'IR přijímač 1738 (TSOP1738)', match: '1738', quantity: 1 },
      { label: 'Optočlen PC817', match: 'PC817', quantity: 4 },
      { label: 'Tranzistor BC547', match: 'BC547', quantity: 1 },
      { label: 'Dioda 1N4007', match: '1N4007', quantity: 4 },
      { label: 'Relé modul SPDT', match: 'relé', quantity: 4 },
      { label: 'Rezistor 220 Ω', match: '220', quantity: 6 },
      { label: 'Rezistor 2 kΩ', match: '2k', quantity: 1 },
      { label: 'Rezistor 4,7 kΩ', match: '4.7k', quantity: 1 },
      { label: 'Rezistor 10 kΩ', match: '10k', quantity: 2 },
      { label: 'LED 5mm', match: 'LED', quantity: 3 },
      { label: 'Elektrolytický kondenzátor 100 µF', match: '100µF', quantity: 1 },
      { label: 'Tlačítko (push button)', match: 'tlačítko', quantity: 1 },
      { label: 'Napájecí konektor DC 5V', match: 'DC konektor', quantity: 1 },
      { label: 'Napájecí konektor DC 5/12V', match: 'DC konektor', quantity: 1 },
    ],
  },
];

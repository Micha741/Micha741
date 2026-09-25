import type { ImageSourcePropType } from 'react-native';

// Mapa klíč (ElectronicComponent.schematicImage) → obrázek schématu zapojení/pinoutu,
// extrahovaný z datasheetu součástky (assets/schematics/<klíč>).
// Metro vyžaduje statické require() volání, proto nejde mapu generovat dynamicky —
// při přidání nového obrázku je potřeba sem přidat řádek ručně.
export const SCHEMATIC_IMAGES: Record<string, ImageSourcePropType> = {
  'BC546.jpg': require('../../assets/schematics/BC546.jpg'),
  'P2N2222A.jpg': require('../../assets/schematics/P2N2222A.jpg'),
};

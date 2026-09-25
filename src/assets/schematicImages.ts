import type { ImageSourcePropType } from 'react-native';

// Mapa klíč (ElectronicComponent.schematicImage) → obrázek schématu zapojení/pinoutu,
// extrahovaný z datasheetu součástky (assets/schematics/<klíč>).
// Metro vyžaduje statické require() volání, proto nejde mapu generovat dynamicky —
// při přidání nového obrázku je potřeba sem přidat řádek ručně.
export const SCHEMATIC_IMAGES: Record<string, ImageSourcePropType> = {
  'BC546.jpg': require('../../assets/schematics/BC546.jpg'),
  'P2N2222A.jpg': require('../../assets/schematics/P2N2222A.jpg'),
  '2N3904.jpg': require('../../assets/schematics/2N3904.jpg'),
  '2N3906.jpg': require('../../assets/schematics/2N3906.jpg'),
  'G2N7000.jpg': require('../../assets/schematics/G2N7000.jpg'),
  'G2N7002.jpg': require('../../assets/schematics/G2N7002.jpg'),
  'IRF4905.jpg': require('../../assets/schematics/IRF4905.jpg'),
  'IRF9540N.jpg': require('../../assets/schematics/IRF9540N.jpg'),
  'TIP120.jpg': require('../../assets/schematics/TIP120.jpg'),
  'TIP41C.jpg': require('../../assets/schematics/TIP41C.jpg'),
  'TIP33C.jpg': require('../../assets/schematics/TIP33C.jpg'),
  'TIP29C.jpg': require('../../assets/schematics/TIP29C.jpg'),
  'BD243C.jpg': require('../../assets/schematics/BD243C.jpg'),
  'TIP3055.jpg': require('../../assets/schematics/TIP3055.jpg'),
  'D44E3.jpg': require('../../assets/schematics/D44E3.jpg'),
  '2N6299SMD.jpg': require('../../assets/schematics/2N6299SMD.jpg'),
  'BC517.jpg': require('../../assets/schematics/BC517.jpg'),
  'KTC3542T.jpg': require('../../assets/schematics/KTC3542T.jpg'),
  'LM317.jpg': require('../../assets/schematics/LM317.jpg'),
  'NSR01L30MXT5G.jpg': require('../../assets/schematics/NSR01L30MXT5G.jpg'),
  'NCP330MUTBG.jpg': require('../../assets/schematics/NCP330MUTBG.jpg'),
  'BC817-16LT1G.jpg': require('../../assets/schematics/BC817-16LT1G.jpg'),
  'CD4148W.jpg': require('../../assets/schematics/CD4148W.jpg'),
  'BAV99.jpg': require('../../assets/schematics/BAV99.jpg'),
};

import type { ImageSourcePropType } from 'react-native';

// Mapa klíč (CircuitProject.image) → obrázek schématu zapojení celého projektu
// (assets/circuits/<klíč>). Metro vyžaduje statické require() volání, proto
// nejde mapu generovat dynamicky — při přidání nového obrázku je potřeba sem
// přidat řádek ručně.
export const CIRCUIT_IMAGES: Record<string, ImageSourcePropType> = {
  'vanocni-stromecek-4060.jpg': require('../../assets/circuits/vanocni-stromecek-4060.jpg'),
  'ultrazvukova-pistalka.jpg': require('../../assets/circuits/ultrazvukova-pistalka.jpg'),
  'univerzalni-reproskrin.jpg': require('../../assets/circuits/univerzalni-reproskrin.jpg'),
  'kv-aktivni-antena-preselekce.jpg': require('../../assets/circuits/kv-aktivni-antena-preselekce.jpg'),
  'dvojcinny-spinac.jpg': require('../../assets/circuits/dvojcinny-spinac.jpg'),
  'maly-aktuator-rc-serva.jpg': require('../../assets/circuits/maly-aktuator-rc-serva.jpg'),
  'pwm-regulator.jpg': require('../../assets/circuits/pwm-regulator.jpg'),
  'shield-pololu-arduino-uno.jpg': require('../../assets/circuits/shield-pololu-arduino-uno.jpg'),
  'vozitko-mecanum-omni-kola.jpg': require('../../assets/circuits/vozitko-mecanum-omni-kola.jpg'),
};

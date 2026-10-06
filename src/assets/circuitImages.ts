import type { ImageSourcePropType } from 'react-native';

// Mapa klíč (CircuitProject.image) → obrázek schématu zapojení celého projektu
// (assets/circuits/<klíč>). Metro vyžaduje statické require() volání, proto
// nejde mapu generovat dynamicky — při přidání nového obrázku je potřeba sem
// přidat řádek ručně.
export const CIRCUIT_IMAGES: Record<string, ImageSourcePropType> = {
  'DS18B20-arduino-wiring.jpg': require('../../assets/circuits/DS18B20-arduino-wiring.jpg'),
};

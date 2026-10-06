import type { ImageSourcePropType } from 'react-native';

// Mapa klíč (CircuitProject.image) → obrázek schématu zapojení celého projektu
// (assets/circuits/<klíč>). Metro vyžaduje statické require() volání, proto
// nejde mapu generovat dynamicky — při přidání nového obrázku je potřeba sem
// přidat řádek ručně.
export const CIRCUIT_IMAGES: Record<string, ImageSourcePropType> = {
  'DS18B20-arduino-wiring.jpg': require('../../assets/circuits/DS18B20-arduino-wiring.jpg'),
  'vanocni-stromecek-4060.jpg': require('../../assets/circuits/vanocni-stromecek-4060.jpg'),
  'ultrazvukova-pistalka.jpg': require('../../assets/circuits/ultrazvukova-pistalka.jpg'),
  'univerzalni-reproskrin.jpg': require('../../assets/circuits/univerzalni-reproskrin.jpg'),
  'kv-aktivni-antena-preselekce.jpg': require('../../assets/circuits/kv-aktivni-antena-preselekce.jpg'),
  'dvojcinny-spinac.jpg': require('../../assets/circuits/dvojcinny-spinac.jpg'),
  'maly-aktuator-rc-serva.jpg': require('../../assets/circuits/maly-aktuator-rc-serva.jpg'),
  'pwm-regulator.jpg': require('../../assets/circuits/pwm-regulator.jpg'),
  'shield-pololu-arduino-uno.jpg': require('../../assets/circuits/shield-pololu-arduino-uno.jpg'),
  'vozitko-mecanum-omni-kola.jpg': require('../../assets/circuits/vozitko-mecanum-omni-kola.jpg'),
  'vystrazna-svetla-prejezdu.jpg': require('../../assets/circuits/vystrazna-svetla-prejezdu.jpg'),
  'stereo-zesilovac-20db.jpg': require('../../assets/circuits/stereo-zesilovac-20db.jpg'),
  'stereo-indikator-prebuzeni.jpg': require('../../assets/circuits/stereo-indikator-prebuzeni.jpg'),
  'detektor-prechodu-nulou.jpg': require('../../assets/circuits/detektor-prechodu-nulou.jpg'),
  'omezovac-proudu.jpg': require('../../assets/circuits/omezovac-proudu.jpg'),
  'ovladani-dvirek-kurniku.jpg': require('../../assets/circuits/ovladani-dvirek-kurniku.jpg'),
  'ovladani-dvirek-kurniku-esp32.jpg': require('../../assets/circuits/ovladani-dvirek-kurniku-esp32.jpg'),
  'modbus-rtu-deska.jpg': require('../../assets/circuits/modbus-rtu-deska.jpg'),
  'solarni-lampicka-superkondenzator.jpg': require('../../assets/circuits/solarni-lampicka-superkondenzator.jpg'),
  'solarni-lampicka-akumulator-smd.jpg': require('../../assets/circuits/solarni-lampicka-akumulator-smd.jpg'),
  'solarni-lampicka-akumulator-tht.jpg': require('../../assets/circuits/solarni-lampicka-akumulator-tht.jpg'),
  'spinany-zdroj-12-5v.jpg': require('../../assets/circuits/spinany-zdroj-12-5v.jpg'),
  'bodovaci-svarecka.jpg': require('../../assets/circuits/bodovaci-svarecka.jpg'),
};

import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { scanResistorBandsFromJpegBase64, type DetectedBand } from '../utils/imageColorScan';
import {
  decodeBands,
  RESISTOR_BAND_COLORS,
  type DecodedResistor,
  type ResistorBandColor,
} from '../utils/resistorColorCode';

type Props = NativeStackScreenProps<RootStackParamList, 'ResistorScanner'>;

// Guide rectangle, expressed as fractions of the captured photo so it maps
// onto both the live preview and the final image regardless of resolution.
const GUIDE = { xFrac: 0.08, yFrac: 0.42, widthFrac: 0.84, heightFrac: 0.16 };
const STRIP_OUTPUT_WIDTH = 320;

type ScanState =
  | { phase: 'camera' }
  | { phase: 'processing' }
  | {
      phase: 'result';
      stripUri: string;
      bands: DetectedBand[];
      decoded: DecodedResistor | null;
    }
  | { phase: 'error'; message: string };

export default function ResistorScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [state, setState] = useState<ScanState>({ phase: 'camera' });

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    setState({ phase: 'processing' });
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (!photo) throw new Error('Fotografii se nepodařilo pořídit.');

      const cropRect = {
        originX: Math.round(GUIDE.xFrac * photo.width),
        originY: Math.round(GUIDE.yFrac * photo.height),
        width: Math.round(GUIDE.widthFrac * photo.width),
        height: Math.round(GUIDE.heightFrac * photo.height),
      };

      const context = ImageManipulator.manipulate(photo.uri);
      context.crop(cropRect);
      context.resize({ width: STRIP_OUTPUT_WIDTH });
      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({ base64: true, compress: 1, format: SaveFormat.JPEG });

      if (!saved.base64) throw new Error('Nepodařilo se získat obrazová data.');

      const { bands } = scanResistorBandsFromJpegBase64(saved.base64);
      const decoded = bands.length >= 3 ? decodeBands(bands.map((b) => b.color)) : null;

      setState({ phase: 'result', stripUri: saved.uri, bands, decoded });
    } catch (err) {
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Rozpoznávání se nezdařilo.',
      });
    }
  };

  const handleRetake = () => setState({ phase: 'camera' });

  const handleCorrectBand = (index: number, colorId: string) => {
    if (state.phase !== 'result') return;
    const color = RESISTOR_BAND_COLORS.find((c) => c.id === colorId);
    if (!color) return;
    const nextBands = state.bands.map((b, i) => (i === index ? { ...b, color } : b));
    const decoded = decodeBands(nextBands.map((b) => b.color));
    setState({ ...state, bands: nextBands, decoded });
  };

  const handleUseValue = () => {
    if (state.phase !== 'result' || !state.decoded) return;
    const d = state.decoded;
    navigation.navigate('ComponentForm', {
      prefill: {
        category: 'Rezistor',
        value: d.formattedValue,
        tags: 'rezistor,sken',
        notes: `Hodnota určena optickým skenem barevného kódu (${d.bandCount} pruhy)${
          d.tolerancePercent !== null ? `, tolerance ±${d.tolerancePercent} %` : ''
        }${d.tempCoPpm !== null ? `, teplotní součinitel ${d.tempCoPpm} ppm/K` : ''}.`,
      },
    });
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          Pro sken barevného kódu rezistoru je potřeba přístup ke kameře.
        </Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Povolit kameru</Text>
        </Pressable>
      </View>
    );
  }

  if (state.phase === 'camera' || state.phase === 'processing') {
    return (
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <View pointerEvents="none" style={styles.overlay}>
          <View
            style={[
              styles.guideBox,
              {
                left: `${GUIDE.xFrac * 100}%`,
                top: `${GUIDE.yFrac * 100}%`,
                width: `${GUIDE.widthFrac * 100}%`,
                height: `${GUIDE.heightFrac * 100}%`,
              },
            ]}
          />
          <Text style={styles.guideHint}>
            Umísti tělo rezistoru vodorovně do rámečku, ať vyplní jeho šířku
          </Text>
        </View>
        {state.phase === 'processing' ? (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingText}>Rozpoznávám barevné pruhy…</Text>
          </View>
        ) : (
          <Pressable style={styles.shutter} onPress={handleCapture}>
            <View style={styles.shutterInner} />
          </Pressable>
        )}
      </View>
    );
  }

  if (state.phase === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>{state.message}</Text>
        <Pressable style={styles.primaryButton} onPress={handleRetake}>
          <Text style={styles.primaryButtonText}>Zkusit znovu</Text>
        </Pressable>
      </View>
    );
  }

  // state.phase === 'result'
  return (
    <ScrollView contentContainerStyle={styles.resultContainer}>
      <Image source={{ uri: state.stripUri }} style={styles.stripImage} resizeMode="stretch" />

      {state.bands.length === 0 && (
        <Text style={styles.warning}>
          Nepodařilo se rozpoznat žádné barevné pruhy. Zkus lepší osvětlení a rezistor blíž
          kameře.
        </Text>
      )}

      {state.bands.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Rozpoznané pruhy (klepnutím oprav)</Text>
          <View style={styles.bandRow}>
            {state.bands.map((band, index) => (
              <BandSwatch
                key={index}
                band={band}
                onSelect={(colorId) => handleCorrectBand(index, colorId)}
              />
            ))}
          </View>
        </>
      )}

      {state.decoded ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultValue}>{state.decoded.formattedValue}</Text>
          <Text style={styles.resultDetail}>
            {state.decoded.tolerancePercent !== null
              ? `tolerance ±${state.decoded.tolerancePercent} %`
              : 'tolerance neznámá'}
            {state.decoded.tempCoPpm !== null ? ` · ${state.decoded.tempCoPpm} ppm/K` : ''}
          </Text>
        </View>
      ) : state.bands.length > 0 ? (
        <Text style={styles.warning}>
          Počet nebo pořadí pruhů neodpovídá platné kombinaci (3-6 pruhů, číslicové pruhy nesmí
          být zlaté/stříbrné). Oprav barvy výše nebo zkus fotku znovu.
        </Text>
      ) : null}

      <View style={styles.actionRow}>
        <Pressable style={styles.secondaryButton} onPress={handleRetake}>
          <Text style={styles.secondaryButtonText}>Vyfotit znovu</Text>
        </Pressable>
        {state.decoded && (
          <Pressable style={styles.primaryButton} onPress={handleUseValue}>
            <Text style={styles.primaryButtonText}>Použít → Nová součástka</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

function BandSwatch({
  band,
  onSelect,
}: {
  band: DetectedBand;
  onSelect: (colorId: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <View style={styles.swatchWrap}>
      <Pressable
        style={[styles.swatch, { backgroundColor: rgbToCss(band.color.rgb) }]}
        onPress={() => setPickerOpen((v) => !v)}
      />
      <Text style={styles.swatchLabel}>{band.color.nameCz}</Text>
      {pickerOpen && (
        <View style={styles.picker}>
          {RESISTOR_BAND_COLORS.map((c: ResistorBandColor) => (
            <Pressable
              key={c.id}
              style={styles.pickerRow}
              onPress={() => {
                onSelect(c.id);
                setPickerOpen(false);
              }}
            >
              <View style={[styles.pickerSwatch, { backgroundColor: rgbToCss(c.rgb) }]} />
              <Text style={styles.pickerLabel}>{c.nameCz}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function rgbToCss(rgb: [number, number, number]): string {
  return `rgb(${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])})`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center' },
  guideBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#2f6fed',
    borderRadius: 8,
  },
  guideHint: {
    position: 'absolute',
    top: '60%',
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 32,
    textShadowColor: '#000',
    textShadowRadius: 4,
  },
  processingOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  processingText: { color: '#fff', marginTop: 8, fontSize: 14 },
  shutter: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  permissionText: { textAlign: 'center', fontSize: 15, color: '#333', marginBottom: 16 },
  primaryButton: {
    backgroundColor: '#2f6fed',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  secondaryButtonText: { color: '#333', fontSize: 15, fontWeight: '600' },
  resultContainer: { padding: 16, alignItems: 'center', paddingBottom: 48 },
  stripImage: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    backgroundColor: '#ddd',
    marginBottom: 16,
  },
  sectionLabel: { fontSize: 13, color: '#666', marginBottom: 8 },
  bandRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  swatchWrap: { alignItems: 'center', width: 72 },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  swatchLabel: { fontSize: 11, color: '#444', marginTop: 4, textAlign: 'center' },
  picker: {
    position: 'absolute',
    top: 48,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 4,
    width: 140,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  pickerSwatch: { width: 18, height: 18, borderRadius: 4, marginRight: 8 },
  pickerLabel: { fontSize: 13, color: '#333' },
  resultCard: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: '#f5f7ff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
  },
  resultValue: { fontSize: 32, fontWeight: '800', color: '#111' },
  resultDetail: { fontSize: 14, color: '#555', marginTop: 4 },
  warning: { fontSize: 14, color: '#a33', textAlign: 'center', marginTop: 16 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
});

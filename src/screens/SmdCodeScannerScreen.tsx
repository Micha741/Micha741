import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { decodeSmdCode, SMD_CODE_TYPE_LABELS } from '../utils/smdResistorCode';

type Props = NativeStackScreenProps<RootStackParamList, 'SmdCodeScanner'>;

// Guide rectangle, expressed as fractions of the captured photo so it maps
// onto both the live preview and the final image regardless of resolution.
const GUIDE = { xFrac: 0.15, yFrac: 0.35, widthFrac: 0.7, heightFrac: 0.3 };
const CROP_OUTPUT_WIDTH = 640; // upscale the small printed code for better OCR

type ScanState =
  | { phase: 'camera' }
  | { phase: 'processing' }
  | { phase: 'result'; imageUri: string; candidates: string[]; rawText: string }
  | { phase: 'error'; message: string };

function extractCandidates(text: string): string[] {
  // Plausible SMD code tokens: 2-4 alphanumerics, optionally containing "R".
  const matches = text.toUpperCase().match(/[0-9A-Z]{2,5}/g) ?? [];
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const m of matches) {
    if (!seen.has(m) && decodeSmdCode(m) !== null) {
      seen.add(m);
      ordered.push(m);
    }
  }
  return ordered;
}

export default function SmdCodeScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [state, setState] = useState<ScanState>({ phase: 'camera' });
  const [code, setCode] = useState('');

  const decoded = useMemo(() => decodeSmdCode(code), [code]);

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
      context.resize({ width: CROP_OUTPUT_WIDTH });
      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({ compress: 1, format: SaveFormat.JPEG });

      const recognized = await TextRecognition.recognize(saved.uri);
      const candidates = extractCandidates(recognized.text);
      const bestGuess = candidates[0] ?? '';

      setCode(bestGuess);
      setState({ phase: 'result', imageUri: saved.uri, candidates, rawText: recognized.text });
    } catch (err) {
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Rozpoznávání se nezdařilo.',
      });
    }
  };

  const handleRetake = () => {
    setCode('');
    setState({ phase: 'camera' });
  };

  const handleUseValue = () => {
    if (!decoded) return;
    navigation.navigate('ComponentForm', {
      prefill: {
        category: 'Rezistor',
        value: decoded.formattedValue,
        tags: 'rezistor,smd,sken',
        notes: `Hodnota určena OCR skenem kódu na pouzdře: ${code.trim().toUpperCase()} (${SMD_CODE_TYPE_LABELS[decoded.codeType]}).`,
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
          Pro sken SMD kódu je potřeba přístup ke kameře.
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
            Umísti kód vytištěný na součástce doprostřed rámečku, ať je co nejvíc čitelný
          </Text>
        </View>
        {state.phase === 'processing' ? (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingText}>Rozpoznávám text…</Text>
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
      <Image source={{ uri: state.imageUri }} style={styles.cropImage} resizeMode="contain" />

      {state.candidates.length > 1 && (
        <>
          <Text style={styles.sectionLabel}>Nalezeno více možných kódů, vyber správný</Text>
          <View style={styles.candidateRow}>
            {state.candidates.map((c) => (
              <Pressable
                key={c}
                style={[styles.candidateChip, code === c && styles.candidateChipActive]}
                onPress={() => setCode(c)}
              >
                <Text
                  style={[styles.candidateChipText, code === c && styles.candidateChipTextActive]}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {state.candidates.length === 0 && (
        <Text style={styles.warning}>
          Nepodařilo se automaticky rozpoznat platný kód. Rozpoznaný text: „{state.rawText.trim() || '(nic)'}
          “. Zkus lepší osvětlení/ostření, nebo kód uprav ručně níže.
        </Text>
      )}

      <Text style={styles.sectionLabel}>Kód (uprav, pokud je potřeba)</Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="např. 103, 4R7, 01C"
      />

      {decoded && (
        <View style={styles.resultCard}>
          <Text style={styles.resultValue}>{decoded.formattedValue}</Text>
          <Text style={styles.resultDetail}>{SMD_CODE_TYPE_LABELS[decoded.codeType]}</Text>
        </View>
      )}

      <View style={styles.actionRow}>
        <Pressable style={styles.secondaryButton} onPress={handleRetake}>
          <Text style={styles.secondaryButtonText}>Vyfotit znovu</Text>
        </Pressable>
        {decoded && (
          <Pressable style={styles.primaryButton} onPress={handleUseValue}>
            <Text style={styles.primaryButtonText}>Použít → Nová součástka</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
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
    top: '68%',
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
  cropImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    backgroundColor: '#ddd',
    marginBottom: 16,
  },
  sectionLabel: { fontSize: 13, color: '#666', marginBottom: 8, marginTop: 8 },
  candidateRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  candidateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  candidateChipActive: { backgroundColor: '#2f6fed' },
  candidateChipText: { color: '#333', fontSize: 15, fontWeight: '600' },
  candidateChipTextActive: { color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
    width: '100%',
    textAlign: 'center',
  },
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
  warning: { fontSize: 14, color: '#a33', textAlign: 'center', marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
});

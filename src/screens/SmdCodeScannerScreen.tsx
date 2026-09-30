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
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';

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
  const { colors } = useTheme();
  const { t } = useI18n();
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
      if (!photo) throw new Error(t('smdScanner.photoFailed'));

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
        message: err instanceof Error ? err.message : t('smdScanner.recognitionFailed'),
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
        notes: t('smdScanner.scanNote', {
          code: code.trim().toUpperCase(),
          type: SMD_CODE_TYPE_LABELS[decoded.codeType],
        }),
      },
    });
  };

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.permissionText, { color: colors.text }]}>
          {t('smdScanner.permission')}
        </Text>
        <Pressable style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>{t('smdScanner.allowCamera')}</Text>
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
          <Text style={styles.guideHint}>{t('smdScanner.guideHint')}</Text>
        </View>
        {state.phase === 'processing' ? (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingText}>{t('smdScanner.processing')}</Text>
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
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.permissionText, { color: colors.text }]}>{state.message}</Text>
        <Pressable style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleRetake}>
          <Text style={styles.primaryButtonText}>{t('smdScanner.tryAgain')}</Text>
        </Pressable>
      </View>
    );
  }

  // state.phase === 'result'
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.resultContainer}
    >
      <Image source={{ uri: state.imageUri }} style={styles.cropImage} resizeMode="contain" />

      {state.candidates.length > 1 && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t('smdScanner.multipleCandidates')}
          </Text>
          <View style={styles.candidateRow}>
            {state.candidates.map((c) => {
              const active = code === c;
              return (
                <Pressable
                  key={c}
                  style={[
                    styles.candidateChip,
                    { backgroundColor: colors.chipBackground },
                    active && { backgroundColor: colors.chipActiveBackground },
                  ]}
                  onPress={() => setCode(c)}
                >
                  <Text
                    style={[
                      styles.candidateChipText,
                      { color: colors.text },
                      active && { color: colors.primaryText },
                    ]}
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {state.candidates.length === 0 && (
        <Text style={styles.warning}>
          {t('smdScanner.noCandidates', { text: state.rawText.trim() || t('smdScanner.noText') })}
        </Text>
      )}

      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        {t('smdScanner.editLabel')}
      </Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder={t('smdScanner.codePlaceholder')}
        placeholderTextColor={colors.placeholder}
      />

      {decoded && (
        <View style={[styles.resultCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.resultValue, { color: colors.text }]}>{decoded.formattedValue}</Text>
          <Text style={[styles.resultDetail, { color: colors.textSecondary }]}>
            {SMD_CODE_TYPE_LABELS[decoded.codeType]}
          </Text>
        </View>
      )}

      <View style={styles.actionRow}>
        <Pressable
          style={[styles.secondaryButton, { backgroundColor: colors.chipBackground }]}
          onPress={handleRetake}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            {t('smdScanner.retake')}
          </Text>
        </Pressable>
        {decoded && (
          <Pressable style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleUseValue}>
            <Text style={styles.primaryButtonText}>{t('smdScanner.useValue')}</Text>
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
  permissionText: { textAlign: 'center', fontSize: 15, marginBottom: 16 },
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '600' },
  resultContainer: { padding: 16, alignItems: 'center', paddingBottom: 48 },
  cropImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    backgroundColor: '#ddd',
    marginBottom: 16,
  },
  sectionLabel: { fontSize: 13, marginBottom: 8, marginTop: 8 },
  candidateRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  candidateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  candidateChipText: { fontSize: 15, fontWeight: '600' },
  input: {
    borderWidth: 1,
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
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
  },
  resultValue: { fontSize: 32, fontWeight: '800' },
  resultDetail: { fontSize: 14, marginTop: 4 },
  warning: { fontSize: 14, color: '#a33', textAlign: 'center', marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
});

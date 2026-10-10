import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { useSQLiteContext } from 'expo-sqlite';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { listComponents } from '../db/componentRepository';
import type { ElectronicComponent } from '../types/component';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ComponentScanner'>;

// Guide rectangle, expressed as fractions of the captured photo so it maps
// onto both the live preview and the final image regardless of resolution.
const GUIDE = { xFrac: 0.1, yFrac: 0.32, widthFrac: 0.8, heightFrac: 0.3 };
const CROP_OUTPUT_WIDTH = 800; // upscale the printed marking for better OCR
const MAX_CANDIDATES_SEARCHED = 8;
const MAX_MATCHES_SHOWN = 30;
const ZOOM_STEP = 0.1;

type ScanState =
  | { phase: 'camera' }
  | { phase: 'processing' }
  | {
      phase: 'result';
      imageUri: string;
      rawText: string;
      query: string;
      matches: ElectronicComponent[];
    }
  | { phase: 'error'; message: string };

function extractCandidates(text: string): string[] {
  // Plausible part-marking tokens: short alphanumeric runs, as printed on
  // most THT/SMD parts (BS170, 1N4007, LM358, CD4013, G5LE-1, ...).
  const matches = text.toUpperCase().match(/[0-9A-Z]{3,15}/g) ?? [];
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const m of matches) {
    if (!seen.has(m)) {
      seen.add(m);
      ordered.push(m);
    }
  }
  return ordered;
}

export default function ComponentScannerScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [state, setState] = useState<ScanState>({ phase: 'camera' });
  const [query, setQuery] = useState('');
  const [zoom, setZoom] = useState(0);

  const handleZoomIn = () => setZoom((z) => Math.min(1, z + ZOOM_STEP));
  const handleZoomOut = () => setZoom((z) => Math.max(0, z - ZOOM_STEP));

  const searchInventory = async (candidates: string[]): Promise<ElectronicComponent[]> => {
    const terms = candidates.length > 0 ? candidates.slice(0, MAX_CANDIDATES_SEARCHED) : [];
    const byId = new Map<number, ElectronicComponent>();
    for (const term of terms) {
      const rows = await listComponents(db, { search: term });
      for (const row of rows) {
        if (!byId.has(row.id)) byId.set(row.id, row);
      }
      if (byId.size >= MAX_MATCHES_SHOWN) break;
    }
    return Array.from(byId.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, MAX_MATCHES_SHOWN);
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    setState({ phase: 'processing' });
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (!photo) throw new Error(t('componentScanner.photoFailed'));

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
      const nextQuery = candidates[0] ?? recognized.text.trim();
      const matches = await searchInventory(
        candidates.length > 0 ? candidates : [recognized.text.trim()].filter(Boolean)
      );

      setQuery(nextQuery);
      setState({ phase: 'result', imageUri: saved.uri, rawText: recognized.text, query: nextQuery, matches });
    } catch (err) {
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : t('componentScanner.recognitionFailed'),
      });
    }
  };

  const handleSearchAgain = async () => {
    if (state.phase !== 'result') return;
    const trimmed = query.trim();
    const matches = await searchInventory(trimmed ? [trimmed] : []);
    setState({ ...state, query: trimmed, matches });
  };

  const handleRetake = () => {
    setQuery('');
    setState({ phase: 'camera' });
  };

  const handleCreateNew = () => {
    if (state.phase !== 'result') return;
    const tags = query.trim() ? `${query.trim().toLowerCase()},sken` : 'sken';
    navigation.navigate('ComponentForm', {
      prefill: {
        name: query.trim() || undefined,
        tags,
        notes: t('componentScanner.scanNote', { text: state.rawText.trim() || t('componentScanner.noText') }),
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
          {t('componentScanner.permission')}
        </Text>
        <Pressable style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>{t('componentScanner.allowCamera')}</Text>
        </Pressable>
      </View>
    );
  }

  if (state.phase === 'camera' || state.phase === 'processing') {
    return (
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" zoom={zoom} />
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
          <Text style={styles.guideHint}>{t('componentScanner.guideHint')}</Text>
        </View>
        {state.phase === 'camera' && (
          <View style={styles.zoomControls}>
            <Pressable style={styles.zoomButton} onPress={handleZoomIn}>
              <Text style={styles.zoomButtonText}>+</Text>
            </Pressable>
            <Text style={styles.zoomLabel}>{Math.round(zoom * 100)}%</Text>
            <Pressable style={styles.zoomButton} onPress={handleZoomOut}>
              <Text style={styles.zoomButtonText}>−</Text>
            </Pressable>
          </View>
        )}
        {state.phase === 'processing' ? (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingText}>{t('componentScanner.processing')}</Text>
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
          <Text style={styles.primaryButtonText}>{t('componentScanner.tryAgain')}</Text>
        </Pressable>
      </View>
    );
  }

  // state.phase === 'result'
  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.resultContainer}
      data={state.matches}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <>
          <Image source={{ uri: state.imageUri }} style={styles.cropImage} resizeMode="contain" />

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t('componentScanner.editLabel')}
          </Text>
          <View style={styles.searchRow}>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
              ]}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder={t('componentScanner.queryPlaceholder')}
              placeholderTextColor={colors.placeholder}
              onSubmitEditing={handleSearchAgain}
            />
            <Pressable
              style={[styles.searchButton, { backgroundColor: colors.primary }]}
              onPress={handleSearchAgain}
            >
              <Text style={styles.primaryButtonText}>{t('componentScanner.searchAgain')}</Text>
            </Pressable>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 20 }]}>
            {state.matches.length > 0
              ? t('componentScanner.matchesFound', { count: state.matches.length })
              : t('componentScanner.noMatches')}
          </Text>
        </>
      }
      renderItem={({ item }) => (
        <Pressable
          style={[styles.matchRow, { borderBottomColor: colors.border }]}
          onPress={() => navigation.navigate('ComponentDetail', { id: item.id })}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.matchTitle, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.matchSubtitle, { color: colors.textSecondary }]}>
              {item.category}
              {item.value ? ` · ${item.value}` : ''}
            </Text>
          </View>
          <Text style={[styles.matchQty, { color: colors.text }]}>×{item.quantity}</Text>
        </Pressable>
      )}
      ListFooterComponent={
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.secondaryButton, { backgroundColor: colors.chipBackground }]}
            onPress={handleRetake}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              {t('componentScanner.retake')}
            </Text>
          </Pressable>
          <Pressable style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleCreateNew}>
            <Text style={styles.primaryButtonText}>{t('componentScanner.createNew')}</Text>
          </Pressable>
        </View>
      }
    />
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
    top: '66%',
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
  zoomControls: {
    position: 'absolute',
    right: 16,
    top: '32%',
    alignItems: 'center',
    gap: 8,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonText: { color: '#fff', fontSize: 24, fontWeight: '700', lineHeight: 26 },
  zoomLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
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
  resultContainer: { padding: 16, paddingBottom: 48 },
  cropImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    backgroundColor: '#ddd',
    marginBottom: 16,
  },
  sectionLabel: { fontSize: 13, marginBottom: 8 },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  searchButton: {
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  matchTitle: { fontSize: 16, fontWeight: '600' },
  matchSubtitle: { fontSize: 13, marginTop: 2 },
  matchQty: { fontSize: 15, fontWeight: '600', marginLeft: 8 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 24, justifyContent: 'center' },
});

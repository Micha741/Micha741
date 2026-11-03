import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  PermissionsAndroid,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HighSpeedCamera, {
  HighSpeedCameraView,
  type CameraInfo,
  type HighSpeedCameraViewRef,
  type RecordingFinishedEvent,
} from '../../modules/high-speed-camera';
import Chip from '../components/Chip';
import { formatDuration, formatNumber, nyquistHz } from '../lib/format';
import { buildModes, cameraLabel, maxFps, resolutionLabel, type CaptureMode } from '../lib/modes';
import { colors } from '../lib/theme';

type Props = {
  onOpenRecordings: () => void;
  onRecordingFinished: (event: RecordingFinishedEvent) => void;
};

type PermissionState = 'checking' | 'granted' | 'denied';

export default function CameraScreen({ onOpenRecordings, onRecordingFinished }: Props) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<HighSpeedCameraViewRef>(null);

  const [permission, setPermission] = useState<PermissionState>('checking');
  const [cameras, setCameras] = useState<CameraInfo[] | null>(null);
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [modeKey, setModeKey] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [ev, setEv] = useState(0);
  const [aeLock, setAeLock] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingSince, setRecordingSince] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [previewBox, setPreviewBox] = useState<{ width: number; height: number } | null>(null);

  // --- oprávnění + seznam kamer ---
  const requestPermission = useCallback(async () => {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
    setPermission(result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied');
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (permission !== 'granted') return;
    HighSpeedCamera.getCamerasAsync()
      .then((list) => {
        const usable = list.filter((c) => buildModes(c).length > 0);
        setCameras(usable);
        // Výchozí: zadní kamera s nejvyšší dostupnou snímkovou frekvencí.
        const best = [...usable].sort(
          (a, b) =>
            Number(b.facing === 'back') - Number(a.facing === 'back') || maxFps(b) - maxFps(a)
        )[0];
        if (best) {
          setCameraId(best.id);
          setModeKey(buildModes(best)[0]?.key ?? null);
        }
      })
      .catch((e: Error) => setError(e.message));
  }, [permission]);

  const camera = cameras?.find((c) => c.id === cameraId) ?? null;
  const modes = useMemo(() => (camera ? buildModes(camera) : []), [camera]);
  const mode: CaptureMode | null = modes.find((m) => m.key === modeKey) ?? modes[0] ?? null;
  const recording = recordingSince !== null;

  // --- časovač záznamu ---
  useEffect(() => {
    if (recordingSince === null) return;
    const timer = setInterval(() => setElapsed(Date.now() - recordingSince), 100);
    return () => clearInterval(timer);
  }, [recordingSince]);

  const selectCamera = (id: string) => {
    const next = cameras?.find((c) => c.id === id);
    if (!next) return;
    setReady(false);
    setError(null);
    setCameraId(id);
    setModeKey(buildModes(next)[0]?.key ?? null);
    setEv(0);
    setTorch(false);
  };

  const selectMode = (key: string) => {
    if (key === mode?.key) return;
    setReady(false);
    setError(null);
    setModeKey(key);
  };

  const toggleRecording = async () => {
    const ref = cameraRef.current;
    if (!ref || busy) return;
    setBusy(true);
    try {
      if (recording) {
        // Výsledek přijde i v události onRecordingFinished.
        await ref.stopRecording();
      } else {
        await ref.startRecording();
        setElapsed(0);
        setRecordingSince(Date.now());
      }
    } catch (e) {
      setRecordingSince(null);
      Alert.alert('Záznam', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onPreviewLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setPreviewBox({ width, height });
  };

  // Náhled je na výšku: šířka/výška senzoru jsou prohozené.
  const previewSize = useMemo(() => {
    if (!previewBox || !mode) return null;
    const aspect = mode.height / mode.width;
    let width = previewBox.width;
    let height = width / aspect;
    if (height > previewBox.height) {
      height = previewBox.height;
      width = height * aspect;
    }
    return { width, height };
  }, [previewBox, mode]);

  // --- obrazovky bez kamery ---
  if (permission === 'checking') {
    return <Centered><ActivityIndicator color={colors.accent} /></Centered>;
  }
  if (permission === 'denied') {
    return (
      <Centered>
        <Text style={styles.message}>Aplikace potřebuje přístup ke kameře.</Text>
        <Chip label="Povolit" selected onPress={requestPermission} style={styles.messageButton} />
        <Chip label="Otevřít nastavení" onPress={() => Linking.openSettings()} style={styles.messageButton} />
      </Centered>
    );
  }
  if (!cameras) {
    return (
      <Centered>
        {error ? <Text style={styles.message}>{error}</Text> : <ActivityIndicator color={colors.accent} />}
      </Centered>
    );
  }
  if (!camera || !mode) {
    return <Centered><Text style={styles.message}>Nenalezena žádná použitelná kamera.</Text></Centered>;
  }

  const nyquist = nyquistHz(mode.fps);
  const evStep = camera.evStep || 0;
  const anyHighSpeed = cameras.some((c) => c.highSpeedSupported && c.highSpeedModes.length > 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Výběr kamery */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row} contentContainerStyle={styles.rowContent}>
        {cameras.map((c, i) => (
          <Chip
            key={c.id}
            label={`${cameraLabel(c, i, cameras)} · max ${maxFps(c)} fps`}
            selected={c.id === camera.id}
            disabled={recording}
            onPress={() => selectCamera(c.id)}
          />
        ))}
      </ScrollView>

      {/* Výběr režimu */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row} contentContainerStyle={styles.rowContent}>
        {modes.map((m) => (
          <Chip
            key={m.key}
            label={`${m.fps} fps · ${resolutionLabel(m.width, m.height)}${m.highSpeed ? ' ⚡' : ''}`}
            selected={m.key === mode.key}
            disabled={recording}
            onPress={() => selectMode(m.key)}
          />
        ))}
      </ScrollView>

      <Text style={styles.info}>
        Zachytí kmitání do {formatNumber(nyquist, 0)} Hz ({formatNumber(nyquist * 60, 0)} ot/min)
        {mode.highSpeed ? ' · high-speed režim' : ''}
      </Text>
      {!anyHighSpeed && (
        <Text style={styles.warning}>
          Telefon nezpřístupňuje aplikacím high-speed záznam. Je k dispozici max. {mode.fps} fps.
        </Text>
      )}

      {/* Náhled */}
      <View style={styles.previewArea} onLayout={onPreviewLayout}>
        {previewSize && (
          <View style={previewSize}>
            <HighSpeedCameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              cameraId={camera.id}
              videoWidth={mode.width}
              videoHeight={mode.height}
              fps={mode.fps}
              highSpeed={mode.highSpeed}
              torch={torch}
              exposureCompensation={ev}
              aeLock={aeLock}
              onCameraReady={() => {
                setReady(true);
                setError(null);
              }}
              onCameraError={(e) => {
                setReady(false);
                setRecordingSince(null);
                setError(e.nativeEvent.message);
              }}
              onRecordingFinished={(e) => {
                setRecordingSince(null);
                onRecordingFinished(e.nativeEvent);
              }}
            />
            {!ready && !error && (
              <View style={styles.overlay}>
                <ActivityIndicator color={colors.accent} />
              </View>
            )}
            {error && (
              <View style={styles.overlay}>
                <Text style={styles.message}>{error}</Text>
              </View>
            )}
            {recording && (
              <View style={styles.recBadge}>
                <View style={styles.recDot} />
                <Text style={styles.recText}>{formatDuration(elapsed)}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Ovládání expozice */}
      <View style={styles.controls}>
        <Chip
          label={torch ? 'Světlo zap.' : 'Světlo vyp.'}
          selected={torch}
          disabled={!camera.flashAvailable}
          onPress={() => setTorch((t) => !t)}
        />
        <Chip label="−" disabled={ev <= camera.evMin} onPress={() => setEv((v) => Math.max(camera.evMin, v - 1))} />
        <Text style={styles.evText}>EV {ev * evStep >= 0 ? '+' : ''}{formatNumber(ev * evStep, 1)}</Text>
        <Chip label="+" disabled={ev >= camera.evMax} onPress={() => setEv((v) => Math.min(camera.evMax, v + 1))} />
        <Chip label="AE zámek" selected={aeLock} onPress={() => setAeLock((l) => !l)} />
      </View>

      {/* Spoušť */}
      <View style={styles.bottomBar}>
        <View style={styles.sideSlot}>
          <Chip label="Záznamy" disabled={recording} onPress={onOpenRecordings} />
        </View>
        <Pressable
          onPress={toggleRecording}
          disabled={!ready || busy}
          style={[styles.shutter, (!ready || busy) && styles.shutterDisabled]}
        >
          <View style={recording ? styles.shutterStop : styles.shutterRecord} />
        </Pressable>
        <View style={styles.sideSlot}>
          <Text style={styles.modeText}>{mode.fps} fps</Text>
          <Text style={styles.modeSub}>{mode.width}×{mode.height}</Text>
        </View>
      </View>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={[styles.container, styles.centered]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  row: { flexGrow: 0, marginTop: 8 },
  rowContent: { paddingHorizontal: 12 },
  info: { color: colors.textMuted, fontSize: 13, marginHorizontal: 16, marginTop: 8 },
  warning: { color: colors.warning, fontSize: 13, marginHorizontal: 16, marginTop: 4 },
  previewArea: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  message: { color: colors.text, fontSize: 15, textAlign: 'center' },
  messageButton: { marginTop: 12, marginRight: 0 },
  recBadge: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.record, marginRight: 8 },
  recText: { color: '#fff', fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  evText: { color: colors.text, fontSize: 14, minWidth: 64, textAlign: 'center', marginRight: 8 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sideSlot: { width: 110, alignItems: 'center' },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: { opacity: 0.4 },
  shutterRecord: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.record },
  shutterStop: { width: 30, height: 30, borderRadius: 6, backgroundColor: colors.record },
  modeText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  modeSub: { color: colors.textMuted, fontSize: 12 },
});

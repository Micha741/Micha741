import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
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
import BottomSheet from '../components/BottomSheet';
import Chip from '../components/Chip';
import { formatDuration, formatNumber, nyquistHz } from '../lib/format';
import { buildModes, cameraLabel, maxFps, resolutionLabel, type CaptureMode } from '../lib/modes';
import { coverage, MOTOR_PRESETS } from '../lib/motor';
import { useSettings, useStyles } from '../lib/settings';
import { TABULAR_NUMS } from '../lib/theme';

type Props = {
  onOpenRecordings: () => void;
  onOpenResults: () => void;
  onOpenSettings: () => void;
  onRecordingFinished: (event: RecordingFinishedEvent) => void;
};

type PermissionState = 'checking' | 'granted' | 'denied';

/** Výška stálé spodní části (úchyt + spoušť) bez systémového okraje. */
const PEEK_HEIGHT = 136;

export default function CameraScreen({ onOpenRecordings, onOpenResults, onOpenSettings, onRecordingFinished }: Props) {
  const { settings, colors } = useSettings();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<HighSpeedCameraViewRef>(null);
  const styles = useStyles(makeStyles);

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
          (a, b) => Number(b.facing === 'back') - Number(a.facing === 'back') || maxFps(b) - maxFps(a)
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
    if (!next || id === cameraId) return;
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
        // Výsledek přijde v události onRecordingFinished.
        await ref.stopRecording();
      } else {
        setSheetOpen(false);
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
    return (
      <Centered>
        <ActivityIndicator color={colors.accent} />
      </Centered>
    );
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
    return (
      <Centered>
        <Text style={styles.message}>Nenalezena žádná použitelná kamera.</Text>
      </Centered>
    );
  }

  const nyquist = nyquistHz(mode.fps);
  const cov = coverage(mode.fps, settings.motor);
  const covColor = cov.level === 'good' ? colors.success : cov.level === 'ok' ? colors.warning : colors.record;
  const evStep = camera.evStep || 0;
  const anyHighSpeed = cameras.some((c) => c.highSpeedSupported && c.highSpeedModes.length > 0);

  const menuItems: { label: string; onPress: () => void }[] = [
    { label: 'Záznamy', onPress: onOpenRecordings },
    { label: 'Výsledky měření', onPress: onOpenResults },
    { label: 'Nastavení', onPress: onOpenSettings },
  ];

  return (
    <View style={styles.container}>
      {/* Náhled přes celou plochu nad stálou spodní částí */}
      <View style={[styles.previewArea, { paddingTop: insets.top + 52, paddingBottom: PEEK_HEIGHT + insets.bottom }]}>
        <View style={styles.previewInner} onLayout={onPreviewLayout}>
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
                  <ActivityIndicator color="#fff" />
                </View>
              )}
              {error && (
                <View style={styles.overlay}>
                  <Text style={styles.overlayText}>{error}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Horní lišta: stav + menu */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable style={styles.statusPill} onPress={() => !recording && setSheetOpen(true)}>
          <View style={[styles.dot, { backgroundColor: covColor }]} />
          <Text style={styles.statusText}>
            {mode.fps} fps · {resolutionLabel(mode.width, mode.height)}
            {mode.highSpeed ? ' ⚡' : ''}
          </Text>
        </Pressable>
        {recording ? (
          <View style={styles.recBadge}>
            <View style={styles.recDot} />
            <Text style={styles.recText}>{formatDuration(elapsed)}</Text>
          </View>
        ) : (
          <View style={styles.flex} />
        )}
        <Pressable style={styles.menuButton} onPress={() => setMenuOpen(true)} disabled={recording} hitSlop={8}>
          <Text style={[styles.menuIcon, recording && styles.dim]}>☰</Text>
        </Pressable>
      </View>

      {/* Spodní zasouvací lišta s nastavením kamery */}
      <View style={styles.sheetWrap}>
        <BottomSheet
          open={sheetOpen && !recording}
          onOpenChange={(o) => !recording && setSheetOpen(o)}
          title="Nastavení kamery"
          bottomInset={insets.bottom}
          peek={
            <View style={styles.peek}>
              <Pressable style={styles.sideButton} onPress={onOpenRecordings} disabled={recording}>
                <Text style={[styles.sideIcon, recording && styles.dim]}>▤</Text>
                <Text style={[styles.sideLabel, recording && styles.dim]}>Záznamy</Text>
              </Pressable>
              <Pressable
                onPress={toggleRecording}
                disabled={!ready || busy}
                style={[styles.shutter, (!ready || busy) && styles.dim]}
              >
                <View style={recording ? styles.shutterStop : styles.shutterRecord} />
              </Pressable>
              <Pressable
                style={styles.sideButton}
                onPress={() => setTorch((t) => !t)}
                disabled={!camera.flashAvailable}
              >
                <Text style={[styles.sideIcon, torch && { color: colors.warning }, !camera.flashAvailable && styles.dim]}>
                  ϟ
                </Text>
                <Text style={[styles.sideLabel, !camera.flashAvailable && styles.dim]}>
                  {torch ? 'Světlo zap.' : 'Světlo'}
                </Text>
              </Pressable>
            </View>
          }
        >
          <View style={styles.sheetContent}>
            <Text style={[styles.coverage, { color: covColor }]}>
              {cov.level === 'aliasing' ? '⚠ ' : '✓ '}
              {MOTOR_PRESETS[settings.motor.type].label}: {cov.message}
            </Text>
            <Text style={styles.muted}>
              Limit při {mode.fps} fps: {formatNumber(nyquist, 0)} Hz ({formatNumber(nyquist * 60, 0)} ot/min)
            </Text>
            {!anyHighSpeed && (
              <Text style={styles.warning}>
                Telefon nezpřístupňuje aplikacím high-speed záznam – max. {maxFps(camera)} fps.
              </Text>
            )}

            <Text style={styles.section}>Objektiv</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {cameras.map((c, i) => (
                <Chip
                  key={c.id}
                  label={`${cameraLabel(c, i, cameras)} · ${maxFps(c)} fps`}
                  selected={c.id === camera.id}
                  onPress={() => selectCamera(c.id)}
                />
              ))}
            </ScrollView>

            <Text style={styles.section}>Snímková frekvence a rozlišení</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {modes.map((m) => (
                <Chip
                  key={m.key}
                  label={`${m.fps} fps · ${resolutionLabel(m.width, m.height)}${m.highSpeed ? ' ⚡' : ''}`}
                  selected={m.key === mode.key}
                  onPress={() => selectMode(m.key)}
                />
              ))}
            </ScrollView>

            <Text style={styles.section}>Expozice</Text>
            <View style={styles.row}>
              <Chip label="−" disabled={ev <= camera.evMin} onPress={() => setEv((v) => Math.max(camera.evMin, v - 1))} />
              <Text style={styles.evText}>
                EV {ev * evStep >= 0 ? '+' : ''}
                {formatNumber(ev * evStep, 1)}
              </Text>
              <Chip label="+" disabled={ev >= camera.evMax} onPress={() => setEv((v) => Math.min(camera.evMax, v + 1))} />
              <Chip label="AE zámek" selected={aeLock} onPress={() => setAeLock((l) => !l)} />
            </View>
            <Text style={styles.muted}>
              Záporná EV zkrátí expozici → méně rozmazaný pohyb (potřebuje víc světla).
            </Text>
          </View>
        </BottomSheet>
      </View>

      {/* Menu */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menu, { marginTop: insets.top + 52 }]}>
            {menuItems.map((item) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={() => {
                  setMenuOpen(false);
                  item.onPress();
                }}
              >
                <Text style={styles.menuItemText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  const styles = useStyles(makeStyles);
  return <View style={[styles.container, styles.centered]}>{children}</View>;
}

const makeStyles = (c: import('../lib/theme').ThemeColors) =>
  ({
    container: { flex: 1, backgroundColor: '#000' },
    centered: { alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: c.background },
    flex: { flex: 1 },
    dim: { opacity: 0.35 },
    message: { color: c.text, fontSize: 15, textAlign: 'center' },
    messageButton: { marginTop: 12, marginRight: 0 },
    previewArea: { ...StyleSheet.absoluteFill },
    previewInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    overlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 16,
    },
    overlayText: { color: '#fff', fontSize: 15, textAlign: 'center' },
    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    dot: { width: 9, height: 9, borderRadius: 5, marginRight: 8 },
    statusText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    recBadge: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff453a', marginRight: 8 },
    recText: { color: '#fff', fontSize: 16, fontWeight: '700', fontVariant: TABULAR_NUMS },
    menuButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuIcon: { color: '#fff', fontSize: 22 },
    sheetWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    peek: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 28,
      paddingTop: 4,
      paddingBottom: 14,
    },
    sideButton: { width: 80, alignItems: 'center' },
    sideIcon: { color: c.text, fontSize: 24 },
    sideLabel: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    shutter: {
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 4,
      borderColor: c.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shutterRecord: { width: 58, height: 58, borderRadius: 29, backgroundColor: c.record },
    shutterStop: { width: 30, height: 30, borderRadius: 6, backgroundColor: c.record },
    sheetContent: { paddingHorizontal: 16, paddingBottom: 12 },
    coverage: { fontSize: 13, fontWeight: '600' },
    muted: { color: c.textMuted, fontSize: 12, marginTop: 4 },
    warning: { color: c.warning, fontSize: 12, marginTop: 4 },
    section: { color: c.text, fontSize: 14, fontWeight: '700', marginTop: 14, marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center' },
    evText: { color: c.text, fontSize: 14, minWidth: 64, textAlign: 'center', marginRight: 8 },
    menuBackdrop: { flex: 1, backgroundColor: c.overlay, alignItems: 'flex-end', paddingRight: 12 },
    menu: {
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      minWidth: 210,
      paddingVertical: 6,
    },
    menuItem: { paddingHorizontal: 18, paddingVertical: 14 },
    menuItemPressed: { backgroundColor: c.surfaceRaised },
    menuItemText: { color: c.text, fontSize: 16 },
  }) as const;

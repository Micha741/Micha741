import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

import HighSpeedCamera, { type RecordingFile, type TrackResult } from '../../modules/high-speed-camera';
import Chip from '../components/Chip';
import Screen from '../components/Screen';
import { analysisFps, formatNumber, nominalFps } from '../lib/format';
import { aliasCandidates, coverage, MOTOR_PRESETS } from '../lib/motor';
import { useSettings, useStyles } from '../lib/settings';
import { addMeasurement, getCalibration, loadMeasurements, setCalibration, type Calibration } from '../lib/storage';
import { TABULAR_NUMS, type ThemeColors } from '../lib/theme';

export type AnalysisRequest = {
  recording: RecordingFile;
  track: TrackResult;
  fps: number;
  calibration: Calibration | null;
  startMs: number;
};

type Props = {
  recording: RecordingFile;
  onBack: () => void;
  onAnalyzed: (request: AnalysisRequest) => void;
};

const SPEEDS = [
  { rate: 1, label: '1×' },
  { rate: 1 / 2, label: '1/2' },
  { rate: 1 / 4, label: '1/4' },
  { rate: 1 / 8, label: '1/8' },
  { rate: 1 / 16, label: '1/16' },
  { rate: 1 / 32, label: '1/32' },
];

const ROI_SIZES = [
  { size: 0.05, label: 'Malá' },
  { size: 0.08, label: 'Střední' },
  { size: 0.12, label: 'Velká' },
];

const LENGTHS = [1, 2, 5, 10];

type PickMode = 'none' | 'roi' | 'cal1' | 'cal2';

export default function PlayerScreen({ recording, onBack, onAnalyzed }: Props) {
  const { settings, colors } = useSettings();
  const styles = useStyles(makeStyles);
  const fps = analysisFps(recording);
  const recordedFps = nominalFps(recording) ?? Math.round(fps);
  const motor = settings.motor;
  const cov = coverage(fps, motor);

  // Rozměry zobrazeného videa (po otočení).
  const rotated = recording.rotation === 90 || recording.rotation === 270;
  const encW = recording.width ?? 1280;
  const encH = recording.height ?? 720;
  const dispW = rotated ? encH : encW;
  const dispH = rotated ? encW : encH;

  const [rate, setRate] = useState(1 / 8);
  const [time, setTime] = useState(0);
  const [markA, setMarkA] = useState<number | null>(null);
  const [markB, setMarkB] = useState<number | null>(null);
  const [turns, setTurns] = useState(1);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(() => loadMeasurements().filter((m) => m.recordingPath === recording.path));

  // --- analýza vibrací ---
  const [pickMode, setPickMode] = useState<PickMode>('none');
  const [roiCenter, setRoiCenter] = useState<{ x: number; y: number } | null>(null);
  const [roiSize, setRoiSize] = useState(0.08);
  const [lengthS, setLengthS] = useState(2);
  const [calibration, setCal] = useState<Calibration | null>(() => getCalibration(recording.path));
  const [calPoints, setCalPoints] = useState<{ x: number; y: number }[]>([]);
  const [calMm, setCalMm] = useState('');
  const [tracking, setTracking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoBox, setVideoBox] = useState({ width: 1, height: 1 });

  const player = useVideoPlayer(recording.uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.timeUpdateEventInterval = 1 / 30;
    p.playbackRate = 1 / 8;
    p.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  useEventListener(player, 'timeUpdate', ({ currentTime }) => setTime(currentTime));
  useEventListener(HighSpeedCamera, 'onTrackingProgress', ({ progress: p }) => setProgress(p));

  useEffect(
    () => () => {
      HighSpeedCamera.cancelTracking();
    },
    []
  );

  const duration =
    status === 'readyToPlay' && player.duration > 0 ? player.duration : (recording.durationMs ?? 0) / 1000;
  const totalFrames = recording.frameCount ?? Math.max(1, Math.round(duration * fps));
  const frame = Math.min(totalFrames - 1, Math.max(0, Math.round(time * fps)));

  const seekToFrame = (target: number) => {
    const clamped = Math.min(totalFrames - 1, Math.max(0, target));
    // ExoPlayer při přesném seeku zobrazí první snímek s časem >= cíl.
    player.pause();
    player.currentTime = Math.max(0, clamped / fps - 0.0005);
    setTime(clamped / fps);
  };

  const changeRate = (value: number) => {
    setRate(value);
    player.playbackRate = value;
  };

  const togglePlay = () => {
    if (isPlaying) player.pause();
    else player.play();
  };

  // --- posuvník ---
  const barWidth = useRef(1);
  const scrub = (e: GestureResponderEvent) => {
    const fraction = Math.min(1, Math.max(0, e.nativeEvent.locationX / barWidth.current));
    seekToFrame(Math.round(fraction * (totalFrames - 1)));
  };

  // --- obdélník, kde je video v přehrávači (contentFit: contain) ---
  const scale = Math.min(videoBox.width / dispW, videoBox.height / dispH);
  const rect = {
    left: (videoBox.width - dispW * scale) / 2,
    top: (videoBox.height - dispH * scale) / 2,
    width: dispW * scale,
    height: dispH * scale,
  };
  const toNorm = (x: number, y: number) => ({
    x: Math.min(1, Math.max(0, (x - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (y - rect.top) / rect.height)),
  });

  const onVideoTap = (e: GestureResponderEvent) => {
    const p = toNorm(e.nativeEvent.locationX, e.nativeEvent.locationY);
    if (pickMode === 'roi') {
      setRoiCenter(p);
      setPickMode('none');
    } else if (pickMode === 'cal1') {
      setCalPoints([p]);
      setPickMode('cal2');
    } else if (pickMode === 'cal2') {
      setCalPoints((pts) => [pts[0], p]);
      setPickMode('none');
    }
  };

  const calDistancePx =
    calPoints.length === 2
      ? Math.hypot((calPoints[1].x - calPoints[0].x) * dispW, (calPoints[1].y - calPoints[0].y) * dispH)
      : 0;

  const saveCalibration = () => {
    const mm = Number(calMm.replace(',', '.'));
    if (!(mm > 0) || calDistancePx < 5) {
      Alert.alert('Kalibrace', 'Označ dva body dál od sebe a zadej jejich skutečnou vzdálenost v mm.');
      return;
    }
    const cal: Calibration = {
      mmPerPx: mm / calDistancePx,
      mm,
      points: [calPoints[0].x, calPoints[0].y, calPoints[1].x, calPoints[1].y],
    };
    try {
      setCalibration(recording.path, cal);
    } catch {
      // Kalibrace platí aspoň pro tuto analýzu.
    }
    setCal(cal);
    setCalPoints([]);
    setCalMm('');
  };

  const clearCalibration = () => {
    try {
      setCalibration(recording.path, null);
    } catch {
      // nevadí
    }
    setCal(null);
  };

  const runAnalysis = async () => {
    if (!roiCenter) return;
    const lengthMs = lengthS * 1000;
    const totalMs = duration * 1000;
    let startMs = time * 1000;
    if (startMs + lengthMs > totalMs) startMs = Math.max(0, totalMs - lengthMs);
    player.pause();
    setTracking(true);
    setProgress(0);
    try {
      const track = await HighSpeedCamera.trackMotionAsync({
        path: recording.path,
        centerX: roiCenter.x,
        centerY: roiCenter.y,
        roiSize,
        searchRadius: 10,
        startMs,
        durationMs: Math.min(lengthMs, totalMs || lengthMs),
      });
      onAnalyzed({ recording, track, fps, calibration, startMs });
    } catch (e) {
      const message = (e as Error).message;
      if (!/zrušena/i.test(message)) Alert.alert('Analýza se nezdařila', message);
    } finally {
      setTracking(false);
    }
  };

  // --- měření otáček mezi dvěma značkami ---
  const deltaFrames = markA !== null && markB !== null ? Math.abs(markB - markA) : 0;
  const apparent =
    deltaFrames > 0
      ? (() => {
          const seconds = deltaFrames / fps;
          const hz = turns / seconds;
          return { seconds, hz, errorHz: hz / deltaFrames };
        })()
      : null;
  const mayAlias = cov.level === 'aliasing';
  const candidates = apparent && mayAlias ? aliasCandidates(apparent.hz, fps, motor) : [];
  const chosen = candidates[Math.min(candidateIndex, Math.max(0, candidates.length - 1))];
  const result = apparent
    ? (() => {
        const hz = chosen ? chosen.hz : apparent.hz;
        return { hz, rpm: hz * 60, errorPct: (100 * apparent.errorHz) / hz, aliased: !!chosen && chosen.k > 0 };
      })()
    : null;

  const saveResult = () => {
    if (!result || !apparent || markA === null || markB === null) return;
    try {
      addMeasurement({
        kind: 'rpm',
        recordingName: recording.name,
        recordingPath: recording.path,
        rpm: result.rpm,
        hz: result.hz,
        apparentHz: apparent.hz,
        aliased: result.aliased,
        fps,
        frameA: Math.min(markA, markB),
        frameB: Math.max(markA, markB),
        turns,
        errorPct: result.errorPct,
        motorType: motor.type,
        maxRpm: motor.maxRpm,
        note: note.trim(),
      });
      setSaved(loadMeasurements().filter((m) => m.recordingPath === recording.path));
      setNote('');
      Alert.alert('Uloženo', `${formatNumber(result.rpm, 0)} ot/min uloženo do výsledků.`);
    } catch (e) {
      Alert.alert('Uložení se nezdařilo', (e as Error).message);
    }
  };

  const resetCandidates = () => setCandidateIndex(0);
  const progressPct = totalFrames > 1 ? (frame / (totalFrames - 1)) * 100 : 0;
  const roiPx = Math.min(rect.width, rect.height) * roiSize;
  const pickHint =
    pickMode === 'roi'
      ? 'Klepni na kontrastní značku na stroji'
      : pickMode === 'cal1'
        ? 'Klepni na 1. bod se známou vzdáleností'
        : pickMode === 'cal2'
          ? 'Klepni na 2. bod'
          : null;

  return (
    <Screen title={`${recordedFps} fps · zpomaleno ${formatNumber(1 / rate, 0)}×`} onBack={onBack}>
      <View
        style={styles.videoArea}
        onLayout={(e: LayoutChangeEvent) =>
          setVideoBox({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
        }
      >
        <VideoView player={player} style={styles.video} nativeControls={false} contentFit="contain" />
        {/* Vrstva pro výběr bodu a zobrazení značek */}
        <Pressable
          style={styles.touchLayer}
          onPress={onVideoTap}
          disabled={pickMode === 'none'}
          pointerEvents={pickMode === 'none' ? 'none' : 'auto'}
        >
          {roiCenter && (
            <View
              style={[
                styles.roi,
                {
                  left: rect.left + roiCenter.x * rect.width - roiPx / 2,
                  top: rect.top + roiCenter.y * rect.height - roiPx / 2,
                  width: roiPx,
                  height: roiPx,
                },
              ]}
            />
          )}
          {calPoints.map((p, i) => (
            <View
              key={i}
              style={[styles.calPoint, { left: rect.left + p.x * rect.width - 6, top: rect.top + p.y * rect.height - 6 }]}
            />
          ))}
          {pickHint && (
            <View style={styles.pickBanner}>
              <Text style={styles.pickText}>{pickHint}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent} keyboardShouldPersistTaps="handled">
        {/* Pozice */}
        <Text style={styles.position}>
          Snímek {frame + 1} / {totalFrames} · {formatNumber(time * 1000, 1)} ms
        </Text>
        <View
          style={styles.bar}
          onLayout={(e) => (barWidth.current = e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={scrub}
          onResponderMove={scrub}
        >
          <View style={[styles.barFill, { width: `${progressPct}%` }]} />
          {markA !== null && (
            <View
              style={[styles.mark, { backgroundColor: colors.success, left: `${(markA / Math.max(1, totalFrames - 1)) * 100}%` }]}
            />
          )}
          {markB !== null && (
            <View
              style={[styles.mark, { backgroundColor: colors.warning, left: `${(markB / Math.max(1, totalFrames - 1)) * 100}%` }]}
            />
          )}
        </View>

        {/* Krokování */}
        <View style={styles.row}>
          <Chip label="−10" onPress={() => seekToFrame(frame - 10)} />
          <Chip label="◀ 1" onPress={() => seekToFrame(frame - 1)} />
          <Chip label={isPlaying ? '❚❚' : '▶'} selected onPress={togglePlay} style={styles.play} />
          <Chip label="1 ▶" onPress={() => seekToFrame(frame + 1)} />
          <Chip label="+10" onPress={() => seekToFrame(frame + 10)} />
        </View>

        <Text style={styles.sectionTitle}>Rychlost přehrávání</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SPEEDS.map((s) => (
            <Chip key={s.label} label={s.label} selected={Math.abs(s.rate - rate) < 1e-6} onPress={() => changeRate(s.rate)} />
          ))}
        </ScrollView>
        <Text style={styles.hint}>
          Na obrazovce {formatNumber(fps * rate, 1)} snímků/s – 1 s děje trvá {formatNumber(1 / rate, 0)} s.
        </Text>

        {/* ---------------- Analýza vibrací ---------------- */}
        <Text style={styles.sectionTitle}>Analýza vibrací (časový záznam)</Text>
        <Text style={styles.hint}>
          Aplikace sleduje vybraný bod snímek po snímku a z jeho výchylky spočítá 0-P, P-P, AVG, RMS,
          frekvenci a spektrum. Vyber malou kontrastní značku (nálepka, šroub, hrana) na nepohyblivé
          části stroje – ne na rotující hřídeli.
        </Text>
        <View style={styles.row}>
          <Chip
            label={roiCenter ? '1. Bod vybrán ✓' : '1. Vybrat bod'}
            selected={pickMode === 'roi' || !!roiCenter}
            onPress={() => setPickMode(pickMode === 'roi' ? 'none' : 'roi')}
          />
          {ROI_SIZES.map((r) => (
            <Chip key={r.size} label={r.label} selected={roiSize === r.size} onPress={() => setRoiSize(r.size)} />
          ))}
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Délka:</Text>
          {LENGTHS.map((l) => (
            <Chip key={l} label={`${l} s`} selected={lengthS === l} onPress={() => setLengthS(l)} />
          ))}
        </View>
        <Text style={styles.hint}>
          Od aktuálního snímku. Záznam má obsahovat aspoň 10 otáček (nad 600 ot/min stačí 1 s).
        </Text>

        {/* Kalibrace */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kalibrace na mm (volitelné)</Text>
          {calibration ? (
            <>
              <Text style={styles.cardText}>
                1 px = {formatNumber(calibration.mmPerPx, 4)} mm ({formatNumber(calibration.mm, 1)} mm)
              </Text>
              <View style={styles.row}>
                <Chip
                  label="Znovu"
                  onPress={() => {
                    clearCalibration();
                    setPickMode('cal1');
                  }}
                />
                <Chip label="Zrušit kalibraci" onPress={clearCalibration} />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.cardText}>
                Bez kalibrace jsou výsledky v pixelech. Označ dva body se známou vzdáleností (např. konce
                pravítka nebo šrouby) – ideálně ve stejné vzdálenosti od kamery jako měřený bod.
              </Text>
              <View style={styles.row}>
                <Chip
                  label={calPoints.length === 2 ? 'Body označeny ✓' : 'Označit 2 body'}
                  selected={pickMode === 'cal1' || pickMode === 'cal2'}
                  onPress={() => setPickMode(pickMode === 'none' ? 'cal1' : 'none')}
                />
              </View>
              {calPoints.length === 2 && (
                <View style={styles.row}>
                  <TextInput
                    style={styles.input}
                    value={calMm}
                    onChangeText={setCalMm}
                    keyboardType="decimal-pad"
                    placeholder="vzdálenost v mm"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Chip label="Uložit" selected onPress={saveCalibration} />
                  <Text style={styles.small}>{formatNumber(calDistancePx, 1)} px</Text>
                </View>
              )}
            </>
          )}
        </View>

        {tracking ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Analyzuji… {Math.round(progress * 100)} %</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <Chip label="Zrušit" onPress={() => HighSpeedCamera.cancelTracking()} style={styles.topGap} />
          </View>
        ) : (
          <Chip label="2. Analyzovat vibrace" selected disabled={!roiCenter} onPress={runAnalysis} style={styles.analyzeButton} />
        )}

        {/* ---------------- Měření otáček ---------------- */}
        <Text style={styles.sectionTitle}>Měření otáček ručně</Text>
        <Text style={styles.hint}>
          Najeď na snímek, kdy značka na hřídeli projde referenčním bodem → „Značka A“. Pak krokuj dál
          přes jednu nebo více otáček → „Značka B“.
        </Text>
        <View style={styles.row}>
          <Chip
            label={markA === null ? 'Značka A' : `A: ${markA + 1}`}
            selected={markA !== null}
            onPress={() => {
              setMarkA(frame);
              resetCandidates();
            }}
          />
          <Chip
            label={markB === null ? 'Značka B' : `B: ${markB + 1}`}
            selected={markB !== null}
            onPress={() => {
              setMarkB(frame);
              resetCandidates();
            }}
          />
          <Chip
            label="Smazat"
            onPress={() => {
              setMarkA(null);
              setMarkB(null);
            }}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Otáček mezi A a B:</Text>
          <Chip
            label="−"
            disabled={turns <= 1}
            onPress={() => {
              setTurns((t) => Math.max(1, t - 1));
              resetCandidates();
            }}
          />
          <Text style={styles.turns}>{turns}</Text>
          <Chip
            label="+"
            onPress={() => {
              setTurns((t) => t + 1);
              resetCandidates();
            }}
          />
        </View>
        {result && apparent ? (
          <View style={styles.card}>
            <Text style={styles.resultMain}>{formatNumber(result.rpm, 0)} ot/min</Text>
            <Text style={styles.cardText}>
              {formatNumber(result.hz, 2)} Hz · perioda {formatNumber(1000 / result.hz, 1)} ms · {deltaFrames} snímků
            </Text>
            <Text style={styles.cardText}>
              Přesnost ±{formatNumber(result.errorPct, 1)} % (±1 snímek) – pro vyšší přesnost měř přes víc otáček.
            </Text>

            {mayAlias && candidates.length > 1 && (
              <>
                <Text style={styles.aliasTitle}>
                  ⚠ {MOTOR_PRESETS[motor.type].label} do {motor.maxRpm.toLocaleString('cs-CZ')} ot/min je nad limitem{' '}
                  {formatNumber(cov.nyquistHz * 60, 0)} ot/min. Na videu je zdánlivá rotace{' '}
                  {formatNumber(apparent.hz * 60, 0)} ot/min; skutečné otáčky mohou být:
                </Text>
                <View style={styles.row}>
                  {candidates.map((c, i) => (
                    <Chip
                      key={`${c.k}:${c.sign}`}
                      label={formatNumber(c.rpm, 0)}
                      selected={c === chosen}
                      onPress={() => setCandidateIndex(i)}
                    />
                  ))}
                </View>
                <Text style={styles.cardText}>
                  {motor.nominalRpm
                    ? `Předvybráno podle jmenovitých ${motor.nominalRpm.toLocaleString('cs-CZ')} ot/min.`
                    : 'Vyber podle přibližných otáček (nebo zadej jmenovité otáčky v Nastavení).'}{' '}
                  Ověř změnou fps: skutečná hodnota vyjde stejně při obou frekvencích.
                </Text>
              </>
            )}

            <TextInput
              style={[styles.input, styles.noteInput]}
              value={note}
              onChangeText={setNote}
              placeholder="Poznámka (např. stroj, místo měření)"
              placeholderTextColor={colors.textMuted}
            />
            <Chip label="Uložit výsledek" selected onPress={saveResult} style={styles.topGap} />
          </View>
        ) : (
          <Text style={styles.hint}>Výsledek se zobrazí po nastavení obou značek.</Text>
        )}

        {saved.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Uložené výsledky tohoto záznamu</Text>
            {saved.map((m) => (
              <Text key={m.id} style={styles.savedLine}>
                {m.kind === 'vibration'
                  ? `Vibrace: RMS ${formatNumber(m.rms, 3)} ${m.unit}${m.freqHz ? ` · ${formatNumber(m.freqHz, 1)} Hz` : ''}`
                  : `${formatNumber(m.rpm, 0)} ot/min · ${formatNumber(m.hz, 2)} Hz`}
                {m.note ? ` · ${m.note}` : ''}
              </Text>
            ))}
          </>
        )}
        <Text style={styles.footnote}>
          Výpočty používají {formatNumber(fps, 2)} snímků/s
          {recording.frameCount ? ' (změřeno z metadat videa)' : ''}.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (c: ThemeColors) =>
  ({
    videoArea: { flex: 1, backgroundColor: '#000' },
    video: { flex: 1 },
    touchLayer: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
    roi: { position: 'absolute', borderWidth: 2, borderColor: '#3fa7ff', borderRadius: 3 },
    calPoint: {
      position: 'absolute',
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#ffb020',
      borderWidth: 2,
      borderColor: '#000',
    },
    pickBanner: {
      position: 'absolute',
      top: 10,
      alignSelf: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    pickText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    panel: { flexGrow: 0, maxHeight: '55%' },
    panelContent: { padding: 12, paddingBottom: 32 },
    position: { color: c.text, fontSize: 15, fontVariant: TABULAR_NUMS, marginBottom: 8 },
    bar: { height: 28, borderRadius: 6, backgroundColor: c.surfaceRaised, overflow: 'hidden', justifyContent: 'center' },
    barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: c.accent, opacity: 0.6 },
    mark: { position: 'absolute', top: 0, bottom: 0, width: 3, marginLeft: -1 },
    row: { flexDirection: 'row', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', rowGap: 8 },
    play: { minWidth: 56, alignItems: 'center' },
    sectionTitle: { color: c.text, fontSize: 16, fontWeight: '700', marginTop: 22, marginBottom: 4 },
    hint: { color: c.textMuted, fontSize: 13, marginTop: 6 },
    label: { color: c.text, fontSize: 14, marginRight: 8 },
    small: { color: c.textMuted, fontSize: 12 },
    turns: { color: c.text, fontSize: 16, fontWeight: '700', minWidth: 28, textAlign: 'center', marginRight: 8 },
    card: {
      marginTop: 12,
      padding: 12,
      borderRadius: 10,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardTitle: { color: c.text, fontSize: 14, fontWeight: '700' },
    cardText: { color: c.text, fontSize: 13, marginTop: 4 },
    resultMain: { color: c.accent, fontSize: 26, fontWeight: '800' },
    aliasTitle: { color: c.warning, fontSize: 13, marginTop: 10 },
    input: {
      backgroundColor: c.surfaceRaised,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 10,
      color: c.text,
      fontSize: 14,
      paddingHorizontal: 10,
      paddingVertical: 8,
      minWidth: 130,
      marginRight: 8,
    },
    noteInput: { marginTop: 12, marginRight: 0 },
    topGap: { alignSelf: 'flex-start', marginTop: 10 },
    analyzeButton: { alignSelf: 'flex-start', marginTop: 14 },
    progressTrack: { height: 8, borderRadius: 4, backgroundColor: c.surfaceRaised, marginTop: 10, overflow: 'hidden' },
    progressFill: { height: 8, backgroundColor: c.accent },
    savedLine: { color: c.text, fontSize: 13, marginTop: 4 },
    footnote: { color: c.textMuted, fontSize: 12, marginTop: 16 },
  }) as const;

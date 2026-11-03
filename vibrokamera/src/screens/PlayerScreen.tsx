import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RecordingFile } from '../../modules/high-speed-camera';
import Chip from '../components/Chip';
import { analysisFps, formatNumber, nominalFps } from '../lib/format';
import { colors } from '../lib/theme';

type Props = {
  recording: RecordingFile;
  onBack: () => void;
};

const SPEEDS = [
  { rate: 1, label: '1×' },
  { rate: 1 / 2, label: '1/2' },
  { rate: 1 / 4, label: '1/4' },
  { rate: 1 / 8, label: '1/8' },
  { rate: 1 / 16, label: '1/16' },
  { rate: 1 / 32, label: '1/32' },
];

export default function PlayerScreen({ recording, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const fps = analysisFps(recording);
  const recordedFps = nominalFps(recording) ?? Math.round(fps);

  const [rate, setRate] = useState(1 / 8);
  const [time, setTime] = useState(0);
  const [markA, setMarkA] = useState<number | null>(null);
  const [markB, setMarkB] = useState<number | null>(null);
  const [turns, setTurns] = useState(1);

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

  const duration =
    status === 'readyToPlay' && player.duration > 0 ? player.duration : (recording.durationMs ?? 0) / 1000;
  const totalFrames = recording.frameCount ?? Math.max(1, Math.round(duration * fps));
  const frame = Math.min(totalFrames - 1, Math.max(0, Math.round(time * fps)));

  const seekToFrame = (target: number) => {
    const clamped = Math.min(totalFrames - 1, Math.max(0, target));
    // ExoPlayer při přesném seeku zobrazí první snímek s časem >= cíl.
    const t = Math.max(0, clamped / fps - 0.0005);
    player.pause();
    player.currentTime = t;
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

  // --- měření frekvence mezi dvěma značkami ---
  const deltaFrames = markA !== null && markB !== null ? Math.abs(markB - markA) : 0;
  const measurement =
    deltaFrames > 0
      ? (() => {
          const seconds = deltaFrames / fps;
          const hz = turns / seconds;
          return { seconds, hz, rpm: hz * 60, errorPct: 100 / deltaFrames };
        })()
      : null;

  const progress = totalFrames > 1 ? frame / (totalFrames - 1) : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Chip label="‹ Zpět" onPress={onBack} />
        <Text style={styles.title} numberOfLines={1}>
          {recordedFps} fps · zpomaleno {formatNumber(1 / rate, 0)}×
        </Text>
      </View>

      <View style={styles.videoArea}>
        <VideoView player={player} style={styles.video} nativeControls={false} contentFit="contain" />
      </View>

      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
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
          <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
          {markA !== null && <View style={[styles.mark, styles.markA, { left: `${(markA / Math.max(1, totalFrames - 1)) * 100}%` }]} />}
          {markB !== null && <View style={[styles.mark, styles.markB, { left: `${(markB / Math.max(1, totalFrames - 1)) * 100}%` }]} />}
        </View>

        {/* Krokování */}
        <View style={styles.row}>
          <Chip label="−10" onPress={() => seekToFrame(frame - 10)} />
          <Chip label="◀ 1" onPress={() => seekToFrame(frame - 1)} />
          <Chip label={isPlaying ? '❚❚' : '▶'} selected onPress={togglePlay} style={styles.play} />
          <Chip label="1 ▶" onPress={() => seekToFrame(frame + 1)} />
          <Chip label="+10" onPress={() => seekToFrame(frame + 10)} />
        </View>

        {/* Rychlost */}
        <Text style={styles.sectionTitle}>Rychlost přehrávání</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SPEEDS.map((s) => (
            <Chip key={s.label} label={s.label} selected={Math.abs(s.rate - rate) < 1e-6} onPress={() => changeRate(s.rate)} />
          ))}
        </ScrollView>
        <Text style={styles.hint}>
          Na obrazovce {formatNumber(fps * rate, 1)} snímků/s – 1 s děje trvá {formatNumber(1 / rate, 0)} s.
        </Text>

        {/* Měření */}
        <Text style={styles.sectionTitle}>Měření otáček / frekvence kmitů</Text>
        <Text style={styles.hint}>
          Najeď na snímek, kdy značka na hřídeli projde referenčním bodem → „Značka A“. Pak krokuj
          dál přes jednu nebo více otáček (kmitů) → „Značka B“.
        </Text>
        <View style={styles.row}>
          <Chip label={markA === null ? 'Značka A' : `A: ${markA + 1}`} selected={markA !== null} onPress={() => setMarkA(frame)} />
          <Chip label={markB === null ? 'Značka B' : `B: ${markB + 1}`} selected={markB !== null} onPress={() => setMarkB(frame)} />
          <Chip
            label="Smazat"
            onPress={() => {
              setMarkA(null);
              setMarkB(null);
            }}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Počet otáček/kmitů mezi A a B:</Text>
          <Chip label="−" disabled={turns <= 1} onPress={() => setTurns((t) => Math.max(1, t - 1))} />
          <Text style={styles.turns}>{turns}</Text>
          <Chip label="+" onPress={() => setTurns((t) => t + 1)} />
        </View>
        {measurement ? (
          <View style={styles.result}>
            <Text style={styles.resultMain}>{formatNumber(measurement.rpm, 0)} ot/min</Text>
            <Text style={styles.resultSub}>
              {formatNumber(measurement.hz, 2)} Hz · {deltaFrames} snímků = {formatNumber(measurement.seconds * 1000, 1)} ms
            </Text>
            <Text style={styles.resultSub}>
              Přesnost ±{formatNumber(measurement.errorPct, 1)} % (±1 snímek) – pro vyšší přesnost měř přes víc otáček.
            </Text>
          </View>
        ) : (
          <Text style={styles.hint}>Výsledek se zobrazí po nastavení obou značek.</Text>
        )}
        <Text style={styles.footnote}>
          Výpočet používá {formatNumber(fps, 2)} snímků/s
          {recording.frameCount ? ' (změřeno z metadat videa)' : ''}.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700', flex: 1 },
  videoArea: { flex: 1, backgroundColor: '#000' },
  video: { flex: 1 },
  panel: { flexGrow: 0, maxHeight: '50%' },
  panelContent: { padding: 12 },
  position: { color: colors.text, fontSize: 15, fontVariant: ['tabular-nums'], marginBottom: 8 },
  bar: {
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.accent, opacity: 0.6 },
  mark: { position: 'absolute', top: 0, bottom: 0, width: 3, marginLeft: -1 },
  markA: { backgroundColor: colors.success },
  markB: { backgroundColor: colors.warning },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 10, flexWrap: 'wrap' },
  play: { minWidth: 56, alignItems: 'center' },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 18, marginBottom: 8 },
  hint: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
  label: { color: colors.text, fontSize: 14, marginRight: 8 },
  turns: { color: colors.text, fontSize: 16, fontWeight: '700', minWidth: 28, textAlign: 'center', marginRight: 8 },
  result: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultMain: { color: colors.accent, fontSize: 26, fontWeight: '800' },
  resultSub: { color: colors.text, fontSize: 13, marginTop: 4 },
  footnote: { color: colors.textMuted, fontSize: 12, marginTop: 12 },
});

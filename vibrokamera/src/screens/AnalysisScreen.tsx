import { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';

import { SpectrumChart, TimeChart } from '../components/Charts';
import Chip from '../components/Chip';
import Screen from '../components/Screen';
import { formatNumber } from '../lib/format';
import { useSettings, useStyles } from '../lib/settings';
import { analyze, SHAPE_HINTS, SHAPE_LABELS, velocityRmsEstimate, type Axis } from '../lib/signal';
import { addMeasurement } from '../lib/storage';
import type { ThemeColors } from '../lib/theme';
import type { AnalysisRequest } from './PlayerScreen';

type Props = {
  request: AnalysisRequest;
  onBack: () => void;
};

type ChartMode = 'signal' | 'abs' | 'square';

export default function AnalysisScreen({ request, onBack }: Props) {
  const { settings, colors } = useSettings();
  const styles = useStyles(makeStyles);
  const { track, calibration, recording } = request;
  const motor = settings.motor;

  const [axis, setAxis] = useState<Axis>('main');
  const [chartMode, setChartMode] = useState<ChartMode>('signal');
  const [note, setNote] = useState('');
  const [showTheory, setShowTheory] = useState(false);

  const unit = calibration ? 'mm' : 'px';
  const scale = calibration ? calibration.mmPerPx : 1;

  // Některé telefony zapisují do high-speed videa „zpomalené“ časové značky (např. 30 fps
  // místo 240). Když frekvence z časových značek nesedí s nominální, použijeme nominální.
  const timing = useMemo(() => {
    const n = track.timesMs.length;
    const span = track.timesMs[n - 1] - track.timesMs[0];
    const ptsFps = span > 0 ? ((n - 1) * 1000) / span : 0;
    const nominal = request.fps;
    if (nominal > 0 && (ptsFps <= 0 || Math.abs(ptsFps - nominal) / nominal > 0.15)) {
      return { timesMs: track.timesMs.map((_, i) => (i * 1000) / nominal), corrected: true, ptsFps };
    }
    return { timesMs: track.timesMs, corrected: false, ptsFps };
  }, [track, request.fps]);

  const result = useMemo(
    () => analyze(timing.timesMs, track.dx, track.dy, axis, scale),
    [timing, track, axis, scale]
  );
  const { stats, dominant } = result;

  const digits = unit === 'mm' ? (stats.zeroPeak < 1 ? 3 : 2) : 2;
  const fmt = (v: number) => `${formatNumber(v, digits)} ${unit}`;
  const um = (v: number) => (unit === 'mm' && v < 1 ? ` (${formatNumber(v * 1000, 0)} µm)` : '');

  // Ztráta sledování: posun narazil na hranici hledání.
  const lost = track.dx.some((v, i) => Math.hypot(v, track.dy[i]) > 60) || Math.max(...track.score) > 40;
  const tooFewPeriods = result.periods !== null && result.periods < 10;
  const nominalHz = motor.nominalRpm ? motor.nominalRpm / 60 : null;
  const velocity = calibration && dominant ? velocityRmsEstimate(stats.rms, dominant.hz) : null;

  // Data grafu podle režimu (učebnice: |signál| → AVG, signál² → RMS).
  const chart = useMemo(() => {
    if (chartMode === 'abs') {
      return {
        y: result.y.map(Math.abs),
        symmetric: false,
        unit,
        lines: [
          { value: stats.zeroPeak, label: `0-P ${formatNumber(stats.zeroPeak, digits)}`, color: colors.record, dashed: true },
          { value: stats.avg, label: `AVG ${formatNumber(stats.avg, digits)}`, color: colors.warning },
        ],
      };
    }
    if (chartMode === 'square') {
      const ms = stats.rms ** 2;
      return {
        y: result.y.map((v) => v * v),
        symmetric: false,
        unit: `${unit}²`,
        lines: [{ value: ms, label: `průměr = RMS² → RMS ${formatNumber(stats.rms, digits)}`, color: colors.success }],
      };
    }
    return {
      y: result.y,
      symmetric: true,
      unit,
      lines: [
        { value: stats.zeroPeak, label: '+0-P', color: colors.record, dashed: true },
        { value: -stats.zeroPeak, label: '−0-P', color: colors.record, dashed: true },
        { value: stats.rms, label: 'RMS', color: colors.success },
        { value: stats.avg, label: 'AVG', color: colors.warning },
      ],
    };
  }, [chartMode, result, stats, unit, digits, colors]);

  const save = () => {
    try {
      addMeasurement({
        kind: 'vibration',
        recordingName: recording.name,
        recordingPath: recording.path,
        fps: stats.sampleRate,
        motorType: motor.type,
        maxRpm: motor.maxRpm,
        note: note.trim(),
        unit,
        axis: axis === 'main' ? `hlavní směr ${formatNumber(result.mainAngleDeg, 0)}°` : axis === 'x' ? 'vodorovně' : 'svisle',
        zeroPeak: stats.zeroPeak,
        peakPeak: stats.peakPeak,
        avg: stats.avg,
        rms: stats.rms,
        crest: stats.crest,
        shape: SHAPE_LABELS[stats.shape],
        freqHz: dominant?.hz ?? null,
        rpm: dominant ? dominant.hz * 60 : null,
        velocityRms: velocity,
        durationMs: stats.durationS * 1000,
        samples: stats.n,
      });
      setNote('');
      Alert.alert('Uloženo', 'Výsledek analýzy je ve Výsledcích.');
    } catch (e) {
      Alert.alert('Uložení se nezdařilo', (e as Error).message);
    }
  };

  return (
    <Screen title="Analýza vibrací" onBack={onBack}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.meta}>
          Vzorkovací frekvence {formatNumber(stats.sampleRate, 1)} Hz (Δt = {formatNumber(1000 / stats.sampleRate, 2)} ms) ·{' '}
          {stats.n} vzorků · {formatNumber(stats.durationS, 2)} s · od {formatNumber(request.startMs / 1000, 2)} s videa
        </Text>
        {timing.corrected && (
          <Text style={styles.warning}>
            Časové značky videa odpovídají {formatNumber(timing.ptsFps, 1)} fps místo {formatNumber(request.fps, 1)} fps
            (telefon ukládá zpomalené video) – použita nominální snímková frekvence.
          </Text>
        )}
        {!calibration && (
          <Text style={styles.warning}>Bez kalibrace – hodnoty jsou v pixelech (pro porovnání měření stejného místa).</Text>
        )}
        {lost && (
          <Text style={styles.warning}>
            ⚠ Sledování možná ztratilo bod (velký skok nebo špatná shoda). Zkus větší / kontrastnější oblast.
          </Text>
        )}

        {/* Směr */}
        <View style={styles.row}>
          <Chip label={`Hlavní směr ${formatNumber(result.mainAngleDeg, 0)}°`} selected={axis === 'main'} onPress={() => setAxis('main')} />
          <Chip label="Vodorovně" selected={axis === 'x'} onPress={() => setAxis('x')} />
          <Chip label="Svisle" selected={axis === 'y'} onPress={() => setAxis('y')} />
        </View>

        {/* Časový záznam */}
        <Text style={styles.section}>Časový záznam</Text>
        <View style={styles.row}>
          <Chip label="Signál" selected={chartMode === 'signal'} onPress={() => setChartMode('signal')} />
          <Chip label="|Signál| → AVG" selected={chartMode === 'abs'} onPress={() => setChartMode('abs')} />
          <Chip label="Signál² → RMS" selected={chartMode === 'square'} onPress={() => setChartMode('square')} />
        </View>
        <View style={styles.chartCard}>
          <TimeChart t={result.t} y={chart.y} unit={chart.unit} refLines={chart.lines} symmetric={chart.symmetric} />
        </View>

        {/* Velikost vibrací */}
        <Text style={styles.section}>Velikost vibrací</Text>
        <View style={styles.grid}>
          <Stat label="0-P (špička)" value={fmt(stats.zeroPeak)} extra={um(stats.zeroPeak)} color={colors.record} />
          <Stat label="P-P (špička–špička)" value={fmt(stats.peakPeak)} extra={um(stats.peakPeak)} />
          <Stat label="AVG = Σ|y| / N" value={fmt(stats.avg)} extra={um(stats.avg)} color={colors.warning} />
          <Stat label="RMS = √(Σy² / N)" value={fmt(stats.rms)} extra={um(stats.rms)} color={colors.success} />
        </View>

        {/* Tvar signálu */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tvar signálu: {SHAPE_LABELS[stats.shape]}</Text>
          <Text style={styles.cardText}>
            AVG / 0-P = {formatNumber(stats.avgRatio, 2)} (sinus 0,64) · RMS / 0-P = {formatNumber(stats.rmsRatio, 2)} (sinus
            0,71) · crest 0-P / RMS = {formatNumber(stats.crest, 2)} (sinus 1,41)
          </Text>
          <Text style={styles.cardMuted}>{SHAPE_HINTS[stats.shape]}</Text>
        </View>

        {/* Frekvence */}
        <Text style={styles.section}>Frekvence</Text>
        {dominant ? (
          <View style={styles.card}>
            <Text style={styles.big}>{formatNumber(dominant.hz, 2)} Hz</Text>
            <Text style={styles.cardText}>
              Perioda {formatNumber(1000 / dominant.hz, 1)} ms · odpovídá {formatNumber(dominant.hz * 60, 0)} ot/min ·{' '}
              {formatNumber(result.periods ?? 0, 0)} period v záznamu
            </Text>
            {nominalHz && (
              <Text style={styles.cardText}>
                = {formatNumber(dominant.hz / nominalHz, 2)}× jmenovité otáčkové frekvence ({formatNumber(nominalHz, 2)} Hz)
              </Text>
            )}
            {velocity !== null && (
              <Text style={styles.cardText}>
                Rychlost vibrací v RMS ≈ 2π·f·x RMS = {formatNumber(velocity, 2)} mm/s (odhad pro sinusový průběh)
              </Text>
            )}
            {tooFewPeriods && (
              <Text style={styles.warning}>
                Záznam obsahuje méně než 10 period – AVG a RMS nemusí být stabilní. Zvol delší úsek.
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.cardMuted}>Ve spektru není výrazná periodická složka.</Text>
        )}

        <View style={styles.chartCard}>
          <SpectrumChart
            freqs={result.spectrum.freqs}
            amps={result.spectrum.amps}
            maxHz={stats.sampleRate / 2}
            peaks={result.peaks}
            markers={nominalHz ? [{ hz: nominalHz, label: '1×' }, { hz: 2 * nominalHz, label: '2×' }] : []}
          />
          <Text style={styles.cardMuted}>
            Spektrum (amplituda 0-P, {unit}) do {formatNumber(stats.sampleRate / 2, 0)} Hz = polovina vzorkovací frekvence.
          </Text>
        </View>
        {result.peaks.length > 1 && (
          <Text style={styles.cardMuted}>
            Další složky:{' '}
            {result.peaks
              .slice(1, 4)
              .map((p) => `${formatNumber(p.hz, 1)} Hz (${formatNumber(p.amp, digits)} ${unit})`)
              .join(', ')}
          </Text>
        )}

        {/* Uložení */}
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="Poznámka (stroj, ložisko, směr…)"
          placeholderTextColor={colors.textMuted}
        />
        <Chip label="Uložit výsledek" selected onPress={save} style={styles.saveButton} />

        {/* Teorie */}
        <Chip
          label={showTheory ? 'Skrýt vysvětlení' : 'Co znamenají hodnoty?'}
          onPress={() => setShowTheory((s) => !s)}
          style={styles.saveButton}
        />
        {showTheory && (
          <View style={styles.card}>
            <Text style={styles.cardText}>
              • Časový záznam – výchylka sledovaného bodu v čase, vzorkovaná fps snímků za sekundu.{'\n'}• 0-P (špičková
              hodnota) – vzdálenost od střední hodnoty (klidové polohy) do maxima.{'\n'}• P-P – vzdálenost mezi maximem a
              minimem; u symetrického signálu = 2 × 0-P.{'\n'}• AVG – průměr absolutních hodnot vzorků; u sinusu 0,64 × 0-P.
              {'\n'}• RMS (efektivní hodnota) – odmocnina z průměru druhých mocnin, odpovídá energii vibrací; u sinusu 0,71 ×
              0-P. AVG ani RMS nezávisí na délce záznamu.{'\n'}• Frekvence – počet period za sekundu; perioda = 1 / f.{'\n'}•
              Přepočty 0,64 a 0,71 platí jen pro sinus – u rázů je špička mnohem větší než RMS.
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value, extra, color }: { label: string; value: string; extra?: string; color?: string }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.stat}>
      <View style={styles.statInner}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
        {extra ? <Text style={styles.statExtra}>{extra}</Text> : null}
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  ({
    content: { padding: 12, paddingTop: 0, paddingBottom: 40 },
    meta: { color: c.textMuted, fontSize: 12 },
    warning: { color: c.warning, fontSize: 13, marginTop: 6 },
    row: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginTop: 10 },
    section: { color: c.text, fontSize: 16, fontWeight: '700', marginTop: 20 },
    chartCard: {
      marginTop: 10,
      padding: 8,
      borderRadius: 10,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginHorizontal: -4 },
    stat: {
      width: '50%',
      padding: 4,
    },
    statInner: { backgroundColor: c.surface, borderRadius: 10, borderWidth: 1, borderColor: c.border, padding: 10 },
    statLabel: { color: c.textMuted, fontSize: 12 },
    statValue: { color: c.text, fontSize: 20, fontWeight: '800', marginTop: 2 },
    statExtra: { color: c.textMuted, fontSize: 12 },
    card: {
      marginTop: 10,
      padding: 12,
      borderRadius: 10,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardTitle: { color: c.text, fontSize: 15, fontWeight: '700' },
    cardText: { color: c.text, fontSize: 13, marginTop: 4, lineHeight: 19 },
    cardMuted: { color: c.textMuted, fontSize: 12, marginTop: 6 },
    big: { color: c.accent, fontSize: 26, fontWeight: '800' },
    input: {
      marginTop: 18,
      backgroundColor: c.surfaceRaised,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 10,
      color: c.text,
      fontSize: 14,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    saveButton: { alignSelf: 'flex-start', marginTop: 10 },
  }) as const;

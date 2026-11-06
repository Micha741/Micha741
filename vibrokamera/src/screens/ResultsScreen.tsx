import { useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';

import HighSpeedCamera from '../../modules/high-speed-camera';
import Chip from '../components/Chip';
import Screen from '../components/Screen';
import { formatDate, formatNumber } from '../lib/format';
import { MOTOR_PRESETS } from '../lib/motor';
import { useStyles } from '../lib/settings';
import {
  deleteMeasurement,
  DIRECTION_LABELS,
  loadMeasurements,
  measurementsToCsv,
  VIEW_LABELS,
  type Measurement,
} from '../lib/storage';
import type { ThemeColors } from '../lib/theme';

type Props = { onBack: () => void };

function fmtAmp(v: number, unit: string) {
  return `${formatNumber(v, unit === 'mm' ? (v < 1 ? 3 : 2) : 2)} ${unit}`;
}

export default function ResultsScreen({ onBack }: Props) {
  const styles = useStyles(makeStyles);
  const [items, setItems] = useState<Measurement[]>(() => loadMeasurements());

  const remove = (item: Measurement) => {
    Alert.alert('Smazat výsledek?', formatDate(item.createdAt), [
      { text: 'Zrušit', style: 'cancel' },
      {
        text: 'Smazat',
        style: 'destructive',
        onPress: () => {
          deleteMeasurement(item.id);
          setItems(loadMeasurements());
        },
      },
    ]);
  };

  const exportCsv = async () => {
    if (items.length === 0) return;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
    try {
      const path = await HighSpeedCamera.exportTextAsync(`vysledky_${stamp}.csv`, measurementsToCsv(items), 'text/csv');
      Alert.alert('Exportováno', `Soubor je v ${path}`);
    } catch (e) {
      Alert.alert('Export se nezdařil', (e as Error).message);
    }
  };

  return (
    <Screen
      title="Výsledky"
      onBack={onBack}
      right={<Chip label="Export CSV" selected disabled={items.length === 0} onPress={exportCsv} style={styles.noMargin} />}
    >
      <FlatList
        data={items}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Zatím žádné uložené výsledky. Otevři záznam, změř otáčky nebo spusť analýzu vibrací a dej
            „Uložit výsledek“.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.kind === 'vibration' ? (
              <>
                <Text style={styles.kind}>Vibrace · {item.axis}</Text>
                <View style={styles.cardTop}>
                  <Text style={styles.main}>RMS {fmtAmp(item.rms, item.unit)}</Text>
                  <Text style={styles.side}>{item.freqHz ? `${formatNumber(item.freqHz, 2)} Hz` : ''}</Text>
                </View>
                <Text style={styles.meta}>
                  0-P {fmtAmp(item.zeroPeak, item.unit)} · P-P {fmtAmp(item.peakPeak, item.unit)} · AVG{' '}
                  {fmtAmp(item.avg, item.unit)} · crest {formatNumber(item.crest, 2)}
                </Text>
                <Text style={styles.meta}>
                  Tvar: {item.shape}
                  {item.rpm ? ` · ${formatNumber(item.rpm, 0)} ot/min` : ''}
                  {item.velocityRms != null ? ` · v ≈ ${formatNumber(item.velocityRms, 2)} mm/s RMS` : ''}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.kind}>Otáčky</Text>
                <View style={styles.cardTop}>
                  <Text style={styles.main}>{formatNumber(item.rpm, 0)} ot/min</Text>
                  <Text style={styles.side}>{formatNumber(item.hz, 2)} Hz</Text>
                </View>
                <Text style={styles.meta}>
                  {item.turns}× otáčka, snímky {item.frameA + 1}–{item.frameB + 1} · ±{formatNumber(item.errorPct, 1)} %
                  {item.aliased ? ' · stroboskopicky' : ''}
                </Text>
                {item.direction && (
                  <Text style={styles.meta}>
                    Směr: {DIRECTION_LABELS[item.direction]}
                    {item.viewFrom ? `, pohled ${VIEW_LABELS[item.viewFrom]}` : ''}
                  </Text>
                )}
              </>
            )}
            {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
            <Text style={styles.meta}>
              {formatDate(item.createdAt)} · {MOTOR_PRESETS[item.motorType]?.label ?? item.motorType} ·{' '}
              {formatNumber(item.fps, 1)} fps
            </Text>
            <Text style={styles.file} numberOfLines={1}>
              {item.recordingName}
            </Text>
            <Chip label="Smazat" onPress={() => remove(item)} style={styles.delete} />
          </View>
        )}
      />
    </Screen>
  );
}

const makeStyles = (c: ThemeColors) =>
  ({
    noMargin: { marginRight: 0 },
    list: { padding: 12, paddingTop: 0 },
    empty: { color: c.textMuted, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    kind: { color: c.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    cardTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 2 },
    main: { color: c.accent, fontSize: 22, fontWeight: '800' },
    side: { color: c.text, fontSize: 15 },
    note: { color: c.text, fontSize: 14, marginTop: 4 },
    meta: { color: c.textMuted, fontSize: 13, marginTop: 3 },
    file: { color: c.textMuted, fontSize: 11, marginTop: 3 },
    delete: { alignSelf: 'flex-start', marginTop: 10 },
  }) as const;

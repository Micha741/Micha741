import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HighSpeedCamera from '../../modules/high-speed-camera';
import Chip from '../components/Chip';
import { formatDate, formatNumber } from '../lib/format';
import { MOTOR_PRESETS } from '../lib/motor';
import { deleteMeasurement, loadMeasurements, measurementsToCsv, type Measurement } from '../lib/storage';
import { colors } from '../lib/theme';

type Props = { onBack: () => void };

export default function ResultsScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Measurement[]>(() => loadMeasurements());

  const remove = (item: Measurement) => {
    Alert.alert('Smazat výsledek?', `${formatNumber(item.rpm, 0)} ot/min`, [
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
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Chip label="‹ Zpět" onPress={onBack} />
        <Text style={styles.title}>Výsledky</Text>
        <View style={styles.spacer} />
        <Chip label="Export CSV" selected disabled={items.length === 0} onPress={exportCsv} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Zatím žádné uložené výsledky. Změř otáčky v přehrávači a stiskni „Uložit výsledek“.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.rpm}>{formatNumber(item.rpm, 0)} ot/min</Text>
              <Text style={styles.hz}>{formatNumber(item.hz, 2)} Hz</Text>
            </View>
            {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
            <Text style={styles.meta}>
              {formatDate(item.createdAt)} · {MOTOR_PRESETS[item.motorType]?.label ?? item.motorType}
            </Text>
            <Text style={styles.meta}>
              {item.turns}× otáčka, snímky {item.frameA + 1}–{item.frameB + 1} při {formatNumber(item.fps, 1)} fps · ±
              {formatNumber(item.errorPct, 1)} %{item.aliased ? ' · stroboskopicky' : ''}
            </Text>
            <Text style={styles.file} numberOfLines={1}>{item.recordingName}</Text>
            <Chip label="Smazat" onPress={() => remove(item)} style={styles.delete} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', marginLeft: 4 },
  spacer: { flex: 1 },
  list: { padding: 12, paddingTop: 0 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  rpm: { color: colors.accent, fontSize: 22, fontWeight: '800' },
  hz: { color: colors.text, fontSize: 15 },
  note: { color: colors.text, fontSize: 14, marginTop: 4 },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 3 },
  file: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  delete: { alignSelf: 'flex-start', marginTop: 10 },
});

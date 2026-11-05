import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HighSpeedCamera, { type StorageInfo } from '../../modules/high-speed-camera';
import Chip from '../components/Chip';
import { formatBytes } from '../lib/format';
import { coverage, MOTOR_PRESETS, type MotorType } from '../lib/motor';
import { useSettings } from '../lib/settings';
import { loadMeasurements, measurementsLocation } from '../lib/storage';
import { colors } from '../lib/theme';

type Props = {
  onBack: () => void;
  onOpenResults: () => void;
};

const FPS_TABLE = [30, 60, 120, 240, 480];

function parseRpm(text: string): number | null {
  const value = Number(text.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

export default function SettingsScreen({ onBack, onOpenResults }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, update } = useSettings();
  const motor = settings.motor;

  const [maxText, setMaxText] = useState(String(motor.maxRpm));
  const [nominalText, setNominalText] = useState(motor.nominalRpm ? String(motor.nominalRpm) : '');
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const measurementCount = loadMeasurements().length;

  useEffect(() => {
    HighSpeedCamera.getStorageInfoAsync().then(setStorage).catch(() => setStorage(null));
  }, []);

  const selectType = (type: MotorType) => {
    const maxRpm = MOTOR_PRESETS[type].maxRpm;
    setMaxText(String(maxRpm));
    update({ ...settings, motor: { ...motor, type, maxRpm } });
  };

  const commitMax = () => {
    const value = parseRpm(maxText);
    if (value) update({ ...settings, motor: { ...motor, maxRpm: value } });
    else setMaxText(String(motor.maxRpm));
  };

  const commitNominal = () => {
    const value = parseRpm(nominalText);
    update({ ...settings, motor: { ...motor, nominalRpm: value } });
    setNominalText(value ? String(value) : '');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Chip label="‹ Kamera" onPress={onBack} />
        <Text style={styles.title}>Nastavení</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Typ motoru */}
        <Text style={styles.section}>Typ motoru</Text>
        <View style={styles.row}>
          {(Object.keys(MOTOR_PRESETS) as MotorType[]).map((type) => (
            <Chip key={type} label={MOTOR_PRESETS[type].label} selected={motor.type === type} onPress={() => selectType(type)} />
          ))}
        </View>
        <Text style={styles.hint}>{MOTOR_PRESETS[motor.type].hint}</Text>

        <Text style={styles.label}>Max. otáčky [ot/min]</Text>
        <TextInput
          style={styles.input}
          value={maxText}
          onChangeText={setMaxText}
          onEndEditing={commitMax}
          keyboardType="number-pad"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Jmenovité otáčky ze štítku [ot/min] – nepovinné</Text>
        <TextInput
          style={styles.input}
          value={nominalText}
          onChangeText={setNominalText}
          onEndEditing={commitNominal}
          keyboardType="number-pad"
          placeholder="např. 2 850"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.hint}>
          Když jsou otáčky nad limitem kamery, aplikace podle nich vybere nejpravděpodobnější výsledek.
        </Text>

        {/* Tabulka pokrytí */}
        <Text style={styles.section}>Stačí kamera na {motor.maxRpm.toLocaleString('cs-CZ')} ot/min?</Text>
        <View style={styles.table}>
          {FPS_TABLE.map((fps) => {
            const c = coverage(fps, motor);
            const color = c.level === 'good' ? colors.success : c.level === 'ok' ? colors.warning : colors.record;
            return (
              <View key={fps} style={styles.tableRow}>
                <Text style={styles.tableFps}>{fps} fps</Text>
                <Text style={[styles.tableValue, { color }]}>
                  {c.framesPerRev.toFixed(1)} sn./ot.
                </Text>
                <Text style={styles.tableNote}>
                  {c.level === 'good' ? 'výborné' : c.level === 'ok' ? 'použitelné' : 'stroboskopicky'}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.hint}>
          Pro plynulé sledování je potřeba ≥ 8 snímků na otáčku, minimum jsou 2. Pod tím se rotace
          zobrazí stroboskopicky – i tak jde změřit, když znáš přibližné otáčky.
        </Text>

        {/* Úložiště */}
        <Text style={styles.section}>Úložiště</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Videa</Text>
          <Text style={styles.cardText}>
            {storage
              ? `${storage.recordingsCount} záznamů · ${formatBytes(storage.recordingsBytes)} · volno ${formatBytes(storage.freeBytes)}`
              : '–'}
          </Text>
          <Text style={styles.path} selectable>
            {storage?.recordingsDir ?? ''}
          </Text>
          <Text style={styles.cardTitle}>Výsledky měření</Text>
          <Text style={styles.cardText}>{measurementCount} uložených měření</Text>
          <Text style={styles.path} selectable>
            {measurementsLocation()}
          </Text>
          <Text style={styles.warningText}>
            Obojí je v úložišti aplikace a při odinstalaci se smaže. Videa si zálohuj tlačítkem
            „Do galerie“ (Filmy/VibroKamera), výsledky exportem CSV (Stažené/VibroKamera).
          </Text>
          <Chip label="Zobrazit výsledky" selected onPress={onOpenResults} style={styles.cardButton} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', marginLeft: 4 },
  content: { padding: 16, paddingTop: 0, paddingBottom: 40 },
  section: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  hint: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
  label: { color: colors.text, fontSize: 14, marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.text,
    fontSize: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  table: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tableFps: { color: colors.text, fontSize: 14, width: 70, fontWeight: '600' },
  tableValue: { fontSize: 14, width: 100, fontWeight: '700' },
  tableNote: { color: colors.textMuted, fontSize: 13, flex: 1 },
  card: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 12 },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 6 },
  cardText: { color: colors.text, fontSize: 13, marginTop: 2 },
  path: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  warningText: { color: colors.warning, fontSize: 13, marginTop: 10 },
  cardButton: { alignSelf: 'flex-start', marginTop: 12 },
});

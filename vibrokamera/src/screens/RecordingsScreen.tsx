import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';

import HighSpeedCamera, { type RecordingFile } from '../../modules/high-speed-camera';
import Chip from '../components/Chip';
import Screen from '../components/Screen';
import { formatBytes, formatDate, formatDuration, formatNumber, measuredFps, nominalFps } from '../lib/format';
import { useSettings, useStyles } from '../lib/settings';
import { deleteMeasurementsForRecording } from '../lib/storage';
import type { ThemeColors } from '../lib/theme';

type Props = {
  onBack: () => void;
  onOpen: (recording: RecordingFile) => void;
};

export default function RecordingsScreen({ onBack, onOpen }: Props) {
  const { colors } = useSettings();
  const styles = useStyles(makeStyles);
  const [items, setItems] = useState<RecordingFile[] | null>(null);

  const reload = useCallback(() => {
    HighSpeedCamera.listRecordingsAsync()
      .then(setItems)
      .catch((e: Error) => {
        setItems([]);
        Alert.alert('Záznamy', e.message);
      });
  }, []);

  useEffect(reload, [reload]);

  const remove = (item: RecordingFile) => {
    Alert.alert('Smazat záznam?', `${item.name}\n\nSmažou se i výsledky měření z tohoto videa.`, [
      { text: 'Zrušit', style: 'cancel' },
      {
        text: 'Smazat',
        style: 'destructive',
        onPress: async () => {
          const deleted = await HighSpeedCamera.deleteRecordingAsync(item.path).catch(() => false);
          if (deleted) {
            try {
              deleteMeasurementsForRecording(item.path);
            } catch {
              // Výsledky zůstanou – nevadí.
            }
          }
          reload();
        },
      },
    ]);
  };

  const saveToGallery = async (item: RecordingFile) => {
    try {
      await HighSpeedCamera.saveToGalleryAsync(item.path);
      Alert.alert('Uloženo', 'Video je v galerii ve složce Filmy/VibroKamera.');
    } catch (e) {
      Alert.alert('Uložení se nezdařilo', (e as Error).message);
    }
  };

  return (
    <Screen title="Záznamy" onBack={onBack} backLabel="‹ Kamera">
      {items === null ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.path}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Zatím žádné záznamy.</Text>}
          renderItem={({ item }) => {
            const nominal = nominalFps(item);
            const measured = measuredFps(item);
            return (
              <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={() => onOpen(item)}>
                <Text style={styles.cardTitle}>{formatDate(item.modified)}</Text>
                <Text style={styles.cardLine}>
                  {nominal ? `${nominal} fps` : '? fps'}
                  {item.width && item.height ? ` · ${item.width}×${item.height}` : ''}
                  {item.durationMs ? ` · ${formatDuration(item.durationMs)}` : ''}
                  {` · ${formatBytes(item.sizeBytes)}`}
                </Text>
                {measured !== null && (
                  <Text style={styles.cardMuted}>
                    Skutečně {formatNumber(measured, 1)} fps ({item.frameCount} snímků)
                  </Text>
                )}
                <View style={styles.actions}>
                  <Chip label="Přehrát / analyzovat" selected onPress={() => onOpen(item)} />
                  <Chip label="Do galerie" onPress={() => saveToGallery(item)} />
                  <Chip label="Smazat" onPress={() => remove(item)} />
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

const makeStyles = (c: ThemeColors) =>
  ({
    loader: { marginTop: 40 },
    list: { padding: 12, paddingTop: 0 },
    empty: { color: c.textMuted, textAlign: 'center', marginTop: 40 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    pressed: { opacity: 0.8 },
    cardTitle: { color: c.text, fontSize: 16, fontWeight: '600' },
    cardLine: { color: c.text, fontSize: 14, marginTop: 4 },
    cardMuted: { color: c.textMuted, fontSize: 13, marginTop: 2 },
    actions: { flexDirection: 'row', marginTop: 10, flexWrap: 'wrap', rowGap: 8 },
  }) as const;

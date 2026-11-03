import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HighSpeedCamera, { type RecordingFile } from '../../modules/high-speed-camera';
import Chip from '../components/Chip';
import { formatBytes, formatDate, formatDuration, formatNumber, measuredFps, nominalFps } from '../lib/format';
import { colors } from '../lib/theme';

type Props = {
  onBack: () => void;
  onOpen: (recording: RecordingFile) => void;
};

export default function RecordingsScreen({ onBack, onOpen }: Props) {
  const insets = useSafeAreaInsets();
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
    Alert.alert('Smazat záznam?', item.name, [
      { text: 'Zrušit', style: 'cancel' },
      {
        text: 'Smazat',
        style: 'destructive',
        onPress: async () => {
          await HighSpeedCamera.deleteRecordingAsync(item.path).catch(() => false);
          reload();
        },
      },
    ]);
  };

  const saveToGallery = async (item: RecordingFile) => {
    try {
      await HighSpeedCamera.saveToGalleryAsync(item.path);
      Alert.alert('Uloženo', 'Video je v galerii ve složce Movies/VibroKamera.');
    } catch (e) {
      Alert.alert('Uložení se nezdařilo', (e as Error).message);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Chip label="‹ Kamera" onPress={onBack} />
        <Text style={styles.title}>Záznamy</Text>
      </View>

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
                  <Chip label="Přehrát" selected onPress={() => onOpen(item)} />
                  <Chip label="Do galerie" onPress={() => saveToGallery(item)} />
                  <Chip label="Smazat" onPress={() => remove(item)} />
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', marginLeft: 4 },
  loader: { marginTop: 40 },
  list: { padding: 12, paddingTop: 0 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.8 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  cardLine: { color: colors.text, fontSize: 14, marginTop: 4 },
  cardMuted: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  actions: { flexDirection: 'row', marginTop: 10 },
});

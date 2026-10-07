import { useCallback, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { getCircuitProject, matchPartAgainstInventory } from '../db/circuitRepository';
import { listComponents } from '../db/componentRepository';
import type { CircuitProject } from '../types/circuit';
import type { ElectronicComponent } from '../types/component';
import { CIRCUIT_IMAGES } from '../assets/circuitImages';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';

type Props = NativeStackScreenProps<RootStackParamList, 'CircuitDetail'>;

export default function CircuitDetailScreen({ route, navigation }: Props) {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { id } = route.params;
  const [item, setItem] = useState<CircuitProject | null>(null);
  const [inventory, setInventory] = useState<ElectronicComponent[]>([]);
  const [fullscreenImage, setFullscreenImage] = useState<'schematic' | 'pcb' | null>(null);

  useFocusEffect(
    useCallback(() => {
      getCircuitProject(db, id).then(setItem);
      listComponents(db).then(setInventory);
    }, [db, id])
  );

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('circuit.notFound')}</Text>
      </View>
    );
  }

  const image = item.image ? CIRCUIT_IMAGES[item.image] : null;
  const pcbImage = item.pcbImage ? CIRCUIT_IMAGES[item.pcbImage] : null;
  const fullscreenSource =
    fullscreenImage === 'schematic' ? image : fullscreenImage === 'pcb' ? pcbImage : null;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: colors.text }]}>{item.name}</Text>
      {item.description ? (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {item.description}
        </Text>
      ) : null}

      {image ? (
        <Pressable onPress={() => setFullscreenImage('schematic')}>
          <Image source={image} style={[styles.schematic, { backgroundColor: colors.surface }]} resizeMode="contain" />
          <Text style={[styles.schematicHint, { color: colors.textSecondary }]}>
            {t('detail.schematicTapToZoom')}
          </Text>
        </Pressable>
      ) : null}

      {pcbImage ? (
        <Pressable onPress={() => setFullscreenImage('pcb')}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('circuit.pcbTitle')}
          </Text>
          <Image source={pcbImage} style={[styles.schematic, { backgroundColor: colors.surface }]} resizeMode="contain" />
          <Text style={[styles.schematicHint, { color: colors.textSecondary }]}>
            {t('detail.schematicTapToZoom')}
          </Text>
        </Pressable>
      ) : null}

      {fullscreenSource ? (
        <Modal
          visible={fullscreenImage !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setFullscreenImage(null)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setFullscreenImage(null)}>
            <Image source={fullscreenSource} style={styles.modalImage} resizeMode="contain" />
          </Pressable>
        </Modal>
      ) : null}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t('circuit.partsTitle')}
      </Text>

      {item.parts.map((part, index) => {
        const { matches, totalInStock } = matchPartAgainstInventory(part, inventory);
        const have = totalInStock >= part.quantity;
        return (
          <View key={index} style={[styles.partRow, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.partLabel, { color: colors.text }]}>
                {part.label} × {part.quantity}
              </Text>
              {matches.length > 0 ? (
                <View style={styles.partMatchRow}>
                  {matches.map((m, i) => (
                    <Pressable
                      key={m.id}
                      onPress={() => navigation.navigate('ComponentDetail', { id: m.id })}
                      hitSlop={4}
                    >
                      <Text style={[styles.partMatch, { color: colors.primary }]}>
                        {m.name}
                        {i < matches.length - 1 ? ', ' : ''}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
            <Text
              style={[
                styles.partStatus,
                { color: have ? colors.success : colors.danger },
              ]}
            >
              {have ? t('circuit.have', { count: totalInStock }) : t('circuit.missing')}
            </Text>
          </View>
        );
      })}

      {item.notes ? (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('detail.notes')}</Text>
          <Text style={[styles.notes, { color: colors.textSecondary }]}>{item.notes}</Text>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700' },
  description: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  schematic: { width: '100%', height: 220, marginTop: 16, borderRadius: 8 },
  schematicHint: { fontSize: 11, textAlign: 'center', marginTop: 4 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: { width: '100%', height: '100%' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 8 },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  partLabel: { fontSize: 15, fontWeight: '600' },
  partMatchRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  partMatch: { fontSize: 12, textDecorationLine: 'underline' },
  partStatus: { fontSize: 13, fontWeight: '600', marginLeft: 8 },
  notes: { fontSize: 13, lineHeight: 19 },
  empty: { textAlign: 'center', marginTop: 40 },
});

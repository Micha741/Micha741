import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { deleteComponent, getComponent } from '../db/componentRepository';
import type { ElectronicComponent } from '../types/component';
import { SCHEMATIC_IMAGES } from '../assets/schematicImages';
import { useTheme, type ThemeColors } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ComponentDetail'>;

function Field({
  label,
  value,
  colors,
}: {
  label: string;
  value: string | number | null;
  colors: ThemeColors;
}) {
  if (value === null || value === '') return null;
  return (
    <View style={[styles.field, { borderBottomColor: colors.border }]}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

export default function ComponentDetailScreen({ route, navigation }: Props) {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { id } = route.params;
  const [item, setItem] = useState<ElectronicComponent | null>(null);
  const [schematicFullscreen, setSchematicFullscreen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getComponent(db, id).then(setItem);
    }, [db, id])
  );

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('detail.notFound')}</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(t('detail.deleteTitle'), t('detail.deleteConfirm', { name: item.name }), [
      { text: t('list.library.cancel'), style: 'cancel' },
      {
        text: t('detail.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteComponent(db, item.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.category, { color: colors.primary }]}>{item.category}</Text>

      <Field label={t('detail.manufacturer')} value={item.manufacturer} colors={colors} />
      <Field label={t('detail.packageType')} value={item.packageType} colors={colors} />
      <Field label={t('detail.value')} value={item.value} colors={colors} />
      <Field label={t('detail.quantity')} value={item.quantity} colors={colors} />
      <Field label={t('detail.location')} value={item.location} colors={colors} />
      <Field label={t('detail.tags')} value={item.tags} colors={colors} />

      {item.schematicImage && SCHEMATIC_IMAGES[item.schematicImage] ? (
        <View style={[styles.field, { borderBottomColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            {t('detail.schematic')}
          </Text>
          <Pressable onPress={() => setSchematicFullscreen(true)}>
            <Image
              source={SCHEMATIC_IMAGES[item.schematicImage]}
              style={[styles.schematic, { backgroundColor: colors.surface }]}
              resizeMode="contain"
            />
            <Text style={[styles.schematicHint, { color: colors.textSecondary }]}>
              {t('detail.schematicTapToZoom')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Modal
        visible={schematicFullscreen}
        transparent
        animationType="fade"
        onRequestClose={() => setSchematicFullscreen(false)}
      >
        <Pressable
          style={styles.schematicModalBackdrop}
          onPress={() => setSchematicFullscreen(false)}
        >
          {item.schematicImage && SCHEMATIC_IMAGES[item.schematicImage] ? (
            <Image
              source={SCHEMATIC_IMAGES[item.schematicImage]}
              style={styles.schematicModalImage}
              resizeMode="contain"
            />
          ) : null}
        </Pressable>
      </Modal>

      {item.datasheetUrl ? (
        <Pressable
          style={[styles.field, { borderBottomColor: colors.border }]}
          onPress={() => {
            Linking.openURL(item.datasheetUrl!).catch(() => {
              Alert.alert(t('detail.datasheet'), t('detail.datasheetOpenFailed'));
            });
          }}
        >
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            {t('detail.datasheet')}
          </Text>
          <Text style={[styles.fieldValue, styles.link, { color: colors.primary }]} numberOfLines={2}>
            {item.datasheetUrl}
          </Text>
        </Pressable>
      ) : null}

      <Field label={t('detail.notes')} value={item.notes} colors={colors} />

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('ComponentForm', { id: item.id })}
        >
          <Text style={styles.buttonText}>{t('detail.edit')}</Text>
        </Pressable>
        <Pressable style={[styles.button, { backgroundColor: colors.danger }]} onPress={handleDelete}>
          <Text style={styles.buttonText}>{t('detail.delete')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  category: { fontSize: 14, marginTop: 4, marginBottom: 16 },
  field: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldLabel: { fontSize: 12, textTransform: 'uppercase' },
  fieldValue: { fontSize: 16, marginTop: 2 },
  schematic: {
    width: '100%',
    height: 260,
    marginTop: 8,
    borderRadius: 8,
  },
  schematicHint: { fontSize: 11, textAlign: 'center', marginTop: 4 },
  schematicModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  schematicModalImage: { width: '100%', height: '100%' },
  link: { textDecorationLine: 'underline' },
  actions: { flexDirection: 'row', marginTop: 24, gap: 12 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  empty: { textAlign: 'center', marginTop: 40 },
});

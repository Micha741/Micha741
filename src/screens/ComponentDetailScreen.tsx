import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
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

type Props = NativeStackScreenProps<RootStackParamList, 'ComponentDetail'>;

function Field({ label, value }: { label: string; value: string | number | null }) {
  if (value === null || value === '') return null;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export default function ComponentDetailScreen({ route, navigation }: Props) {
  const db = useSQLiteContext();
  const { id } = route.params;
  const [item, setItem] = useState<ElectronicComponent | null>(null);

  useFocusEffect(
    useCallback(() => {
      getComponent(db, id).then(setItem);
    }, [db, id])
  );

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Součástka nenalezena.</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Smazat součástku', `Opravdu smazat „${item.name}“?`, [
      { text: 'Zrušit', style: 'cancel' },
      {
        text: 'Smazat',
        style: 'destructive',
        onPress: async () => {
          await deleteComponent(db, item.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.category}>{item.category}</Text>

      <Field label="Výrobce" value={item.manufacturer} />
      <Field label="Pouzdro" value={item.packageType} />
      <Field label="Hodnota" value={item.value} />
      <Field label="Skladem (ks)" value={item.quantity} />
      <Field label="Umístění" value={item.location} />
      <Field label="Tagy" value={item.tags} />

      {item.schematicImage && SCHEMATIC_IMAGES[item.schematicImage] ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Schéma zapojení</Text>
          <Image
            source={SCHEMATIC_IMAGES[item.schematicImage]}
            style={styles.schematic}
            resizeMode="contain"
          />
        </View>
      ) : null}

      {item.datasheetUrl ? (
        <Pressable style={styles.field} onPress={() => Linking.openURL(item.datasheetUrl!)}>
          <Text style={styles.fieldLabel}>Datasheet</Text>
          <Text style={[styles.fieldValue, styles.link]} numberOfLines={2}>
            {item.datasheetUrl}
          </Text>
        </Pressable>
      ) : null}

      <Field label="Poznámky" value={item.notes} />

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.editButton]}
          onPress={() => navigation.navigate('ComponentForm', { id: item.id })}
        >
          <Text style={styles.buttonText}>Upravit</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
          <Text style={styles.buttonText}>Smazat</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111' },
  category: { fontSize: 14, color: '#2f6fed', marginTop: 4, marginBottom: 16 },
  field: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  fieldLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase' },
  fieldValue: { fontSize: 16, color: '#111', marginTop: 2 },
  schematic: {
    width: '100%',
    height: 260,
    marginTop: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  link: { color: '#2f6fed', textDecorationLine: 'underline' },
  actions: { flexDirection: 'row', marginTop: 24, gap: 12 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  editButton: { backgroundColor: '#2f6fed' },
  deleteButton: { backgroundColor: '#e05252' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
});

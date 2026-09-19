import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { createComponent, getComponent, updateComponent } from '../db/componentRepository';
import { COMPONENT_CATEGORIES, type ComponentCategory } from '../types/component';

type Props = NativeStackScreenProps<RootStackParamList, 'ComponentForm'>;

function nullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default function ComponentFormScreen({ route, navigation }: Props) {
  const db = useSQLiteContext();
  const editingId = route.params?.id;
  const prefill = route.params?.prefill;

  const [name, setName] = useState(prefill?.name ?? '');
  const [category, setCategory] = useState<ComponentCategory>(
    (prefill?.category as ComponentCategory) ?? 'Ostatní'
  );
  const [manufacturer, setManufacturer] = useState(prefill?.manufacturer ?? '');
  const [packageType, setPackageType] = useState(prefill?.packageType ?? '');
  const [value, setValue] = useState(prefill?.value ?? '');
  const [quantity, setQuantity] = useState('0');
  const [location, setLocation] = useState('');
  const [datasheetUrl, setDatasheetUrl] = useState('');
  const [tags, setTags] = useState(prefill?.tags ?? '');
  const [notes, setNotes] = useState(prefill?.notes ?? '');

  useFocusEffect(
    useCallback(() => {
      if (!editingId) return;
      getComponent(db, editingId).then((item) => {
        if (!item) return;
        setName(item.name);
        setCategory(item.category as ComponentCategory);
        setManufacturer(item.manufacturer ?? '');
        setPackageType(item.packageType ?? '');
        setValue(item.value ?? '');
        setQuantity(String(item.quantity));
        setLocation(item.location ?? '');
        setDatasheetUrl(item.datasheetUrl ?? '');
        setTags(item.tags ?? '');
        setNotes(item.notes ?? '');
      });
    }, [db, editingId])
  );

  const handleSave = async () => {
    if (name.trim().length === 0) {
      Alert.alert('Chybí název', 'Zadej název součástky.');
      return;
    }
    const parsedQuantity = Number.parseInt(quantity, 10);

    const input = {
      name: name.trim(),
      category,
      manufacturer: nullableText(manufacturer),
      packageType: nullableText(packageType),
      value: nullableText(value),
      quantity: Number.isFinite(parsedQuantity) ? parsedQuantity : 0,
      location: nullableText(location),
      datasheetUrl: nullableText(datasheetUrl),
      notes: nullableText(notes),
      tags: nullableText(tags),
    };

    if (editingId) {
      await updateComponent(db, editingId, input);
    } else {
      await createComponent(db, input);
    }
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Název *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="např. NE555" />

      <Text style={styles.label}>Kategorie</Text>
      <View style={styles.chipRow}>
        {COMPONENT_CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[styles.chip, category === cat && styles.chipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Výrobce</Text>
      <TextInput style={styles.input} value={manufacturer} onChangeText={setManufacturer} />

      <View style={styles.labelRow}>
        <Text style={[styles.label, styles.labelInRow]}>Pouzdro</Text>
        <Pressable onPress={() => navigation.navigate('PackageReference')} hitSlop={8}>
          <Text style={styles.helpLink}>Přehled pouzder IC</Text>
        </Pressable>
      </View>
      <TextInput
        style={styles.input}
        value={packageType}
        onChangeText={setPackageType}
        placeholder="např. DIP-8, 0805, TO-92"
      />

      <Text style={styles.label}>Hodnota</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder="např. 10kΩ, 100nF"
      />

      <Text style={styles.label}>Skladem (ks)</Text>
      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Umístění</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="např. krabička A2" />

      <Text style={styles.label}>Odkaz na datasheet</Text>
      <TextInput
        style={styles.input}
        value={datasheetUrl}
        onChangeText={setDatasheetUrl}
        placeholder="https://…"
        autoCapitalize="none"
        keyboardType="url"
      />

      <Text style={styles.label}>Tagy (oddělené čárkou)</Text>
      <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="timer, analog" />

      <Text style={styles.label}>Poznámky</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{editingId ? 'Uložit změny' : 'Přidat součástku'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  label: { fontSize: 13, color: '#666', marginTop: 14, marginBottom: 6 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 14,
  },
  labelInRow: { marginTop: 0 },
  helpLink: { fontSize: 13, color: '#2f6fed', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  chipActive: { backgroundColor: '#2f6fed' },
  chipText: { color: '#333', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  saveButton: {
    marginTop: 28,
    backgroundColor: '#2f6fed',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

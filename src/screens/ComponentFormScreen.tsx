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
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ComponentForm'>;

function nullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default function ComponentFormScreen({ route, navigation }: Props) {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { t } = useI18n();
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
  const [schematicImage, setSchematicImage] = useState<string | null>(null);

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
        setSchematicImage(item.schematicImage);
      });
    }, [db, editingId])
  );

  const handleSave = async () => {
    if (name.trim().length === 0) {
      Alert.alert(t('form.missingNameTitle'), t('form.missingNameMessage'));
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
      schematicImage,
    };

    if (editingId) {
      await updateComponent(db, editingId, input);
    } else {
      await createComponent(db, input);
    }
    navigation.goBack();
  };

  const inputStyle = [
    styles.input,
    { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('form.name')}</Text>
      <TextInput
        style={inputStyle}
        value={name}
        onChangeText={setName}
        placeholder={t('form.namePlaceholder')}
        placeholderTextColor={colors.placeholder}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('form.category')}</Text>
      <View style={styles.chipRow}>
        {COMPONENT_CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <Pressable
              key={cat}
              style={[
                styles.chip,
                { backgroundColor: colors.chipBackground },
                active && { backgroundColor: colors.chipActiveBackground },
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: colors.text },
                  active && { color: colors.primaryText, fontWeight: '600' },
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('form.manufacturer')}</Text>
      <TextInput style={inputStyle} value={manufacturer} onChangeText={setManufacturer} />

      <View style={styles.labelRow}>
        <Text style={[styles.label, styles.labelInRow, { color: colors.textSecondary }]}>
          {t('form.packageType')}
        </Text>
        <Pressable onPress={() => navigation.navigate('PackageReference')} hitSlop={8}>
          <Text style={[styles.helpLink, { color: colors.primary }]}>
            {t('form.packageReferenceLink')}
          </Text>
        </Pressable>
      </View>
      <TextInput
        style={inputStyle}
        value={packageType}
        onChangeText={setPackageType}
        placeholder={t('form.packageTypePlaceholder')}
        placeholderTextColor={colors.placeholder}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('form.value')}</Text>
      <TextInput
        style={inputStyle}
        value={value}
        onChangeText={setValue}
        placeholder={t('form.valuePlaceholder')}
        placeholderTextColor={colors.placeholder}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('form.quantity')}</Text>
      <TextInput
        style={inputStyle}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="number-pad"
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('form.location')}</Text>
      <TextInput
        style={inputStyle}
        value={location}
        onChangeText={setLocation}
        placeholder={t('form.locationPlaceholder')}
        placeholderTextColor={colors.placeholder}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('form.datasheetUrl')}</Text>
      <TextInput
        style={inputStyle}
        value={datasheetUrl}
        onChangeText={setDatasheetUrl}
        placeholder="https://…"
        placeholderTextColor={colors.placeholder}
        autoCapitalize="none"
        keyboardType="url"
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('form.tags')}</Text>
      <TextInput
        style={inputStyle}
        value={tags}
        onChangeText={setTags}
        placeholder={t('form.tagsPlaceholder')}
        placeholderTextColor={colors.placeholder}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('form.notes')}</Text>
      <TextInput
        style={[inputStyle, styles.multiline]}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Pressable style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{editingId ? t('form.saveEdit') : t('form.saveNew')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  label: { fontSize: 13, marginTop: 14, marginBottom: 6 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 14,
  },
  labelInRow: { marginTop: 0 },
  helpLink: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1,
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
  },
  chipText: { fontSize: 13 },
  saveButton: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

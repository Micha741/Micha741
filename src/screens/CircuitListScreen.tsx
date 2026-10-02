import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { listCircuitProjects } from '../db/circuitRepository';
import type { CircuitProject } from '../types/circuit';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';

type Props = NativeStackScreenProps<RootStackParamList, 'CircuitList'>;

export default function CircuitListScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [items, setItems] = useState<CircuitProject[]>([]);
  const [search, setSearch] = useState('');

  const reload = useCallback(async () => {
    const rows = await listCircuitProjects(db, { search });
    setItems(rows);
  }, [db, search]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextInput
        style={[
          styles.search,
          { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
        ]}
        placeholder={t('circuits.searchPlaceholder')}
        placeholderTextColor={colors.placeholder}
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={reload}
        returnKeyType="search"
      />

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('circuits.empty')}</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('CircuitDetail', { id: item.id })}
          >
            <Text style={[styles.rowTitle, { color: colors.text }]}>{item.name}</Text>
            {item.description ? (
              <Text
                style={[styles.rowSubtitle, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            ) : null}
            <Text style={[styles.partsCount, { color: colors.textSecondary }]}>
              {t('circuits.partsCount', { count: item.parts.length })}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: {
    margin: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSubtitle: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  partsCount: { fontSize: 12, marginTop: 6 },
  empty: { textAlign: 'center', marginTop: 40 },
});

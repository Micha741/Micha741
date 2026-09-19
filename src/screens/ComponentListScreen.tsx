import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { importMissingDefaultComponents, listComponents } from '../db/componentRepository';
import type { ElectronicComponent } from '../types/component';
import { COMPONENT_CATEGORIES } from '../types/component';

type Props = NativeStackScreenProps<RootStackParamList, 'ComponentList'>;

export default function ComponentListScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const [items, setItems] = useState<ElectronicComponent[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const rows = await listComponents(db, { search, category: category ?? undefined });
    setItems(rows);
  }, [db, search, category]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerRight: () => (
          <Pressable
            onPress={async () => {
              const added = await importMissingDefaultComponents(db);
              await reload();
              Alert.alert(
                'Výchozí knihovna',
                added > 0
                  ? `Doplněno ${added} součástek z výchozí knihovny.`
                  : 'Výchozí knihovna je již kompletní.'
              );
            }}
            hitSlop={8}
          >
            <Text style={styles.headerButton}>Knihovna</Text>
          </Pressable>
        ),
      });
    }, [navigation, db, reload])
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Hledat podle názvu, tagu, hodnoty…"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={reload}
        returnKeyType="search"
      />

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        data={['Vše', ...COMPONENT_CATEGORIES]}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const isAll = item === 'Vše';
          const active = isAll ? category === null : category === item;
          return (
            <Pressable
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setCategory(isAll ? null : item)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          );
        }}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Zatím žádné součástky. Přidej první tlačítkem +</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('ComponentDetail', { id: item.id })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Text style={styles.rowSubtitle}>
                {item.category}
                {item.value ? ` · ${item.value}` : ''}
                {item.packageType ? ` · ${item.packageType}` : ''}
              </Text>
            </View>
            <Text style={styles.qty}>×{item.quantity}</Text>
          </Pressable>
        )}
      />

      <Pressable
        style={styles.capFab}
        onPress={() => navigation.navigate('CapacitorCodeCalculator')}
      >
        <Text style={[styles.smdFabText, styles.capFabText]}>µF</Text>
      </Pressable>

      <Pressable
        style={styles.smdManualFab}
        onPress={() => navigation.navigate('SmdCodeCalculator')}
      >
        <Text style={styles.smdFabText}>#</Text>
      </Pressable>

      <Pressable
        style={styles.smdFab}
        onPress={() => navigation.navigate('SmdCodeScanner')}
      >
        <Text style={styles.smdFabText}>🔎</Text>
      </Pressable>

      <Pressable
        style={styles.scanFab}
        onPress={() => navigation.navigate('ResistorScanner')}
      >
        <Text style={styles.scanFabText}>📷</Text>
      </Pressable>

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('ComponentForm', {})}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  search: {
    margin: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  headerButton: { color: '#2f6fed', fontSize: 15, fontWeight: '600', marginRight: 4 },
  chipRow: { flexGrow: 0, paddingHorizontal: 12, marginBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginVertical: 8,
  },
  chipActive: { backgroundColor: '#2f6fed' },
  chipText: { color: '#333', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  list: { paddingHorizontal: 12, paddingBottom: 96 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  rowTitle: { fontSize: 16, fontWeight: '600', color: '#111' },
  rowSubtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  qty: { fontSize: 14, color: '#444', marginLeft: 8 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2f6fed',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
  scanFab: {
    position: 'absolute',
    right: 20,
    bottom: 92,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  scanFabText: { fontSize: 22 },
  smdFab: {
    position: 'absolute',
    right: 20,
    bottom: 152,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  smdFabText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  smdManualFab: {
    position: 'absolute',
    right: 20,
    bottom: 212,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  capFabText: { fontSize: 15 },
  capFab: {
    position: 'absolute',
    right: 20,
    bottom: 272,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});

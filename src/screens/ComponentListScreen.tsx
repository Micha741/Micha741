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
import {
  getCodeLibraryVersion,
  getSyncedLibraryVersion,
  listComponents,
  syncSeedComponents,
} from '../db/componentRepository';
import type { ElectronicComponent } from '../types/component';
import { COMPONENT_CATEGORIES } from '../types/component';
import { fetchRemoteLibraryVersion } from '../services/libraryVersionCheck';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ComponentList'>;

export default function ComponentListScreen({ navigation }: Props) {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { t } = useI18n();
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
          <View style={styles.headerButtons}>
            <Pressable
              onPress={async () => {
                const codeVersion = getCodeLibraryVersion();
                const syncedVersion = await getSyncedLibraryVersion(db);
                const versionLine =
                  syncedVersion === 0
                    ? t('list.library.versionNotSynced', { code: codeVersion })
                    : syncedVersion < codeVersion
                      ? t('list.library.versionOutdated', { synced: syncedVersion, code: codeVersion })
                      : t('list.library.versionCurrent', { synced: syncedVersion });

                Alert.alert(
                  t('list.library.title'),
                  `${versionLine}${t('list.library.howToSync')}`,
                  [
                    { text: t('list.library.cancel'), style: 'cancel' },
                    {
                      text: t('list.library.addOnly'),
                      onPress: async () => {
                        const { added } = await syncSeedComponents(db, { updateExisting: false });
                        await reload();
                        Alert.alert(
                          t('list.library.title'),
                          `${
                            added > 0
                              ? t('list.library.addedCount', { added })
                              : t('list.library.alreadyComplete')
                          }${t('list.library.versionLine', { code: codeVersion })}`
                        );
                      },
                    },
                    {
                      text: t('list.library.addAndUpdate'),
                      onPress: async () => {
                        const { added, updated } = await syncSeedComponents(db, {
                          updateExisting: true,
                        });
                        await reload();
                        Alert.alert(
                          t('list.library.title'),
                          `${
                            added > 0 || updated > 0
                              ? t('list.library.addedAndUpdatedCount', { added, updated })
                              : t('list.library.alreadyCurrent')
                          }${t('list.library.versionLine', { code: codeVersion })}`
                        );
                      },
                    },
                    {
                      text: t('list.library.checkOnline'),
                      onPress: async () => {
                        const remote = await fetchRemoteLibraryVersion();
                        if (!remote) {
                          Alert.alert(
                            t('list.library.onlineCheckTitle'),
                            t('list.library.onlineCheckFailed')
                          );
                          return;
                        }
                        Alert.alert(
                          t('list.library.onlineCheckTitle'),
                          remote.version > codeVersion
                            ? t('list.library.onlineCheckNewer', {
                                remote: remote.version,
                                code: codeVersion,
                              })
                            : t('list.library.onlineCheckLatest', { code: codeVersion })
                        );
                      },
                    },
                  ]
                );
              }}
              hitSlop={8}
            >
              <Text style={[styles.headerButton, { color: colors.primary }]}>
                {t('list.headerButton')}
              </Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('CircuitList')} hitSlop={8}>
              <Text style={styles.headerIcon}>🛠️</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={8}>
              <Text style={styles.headerIcon}>⚙️</Text>
            </Pressable>
          </View>
        ),
      });
    }, [navigation, db, reload, colors, t])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextInput
        style={[
          styles.search,
          { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
        ]}
        placeholder={t('list.searchPlaceholder')}
        placeholderTextColor={colors.placeholder}
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={reload}
        returnKeyType="search"
      />

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        data={[t('list.categoryAll'), ...COMPONENT_CATEGORIES]}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const isAll = item === t('list.categoryAll');
          const active = isAll ? category === null : category === item;
          return (
            <Pressable
              style={[
                styles.chip,
                { backgroundColor: colors.chipBackground },
                active && { backgroundColor: colors.chipActiveBackground },
              ]}
              onPress={() => setCategory(isAll ? null : item)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: colors.text },
                  active && { color: colors.primaryText, fontWeight: '600' },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        }}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('list.empty')}</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('ComponentDetail', { id: item.id })}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                {item.category}
                {item.value ? ` · ${item.value}` : ''}
                {item.packageType ? ` · ${item.packageType}` : ''}
              </Text>
            </View>
            <Text style={[styles.qty, { color: colors.text }]}>×{item.quantity}</Text>
          </Pressable>
        )}
      />

      <Pressable
        style={[styles.componentScanFab, { backgroundColor: colors.fabBackground }]}
        onPress={() => navigation.navigate('ComponentScanner')}
      >
        <Text style={styles.smdFabText}>🏷️</Text>
      </Pressable>

      <Pressable
        style={[styles.capFab, { backgroundColor: colors.fabBackground }]}
        onPress={() => navigation.navigate('CapacitorCodeCalculator')}
      >
        <Text style={[styles.smdFabText, styles.capFabText]}>µF</Text>
      </Pressable>

      <Pressable
        style={[styles.smdManualFab, { backgroundColor: colors.fabBackground }]}
        onPress={() => navigation.navigate('SmdCodeCalculator')}
      >
        <Text style={styles.smdFabText}>#</Text>
      </Pressable>

      <Pressable
        style={[styles.smdFab, { backgroundColor: colors.fabBackground }]}
        onPress={() => navigation.navigate('SmdCodeScanner')}
      >
        <Text style={styles.smdFabText}>🔎</Text>
      </Pressable>

      <Pressable
        style={[styles.scanFab, { backgroundColor: colors.fabBackground }]}
        onPress={() => navigation.navigate('ResistorScanner')}
      >
        <Text style={styles.scanFabText}>📷</Text>
      </Pressable>

      <Pressable
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('ComponentForm', {})}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  search: {
    margin: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  headerButton: { fontSize: 15, fontWeight: '600' },
  headerIcon: { fontSize: 18 },
  chipRow: { flexGrow: 0, paddingHorizontal: 12, marginBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginVertical: 8,
  },
  chipText: { fontSize: 13 },
  list: { paddingHorizontal: 12, paddingBottom: 96 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSubtitle: { fontSize: 13, marginTop: 2 },
  qty: { fontSize: 14, marginLeft: 8 },
  empty: { textAlign: 'center', marginTop: 40 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
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
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  componentScanFab: {
    position: 'absolute',
    right: 20,
    bottom: 332,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});

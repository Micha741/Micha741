import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { DefaultTheme, DarkTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Suspense } from 'react';
import { DATABASE_NAME, migrateDbIfNeeded } from './src/db/schema';
import {
  autoSyncSeedComponentsIfNewer,
  ensureDefaultComponentsSeededOnce,
} from './src/db/componentRepository';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { I18nProvider } from './src/i18n/I18nContext';
import RootNavigator from './src/navigation/RootNavigator';

async function initializeDatabase(db: SQLiteDatabase) {
  await migrateDbIfNeeded(db);
  await ensureDefaultComponentsSeededOnce(db);
  // Tiché doplnění/aktualizace knihovny při každém startu appky, pokud kód
  // nese novější verzi seed dat než je v databázi — bez nutnosti ručně mačkat
  // tlačítko "Knihovna". Uživatelovy vlastní úpravy zůstávají nedotčené.
  await autoSyncSeedComponentsIfNewer(db);
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Suspense fallback={<Loading />}>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase} useSuspense>
          <ThemeProvider>
            <I18nProvider>
              <ThemedNavigation />
            </I18nProvider>
          </ThemeProvider>
        </SQLiteProvider>
      </Suspense>
    </SafeAreaProvider>
  );
}

function ThemedNavigation() {
  const { mode, colors } = useTheme();
  const navigationTheme = {
    ...(mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };
  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
      <StatusBar style={colors.statusBarStyle} />
    </NavigationContainer>
  );
}

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

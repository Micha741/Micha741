import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Suspense } from 'react';
import { Observe, ObserveRoot, type ObserveErrorBoundaryFallbackProps } from 'expo-observe';
import { ObserveNavigationContainer } from 'expo-observe/integrations/react-navigation';
import { DATABASE_NAME, migrateDbIfNeeded } from './src/db/schema';
import { ensureDefaultComponentsSeededOnce } from './src/db/componentRepository';
import RootNavigator from './src/navigation/RootNavigator';

// Must run before any screen mounts; each configure() call replaces the whole config.
Observe.configure({
  integrations: { 'react-navigation': true },
});

async function initializeDatabase(db: SQLiteDatabase) {
  await migrateDbIfNeeded(db);
  await ensureDefaultComponentsSeededOnce(db);
}

export default function App() {
  return (
    <ObserveRoot errorBoundaryFallback={ErrorFallback}>
      <SafeAreaProvider>
        <Suspense fallback={<Loading />}>
          <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase} useSuspense>
            <ObserveNavigationContainer>
              <RootNavigator />
              <StatusBar style="auto" />
            </ObserveNavigationContainer>
          </SQLiteProvider>
        </Suspense>
      </SafeAreaProvider>
    </ObserveRoot>
  );
}

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function ErrorFallback({ resetError }: ObserveErrorBoundaryFallbackProps) {
  return (
    <View style={styles.loading}>
      <Text style={styles.errorTitle}>Něco se pokazilo</Text>
      <Pressable onPress={resetError} hitSlop={8}>
        <Text style={styles.errorButton}>Zkusit znovu</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  errorButton: { fontSize: 16, color: '#007AFF' },
});

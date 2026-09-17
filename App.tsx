import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Suspense } from 'react';
import { DATABASE_NAME, migrateDbIfNeeded } from './src/db/schema';
import { ensureDefaultComponentsSeededOnce } from './src/db/componentRepository';
import RootNavigator from './src/navigation/RootNavigator';

async function initializeDatabase(db: SQLiteDatabase) {
  await migrateDbIfNeeded(db);
  await ensureDefaultComponentsSeededOnce(db);
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Suspense fallback={<Loading />}>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase} useSuspense>
          <NavigationContainer>
            <RootNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </SQLiteProvider>
      </Suspense>
    </SafeAreaProvider>
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

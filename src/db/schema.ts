import { type SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'circuitkit.db';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS components (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        manufacturer TEXT,
        packageType TEXT,
        value TEXT,
        quantity INTEGER NOT NULL DEFAULT 0,
        location TEXT,
        datasheetUrl TEXT,
        notes TEXT,
        tags TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_components_category ON components (category);
      CREATE INDEX IF NOT EXISTS idx_components_name ON components (name);

      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);

    await db.execAsync('PRAGMA user_version = 1');
  }

  if (currentVersion < 2) {
    await db.execAsync(`
      ALTER TABLE components ADD COLUMN schematicImage TEXT;
      PRAGMA user_version = 2;
    `);
  }
}

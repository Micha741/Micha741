import { type SQLiteDatabase } from 'expo-sqlite';

export type ThemeMode = 'light' | 'dark';
export type Locale = 'cs' | 'en';

const THEME_KEY = 'app_theme_mode';
const LOCALE_KEY = 'app_locale';

async function getMeta(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

async function setMeta(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', [key, value]);
}

export async function getThemeMode(db: SQLiteDatabase): Promise<ThemeMode> {
  const value = await getMeta(db, THEME_KEY);
  return value === 'dark' ? 'dark' : 'light';
}

export async function setThemeMode(db: SQLiteDatabase, mode: ThemeMode): Promise<void> {
  await setMeta(db, THEME_KEY, mode);
}

export async function getLocale(db: SQLiteDatabase): Promise<Locale> {
  const value = await getMeta(db, LOCALE_KEY);
  return value === 'en' ? 'en' : 'cs';
}

export async function setLocale(db: SQLiteDatabase, locale: Locale): Promise<void> {
  await setMeta(db, LOCALE_KEY, locale);
}

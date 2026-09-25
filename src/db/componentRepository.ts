import { type SQLiteDatabase } from 'expo-sqlite';
import type { ComponentInput, ElectronicComponent } from '../types/component';
import { SEED_COMPONENTS, SEED_LIBRARY_VERSION } from './seedComponents';

export async function listComponents(
  db: SQLiteDatabase,
  options: { search?: string; category?: string } = {}
): Promise<ElectronicComponent[]> {
  const { search, category } = options;
  const clauses: string[] = [];
  const args: (string | number)[] = [];

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    clauses.push('(name LIKE ? OR tags LIKE ? OR manufacturer LIKE ? OR value LIKE ?)');
    args.push(term, term, term, term);
  }

  if (category) {
    clauses.push('category = ?');
    args.push(category);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  return db.getAllAsync<ElectronicComponent>(
    `SELECT * FROM components ${where} ORDER BY name COLLATE NOCASE ASC`,
    args
  );
}

export async function getComponent(
  db: SQLiteDatabase,
  id: number
): Promise<ElectronicComponent | null> {
  const row = await db.getFirstAsync<ElectronicComponent>(
    'SELECT * FROM components WHERE id = ?',
    [id]
  );
  return row ?? null;
}

export async function createComponent(
  db: SQLiteDatabase,
  input: ComponentInput
): Promise<number> {
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO components
      (name, category, manufacturer, packageType, value, quantity, location, datasheetUrl, notes, tags, schematicImage, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.category,
      input.manufacturer,
      input.packageType,
      input.value,
      input.quantity,
      input.location,
      input.datasheetUrl,
      input.notes,
      input.tags,
      input.schematicImage,
      now,
      now,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateComponent(
  db: SQLiteDatabase,
  id: number,
  input: ComponentInput
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE components SET
      name = ?, category = ?, manufacturer = ?, packageType = ?, value = ?,
      quantity = ?, location = ?, datasheetUrl = ?, notes = ?, tags = ?, schematicImage = ?, updatedAt = ?
     WHERE id = ?`,
    [
      input.name,
      input.category,
      input.manufacturer,
      input.packageType,
      input.value,
      input.quantity,
      input.location,
      input.datasheetUrl,
      input.notes,
      input.tags,
      input.schematicImage,
      now,
      id,
    ]
  );
}

export async function deleteComponent(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM components WHERE id = ?', [id]);
}

const SEED_DONE_KEY = 'default_components_seeded';
const LIBRARY_VERSION_KEY = 'seed_library_version';

export async function getSyncedLibraryVersion(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [LIBRARY_VERSION_KEY]
  );
  return row ? Number(row.value) : 0;
}

export function getCodeLibraryVersion(): number {
  return SEED_LIBRARY_VERSION;
}

type ExistingSeedRow = {
  id: number;
  name: string;
  category: string;
  manufacturer: string | null;
  packageType: string | null;
  value: string | null;
  notes: string | null;
  tags: string | null;
  datasheetUrl: string | null;
  schematicImage: string | null;
};

export interface SyncSeedComponentsResult {
  added: number;
  updated: number;
}

export async function syncSeedComponents(
  db: SQLiteDatabase,
  options: { updateExisting: boolean } = { updateExisting: false }
): Promise<SyncSeedComponentsResult> {
  const existing = await db.getAllAsync<ExistingSeedRow>(
    'SELECT id, name, category, manufacturer, packageType, value, notes, tags, datasheetUrl, schematicImage FROM components'
  );
  const existingByName = new Map(existing.map((row) => [row.name.toLowerCase(), row]));

  let added = 0;
  let updated = 0;

  await db.withTransactionAsync(async () => {
    for (const seed of SEED_COMPONENTS) {
      const match = existingByName.get(seed.name.toLowerCase());

      if (!match) {
        await createComponent(db, seed);
        added += 1;
        continue;
      }

      if (!options.updateExisting) continue;

      const changed =
        match.category !== seed.category ||
        (match.manufacturer ?? '') !== (seed.manufacturer ?? '') ||
        (match.packageType ?? '') !== (seed.packageType ?? '') ||
        (match.value ?? '') !== (seed.value ?? '') ||
        (match.notes ?? '') !== (seed.notes ?? '') ||
        (match.tags ?? '') !== (seed.tags ?? '') ||
        (match.datasheetUrl ?? '') !== (seed.datasheetUrl ?? '') ||
        (match.schematicImage ?? '') !== (seed.schematicImage ?? '');

      if (!changed) continue;

      const now = new Date().toISOString();
      await db.runAsync(
        `UPDATE components SET
          category = ?, manufacturer = ?, packageType = ?, value = ?,
          notes = ?, tags = ?, datasheetUrl = ?, schematicImage = ?, updatedAt = ?
         WHERE id = ?`,
        [
          seed.category,
          seed.manufacturer,
          seed.packageType,
          seed.value,
          seed.notes,
          seed.tags,
          seed.datasheetUrl,
          seed.schematicImage,
          now,
          match.id,
        ]
      );
      updated += 1;
    }
  });

  await db.runAsync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', [
    LIBRARY_VERSION_KEY,
    String(SEED_LIBRARY_VERSION),
  ]);

  return { added, updated };
}

export async function ensureDefaultComponentsSeededOnce(db: SQLiteDatabase): Promise<void> {
  const flag = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [SEED_DONE_KEY]
  );
  if (flag) return;

  await syncSeedComponents(db, { updateExisting: false });
  await db.runAsync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', [
    SEED_DONE_KEY,
    '1',
  ]);
}

export async function importMissingDefaultComponents(db: SQLiteDatabase): Promise<number> {
  const { added } = await syncSeedComponents(db, { updateExisting: false });
  return added;
}

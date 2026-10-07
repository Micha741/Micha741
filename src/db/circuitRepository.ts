import { type SQLiteDatabase } from 'expo-sqlite';
import type { CircuitProject, CircuitProjectInput } from '../types/circuit';
import type { ElectronicComponent } from '../types/component';
import { CIRCUIT_LIBRARY_VERSION, SEED_CIRCUIT_PROJECTS } from './seedCircuitProjects';

export interface PartMatchResult {
  matches: ElectronicComponent[];
  /** Součet quantity napříč všemi odpovídajícími záznamy ve skladu. */
  totalInStock: number;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Jednoduché porovnání podle textu (ne přesné párování id) — stačí k rychlému "mám / nemám" přehledu. */
export function matchPartAgainstInventory(
  part: { label: string; match?: string },
  inventory: ElectronicComponent[]
): PartMatchResult {
  const needle = normalize(part.match ?? part.label);
  const matches = inventory.filter((component) => {
    const haystack = normalize(
      [component.name, component.value, component.tags].filter(Boolean).join(' ')
    );
    return haystack.includes(needle);
  });
  const totalInStock = matches.reduce((sum, m) => sum + m.quantity, 0);
  return { matches, totalInStock };
}

type CircuitProjectRow = {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  pcbImage: string | null;
  partsJson: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

function rowToProject(row: CircuitProjectRow): CircuitProject {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    image: row.image,
    pcbImage: row.pcbImage,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    parts: JSON.parse(row.partsJson),
  };
}

export async function listCircuitProjects(
  db: SQLiteDatabase,
  options: { search?: string } = {}
): Promise<CircuitProject[]> {
  const { search } = options;
  const clauses: string[] = [];
  const args: string[] = [];

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    clauses.push('(name LIKE ? OR description LIKE ? OR partsJson LIKE ?)');
    args.push(term, term, term);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  const rows = await db.getAllAsync<CircuitProjectRow>(
    `SELECT * FROM circuit_projects ${where} ORDER BY name COLLATE NOCASE ASC`,
    args
  );
  return rows.map(rowToProject);
}

export async function getCircuitProject(
  db: SQLiteDatabase,
  id: number
): Promise<CircuitProject | null> {
  const row = await db.getFirstAsync<CircuitProjectRow>(
    'SELECT * FROM circuit_projects WHERE id = ?',
    [id]
  );
  return row ? rowToProject(row) : null;
}

async function createCircuitProject(db: SQLiteDatabase, input: CircuitProjectInput): Promise<number> {
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO circuit_projects (name, description, image, pcbImage, partsJson, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.description,
      input.image,
      input.pcbImage,
      JSON.stringify(input.parts),
      input.notes,
      now,
      now,
    ]
  );
  return result.lastInsertRowId;
}

const CIRCUIT_LIBRARY_VERSION_KEY = 'circuit_library_version';

export async function getSyncedCircuitLibraryVersion(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [CIRCUIT_LIBRARY_VERSION_KEY]
  );
  return row ? Number(row.value) : 0;
}

export async function syncSeedCircuitProjects(
  db: SQLiteDatabase,
  options: { updateExisting: boolean } = { updateExisting: false }
): Promise<{ added: number; updated: number }> {
  const existing = await db.getAllAsync<{ id: number; name: string }>(
    'SELECT id, name FROM circuit_projects'
  );
  const existingByName = new Map(existing.map((row) => [row.name.toLowerCase(), row.id]));

  let added = 0;
  let updated = 0;

  await db.withTransactionAsync(async () => {
    for (const seed of SEED_CIRCUIT_PROJECTS) {
      const existingId = existingByName.get(seed.name.toLowerCase());

      if (existingId === undefined) {
        await createCircuitProject(db, seed);
        added += 1;
        continue;
      }

      if (!options.updateExisting) continue;

      const now = new Date().toISOString();
      await db.runAsync(
        `UPDATE circuit_projects SET description = ?, image = ?, pcbImage = ?, partsJson = ?, notes = ?, updatedAt = ?
         WHERE id = ?`,
        [seed.description, seed.image, seed.pcbImage, JSON.stringify(seed.parts), seed.notes, now, existingId]
      );
      updated += 1;
    }
  });

  await db.runAsync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', [
    CIRCUIT_LIBRARY_VERSION_KEY,
    String(CIRCUIT_LIBRARY_VERSION),
  ]);

  return { added, updated };
}

export async function autoSyncCircuitProjectsIfNewer(
  db: SQLiteDatabase
): Promise<{ added: number; updated: number } | null> {
  const synced = await getSyncedCircuitLibraryVersion(db);
  if (synced >= CIRCUIT_LIBRARY_VERSION) return null;
  return syncSeedCircuitProjects(db, { updateExisting: true });
}

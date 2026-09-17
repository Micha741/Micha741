import { type SQLiteDatabase } from 'expo-sqlite';
import type { ComponentInput, ElectronicComponent } from '../types/component';

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
      (name, category, manufacturer, packageType, value, quantity, location, datasheetUrl, notes, tags, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      quantity = ?, location = ?, datasheetUrl = ?, notes = ?, tags = ?, updatedAt = ?
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
      now,
      id,
    ]
  );
}

export async function deleteComponent(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM components WHERE id = ?', [id]);
}

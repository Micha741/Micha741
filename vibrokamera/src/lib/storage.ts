import { Directory, File, Paths } from 'expo-file-system';

import { DEFAULT_MOTOR, type MotorSettings } from './motor';

/**
 * Nastavení a výsledky měření se ukládají jako JSON do interního úložiště
 * aplikace (Paths.document/vibrokamera). Při odinstalaci aplikace se smažou –
 * proto je k dispozici export do CSV (Stažené/VibroKamera).
 */
const dataDir = new Directory(Paths.document, 'vibrokamera');
const settingsFile = new File(dataDir, 'settings.json');
const measurementsFile = new File(dataDir, 'measurements.json');

export type AppSettings = {
  motor: MotorSettings;
};

export type Measurement = {
  id: string;
  createdAt: number;
  recordingName: string;
  recordingPath: string;
  /** Výsledné (skutečné) otáčky. */
  rpm: number;
  hz: number;
  /** Zdánlivá frekvence z videa (liší se od hz při aliasingu). */
  apparentHz: number;
  aliased: boolean;
  fps: number;
  frameA: number;
  frameB: number;
  turns: number;
  errorPct: number;
  motorType: MotorSettings['type'];
  maxRpm: number;
  note: string;
};

export const DEFAULT_SETTINGS: AppSettings = { motor: DEFAULT_MOTOR };

/** Cesta k souboru s výsledky (bez file://). */
export function measurementsLocation(): string {
  return measurementsFile.uri.replace(/^file:\/\//, '');
}

function readJson<T>(file: File, fallback: T): T {
  try {
    if (!file.exists) return fallback;
    return JSON.parse(file.textSync()) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: File, value: unknown) {
  if (!dataDir.exists) dataDir.create({ intermediates: true, idempotent: true });
  if (!file.exists) file.create();
  file.write(JSON.stringify(value, null, 2));
}

export function loadSettings(): AppSettings {
  const stored = readJson<Partial<AppSettings>>(settingsFile, {});
  return { motor: { ...DEFAULT_MOTOR, ...stored.motor } };
}

export function saveSettings(settings: AppSettings) {
  writeJson(settingsFile, settings);
}

export function loadMeasurements(): Measurement[] {
  const list = readJson<Measurement[]>(measurementsFile, []);
  return Array.isArray(list) ? list.sort((a, b) => b.createdAt - a.createdAt) : [];
}

export function addMeasurement(measurement: Omit<Measurement, 'id' | 'createdAt'>): Measurement {
  const entry: Measurement = {
    ...measurement,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  writeJson(measurementsFile, [entry, ...loadMeasurements()]);
  return entry;
}

export function deleteMeasurement(id: string) {
  writeJson(
    measurementsFile,
    loadMeasurements().filter((m) => m.id !== id)
  );
}

export function deleteMeasurementsForRecording(recordingPath: string) {
  writeJson(
    measurementsFile,
    loadMeasurements().filter((m) => m.recordingPath !== recordingPath)
  );
}

/** CSV se středníky (český Excel), desetinná čárka. */
export function measurementsToCsv(list: Measurement[]): string {
  const num = (v: number, d: number) => v.toFixed(d).replace('.', ',');
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header = [
    'Datum',
    'Záznam',
    'Otáčky [ot/min]',
    'Frekvence [Hz]',
    'Zdánlivá frekvence [Hz]',
    'Aliasing',
    'fps',
    'Snímek A',
    'Snímek B',
    'Počet otáček',
    'Přesnost [%]',
    'Typ motoru',
    'Max. otáčky',
    'Poznámka',
  ];
  const rows = list.map((m) =>
    [
      esc(new Date(m.createdAt).toLocaleString('cs-CZ')),
      esc(m.recordingName),
      num(m.rpm, 0),
      num(m.hz, 3),
      num(m.apparentHz, 3),
      m.aliased ? 'ano' : 'ne',
      num(m.fps, 2),
      String(m.frameA + 1),
      String(m.frameB + 1),
      String(m.turns),
      num(m.errorPct, 2),
      m.motorType.toUpperCase(),
      String(m.maxRpm),
      esc(m.note),
    ].join(';')
  );
  return [header.join(';'), ...rows].join('\r\n');
}

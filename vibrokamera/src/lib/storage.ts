import { Directory, File, Paths } from 'expo-file-system';

import type { Vec3 } from './alignment';
import { DEFAULT_MOTOR, type MotorSettings } from './motor';
import type { ThemeMode } from './theme';

/**
 * Nastavení, kalibrace a výsledky měření se ukládají jako JSON do interního
 * úložiště aplikace (Paths.document/vibrokamera). Při odinstalaci aplikace se
 * smažou – proto je k dispozici export do CSV (Stažené/VibroKamera).
 */
const dataDir = new Directory(Paths.document, 'vibrokamera');
const settingsFile = new File(dataDir, 'settings.json');
const measurementsFile = new File(dataDir, 'measurements.json');
const calibrationsFile = new File(dataDir, 'calibrations.json');
const recordingMetaFile = new File(dataDir, 'recordings-meta.json');
const compatFile = new File(dataDir, 'device-compat.json');

export type AppSettings = {
  motor: MotorSettings;
  theme: ThemeMode;
  /** Gravitace v poloze „telefon zády na stroji“ – reference pro kolmost kamery. */
  alignmentRef: Vec3 | null;
};

export type RotationDirection = 'cw' | 'ccw';
export type ViewFrom = 'DE' | 'NDE' | 'other';

export const DIRECTION_LABELS: Record<RotationDirection, string> = {
  cw: 've směru hodinových ručiček (CW)',
  ccw: 'proti směru hodinových ručiček (CCW)',
};

export const VIEW_LABELS: Record<ViewFrom, string> = {
  DE: 'ze strany pohonu (DE)',
  NDE: 'z volného konce (NDE)',
  other: 'z boku / jiný pohled',
};

/** Údaje zaznamenané při natáčení. */
export type RecordingMeta = {
  tiltDeg?: number;
  pitchDeg?: number;
  rollDeg?: number;
  referenceUsed?: boolean;
  /** Max. otřesy telefonu během záznamu [g RMS]. */
  shakeG?: number;
  direction?: RotationDirection;
  viewFrom?: ViewFrom;
};

type BaseMeasurement = {
  id: string;
  createdAt: number;
  recordingName: string;
  recordingPath: string;
  fps: number;
  motorType: MotorSettings['type'];
  maxRpm: number;
  note: string;
};

/** Ruční měření otáček mezi značkami A a B. */
export type RpmMeasurement = BaseMeasurement & {
  kind?: 'rpm';
  rpm: number;
  hz: number;
  /** Zdánlivá frekvence z videa (liší se od hz při aliasingu). */
  apparentHz: number;
  aliased: boolean;
  frameA: number;
  frameB: number;
  turns: number;
  errorPct: number;
  direction?: RotationDirection;
  viewFrom?: ViewFrom;
};

/** Analýza časového záznamu vibrací (sledování bodu ve videu). */
export type VibrationMeasurement = BaseMeasurement & {
  kind: 'vibration';
  unit: 'mm' | 'px';
  axis: string;
  zeroPeak: number;
  peakPeak: number;
  avg: number;
  rms: number;
  crest: number;
  shape: string;
  freqHz: number | null;
  rpm: number | null;
  velocityRms: number | null;
  durationMs: number;
  samples: number;
};

export type Measurement = RpmMeasurement | VibrationMeasurement;

export type Calibration = { mmPerPx: number; points: [number, number, number, number]; mm: number };

export const DEFAULT_SETTINGS: AppSettings = { motor: DEFAULT_MOTOR, theme: 'system', alignmentRef: null };

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
  return {
    motor: { ...DEFAULT_MOTOR, ...stored.motor },
    theme: stored.theme ?? DEFAULT_SETTINGS.theme,
    alignmentRef: stored.alignmentRef ?? null,
  };
}

export function saveSettings(settings: AppSettings) {
  writeJson(settingsFile, settings);
}

// --- výsledky ---

export function loadMeasurements(): Measurement[] {
  const list = readJson<Measurement[]>(measurementsFile, []);
  return Array.isArray(list) ? list.sort((a, b) => b.createdAt - a.createdAt) : [];
}

type NewMeasurement = Omit<RpmMeasurement, 'id' | 'createdAt'> | Omit<VibrationMeasurement, 'id' | 'createdAt'>;

export function addMeasurement(measurement: NewMeasurement): Measurement {
  const entry = {
    ...measurement,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  } as Measurement;
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
  const calibrations = loadCalibrations();
  if (calibrations[recordingPath]) {
    delete calibrations[recordingPath];
    writeJson(calibrationsFile, calibrations);
  }
  const meta = loadAllRecordingMeta();
  if (meta[recordingPath]) {
    delete meta[recordingPath];
    writeJson(recordingMetaFile, meta);
  }
}

// --- metadata záznamů (vyrovnání, otřesy, směr otáčení) ---

export function loadAllRecordingMeta(): Record<string, RecordingMeta> {
  return readJson<Record<string, RecordingMeta>>(recordingMetaFile, {});
}

export function getRecordingMeta(path: string): RecordingMeta {
  return loadAllRecordingMeta()[path] ?? {};
}

export function updateRecordingMeta(path: string, patch: RecordingMeta) {
  const all = loadAllRecordingMeta();
  all[path] = { ...all[path], ...patch };
  writeJson(recordingMetaFile, all);
}

// --- režimy kamery, které na tomto telefonu nefungují ---

export function loadFailedModes(): string[] {
  const data = readJson<{ failedModes?: string[] }>(compatFile, {});
  return Array.isArray(data.failedModes) ? data.failedModes : [];
}

export function saveFailedModes(keys: string[]) {
  writeJson(compatFile, { failedModes: [...new Set(keys)] });
}

// --- kalibrace (mm na pixel) pro jednotlivé záznamy ---

export function loadCalibrations(): Record<string, Calibration> {
  return readJson<Record<string, Calibration>>(calibrationsFile, {});
}

export function getCalibration(recordingPath: string): Calibration | null {
  return loadCalibrations()[recordingPath] ?? null;
}

export function setCalibration(recordingPath: string, calibration: Calibration | null) {
  const all = loadCalibrations();
  if (calibration) all[recordingPath] = calibration;
  else delete all[recordingPath];
  writeJson(calibrationsFile, all);
}

// --- export ---

/** CSV se středníky (český Excel), desetinná čárka. */
export function measurementsToCsv(list: Measurement[]): string {
  const num = (v: number | null | undefined, d: number) => (v == null ? '' : v.toFixed(d).replace('.', ','));
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header = [
    'Datum',
    'Typ měření',
    'Záznam',
    'Otáčky [ot/min]',
    'Frekvence [Hz]',
    'Jednotka',
    'Směr',
    '0-P',
    'P-P',
    'AVG',
    'RMS',
    'Crest faktor',
    'Tvar signálu',
    'Rychlost RMS [mm/s] (odhad)',
    'Zdánlivá frekvence [Hz]',
    'Aliasing',
    'fps',
    'Snímek A',
    'Snímek B',
    'Počet otáček',
    'Přesnost [%]',
    'Směr otáčení',
    'Pohled',
    'Délka [ms]',
    'Vzorků',
    'Typ motoru',
    'Max. otáčky',
    'Poznámka',
  ];
  const rows = list.map((m) => {
    const date = esc(new Date(m.createdAt).toLocaleString('cs-CZ'));
    if (m.kind === 'vibration') {
      return [
        date, 'vibrace', esc(m.recordingName), num(m.rpm, 0), num(m.freqHz, 3), m.unit, esc(m.axis),
        num(m.zeroPeak, 4), num(m.peakPeak, 4), num(m.avg, 4), num(m.rms, 4), num(m.crest, 2), esc(m.shape),
        num(m.velocityRms, 3), '', '', num(m.fps, 2), '', '', '', '', '', '', num(m.durationMs, 0), String(m.samples),
        m.motorType.toUpperCase(), String(m.maxRpm), esc(m.note),
      ].join(';');
    }
    return [
      date, 'otáčky', esc(m.recordingName), num(m.rpm, 0), num(m.hz, 3), '', '', '', '', '', '', '', '', '',
      num(m.apparentHz, 3), m.aliased ? 'ano' : 'ne', num(m.fps, 2), String(m.frameA + 1), String(m.frameB + 1),
      String(m.turns), num(m.errorPct, 2), m.direction ? m.direction.toUpperCase() : '', m.viewFrom ?? '', '', '', m.motorType.toUpperCase(), String(m.maxRpm), esc(m.note),
    ].join(';');
  });
  return [header.join(';'), ...rows].join('\r\n');
}

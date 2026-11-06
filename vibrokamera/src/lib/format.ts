import type { RecordingFile } from '../../modules/high-speed-camera';

export function formatDuration(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} kB`;
}

export function formatDate(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatNumber(value: number, digits = 1): string {
  return value.toLocaleString('cs-CZ', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Snímková frekvence zakódovaná v názvu souboru (VIB_..._240fps_1280x720.mp4). */
export function nominalFps(recording: RecordingFile): number | null {
  const match = /_(\d+)fps_/.exec(recording.name);
  return match ? Number(match[1]) : null;
}

/** Skutečná průměrná frekvence z metadat (počet snímků / délka). */
export function measuredFps(recording: RecordingFile): number | null {
  if (!recording.frameCount || !recording.durationMs) return null;
  return (recording.frameCount * 1000) / recording.durationMs;
}

/**
 * Frekvence pro výpočty: naměřená, pokud se od nominální liší max. o 15 %
 * (metadata bývají na začátku/konci záznamu nepřesná), jinak nominální.
 */
export function analysisFps(recording: RecordingFile): number {
  const nominal = nominalFps(recording);
  const measured = measuredFps(recording);
  if (nominal && measured && Math.abs(measured - nominal) / nominal <= 0.15) return measured;
  return nominal ?? measured ?? 30;
}

/**
 * Snímky za sekundu na časové ose souboru (pro krokování přehrávače). Liší se od
 * analysisFps u telefonů, které ukládají high-speed video se „zpomalenými“ časy.
 */
export function timelineFps(recording: RecordingFile): number {
  return measuredFps(recording) ?? nominalFps(recording) ?? 30;
}

/** Nejvyšší frekvence kmitání zachytitelná při dané snímkové frekvenci (Nyquist). */
export function nyquistHz(fps: number): number {
  return fps / 2;
}

import type { CameraInfo } from '../../modules/high-speed-camera';

export type CaptureMode = {
  key: string;
  cameraId: string;
  width: number;
  height: number;
  fps: number;
  highSpeed: boolean;
};

/** Všechny režimy záznamu kamery, seřazené od nejvyšší snímkové frekvence. */
export function buildModes(camera: CameraInfo): CaptureMode[] {
  const all: CaptureMode[] = [
    ...camera.highSpeedModes.map((m) => ({ ...m, highSpeed: true })),
    ...camera.normalModes.map((m) => ({ ...m, highSpeed: false })),
  ].map((m) => ({
    ...m,
    cameraId: camera.id,
    key: `${camera.id}:${m.highSpeed ? 'hs' : 'n'}:${m.width}x${m.height}@${m.fps}`,
  }));

  const unique = new Map<string, CaptureMode>();
  for (const mode of all) {
    // Stejné rozlišení a fps v obou režimech – přednost má běžná session (víc funkcí).
    const id = `${mode.width}x${mode.height}@${mode.fps}`;
    const existing = unique.get(id);
    if (!existing || (existing.highSpeed && !mode.highSpeed)) unique.set(id, mode);
  }

  return [...unique.values()].sort(
    (a, b) => b.fps - a.fps || b.width * b.height - a.width * a.height
  );
}

export function maxFps(camera: CameraInfo): number {
  return buildModes(camera)[0]?.fps ?? 30;
}

export function resolutionLabel(width: number, height: number): string {
  const short = Math.min(width, height);
  if (short >= 2160) return '4K';
  return `${short}p`;
}

export function cameraLabel(camera: CameraInfo, index: number, all: CameraInfo[]): string {
  const facing = camera.facing === 'front' ? 'Přední' : camera.facing === 'back' ? 'Zadní' : 'Externí';
  const sameFacing = all.filter((c) => c.facing === camera.facing);
  const focal = camera.focalLengths[0];
  const focalText = focal ? ` ${focal.toFixed(1)} mm` : '';
  if (sameFacing.length <= 1) return facing;
  return `${facing} ${sameFacing.indexOf(camera) + 1}${focalText}`;
}

/**
 * Zpracování časového záznamu vibrací (podle „Časový záznam signálu“):
 * 0-P, P-P, AVG = Σ|y|/N, RMS = √(Σy²/N), frekvence, perioda, spektrum.
 */

export type Axis = 'main' | 'x' | 'y';

export type SignalShape = 'sine' | 'square' | 'impacts' | 'mixed';

export type SignalStats = {
  n: number;
  durationS: number;
  sampleRate: number;
  zeroPeak: number;
  peakPeak: number;
  avg: number;
  rms: number;
  /** 0-P / RMS (sinus 1,41). */
  crest: number;
  /** AVG / 0-P (sinus 0,64). */
  avgRatio: number;
  /** RMS / 0-P (sinus 0,71). */
  rmsRatio: number;
  shape: SignalShape;
};

export type Spectrum = { freqs: number[]; amps: number[]; df: number };

export type Peak = { hz: number; amp: number };

export type VibrationAnalysis = {
  axis: Axis;
  /** Úhel hlavního směru kmitání od vodorovné osy [°]. */
  mainAngleDeg: number;
  t: number[]; // s, rovnoměrná mřížka
  y: number[]; // výchylka bez střední hodnoty a trendu
  stats: SignalStats;
  spectrum: Spectrum;
  dominant: Peak | null;
  peaks: Peak[];
  periods: number | null;
};

export const SHAPE_LABELS: Record<SignalShape, string> = {
  sine: 'sinusový (harmonický)',
  square: 'obdélníkový / lichoběžníkový',
  impacts: 'rázy (impulzy)',
  mixed: 'smíšený',
};

export const SHAPE_HINTS: Record<SignalShape, string> = {
  sine: 'AVG ≈ 0,64 × 0-P a RMS ≈ 0,71 × 0-P – typicky nevyváženost na otáčkové frekvenci.',
  square: 'AVG i RMS jsou blízko 0-P – signál „drží“ v krajních polohách (vůle, uvolnění).',
  impacts: 'Špička je mnohem větší než RMS – krátké rázy (ložiska, ozubení, uvolněné díly).',
  mixed: 'Mezi sinusem a rázy – kombinace více zdrojů vibrací.',
};

/** Převzorkuje na rovnoměrnou časovou mřížku (časové značky snímků mírně kolísají). */
export function resampleUniform(timesMs: number[], values: number[]): { t: number[]; y: number[]; dt: number } {
  const diffs = timesMs.slice(1).map((v, i) => v - timesMs[i]).filter((d) => d > 0).sort((a, b) => a - b);
  const dtMs = diffs[Math.floor(diffs.length / 2)] ?? 1000 / 30;
  const end = timesMs[timesMs.length - 1];
  const t: number[] = [];
  const y: number[] = [];
  let j = 0;
  for (let ms = 0; ms <= end + 1e-6; ms += dtMs) {
    while (j < timesMs.length - 2 && timesMs[j + 1] < ms) j++;
    const t0 = timesMs[j];
    const t1 = timesMs[j + 1] ?? t0;
    const f = t1 > t0 ? Math.min(1, Math.max(0, (ms - t0) / (t1 - t0))) : 0;
    t.push(ms / 1000);
    const v0 = values[j];
    const v1 = values[j + 1] ?? v0;
    y.push(v0 + (v1 - v0) * f);
  }
  return { t, y, dt: dtMs / 1000 };
}

/** Odstraní střední hodnotu a lineární trend (klidová poloha, pomalý drift kamery). */
export function detrend(t: number[], y: number[]): number[] {
  const n = y.length;
  const mt = t.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (t[i] - mt) * (y[i] - my);
    den += (t[i] - mt) ** 2;
  }
  const slope = den > 0 ? num / den : 0;
  return y.map((v, i) => v - my - slope * (t[i] - mt));
}

/** Hlavní směr kmitání (vlastní vektor kovarianční matice). */
export function mainDirection(dx: number[], dy: number[]): { ux: number; uy: number; angleDeg: number } {
  const n = dx.length;
  const mx = dx.reduce((a, b) => a + b, 0) / n;
  const my = dy.reduce((a, b) => a + b, 0) / n;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    const a = dx[i] - mx;
    const b = dy[i] - my;
    sxx += a * a;
    syy += b * b;
    sxy += a * b;
  }
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  return { ux: Math.cos(angle), uy: Math.sin(angle), angleDeg: (-angle * 180) / Math.PI };
}

export function computeStats(y: number[], sampleRate: number): SignalStats {
  const n = y.length;
  let max = -Infinity;
  let min = Infinity;
  let sumAbs = 0;
  let sumSq = 0;
  for (const v of y) {
    if (v > max) max = v;
    if (v < min) min = v;
    sumAbs += Math.abs(v);
    sumSq += v * v;
  }
  const zeroPeak = Math.max(Math.abs(max), Math.abs(min));
  const avg = sumAbs / n;
  const rms = Math.sqrt(sumSq / n);
  const avgRatio = zeroPeak > 0 ? avg / zeroPeak : 0;
  const rmsRatio = zeroPeak > 0 ? rms / zeroPeak : 0;
  let shape: SignalShape;
  if (rmsRatio >= 0.85) shape = 'square';
  else if (rmsRatio >= 0.62 && rmsRatio <= 0.78 && avgRatio >= 0.55 && avgRatio <= 0.72) shape = 'sine';
  else if (rmsRatio < 0.45) shape = 'impacts';
  else shape = 'mixed';
  return {
    n,
    durationS: n / sampleRate,
    sampleRate,
    zeroPeak,
    peakPeak: max - min,
    avg,
    rms,
    crest: rms > 0 ? zeroPeak / rms : 0,
    avgRatio,
    rmsRatio,
    shape,
  };
}

/** Amplitudové spektrum (0-P) s Hannovým oknem. */
export function spectrum(y: number[], sampleRate: number): Spectrum {
  const n = y.length;
  let size = 1;
  while (size < n) size <<= 1;
  size <<= 1; // doplnění nulami → jemnější mřížka frekvencí
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  let wsum = 0;
  for (let i = 0; i < n; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
    re[i] = y[i] * w;
    wsum += w;
  }
  fft(re, im);
  const half = size / 2;
  const df = sampleRate / size;
  const freqs: number[] = [];
  const amps: number[] = [];
  for (let k = 0; k <= half; k++) {
    freqs.push(k * df);
    amps.push((2 * Math.hypot(re[k], im[k])) / wsum);
  }
  return { freqs, amps, df };
}

/** Radix-2 FFT na místě. */
function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

/** Nejvyšší špičky spektra (lokální maxima), s parabolickým zpřesněním frekvence. */
export function findPeaks(spec: Spectrum, minHz: number, count = 5): Peak[] {
  const { freqs, amps, df } = spec;
  const found: Peak[] = [];
  for (let k = 1; k < amps.length - 1; k++) {
    if (freqs[k] < minHz) continue;
    if (amps[k] > amps[k - 1] && amps[k] >= amps[k + 1]) {
      const a = amps[k - 1];
      const b = amps[k];
      const c = amps[k + 1];
      const denom = a - 2 * b + c;
      const p = denom !== 0 ? (0.5 * (a - c)) / denom : 0;
      found.push({ hz: freqs[k] + p * df, amp: b - 0.25 * (a - c) * p });
    }
  }
  return found.sort((x, y) => y.amp - x.amp).slice(0, count);
}

export function analyze(
  timesMs: number[],
  dx: number[],
  dy: number[],
  axis: Axis,
  scale: number
): VibrationAnalysis {
  // Směr kmitání určujeme až po odstranění pomalého driftu.
  const ts = timesMs.map((ms) => ms / 1000);
  const cx = detrend(ts, dx);
  const cy = detrend(ts, dy);
  const dir = mainDirection(cx, cy);
  const raw = dx.map((x, i) => {
    if (axis === 'x') return x;
    if (axis === 'y') return -dy[i]; // nahoru = kladně
    return x * dir.ux + dy[i] * dir.uy;
  });
  const { t, y: uniform, dt } = resampleUniform(timesMs, raw);
  const y = detrend(t, uniform).map((v) => v * scale);
  const sampleRate = 1 / dt;
  const stats = computeStats(y, sampleRate);
  const spec = spectrum(y, sampleRate);
  // Pod ~1 Hz už jde spíš o drift než vibrace; zároveň aspoň 2 periody v záznamu.
  const minHz = Math.max(1, 2 / stats.durationS);
  const peaks = findPeaks(spec, minHz);
  const dominant = peaks[0] ?? null;
  return {
    axis,
    mainAngleDeg: dir.angleDeg,
    t,
    y,
    stats,
    spectrum: spec,
    dominant,
    peaks,
    periods: dominant ? dominant.hz * stats.durationS : null,
  };
}

/** Odhad efektivní rychlosti vibrací pro převážně sinusový průběh: v = 2πf·x (mm → mm/s). */
export function velocityRmsEstimate(rmsMm: number, hz: number): number {
  return 2 * Math.PI * hz * rmsMm;
}

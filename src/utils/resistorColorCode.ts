export interface ResistorBandColor {
  id: string;
  nameCz: string;
  /** Reference sRGB triplet used for nearest-color matching (0-255 each). */
  rgb: [number, number, number];
  /** Significant digit this color represents, or null if it cannot be a digit band. */
  digit: number | null;
  /** Multiplier this color represents when used as the multiplier band. */
  multiplier: number | null;
  /** Tolerance in percent when used as the tolerance band, or null if not used that way. */
  tolerancePercent: number | null;
  /** Temperature coefficient in ppm/K when used as the 6th band, or null. */
  tempCoPpm: number | null;
}

// Reference colors are standard approximations of the EIA/IEC 60062 resistor
// color code. Real paint pigments vary with lighting and manufacturer, so
// these are a starting point for nearest-color matching, not exact swatches.
export const RESISTOR_BAND_COLORS: ResistorBandColor[] = [
  { id: 'black', nameCz: 'černá', rgb: [25, 25, 25], digit: 0, multiplier: 1, tolerancePercent: null, tempCoPpm: null },
  { id: 'brown', nameCz: 'hnědá', rgb: [130, 72, 22], digit: 1, multiplier: 10, tolerancePercent: 1, tempCoPpm: 100 },
  { id: 'red', nameCz: 'červená', rgb: [200, 20, 20], digit: 2, multiplier: 100, tolerancePercent: 2, tempCoPpm: 50 },
  { id: 'orange', nameCz: 'oranžová', rgb: [255, 140, 0], digit: 3, multiplier: 1_000, tolerancePercent: null, tempCoPpm: 15 },
  { id: 'yellow', nameCz: 'žlutá', rgb: [230, 210, 20], digit: 4, multiplier: 10_000, tolerancePercent: null, tempCoPpm: 25 },
  { id: 'green', nameCz: 'zelená', rgb: [30, 140, 30], digit: 5, multiplier: 100_000, tolerancePercent: 0.5, tempCoPpm: null },
  { id: 'blue', nameCz: 'modrá', rgb: [30, 70, 190], digit: 6, multiplier: 1_000_000, tolerancePercent: 0.25, tempCoPpm: null },
  { id: 'violet', nameCz: 'fialová', rgb: [140, 40, 150], digit: 7, multiplier: 10_000_000, tolerancePercent: 0.1, tempCoPpm: null },
  { id: 'grey', nameCz: 'šedá', rgb: [130, 130, 130], digit: 8, multiplier: 100_000_000, tolerancePercent: null, tempCoPpm: null },
  { id: 'white', nameCz: 'bílá', rgb: [235, 235, 235], digit: 9, multiplier: null, tolerancePercent: null, tempCoPpm: null },
  { id: 'gold', nameCz: 'zlatá', rgb: [212, 175, 55], digit: null, multiplier: 0.1, tolerancePercent: 5, tempCoPpm: null },
  { id: 'silver', nameCz: 'stříbrná', rgb: [192, 192, 192], digit: null, multiplier: 0.01, tolerancePercent: 10, tempCoPpm: null },
];

export function findBandColorById(id: string): ResistorBandColor | undefined {
  return RESISTOR_BAND_COLORS.find((c) => c.id === id);
}

// --- Perceptual nearest-color matching (CIE Lab space) ---

function srgbChannelToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function rgbToLab(rgb: [number, number, number]): [number, number, number] {
  const r = srgbChannelToLinear(rgb[0]);
  const g = srgbChannelToLinear(rgb[1]);
  const b = srgbChannelToLinear(rgb[2]);

  // sRGB -> XYZ (D65)
  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  const xn = x / 0.95047;
  const yn = y / 1.0;
  const zn = z / 1.08883;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(xn);
  const fy = f(yn);
  const fz = f(zn);

  const L = 116 * fy - 16;
  const A = 500 * (fx - fy);
  const B = 200 * (fy - fz);
  return [L, A, B];
}

function labDistance(a: [number, number, number], b: [number, number, number]): number {
  const dl = a[0] - b[0];
  const da = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dl * dl + da * da + db * db);
}

export interface ColorMatch {
  color: ResistorBandColor;
  distance: number;
}

/** Finds the nearest resistor band color to a sampled RGB triplet, ranked by perceptual (Lab) distance. */
export function matchBandColor(rgb: [number, number, number]): ColorMatch {
  const lab = rgbToLab(rgb);
  let best: ColorMatch | null = null;
  for (const color of RESISTOR_BAND_COLORS) {
    const distance = labDistance(lab, rgbToLab(color.rgb));
    if (!best || distance < best.distance) {
      best = { color, distance };
    }
  }
  return best as ColorMatch;
}

/** Perceptual distance between two arbitrary RGB triplets (used for body/background detection). */
export function rgbLabDistance(a: [number, number, number], b: [number, number, number]): number {
  return labDistance(rgbToLab(a), rgbToLab(b));
}

export function formatOhms(ohms: number): string {
  if (ohms >= 1_000_000_000) {
    const num = ohms / 1_000_000_000;
    return `${trimNumber(num)} GΩ`;
  }
  if (ohms >= 1_000_000) {
    const num = ohms / 1_000_000;
    return `${trimNumber(num)} MΩ`;
  }
  if (ohms >= 1_000) {
    const num = ohms / 1_000;
    return `${trimNumber(num)} kΩ`;
  }
  return `${trimNumber(ohms)} Ω`;
}

function trimNumber(num: number): string {
  return Number.isInteger(num) ? String(num) : num.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export interface DecodedResistor {
  ohms: number;
  formattedValue: string;
  tolerancePercent: number | null;
  tempCoPpm: number | null;
  bandCount: number;
}

/**
 * Decodes an ordered (left-to-right) sequence of 3-6 band colors into a resistance value.
 * Returns null if the sequence isn't a valid band count or a digit slot holds a
 * color that can't represent a digit (gold/silver used as a significant digit).
 */
export function decodeBands(bands: ResistorBandColor[]): DecodedResistor | null {
  const n = bands.length;
  if (n < 3 || n > 6) return null;

  const digitCount = n === 3 ? 2 : n === 4 ? 2 : n === 5 ? 3 : 3; // 6-band also has 3 digits
  const digitBands = bands.slice(0, digitCount);
  const multiplierBand = bands[digitCount];
  const toleranceBand = n >= 4 ? bands[digitCount + 1] : null;
  const tempCoBand = n === 6 ? bands[5] : null;

  if (digitBands.some((b) => b.digit === null)) return null;
  if (multiplierBand.multiplier === null) return null;

  const digitsValue = Number(digitBands.map((b) => b.digit).join(''));
  const ohms = digitsValue * multiplierBand.multiplier;

  const tolerancePercent = n === 3 ? 20 : (toleranceBand?.tolerancePercent ?? null);

  return {
    ohms,
    formattedValue: formatOhms(ohms),
    tolerancePercent,
    tempCoPpm: tempCoBand?.tempCoPpm ?? null,
    bandCount: n,
  };
}

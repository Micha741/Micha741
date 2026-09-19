import { decode as decodeJpeg } from 'jpeg-js';
import {
  matchBandColor,
  rgbLabDistance,
  type ResistorBandColor,
} from './resistorColorCode';

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decodes a base64 string (no data: prefix) into raw bytes, without relying on atob/Buffer. */
export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const byteLength = Math.floor((clean.length * 3) / 4) - (clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0);
  const bytes = new Uint8Array(byteLength);

  let byteIndex = 0;
  let buffer = 0;
  let bitsCollected = 0;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char === '=') break;
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bitsCollected += 6;
    if (bitsCollected >= 8) {
      bitsCollected -= 8;
      bytes[byteIndex++] = (buffer >> bitsCollected) & 0xff;
    }
  }
  return bytes;
}

export interface DetectedBand {
  color: ResistorBandColor;
  sampledRgb: [number, number, number];
  distance: number;
  /** Fraction (0-1) of the strip width this band occupies, left to right. */
  startFraction: number;
  widthFraction: number;
}

export interface BandScanResult {
  bands: DetectedBand[];
  bodyRgb: [number, number, number];
}

const EDGE_THRESHOLD = 7; // Lab distance considered a band boundary
const MIN_SEGMENT_FRACTION = 0.02; // ignore slivers narrower than this
const BODY_MATCH_THRESHOLD = 6; // Lab distance below which a segment is "the same as body"
const SMOOTHING_WINDOW = 3;

/**
 * Scans a small JPEG image (expected to be a cropped, resized horizontal strip
 * of a resistor body) and returns the color bands detected along its length,
 * left to right, with the body/background color already filtered out.
 */
export function scanResistorBandsFromJpegBase64(base64: string): BandScanResult {
  const bytes = base64ToBytes(base64);
  const { width, height, data } = decodeJpeg(bytes, { useTArray: true, formatAsRGBA: false });

  if (width < 4 || height < 1) {
    return { bands: [], bodyRgb: [0, 0, 0] };
  }

  const columns = averageColumns(data, width, height);
  const smoothed = smoothColumns(columns, SMOOTHING_WINDOW);
  const segments = segmentColumns(smoothed);
  const filtered = segments.filter((s) => s.width / width >= MIN_SEGMENT_FRACTION);

  if (filtered.length === 0) {
    return { bands: [], bodyRgb: [0, 0, 0] };
  }

  // The body/background of the resistor is assumed to be whichever segment
  // covers the most total width - bands are narrow compared to the gaps
  // of body color between them.
  const bodySegment = filtered.reduce((a, b) => (b.width > a.width ? b : a));
  const bodyRgb = bodySegment.avgRgb;

  const bandSegments = filtered.filter(
    (s) => rgbLabDistance(s.avgRgb, bodyRgb) > BODY_MATCH_THRESHOLD
  );

  let bands: DetectedBand[] = bandSegments.map((s) => {
    const match = matchBandColor(s.avgRgb);
    return {
      color: match.color,
      sampledRgb: s.avgRgb,
      distance: match.distance,
      startFraction: s.start / width,
      widthFraction: s.width / width,
    };
  });

  // Convention: the tolerance band (gold/silver) sits on the right. If the
  // leftmost detected band is metallic and the rightmost isn't, the strip
  // was most likely scanned right-to-left - flip it.
  if (bands.length >= 3) {
    const first = bands[0].color.id;
    const last = bands[bands.length - 1].color.id;
    const isMetallic = (id: string) => id === 'gold' || id === 'silver';
    if (isMetallic(first) && !isMetallic(last)) {
      bands = [...bands].reverse();
    }
  }

  return { bands, bodyRgb };
}

function averageColumns(data: Uint8Array, width: number, height: number): Array<[number, number, number]> {
  const columns: Array<[number, number, number]> = new Array(width);
  for (let x = 0; x < width; x++) {
    let r = 0;
    let g = 0;
    let b = 0;
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 3;
      r += data[idx];
      g += data[idx + 1];
      b += data[idx + 2];
    }
    columns[x] = [r / height, g / height, b / height];
  }
  return columns;
}

function smoothColumns(
  columns: Array<[number, number, number]>,
  window: number
): Array<[number, number, number]> {
  const half = Math.floor(window / 2);
  return columns.map((_, i) => {
    const lo = Math.max(0, i - half);
    const hi = Math.min(columns.length - 1, i + half);
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let j = lo; j <= hi; j++) {
      r += columns[j][0];
      g += columns[j][1];
      b += columns[j][2];
      count++;
    }
    return [r / count, g / count, b / count] as [number, number, number];
  });
}

interface RawSegment {
  start: number;
  width: number;
  avgRgb: [number, number, number];
}

function segmentColumns(columns: Array<[number, number, number]>): RawSegment[] {
  const boundaries: number[] = [0];
  for (let i = 1; i < columns.length; i++) {
    if (rgbLabDistance(columns[i], columns[i - 1]) > EDGE_THRESHOLD) {
      boundaries.push(i);
    }
  }
  boundaries.push(columns.length);

  const segments: RawSegment[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i];
    const end = boundaries[i + 1];
    const width = end - start;
    if (width <= 0) continue;

    // Trim a small margin near each edge of the segment so the average isn't
    // pulled toward a neighboring color by the smoothing window.
    const margin = Math.floor(width * 0.15);
    const trimStart = width > 4 ? start + margin : start;
    const trimEnd = width > 4 ? end - margin : end;

    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let x = trimStart; x < trimEnd; x++) {
      r += columns[x][0];
      g += columns[x][1];
      b += columns[x][2];
      count++;
    }
    if (count === 0) continue;

    segments.push({ start, width, avgRgb: [r / count, g / count, b / count] });
  }
  return segments;
}

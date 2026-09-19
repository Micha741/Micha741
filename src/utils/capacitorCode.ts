// Standardized capacitor marking codes (independent of any single source):
// 3-digit pF code (same shape as the resistor 3-digit code, but base unit pF),
// EIA tolerance letters and a common subset of EIA voltage codes.

export const CAPACITOR_TOLERANCE_LETTERS: Record<string, string> = {
  B: '±0,1 pF',
  C: '±0,25 pF',
  D: '±0,5 pF',
  F: '±1 %',
  G: '±2 %',
  J: '±5 %',
  K: '±10 %',
  M: '±20 %',
  Z: '+80 % / −20 %',
  P: '+100 % / −0 %',
};

export const CAPACITOR_VOLTAGE_CODES: Record<string, number> = {
  '0G': 4,
  '0J': 6.3,
  '1A': 10,
  '1C': 16,
  '1E': 25,
  '1V': 35,
  '1H': 50,
  '2A': 100,
  '2D': 200,
  '2E': 250,
  '2G': 400,
  '2W': 450,
};

export interface CapacitorDecodeResult {
  /** Capacitance in farads. */
  farads: number;
  formattedValue: string;
  tolerance: { code: string; label: string } | null;
  voltage: { code: string; volts: number } | null;
}

/** Parses an "R-notation" pF value where R stands in for the decimal point (e.g. "4R7" -> 4.7). */
function parseRNotationPf(code: string): number | null {
  const parts = code.split('R');
  if (parts.length !== 2) return null;
  const [intPart, fracPart] = parts;
  if (intPart === '' && fracPart === '') return null;
  if (!/^\d*$/.test(intPart) || !/^\d*$/.test(fracPart)) return null;
  const value = Number(`${intPart || '0'}.${fracPart || '0'}`);
  return Number.isFinite(value) ? value : null;
}

/** Decodes the value portion (with tolerance/voltage suffixes already stripped) into picofarads. */
function decodeValuePf(code: string): number | null {
  if (code.includes('R')) {
    return parseRNotationPf(code);
  }
  if (/^\d{3}$/.test(code)) {
    const significand = Number(code.slice(0, 2));
    const multiplierDigit = Number(code[2]);
    // Digit 8 -> ×0.01, digit 9 -> ×0.1 (used for sub-10pF values), otherwise ×10^digit.
    const multiplier =
      multiplierDigit === 8 ? 0.01 : multiplierDigit === 9 ? 0.1 : Math.pow(10, multiplierDigit);
    return significand * multiplier;
  }
  if (/^\d{1,2}$/.test(code)) {
    // Small ceramics are sometimes marked with the plain pF value, no multiplier digit.
    return Number(code);
  }
  return null;
}

export function formatFarads(farads: number): string {
  if (farads >= 1) return `${trimNumber(farads)} F`;
  if (farads >= 1e-3) return `${trimNumber(farads * 1e3)} mF`;
  if (farads >= 1e-6) return `${trimNumber(farads * 1e6)} µF`;
  if (farads >= 1e-9) return `${trimNumber(farads * 1e9)} nF`;
  return `${trimNumber(farads * 1e12)} pF`;
}

function trimNumber(num: number): string {
  return Number.isInteger(num) ? String(num) : num.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

/**
 * Decodes a capacitor marking code: the 3-digit pF code (with optional "R"
 * decimal-point notation for sub-10pF values), an optional trailing EIA
 * tolerance letter, and an optional trailing 2-character EIA voltage code.
 * Returns null if the code doesn't match any known format.
 */
export function decodeCapacitorCode(raw: string): CapacitorDecodeResult | null {
  let code = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (code.length === 0) return null;

  let voltage: { code: string; volts: number } | null = null;
  const last2 = code.slice(-2);
  if (CAPACITOR_VOLTAGE_CODES[last2] !== undefined) {
    voltage = { code: last2, volts: CAPACITOR_VOLTAGE_CODES[last2] };
    code = code.slice(0, -2);
  }

  let tolerance: { code: string; label: string } | null = null;
  const lastChar = code.slice(-1);
  if (CAPACITOR_TOLERANCE_LETTERS[lastChar] !== undefined) {
    tolerance = { code: lastChar, label: CAPACITOR_TOLERANCE_LETTERS[lastChar] };
    code = code.slice(0, -1);
  }

  const pf = decodeValuePf(code);
  if (pf === null) return null;

  const farads = pf * 1e-12;
  return {
    farads,
    formattedValue: formatFarads(farads),
    tolerance,
    voltage,
  };
}

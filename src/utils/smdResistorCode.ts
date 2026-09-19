import { formatOhms } from './resistorColorCode';

// EIA-96 significant-figure table (index "01"-"96" -> 3-digit significand).
// Standardized E96 series values, independent of any single source.
const EIA96_VALUES: Record<string, number> = {
  '01': 100, '02': 102, '03': 105, '04': 107, '05': 110, '06': 113, '07': 115, '08': 118,
  '09': 121, '10': 124, '11': 127, '12': 130, '13': 133, '14': 137, '15': 140, '16': 143,
  '17': 147, '18': 150, '19': 154, '20': 158, '21': 162, '22': 165, '23': 169, '24': 174,
  '25': 178, '26': 182, '27': 187, '28': 191, '29': 196, '30': 200, '31': 205, '32': 210,
  '33': 215, '34': 221, '35': 226, '36': 232, '37': 237, '38': 243, '39': 249, '40': 255,
  '41': 261, '42': 267, '43': 274, '44': 280, '45': 287, '46': 294, '47': 301, '48': 309,
  '49': 316, '50': 324, '51': 332, '52': 340, '53': 348, '54': 357, '55': 365, '56': 374,
  '57': 383, '58': 392, '59': 402, '60': 412, '61': 422, '62': 432, '63': 442, '64': 453,
  '65': 464, '66': 475, '67': 487, '68': 499, '69': 511, '70': 523, '71': 536, '72': 549,
  '73': 562, '74': 576, '75': 590, '76': 604, '77': 619, '78': 634, '79': 649, '80': 665,
  '81': 681, '82': 698, '83': 715, '84': 732, '85': 750, '86': 768, '87': 787, '88': 806,
  '89': 825, '90': 845, '91': 866, '92': 887, '93': 909, '94': 931, '95': 953, '96': 976,
};

// EIA-96 multiplier letters -> power-of-ten multiplier.
const EIA96_MULTIPLIERS: Record<string, number> = {
  Z: 0.001,
  Y: 0.01,
  R: 0.01,
  X: 0.1,
  S: 0.1,
  A: 1,
  B: 10,
  H: 10,
  C: 100,
  D: 1_000,
  E: 10_000,
  F: 100_000,
};

export type SmdCodeType = 'jumper' | 'r-notation' | '3-digit' | '4-digit' | 'eia-96';

export interface SmdDecodeResult {
  ohms: number;
  formattedValue: string;
  codeType: SmdCodeType;
}

/** Parses an "R-notation" code where R stands in for the decimal point (e.g. "4R7" -> 4.7, "R47" -> 0.47). */
function parseRNotation(code: string): number | null {
  const parts = code.split('R');
  if (parts.length !== 2) return null;
  const [intPart, fracPart] = parts;
  if (intPart === '' && fracPart === '') return null;
  if (!/^\d*$/.test(intPart) || !/^\d*$/.test(fracPart)) return null;
  const combined = `${intPart || '0'}.${fracPart || '0'}`;
  const value = Number(combined);
  return Number.isFinite(value) ? value : null;
}

/**
 * Decodes an SMD resistor marking code: 3-digit and 4-digit numeric codes
 * (with optional "R" standing in for a decimal point), the EIA-96 code
 * (two digits + one multiplier letter), and 0-ohm/jumper markings.
 * Returns null if the code doesn't match any known format.
 */
export function decodeSmdCode(raw: string): SmdDecodeResult | null {
  const code = raw.trim().toUpperCase();
  if (code.length === 0) return null;

  if (/^0+$/.test(code)) {
    return { ohms: 0, formattedValue: '0 Ω (propojka)', codeType: 'jumper' };
  }

  const eia96Match = /^(\d{2})([A-Z])$/.exec(code);
  if (eia96Match) {
    const [, digits, letter] = eia96Match;
    const significand = EIA96_VALUES[digits];
    const multiplier = EIA96_MULTIPLIERS[letter];
    if (significand === undefined || multiplier === undefined) return null;
    const ohms = significand * multiplier;
    return { ohms, formattedValue: formatOhms(ohms), codeType: 'eia-96' };
  }

  if (code.includes('R')) {
    const ohms = parseRNotation(code);
    if (ohms === null) return null;
    const digitCount = code.replace('R', '').length;
    return {
      ohms,
      formattedValue: formatOhms(ohms),
      codeType: digitCount >= 3 ? '4-digit' : '3-digit',
    };
  }

  if (/^\d{3}$/.test(code)) {
    const significand = Number(code.slice(0, 2));
    const multiplier = Number(code[2]);
    const ohms = significand * Math.pow(10, multiplier);
    return { ohms, formattedValue: formatOhms(ohms), codeType: '3-digit' };
  }

  if (/^\d{4}$/.test(code)) {
    const significand = Number(code.slice(0, 3));
    const multiplier = Number(code[3]);
    const ohms = significand * Math.pow(10, multiplier);
    return { ohms, formattedValue: formatOhms(ohms), codeType: '4-digit' };
  }

  return null;
}

export const SMD_CODE_TYPE_LABELS: Record<SmdCodeType, string> = {
  jumper: '0 Ω / propojka',
  'r-notation': 'přímý zápis (R = desetinná čárka)',
  '3-digit': '3místný kód (tolerance 5 %)',
  '4-digit': '4místný kód (tolerance 1 %)',
  'eia-96': 'EIA-96 kód (přesné 1% rezistory)',
};

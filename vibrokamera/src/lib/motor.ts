export type MotorType = 'ac' | 'dc' | 'custom';

export type MotorSettings = {
  type: MotorType;
  /** Nejvyšší očekávané otáčky (ot/min) – od nich se odvíjí kontrola fps. */
  maxRpm: number;
  /** Jmenovité otáčky ze štítku (ot/min), nepovinné – pomáhají vybrat správný výsledek při aliasingu. */
  nominalRpm: number | null;
};

export const MOTOR_PRESETS: Record<MotorType, { label: string; maxRpm: number; hint: string }> = {
  ac: {
    label: 'AC motor',
    maxRpm: 3600,
    hint: 'Střídavý motor na síti: max. 3 000 ot/min při 50 Hz, 3 600 ot/min při 60 Hz (2pólový). S frekvenčním měničem může být víc.',
  },
  dc: {
    label: 'DC motor',
    maxRpm: 15000,
    hint: 'Stejnosměrný (kartáčový/BLDC) motor – běžně až ~15 000 ot/min, podle typu i víc.',
  },
  custom: {
    label: 'Vlastní',
    maxRpm: 6000,
    hint: 'Zadej nejvyšší otáčky, které stroj může mít.',
  },
};

export const DEFAULT_MOTOR: MotorSettings = { type: 'ac', maxRpm: 3600, nominalRpm: null };

export type CoverageLevel = 'good' | 'ok' | 'aliasing';

export type Coverage = {
  level: CoverageLevel;
  maxHz: number;
  nyquistHz: number;
  /** Kolik snímků připadne na jednu otáčku při max. otáčkách. */
  framesPerRev: number;
  /** fps potřebné pro bezpečné měření (min. 4 snímky na otáčku). */
  recommendedFps: number;
  message: string;
};

/**
 * Posoudí, jestli daná snímková frekvence stačí na otáčky motoru.
 * Teoretické minimum jsou 2 snímky na otáčku (Nyquist), prakticky je
 * potřeba aspoň ~4, aby šlo spolehlivě poznat směr a polohu značky.
 */
export function coverage(fps: number, motor: MotorSettings): Coverage {
  const maxHz = motor.maxRpm / 60;
  const nyquistHz = fps / 2;
  const framesPerRev = maxHz > 0 ? fps / maxHz : Infinity;
  const recommendedFps = Math.ceil(maxHz * 4);
  const rpm = (hz: number) => Math.round(hz * 60).toLocaleString('cs-CZ');

  let level: CoverageLevel;
  let message: string;
  if (framesPerRev >= 8) {
    level = 'good';
    message = `Do ${rpm(maxHz)} ot/min: ${framesPerRev.toFixed(1)} snímků na otáčku – plynulý pohyb.`;
  } else if (framesPerRev >= 2) {
    level = 'ok';
    message = `Do ${rpm(maxHz)} ot/min: jen ${framesPerRev.toFixed(1)} snímků na otáčku – měřitelné, ale pohyb je trhaný.`;
  } else {
    level = 'aliasing';
    message =
      `${rpm(maxHz)} ot/min (${maxHz.toFixed(0)} Hz) je nad limitem ${rpm(nyquistHz)} ot/min při ${fps} fps. ` +
      `Rychlé otáčky se zobrazí stroboskopicky (zdánlivě pomaleji nebo pozpátku) – ` +
      `aplikace z nich dopočítá možné skutečné otáčky.`;
  }
  return { level, maxHz, nyquistHz, framesPerRev, recommendedFps, message };
}

export type AliasCandidate = { hz: number; rpm: number; k: number; sign: 1 | -1 };

/**
 * Při podvzorkování je naměřená (zdánlivá) frekvence fa = |f − k·fps|.
 * Vrátí všechny skutečné frekvence f = k·fps ± fa v rozsahu 0 … maxRpm,
 * seřazené podle blízkosti ke jmenovitým otáčkám (pokud jsou zadané).
 */
export function aliasCandidates(apparentHz: number, fps: number, motor: MotorSettings): AliasCandidate[] {
  const maxHz = motor.maxRpm / 60;
  const result: AliasCandidate[] = [];
  for (let k = 0; k * fps - apparentHz <= maxHz * 1.05; k++) {
    for (const sign of [1, -1] as const) {
      if (k === 0 && sign === -1) continue;
      const hz = k * fps + sign * apparentHz;
      if (hz > 0 && hz <= maxHz * 1.05) result.push({ hz, rpm: hz * 60, k, sign });
    }
  }
  const unique = result.filter(
    (c, i) => result.findIndex((o) => Math.abs(o.hz - c.hz) < 1e-6) === i
  );
  const nominal = motor.nominalRpm;
  return unique.sort((a, b) =>
    nominal ? Math.abs(a.rpm - nominal) - Math.abs(b.rpm - nominal) : a.hz - b.hz
  );
}

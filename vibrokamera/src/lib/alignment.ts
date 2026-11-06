import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

/**
 * Vyrovnání telefonu vůči stroji a kontrola otřesů z akcelerometru.
 *
 * Konvence Androidu (v g): telefon na výšku svisle → y ≈ +1, displejem nahoru → z ≈ +1.
 * Bez reference je cílem svislý telefon (kamera vodorovně, kolmo na svislou stěnu stroje).
 * S referencí („přilož telefon zády ke stroji“) se měří odchylka od té polohy – kamera
 * pak míří kolmo na plochu stroje i když není svislá.
 *
 * Pozn.: natočení kolem svislé osy (doleva/doprava) gravitace neukáže; kompas je u
 * motorů nepoužitelný (magnetické pole), proto je to potřeba ohlídat okem podle mřížky.
 */
export type Vec3 = [number, number, number];

export const UPRIGHT: Vec3 = [0, 1, 0];

export type AlignmentLevel = 'good' | 'ok' | 'bad';

export type AlignmentState = {
  available: boolean;
  /** Celková odchylka od reference [°]. */
  totalDeg: number;
  /** Náklon kamery nahoru/dolů vůči referenci [°], + = kamera míří víc dolů. */
  pitchDeg: number;
  /** Pootočení kolem osy objektivu [°], + = po směru hodin. */
  rollDeg: number;
  level: AlignmentLevel;
  /** Efektivní hodnota otřesů [g] za poslední ~1 s. */
  shakeG: number;
  shakeLevel: AlignmentLevel;
  gravity: Vec3;
};

const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const deg = (r: number) => (r * 180) / Math.PI;
const pitchOf = (g: Vec3) => deg(Math.asin(Math.max(-1, Math.min(1, g[2]))));
const rollOf = (g: Vec3) => deg(Math.atan2(-g[0], g[1]));

export function alignmentLevel(totalDeg: number): AlignmentLevel {
  return totalDeg <= 2 ? 'good' : totalDeg <= 5 ? 'ok' : 'bad';
}

export function shakeLevel(shakeG: number): AlignmentLevel {
  return shakeG <= 0.012 ? 'good' : shakeG <= 0.035 ? 'ok' : 'bad';
}

export function useAlignment(enabled: boolean, reference: Vec3 | null): AlignmentState {
  const [state, setState] = useState<AlignmentState>({
    available: false,
    totalDeg: 0,
    pitchDeg: 0,
    rollDeg: 0,
    level: 'good',
    shakeG: 0,
    shakeLevel: 'good',
    gravity: UPRIGHT,
  });
  const ref = useRef<Vec3>(reference ? norm(reference) : UPRIGHT);
  ref.current = reference ? norm(reference) : UPRIGHT;

  useEffect(() => {
    if (!enabled) return;
    let gravity: Vec3 | null = null;
    let meanMag = 1;
    const window: number[] = [];
    let lastEmit = 0;
    let cancelled = false;
    let sub: { remove: () => void } | null = null;

    Accelerometer.isAvailableAsync()
      .then((ok) => {
        if (!ok || cancelled) return;
        Accelerometer.setUpdateInterval(20);
        sub = Accelerometer.addListener(({ x, y, z }) => {
          const raw: Vec3 = [x, y, z];
          // Dolní propust → směr gravitace.
          gravity = gravity
            ? [gravity[0] * 0.9 + x * 0.1, gravity[1] * 0.9 + y * 0.1, gravity[2] * 0.9 + z * 0.1]
            : raw;
          // Otřesy: odchylka velikosti zrychlení od klouzavého průměru.
          const mag = Math.hypot(x, y, z);
          meanMag = meanMag * 0.95 + mag * 0.05;
          window.push(mag - meanMag);
          if (window.length > 50) window.shift();

          const now = Date.now();
          if (now - lastEmit < 200) return;
          lastEmit = now;
          const g = norm(gravity);
          const r = ref.current;
          const dot = Math.max(-1, Math.min(1, g[0] * r[0] + g[1] * r[1] + g[2] * r[2]));
          const totalDeg = deg(Math.acos(dot));
          const shakeG = Math.sqrt(window.reduce((a, v) => a + v * v, 0) / window.length);
          setState({
            available: true,
            totalDeg,
            pitchDeg: pitchOf(g) - pitchOf(r),
            rollDeg: Math.abs(r[2]) > 0.9 ? 0 : rollOf(g) - rollOf(r),
            level: alignmentLevel(totalDeg),
            shakeG,
            shakeLevel: shakeLevel(shakeG),
            gravity: g,
          });
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled]);

  return state;
}

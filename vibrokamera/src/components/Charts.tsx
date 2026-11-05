import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import { formatNumber } from '../lib/format';
import { useTheme } from '../lib/settings';

type RefLine = { value: number; label: string; color: string; dashed?: boolean };

/** Zmenší počet bodů pro kreslení (zachová minima a maxima v každém úseku). */
function decimate(x: number[], y: number[], maxPoints: number): { x: number[]; y: number[] } {
  if (x.length <= maxPoints) return { x, y };
  const bucket = Math.ceil(x.length / (maxPoints / 2));
  const ox: number[] = [];
  const oy: number[] = [];
  for (let i = 0; i < x.length; i += bucket) {
    let minI = i;
    let maxI = i;
    for (let j = i; j < Math.min(i + bucket, x.length); j++) {
      if (y[j] < y[minI]) minI = j;
      if (y[j] > y[maxI]) maxI = j;
    }
    for (const k of minI < maxI ? [minI, maxI] : [maxI, minI]) {
      ox.push(x[k]);
      oy.push(y[k]);
    }
  }
  return { x: ox, y: oy };
}

function useWidth(): [number, (e: LayoutChangeEvent) => void] {
  const [width, setWidth] = useState(0);
  return [width, (e) => setWidth(e.nativeEvent.layout.width)];
}

const PAD = { left: 44, right: 8, top: 8, bottom: 22 };

/** Časový záznam: výchylka v čase + referenční čáry (0-P, RMS, AVG). */
export function TimeChart({
  t,
  y,
  unit,
  height = 200,
  refLines = [],
  symmetric = true,
}: {
  t: number[];
  y: number[];
  unit: string;
  height?: number;
  refLines?: RefLine[];
  symmetric?: boolean;
}) {
  const { colors } = useTheme();
  const [width, onLayout] = useWidth();
  const maxAbs = Math.max(1e-9, ...y.map(Math.abs), ...refLines.map((r) => Math.abs(r.value)));
  const yMax = maxAbs * 1.1;
  const yMin = symmetric ? -yMax : 0;
  const tMax = t[t.length - 1] || 1;
  const w = Math.max(1, width - PAD.left - PAD.right);
  const h = height - PAD.top - PAD.bottom;
  const sx = (v: number) => PAD.left + (v / tMax) * w;
  const sy = (v: number) => PAD.top + ((yMax - v) / (yMax - yMin)) * h;
  const d = decimate(t, y, Math.max(100, Math.round(w * 1.5)));
  const points = d.x.map((v, i) => `${sx(v).toFixed(1)},${sy(d.y[i]).toFixed(1)}`).join(' ');
  const digits = yMax < 0.1 ? 3 : yMax < 10 ? 2 : 1;

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Rect x={PAD.left} y={PAD.top} width={w} height={h} fill="none" stroke={colors.chartGrid} />
          {symmetric && <Line x1={PAD.left} x2={PAD.left + w} y1={sy(0)} y2={sy(0)} stroke={colors.textMuted} strokeWidth={1} />}
          <Polyline points={points} fill="none" stroke={colors.chartLine} strokeWidth={1.5} />
          {refLines.map((r) => (
            <Line
              key={r.label}
              x1={PAD.left}
              x2={PAD.left + w}
              y1={sy(r.value)}
              y2={sy(r.value)}
              stroke={r.color}
              strokeWidth={1.5}
              strokeDasharray={r.dashed ? '6,4' : undefined}
            />
          ))}
          {refLines.map((r) => (
            <SvgText key={`${r.label}-t`} x={PAD.left + w - 4} y={sy(r.value) - 3} fill={r.color} fontSize={10} textAnchor="end">
              {r.label}
            </SvgText>
          ))}
          <SvgText x={PAD.left - 4} y={PAD.top + 9} fill={colors.textMuted} fontSize={10} textAnchor="end">
            {formatNumber(yMax, digits)}
          </SvgText>
          <SvgText x={PAD.left - 4} y={PAD.top + h} fill={colors.textMuted} fontSize={10} textAnchor="end">
            {formatNumber(yMin, digits)}
          </SvgText>
          <SvgText x={PAD.left - 4} y={sy(0) + 3} fill={colors.textMuted} fontSize={10} textAnchor="end">
            {symmetric ? `0 ${unit}` : ''}
          </SvgText>
          <SvgText x={PAD.left} y={height - 6} fill={colors.textMuted} fontSize={10}>
            0 s
          </SvgText>
          <SvgText x={PAD.left + w} y={height - 6} fill={colors.textMuted} fontSize={10} textAnchor="end">
            {formatNumber(tMax, 2)} s
          </SvgText>
        </Svg>
      )}
    </View>
  );
}

/** Spektrum: amplituda podle frekvence, se zvýrazněnými špičkami. */
export function SpectrumChart({
  freqs,
  amps,
  maxHz,
  peaks,
  markers = [],
  height = 180,
}: {
  freqs: number[];
  amps: number[];
  maxHz: number;
  peaks: { hz: number; amp: number }[];
  markers?: { hz: number; label: string }[];
  height?: number;
}) {
  const { colors } = useTheme();
  const [width, onLayout] = useWidth();
  const limit = freqs.findIndex((f) => f > maxHz);
  const fx = limit > 0 ? freqs.slice(0, limit) : freqs;
  const fy = limit > 0 ? amps.slice(0, limit) : amps;
  // Bez stejnosměrné složky (0 Hz) pro rozsah osy.
  const aMax = Math.max(1e-9, ...fy.slice(1)) * 1.15;
  const w = Math.max(1, width - PAD.left - PAD.right);
  const h = height - PAD.top - PAD.bottom;
  const sx = (v: number) => PAD.left + (v / maxHz) * w;
  const sy = (v: number) => PAD.top + (1 - Math.min(v, aMax) / aMax) * h;
  const d = decimate(fx, fy, Math.max(100, Math.round(w * 1.5)));
  const points = d.x.map((v, i) => `${sx(v).toFixed(1)},${sy(d.y[i]).toFixed(1)}`).join(' ');
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((p) => p * maxHz);

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Rect x={PAD.left} y={PAD.top} width={w} height={h} fill="none" stroke={colors.chartGrid} />
          {markers.map((m) =>
            m.hz <= maxHz ? (
              <Line key={m.label} x1={sx(m.hz)} x2={sx(m.hz)} y1={PAD.top} y2={PAD.top + h} stroke={colors.warning} strokeDasharray="4,4" />
            ) : null
          )}
          <Polyline points={points} fill="none" stroke={colors.chartLine} strokeWidth={1.5} />
          {peaks.slice(0, 3).map((p, i) => (
            <SvgText key={i} x={sx(p.hz)} y={sy(p.amp) - 4} fill={i === 0 ? colors.record : colors.text} fontSize={10} textAnchor="middle">
              {formatNumber(p.hz, 1)} Hz
            </SvgText>
          ))}
          {markers.map((m) =>
            m.hz <= maxHz ? (
              <SvgText key={`${m.label}-t`} x={sx(m.hz) + 3} y={PAD.top + 10} fill={colors.warning} fontSize={10}>
                {m.label}
              </SvgText>
            ) : null
          )}
          {ticks.map((f) => (
            <SvgText key={f} x={sx(f)} y={height - 6} fill={colors.textMuted} fontSize={10} textAnchor="middle">
              {formatNumber(f, 0)}
            </SvgText>
          ))}
          <SvgText x={PAD.left - 4} y={PAD.top + 9} fill={colors.textMuted} fontSize={10} textAnchor="end">
            {formatNumber(aMax, aMax < 0.1 ? 3 : 2)}
          </SvgText>
        </Svg>
      )}
    </View>
  );
}

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  record: string;
  warning: string;
  success: string;
  chartLine: string;
  chartGrid: string;
  overlay: string;
};

export const darkColors: ThemeColors = {
  background: '#0b0f14',
  surface: '#151b23',
  surfaceRaised: '#1f2732',
  border: '#2a3442',
  text: '#e8eef5',
  textMuted: '#8b98a8',
  accent: '#3fa7ff',
  accentText: '#04121f',
  record: '#ff453a',
  warning: '#ffb020',
  success: '#32d74b',
  chartLine: '#3fa7ff',
  chartGrid: '#2a3442',
  overlay: 'rgba(0,0,0,0.55)',
};

export const lightColors: ThemeColors = {
  background: '#f3f5f8',
  surface: '#ffffff',
  surfaceRaised: '#e8edf3',
  border: '#d3dae3',
  text: '#111821',
  textMuted: '#5d6b7c',
  accent: '#0a6fd6',
  accentText: '#ffffff',
  record: '#e0251b',
  warning: '#b86e00',
  success: '#1d8a3a',
  chartLine: '#0a6fd6',
  chartGrid: '#d3dae3',
  overlay: 'rgba(0,0,0,0.45)',
};

export type ThemeMode = 'system' | 'light' | 'dark';

/** Číslice stejné šířky (časovače, čísla snímků). */
export const TABULAR_NUMS: 'tabular-nums'[] = ['tabular-nums'];

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getThemeMode, setThemeMode, type ThemeMode } from '../db/appSettings';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryText: string;
  chipBackground: string;
  chipActiveBackground: string;
  fabBackground: string;
  danger: string;
  success: string;
  placeholder: string;
  statusBarStyle: 'light' | 'dark';
}

const lightColors: ThemeColors = {
  background: '#ffffff',
  surface: '#f7f7f8',
  card: '#ffffff',
  text: '#111111',
  textSecondary: '#666666',
  border: '#e0e0e0',
  primary: '#2f6fed',
  primaryText: '#ffffff',
  chipBackground: '#f0f0f0',
  chipActiveBackground: '#2f6fed',
  fabBackground: '#333333',
  danger: '#d64545',
  success: '#2e7d32',
  placeholder: '#999999',
  statusBarStyle: 'dark',
};

const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1c1c1e',
  card: '#1e1e20',
  text: '#f2f2f2',
  textSecondary: '#a0a0a3',
  border: '#333336',
  primary: '#5b8dff',
  primaryText: '#ffffff',
  chipBackground: '#2a2a2c',
  chipActiveBackground: '#5b8dff',
  fabBackground: '#2a2a2c',
  danger: '#ff6b6b',
  success: '#5ed165',
  placeholder: '#7a7a7d',
  statusBarStyle: 'light',
};

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    let cancelled = false;
    getThemeMode(db).then((stored) => {
      if (!cancelled) setModeState(stored);
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    setThemeMode(db, next).catch(() => {});
  };

  const toggleMode = () => setMode(mode === 'light' ? 'dark' : 'light');

  const colors = mode === 'dark' ? darkColors : lightColors;

  const value = useMemo(
    () => ({ mode, colors, toggleMode, setMode }),
    [mode, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

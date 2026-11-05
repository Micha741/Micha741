import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { loadSettings, saveSettings, type AppSettings } from './storage';
import { darkColors, lightColors, type ThemeColors } from './theme';

type SettingsContextValue = {
  settings: AppSettings;
  update: (next: AppSettings) => void;
  colors: ThemeColors;
  isDark: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const system = useColorScheme();
  const isDark = settings.theme === 'system' ? system !== 'light' : settings.theme === 'dark';

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      isDark,
      colors: isDark ? darkColors : lightColors,
      update: (next: AppSettings) => {
        setSettings(next);
        try {
          saveSettings(next);
        } catch {
          // Uložení selhalo – nastavení platí aspoň do restartu aplikace.
        }
      },
    }),
    [settings, isDark]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside SettingsProvider');
  return value;
}

export function useTheme() {
  const { colors, isDark } = useSettings();
  return { colors, isDark };
}

/** Styly závislé na barvách aktuálního motivu. */
export function useStyles<T extends StyleSheet.NamedStyles<T>>(factory: (c: ThemeColors) => T): T {
  const { colors } = useSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
}

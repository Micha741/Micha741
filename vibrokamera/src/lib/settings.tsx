import { createContext, useContext, useState, type ReactNode } from 'react';

import { loadSettings, saveSettings, type AppSettings } from './storage';

type SettingsContextValue = {
  settings: AppSettings;
  update: (next: AppSettings) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  const update = (next: AppSettings) => {
    setSettings(next);
    try {
      saveSettings(next);
    } catch {
      // Uložení selhalo – nastavení platí aspoň do restartu aplikace.
    }
  };

  return <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside SettingsProvider');
  return value;
}

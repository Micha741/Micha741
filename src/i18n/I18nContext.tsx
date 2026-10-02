import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getLocale, setLocale as persistLocale, type Locale } from '../db/appSettings';
import { cs, en, type TranslationKey } from './translations';

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { cs, en };

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in params ? String(params[key]) : match
  );
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [locale, setLocaleState] = useState<Locale>('cs');

  useEffect(() => {
    let cancelled = false;
    getLocale(db).then((stored) => {
      if (!cancelled) setLocaleState(stored);
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    persistLocale(db, next).catch(() => {});
  };

  const t = useMemo(() => {
    const dict = dictionaries[locale];
    return (key: TranslationKey, params?: Record<string, string | number>) =>
      interpolate(dict[key] ?? key, params);
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}

import { Pressable, StyleSheet, Text, View } from 'react-native';
import appConfig from '../../app.json';
import { getCodeLibraryVersion } from '../db/componentRepository';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import type { Locale } from '../db/appSettings';
import type { ThemeMode } from '../db/appSettings';

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const appVersion = appConfig.expo.version ?? '—';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Section title={t('settings.appearance')} colors={colors}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('settings.theme')}</Text>
        <SegmentedControl
          colors={colors}
          value={mode}
          options={[
            { value: 'light' as ThemeMode, label: t('settings.themeLight') },
            { value: 'dark' as ThemeMode, label: t('settings.themeDark') },
          ]}
          onChange={setMode}
        />
      </Section>

      <Section title={t('settings.language')} colors={colors}>
        <SegmentedControl
          colors={colors}
          value={locale}
          options={[
            { value: 'cs' as Locale, label: t('settings.languageCzech') },
            { value: 'en' as Locale, label: t('settings.languageEnglish') },
          ]}
          onChange={setLocale}
        />
      </Section>

      <Section title={t('settings.about')} colors={colors}>
        <Row label={t('settings.libraryVersion')} value={String(getCodeLibraryVersion())} colors={colors} />
        <Row label={t('settings.appVersion')} value={String(appVersion)} colors={colors} />
      </Section>
    </View>
  );
}

function Section({
  title,
  colors,
  children,
}: {
  title: string;
  colors: ReturnType<typeof useTheme>['colors'];
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      {children}
    </View>
  );
}

function Row({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text>
    </View>
  );
}

function SegmentedControl<T extends string>({
  colors,
  value,
  options,
  onChange,
}: {
  colors: ReturnType<typeof useTheme>['colors'];
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={[styles.segmented, { borderColor: colors.border }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={[
              styles.segment,
              active && { backgroundColor: colors.primary },
            ]}
            onPress={() => onChange(opt.value)}
          >
            <Text
              style={[
                styles.segmentText,
                { color: active ? colors.primaryText : colors.text },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  section: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 10,
  },
  label: { fontSize: 13, marginBottom: 8 },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segmentText: { fontSize: 14, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '600' },
});

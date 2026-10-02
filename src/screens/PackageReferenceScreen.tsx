import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PACKAGE_REFERENCE } from '../utils/packageReference';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';

export default function PackageReferenceScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.intro, { color: colors.textSecondary }]}>{t('packageRef.intro')}</Text>
      {PACKAGE_REFERENCE.map((entry) => (
        <View key={entry.id} style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.name, { color: colors.primary }]}>{entry.name}</Text>
            <Text style={[styles.pinCount, { color: colors.textSecondary }]}>{entry.pinCount}</Text>
          </View>
          <Text style={[styles.fullName, { color: colors.textSecondary }]}>{entry.fullName}</Text>
          <Text style={[styles.pitch, { color: colors.text }]}>
            {t('packageRef.pitch', { pitch: entry.pitch })}
          </Text>
          <Text style={[styles.description, { color: colors.text }]}>{entry.description}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  intro: { fontSize: 13, marginBottom: 16, lineHeight: 18 },
  card: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  name: { fontSize: 18, fontWeight: '700' },
  pinCount: { fontSize: 13 },
  fullName: { fontSize: 13, fontStyle: 'italic', marginTop: 2 },
  pitch: { fontSize: 13, marginTop: 6, fontWeight: '600' },
  description: { fontSize: 14, marginTop: 6, lineHeight: 19 },
});

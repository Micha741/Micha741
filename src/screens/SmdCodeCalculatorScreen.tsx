import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { decodeSmdCode, SMD_CODE_TYPE_LABELS } from '../utils/smdResistorCode';
import { useTheme, type ThemeColors } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import type { Locale } from '../db/appSettings';

type Props = NativeStackScreenProps<RootStackParamList, 'SmdCodeCalculator'>;

const EXAMPLES = ['103', '4R7', '1002', '22R1', '01C', '68A'];

function HelpText({ locale, colors }: { locale: Locale; colors: ThemeColors }) {
  const boldStyle = [styles.helpBold, { color: colors.text }];
  if (locale === 'en') {
    return (
      <Text style={[styles.helpText, { color: colors.textSecondary }]}>
        • <Text style={boldStyle}>3-digit</Text> (5% tol.): the first two digits are significant,
        the third is the multiplier (zero count). "103" = 10×10³ = 10 kΩ.{'\n\n'}
        • <Text style={boldStyle}>4-digit</Text> (1% tol.): the first three digits are significant,
        the fourth is the multiplier. "1002" = 100×10² = 10 kΩ.{'\n\n'}
        • <Text style={boldStyle}>R notation</Text>: the letter R replaces the decimal point.
        "4R7" = 4.7 Ω, "22R1" = 22.1 Ω.{'\n\n'}
        • <Text style={boldStyle}>EIA-96</Text>: two digits (01–96) index the E96 table value, the
        last letter is the multiplier. "01C" = 100×100 = 10 kΩ.{'\n\n'}
        • <Text style={boldStyle}>0 or 000</Text> = 0 Ω (jumper).
      </Text>
    );
  }
  return (
    <Text style={[styles.helpText, { color: colors.textSecondary }]}>
      • <Text style={boldStyle}>3místný</Text> (tol. 5 %): první dvě číslice jsou platné
      číslice, třetí je počet nul. „103“ = 10×10³ = 10 kΩ.{'\n\n'}
      • <Text style={boldStyle}>4místný</Text> (tol. 1 %): první tři číslice jsou platné
      číslice, čtvrtá je počet nul. „1002“ = 100×10² = 10 kΩ.{'\n\n'}
      • <Text style={boldStyle}>R-zápis</Text>: písmeno R nahrazuje desetinnou čárku.
      „4R7“ = 4,7 Ω, „22R1“ = 22,1 Ω.{'\n\n'}
      • <Text style={boldStyle}>EIA-96</Text>: dvě číslice (01–96) určují hodnotu z tabulky
      E96, poslední písmeno je násobitel. „01C“ = 100×100 = 10 kΩ.{'\n\n'}
      • <Text style={boldStyle}>0 nebo 000</Text> = 0 Ω (propojka).
    </Text>
  );
}

export default function SmdCodeCalculatorScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t, locale } = useI18n();
  const [code, setCode] = useState('');

  const result = useMemo(() => decodeSmdCode(code), [code]);
  const showInvalid = code.trim().length > 0 && result === null;

  const handleUseValue = () => {
    if (!result) return;
    navigation.navigate('ComponentForm', {
      prefill: {
        category: 'Rezistor',
        value: result.formattedValue,
        tags: 'rezistor,smd',
        notes: t('smdCalc.codeOnPackage', {
          code: code.trim().toUpperCase(),
          type: SMD_CODE_TYPE_LABELS[result.codeType],
        }),
      },
    });
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('smdCalc.label')}</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
        value={code}
        onChangeText={setCode}
        placeholder={t('smdCalc.placeholder')}
        placeholderTextColor={colors.placeholder}
        autoCapitalize="characters"
        autoCorrect={false}
      />

      <View style={styles.exampleRow}>
        {EXAMPLES.map((ex) => (
          <Pressable
            key={ex}
            style={[styles.exampleChip, { backgroundColor: colors.chipBackground }]}
            onPress={() => setCode(ex)}
          >
            <Text style={[styles.exampleChipText, { color: colors.text }]}>{ex}</Text>
          </Pressable>
        ))}
      </View>

      {result && (
        <View style={[styles.resultBox, { backgroundColor: colors.surface }]}>
          <Text style={[styles.resultValue, { color: colors.primary }]}>{result.formattedValue}</Text>
          <Text style={[styles.resultType, { color: colors.textSecondary }]}>
            {SMD_CODE_TYPE_LABELS[result.codeType]}
          </Text>
          <Pressable style={[styles.useButton, { backgroundColor: colors.primary }]} onPress={handleUseValue}>
            <Text style={styles.useButtonText}>{t('smdCalc.useValue')}</Text>
          </Pressable>
        </View>
      )}

      {showInvalid && <Text style={styles.invalid}>{t('smdCalc.invalid')}</Text>}

      <View style={[styles.helpBox, { backgroundColor: colors.surface }]}>
        <Text style={[styles.helpTitle, { color: colors.text }]}>{t('smdCalc.helpTitle')}</Text>
        <HelpText locale={locale} colors={colors} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  label: { fontSize: 13, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
  },
  exampleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  exampleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  exampleChipText: { fontSize: 13 },
  resultBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resultValue: { fontSize: 32, fontWeight: '700' },
  resultType: { fontSize: 13, marginTop: 4 },
  useButton: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  useButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  invalid: { marginTop: 16, color: '#c0392b', fontSize: 14 },
  helpBox: {
    marginTop: 28,
    padding: 14,
    borderRadius: 10,
  },
  helpTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  helpText: { fontSize: 13, lineHeight: 19 },
  helpBold: { fontWeight: '700' },
});

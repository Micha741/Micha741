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
import { decodeCapacitorCode } from '../utils/capacitorCode';
import { useTheme, type ThemeColors } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import type { Locale } from '../db/appSettings';

type Props = NativeStackScreenProps<RootStackParamList, 'CapacitorCodeCalculator'>;

const EXAMPLES = ['104', '104K', '223J', '4R7', '225K1C', '339'];

function HelpText({ locale, colors }: { locale: Locale; colors: ThemeColors }) {
  const boldStyle = [styles.helpBold, { color: colors.text }];
  if (locale === 'en') {
    return (
      <Text style={[styles.helpText, { color: colors.textSecondary }]}>
        • <Text style={boldStyle}>3-digit code</Text> (in pF): the first two digits are
        significant, the third is the multiplier. "104" = 10×10⁴ pF = 100 nF. Multiplier 9 =
        ×0.1, multiplier 8 = ×0.01 (for values under 10 pF).{'\n\n'}
        • <Text style={boldStyle}>R notation</Text>: the letter R replaces the decimal point for
        values under 10 pF. "4R7" = 4.7 pF.{'\n\n'}
        • <Text style={boldStyle}>Tolerance letter</Text> (after the value): B=±0.1pF, C=±0.25pF,
        D=±0.5pF, F=±1%, G=±2%, J=±5%, K=±10%, M=±20%, Z=+80/−20%, P=+100/−0%.{'\n\n'}
        • <Text style={boldStyle}>Voltage code</Text> (2 characters, at the end): 0G=4V, 0J=6.3V,
        1A=10V, 1C=16V, 1E=25V, 1V=35V, 1H=50V, 2A=100V, 2D=200V, 2E=250V, 2G=400V, 2W=450V.
      </Text>
    );
  }
  return (
    <Text style={[styles.helpText, { color: colors.textSecondary }]}>
      • <Text style={boldStyle}>3místný kód</Text> (v pF): první dvě číslice jsou platné
      číslice, třetí je počet nul. „104“ = 10×10⁴ pF = 100 nF. Násobitel 9 = ×0,1, násobitel
      8 = ×0,01 (pro hodnoty pod 10 pF).{'\n\n'}
      • <Text style={boldStyle}>R-zápis</Text>: písmeno R nahrazuje desetinnou čárku u
      hodnot pod 10 pF. „4R7“ = 4,7 pF.{'\n\n'}
      • <Text style={boldStyle}>Písmeno tolerance</Text> (za hodnotou): B=±0,1pF,
      C=±0,25pF, D=±0,5pF, F=±1%, G=±2%, J=±5%, K=±10%, M=±20%, Z=+80/−20%, P=+100/−0%.{'\n\n'}
      • <Text style={boldStyle}>Kód napětí</Text> (2 znaky, na konci): 0G=4V, 0J=6,3V,
      1A=10V, 1C=16V, 1E=25V, 1V=35V, 1H=50V, 2A=100V, 2D=200V, 2E=250V, 2G=400V, 2W=450V.
    </Text>
  );
}

export default function CapacitorCodeCalculatorScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t, locale } = useI18n();
  const [code, setCode] = useState('');

  const result = useMemo(() => decodeCapacitorCode(code), [code]);
  const showInvalid = code.trim().length > 0 && result === null;

  const handleUseValue = () => {
    if (!result) return;
    const parts = [result.formattedValue];
    if (result.tolerance) parts.push(t('capCalc.tolerance', { label: result.tolerance.label }));
    if (result.voltage) parts.push(`${result.voltage.volts} V`);
    navigation.navigate('ComponentForm', {
      prefill: {
        category: 'Kondenzátor',
        value: result.formattedValue,
        tags: 'kondenzátor,smd',
        notes: t('capCalc.codeOnPackage', {
          code: code.trim().toUpperCase(),
          parts: parts.join(', '),
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
      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('capCalc.label')}</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
        value={code}
        onChangeText={setCode}
        placeholder={t('capCalc.placeholder')}
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
          {result.tolerance && (
            <Text style={[styles.resultDetail, { color: colors.textSecondary }]}>
              {t('capCalc.tolerance', { label: result.tolerance.label })}
            </Text>
          )}
          {result.voltage && (
            <Text style={[styles.resultDetail, { color: colors.textSecondary }]}>
              {t('capCalc.voltage', { volts: result.voltage.volts })}
            </Text>
          )}
          <Pressable style={[styles.useButton, { backgroundColor: colors.primary }]} onPress={handleUseValue}>
            <Text style={styles.useButtonText}>{t('capCalc.useValue')}</Text>
          </Pressable>
        </View>
      )}

      {showInvalid && <Text style={styles.invalid}>{t('capCalc.invalid')}</Text>}

      <View style={[styles.helpBox, { backgroundColor: colors.surface }]}>
        <Text style={[styles.helpTitle, { color: colors.text }]}>{t('capCalc.helpTitle')}</Text>
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
  resultDetail: { fontSize: 13, marginTop: 4 },
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

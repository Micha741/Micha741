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

type Props = NativeStackScreenProps<RootStackParamList, 'SmdCodeCalculator'>;

const EXAMPLES = ['103', '4R7', '1002', '22R1', '01C', '68A'];

export default function SmdCodeCalculatorScreen({ navigation }: Props) {
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
        notes: `Kód na pouzdře: ${code.trim().toUpperCase()} (${SMD_CODE_TYPE_LABELS[result.codeType]})`,
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Kód na SMD rezistoru</Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="např. 103, 4R7, 1002, 01C"
        autoCapitalize="characters"
        autoCorrect={false}
      />

      <View style={styles.exampleRow}>
        {EXAMPLES.map((ex) => (
          <Pressable key={ex} style={styles.exampleChip} onPress={() => setCode(ex)}>
            <Text style={styles.exampleChipText}>{ex}</Text>
          </Pressable>
        ))}
      </View>

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultValue}>{result.formattedValue}</Text>
          <Text style={styles.resultType}>{SMD_CODE_TYPE_LABELS[result.codeType]}</Text>
          <Pressable style={styles.useButton} onPress={handleUseValue}>
            <Text style={styles.useButtonText}>Použít → Nová součástka</Text>
          </Pressable>
        </View>
      )}

      {showInvalid && (
        <Text style={styles.invalid}>Kód nerozpoznán. Zkus jiný formát (viz nápověda níže).</Text>
      )}

      <View style={styles.helpBox}>
        <Text style={styles.helpTitle}>Formáty kódů</Text>
        <Text style={styles.helpText}>
          • <Text style={styles.helpBold}>3místný</Text> (tol. 5 %): první dvě číslice jsou platné
          číslice, třetí je počet nul. „103“ = 10×10³ = 10 kΩ.{'\n\n'}
          • <Text style={styles.helpBold}>4místný</Text> (tol. 1 %): první tři číslice jsou platné
          číslice, čtvrtá je počet nul. „1002“ = 100×10² = 10 kΩ.{'\n\n'}
          • <Text style={styles.helpBold}>R-zápis</Text>: písmeno R nahrazuje desetinnou čárku.
          „4R7“ = 4,7 Ω, „22R1“ = 22,1 Ω.{'\n\n'}
          • <Text style={styles.helpBold}>EIA-96</Text>: dvě číslice (01–96) určují hodnotu z tabulky
          E96, poslední písmeno je násobitel. „01C“ = 100×100 = 10 kΩ.{'\n\n'}
          • <Text style={styles.helpBold}>0 nebo 000</Text> = 0 Ω (propojka).
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  label: { fontSize: 13, color: '#666', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
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
    backgroundColor: '#f0f0f0',
  },
  exampleChipText: { color: '#333', fontSize: 13 },
  resultBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#eef3fe',
    alignItems: 'center',
  },
  resultValue: { fontSize: 32, fontWeight: '700', color: '#2f6fed' },
  resultType: { fontSize: 13, color: '#555', marginTop: 4 },
  useButton: {
    marginTop: 14,
    backgroundColor: '#2f6fed',
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
    backgroundColor: '#f7f7f7',
  },
  helpTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8 },
  helpText: { fontSize: 13, color: '#444', lineHeight: 19 },
  helpBold: { fontWeight: '700' },
});

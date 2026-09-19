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

type Props = NativeStackScreenProps<RootStackParamList, 'CapacitorCodeCalculator'>;

const EXAMPLES = ['104', '104K', '223J', '4R7', '225K1C', '339'];

export default function CapacitorCodeCalculatorScreen({ navigation }: Props) {
  const [code, setCode] = useState('');

  const result = useMemo(() => decodeCapacitorCode(code), [code]);
  const showInvalid = code.trim().length > 0 && result === null;

  const handleUseValue = () => {
    if (!result) return;
    const parts = [result.formattedValue];
    if (result.tolerance) parts.push(`tolerance ${result.tolerance.label}`);
    if (result.voltage) parts.push(`${result.voltage.volts} V`);
    navigation.navigate('ComponentForm', {
      prefill: {
        category: 'Kondenzátor',
        value: result.formattedValue,
        tags: 'kondenzátor,smd',
        notes: `Kód na pouzdře: ${code.trim().toUpperCase()} (${parts.join(', ')})`,
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Kód na kondenzátoru</Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="např. 104, 104K, 4R7, 225K1C"
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
          {result.tolerance && (
            <Text style={styles.resultDetail}>tolerance {result.tolerance.label}</Text>
          )}
          {result.voltage && (
            <Text style={styles.resultDetail}>jmenovité napětí {result.voltage.volts} V</Text>
          )}
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
          • <Text style={styles.helpBold}>3místný kód</Text> (v pF): první dvě číslice jsou platné
          číslice, třetí je počet nul. „104“ = 10×10⁴ pF = 100 nF. Násobitel 9 = ×0,1, násobitel
          8 = ×0,01 (pro hodnoty pod 10 pF).{'\n\n'}
          • <Text style={styles.helpBold}>R-zápis</Text>: písmeno R nahrazuje desetinnou čárku u
          hodnot pod 10 pF. „4R7“ = 4,7 pF.{'\n\n'}
          • <Text style={styles.helpBold}>Písmeno tolerance</Text> (za hodnotou): B=±0,1pF,
          C=±0,25pF, D=±0,5pF, F=±1%, G=±2%, J=±5%, K=±10%, M=±20%, Z=+80/−20%, P=+100/−0%.{'\n\n'}
          • <Text style={styles.helpBold}>Kód napětí</Text> (2 znaky, na konci): 0G=4V, 0J=6,3V,
          1A=10V, 1C=16V, 1E=25V, 1V=35V, 1H=50V, 2A=100V, 2D=200V, 2E=250V, 2G=400V, 2W=450V.
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
  resultDetail: { fontSize: 13, color: '#555', marginTop: 4 },
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

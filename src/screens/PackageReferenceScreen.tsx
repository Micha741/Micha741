import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PACKAGE_REFERENCE } from '../utils/packageReference';

export default function PackageReferenceScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        Rychlá vizuální identifikace běžných pouzder IC podle tvaru a typu vývodů.
      </Text>
      {PACKAGE_REFERENCE.map((entry) => (
        <View key={entry.id} style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.name}>{entry.name}</Text>
            <Text style={styles.pinCount}>{entry.pinCount}</Text>
          </View>
          <Text style={styles.fullName}>{entry.fullName}</Text>
          <Text style={styles.pitch}>Rozteč vývodů: {entry.pitch}</Text>
          <Text style={styles.description}>{entry.description}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  intro: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 18 },
  card: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f7f7f7',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  name: { fontSize: 18, fontWeight: '700', color: '#2f6fed' },
  pinCount: { fontSize: 13, color: '#555' },
  fullName: { fontSize: 13, color: '#777', fontStyle: 'italic', marginTop: 2 },
  pitch: { fontSize: 13, color: '#333', marginTop: 6, fontWeight: '600' },
  description: { fontSize: 14, color: '#333', marginTop: 6, lineHeight: 19 },
});

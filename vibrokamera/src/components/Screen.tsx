import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStyles } from '../lib/settings';
import Chip from './Chip';

type Props = {
  title: string;
  backLabel?: string;
  onBack: () => void;
  right?: ReactNode;
  children: ReactNode;
};

/** Obrazovka s hlavičkou (tlačítko zpět, nadpis, volitelné akce vpravo). */
export default function Screen({ title, backLabel = '‹ Zpět', onBack, right, children }: Props) {
  const insets = useSafeAreaInsets();
  const styles = useStyles((c) => ({
    container: { flex: 1, backgroundColor: c.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    title: { color: c.text, fontSize: 20, fontWeight: '700', marginLeft: 4, flex: 1 },
  }));
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Chip label={backLabel} onPress={onBack} />
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {right}
      </View>
      {children}
    </View>
  );
}

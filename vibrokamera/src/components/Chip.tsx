import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useStyles } from '../lib/settings';

type Props = {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function Chip({ label, selected, disabled, onPress, style }: Props) {
  const styles = useStyles((c) => ({
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: c.surfaceRaised,
      borderWidth: 1,
      borderColor: c.border,
      marginRight: 8,
    },
    selected: { backgroundColor: c.accent, borderColor: c.accent },
    disabled: { opacity: 0.4 },
    pressed: { opacity: 0.7 },
    label: { color: c.text, fontSize: 14, fontWeight: '600' },
    selectedLabel: { color: c.accentText },
  }));
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

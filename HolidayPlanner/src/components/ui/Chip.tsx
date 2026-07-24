import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export default function Chip({ label, selected, onPress }: Props) {
  const { colors, radius, spacing } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.base,
        {
          borderRadius: radius.pill,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          backgroundColor: selected ? colors.primary : colors.surfaceElevated,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: selected ? colors.primaryText : colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: StyleSheet.hairlineWidth },
  label: { fontSize: 13, fontWeight: '600' },
});

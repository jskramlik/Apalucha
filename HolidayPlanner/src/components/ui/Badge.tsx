import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  label: string;
  tone?: 'primary' | 'secondary' | 'muted';
}

export default function Badge({ label, tone = 'primary' }: Props) {
  const { colors, radius, spacing } = useTheme();
  const bg = tone === 'primary' ? colors.primary : tone === 'secondary' ? colors.secondary : colors.surfaceElevated;
  const textColor = tone === 'muted' ? colors.textSecondary : colors.primaryText;

  return (
    <Text
      style={[
        styles.base,
        {
          backgroundColor: bg,
          color: textColor,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
        },
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: { fontSize: 11, fontWeight: '700', overflow: 'hidden' },
});

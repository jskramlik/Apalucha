import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function TextField(props: TextInputProps) {
  const { colors, radius, spacing } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      {...props}
      style={[
        styles.base,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
          color: colors.textPrimary,
          borderColor: colors.border,
        },
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { fontSize: 15, borderWidth: StyleSheet.hairlineWidth },
});

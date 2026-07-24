import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function Button({ label, onPress, variant = 'primary', disabled, loading, style }: Props) {
  const { colors, radius, spacing } = useTheme();

  const backgroundColor =
    variant === 'primary' ? colors.primary :
    variant === 'destructive' ? colors.error :
    variant === 'secondary' ? colors.surfaceElevated :
    'transparent';

  const textColor =
    variant === 'primary' || variant === 'destructive' ? colors.primaryText :
    variant === 'secondary' ? colors.textPrimary :
    colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor,
          borderRadius: radius.pill,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xxl,
          opacity: disabled ? 0.5 : 1,
          borderWidth: variant === 'secondary' ? StyleSheet.hairlineWidth : 0,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.label, { color: textColor }]}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '700' },
});

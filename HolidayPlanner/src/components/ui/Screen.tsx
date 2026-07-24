import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function Screen({ children, style }: Props) {
  const { colors } = useTheme();
  return <View style={[styles.base, { backgroundColor: colors.background }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: { flex: 1 },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  text: string;
}

export default function EmptyState({ icon = 'sparkles-outline', text }: Props) {
  const { colors, spacing } = useTheme();
  return (
    <View style={[styles.container, { paddingVertical: spacing.xl }]}>
      <Ionicons name={icon} size={28} color={colors.textMuted} style={{ marginBottom: spacing.sm }} />
      <Text style={[styles.text, { color: colors.textMuted }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 14, fontStyle: 'italic' },
});

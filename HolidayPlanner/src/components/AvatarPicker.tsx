import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export const AVATAR_OPTIONS = [
  '👦', '👧', '🧒', '👶', '😀', '😎', '🤠', '🥳',
  '🦸', '🧚', '🐶', '🐱', '🦁', '🐵', '⚽', '🎨',
];

interface Props {
  value: string;
  onChange: (avatar: string) => void;
}

export default function AvatarPicker({ value, onChange }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.grid}>
      {AVATAR_OPTIONS.map(avatar => (
        <TouchableOpacity
          key={avatar}
          style={[
            styles.cell,
            { backgroundColor: colors.surfaceElevated },
            value === avatar && { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
          ]}
          onPress={() => onChange(avatar)}
        >
          <Text style={styles.emoji}>{avatar}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  cell: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  emoji: { fontSize: 22 },
});

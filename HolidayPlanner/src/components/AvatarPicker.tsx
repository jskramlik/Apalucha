import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const AVATAR_OPTIONS = [
  '👦', '👧', '🧒', '👶', '😀', '😎', '🤠', '🥳',
  '🦸', '🧚', '🐶', '🐱', '🦁', '🐵', '⚽', '🎨',
];

interface Props {
  value: string;
  onChange: (avatar: string) => void;
}

export default function AvatarPicker({ value, onChange }: Props) {
  return (
    <View style={styles.grid}>
      {AVATAR_OPTIONS.map(avatar => (
        <TouchableOpacity
          key={avatar}
          style={[styles.cell, value === avatar && styles.cellSelected]}
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
  cell: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', backgroundColor: '#f0f0f0' },
  cellSelected: { borderColor: '#2e7d32', backgroundColor: '#e8f5e9' },
  emoji: { fontSize: 22 },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Person {
  id: string;
  name: string;
}

interface Props {
  label: string;
  people: Person[];
  value: string;
  onChange: (name: string) => void;
  clearLabel?: string;
}

export default function MemberPicker({ label, people, value, onChange, clearLabel = 'None' }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipList}>
        <TouchableOpacity
          style={[styles.chip, !value && styles.chipSelected]}
          onPress={() => onChange('')}
        >
          <Text style={!value ? styles.chipTextSelected : styles.chipText}>{clearLabel}</Text>
        </TouchableOpacity>
        {people.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[styles.chip, value === p.name && styles.chipSelected]}
            onPress={() => onChange(p.name)}
          >
            <Text style={value === p.name ? styles.chipTextSelected : styles.chipText}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 13, color: '#666', marginBottom: 6 },
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#2e7d32', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipSelected: { backgroundColor: '#2e7d32' },
  chipText: { color: '#2e7d32' },
  chipTextSelected: { color: '#fff' },
});

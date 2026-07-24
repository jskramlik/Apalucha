import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import Chip from './ui/Chip';

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

export default function MemberPicker({ label, people, value, onChange, clearLabel }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.sm }]}>{label}</Text>
      <View style={styles.chipList}>
        <Chip label={clearLabel ?? t('none')} selected={!value} onPress={() => onChange('')} />
        {people.map(p => (
          <Chip key={p.id} label={p.name} selected={value === p.name} onPress={() => onChange(p.name)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

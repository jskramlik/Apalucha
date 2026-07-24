import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

interface Props {
  placeholder: string;
  value: string;
  onChange: (time: string) => void;
  style?: StyleProp<ViewStyle>;
}

export default function TimePickerField({ placeholder, value, onChange, style }: Props) {
  const { colors, radius, spacing, typography } = useTheme();
  const [visible, setVisible] = useState(false);
  const [hour, minute] = value ? value.split(':') : ['', ''];
  const [pendingHour, setPendingHour] = useState(hour || '');
  const [pendingMinute, setPendingMinute] = useState(minute || '');

  const open = () => {
    const [h, m] = value ? value.split(':') : ['', ''];
    setPendingHour(h || '');
    setPendingMinute(m || '');
    setVisible(true);
  };

  const confirm = (h: string, m: string) => {
    if (h && m) {
      onChange(`${h}:${m}`);
      setVisible(false);
    }
  };

  const selectHour = (h: string) => {
    setPendingHour(h);
    confirm(h, pendingMinute);
  };

  const selectMinute = (m: string) => {
    setPendingMinute(m);
    confirm(pendingHour, m);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.input, { backgroundColor: colors.surfaceElevated, borderRadius: radius.md, borderColor: colors.border }, style]}
        onPress={open}
      >
        <Text style={[typography.body, { color: value ? colors.textPrimary : colors.textMuted }]}>{value || placeholder}</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={[styles.overlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: colors.surface, borderRadius: radius.xl }]} onPress={() => {}}>
            <Text style={[typography.subheading, { color: colors.textPrimary, marginBottom: spacing.md, textAlign: 'center' }]}>
              {pendingHour || '--'}:{pendingMinute || '--'}
            </Text>
            <View style={styles.columns}>
              <ScrollView style={styles.column} showsVerticalScrollIndicator={false}>
                {HOURS.map(h => (
                  <TouchableOpacity key={h} style={[styles.cell, pendingHour === h && { backgroundColor: colors.primary }]} onPress={() => selectHour(h)}>
                    <Text style={[typography.body, { color: pendingHour === h ? colors.primaryText : colors.textPrimary, textAlign: 'center' }]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView style={styles.column} showsVerticalScrollIndicator={false}>
                {MINUTES.map(m => (
                  <TouchableOpacity key={m} style={[styles.cell, pendingMinute === m && { backgroundColor: colors.primary }]} onPress={() => selectMinute(m)}>
                    <Text style={[typography.body, { color: pendingMinute === m ? colors.primaryText : colors.textPrimary, textAlign: 'center' }]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  input: { padding: 14, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sheet: { padding: 16, width: 260, maxHeight: 340 },
  columns: { flexDirection: 'row', gap: 8 },
  column: { flex: 1, maxHeight: 260 },
  cell: { paddingVertical: 10, borderRadius: 8, marginBottom: 4 },
});

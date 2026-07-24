import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { MONTH_NAMES, toIso, parseIso, nextMonth, previousMonth, buildCalendarCells, isWithinRange } from '../utils/dateUtils';
import { useTheme } from '../theme/ThemeContext';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

interface Props {
  placeholder: string;
  value: string;
  onChange: (isoDate: string) => void;
  minDate?: string;
  maxDate?: string;
  style?: StyleProp<ViewStyle>;
}

export default function DatePickerField({ placeholder, value, onChange, minDate, maxDate, style }: Props) {
  const { colors, radius, spacing, typography } = useTheme();
  const [visible, setVisible] = useState(false);
  const parsed = parseIso(value);
  const today = new Date();
  const defaultParsed = parseIso(minDate ?? '');
  const [viewYear, setViewYear] = useState(parsed?.year ?? defaultParsed?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? defaultParsed?.month ?? today.getMonth());

  const open = () => {
    const current = parseIso(value);
    setViewYear(current?.year ?? defaultParsed?.year ?? today.getFullYear());
    setViewMonth(current?.month ?? defaultParsed?.month ?? today.getMonth());
    setVisible(true);
  };

  const changeMonth = (delta: number) => {
    const { year, month } = delta > 0 ? nextMonth(viewYear, viewMonth) : previousMonth(viewYear, viewMonth);
    setViewYear(year);
    setViewMonth(month);
  };

  const selectDay = (day: number) => {
    if (!isWithinRange(viewYear, viewMonth, day, minDate, maxDate)) return;
    onChange(toIso(viewYear, viewMonth, day));
    setVisible(false);
  };

  const cells = buildCalendarCells(viewYear, viewMonth);

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
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.calendar, { backgroundColor: colors.surface, borderRadius: radius.xl }]}
            onPress={() => {}}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
                <Text style={[styles.navText, { color: colors.primary }]}>‹</Text>
              </TouchableOpacity>
              <Text style={[typography.subheading, { color: colors.textPrimary }]}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
                <Text style={[styles.navText, { color: colors.primary }]}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map(w => (
                <Text key={w} style={[typography.small, { flex: 1, textAlign: 'center', color: colors.textMuted }]}>{w}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((day, idx) => {
                const isSelected = day !== null && parsed?.year === viewYear && parsed?.month === viewMonth && parsed?.day === day;
                const inRange = day === null || isWithinRange(viewYear, viewMonth, day, minDate, maxDate);
                return (
                  <View key={idx} style={styles.cellWrapper}>
                    {day !== null && (
                      <TouchableOpacity
                        style={[styles.dayCell, isSelected && { backgroundColor: colors.primary }]}
                        onPress={() => selectDay(day)}
                        disabled={!inRange}
                      >
                        <Text style={[
                          typography.body,
                          { color: isSelected ? colors.primaryText : inRange ? colors.textPrimary : colors.textMuted },
                          isSelected && { fontWeight: '700' },
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
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
  calendar: { padding: 16, width: 320 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navButton: { padding: 8 },
  navText: { fontSize: 22, fontWeight: '700' },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellWrapper: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCell: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});

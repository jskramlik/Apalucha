import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MONTH_NAMES, toIso, parseIso, nextMonth, previousMonth, buildCalendarCells } from '../utils/dateUtils';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

interface Props {
  placeholder: string;
  value: string;
  onChange: (isoDate: string) => void;
}

export default function DatePickerField({ placeholder, value, onChange }: Props) {
  const [visible, setVisible] = useState(false);
  const parsed = parseIso(value);
  const today = new Date();
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());

  const open = () => {
    const current = parseIso(value);
    setViewYear(current?.year ?? today.getFullYear());
    setViewMonth(current?.month ?? today.getMonth());
    setVisible(true);
  };

  const changeMonth = (delta: number) => {
    const { year, month } = delta > 0 ? nextMonth(viewYear, viewMonth) : previousMonth(viewYear, viewMonth);
    setViewYear(year);
    setViewMonth(month);
  };

  const selectDay = (day: number) => {
    onChange(toIso(viewYear, viewMonth, day));
    setVisible(false);
  };

  const cells = buildCalendarCells(viewYear, viewMonth);

  return (
    <>
      <TouchableOpacity style={styles.input} onPress={open}>
        <Text style={value ? styles.valueText : styles.placeholderText}>{value || placeholder}</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.calendar} onPress={() => {}}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
                <Text style={styles.navText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
                <Text style={styles.navText}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map(w => (
                <Text key={w} style={styles.weekdayLabel}>{w}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((day, idx) => {
                const isSelected = day !== null && parsed?.year === viewYear && parsed?.month === viewMonth && parsed?.day === day;
                return (
                  <View key={idx} style={styles.cellWrapper}>
                    {day !== null && (
                      <TouchableOpacity
                        style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                        onPress={() => selectDay(day)}
                      >
                        <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
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
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center' },
  valueText: { fontSize: 16, color: '#333' },
  placeholderText: { fontSize: 16, color: '#999' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  calendar: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: 320 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navButton: { padding: 8 },
  navText: { fontSize: 22, color: '#2e7d32', fontWeight: '700' },
  monthLabel: { fontSize: 16, fontWeight: '700', color: '#333' },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekdayLabel: { flex: 1, textAlign: 'center', fontSize: 12, color: '#888', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellWrapper: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCell: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayCellSelected: { backgroundColor: '#2e7d32' },
  dayText: { fontSize: 14, color: '#333' },
  dayTextSelected: { color: '#fff', fontWeight: '700' },
});

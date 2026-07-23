import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromIso(value: string): Date {
  const parsed = value ? new Date(`${value}T00:00:00`) : new Date();
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

interface Props {
  placeholder: string;
  value: string;
  onChange: (isoDate: string) => void;
}

export default function DatePickerField({ placeholder, value, onChange }: Props) {
  const [show, setShow] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.input} onPress={() => setShow(true)}>
        <Text style={value ? styles.valueText : styles.placeholderText}>{value || placeholder}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={fromIso(value)}
          mode="date"
          display="default"
          onChange={(_event, selectedDate) => {
            setShow(false);
            if (selectedDate) onChange(toIso(selectedDate));
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center' },
  valueText: { fontSize: 16, color: '#333' },
  placeholderText: { fontSize: 16, color: '#999' },
});

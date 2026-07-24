import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { autocompletePlaces, getPlaceDetails, newSessionToken, PlacePrediction } from '../utils/googlePlaces';

export interface ResolvedPlace {
  label: string;
  lat: number;
  lng: number;
}

interface Props {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectPlace: (place: ResolvedPlace) => void;
  style?: StyleProp<ViewStyle>;
}

export default function LocationAutocompleteField({ placeholder, value, onChangeText, onSelectPlace, style }: Props) {
  const { colors, radius, spacing, typography } = useTheme();
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sessionTokenRef = useRef(newSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const handleChangeText = (text: string) => {
    onChangeText(text);
    setShowSuggestions(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (!text.trim()) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const results = await autocompletePlaces(text, sessionTokenRef.current, controller.signal);
        setSuggestions(results);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setSuggestions([]);
      }
    }, 300);
  };

  const handleSelect = async (prediction: PlacePrediction) => {
    setShowSuggestions(false);
    setSuggestions([]);
    const coords = await getPlaceDetails(prediction.placeId, sessionTokenRef.current);
    sessionTokenRef.current = newSessionToken();
    if (coords) {
      onSelectPlace({ label: prediction.fullText, lat: coords.lat, lng: coords.lng });
    } else {
      onChangeText(prediction.fullText);
    }
  };

  const handleBlur = () => {
    // Delayed so a tap on a suggestion below registers before the dropdown unmounts.
    blurTimeoutRef.current = setTimeout(() => setShowSuggestions(false), 150);
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={handleChangeText}
        onFocus={() => { if (value.trim()) setShowSuggestions(true); }}
        onBlur={handleBlur}
        style={[
          styles.input,
          {
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.md,
            padding: spacing.md,
            color: colors.textPrimary,
            borderColor: colors.border,
          },
        ]}
      />
      {showSuggestions && suggestions.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: colors.surface, borderRadius: radius.md, borderColor: colors.border }]}>
          {suggestions.map(s => (
            <TouchableOpacity key={s.placeId} style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => handleSelect(s)}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{s.mainText}</Text>
              {s.secondaryText ? (
                <Text style={[typography.small, { color: colors.textMuted }]}>{s.secondaryText}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
          <Text style={[typography.small, { color: colors.textMuted, padding: spacing.sm, textAlign: 'right' }]}>
            Powered by Google
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  input: { fontSize: 15, borderWidth: StyleSheet.hairlineWidth },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 6,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: 260,
    overflow: 'hidden',
  },
  row: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});

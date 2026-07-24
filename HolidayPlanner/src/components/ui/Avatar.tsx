import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  name: string;
  photoUrl?: string;
  avatar?: string;
  size?: number;
}

export default function Avatar({ name, photoUrl, avatar, size = 40 }: Props) {
  const { colors } = useTheme();
  const dim = { width: size, height: size, borderRadius: size / 2 };

  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={dim} />;
  }

  return (
    <View style={[dim, styles.placeholder, { backgroundColor: colors.primary }]}>
      {avatar ? (
        <Text style={{ fontSize: size * 0.55 }}>{avatar}</Text>
      ) : (
        <Text style={[styles.letter, { color: colors.primaryText, fontSize: size * 0.45 }]}>
          {(name?.[0] ?? '?').toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  letter: { fontWeight: '700' },
});

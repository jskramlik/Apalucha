import React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { GOOGLE_MAPS_API_KEY } from '../config/googleMaps';
import { buildMapEmbedUrl } from '../utils/googleMapsEmbed';
import { TripStop } from '../types';

// Native implementation. Metro picks GoogleMapEmbed.web.tsx instead when
// bundling for web -- react-native-webview has no web build, so it can't
// even be statically imported in a file the web bundler also processes.

interface Props {
  stops: TripStop[];
  style?: StyleProp<ViewStyle>;
}

export default function GoogleMapEmbed({ stops, style }: Props) {
  const url = buildMapEmbedUrl(stops, GOOGLE_MAPS_API_KEY);
  if (!url) return null;
  return <WebView source={{ uri: url }} style={[styles.map, style]} />;
}

const styles = StyleSheet.create({
  map: { height: 180 },
});

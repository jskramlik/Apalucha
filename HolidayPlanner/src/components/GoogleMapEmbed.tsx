import React from 'react';
import { Platform, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { GOOGLE_MAPS_API_KEY } from '../config/googleMaps';
import { buildMapEmbedUrl } from '../utils/googleMapsEmbed';
import { TripStop } from '../types';

interface Props {
  stops: TripStop[];
  style?: StyleProp<ViewStyle>;
}

export default function GoogleMapEmbed({ stops, style }: Props) {
  const url = buildMapEmbedUrl(stops, GOOGLE_MAPS_API_KEY);
  if (!url) return null;

  if (Platform.OS === 'web') {
    // react-native-web renders raw DOM elements this way; RN's JSX types don't
    // model intrinsic elements like 'iframe', hence the `as any`.
    return React.createElement('iframe', {
      src: url,
      style: { border: 0, width: '100%', height: 180, ...(style as object) },
      loading: 'lazy',
      allowFullScreen: true,
    } as any);
  }

  // react-native-webview was removed earlier specifically because it doesn't
  // support the web platform -- it must only ever be mounted here, natively.
  return <WebView source={{ uri: url }} style={[styles.map, style]} />;
}

const styles = StyleSheet.create({
  map: { height: 180 },
});

import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { GOOGLE_MAPS_API_KEY } from '../config/googleMaps';
import { buildMapEmbedUrl } from '../utils/googleMapsEmbed';
import { TripStop } from '../types';

// Web implementation (Metro auto-selects this over GoogleMapEmbed.tsx when
// bundling for web). Deliberately has no react-native-webview import at all.

interface Props {
  stops: TripStop[];
  style?: StyleProp<ViewStyle>;
}

export default function GoogleMapEmbed({ stops, style }: Props) {
  const url = buildMapEmbedUrl(stops, GOOGLE_MAPS_API_KEY);
  if (!url) return null;

  // react-native-web renders raw DOM elements this way; RN's JSX types don't
  // model intrinsic elements like 'iframe', hence the `as any`.
  return React.createElement('iframe', {
    src: url,
    style: { border: 0, width: '100%', height: 180, ...(style as object) },
    loading: 'lazy',
    allowFullScreen: true,
  } as any);
}

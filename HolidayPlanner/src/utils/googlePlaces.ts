import * as Crypto from 'expo-crypto';
import { GOOGLE_MAPS_API_KEY } from '../config/googleMaps';

// Uses the Places API (New) (places.googleapis.com), not the legacy
// maps.googleapis.com/maps/api/place/* endpoints -- the legacy ones don't
// support CORS for direct browser/fetch calls, which would break on web.

export interface PlacePrediction {
  placeId: string;
  mainText: string;
  secondaryText?: string;
  fullText: string;
}

// Session tokens bundle a type-ahead session + the final details call into
// one billed unit (Google's documented cost-optimization mechanism).
export function newSessionToken(): string {
  return Crypto.randomUUID();
}

export async function autocompletePlaces(
  input: string,
  sessionToken: string,
  signal?: AbortSignal
): Promise<PlacePrediction[]> {
  if (!input.trim()) return [];
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      },
      body: JSON.stringify({ input, sessionToken }),
      signal,
    });
    const data = await res.json();
    const suggestions = data?.suggestions;
    if (!Array.isArray(suggestions)) return [];
    return suggestions
      .filter((s: any) => s.placePrediction)
      .map((s: any) => {
        const p = s.placePrediction;
        return {
          placeId: p.placeId,
          mainText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
          secondaryText: p.structuredFormat?.secondaryText?.text,
          fullText: p.text?.text ?? '',
        };
      });
  } catch (e: any) {
    if (e?.name === 'AbortError') throw e;
    return [];
  }
}

export async function getPlaceDetails(
  placeId: string,
  sessionToken: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?sessionToken=${sessionToken}`,
      {
        headers: {
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'location',
        },
      }
    );
    const data = await res.json();
    if (data?.location?.latitude == null || data?.location?.longitude == null) return null;
    return { lat: data.location.latitude, lng: data.location.longitude };
  } catch {
    return null;
  }
}

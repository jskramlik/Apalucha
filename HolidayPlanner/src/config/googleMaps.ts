export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

if (__DEV__ && !GOOGLE_MAPS_API_KEY) {
  console.warn('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set — see .env.example');
}

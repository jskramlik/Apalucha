// Free, keyless geocoding via Nominatim (OpenStreetMap). Per their usage
// policy: max ~1 request/sec and a descriptive User-Agent identifying the app.
export async function geocodeLocation(query: string): Promise<{ lat: number; lng: number } | null> {
  if (!query.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ApaluchaPlanner/1.0 (family holiday planning app)' },
    });
    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch {
    return null;
  }
}

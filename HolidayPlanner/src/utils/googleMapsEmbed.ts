// Takes apiKey as an explicit param (rather than reading process.env internally)
// so this stays pure and trivially testable without env mocking.
export function buildMapEmbedUrl(stops: { lat: number; lng: number }[], apiKey: string): string | null {
  if (stops.length === 0) return null;

  if (stops.length === 1) {
    const { lat, lng } = stops[0];
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}`;
  }

  const origin = `${stops[0].lat},${stops[0].lng}`;
  const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;
  const waypoints = stops
    .slice(1, -1)
    .map(s => `${s.lat},${s.lng}`)
    .join('|');

  return (
    `https://www.google.com/maps/embed/v1/directions?key=${apiKey}` +
    `&origin=${origin}&destination=${destination}` +
    (waypoints ? `&waypoints=${waypoints}` : '')
  );
}

// Free, keyless route distance/duration via the OSRM public demo server.
// Note: this is a shared public instance intended for light/demo use, not
// guaranteed for heavy traffic -- fine for a family trip planner's volume.
// If it ever becomes unreliable, the upgrade path is a self-hosted OSRM.
export interface RouteInfo {
  distanceKm: number;
  durationMin: number;
}

export async function getRouteInfo(stops: { lat: number; lng: number }[]): Promise<RouteInfo | null> {
  if (stops.length < 2) return null;
  try {
    const coords = stops.map(s => `${s.lng},${s.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) return null;
    return {
      distanceKm: Math.round(route.distance / 100) / 10,
      durationMin: Math.round(route.duration / 60),
    };
  } catch {
    return null;
  }
}

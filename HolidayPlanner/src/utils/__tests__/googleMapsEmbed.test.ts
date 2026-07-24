import { buildMapEmbedUrl } from '../googleMapsEmbed';

describe('buildMapEmbedUrl', () => {
  it('returns null for zero stops', () => {
    expect(buildMapEmbedUrl([], 'KEY')).toBeNull();
  });

  it('builds a "place" embed URL for a single stop', () => {
    const url = buildMapEmbedUrl([{ lat: 50.087, lng: 14.421 }], 'KEY');
    expect(url).toBe('https://www.google.com/maps/embed/v1/place?key=KEY&q=50.087,14.421');
  });

  it('builds a "directions" embed URL for two stops with no waypoints', () => {
    const url = buildMapEmbedUrl(
      [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }],
      'KEY'
    );
    expect(url).toBe(
      'https://www.google.com/maps/embed/v1/directions?key=KEY&origin=1,2&destination=3,4'
    );
    expect(url).not.toContain('waypoints=');
  });

  it('includes pipe-joined waypoints for 3+ stops', () => {
    const url = buildMapEmbedUrl(
      [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }, { lat: 5, lng: 6 }, { lat: 7, lng: 8 }],
      'KEY'
    );
    expect(url).toBe(
      'https://www.google.com/maps/embed/v1/directions?key=KEY&origin=1,2&destination=7,8&waypoints=3,4|5,6'
    );
  });
});

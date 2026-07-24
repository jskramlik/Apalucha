export interface Point {
  x: number;
  y: number;
}

// 0deg = 12 o'clock, increasing clockwise -- note this is atan2(dx, -dy), not the
// standard atan2(dy, dx), because clock angles start at the top, not at "3 o'clock".
// Always returns a value in [0, 360); angleToHour/angleToMinute rely on that.
export function pointToAngle(dx: number, dy: number): number {
  const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return (deg + 360) % 360;
}

export function angleToPoint(angleDeg: number, radius: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: radius * Math.sin(rad), y: -radius * Math.cos(rad) };
}

export function hourToAngle(hour: number): number {
  return (hour % 12) * 30;
}

// Input must already be normalized to [0, 360), as produced by pointToAngle.
export function angleToHour(angleDeg: number): number {
  const raw = Math.round(angleDeg / 30) % 12;
  return raw === 0 ? 12 : raw;
}

export function minuteToAngle(minute: number): number {
  return (minute % 60) * 6;
}

// Input must already be normalized to [0, 360), as produced by pointToAngle.
export function angleToMinute(angleDeg: number): number {
  return Math.round(angleDeg / 6) % 60;
}

export function to24Hour(hour12: number, period: 'AM' | 'PM'): number {
  const h = hour12 % 12;
  return period === 'PM' ? h + 12 : h;
}

export function from24Hour(hour24: number): { hour12: number; period: 'AM' | 'PM' } {
  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
  const h = hour24 % 12;
  return { hour12: h === 0 ? 12 : h, period };
}

export function parseTime24(value: string): { hour24: number; minute: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour24 = Number(match[1]);
  const minute = Number(match[2]);
  if (hour24 < 0 || hour24 > 23 || minute < 0 || minute > 59) return null;
  return { hour24, minute };
}

export function formatTime24(hour24: number, minute: number): string {
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

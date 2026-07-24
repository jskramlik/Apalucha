import {
  pointToAngle,
  angleToPoint,
  hourToAngle,
  angleToHour,
  minuteToAngle,
  angleToMinute,
  to24Hour,
  from24Hour,
  parseTime24,
  formatTime24,
} from '../clockDial';

describe('pointToAngle', () => {
  it('returns 0 for the top (12 o\'clock)', () => {
    expect(pointToAngle(0, -100)).toBe(0);
  });

  it('returns 90 for the right (3 o\'clock)', () => {
    expect(pointToAngle(100, 0)).toBe(90);
  });

  it('returns 180 for the bottom (6 o\'clock)', () => {
    expect(pointToAngle(0, 100)).toBe(180);
  });

  it('returns 270 for the left (9 o\'clock)', () => {
    expect(pointToAngle(-100, 0)).toBe(270);
  });
});

describe('angleToPoint', () => {
  it.each([0, 45, 90, 135, 180, 225, 270, 315])('round-trips with pointToAngle at %d degrees', angle => {
    const { x, y } = angleToPoint(angle, 100);
    expect(pointToAngle(x, y)).toBeCloseTo(angle, 5);
  });
});

describe('hourToAngle / angleToHour', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])('round-trips for hour %d', hour => {
    expect(angleToHour(hourToAngle(hour))).toBe(hour);
  });

  it('resolves a boundary tie (15deg) toward hour 1', () => {
    expect(angleToHour(15)).toBe(1);
  });

  it('resolves a boundary tie (345deg) toward hour 12', () => {
    expect(angleToHour(345)).toBe(12);
  });
});

describe('minuteToAngle / angleToMinute', () => {
  it.each([0, 5, 23, 30, 47, 59])('round-trips for minute %d', minute => {
    expect(angleToMinute(minuteToAngle(minute))).toBe(minute);
  });

  it('resolves a boundary tie (357deg) toward minute 0', () => {
    expect(angleToMinute(357)).toBe(0);
  });
});

describe('to24Hour / from24Hour', () => {
  it.each(Array.from({ length: 24 }, (_, i) => i))('round-trips for hour24 %d', hour24 => {
    const { hour12, period } = from24Hour(hour24);
    expect(to24Hour(hour12, period)).toBe(hour24);
  });

  it('maps midnight to 12 AM', () => {
    expect(from24Hour(0)).toEqual({ hour12: 12, period: 'AM' });
  });

  it('maps noon to 12 PM', () => {
    expect(from24Hour(12)).toEqual({ hour12: 12, period: 'PM' });
  });

  it('maps 12 AM back to hour24 0', () => {
    expect(to24Hour(12, 'AM')).toBe(0);
  });

  it('maps 12 PM back to hour24 12', () => {
    expect(to24Hour(12, 'PM')).toBe(12);
  });
});

describe('parseTime24 / formatTime24', () => {
  it('parses a valid time string', () => {
    expect(parseTime24('07:23')).toEqual({ hour24: 7, minute: 23 });
  });

  it('returns null for an empty string', () => {
    expect(parseTime24('')).toBeNull();
  });

  it('returns null for malformed input', () => {
    expect(parseTime24('7:23')).toBeNull();
    expect(parseTime24('not-a-time')).toBeNull();
  });

  it('returns null for out-of-range values', () => {
    expect(parseTime24('24:00')).toBeNull();
    expect(parseTime24('12:60')).toBeNull();
  });

  it('formats and round-trips with parseTime24', () => {
    expect(formatTime24(7, 23)).toBe('07:23');
    expect(parseTime24(formatTime24(7, 23))).toEqual({ hour24: 7, minute: 23 });
  });
});

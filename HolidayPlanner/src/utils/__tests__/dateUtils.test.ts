import {
  toIso,
  parseIso,
  daysInMonth,
  firstWeekdayOfMonth,
  nextMonth,
  previousMonth,
  buildCalendarCells,
  isWithinRange,
  MONTH_NAMES,
} from '../dateUtils';

describe('toIso', () => {
  it('pads single-digit month and day', () => {
    expect(toIso(2026, 0, 5)).toBe('2026-01-05');
  });

  it('handles double-digit month and day', () => {
    expect(toIso(2026, 11, 25)).toBe('2026-12-25');
  });
});

describe('parseIso', () => {
  it('parses a valid ISO date string', () => {
    expect(parseIso('2026-03-15')).toEqual({ year: 2026, month: 2, day: 15 });
  });

  it('returns null for an empty string', () => {
    expect(parseIso('')).toBeNull();
  });

  it('returns null for malformed input', () => {
    expect(parseIso('not-a-date')).toBeNull();
    expect(parseIso('2026/03/15')).toBeNull();
    expect(parseIso('26-03-15')).toBeNull();
  });

  it('round-trips with toIso', () => {
    const iso = toIso(2026, 6, 4);
    expect(parseIso(iso)).toEqual({ year: 2026, month: 6, day: 4 });
  });
});

describe('daysInMonth', () => {
  it('returns 31 for January', () => {
    expect(daysInMonth(2026, 0)).toBe(31);
  });

  it('returns 30 for April', () => {
    expect(daysInMonth(2026, 3)).toBe(30);
  });

  it('returns 28 for February in a non-leap year', () => {
    expect(daysInMonth(2026, 1)).toBe(28);
  });

  it('returns 29 for February in a leap year', () => {
    expect(daysInMonth(2024, 1)).toBe(29);
  });
});

describe('firstWeekdayOfMonth', () => {
  it('returns 0 (Monday) when the month starts on a Monday', () => {
    // 2026-06-01 is a Monday
    expect(firstWeekdayOfMonth(2026, 5)).toBe(0);
  });

  it('returns 6 (Sunday) when the month starts on a Sunday', () => {
    // 2026-03-01 is a Sunday
    expect(firstWeekdayOfMonth(2026, 2)).toBe(6);
  });
});

describe('nextMonth', () => {
  it('advances within the same year', () => {
    expect(nextMonth(2026, 5)).toEqual({ year: 2026, month: 6 });
  });

  it('wraps from December into January of the next year', () => {
    expect(nextMonth(2026, 11)).toEqual({ year: 2027, month: 0 });
  });
});

describe('previousMonth', () => {
  it('goes back within the same year', () => {
    expect(previousMonth(2026, 5)).toEqual({ year: 2026, month: 4 });
  });

  it('wraps from January into December of the previous year', () => {
    expect(previousMonth(2026, 0)).toEqual({ year: 2025, month: 11 });
  });
});

describe('buildCalendarCells', () => {
  it('produces the correct number of leading blanks and day cells', () => {
    // 2026-03-01 is a Sunday -> 6 leading blanks (Mon-first week), 31 days in March
    const cells = buildCalendarCells(2026, 2);
    const blanks = cells.filter(c => c === null).length;
    const days = cells.filter(c => c !== null);
    expect(blanks).toBe(6);
    expect(days).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
  });

  it('has zero leading blanks when the month starts on a Monday', () => {
    const cells = buildCalendarCells(2026, 5);
    expect(cells[0]).toBe(1);
  });
});

describe('isWithinRange', () => {
  it('returns true when no bounds are given', () => {
    expect(isWithinRange(2026, 5, 15)).toBe(true);
  });

  it('returns false for a date before minDate', () => {
    expect(isWithinRange(2026, 5, 1, '2026-06-10')).toBe(false);
  });

  it('returns false for a date after maxDate', () => {
    expect(isWithinRange(2026, 5, 20, undefined, '2026-06-10')).toBe(false);
  });

  it('returns true for a date within both bounds', () => {
    expect(isWithinRange(2026, 5, 15, '2026-06-01', '2026-06-30')).toBe(true);
  });

  it('treats the boundary dates themselves as within range', () => {
    expect(isWithinRange(2026, 5, 1, '2026-06-01', '2026-06-30')).toBe(true);
    expect(isWithinRange(2026, 5, 30, '2026-06-01', '2026-06-30')).toBe(true);
  });
});

describe('MONTH_NAMES', () => {
  it('has 12 entries starting with January and ending with December', () => {
    expect(MONTH_NAMES).toHaveLength(12);
    expect(MONTH_NAMES[0]).toBe('January');
    expect(MONTH_NAMES[11]).toBe('December');
  });
});

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const WEEKDAYS_SHORT = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export interface ParsedDate {
  year: number;
  month: number; // 0-indexed
  day: number;
}

export function toIso(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function parseIso(value: string): ParsedDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Monday-first weekday index (0 = Monday ... 6 = Sunday)
export function firstWeekdayOfMonth(year: number, month: number): number {
  const jsDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  return (jsDay + 6) % 7;
}

export function nextMonth(year: number, month: number): { year: number; month: number } {
  return month >= 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
}

export function previousMonth(year: number, month: number): { year: number; month: number } {
  return month <= 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
}

export function buildCalendarCells(year: number, month: number): (number | null)[] {
  const totalDays = daysInMonth(year, month);
  const leadingBlanks = firstWeekdayOfMonth(year, month);
  return [...Array(leadingBlanks).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];
}

export function isWithinRange(year: number, month: number, day: number, minDate?: string, maxDate?: string): boolean {
  const iso = toIso(year, month, day);
  if (minDate && iso < minDate) return false;
  if (maxDate && iso > maxDate) return false;
  return true;
}

// Uses local-time Date arithmetic (like daysInMonth/firstWeekdayOfMonth above) rather than
// toISOString(), which converts to UTC and silently shifts the result by a day in any
// timezone ahead of UTC (e.g. Europe) when the local offset crosses midnight.
export function addDays(iso: string, delta: number): string {
  const parsed = parseIso(iso);
  if (!parsed) return iso;
  const d = new Date(parsed.year, parsed.month, parsed.day);
  d.setDate(d.getDate() + delta);
  return toIso(d.getFullYear(), d.getMonth(), d.getDate());
}

// Today's date in the device's local timezone (not UTC) as an ISO string.
export function todayIso(): string {
  const d = new Date();
  return toIso(d.getFullYear(), d.getMonth(), d.getDate());
}

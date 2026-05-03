import { describe, it, expect } from 'vitest';
import { formatShortDate, isWithin, daysBetween, todayMs, startOfDayMs, endOfDayMs } from './dates';

describe('dates', () => {
  it('formatShortDate returns "MMM D"', () => {
    expect(formatShortDate(new Date('2026-05-03T12:00:00Z').getTime())).toMatch(/May\s+3/);
  });
  it('formatShortDate returns empty string for null', () => {
    expect(formatShortDate(null)).toBe('');
  });
  it('isWithin checks inclusive range', () => {
    const start = new Date('2026-05-01').getTime();
    const end = new Date('2026-05-31').getTime();
    expect(isWithin(new Date('2026-05-15').getTime(), start, end)).toBe(true);
    expect(isWithin(start, start, end)).toBe(true);
    expect(isWithin(end, start, end)).toBe(true);
    expect(isWithin(new Date('2026-04-30').getTime(), start, end)).toBe(false);
  });
  it('daysBetween is absolute', () => {
    const a = new Date('2026-05-01T00:00:00Z').getTime();
    const b = new Date('2026-05-04T00:00:00Z').getTime();
    expect(daysBetween(a, b)).toBe(3);
    expect(daysBetween(b, a)).toBe(3);
  });
  it('todayMs is current epoch ms', () => {
    const before = Date.now();
    const t = todayMs();
    const after = Date.now();
    expect(t).toBeGreaterThanOrEqual(before);
    expect(t).toBeLessThanOrEqual(after);
  });
  it('startOfDayMs and endOfDayMs frame the same date', () => {
    const ms = new Date('2026-05-03T15:30:00').getTime();
    expect(endOfDayMs(ms) - startOfDayMs(ms)).toBeGreaterThan(86_000_000);
  });
});

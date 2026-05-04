import { describe, it, expect } from 'vitest';
import { pad, pct, spanWidthPct, axisTicks } from './timeline';

const DAY = 86_400_000;

describe('pad', () => {
  it('expands span symmetrically by fraction', () => {
    const span = { start: 0, end: 100 * DAY };
    const padded = pad(span, 0.1);
    expect(padded.start).toBeLessThan(span.start);
    expect(padded.end).toBeGreaterThan(span.end);
    expect(span.start - padded.start).toBe(padded.end - span.end);
  });
  it('uses minimum padding for zero-width spans', () => {
    const span = { start: 1000, end: 1000 };
    const padded = pad(span);
    expect(padded.end).toBeGreaterThan(padded.start);
  });
});

describe('pct', () => {
  it('returns 0 at start, 100 at end', () => {
    const span = { start: 0, end: 100 };
    expect(pct(span, 0)).toBe(0);
    expect(pct(span, 100)).toBe(100);
    expect(pct(span, 50)).toBe(50);
  });
  it('clamps to [0, 100]', () => {
    const span = { start: 0, end: 100 };
    expect(pct(span, -50)).toBe(0);
    expect(pct(span, 200)).toBe(100);
  });
  it('returns 0 for zero-width span', () => {
    expect(pct({ start: 5, end: 5 }, 5)).toBe(0);
  });
});

describe('spanWidthPct', () => {
  it('measures range width as percent', () => {
    const span = { start: 0, end: 100 };
    expect(spanWidthPct(span, 25, 75)).toBe(50);
  });
  it('returns 0 when from > to', () => {
    expect(spanWidthPct({ start: 0, end: 100 }, 75, 25)).toBe(0);
  });
});

describe('axisTicks', () => {
  it('generates daily ticks for short spans', () => {
    const span = { start: 0, end: 5 * DAY };
    const ticks = axisTicks(span);
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.length).toBeLessThanOrEqual(7);
  });
  it('generates monthly ticks for long spans', () => {
    const start = new Date(2026, 0, 1).getTime();
    const end = new Date(2026, 11, 31).getTime();
    const ticks = axisTicks({ start, end });
    expect(ticks.length).toBe(12);
    expect(ticks[0].major).toBe(true);
  });
  it('returns empty for zero-width span', () => {
    expect(axisTicks({ start: 1000, end: 1000 })).toEqual([]);
  });
});

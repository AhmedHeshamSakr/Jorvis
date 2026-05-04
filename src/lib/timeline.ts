const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

export type Span = { start: number; end: number };

export function pad(span: Span, fractionOnEachSide = 0.05): Span {
  const w = Math.max(span.end - span.start, DAY_MS);
  const padding = Math.max(w * fractionOnEachSide, DAY_MS * 2);
  return { start: span.start - padding, end: span.end + padding };
}

export function pct(span: Span, ms: number): number {
  const w = span.end - span.start;
  if (w <= 0) return 0;
  return Math.max(0, Math.min(1, (ms - span.start) / w)) * 100;
}

export function spanWidthPct(span: Span, from: number, to: number): number {
  return Math.max(0, pct(span, to) - pct(span, from));
}

export type AxisTick = { ms: number; label: string; major: boolean };

const MONTH_FMT = new Intl.DateTimeFormat('en-US', { month: 'short' });
const MONTH_YEAR_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
const DAY_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

export function axisTicks(span: Span): AxisTick[] {
  const w = span.end - span.start;
  const ticks: AxisTick[] = [];
  if (w <= 0) return ticks;

  if (w <= 14 * DAY_MS) {
    let cursor = startOfDay(span.start);
    while (cursor <= span.end) {
      if (cursor >= span.start) {
        ticks.push({ ms: cursor, label: DAY_FMT.format(new Date(cursor)), major: false });
      }
      cursor += DAY_MS;
    }
  } else if (w <= 90 * DAY_MS) {
    let cursor = startOfWeek(span.start);
    while (cursor <= span.end) {
      if (cursor >= span.start) {
        ticks.push({ ms: cursor, label: DAY_FMT.format(new Date(cursor)), major: false });
      }
      cursor += WEEK_MS;
    }
  } else {
    let d = startOfMonth(new Date(span.start));
    while (d.getTime() <= span.end) {
      if (d.getTime() >= span.start) {
        const label = d.getMonth() === 0 ? MONTH_YEAR_FMT.format(d) : MONTH_FMT.format(d);
        ticks.push({ ms: d.getTime(), label, major: d.getMonth() === 0 });
      }
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
  }
  return ticks;
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeek(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.getTime();
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

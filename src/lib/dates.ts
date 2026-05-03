const SHORT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

export function formatShortDate(ms: number | null): string {
  if (ms === null) return '';
  return SHORT.format(new Date(ms));
}

export function isWithin(ms: number, startMs: number, endMs: number): boolean {
  return ms >= startMs && ms <= endMs;
}

export function daysBetween(a: number, b: number): number {
  return Math.round(Math.abs(a - b) / 86_400_000);
}

export function todayMs(): number {
  return Date.now();
}

export function startOfDayMs(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function endOfDayMs(ms: number): number {
  const d = new Date(ms);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

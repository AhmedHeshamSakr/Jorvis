import type { Stage, Item } from './schema';

export function currentStageId(stages: Stage[], items: Item[]): string {
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) return '';
  const firstWithOpen = sorted.find((s) =>
    items.some((i) => i.stageId === s.id && i.status !== 'done'),
  );
  if (firstWithOpen) return firstWithOpen.id;
  if (items.length > 0) return sorted[sorted.length - 1].id;
  return sorted[0].id;
}

export type StageProgress = { done: number; total: number };

export function stageProgress(stages: Stage[], items: Item[]): Map<string, StageProgress> {
  const map = new Map<string, StageProgress>();
  for (const s of stages) map.set(s.id, { done: 0, total: 0 });
  for (const item of items) {
    const p = map.get(item.stageId);
    if (!p) continue;
    p.total++;
    if (item.status === 'done') p.done++;
  }
  return map;
}

export function projectDuration(items: Item[]): [number, number] | null {
  const dated = items
    .map((i) => ({ start: i.startDate ?? i.dueDate, end: i.dueDate ?? i.startDate }))
    .filter((d): d is { start: number; end: number } => d.start !== null && d.end !== null);
  if (dated.length === 0) return null;
  const start = Math.min(...dated.map((d) => d.start));
  const end = Math.max(...dated.map((d) => d.end));
  return [start, end];
}

export function nextDueDate(items: Item[], now: number): number | null {
  const upcoming = items
    .map((i) => i.dueDate)
    .filter((d): d is number => d !== null && d >= now)
    .sort((a, b) => a - b);
  return upcoming[0] ?? null;
}

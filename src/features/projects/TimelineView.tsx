import { useMemo } from 'react';
import type { Project, Item, Stage } from '../../db/schema';
import { useUI } from '../../state/ui';
import { axisTicks, pad, pct, spanWidthPct, type Span } from '../../lib/timeline';
import { formatShortDate, todayMs } from '../../lib/dates';

export function TimelineView({ project, items }: { project: Project; items: Item[] }) {
  const datedItems = useMemo(
    () => items.filter((i) => i.startDate !== null || i.dueDate !== null),
    [items],
  );

  const span = useMemo<Span | null>(() => {
    if (datedItems.length === 0) return null;
    const stamps: number[] = [];
    for (const i of datedItems) {
      if (i.startDate !== null) stamps.push(i.startDate);
      if (i.dueDate !== null) stamps.push(i.dueDate);
    }
    return pad({ start: Math.min(...stamps), end: Math.max(...stamps) });
  }, [datedItems]);

  const stages = useMemo(
    () => [...project.stages].sort((a, b) => a.order - b.order),
    [project.stages],
  );

  const itemsByStage = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const s of stages) m.set(s.id, []);
    for (const i of datedItems) {
      const list = m.get(i.stageId);
      if (list) list.push(i);
    }
    return m;
  }, [stages, datedItems]);

  if (!span) {
    return (
      <div className="glass p-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
        No items have dates yet. Add a start or due date to see them on the timeline.
      </div>
    );
  }

  const ticks = axisTicks(span);
  const today = todayMs();
  const todayInRange = today >= span.start && today <= span.end;

  return (
    <div className="glass p-4 overflow-hidden">
      <Axis ticks={ticks} span={span} todayInRange={todayInRange} today={today} />
      <div className="flex flex-col gap-4 mt-3">
        {stages.map((stage) => {
          const stageItems = itemsByStage.get(stage.id) ?? [];
          if (stageItems.length === 0) return null;
          return (
            <StageRow key={stage.id} stage={stage} items={stageItems} span={span} />
          );
        })}
      </div>
    </div>
  );
}

function Axis({
  ticks,
  span,
  todayInRange,
  today,
}: {
  ticks: ReturnType<typeof axisTicks>;
  span: Span;
  todayInRange: boolean;
  today: number;
}) {
  return (
    <div
      className="relative h-7 border-b"
      style={{ borderColor: 'var(--border)' }}
    >
      {ticks.map((t) => (
        <div
          key={t.ms}
          className="absolute top-0 h-full text-[10px]"
          style={{
            left: `${pct(span, t.ms)}%`,
            color: 'var(--text-muted)',
            opacity: t.major ? 1 : 0.7,
          }}
        >
          <div
            className="h-full w-px"
            style={{ background: t.major ? 'var(--border)' : 'transparent' }}
          />
          <div
            className="absolute top-0 -translate-x-1/2 whitespace-nowrap"
            style={{ left: 0 }}
          >
            {t.label}
          </div>
        </div>
      ))}
      {todayInRange && (
        <div
          className="absolute top-0 h-full w-px"
          style={{ left: `${pct(span, today)}%`, background: 'var(--stage-rose)' }}
          title="Today"
        />
      )}
    </div>
  );
}

function StageRow({
  stage,
  items,
  span,
}: {
  stage: Stage;
  items: Item[];
  span: Span;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: stage.color }} />
        <span
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: stage.color }}
        >
          {stage.name}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <ItemBar key={item.id} item={item} stage={stage} span={span} />
        ))}
      </div>
    </div>
  );
}

function ItemBar({ item, stage, span }: { item: Item; stage: Stage; span: Span }) {
  const openDrawer = useUI((s) => s.openDrawer);
  const start = item.startDate ?? item.dueDate ?? span.start;
  const end = item.dueDate ?? item.startDate ?? span.start;
  const isPoint = item.startDate === null || item.dueDate === null || item.startDate === item.dueDate;
  const left = pct(span, start);
  const width = spanWidthPct(span, start, end);
  const done = item.status === 'done';

  return (
    <div className="relative h-7">
      {isPoint ? (
        <button
          onClick={() => openDrawer(item.id)}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 ring-1 ring-black/10 dark:ring-white/15 hover:scale-125 transition"
          style={{
            left: `${left}%`,
            background: done ? 'transparent' : stage.color,
            borderColor: stage.color,
            border: done ? `1px solid ${stage.color}` : 'none',
          }}
          title={`${item.title} · ${formatShortDate(end)}`}
        />
      ) : (
        <button
          onClick={() => openDrawer(item.id)}
          className="absolute top-1/2 -translate-y-1/2 h-5 rounded-md text-[11px] px-2 truncate text-left hover:translate-y-[calc(-50%-1px)] transition"
          style={{
            left: `${left}%`,
            width: `${Math.max(width, 1.5)}%`,
            background: `${stage.color}33`,
            borderLeft: `2px solid ${stage.color}`,
            color: 'var(--text-primary)',
            opacity: done ? 0.5 : 1,
            textDecoration: done ? 'line-through' : 'none',
          }}
          title={`${item.title} · ${formatShortDate(start)} → ${formatShortDate(end)}`}
        >
          {item.title}
        </button>
      )}
    </div>
  );
}

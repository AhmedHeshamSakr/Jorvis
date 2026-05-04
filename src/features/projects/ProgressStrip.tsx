import type { Stage, Item } from '../../db/schema';
import { stageProgress } from '../../db/queries';

type Props = { stages: Stage[]; items: Item[]; variant?: 'mini' | 'full' };

export function ProgressStrip({ stages, items, variant = 'mini' }: Props) {
  const progress = stageProgress(stages, items);
  const ordered = [...stages].sort((a, b) => a.order - b.order);

  if (variant === 'mini') {
    return (
      <div className="flex gap-1.5">
        {ordered.map((s) => {
          const p = progress.get(s.id) ?? { done: 0, total: 0 };
          const fill = p.total === 0 ? 0 : (p.done / p.total) * 100;
          return (
            <div
              key={s.id}
              className="flex-1 h-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(127,127,127,0.12)' }}
              title={`${s.name}: ${p.done}/${p.total}`}
            >
              <div style={{ width: `${fill}%`, height: '100%', background: s.color }} />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {ordered.map((s) => {
        const p = progress.get(s.id) ?? { done: 0, total: 0 };
        const fill = p.total === 0 ? 0 : (p.done / p.total) * 100;
        return (
          <div key={s.id} className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span
                className="text-[11px] font-bold tracking-wider uppercase"
                style={{ color: s.color }}
              >
                {s.name}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {p.done} / {p.total}
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(127,127,127,0.12)' }}
            >
              <div
                style={{
                  width: `${fill}%`,
                  height: '100%',
                  background: s.color,
                  transition: 'width 200ms',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

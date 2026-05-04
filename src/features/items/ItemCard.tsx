import type { Item } from '../../db/schema';
import { useUI } from '../../state/ui';
import { formatShortDate, todayMs } from '../../lib/dates';

const STATUS_LABEL: Record<Item['status'], string> = {
  todo: 'Todo',
  doing: 'Doing',
  done: 'Done',
  blocked: 'Blocked',
};

const STATUS_DOT: Record<Item['status'], string> = {
  todo: 'rgba(127,127,127,0.5)',
  doing: 'var(--stage-slate)',
  done: 'var(--stage-sage)',
  blocked: 'var(--stage-rose)',
};

export function ItemCard({ item, dragHandle }: { item: Item; dragHandle?: React.ReactNode }) {
  const openDrawer = useUI((s) => s.openDrawer);
  const overdue =
    item.dueDate !== null && item.status !== 'done' && item.dueDate < todayMs();

  return (
    <div
      onClick={() => openDrawer(item.id)}
      className="glass glass-inner p-3 cursor-pointer hover:translate-y-[-1px] transition group"
    >
      <div className="flex items-start gap-2">
        {dragHandle}
        <div className="min-w-0 flex-1">
          <div
            className={`text-sm leading-snug ${item.status === 'done' ? 'line-through opacity-60' : ''}`}
          >
            {item.title}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span className="inline-flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: STATUS_DOT[item.status] }}
              />
              {STATUS_LABEL[item.status]}
            </span>
            {item.dueDate !== null && (
              <span style={{ color: overdue ? 'var(--stage-rose)' : 'var(--text-muted)' }}>
                · {formatShortDate(item.dueDate)}
              </span>
            )}
            {item.notes.trim().length > 0 && <span>· ✎</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

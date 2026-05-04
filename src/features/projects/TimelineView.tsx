import type { Project, Item } from '../../db/schema';

export function TimelineView({ project: _project, items: _items }: { project: Project; items: Item[] }) {
  return (
    <div className="glass p-8 text-sm" style={{ color: 'var(--text-muted)' }}>
      Timeline view — coming in Phase 6.
    </div>
  );
}

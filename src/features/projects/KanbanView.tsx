import type { Project, Item } from '../../db/schema';

export function KanbanView({ project: _project, items: _items }: { project: Project; items: Item[] }) {
  return (
    <div className="glass p-8 text-sm" style={{ color: 'var(--text-muted)' }}>
      Kanban view — coming in Phase 5.
    </div>
  );
}

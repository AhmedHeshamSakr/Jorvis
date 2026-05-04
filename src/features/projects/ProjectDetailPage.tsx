import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/schema';
import { ProjectHeader } from './ProjectHeader';
import { StageManager } from './StageManager';
import { KanbanView } from './KanbanView';
import { TimelineView } from './TimelineView';

type ViewMode = 'kanban' | 'timeline';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [view, setView] = useState<ViewMode>('kanban');
  const [showStages, setShowStages] = useState(false);

  const project = useLiveQuery(() => (id ? db.projects.get(id) : undefined), [id]);
  const items = useLiveQuery(
    () => (id ? db.items.where('projectId').equals(id).toArray() : []),
    [id],
    [],
  );

  if (project === undefined) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;
  }
  if (project === null || !project) {
    return (
      <div className="text-center py-16">
        <div className="text-lg font-semibold mb-2">Project not found</div>
        <Link to="/" className="text-sm underline" style={{ color: 'var(--text-muted)' }}>
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <>
      <ProjectHeader project={project} items={items} view={view} onViewChange={setView} />

      <div className="flex justify-end mb-3">
        <button
          onClick={() => setShowStages((v) => !v)}
          className="text-xs px-2 py-1 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          style={{ color: 'var(--text-muted)' }}
        >
          {showStages ? 'Hide stages' : 'Manage stages'}
        </button>
      </div>

      {showStages && <StageManager project={project} />}

      {view === 'kanban' ? (
        <KanbanView project={project} items={items} />
      ) : (
        <TimelineView project={project} items={items} />
      )}
    </>
  );
}

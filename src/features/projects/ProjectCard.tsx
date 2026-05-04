import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Project } from '../../db/schema';
import { ProgressStrip } from './ProgressStrip';
import { currentStageId, nextDueDate } from '../../db/queries';
import { formatShortDate, todayMs } from '../../lib/dates';

export function ProjectCard({ project }: { project: Project }) {
  const items = useLiveQuery(
    () => db.items.where('projectId').equals(project.id).toArray(),
    [project.id],
    [],
  );
  const currentId = currentStageId(project.stages, items);
  const currentStage = project.stages.find((s) => s.id === currentId);
  const due = nextDueDate(items, todayMs());

  return (
    <Link
      to={`/project/${project.id}`}
      className="glass p-4 block hover:translate-y-[-1px] transition"
    >
      <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        {currentStage?.name ?? 'No stages'}
      </div>
      <div className="text-base font-semibold tracking-tight mb-3">{project.name}</div>
      <ProgressStrip stages={project.stages} items={items} variant="mini" />
      <div className="mt-3 flex justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
        <span>{items.length} items</span>
        {due && <span>Next: {formatShortDate(due)}</span>}
      </div>
    </Link>
  );
}

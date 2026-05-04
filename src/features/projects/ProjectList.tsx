import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db, type Project } from '../../db/schema';
import { currentStageId, nextDueDate } from '../../db/queries';
import { formatShortDate, todayMs } from '../../lib/dates';

type SortKey = 'name' | 'stage' | 'items' | 'due';

export function ProjectList({ projects }: { projects: Project[] }) {
  const [sort, setSort] = useState<SortKey>('name');

  return (
    <div className="glass overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ color: 'var(--text-muted)' }} className="text-[11px] uppercase tracking-wider text-left">
            <Th label="Project" active={sort === 'name'} onClick={() => setSort('name')} />
            <Th label="Stage" active={sort === 'stage'} onClick={() => setSort('stage')} />
            <Th label="Items" active={sort === 'items'} onClick={() => setSort('items')} className="text-right" />
            <Th label="Next due" active={sort === 'due'} onClick={() => setSort('due')} />
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  label,
  active,
  onClick,
  className = '',
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <th
      onClick={onClick}
      className={`px-4 py-3 cursor-pointer select-none ${active ? 'opacity-100' : 'opacity-70 hover:opacity-100'} ${className}`}
    >
      {label}
    </th>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const items = useLiveQuery(
    () => db.items.where('projectId').equals(project.id).toArray(),
    [project.id],
    [],
  );
  const currentId = currentStageId(project.stages, items);
  const currentStage = project.stages.find((s) => s.id === currentId);
  const due = nextDueDate(items, todayMs());

  return (
    <tr
      className="border-t hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition"
      style={{ borderColor: 'var(--border)' }}
    >
      <td className="px-4 py-3">
        <Link to={`/project/${project.id}`} className="font-medium hover:underline">
          {project.name}
        </Link>
      </td>
      <td className="px-4 py-3">
        {currentStage ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: currentStage.color }}
            />
            <span style={{ color: 'var(--text-muted)' }}>{currentStage.name}</span>
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right tabular-nums">{items.length}</td>
      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
        {due ? formatShortDate(due) : '—'}
      </td>
    </tr>
  );
}

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/schema';
import { restoreProject, deleteProject } from '../../db/mutations';
import { formatShortDate } from '../../lib/dates';

export function ArchivedProjects() {
  const archived = useLiveQuery(
    () => db.projects.filter((p) => p.archivedAt !== null).toArray(),
    [],
    [],
  );

  const sorted = [...archived].sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0));

  async function onDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}" forever? Items will be deleted too.`)) return;
    await deleteProject(id);
  }

  return (
    <section className="glass p-5">
      <h2 className="text-base font-semibold tracking-tight mb-4">Archived projects</h2>

      {sorted.length === 0 ? (
        <div className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
          Nothing archived.
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {sorted.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{p.name}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Archived {p.archivedAt ? formatShortDate(p.archivedAt) : '—'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => restoreProject(p.id)}
                className="text-xs px-2 py-1 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={() => onDelete(p.id, p.name)}
                className="text-xs px-2 py-1 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                style={{ color: 'var(--stage-rose)' }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

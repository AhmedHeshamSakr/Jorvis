import { useState, useMemo, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type InboxEntry } from '../../db/schema';
import { convertInboxEntry } from '../../db/mutations';

export function ConvertDialog({
  entry,
  onClose,
}: {
  entry: InboxEntry;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const projects = useLiveQuery(
    () => db.projects.filter((p) => p.archivedAt === null).toArray(),
    [],
    [],
  );
  const [projectId, setProjectId] = useState('');
  const [stageId, setStageId] = useState('');

  const stages = useMemo(() => {
    const p = projects.find((p) => p.id === projectId);
    if (!p) return [];
    return [...p.stages].sort((a, b) => a.order - b.order);
  }, [projects, projectId]);

  function selectProject(id: string) {
    setProjectId(id);
    const p = projects.find((p) => p.id === id);
    const firstStage = p?.stages[0]?.id ?? '';
    setStageId(firstStage);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !stageId) return;
    await convertInboxEntry(entry.id, projectId, stageId);
    onClose();
    navigate(`/project/${projectId}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="glass glass-inner w-full max-w-md p-6"
      >
        <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
          Convert to project item
        </div>
        <div className="text-base font-semibold tracking-tight mb-4 truncate">{entry.title}</div>

        {projects.length === 0 ? (
          <div className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
            No active projects yet. Create one first.
          </div>
        ) : (
          <>
            <Field label="Project">
              <select
                aria-label="Project"
                value={projectId}
                onChange={(e) => selectProject(e.target.value)}
                className="w-full bg-transparent text-sm rounded-md border px-2 py-1.5"
                style={{ borderColor: 'var(--border)' }}
              >
                <option value="">Select…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Stage">
              <select
                aria-label="Stage"
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                disabled={!projectId || stages.length === 0}
                className="w-full bg-transparent text-sm rounded-md border px-2 py-1.5 disabled:opacity-50"
                style={{ borderColor: 'var(--border)' }}
              >
                {stages.length === 0 && <option value="">—</option>}
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
          </>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!projectId || !stageId}
            className="px-3 py-1.5 rounded-md text-sm disabled:opacity-40"
            style={{ background: 'var(--stage-slate)', color: '#fff' }}
          >
            Convert
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <div
        className="text-[10px] uppercase tracking-wider mb-1"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}

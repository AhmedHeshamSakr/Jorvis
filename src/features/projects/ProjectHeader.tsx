import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project, Item } from '../../db/schema';
import { ProgressStrip } from './ProgressStrip';
import { currentStageId, nextDueDate } from '../../db/queries';
import { formatShortDate, todayMs } from '../../lib/dates';
import { renameProject, togglePin, archiveProject } from '../../db/mutations';

type ViewMode = 'kanban' | 'timeline';

export function ProjectHeader({
  project,
  items,
  view,
  onViewChange,
}: {
  project: Project;
  items: Item[];
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
}) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(project.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setDraft(project.name), [project.name]);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const currentId = currentStageId(project.stages, items);
  const currentStage = project.stages.find((s) => s.id === currentId);
  const due = nextDueDate(items, todayMs());

  async function commitRename() {
    const trimmed = draft.trim();
    setEditing(false);
    if (!trimmed || trimmed === project.name) {
      setDraft(project.name);
      return;
    }
    await renameProject(project.id, trimmed);
  }

  async function onArchive() {
    setMenuOpen(false);
    await archiveProject(project.id);
    navigate('/');
  }

  return (
    <header className="mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            {currentStage && (
              <span
                className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: `${currentStage.color}22`, color: currentStage.color }}
              >
                {currentStage.name}
              </span>
            )}
            {due && (
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Next: {formatShortDate(due)}
              </span>
            )}
          </div>
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') {
                  setDraft(project.name);
                  setEditing(false);
                }
              }}
              className="text-2xl font-semibold tracking-tight bg-transparent border-b outline-none w-full"
              style={{ borderColor: 'var(--border)' }}
            />
          ) : (
            <h1
              className="text-2xl font-semibold tracking-tight truncate cursor-text"
              onDoubleClick={() => setEditing(true)}
              title="Double-click to rename"
            >
              {project.name}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ViewTabs view={view} onChange={onViewChange} />
          <button
            onClick={() => togglePin(project.id)}
            className="px-2 py-1.5 rounded-md text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            title={project.pinned ? 'Unpin' : 'Pin'}
            aria-pressed={project.pinned}
          >
            {project.pinned ? '★' : '☆'}
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="px-2 py-1.5 rounded-md text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              title="More"
            >
              ⋯
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-40 glass glass-inner py-1 z-30"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setEditing(true);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                >
                  Rename
                </button>
                <button
                  onClick={onArchive}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                >
                  Archive
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ProgressStrip stages={project.stages} items={items} variant="full" />
    </header>
  );
}

function ViewTabs({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div
      className="inline-flex rounded-md border p-0.5 text-sm"
      style={{ borderColor: 'var(--border)' }}
    >
      <TabButton active={view === 'kanban'} onClick={() => onChange('kanban')}>
        Kanban
      </TabButton>
      <TabButton active={view === 'timeline'} onClick={() => onChange('timeline')}>
        Timeline
      </TabButton>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-[6px] transition ${
        active ? 'bg-black/[0.06] dark:bg-white/[0.08]' : 'opacity-70 hover:opacity-100'
      }`}
    >
      {children}
    </button>
  );
}

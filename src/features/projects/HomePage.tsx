import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/schema';
import { ProjectCard } from './ProjectCard';
import { ProjectList } from './ProjectList';
import { PortfolioTimeline } from './PortfolioTimeline';
import { NewProjectDialog } from './NewProjectDialog';

type View = 'projects' | 'timeline';

export default function HomePage() {
  const [view, setView] = useState<View>('projects');
  const [showNew, setShowNew] = useState(false);

  const projects = useLiveQuery(
    () => db.projects.filter((p) => p.archivedAt === null).toArray(),
    [],
    [],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const editable = target?.isContentEditable;
      if (tag === 'input' || tag === 'textarea' || editable) return;
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setShowNew(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pinned = projects.filter((p) => p.pinned);
  const sortedByCreated = [...projects].sort((a, b) => b.createdAt - a.createdAt);

  if (projects.length === 0) {
    return (
      <>
        <EmptyState onNew={() => setShowNew(true)} />
        {showNew && <NewProjectDialog onClose={() => setShowNew(false)} />}
      </>
    );
  }

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
        <div className="flex items-center gap-2">
          <ViewTabs view={view} onChange={setView} />
          <button
            onClick={() => setShowNew(true)}
            className="px-3 py-1.5 rounded-md text-sm"
            style={{ background: 'var(--stage-slate)', color: '#fff' }}
            title="New project (n)"
          >
            New project
          </button>
        </div>
      </header>

      {view === 'projects' ? (
        <>
          {pinned.length > 0 && (
            <section className="mb-8">
              <SectionLabel>Pinned</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinned.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionLabel>All projects</SectionLabel>
            <ProjectList projects={sortedByCreated} />
          </section>
        </>
      ) : (
        <PortfolioTimeline projects={sortedByCreated} />
      )}

      {showNew && <NewProjectDialog onClose={() => setShowNew(false)} />}
    </>
  );
}

function ViewTabs({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div
      className="inline-flex rounded-md border p-0.5 text-sm"
      style={{ borderColor: 'var(--border)' }}
    >
      <TabButton active={view === 'projects'} onClick={() => onChange('projects')}>
        Projects
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] uppercase tracking-wider mb-3"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="text-3xl font-semibold tracking-tight mb-2">No projects yet</div>
      <p className="mb-6 max-w-sm" style={{ color: 'var(--text-muted)' }}>
        Create your first project to start tracking stages, items, and stakeholders.
      </p>
      <button
        onClick={onNew}
        className="px-4 py-2 rounded-md text-sm"
        style={{ background: 'var(--stage-slate)', color: '#fff' }}
      >
        New project
      </button>
      <div className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        or press <kbd className="px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--border)' }}>n</kbd>
      </div>
    </div>
  );
}

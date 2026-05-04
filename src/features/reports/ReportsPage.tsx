import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db } from '../../db/schema';
import { generateReport } from './generate';
import { exportPdf } from './exportPdf';
import { todayMs } from '../../lib/dates';

export default function ReportsPage() {
  const [projectId, setProjectId] = useState('');
  const [copied, setCopied] = useState(false);

  const projects = useLiveQuery(
    () => db.projects.filter((p) => p.archivedAt === null).toArray(),
    [],
    [],
  );
  const project = projects.find((p) => p.id === projectId);
  const items = useLiveQuery(
    () => (projectId ? db.items.where('projectId').equals(projectId).toArray() : []),
    [projectId],
    [],
  );

  const markdown = useMemo(() => {
    if (!project) return '';
    return generateReport({ project, items, now: todayMs() });
  }, [project, items]);

  async function copyMarkdown() {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadMarkdown() {
    if (!markdown || !project) return;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(project.name)}-report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportToPdf() {
    if (!markdown || !project) return;
    exportPdf(`${project.name} — Status report`, markdown);
  }

  return (
    <>
      <header className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <div className="flex items-center gap-2">
          <select
            aria-label="Project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="bg-transparent text-sm rounded-md border px-2 py-1.5"
            style={{ borderColor: 'var(--border)' }}
          >
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={copyMarkdown}
            disabled={!markdown}
            className="text-sm px-3 py-1.5 rounded-md disabled:opacity-40 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            title="Copy markdown"
          >
            {copied ? 'Copied!' : 'Copy MD'}
          </button>
          <button
            onClick={downloadMarkdown}
            disabled={!markdown}
            className="text-sm px-3 py-1.5 rounded-md disabled:opacity-40 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            Download
          </button>
          <button
            onClick={exportToPdf}
            disabled={!markdown}
            className="text-sm px-3 py-1.5 rounded-md disabled:opacity-40"
            style={{ background: 'var(--stage-slate)', color: '#fff' }}
          >
            Print / PDF
          </button>
        </div>
      </header>

      {!project ? (
        <div className="glass p-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
          {projects.length === 0
            ? 'Create a project first to generate a report.'
            : 'Pick a project above to generate a status report.'}
        </div>
      ) : (
        <article className="glass p-8 prose prose-sm max-w-none dark:prose-invert">
          {/* react-markdown is safe-by-default — do NOT add rehype-raw, it would enable inline HTML rendering. */}
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </article>
      )}
    </>
  );
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'report';
}

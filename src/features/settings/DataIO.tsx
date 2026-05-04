import { useRef, useState } from 'react';
import { db } from '../../db/schema';
import { isValidDump, type Dump } from '../../db/validate';

const MAX_IMPORT_BYTES = 50_000_000;

export function DataIO() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function exportAll() {
    const [projects, items, inboxEntries] = await Promise.all([
      db.projects.toArray(),
      db.items.toArray(),
      db.inboxEntries.toArray(),
    ]);
    const dump: Dump = { version: 1, exportedAt: Date.now(), projects, items, inboxEntries };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tpm-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus(`Exported ${projects.length} projects, ${items.length} items, ${inboxEntries.length} inbox entries.`);
  }

  async function importFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      if (file.size > MAX_IMPORT_BYTES) {
        throw new Error(`File too large (${Math.round(file.size / 1_000_000)} MB, max 50 MB)`);
      }
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (!isValidDump(parsed)) {
        throw new Error('File is not a valid TPM backup (schema mismatch)');
      }
      const dump: Dump = parsed;
      if (!confirm(`Import ${dump.projects.length} projects, ${dump.items.length} items, ${dump.inboxEntries.length} inbox entries? This will REPLACE all current data.`)) return;
      if (!confirm('This action cannot be undone. Export a backup of the current data first if you might need it. Continue?')) return;
      await db.transaction('rw', db.projects, db.items, db.inboxEntries, async () => {
        await db.projects.clear();
        await db.items.clear();
        await db.inboxEntries.clear();
        await db.projects.bulkAdd(dump.projects);
        await db.items.bulkAdd(dump.items);
        await db.inboxEntries.bulkAdd(dump.inboxEntries);
      });
      setStatus(`Imported ${dump.projects.length} projects.`);
    } catch (err) {
      setStatus(`Import failed: ${(err as Error).message}`);
    }
  }

  async function clearAll() {
    if (!confirm('Delete ALL projects, items, and inbox entries? This cannot be undone.')) return;
    if (!confirm('Are you really sure? Export a backup first if you might need this data.')) return;
    await db.transaction('rw', db.projects, db.items, db.inboxEntries, async () => {
      await db.projects.clear();
      await db.items.clear();
      await db.inboxEntries.clear();
    });
    setStatus('All data cleared.');
  }

  return (
    <section className="glass p-5">
      <h2 className="text-base font-semibold tracking-tight mb-1">Data</h2>
      <p className="text-[11px] mb-4" style={{ color: 'var(--text-muted)' }}>
        Everything is stored locally in your browser. Export regularly.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={exportAll}
          className="text-sm px-3 py-1.5 rounded-md"
          style={{ background: 'var(--stage-slate)', color: '#fff' }}
        >
          Export backup
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-sm px-3 py-1.5 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06] border"
          style={{ borderColor: 'var(--border)' }}
        >
          Import backup…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          onChange={importFile}
          className="hidden"
          aria-label="Import backup file"
        />
      </div>

      {status && (
        <div className="text-[11px] mb-4" style={{ color: 'var(--text-muted)' }}>
          {status}
        </div>
      )}

      <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--stage-rose)' }}>
          Danger zone
        </div>
        <button
          type="button"
          onClick={clearAll}
          className="text-sm px-3 py-1.5 rounded-md border hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          style={{ borderColor: 'var(--stage-rose)', color: 'var(--stage-rose)' }}
        >
          Clear all data
        </button>
      </div>
    </section>
  );
}

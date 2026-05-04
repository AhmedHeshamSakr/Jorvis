import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type InboxEntry } from '../../db/schema';
import { dismissInboxEntry, updateInboxEntry } from '../../db/mutations';
import { QuickCapture } from './QuickCapture';
import { ConvertDialog } from './ConvertDialog';
import { formatShortDate } from '../../lib/dates';

export default function InboxPage() {
  const [convertTarget, setConvertTarget] = useState<InboxEntry | null>(null);
  const [showDismissed, setShowDismissed] = useState(false);

  const open = useLiveQuery(
    () => db.inboxEntries.where('status').equals('open').toArray(),
    [],
    [],
  );
  const dismissed = useLiveQuery(
    () => db.inboxEntries.where('status').equals('dismissed').toArray(),
    [],
    [],
  );

  const sortedOpen = [...open].sort((a, b) => b.createdAt - a.createdAt);
  const sortedDismissed = [...dismissed].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {open.length} open
        </div>
      </header>

      <QuickCapture autoFocus />

      {sortedOpen.length === 0 ? (
        <div className="glass p-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
          Nothing pending. Capture a thought above.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {sortedOpen.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onConvert={() => setConvertTarget(entry)}
            />
          ))}
        </ul>
      )}

      {sortedDismissed.length > 0 && (
        <section className="mt-8">
          <button
            onClick={() => setShowDismissed((v) => !v)}
            className="text-[11px] uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            {showDismissed ? '▾' : '▸'} Dismissed ({sortedDismissed.length})
          </button>
          {showDismissed && (
            <ul className="flex flex-col gap-2 opacity-60">
              {sortedDismissed.map((entry) => (
                <li key={entry.id} className="glass p-3 text-sm">
                  <div className="line-through truncate">{entry.title}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {formatShortDate(entry.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {convertTarget && (
        <ConvertDialog entry={convertTarget} onClose={() => setConvertTarget(null)} />
      )}
    </>
  );
}

function EntryRow({
  entry,
  onConvert,
}: {
  entry: InboxEntry;
  onConvert: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.title);

  async function commitTitle() {
    const trimmed = draft.trim();
    setEditing(false);
    if (!trimmed || trimmed === entry.title) {
      setDraft(entry.title);
      return;
    }
    await updateInboxEntry(entry.id, { title: trimmed });
  }

  return (
    <li className="glass glass-inner p-3 group">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              aria-label="Edit title"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') {
                  setDraft(entry.title);
                  setEditing(false);
                }
              }}
              className="w-full text-sm bg-transparent outline-none border-b"
              style={{ borderColor: 'var(--border)' }}
            />
          ) : (
            <div
              className="text-sm leading-snug cursor-text"
              onDoubleClick={() => setEditing(true)}
              title="Double-click to rename"
            >
              {entry.title}
            </div>
          )}
          {entry.notes && (
            <div className="text-[11px] mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
              {entry.notes}
            </div>
          )}
          <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {formatShortDate(entry.createdAt)}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition shrink-0">
          <button
            onClick={onConvert}
            className="text-xs px-2 py-1 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            title="Convert to item"
          >
            → Convert
          </button>
          <button
            onClick={() => dismissInboxEntry(entry.id)}
            className="text-xs px-2 py-1 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            title="Dismiss"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>
      </div>
    </li>
  );
}

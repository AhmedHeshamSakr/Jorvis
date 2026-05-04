import { useState, type FormEvent } from 'react';
import { createInboxEntry } from '../../db/mutations';

export function QuickCapture({ autoFocus = false }: { autoFocus?: boolean }) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await createInboxEntry(trimmed, notes.trim());
    setTitle('');
    setNotes('');
    setShowNotes(false);
  }

  return (
    <form onSubmit={submit} className="glass glass-inner p-3 mb-6">
      <div className="flex items-center gap-2">
        <input
          autoFocus={autoFocus}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Capture a thought…"
          className="flex-1 bg-transparent text-sm outline-none px-1 py-1.5"
        />
        <button
          type="button"
          onClick={() => setShowNotes((v) => !v)}
          className="text-xs px-2 py-1 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          style={{ color: 'var(--text-muted)' }}
        >
          {showNotes ? 'Hide notes' : 'Add notes'}
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="text-sm px-3 py-1 rounded-md disabled:opacity-40"
          style={{ background: 'var(--stage-slate)', color: '#fff' }}
        >
          Add
        </button>
      </div>
      {showNotes && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={3}
          className="mt-2 w-full bg-transparent text-sm outline-none px-1 py-1 border-t pt-2"
          style={{ borderColor: 'var(--border)' }}
        />
      )}
    </form>
  );
}

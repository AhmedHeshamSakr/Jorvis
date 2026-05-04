import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import MDEditor from '@uiw/react-md-editor';
import { db, type Item, type ItemStatus } from '../../db/schema';
import { useUI } from '../../state/ui';
import { updateItem, deleteItem, moveItemToStage } from '../../db/mutations';

const STATUSES: ItemStatus[] = ['todo', 'doing', 'done', 'blocked'];

const STATUS_LABEL: Record<ItemStatus, string> = {
  todo: 'Todo',
  doing: 'Doing',
  done: 'Done',
  blocked: 'Blocked',
};

export function ItemDrawer() {
  const drawerItemId = useUI((s) => s.drawerItemId);
  const closeDrawer = useUI((s) => s.closeDrawer);
  const theme = useUI((s) => s.theme);

  const item = useLiveQuery(
    () => (drawerItemId ? db.items.get(drawerItemId) : undefined),
    [drawerItemId],
  );
  const project = useLiveQuery(
    () => (item ? db.projects.get(item.projectId) : undefined),
    [item?.projectId],
  );

  useEffect(() => {
    if (!drawerItemId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerItemId, closeDrawer]);

  if (!drawerItemId) return null;
  if (!item || !project) {
    return (
      <DrawerShell onClose={closeDrawer}>
        <div className="p-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Loading…
        </div>
      </DrawerShell>
    );
  }

  return (
    <DrawerShell onClose={closeDrawer}>
      <DrawerBody item={item} stages={project.stages} colorMode={theme === 'dark' ? 'dark' : 'light'} />
    </DrawerShell>
  );
}

function DrawerShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex justify-end"
      style={{ background: 'rgba(0,0,0,0.3)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-full overflow-y-auto"
        style={{ background: 'var(--bg-base)', borderLeft: '1px solid var(--border)' }}
      >
        {children}
      </div>
    </div>
  );
}

function DrawerBody({
  item,
  stages,
  colorMode,
}: {
  item: Item;
  stages: Array<{ id: string; name: string }>;
  colorMode: 'light' | 'dark';
}) {
  const closeDrawer = useUI((s) => s.closeDrawer);
  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes);

  useEffect(() => setTitle(item.title), [item.id, item.title]);
  useEffect(() => setNotes(item.notes), [item.id, item.notes]);

  async function commitTitle() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === item.title) {
      setTitle(item.title);
      return;
    }
    await updateItem(item.id, { title: trimmed });
  }

  async function commitNotes() {
    if (notes === item.notes) return;
    await updateItem(item.id, { notes });
  }

  async function onDelete() {
    if (!confirm('Delete this item?')) return;
    await deleteItem(item.id);
    closeDrawer();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Item
        </div>
        <button
          onClick={closeDrawer}
          className="px-2 py-1 rounded-md text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <input
        aria-label="Item title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        className="w-full text-lg font-semibold tracking-tight bg-transparent border-b outline-none mb-5 pb-1"
        style={{ borderColor: 'var(--border)' }}
      />

      <div className="grid grid-cols-2 gap-3 mb-5">
        <Field label="Status">
          <select
            aria-label="Status"
            value={item.status}
            onChange={(e) => updateItem(item.id, { status: e.target.value as ItemStatus })}
            className="w-full bg-transparent text-sm rounded-md border px-2 py-1.5"
            style={{ borderColor: 'var(--border)' }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </Field>

        <Field label="Stage">
          <select
            aria-label="Stage"
            value={item.stageId}
            onChange={(e) => moveItemToStage(item.id, e.target.value)}
            className="w-full bg-transparent text-sm rounded-md border px-2 py-1.5"
            style={{ borderColor: 'var(--border)' }}
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Start">
          <DateInput
            value={item.startDate}
            onChange={(v) => updateItem(item.id, { startDate: v })}
          />
        </Field>

        <Field label="Due">
          <DateInput
            value={item.dueDate}
            onChange={(v) => updateItem(item.id, { dueDate: v })}
          />
        </Field>
      </div>

      <Field label="Notes">
        <div data-color-mode={colorMode}>
          <MDEditor
            value={notes}
            onChange={(v) => setNotes(v ?? '')}
            onBlur={commitNotes}
            preview="edit"
            height={260}
            visibleDragbar={false}
          />
        </div>
      </Field>

      <div
        className="mt-6 pt-4 flex justify-between items-center border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          Created {new Date(item.createdAt).toLocaleDateString()}
        </div>
        <button
          onClick={onDelete}
          className="text-xs px-2 py-1 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          style={{ color: 'var(--stage-rose)' }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
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

function DateInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const formatted = value ? new Date(value).toISOString().slice(0, 10) : '';
  return (
    <input
      aria-label="Date"
      type="date"
      value={formatted}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v ? new Date(v).getTime() : null);
      }}
      className="w-full bg-transparent text-sm rounded-md border px-2 py-1.5"
      style={{ borderColor: 'var(--border)' }}
    />
  );
}

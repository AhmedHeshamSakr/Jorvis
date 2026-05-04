import { useState } from 'react';
import type { Project } from '../../db/schema';
import {
  addStage,
  renameStage,
  recolorStage,
  deleteStage,
  reorderStages,
} from '../../db/mutations';

const PALETTE = ['#6b7ca8', '#c4a66f', '#85b89d', '#9a6b71'];

export function StageManager({ project }: { project: Project }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]);

  const ordered = [...project.stages].sort((a, b) => a.order - b.order);

  async function commitAdd() {
    const trimmed = newName.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    await addStage(project.id, trimmed, newColor);
    setNewName('');
    setNewColor(PALETTE[0]);
    setAdding(false);
  }

  async function move(stageId: string, dir: -1 | 1) {
    const idx = ordered.findIndex((s) => s.id === stageId);
    const nextIdx = idx + dir;
    if (idx < 0 || nextIdx < 0 || nextIdx >= ordered.length) return;
    const next = [...ordered];
    [next[idx], next[nextIdx]] = [next[nextIdx], next[idx]];
    await reorderStages(project.id, next.map((s) => s.id));
  }

  async function onDelete(stageId: string) {
    if (project.stages.length <= 1) return;
    const fallback = project.stages.find((s) => s.id !== stageId);
    if (!fallback) return;
    if (!confirm('Delete this stage? Items will move to the previous stage.')) return;
    await deleteStage(project.id, stageId, fallback.id);
  }

  return (
    <section className="glass p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div
          className="text-[11px] uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          Stages
        </div>
        <button
          onClick={() => setAdding(true)}
          className="text-xs px-2 py-1 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
        >
          + Add stage
        </button>
      </div>
      <ul className="space-y-1">
        {ordered.map((s, i) => (
          <li
            key={s.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-black/[0.03] dark:hover:bg-white/[0.04] group"
          >
            <ColorSwatch
              value={s.color}
              onChange={(c) => recolorStage(project.id, s.id, c)}
            />
            <input
              defaultValue={s.name}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== s.name) renameStage(project.id, s.id, v);
                else e.target.value = s.name;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') {
                  (e.target as HTMLInputElement).value = s.name;
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
              <button
                onClick={() => move(s.id, -1)}
                disabled={i === 0}
                className="px-1.5 py-0.5 text-xs rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-30"
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => move(s.id, 1)}
                disabled={i === ordered.length - 1}
                className="px-1.5 py-0.5 text-xs rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-30"
                title="Move down"
              >
                ↓
              </button>
              <button
                onClick={() => onDelete(s.id)}
                disabled={project.stages.length <= 1}
                className="px-1.5 py-0.5 text-xs rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-30"
                title="Delete"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
      {adding && (
        <div className="flex items-center gap-2 mt-3 px-2 py-1.5">
          <ColorSwatch value={newColor} onChange={setNewColor} />
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={commitAdd}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitAdd();
              if (e.key === 'Escape') {
                setNewName('');
                setAdding(false);
              }
            }}
            placeholder="Stage name"
            className="flex-1 bg-transparent text-sm outline-none border-b"
            style={{ borderColor: 'var(--border)' }}
          />
        </div>
      )}
    </section>
  );
}

function ColorSwatch({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-3 h-3 rounded-full ring-1 ring-black/10 dark:ring-white/15"
        style={{ background: value }}
        title="Change color"
      />
      {open && (
        <div
          className="absolute left-0 top-full mt-1 glass glass-inner p-1.5 flex gap-1 z-30"
          onMouseLeave={() => setOpen(false)}
        >
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
              className="w-4 h-4 rounded-full ring-1 ring-black/10 dark:ring-white/15"
              style={{ background: c }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import type { ProjectTemplate, Stage } from '../../db/schema';
import { TEMPLATE_NAMES, templateLabel } from '../../lib/templates';

const PALETTE = ['#6b7ca8', '#c4a66f', '#85b89d', '#9a6b71'];
const STORAGE_KEY = 'tpm-templates';
type Draft = Omit<Stage, 'id'>;

const DEFAULT_TEMPLATES: Record<ProjectTemplate, Draft[]> = {
  software: [
    { name: 'Discovery', color: PALETTE[0], order: 0 },
    { name: 'Design', color: PALETTE[1], order: 1 },
    { name: 'Build', color: PALETTE[2], order: 2 },
    { name: 'Ship', color: PALETTE[3], order: 3 },
  ],
  research: [
    { name: 'Question', color: PALETTE[0], order: 0 },
    { name: 'Explore', color: PALETTE[1], order: 1 },
    { name: 'Synthesize', color: PALETTE[2], order: 2 },
    { name: 'Publish', color: PALETTE[3], order: 3 },
  ],
  content: [
    { name: 'Idea', color: PALETTE[0], order: 0 },
    { name: 'Draft', color: PALETTE[1], order: 1 },
    { name: 'Edit', color: PALETTE[2], order: 2 },
    { name: 'Publish', color: PALETTE[3], order: 3 },
  ],
  custom: [],
};

function readStored(): Partial<Record<ProjectTemplate, Draft[]>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStored(t: ProjectTemplate, stages: Draft[]) {
  const all = readStored();
  all[t] = stages;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function clearStored(t: ProjectTemplate) {
  const all = readStored();
  delete all[t];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function TemplatesEditor() {
  const [active, setActive] = useState<ProjectTemplate>('software');
  const [stages, setStages] = useState<Draft[]>(() => {
    const stored = readStored();
    return stored.software ?? DEFAULT_TEMPLATES.software;
  });

  useEffect(() => {
    const stored = readStored();
    setStages(stored[active] ?? DEFAULT_TEMPLATES[active]);
  }, [active]);

  function commit(next: Draft[]) {
    const reordered = next.map((s, i) => ({ ...s, order: i }));
    setStages(reordered);
    writeStored(active, reordered);
  }

  function rename(idx: number, name: string) {
    const next = [...stages];
    next[idx] = { ...next[idx], name };
    commit(next);
  }
  function recolor(idx: number, color: string) {
    const next = [...stages];
    next[idx] = { ...next[idx], color };
    commit(next);
  }
  function add() {
    commit([...stages, { name: 'New stage', color: PALETTE[stages.length % PALETTE.length], order: stages.length }]);
  }
  function remove(idx: number) {
    commit(stages.filter((_, i) => i !== idx));
  }
  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= stages.length) return;
    const next = [...stages];
    [next[idx], next[j]] = [next[j], next[idx]];
    commit(next);
  }
  function reset() {
    clearStored(active);
    setStages(DEFAULT_TEMPLATES[active]);
  }

  return (
    <section className="glass p-5">
      <h2 className="text-base font-semibold tracking-tight mb-1">Templates</h2>
      <p className="text-[11px] mb-4" style={{ color: 'var(--text-muted)' }}>
        Stages used when creating new projects. Existing projects are not affected.
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {TEMPLATE_NAMES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActive(t)}
            className={`px-3 py-1.5 rounded-md text-sm border transition ${active === t ? 'ring-2' : ''}`}
            style={{
              borderColor: 'var(--border)',
              background: active === t ? 'var(--surface)' : 'transparent',
            }}
          >
            {templateLabel(t)}
          </button>
        ))}
      </div>

      <ul className="space-y-1.5">
        {stages.map((s, i) => (
          <li
            key={i}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-black/[0.03] dark:hover:bg-white/[0.04] group"
          >
            <ColorPicker value={s.color} onChange={(c) => recolor(i, c)} />
            <input
              aria-label="Stage name"
              value={s.name}
              onChange={(e) => rename(i, e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-1.5 py-0.5 text-xs rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-30">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === stages.length - 1} className="px-1.5 py-0.5 text-xs rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-30">↓</button>
              <button type="button" onClick={() => remove(i)} className="px-1.5 py-0.5 text-xs rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08]">✕</button>
            </div>
          </li>
        ))}
        {stages.length === 0 && (
          <li className="text-sm py-3 text-center" style={{ color: 'var(--text-muted)' }}>
            No stages — add one below.
          </li>
        )}
      </ul>

      <div className="flex justify-between items-center mt-4">
        <button
          type="button"
          onClick={add}
          className="text-sm px-3 py-1.5 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
        >
          + Add stage
        </button>
        <button
          type="button"
          onClick={reset}
          className="text-xs px-2 py-1 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          style={{ color: 'var(--text-muted)' }}
        >
          Reset to defaults
        </button>
      </div>
    </section>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-3 h-3 rounded-full ring-1 ring-black/10 dark:ring-white/15"
        style={{ background: value }}
        title="Color"
      />
      {open && (
        <div
          className="absolute left-0 top-full mt-1 glass glass-inner p-1.5 flex gap-1 z-30"
          onMouseLeave={() => setOpen(false)}
        >
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
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

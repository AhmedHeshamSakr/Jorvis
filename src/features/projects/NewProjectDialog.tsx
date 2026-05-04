import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEMPLATE_NAMES, templateLabel } from '../../lib/templates';
import { createProject } from '../../db/mutations';
import type { ProjectTemplate } from '../../db/schema';

export function NewProjectDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [template, setTemplate] = useState<ProjectTemplate>('software');
  const navigate = useNavigate();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const id = await createProject(name.trim(), template);
    onClose();
    navigate(`/project/${id}`);
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
        <h2 className="text-lg font-semibold tracking-tight mb-4">New project</h2>
        <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
          Name
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Mosque Command Center"
          className="w-full rounded-md px-3 py-2 mb-4 bg-transparent border outline-none"
          style={{ borderColor: 'var(--border)' }}
        />
        <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
          Template
        </label>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {TEMPLATE_NAMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTemplate(t)}
              className={`px-3 py-2 rounded-md border text-sm transition ${template === t ? 'ring-2' : ''}`}
              style={{
                borderColor: 'var(--border)',
                background: template === t ? 'var(--surface)' : 'transparent',
              }}
            >
              {templateLabel(t)}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="px-3 py-1.5 rounded-md text-sm disabled:opacity-40"
            style={{ background: 'var(--stage-slate)', color: '#fff' }}
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}

import { useSW } from '../state/sw';

export function UpdateToast() {
  const needRefresh = useSW((s) => s.needRefresh);
  const setNeedRefresh = useSW((s) => s.setNeedRefresh);
  const applyUpdate = useSW((s) => s.applyUpdate);

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="glass glass-inner fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 max-w-sm shadow-lg"
    >
      <div className="flex-1">
        <div className="text-sm font-medium">A new version is ready</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Refresh to update. Your data stays put.
        </div>
      </div>
      <button
        type="button"
        onClick={() => applyUpdate()}
        className="px-3 py-1.5 rounded-md text-sm border transition"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        Refresh
      </button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        aria-label="Dismiss"
        className="px-2 py-1 rounded-md text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        ×
      </button>
    </div>
  );
}

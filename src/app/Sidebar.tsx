import { NavLink } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

const navItems = [
  { to: '/', label: 'Home', icon: '◰' },
  { to: '/inbox', label: 'Inbox', icon: '⌬' },
  { to: '/reports', label: 'Reports', icon: '☷' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export function Sidebar() {
  const inboxOpenCount = useLiveQuery(
    () => db.inboxEntries.where('status').equals('open').count(),
    [],
    0,
  );
  const pinned = useLiveQuery(
    () => db.projects.filter((p) => p.pinned && p.archivedAt === null).toArray(),
    [],
    [],
  );

  return (
    <aside
      className="w-56 shrink-0 p-4 flex flex-col gap-1 border-r"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="px-2 mb-4">
        <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          The Project
        </div>
        <div className="text-base font-semibold tracking-tight">Maneger</div>
      </div>
      {navItems.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${
              isActive
                ? 'bg-black/[0.04] dark:bg-white/[0.06]'
                : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
            }`
          }
        >
          <span className="opacity-60 w-4 text-center">{n.icon}</span>
          <span>{n.label}</span>
          {n.to === '/inbox' && inboxOpenCount > 0 && (
            <span
              className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--stage-slate)', color: '#fff' }}
            >
              {inboxOpenCount}
            </span>
          )}
        </NavLink>
      ))}
      {pinned.length > 0 && (
        <>
          <div className="my-3 h-px" style={{ background: 'var(--border)' }} />
          <div
            className="px-3 mb-1 text-[10px] uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Pinned
          </div>
          {pinned.map((p) => (
            <NavLink
              key={p.id}
              to={`/project/${p.id}`}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm truncate transition ${
                  isActive
                    ? 'bg-black/[0.04] dark:bg-white/[0.06]'
                    : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                }`
              }
            >
              {p.name}
            </NavLink>
          ))}
        </>
      )}
    </aside>
  );
}

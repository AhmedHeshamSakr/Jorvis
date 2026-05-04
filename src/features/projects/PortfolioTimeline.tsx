import type { Project } from '../../db/schema';

export function PortfolioTimeline({ projects: _projects }: { projects: Project[] }) {
  return (
    <div className="glass p-8 text-sm" style={{ color: 'var(--text-muted)' }}>
      Portfolio timeline view — coming in Phase 6.
    </div>
  );
}

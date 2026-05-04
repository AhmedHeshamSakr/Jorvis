import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Project, type Item } from '../../db/schema';
import { axisTicks, pad, pct, spanWidthPct, type Span } from '../../lib/timeline';
import { currentStageId, projectDuration } from '../../db/queries';
import { todayMs } from '../../lib/dates';

type Row = {
  project: Project;
  range: [number, number];
  color: string;
  stageName: string | null;
};

export function PortfolioTimeline({ projects }: { projects: Project[] }) {
  const allItems = useLiveQuery(() => db.items.toArray(), [], []);

  const rows = useMemo<Row[]>(() => {
    const itemsByProject = new Map<string, Item[]>();
    for (const item of allItems) {
      if (!itemsByProject.has(item.projectId)) itemsByProject.set(item.projectId, []);
      itemsByProject.get(item.projectId)!.push(item);
    }
    const out: Row[] = [];
    for (const project of projects) {
      const items = itemsByProject.get(project.id) ?? [];
      const range = projectDuration(items);
      if (!range) continue;
      const stageId = currentStageId(project.stages, items);
      const stage = project.stages.find((s) => s.id === stageId);
      out.push({
        project,
        range,
        color: stage?.color ?? 'var(--stage-slate)',
        stageName: stage?.name ?? null,
      });
    }
    return out.sort((a, b) => a.range[0] - b.range[0]);
  }, [projects, allItems]);

  if (rows.length === 0) {
    return (
      <div className="glass p-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
        No projects with dated items yet. Add start or due dates to items to see them here.
      </div>
    );
  }

  const span = pad({
    start: Math.min(...rows.map((r) => r.range[0])),
    end: Math.max(...rows.map((r) => r.range[1])),
  });
  const ticks = axisTicks(span);
  const today = todayMs();
  const todayInRange = today >= span.start && today <= span.end;

  return (
    <div className="glass p-4 overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: '160px 1fr', gap: '12px' }}>
        <div />
        <Axis ticks={ticks} span={span} todayInRange={todayInRange} today={today} />
        {rows.map(({ project, range, color, stageName }) => (
          <ProjectRow
            key={project.id}
            project={project}
            range={range}
            color={color}
            stageName={stageName}
            span={span}
          />
        ))}
      </div>
    </div>
  );
}

function Axis({
  ticks,
  span,
  todayInRange,
  today,
}: {
  ticks: ReturnType<typeof axisTicks>;
  span: Span;
  todayInRange: boolean;
  today: number;
}) {
  return (
    <div className="relative h-7 border-b" style={{ borderColor: 'var(--border)' }}>
      {ticks.map((t) => (
        <div
          key={t.ms}
          className="absolute top-0 h-full text-[10px]"
          style={{
            left: `${pct(span, t.ms)}%`,
            color: 'var(--text-muted)',
            opacity: t.major ? 1 : 0.7,
          }}
        >
          <div
            className="h-full w-px"
            style={{ background: t.major ? 'var(--border)' : 'transparent' }}
          />
          <div className="absolute top-0 -translate-x-1/2 whitespace-nowrap" style={{ left: 0 }}>
            {t.label}
          </div>
        </div>
      ))}
      {todayInRange && (
        <div
          className="absolute top-0 h-full w-px"
          style={{ left: `${pct(span, today)}%`, background: 'var(--stage-rose)' }}
          title="Today"
        />
      )}
    </div>
  );
}

function ProjectRow({
  project,
  range,
  color,
  stageName,
  span,
}: {
  project: Project;
  range: [number, number];
  color: string;
  stageName: string | null;
  span: Span;
}) {
  const left = pct(span, range[0]);
  const width = spanWidthPct(span, range[0], range[1]);
  return (
    <>
      <div className="flex flex-col justify-center min-w-0">
        <Link
          to={`/project/${project.id}`}
          className="text-sm font-medium truncate hover:underline"
        >
          {project.name}
        </Link>
        {stageName && (
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {stageName}
          </span>
        )}
      </div>
      <div className="relative h-7">
        <Link
          to={`/project/${project.id}`}
          className="absolute top-1/2 -translate-y-1/2 h-5 rounded-md hover:translate-y-[calc(-50%-1px)] transition"
          style={{
            left: `${left}%`,
            width: `${Math.max(width, 1.5)}%`,
            background: `${color}33`,
            borderLeft: `2px solid ${color}`,
          }}
          title={project.name}
        />
      </div>
    </>
  );
}

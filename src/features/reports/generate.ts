import type { Project, Item } from '../../db/schema';
import { currentStageId, stageProgress, projectDuration, nextDueDate } from '../../db/queries';
import { formatShortDate } from '../../lib/dates';

const STATUS_LABEL: Record<Item['status'], string> = {
  todo: 'Todo',
  doing: 'Doing',
  done: 'Done',
  blocked: 'Blocked',
};

export type ReportInput = { project: Project; items: Item[]; now: number };

export function generateReport({ project, items, now }: ReportInput): string {
  const stages = [...project.stages].sort((a, b) => a.order - b.order);
  const lines: string[] = [];

  lines.push(`# ${project.name}`);
  lines.push(`*Status report · ${formatShortDate(now)}*`);
  lines.push('');

  const range = projectDuration(items);
  const due = nextDueDate(items, now);
  const currentId = currentStageId(stages, items);
  const currentStage = stages.find((s) => s.id === currentId);
  const progress = stageProgress(stages, items);

  const summary: string[] = [];
  if (currentStage) summary.push(`**Stage:** ${currentStage.name}`);
  if (range) summary.push(`**Span:** ${formatShortDate(range[0])} → ${formatShortDate(range[1])}`);
  if (due) summary.push(`**Next due:** ${formatShortDate(due)}`);
  if (summary.length > 0) {
    lines.push(summary.join(' · '));
    lines.push('');
  }

  if (stages.length > 0) {
    lines.push('## Progress');
    for (const s of stages) {
      const p = progress.get(s.id) ?? { done: 0, total: 0 };
      const bar = renderBar(p.done, p.total);
      lines.push(`- **${s.name}** — ${bar} ${p.done}/${p.total}`);
    }
    lines.push('');
  }

  const recentTransitions = recentStageMoves(items, stages, now, 14);
  if (recentTransitions.length > 0) {
    lines.push('## Recent stage moves (last 14 days)');
    for (const t of recentTransitions) {
      lines.push(`- ${formatShortDate(t.at)} — *${t.itemTitle}* → **${t.toStageName}**`);
    }
    lines.push('');
  }

  const recentlyCompleted = items
    .filter((i) => i.status === 'done' && i.completedAt !== null && i.completedAt >= now - 14 * 86_400_000)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  if (recentlyCompleted.length > 0) {
    lines.push('## Recently completed');
    for (const item of recentlyCompleted) {
      const stage = stages.find((s) => s.id === item.stageId);
      lines.push(`- ${formatShortDate(item.completedAt!)} — ${item.title}${stage ? ` *(${stage.name})*` : ''}`);
    }
    lines.push('');
  }

  const open = items.filter((i) => i.status !== 'done');
  if (open.length > 0) {
    lines.push('## Open work');
    for (const stage of stages) {
      const stageOpen = open
        .filter((i) => i.stageId === stage.id)
        .sort((a, b) => a.order - b.order);
      if (stageOpen.length === 0) continue;
      lines.push(`### ${stage.name}`);
      for (const item of stageOpen) {
        const dueLabel = item.dueDate !== null ? ` · due ${formatShortDate(item.dueDate)}` : '';
        const status = item.status === 'todo' ? '' : ` *[${STATUS_LABEL[item.status]}]*`;
        lines.push(`- ${item.title}${status}${dueLabel}`);
      }
      lines.push('');
    }
  }

  const blocked = items.filter((i) => i.status === 'blocked');
  if (blocked.length > 0) {
    lines.push('## Blocked');
    for (const item of blocked) {
      lines.push(`- ${item.title}`);
      if (item.notes.trim()) {
        const firstLine = item.notes.trim().split('\n')[0];
        lines.push(`  ${firstLine}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd() + '\n';
}

function renderBar(done: number, total: number): string {
  const width = 10;
  if (total === 0) return '`░░░░░░░░░░`';
  const filled = Math.round((done / total) * width);
  return '`' + '█'.repeat(filled) + '░'.repeat(width - filled) + '`';
}

type Move = { at: number; itemTitle: string; toStageName: string };

function recentStageMoves(items: Item[], stages: Project['stages'], now: number, days: number): Move[] {
  const cutoff = now - days * 86_400_000;
  const stageName = new Map(stages.map((s) => [s.id, s.name]));
  const out: Move[] = [];
  for (const item of items) {
    for (let i = 1; i < item.stageHistory.length; i++) {
      const t = item.stageHistory[i];
      if (t.enteredAt < cutoff) continue;
      out.push({
        at: t.enteredAt,
        itemTitle: item.title,
        toStageName: stageName.get(t.stageId) ?? '?',
      });
    }
  }
  return out.sort((a, b) => b.at - a.at);
}

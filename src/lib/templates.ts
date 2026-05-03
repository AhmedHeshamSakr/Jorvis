import type { ProjectTemplate, Stage } from '../db/schema';
import { newId } from './ids';

export const TEMPLATE_NAMES: ProjectTemplate[] = ['software', 'research', 'content', 'custom'];

const PALETTE = ['#6b7ca8', '#c4a66f', '#85b89d', '#9a6b71'];

const TEMPLATE_STAGE_NAMES: Record<ProjectTemplate, string[]> = {
  software: ['Discovery', 'Design', 'Build', 'Ship'],
  research: ['Question', 'Explore', 'Synthesize', 'Publish'],
  content: ['Idea', 'Draft', 'Edit', 'Publish'],
  custom: [],
};

export function getTemplateStages(template: ProjectTemplate): Stage[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('tpm-templates') : null;
    if (raw) {
      const parsed = JSON.parse(raw) as Record<ProjectTemplate, Omit<Stage, 'id'>[]>;
      const list = parsed[template];
      if (Array.isArray(list)) {
        return list.map((s, i) => ({ id: newId(), name: s.name, color: s.color, order: i }));
      }
    }
  } catch {
    /* fall through */
  }
  const names = TEMPLATE_STAGE_NAMES[template];
  return names.map((name, i) => ({
    id: newId(),
    name,
    color: PALETTE[i % PALETTE.length],
    order: i,
  }));
}

export function templateLabel(template: ProjectTemplate): string {
  return template[0].toUpperCase() + template.slice(1);
}

import { describe, it, expect, beforeEach } from 'vitest';
import { getTemplateStages, TEMPLATE_NAMES } from './templates';

beforeEach(() => {
  if (typeof localStorage !== 'undefined') localStorage.removeItem('tpm-templates');
});

describe('templates', () => {
  it('exposes 4 template names', () => {
    expect(TEMPLATE_NAMES).toEqual(['software', 'research', 'content', 'custom']);
  });
  it('software template = Discovery, Design, Build, Ship', () => {
    expect(getTemplateStages('software').map((s) => s.name)).toEqual(['Discovery', 'Design', 'Build', 'Ship']);
  });
  it('research template has 4 stages', () => {
    expect(getTemplateStages('research')).toHaveLength(4);
  });
  it('content template has 4 stages', () => {
    expect(getTemplateStages('content')).toHaveLength(4);
  });
  it('custom has zero stages', () => {
    expect(getTemplateStages('custom')).toEqual([]);
  });
  it('stages have unique ids', () => {
    const stages = getTemplateStages('software');
    expect(new Set(stages.map((s) => s.id)).size).toBe(stages.length);
  });
  it('uses palette colors in order', () => {
    expect(getTemplateStages('software').map((s) => s.color)).toEqual(['#6b7ca8', '#c4a66f', '#85b89d', '#9a6b71']);
  });
});

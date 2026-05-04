import { describe, it, expect } from 'vitest';
import { generateReport } from './generate';
import type { Project, Item } from '../../db/schema';

const NOW = new Date('2026-05-04T12:00:00Z').getTime();
const DAY = 86_400_000;

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'Test Project',
    template: 'software',
    stages: [
      { id: 's1', name: 'Discovery', color: '#6b7ca8', order: 0 },
      { id: 's2', name: 'Build', color: '#85b89d', order: 1 },
    ],
    pinned: false,
    archivedAt: null,
    createdAt: NOW - 30 * DAY,
    ...overrides,
  };
}

function makeItem(overrides: Partial<Item>): Item {
  return {
    id: 'i?',
    projectId: 'p1',
    stageId: 's1',
    title: 'Item',
    status: 'todo',
    startDate: null,
    dueDate: null,
    notes: '',
    order: 0,
    stageHistory: [{ stageId: 's1', enteredAt: NOW - 10 * DAY }],
    createdAt: NOW - 10 * DAY,
    completedAt: null,
    ...overrides,
  };
}

describe('generateReport', () => {
  it('renders title with project name and date', () => {
    const out = generateReport({ project: makeProject(), items: [], now: NOW });
    expect(out).toMatch(/^# Test Project/);
    expect(out).toContain('Status report');
  });

  it('shows current stage as the leftmost stage with open items', () => {
    const out = generateReport({
      project: makeProject(),
      items: [makeItem({ id: 'i1', stageId: 's1', status: 'todo' })],
      now: NOW,
    });
    expect(out).toContain('**Stage:** Discovery');
  });

  it('includes a progress section listing every stage', () => {
    const out = generateReport({
      project: makeProject(),
      items: [
        makeItem({ id: 'i1', stageId: 's1', status: 'done', completedAt: NOW - DAY }),
        makeItem({ id: 'i2', stageId: 's2', status: 'todo' }),
      ],
      now: NOW,
    });
    expect(out).toContain('## Progress');
    expect(out).toContain('**Discovery**');
    expect(out).toContain('1/1');
    expect(out).toContain('0/1');
  });

  it('lists recently completed items with completion date', () => {
    const out = generateReport({
      project: makeProject(),
      items: [makeItem({ id: 'i1', title: 'Wrap up', status: 'done', completedAt: NOW - 2 * DAY })],
      now: NOW,
    });
    expect(out).toContain('## Recently completed');
    expect(out).toContain('Wrap up');
  });

  it('omits completions older than 14 days', () => {
    const out = generateReport({
      project: makeProject(),
      items: [makeItem({ id: 'i1', title: 'Ancient', status: 'done', completedAt: NOW - 30 * DAY })],
      now: NOW,
    });
    expect(out).not.toContain('## Recently completed');
  });

  it('groups open work by stage and lists statuses', () => {
    const out = generateReport({
      project: makeProject(),
      items: [
        makeItem({ id: 'i1', stageId: 's1', title: 'Define scope', status: 'doing' }),
        makeItem({ id: 'i2', stageId: 's2', title: 'Build it', status: 'todo' }),
      ],
      now: NOW,
    });
    expect(out).toContain('## Open work');
    expect(out).toContain('### Discovery');
    expect(out).toContain('Define scope');
    expect(out).toContain('[Doing]');
    expect(out).toContain('### Build');
    expect(out).toContain('Build it');
  });

  it('lists blocked items in a dedicated section with first notes line', () => {
    const out = generateReport({
      project: makeProject(),
      items: [
        makeItem({ id: 'i1', title: 'Vendor approval', status: 'blocked', notes: 'Waiting on legal\nDetails…' }),
      ],
      now: NOW,
    });
    expect(out).toContain('## Blocked');
    expect(out).toContain('Vendor approval');
    expect(out).toContain('Waiting on legal');
    expect(out).not.toContain('Details');
  });

  it('records recent stage moves from stageHistory', () => {
    const out = generateReport({
      project: makeProject(),
      items: [
        makeItem({
          id: 'i1',
          title: 'Migrate',
          stageId: 's2',
          status: 'doing',
          stageHistory: [
            { stageId: 's1', enteredAt: NOW - 20 * DAY },
            { stageId: 's2', enteredAt: NOW - 3 * DAY },
          ],
        }),
      ],
      now: NOW,
    });
    expect(out).toContain('## Recent stage moves');
    expect(out).toContain('Migrate');
    expect(out).toContain('**Build**');
  });

  it('renders an empty progress bar for stages with no items', () => {
    const out = generateReport({ project: makeProject(), items: [], now: NOW });
    expect(out).toContain('0/0');
  });
});

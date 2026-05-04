import { describe, it, expect } from 'vitest';
import { isHexColor, assertHexColor, isValidDump, type Dump } from './validate';

describe('isHexColor', () => {
  it('accepts 3, 4, 6, 8 hex digits with leading #', () => {
    expect(isHexColor('#abc')).toBe(true);
    expect(isHexColor('#abcd')).toBe(true);
    expect(isHexColor('#aabbcc')).toBe(true);
    expect(isHexColor('#aabbccdd')).toBe(true);
    expect(isHexColor('#6b7ca8')).toBe(true);
  });
  it('rejects strings that could carry CSS injection payloads', () => {
    expect(isHexColor('red; background-image: url(https://evil)')).toBe(false);
    expect(isHexColor('#abc; background: url(x)')).toBe(false);
    expect(isHexColor('rgb(0,0,0)')).toBe(false);
    expect(isHexColor('')).toBe(false);
    expect(isHexColor('aabbcc')).toBe(false);
    expect(isHexColor(null)).toBe(false);
    expect(isHexColor(undefined)).toBe(false);
    expect(isHexColor(123)).toBe(false);
  });
});

describe('assertHexColor', () => {
  it('returns the value when valid', () => {
    expect(assertHexColor('#fff')).toBe('#fff');
  });
  it('throws on invalid input', () => {
    expect(() => assertHexColor('red')).toThrow(/Invalid color/);
    expect(() => assertHexColor('#abc; payload')).toThrow(/Invalid color/);
  });
});

describe('isValidDump', () => {
  const validDump: Dump = {
    version: 1,
    exportedAt: 1_700_000_000_000,
    projects: [
      {
        id: 'p1',
        name: 'Test',
        template: 'software',
        stages: [{ id: 's1', name: 'Discovery', color: '#6b7ca8', order: 0 }],
        pinned: false,
        archivedAt: null,
        createdAt: 1_700_000_000_000,
      },
    ],
    items: [
      {
        id: 'i1',
        projectId: 'p1',
        stageId: 's1',
        title: 'Item',
        status: 'todo',
        startDate: null,
        dueDate: null,
        notes: '',
        order: 0,
        stageHistory: [{ stageId: 's1', enteredAt: 1_700_000_000_000 }],
        createdAt: 1_700_000_000_000,
        completedAt: null,
      },
    ],
    inboxEntries: [],
  };

  it('accepts a well-formed dump', () => {
    expect(isValidDump(validDump)).toBe(true);
  });
  it('rejects null/undefined/non-objects', () => {
    expect(isValidDump(null)).toBe(false);
    expect(isValidDump(undefined)).toBe(false);
    expect(isValidDump('string')).toBe(false);
    expect(isValidDump(42)).toBe(false);
  });
  it('rejects wrong version', () => {
    expect(isValidDump({ ...validDump, version: 2 })).toBe(false);
  });
  it('rejects missing arrays', () => {
    expect(isValidDump({ ...validDump, projects: undefined })).toBe(false);
    expect(isValidDump({ ...validDump, items: 'not an array' })).toBe(false);
  });
  it('rejects projects with non-hex colors (CSS injection vector)', () => {
    const bad = {
      ...validDump,
      projects: [
        {
          ...validDump.projects[0],
          stages: [{ id: 's1', name: 'X', color: 'red; background-image: url(https://evil)', order: 0 }],
        },
      ],
    };
    expect(isValidDump(bad)).toBe(false);
  });
  it('rejects items missing stageHistory', () => {
    const bad = { ...validDump, items: [{ ...validDump.items[0], stageHistory: null as unknown as never }] };
    expect(isValidDump(bad)).toBe(false);
  });
  it('rejects items with invalid status enum', () => {
    const bad = { ...validDump, items: [{ ...validDump.items[0], status: 'spinning' as never }] };
    expect(isValidDump(bad)).toBe(false);
  });
});

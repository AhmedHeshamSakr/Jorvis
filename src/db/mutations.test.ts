import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './schema';
import { createProject, renameProject, togglePin, archiveProject, restoreProject, deleteProject } from './mutations';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('createProject', () => {
  it('creates with template stages', async () => {
    const id = await createProject('My App', 'software');
    const p = await db.projects.get(id);
    expect(p?.name).toBe('My App');
    expect(p?.template).toBe('software');
    expect(p?.stages).toHaveLength(4);
    expect(p?.pinned).toBe(false);
    expect(p?.archivedAt).toBeNull();
    expect(p?.createdAt).toBeGreaterThan(0);
  });
  it('custom = zero stages', async () => {
    const id = await createProject('Empty', 'custom');
    expect((await db.projects.get(id))?.stages).toEqual([]);
  });
});

describe('renameProject', () => {
  it('updates name', async () => {
    const id = await createProject('Old', 'software');
    await renameProject(id, 'New');
    expect((await db.projects.get(id))?.name).toBe('New');
  });
});

describe('togglePin', () => {
  it('flips pinned', async () => {
    const id = await createProject('P', 'software');
    await togglePin(id);
    expect((await db.projects.get(id))?.pinned).toBe(true);
    await togglePin(id);
    expect((await db.projects.get(id))?.pinned).toBe(false);
  });
});

describe('archive/restore', () => {
  it('archive sets archivedAt; restore clears it', async () => {
    const id = await createProject('P', 'software');
    await archiveProject(id);
    expect((await db.projects.get(id))?.archivedAt).not.toBeNull();
    await restoreProject(id);
    expect((await db.projects.get(id))?.archivedAt).toBeNull();
  });
});

describe('deleteProject', () => {
  it('removes project + items', async () => {
    const projectId = await createProject('P', 'software');
    await db.items.add({
      id: 'item-1',
      projectId,
      stageId: 'x',
      title: 'T',
      status: 'todo',
      startDate: null,
      dueDate: null,
      notes: '',
      order: 0,
      stageHistory: [{ stageId: 'x', enteredAt: Date.now() }],
      createdAt: Date.now(),
      completedAt: null,
    });
    await deleteProject(projectId);
    expect(await db.projects.get(projectId)).toBeUndefined();
    expect(await db.items.where('projectId').equals(projectId).count()).toBe(0);
  });
});

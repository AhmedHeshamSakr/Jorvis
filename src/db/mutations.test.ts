import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './schema';
import { createProject, renameProject, togglePin, archiveProject, restoreProject, deleteProject } from './mutations';
import {
  createItem, updateItem, moveItemToStage, reorderItem, deleteItem,
  addStage, renameStage, recolorStage, reorderStages, deleteStage,
  createInboxEntry, updateInboxEntry, dismissInboxEntry, convertInboxEntry,
} from './mutations';

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

describe('createItem', () => {
  it('creates with stageHistory bootstrap', async () => {
    const projectId = await createProject('P', 'software');
    const firstStage = (await db.projects.get(projectId))!.stages[0];
    const itemId = await createItem(projectId, firstStage.id, 'My item');
    const item = await db.items.get(itemId);
    expect(item?.title).toBe('My item');
    expect(item?.stageId).toBe(firstStage.id);
    expect(item?.status).toBe('todo');
    expect(item?.stageHistory).toHaveLength(1);
    expect(item?.stageHistory[0].stageId).toBe(firstStage.id);
  });
});

describe('updateItem', () => {
  it('sets completedAt when transitioning to done', async () => {
    const projectId = await createProject('P', 'software');
    const stageId = (await db.projects.get(projectId))!.stages[0].id;
    const itemId = await createItem(projectId, stageId, 'X');
    await updateItem(itemId, { status: 'done' });
    expect((await db.items.get(itemId))?.completedAt).not.toBeNull();
  });
  it('clears completedAt when leaving done', async () => {
    const projectId = await createProject('P', 'software');
    const stageId = (await db.projects.get(projectId))!.stages[0].id;
    const itemId = await createItem(projectId, stageId, 'X');
    await updateItem(itemId, { status: 'done' });
    await updateItem(itemId, { status: 'todo' });
    expect((await db.items.get(itemId))?.completedAt).toBeNull();
  });
});

describe('moveItemToStage', () => {
  it('changes stageId + appends history', async () => {
    const projectId = await createProject('P', 'software');
    const stages = (await db.projects.get(projectId))!.stages;
    const itemId = await createItem(projectId, stages[0].id, 'X');
    await moveItemToStage(itemId, stages[1].id);
    const item = await db.items.get(itemId);
    expect(item?.stageId).toBe(stages[1].id);
    expect(item?.stageHistory).toHaveLength(2);
  });
  it('skips history when moving to same stage', async () => {
    const projectId = await createProject('P', 'software');
    const stages = (await db.projects.get(projectId))!.stages;
    const itemId = await createItem(projectId, stages[0].id, 'X');
    await moveItemToStage(itemId, stages[0].id);
    expect((await db.items.get(itemId))?.stageHistory).toHaveLength(1);
  });
});

describe('addStage / renameStage / recolorStage / reorderStages / deleteStage', () => {
  it('addStage appends', async () => {
    const projectId = await createProject('P', 'custom');
    await addStage(projectId, 'Plan', '#6b7ca8');
    const project = await db.projects.get(projectId);
    expect(project?.stages).toHaveLength(1);
    expect(project?.stages[0].name).toBe('Plan');
    expect(project?.stages[0].order).toBe(0);
  });
  it('renameStage updates name', async () => {
    const projectId = await createProject('P', 'software');
    const stageId = (await db.projects.get(projectId))!.stages[0].id;
    await renameStage(projectId, stageId, 'Renamed');
    expect((await db.projects.get(projectId))?.stages.find((s) => s.id === stageId)?.name).toBe('Renamed');
  });
  it('recolorStage updates color', async () => {
    const projectId = await createProject('P', 'software');
    const stageId = (await db.projects.get(projectId))!.stages[0].id;
    await recolorStage(projectId, stageId, '#ff0000');
    expect((await db.projects.get(projectId))?.stages.find((s) => s.id === stageId)?.color).toBe('#ff0000');
  });
  it('reorderStages applies new order', async () => {
    const projectId = await createProject('P', 'software');
    const stages = (await db.projects.get(projectId))!.stages;
    const reversedIds = [...stages].reverse().map((s) => s.id);
    await reorderStages(projectId, reversedIds);
    const updated = await db.projects.get(projectId);
    expect(updated?.stages.map((s) => s.id)).toEqual(reversedIds);
    expect(updated?.stages.map((s) => s.order)).toEqual([0, 1, 2, 3]);
  });
  it('deleteStage moves items to fallback', async () => {
    const projectId = await createProject('P', 'software');
    const stages = (await db.projects.get(projectId))!.stages;
    const itemId = await createItem(projectId, stages[0].id, 'X');
    await deleteStage(projectId, stages[0].id, stages[1].id);
    const project = await db.projects.get(projectId);
    expect(project?.stages.find((s) => s.id === stages[0].id)).toBeUndefined();
    const item = await db.items.get(itemId);
    expect(item?.stageId).toBe(stages[1].id);
    expect(item?.stageHistory).toHaveLength(2);
  });
});

describe('inbox mutations', () => {
  it('createInboxEntry sets status open', async () => {
    const id = await createInboxEntry('Quick capture');
    expect((await db.inboxEntries.get(id))?.status).toBe('open');
  });
  it('dismissInboxEntry sets dismissed', async () => {
    const id = await createInboxEntry('X');
    await dismissInboxEntry(id);
    expect((await db.inboxEntries.get(id))?.status).toBe('dismissed');
  });
  it('convertInboxEntry creates linked item', async () => {
    const projectId = await createProject('P', 'software');
    const stageId = (await db.projects.get(projectId))!.stages[0].id;
    const inboxId = await createInboxEntry('From meeting');
    const itemId = await convertInboxEntry(inboxId, projectId, stageId);
    const entry = await db.inboxEntries.get(inboxId);
    expect(entry?.status).toBe('converted');
    expect(entry?.convertedToItemId).toBe(itemId);
    expect((await db.items.get(itemId))?.title).toBe('From meeting');
  });
  it('updateInboxEntry edits title and notes', async () => {
    const id = await createInboxEntry('a');
    await updateInboxEntry(id, { title: 'b', notes: 'c' });
    const entry = await db.inboxEntries.get(id);
    expect(entry?.title).toBe('b');
    expect(entry?.notes).toBe('c');
  });
});

describe('reorderItem', () => {
  it('reorders within stage', async () => {
    const projectId = await createProject('P', 'software');
    const stageId = (await db.projects.get(projectId))!.stages[0].id;
    const a = await createItem(projectId, stageId, 'A');
    const b = await createItem(projectId, stageId, 'B');
    const c = await createItem(projectId, stageId, 'C');
    await reorderItem(projectId, stageId, [c, a, b]);
    const items = await db.items.where('[projectId+stageId]').equals([projectId, stageId]).sortBy('order');
    expect(items.map((i) => i.id)).toEqual([c, a, b]);
    expect(items.map((i) => i.order)).toEqual([0, 1, 2]);
  });
});

describe('deleteItem', () => {
  it('removes item', async () => {
    const projectId = await createProject('P', 'software');
    const stageId = (await db.projects.get(projectId))!.stages[0].id;
    const itemId = await createItem(projectId, stageId, 'X');
    await deleteItem(itemId);
    expect(await db.items.get(itemId)).toBeUndefined();
  });
});

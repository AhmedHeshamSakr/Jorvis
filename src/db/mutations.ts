import { db, type ProjectTemplate, type Project } from './schema';
import type { Item, InboxEntry, Stage } from './schema';
import { getTemplateStages } from '../lib/templates';
import { newId } from '../lib/ids';

export async function createProject(name: string, template: ProjectTemplate): Promise<string> {
  const id = newId();
  const project: Project = {
    id,
    name,
    template,
    stages: getTemplateStages(template),
    pinned: false,
    archivedAt: null,
    createdAt: Date.now(),
  };
  await db.transaction('rw', db.projects, async () => {
    await db.projects.add(project);
  });
  return id;
}

export async function renameProject(id: string, name: string): Promise<void> {
  await db.transaction('rw', db.projects, async () => {
    await db.projects.update(id, { name });
  });
}

export async function togglePin(id: string): Promise<void> {
  await db.transaction('rw', db.projects, async () => {
    const p = await db.projects.get(id);
    if (!p) return;
    await db.projects.update(id, { pinned: !p.pinned });
  });
}

export async function archiveProject(id: string): Promise<void> {
  await db.transaction('rw', db.projects, async () => {
    await db.projects.update(id, { archivedAt: Date.now() });
  });
}

export async function restoreProject(id: string): Promise<void> {
  await db.transaction('rw', db.projects, async () => {
    await db.projects.update(id, { archivedAt: null });
  });
}

export async function deleteProject(id: string): Promise<void> {
  await db.transaction('rw', db.projects, db.items, async () => {
    await db.items.where('projectId').equals(id).delete();
    await db.projects.delete(id);
  });
}

export async function createItem(projectId: string, stageId: string, title: string): Promise<string> {
  const id = newId();
  const now = Date.now();
  const orderMax = await db.items.where('[projectId+stageId]').equals([projectId, stageId]).count();
  const item: Item = {
    id, projectId, stageId, title,
    status: 'todo',
    startDate: null, dueDate: null,
    notes: '',
    order: orderMax,
    stageHistory: [{ stageId, enteredAt: now }],
    createdAt: now, completedAt: null,
  };
  await db.transaction('rw', db.items, async () => {
    await db.items.add(item);
  });
  return id;
}

export async function updateItem(
  id: string,
  patch: Partial<Pick<Item, 'title' | 'status' | 'startDate' | 'dueDate' | 'notes'>>,
): Promise<void> {
  await db.transaction('rw', db.items, async () => {
    const item = await db.items.get(id);
    if (!item) return;
    const next: Partial<Item> = { ...patch };
    if (patch.status === 'done' && item.status !== 'done') {
      next.completedAt = Date.now();
    } else if (patch.status && patch.status !== 'done' && item.status === 'done') {
      next.completedAt = null;
    }
    await db.items.update(id, next);
  });
}

export async function moveItemToStage(itemId: string, newStageId: string): Promise<void> {
  await db.transaction('rw', db.items, async () => {
    const item = await db.items.get(itemId);
    if (!item) return;
    if (item.stageId === newStageId) return;
    const orderMax = await db.items.where('[projectId+stageId]').equals([item.projectId, newStageId]).count();
    await db.items.update(itemId, {
      stageId: newStageId,
      order: orderMax,
      stageHistory: [...item.stageHistory, { stageId: newStageId, enteredAt: Date.now() }],
    });
  });
}

export async function reorderItem(
  _projectId: string,
  _stageId: string,
  orderedIds: string[],
): Promise<void> {
  await db.transaction('rw', db.items, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.items.update(orderedIds[i], { order: i });
    }
  });
}

export async function deleteItem(id: string): Promise<void> {
  await db.transaction('rw', db.items, async () => {
    await db.items.delete(id);
  });
}

export async function addStage(projectId: string, name: string, color: string): Promise<void> {
  await db.transaction('rw', db.projects, async () => {
    const p = await db.projects.get(projectId);
    if (!p) return;
    const newStage: Stage = { id: newId(), name, color, order: p.stages.length };
    await db.projects.update(projectId, { stages: [...p.stages, newStage] });
  });
}

export async function renameStage(projectId: string, stageId: string, name: string): Promise<void> {
  await db.transaction('rw', db.projects, async () => {
    const p = await db.projects.get(projectId);
    if (!p) return;
    const stages = p.stages.map((s) => (s.id === stageId ? { ...s, name } : s));
    await db.projects.update(projectId, { stages });
  });
}

export async function recolorStage(projectId: string, stageId: string, color: string): Promise<void> {
  await db.transaction('rw', db.projects, async () => {
    const p = await db.projects.get(projectId);
    if (!p) return;
    const stages = p.stages.map((s) => (s.id === stageId ? { ...s, color } : s));
    await db.projects.update(projectId, { stages });
  });
}

export async function reorderStages(projectId: string, orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.projects, async () => {
    const p = await db.projects.get(projectId);
    if (!p) return;
    const byId = new Map(p.stages.map((s) => [s.id, s]));
    const stages = orderedIds.map((id, i) => ({ ...byId.get(id)!, order: i }));
    await db.projects.update(projectId, { stages });
  });
}

export async function deleteStage(projectId: string, stageId: string, fallbackStageId: string): Promise<void> {
  await db.transaction('rw', db.projects, db.items, async () => {
    const p = await db.projects.get(projectId);
    if (!p) return;
    const remaining = p.stages.filter((s) => s.id !== stageId).map((s, i) => ({ ...s, order: i }));
    await db.projects.update(projectId, { stages: remaining });
    const items = await db.items.where('[projectId+stageId]').equals([projectId, stageId]).toArray();
    for (const item of items) {
      await db.items.update(item.id, {
        stageId: fallbackStageId,
        stageHistory: [...item.stageHistory, { stageId: fallbackStageId, enteredAt: Date.now() }],
      });
    }
  });
}

export async function createInboxEntry(title: string, notes = ''): Promise<string> {
  const id = newId();
  const entry: InboxEntry = {
    id, title, notes,
    status: 'open',
    convertedToItemId: null,
    createdAt: Date.now(),
  };
  await db.transaction('rw', db.inboxEntries, async () => {
    await db.inboxEntries.add(entry);
  });
  return id;
}

export async function updateInboxEntry(
  id: string,
  patch: Partial<Pick<InboxEntry, 'title' | 'notes'>>,
): Promise<void> {
  await db.transaction('rw', db.inboxEntries, async () => {
    await db.inboxEntries.update(id, patch);
  });
}

export async function dismissInboxEntry(id: string): Promise<void> {
  await db.transaction('rw', db.inboxEntries, async () => {
    await db.inboxEntries.update(id, { status: 'dismissed' });
  });
}

export async function convertInboxEntry(
  inboxId: string,
  projectId: string,
  stageId: string,
): Promise<string> {
  let itemId = '';
  await db.transaction('rw', db.inboxEntries, db.items, async () => {
    const entry = await db.inboxEntries.get(inboxId);
    if (!entry) throw new Error(`InboxEntry ${inboxId} not found`);
    const orderMax = await db.items.where('[projectId+stageId]').equals([projectId, stageId]).count();
    itemId = newId();
    const item: Item = {
      id: itemId, projectId, stageId,
      title: entry.title,
      status: 'todo',
      startDate: null, dueDate: null,
      notes: entry.notes,
      order: orderMax,
      stageHistory: [{ stageId, enteredAt: Date.now() }],
      createdAt: Date.now(),
      completedAt: null,
    };
    await db.items.add(item);
    await db.inboxEntries.update(inboxId, { status: 'converted', convertedToItemId: itemId });
  });
  return itemId;
}

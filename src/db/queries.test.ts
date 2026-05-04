import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './schema';
import { createProject, createItem, updateItem } from './mutations';
import { currentStageId, stageProgress, projectDuration, nextDueDate } from './queries';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('currentStageId', () => {
  it('leftmost when empty', async () => {
    const projectId = await createProject('P', 'software');
    const stages = (await db.projects.get(projectId))!.stages;
    expect(currentStageId(stages, [])).toBe(stages[0].id);
  });

  it('leftmost with non-done items', async () => {
    const projectId = await createProject('P', 'software');
    const project = (await db.projects.get(projectId))!;
    const [s0, s1, s2] = project.stages;
    const i0 = await createItem(projectId, s0.id, 'a');
    await updateItem(i0, { status: 'done' });
    await createItem(projectId, s1.id, 'b');
    await createItem(projectId, s2.id, 'c');
    const items = await db.items.where('projectId').equals(projectId).toArray();
    expect(currentStageId(project.stages, items)).toBe(s1.id);
  });

  it('rightmost when all done', async () => {
    const projectId = await createProject('P', 'software');
    const stages = (await db.projects.get(projectId))!.stages;
    const ids = await Promise.all(stages.map((s) => createItem(projectId, s.id, 'x')));
    for (const id of ids) await updateItem(id, { status: 'done' });
    const items = await db.items.where('projectId').equals(projectId).toArray();
    expect(currentStageId(stages, items)).toBe(stages[stages.length - 1].id);
  });
});

describe('stageProgress', () => {
  it('done/total per stage', async () => {
    const projectId = await createProject('P', 'software');
    const project = (await db.projects.get(projectId))!;
    const [s0, s1] = project.stages;
    const a = await createItem(projectId, s0.id, 'a');
    await createItem(projectId, s0.id, 'b');
    await createItem(projectId, s1.id, 'c');
    await updateItem(a, { status: 'done' });
    const items = await db.items.where('projectId').equals(projectId).toArray();
    const p = stageProgress(project.stages, items);
    expect(p.get(s0.id)).toEqual({ done: 1, total: 2 });
    expect(p.get(s1.id)).toEqual({ done: 0, total: 1 });
  });
});

describe('projectDuration', () => {
  it('null when no dates', async () => {
    const projectId = await createProject('P', 'software');
    const stageId = (await db.projects.get(projectId))!.stages[0].id;
    await createItem(projectId, stageId, 'a');
    const items = await db.items.where('projectId').equals(projectId).toArray();
    expect(projectDuration(items)).toBeNull();
  });

  it('[min, max]', async () => {
    const projectId = await createProject('P', 'software');
    const stageId = (await db.projects.get(projectId))!.stages[0].id;
    const a = await createItem(projectId, stageId, 'a');
    const b = await createItem(projectId, stageId, 'b');
    await updateItem(a, { startDate: 100, dueDate: 200 });
    await updateItem(b, { startDate: 50, dueDate: 300 });
    const items = await db.items.where('projectId').equals(projectId).toArray();
    expect(projectDuration(items)).toEqual([50, 300]);
  });
});

describe('nextDueDate', () => {
  it('soonest future dueDate', async () => {
    const projectId = await createProject('P', 'software');
    const stageId = (await db.projects.get(projectId))!.stages[0].id;
    const a = await createItem(projectId, stageId, 'a');
    const b = await createItem(projectId, stageId, 'b');
    await updateItem(a, { dueDate: 5000 });
    await updateItem(b, { dueDate: 3000 });
    const items = await db.items.where('projectId').equals(projectId).toArray();
    expect(nextDueDate(items, 1000)).toBe(3000);
  });

  it('skips past', async () => {
    const projectId = await createProject('P', 'software');
    const stageId = (await db.projects.get(projectId))!.stages[0].id;
    const a = await createItem(projectId, stageId, 'a');
    await updateItem(a, { dueDate: 1000 });
    const items = await db.items.where('projectId').equals(projectId).toArray();
    expect(nextDueDate(items, 5000)).toBeNull();
  });
});

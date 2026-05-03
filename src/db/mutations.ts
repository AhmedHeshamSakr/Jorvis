import { db, type ProjectTemplate, type Project } from './schema';
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

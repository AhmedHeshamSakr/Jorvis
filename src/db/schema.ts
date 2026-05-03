import Dexie, { type Table } from 'dexie';

export type ProjectTemplate = 'software' | 'research' | 'content' | 'custom';
export type Stage = { id: string; name: string; color: string; order: number };
export type Project = {
  id: string;
  name: string;
  template: ProjectTemplate;
  stages: Stage[];
  pinned: boolean;
  archivedAt: number | null;
  createdAt: number;
};
export type ItemStatus = 'todo' | 'doing' | 'done' | 'blocked';
export type StageTransition = { stageId: string; enteredAt: number };
export type Item = {
  id: string;
  projectId: string;
  stageId: string;
  title: string;
  status: ItemStatus;
  startDate: number | null;
  dueDate: number | null;
  notes: string;
  order: number;
  stageHistory: StageTransition[];
  createdAt: number;
  completedAt: number | null;
};
export type InboxStatus = 'open' | 'converted' | 'dismissed';
export type InboxEntry = {
  id: string;
  title: string;
  notes: string;
  status: InboxStatus;
  convertedToItemId: string | null;
  createdAt: number;
};

export class AppDB extends Dexie {
  projects!: Table<Project, string>;
  items!: Table<Item, string>;
  inboxEntries!: Table<InboxEntry, string>;

  constructor() {
    super('the_project_maneger');
    this.version(1).stores({
      projects: 'id, archivedAt, pinned, createdAt',
      items: 'id, projectId, stageId, status, dueDate, completedAt, [projectId+stageId]',
      inboxEntries: 'id, status, createdAt',
    });
  }
}

export const db = new AppDB();

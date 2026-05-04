import type { Project, Item, InboxEntry, Stage, ItemStatus, InboxStatus } from './schema';

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const ITEM_STATUSES: ItemStatus[] = ['todo', 'doing', 'done', 'blocked'];
const INBOX_STATUSES: InboxStatus[] = ['open', 'converted', 'dismissed'];

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX.test(value);
}

export function assertHexColor(value: unknown): string {
  if (!isHexColor(value)) throw new Error(`Invalid color: ${String(value)}`);
  return value;
}

function isStage(s: unknown): s is Stage {
  if (!s || typeof s !== 'object') return false;
  const x = s as Stage;
  return (
    typeof x.id === 'string' &&
    typeof x.name === 'string' &&
    typeof x.order === 'number' &&
    isHexColor(x.color)
  );
}

function isProject(p: unknown): p is Project {
  if (!p || typeof p !== 'object') return false;
  const x = p as Project;
  return (
    typeof x.id === 'string' &&
    typeof x.name === 'string' &&
    typeof x.template === 'string' &&
    typeof x.pinned === 'boolean' &&
    typeof x.createdAt === 'number' &&
    (x.archivedAt === null || typeof x.archivedAt === 'number') &&
    Array.isArray(x.stages) &&
    x.stages.every(isStage)
  );
}

function isItem(i: unknown): i is Item {
  if (!i || typeof i !== 'object') return false;
  const x = i as Item;
  return (
    typeof x.id === 'string' &&
    typeof x.projectId === 'string' &&
    typeof x.stageId === 'string' &&
    typeof x.title === 'string' &&
    ITEM_STATUSES.includes(x.status) &&
    (x.startDate === null || typeof x.startDate === 'number') &&
    (x.dueDate === null || typeof x.dueDate === 'number') &&
    typeof x.notes === 'string' &&
    typeof x.order === 'number' &&
    Array.isArray(x.stageHistory) &&
    x.stageHistory.every((t) => t && typeof t.stageId === 'string' && typeof t.enteredAt === 'number') &&
    typeof x.createdAt === 'number' &&
    (x.completedAt === null || typeof x.completedAt === 'number')
  );
}

function isInboxEntry(e: unknown): e is InboxEntry {
  if (!e || typeof e !== 'object') return false;
  const x = e as InboxEntry;
  return (
    typeof x.id === 'string' &&
    typeof x.title === 'string' &&
    typeof x.notes === 'string' &&
    INBOX_STATUSES.includes(x.status) &&
    (x.convertedToItemId === null || typeof x.convertedToItemId === 'string') &&
    typeof x.createdAt === 'number'
  );
}

export type Dump = {
  version: 1;
  exportedAt: number;
  projects: Project[];
  items: Item[];
  inboxEntries: InboxEntry[];
};

export function isValidDump(value: unknown): value is Dump {
  if (!value || typeof value !== 'object') return false;
  const d = value as Dump;
  return (
    d.version === 1 &&
    typeof d.exportedAt === 'number' &&
    Array.isArray(d.projects) && d.projects.every(isProject) &&
    Array.isArray(d.items) && d.items.every(isItem) &&
    Array.isArray(d.inboxEntries) && d.inboxEntries.every(isInboxEntry)
  );
}

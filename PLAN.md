# The Project Maneger — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a personal, local-first PWA project manager with Kanban + Timeline views, Inbox capture, and one-click status reports — visually polished (Calm Glass aesthetic, Lexend font, dark + light themes).

**Architecture:** Single-page React 18 app, TypeScript (strict), Vite build, Tailwind CSS for styling. All data in IndexedDB via Dexie with reactive `useLiveQuery`. Zustand for transient UI state. PWA via `vite-plugin-pwa` so it installs to the dock. No backend, no auth, no AI.

**Tech Stack:** React 18, Vite 5, TypeScript 5, Tailwind 3, Dexie 4 + dexie-react-hooks, Zustand 4, react-router 6, dnd-kit 6, @uiw/react-md-editor 4, react-markdown 9 + remark-gfm 4 (in-app rendering), marked 12 + dompurify 3 (PDF export), vite-plugin-pwa, @fontsource/lexend + @fontsource/opendyslexic, Vitest + @testing-library/react + fake-indexeddb.

**Reference:** spec lives at `SPEC.md`. Re-read it whenever a step references "per spec §X.Y".

**Conventions:**
- `pnpm` is the package manager. If unavailable, use `npm`.
- Strict TS — no `any` (test fixtures may use `as any` for brevity).
- All Dexie writes happen inside `db.transaction()`.
- Commit after every task: `<phase>: <task summary>`.
- TDD for pure functions and mutations. UI tasks: implement → dogfood → commit.
- Markdown rendering uses `react-markdown` (renders to React nodes, no raw HTML in DOM). PDF export uses `marked` + DOMPurify, then DOM-builds the popup via createElement/appendChild — never document.write, never innerHTML.

---

## Phase 1 — Foundation

### Task 1: Initialize Vite + React + TypeScript project

**Files:** `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.gitignore`

- [ ] **Step 1: Scaffold with Vite**

```bash
pnpm create vite@latest . --template react-ts
```

When prompted "Current directory is not empty", choose **Ignore files and continue** so existing `SPEC.md` and `PLAN.md` are preserved.

- [ ] **Step 2: Install dependencies**

```bash
pnpm install
pnpm add react-router-dom@^6 dexie@^4 dexie-react-hooks@^1 zustand@^4 \
  @dnd-kit/core@^6 @dnd-kit/sortable@^8 @dnd-kit/utilities@^3 \
  @uiw/react-md-editor@^4 \
  react-markdown@^9 remark-gfm@^4 \
  marked@^12 dompurify@^3 \
  nanoid@^5 \
  @fontsource/lexend@^5 @fontsource-variable/lexend@^5 \
  @fontsource/opendyslexic@^5
pnpm add -D tailwindcss@^3 postcss autoprefixer \
  @tailwindcss/typography@^0.5 \
  vite-plugin-pwa@^0.20 \
  vitest@^2 @testing-library/react@^16 @testing-library/user-event@^14 \
  @testing-library/jest-dom@^6 jsdom@^25 fake-indexeddb@^6 \
  @types/marked@^6 @types/dompurify@^3
```

- [ ] **Step 3: Initialize Tailwind**

```bash
pnpm exec tailwindcss init -p
```

- [ ] **Step 4: Replace `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        stage: { slate: '#6b7ca8', sand: '#c4a66f', sage: '#85b89d', rose: '#9a6b71' },
      },
      fontFamily: { sans: ['var(--font-app)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
```

- [ ] **Step 5: Replace `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import '@fontsource-variable/lexend/index.css';
@import '@fontsource/opendyslexic/400.css';
@import '@fontsource/opendyslexic/700.css';

:root {
  --font-app: 'Lexend Variable', 'Lexend', system-ui, sans-serif;
  --stage-slate: #6b7ca8;
  --stage-sand: #c4a66f;
  --stage-sage: #85b89d;
  --stage-rose: #9a6b71;
  --bg-base: #f6f5f1;
  --bg-radial: radial-gradient(ellipse at top, #ffffff 0%, #f6f5f1 60%);
  --surface: rgba(255, 255, 255, 0.7);
  --border: rgba(0, 0, 0, 0.06);
  --text-primary: #23262e;
  --text-muted: #7a7e88;
  --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 20px rgba(0, 0, 0, 0.04);
  --shadow-inner: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.dark {
  --bg-base: #0e1014;
  --bg-radial: radial-gradient(ellipse at top, #1a1f2c 0%, #0e1014 60%);
  --surface: rgba(255, 255, 255, 0.03);
  --border: rgba(255, 255, 255, 0.06);
  --text-primary: #e6e9ef;
  --text-muted: #7d8696;
  --shadow-card: 0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 8px 24px rgba(0, 0, 0, 0.3);
  --shadow-inner: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.font-dyslexic { --font-app: 'OpenDyslexic', 'Lexend Variable', system-ui, sans-serif; }

html, body, #root { height: 100%; }
body {
  margin: 0;
  font-family: var(--font-app);
  background: var(--bg-radial);
  background-attachment: fixed;
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}

.glass {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--shadow-card);
}

.glass-inner { box-shadow: var(--shadow-inner), var(--shadow-card); }

*:focus-visible { outline: 2px solid var(--stage-slate); outline-offset: 2px; border-radius: 4px; }
```

- [ ] **Step 6: Replace `src/App.tsx`**

```tsx
export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-semibold tracking-tight">The Project Maneger</h1>
    </div>
  );
}
```

- [ ] **Step 7: Verify dev server**

```bash
pnpm dev
```

Expected: Vite prints a URL. Open it. "The Project Maneger" centered in Lexend. Stop with Ctrl-C.

- [ ] **Step 8: Init git + commit**

```bash
git init
git add .
git commit -m "init: scaffold Vite + React + TS + Tailwind + Lexend"
```

---

### Task 2: Configure Vitest

**Files:** modify `vite.config.ts`, create `src/setupTests.ts`, `src/__tests__/smoke.test.ts`.

- [ ] **Step 1: Replace `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    css: false,
  },
});
```

- [ ] **Step 2: `tsconfig.json` — add to `compilerOptions.types`**

```json
"types": ["vitest/globals", "@testing-library/jest-dom"]
```

- [ ] **Step 3: `src/setupTests.ts`**

```ts
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
```

- [ ] **Step 4: `src/__tests__/smoke.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
describe('smoke', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Add scripts to `package.json`**

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Run**

```bash
pnpm test
```

Expected: 1 test passes.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "test: configure Vitest + jsdom + fake-indexeddb"
```

---

### Task 3: ID generator + date helpers

**Files:** `src/lib/ids.ts`, `src/lib/ids.test.ts`, `src/lib/dates.ts`, `src/lib/dates.test.ts`

- [ ] **Step 1: `src/lib/ids.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { newId } from './ids';

describe('newId', () => {
  it('returns a non-empty string', () => {
    expect(newId()).toMatch(/.+/);
  });
  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newId()));
    expect(ids.size).toBe(1000);
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
pnpm test src/lib/ids.test.ts
```

- [ ] **Step 3: `src/lib/ids.ts`**

```ts
import { nanoid } from 'nanoid';
export function newId(): string {
  return nanoid(12);
}
```

- [ ] **Step 4: Run — expect pass**

```bash
pnpm test src/lib/ids.test.ts
```

- [ ] **Step 5: `src/lib/dates.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { formatShortDate, isWithin, daysBetween, todayMs, startOfDayMs, endOfDayMs } from './dates';

describe('dates', () => {
  it('formatShortDate returns "MMM D"', () => {
    expect(formatShortDate(new Date('2026-05-03T12:00:00Z').getTime())).toMatch(/May\s+3/);
  });
  it('formatShortDate returns empty string for null', () => {
    expect(formatShortDate(null)).toBe('');
  });
  it('isWithin checks inclusive range', () => {
    const start = new Date('2026-05-01').getTime();
    const end = new Date('2026-05-31').getTime();
    expect(isWithin(new Date('2026-05-15').getTime(), start, end)).toBe(true);
    expect(isWithin(start, start, end)).toBe(true);
    expect(isWithin(end, start, end)).toBe(true);
    expect(isWithin(new Date('2026-04-30').getTime(), start, end)).toBe(false);
  });
  it('daysBetween is absolute', () => {
    const a = new Date('2026-05-01T00:00:00Z').getTime();
    const b = new Date('2026-05-04T00:00:00Z').getTime();
    expect(daysBetween(a, b)).toBe(3);
    expect(daysBetween(b, a)).toBe(3);
  });
  it('todayMs is current epoch ms', () => {
    const before = Date.now();
    const t = todayMs();
    const after = Date.now();
    expect(t).toBeGreaterThanOrEqual(before);
    expect(t).toBeLessThanOrEqual(after);
  });
  it('startOfDayMs and endOfDayMs frame the same date', () => {
    const ms = new Date('2026-05-03T15:30:00').getTime();
    expect(endOfDayMs(ms) - startOfDayMs(ms)).toBeGreaterThan(86_000_000);
  });
});
```

- [ ] **Step 6: Run — expect failure**

```bash
pnpm test src/lib/dates.test.ts
```

- [ ] **Step 7: `src/lib/dates.ts`**

```ts
const SHORT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

export function formatShortDate(ms: number | null): string {
  if (ms === null) return '';
  return SHORT.format(new Date(ms));
}

export function isWithin(ms: number, startMs: number, endMs: number): boolean {
  return ms >= startMs && ms <= endMs;
}

export function daysBetween(a: number, b: number): number {
  return Math.round(Math.abs(a - b) / 86_400_000);
}

export function todayMs(): number {
  return Date.now();
}

export function startOfDayMs(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function endOfDayMs(ms: number): number {
  const d = new Date(ms);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}
```

- [ ] **Step 8: Run + commit**

```bash
pnpm test
git add .
git commit -m "lib: add id generator and date helpers"
```

---

## Phase 2 — Data Layer

### Task 4: Dexie schema + types

**Files:** `src/db/schema.ts`

- [ ] **Step 1: `src/db/schema.ts`**

```ts
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
```

- [ ] **Step 2: Build + commit**

```bash
pnpm exec tsc --noEmit
git add src/db/schema.ts
git commit -m "db: add Dexie schema and types"
```

---

### Task 5: Built-in templates (with localStorage override)

**Files:** `src/lib/templates.ts`, `src/lib/templates.test.ts`

- [ ] **Step 1: `src/lib/templates.test.ts`**

```ts
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
```

- [ ] **Step 2: Run — expect failure**

```bash
pnpm test src/lib/templates.test.ts
```

- [ ] **Step 3: `src/lib/templates.ts`**

```ts
import type { ProjectTemplate, Stage } from '../db/schema';
import { newId } from './ids';

export const TEMPLATE_NAMES: ProjectTemplate[] = ['software', 'research', 'content', 'custom'];

const PALETTE = ['#6b7ca8', '#c4a66f', '#85b89d', '#9a6b71'];

const TEMPLATE_STAGE_NAMES: Record<ProjectTemplate, string[]> = {
  software: ['Discovery', 'Design', 'Build', 'Ship'],
  research: ['Question', 'Explore', 'Synthesize', 'Publish'],
  content: ['Idea', 'Draft', 'Edit', 'Publish'],
  custom: [],
};

export function getTemplateStages(template: ProjectTemplate): Stage[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('tpm-templates') : null;
    if (raw) {
      const parsed = JSON.parse(raw) as Record<ProjectTemplate, Omit<Stage, 'id'>[]>;
      const list = parsed[template];
      if (Array.isArray(list)) {
        return list.map((s, i) => ({ id: newId(), name: s.name, color: s.color, order: i }));
      }
    }
  } catch {
    /* fall through */
  }
  const names = TEMPLATE_STAGE_NAMES[template];
  return names.map((name, i) => ({
    id: newId(),
    name,
    color: PALETTE[i % PALETTE.length],
    order: i,
  }));
}

export function templateLabel(template: ProjectTemplate): string {
  return template[0].toUpperCase() + template.slice(1);
}
```

- [ ] **Step 4: Run + commit**

```bash
pnpm test src/lib/templates.test.ts
git add .
git commit -m "lib: add project templates with palette"
```

---

### Task 6: Project mutations (TDD)

**Files:** `src/db/mutations.ts`, `src/db/mutations.test.ts`

- [ ] **Step 1: `src/db/mutations.test.ts`**

```ts
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
```

- [ ] **Step 2: Run — expect failure**

```bash
pnpm test src/db/mutations.test.ts
```

- [ ] **Step 3: `src/db/mutations.ts`**

```ts
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
```

- [ ] **Step 4: Run + commit**

```bash
pnpm test src/db/mutations.test.ts
git add .
git commit -m "db: add project CRUD mutations"
```

---

### Task 7: Item / Stage / Inbox mutations (TDD)

**Files:** modify `src/db/mutations.ts` and `src/db/mutations.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
import {
  createItem, updateItem, moveItemToStage, reorderItem, deleteItem,
  addStage, renameStage, recolorStage, reorderStages, deleteStage,
  createInboxEntry, updateInboxEntry, dismissInboxEntry, convertInboxEntry,
} from './mutations';

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
```

- [ ] **Step 2: Run — expect failure**

```bash
pnpm test src/db/mutations.test.ts
```

- [ ] **Step 3: Append to `src/db/mutations.ts`**

```ts
import type { Item, InboxEntry, ItemStatus, Stage } from './schema';

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
```

- [ ] **Step 4: Run + commit**

```bash
pnpm test src/db/mutations.test.ts
git add .
git commit -m "db: add item, stage, and inbox mutations"
```

---

### Task 8: Derived queries (TDD)

**Files:** `src/db/queries.ts`, `src/db/queries.test.ts`

- [ ] **Step 1: `src/db/queries.test.ts`**

```ts
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
```

- [ ] **Step 2: Run — expect failure**

```bash
pnpm test src/db/queries.test.ts
```

- [ ] **Step 3: `src/db/queries.ts`**

```ts
import type { Stage, Item } from './schema';

export function currentStageId(stages: Stage[], items: Item[]): string {
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) return '';
  const firstWithOpen = sorted.find((s) =>
    items.some((i) => i.stageId === s.id && i.status !== 'done'),
  );
  if (firstWithOpen) return firstWithOpen.id;
  if (items.length > 0) return sorted[sorted.length - 1].id;
  return sorted[0].id;
}

export type StageProgress = { done: number; total: number };

export function stageProgress(stages: Stage[], items: Item[]): Map<string, StageProgress> {
  const map = new Map<string, StageProgress>();
  for (const s of stages) map.set(s.id, { done: 0, total: 0 });
  for (const item of items) {
    const p = map.get(item.stageId);
    if (!p) continue;
    p.total++;
    if (item.status === 'done') p.done++;
  }
  return map;
}

export function projectDuration(items: Item[]): [number, number] | null {
  const dated = items
    .map((i) => ({ start: i.startDate ?? i.dueDate, end: i.dueDate ?? i.startDate }))
    .filter((d): d is { start: number; end: number } => d.start !== null && d.end !== null);
  if (dated.length === 0) return null;
  const start = Math.min(...dated.map((d) => d.start));
  const end = Math.max(...dated.map((d) => d.end));
  return [start, end];
}

export function nextDueDate(items: Item[], now: number): number | null {
  const upcoming = items
    .map((i) => i.dueDate)
    .filter((d): d is number => d !== null && d >= now)
    .sort((a, b) => a - b);
  return upcoming[0] ?? null;
}
```

- [ ] **Step 4: Run + commit**

```bash
pnpm test src/db/queries.test.ts
git add .
git commit -m "db: add derived queries"
```

---

## Phase 3 — App Shell

### Task 9: Zustand UI store

**Files:** `src/state/ui.ts`, `src/state/ui.test.ts`

- [ ] **Step 1: `src/state/ui.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useUI } from './ui';

beforeEach(() => {
  useUI.setState({ theme: 'system', font: 'lexend', drawerItemId: null });
});

describe('useUI', () => {
  it('default theme is system', () => {
    expect(useUI.getState().theme).toBe('system');
  });
  it('setTheme updates', () => {
    useUI.getState().setTheme('dark');
    expect(useUI.getState().theme).toBe('dark');
  });
  it('setFont updates', () => {
    useUI.getState().setFont('opendyslexic');
    expect(useUI.getState().font).toBe('opendyslexic');
  });
  it('drawer open/close', () => {
    useUI.getState().openDrawer('item-123');
    expect(useUI.getState().drawerItemId).toBe('item-123');
    useUI.getState().closeDrawer();
    expect(useUI.getState().drawerItemId).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
pnpm test src/state/ui.test.ts
```

- [ ] **Step 3: `src/state/ui.ts`**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type Font = 'lexend' | 'opendyslexic';

type UIState = {
  theme: Theme;
  font: Font;
  drawerItemId: string | null;
  setTheme: (t: Theme) => void;
  setFont: (f: Font) => void;
  openDrawer: (itemId: string) => void;
  closeDrawer: () => void;
};

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      font: 'lexend',
      drawerItemId: null,
      setTheme: (t) => set({ theme: t }),
      setFont: (f) => set({ font: f }),
      openDrawer: (itemId) => set({ drawerItemId: itemId }),
      closeDrawer: () => set({ drawerItemId: null }),
    }),
    { name: 'tpm-ui', partialize: (s) => ({ theme: s.theme, font: s.font }) },
  ),
);
```

- [ ] **Step 4: Run + commit**

```bash
pnpm test src/state/ui.test.ts
git add .
git commit -m "state: add Zustand UI store"
```

---

### Task 10: Theme provider

**Files:** `src/app/ThemeProvider.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useEffect, type ReactNode } from 'react';
import { useUI, type Theme } from '../state/ui';

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useUI((s) => s.theme);
  const font = useUI((s) => s.font);

  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(theme);
      const root = document.documentElement;
      root.classList.toggle('dark', resolved === 'dark');
      root.classList.toggle('font-dyslexic', font === 'opendyslexic');
    };
    apply();
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme, font]);

  return <>{children}</>;
}
```

- [ ] **Step 2: Build + commit**

```bash
pnpm exec tsc --noEmit
git add .
git commit -m "app: add ThemeProvider"
```

---

### Task 11: Sidebar + Layout

**Files:** `src/app/Sidebar.tsx`, `src/app/Layout.tsx`, `src/features/items/ItemDrawer.tsx` (stub)

- [ ] **Step 1: ItemDrawer stub**

`src/features/items/ItemDrawer.tsx`:
```tsx
export function ItemDrawer() {
  return null;
}
```

- [ ] **Step 2: `src/app/Sidebar.tsx`**

```tsx
import { NavLink } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

const navItems = [
  { to: '/', label: 'Home', icon: '◰' },
  { to: '/inbox', label: 'Inbox', icon: '⌬' },
  { to: '/reports', label: 'Reports', icon: '☷' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export function Sidebar() {
  const inboxOpenCount = useLiveQuery(
    () => db.inboxEntries.where('status').equals('open').count(),
    [], 0,
  );
  const pinned = useLiveQuery(
    () => db.projects.filter((p) => p.pinned && p.archivedAt === null).toArray(),
    [], [],
  );

  return (
    <aside className="w-56 shrink-0 p-4 flex flex-col gap-1 border-r" style={{ borderColor: 'var(--border)' }}>
      <div className="px-2 mb-4">
        <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>The Project</div>
        <div className="text-base font-semibold tracking-tight">Maneger</div>
      </div>
      {navItems.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${
              isActive ? 'bg-black/[0.04] dark:bg-white/[0.06]' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
            }`
          }
        >
          <span className="opacity-60 w-4 text-center">{n.icon}</span>
          <span>{n.label}</span>
          {n.to === '/inbox' && inboxOpenCount > 0 && (
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--stage-slate)', color: '#fff' }}>
              {inboxOpenCount}
            </span>
          )}
        </NavLink>
      ))}
      {pinned.length > 0 && (
        <>
          <div className="my-3 h-px" style={{ background: 'var(--border)' }} />
          <div className="px-3 mb-1 text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Pinned</div>
          {pinned.map((p) => (
            <NavLink
              key={p.id}
              to={`/project/${p.id}`}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm truncate transition ${
                  isActive ? 'bg-black/[0.04] dark:bg-white/[0.06]' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                }`
              }
            >
              {p.name}
            </NavLink>
          ))}
        </>
      )}
    </aside>
  );
}
```

- [ ] **Step 3: `src/app/Layout.tsx`**

```tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ThemeProvider } from './ThemeProvider';
import { ItemDrawer } from '../features/items/ItemDrawer';

export function Layout() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
        <ItemDrawer />
      </div>
    </ThemeProvider>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "app: add Sidebar + Layout"
```

---

### Task 12: Routing skeleton

**Files:** `src/app/routes.tsx`, placeholder pages, modify `src/main.tsx`, delete `src/App.tsx`.

- [ ] **Step 1: Placeholder pages**

`src/features/projects/HomePage.tsx`:
```tsx
export default function HomePage() {
  return <div className="text-2xl font-semibold tracking-tight">Home</div>;
}
```

`src/features/projects/ProjectDetailPage.tsx`:
```tsx
import { useParams } from 'react-router-dom';
export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <div className="text-2xl font-semibold tracking-tight">Project {id}</div>;
}
```

`src/features/inbox/InboxPage.tsx`:
```tsx
export default function InboxPage() {
  return <div className="text-2xl font-semibold tracking-tight">Inbox</div>;
}
```

`src/features/reports/ReportsPage.tsx`:
```tsx
export default function ReportsPage() {
  return <div className="text-2xl font-semibold tracking-tight">Reports</div>;
}
```

`src/features/settings/SettingsPage.tsx`:
```tsx
export default function SettingsPage() {
  return <div className="text-2xl font-semibold tracking-tight">Settings</div>;
}
```

- [ ] **Step 2: `src/app/routes.tsx`**

```tsx
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import HomePage from '../features/projects/HomePage';
import ProjectDetailPage from '../features/projects/ProjectDetailPage';
import InboxPage from '../features/inbox/InboxPage';
import ReportsPage from '../features/reports/ReportsPage';
import SettingsPage from '../features/settings/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'project/:id', element: <ProjectDetailPage /> },
      { path: 'inbox', element: <InboxPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
```

- [ ] **Step 3: Replace `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
```

- [ ] **Step 4: Delete `src/App.tsx`**

```bash
rm src/App.tsx
```

- [ ] **Step 5: Dogfood + commit**

```bash
pnpm dev    # click each sidebar link, verify placeholder renders
git add .
git commit -m "app: add router and placeholder pages"
```

---

## Phase 4 — Projects feature

### Task 13: NewProjectDialog

**Files:** `src/features/projects/NewProjectDialog.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEMPLATE_NAMES, templateLabel } from '../../lib/templates';
import { createProject } from '../../db/mutations';
import type { ProjectTemplate } from '../../db/schema';

export function NewProjectDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [template, setTemplate] = useState<ProjectTemplate>('software');
  const navigate = useNavigate();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const id = await createProject(name.trim(), template);
    onClose();
    navigate(`/project/${id}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="glass glass-inner w-full max-w-md p-6">
        <h2 className="text-lg font-semibold tracking-tight mb-4">New project</h2>
        <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Q4 launch"
          className="w-full rounded-md px-3 py-2 mb-4 bg-transparent border outline-none"
          style={{ borderColor: 'var(--border)' }}
        />
        <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Template</label>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {TEMPLATE_NAMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTemplate(t)}
              className={`px-3 py-2 rounded-md border text-sm transition ${template === t ? 'ring-2' : ''}`}
              style={{ borderColor: 'var(--border)', background: template === t ? 'var(--surface)' : 'transparent' }}
            >
              {templateLabel(t)}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-md text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">Cancel</button>
          <button type="submit" disabled={!name.trim()} className="px-3 py-1.5 rounded-md text-sm disabled:opacity-40" style={{ background: 'var(--stage-slate)', color: '#fff' }}>
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "projects: add NewProjectDialog"
```

---

### Task 14: ProgressStrip

**Files:** `src/features/projects/ProgressStrip.tsx`

- [ ] **Step 1: Implement**

```tsx
import type { Stage, Item } from '../../db/schema';
import { stageProgress } from '../../db/queries';

type Props = { stages: Stage[]; items: Item[]; variant?: 'mini' | 'full' };

export function ProgressStrip({ stages, items, variant = 'mini' }: Props) {
  const progress = stageProgress(stages, items);
  const ordered = [...stages].sort((a, b) => a.order - b.order);

  if (variant === 'mini') {
    return (
      <div className="flex gap-1.5">
        {ordered.map((s) => {
          const p = progress.get(s.id) ?? { done: 0, total: 0 };
          const fill = p.total === 0 ? 0 : (p.done / p.total) * 100;
          return (
            <div key={s.id} className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(127,127,127,0.12)' }} title={`${s.name}: ${p.done}/${p.total}`}>
              <div style={{ width: `${fill}%`, height: '100%', background: s.color }} />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {ordered.map((s) => {
        const p = progress.get(s.id) ?? { done: 0, total: 0 };
        const fill = p.total === 0 ? 0 : (p.done / p.total) * 100;
        return (
          <div key={s.id} className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: s.color }}>{s.name}</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{p.done} / {p.total}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(127,127,127,0.12)' }}>
              <div style={{ width: `${fill}%`, height: '100%', background: s.color, transition: 'width 200ms' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "projects: add ProgressStrip"
```

---

### Task 15: Home page (Projects view + 'n' shortcut + empty state)

**Files:** `src/features/projects/ProjectCard.tsx`, `ProjectList.tsx`, `PortfolioTimeline.tsx` (stub), replace `HomePage.tsx`.

- [ ] **Step 1: `src/features/projects/ProjectCard.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Project } from '../../db/schema';
import { ProgressStrip } from './ProgressStrip';
import { currentStageId, nextDueDate } from '../../db/queries';
import { formatShortDate, todayMs } from '../../lib/dates';

export function ProjectCard({ project }: { project: Project }) {
  const items = useLiveQuery(() => db.items.where('projectId').equals(project.id).toArray(), [project.id], []);
  const currentId = currentStageId(project.stages, items);
  const currentStage = project.stages.find((s) => s.id === currentId);
  const due = nextDueDate(items, todayMs());

  return (
    <Link to={`/project/${project.id}`} className="glass p-4 block hover:translate-y-[-1px] transition">
      <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        {currentStage?.name ?? 'No stages'}
      </div>
      <div className="text-base font-semibold tracking-tight mb-3">{project.name}</div>
      <ProgressStrip stages={project.stages} items={items} variant="mini" />
      <div className="mt-3 flex justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
        <span>{items.length} items</span>
        {due && <span>Next: {formatShortDate(due)}</span>}
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: `src/features/projects/ProjectList.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Project } from '../../db/schema';
import { currentStageId, nextDueDate } from '../../db/queries';
import { formatShortDate, todayMs } from '../../lib/dates';

export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div className="glass overflow-hidden">
      <div
        className="grid grid-cols-[2fr_1fr_1fr_1fr] px-4 py-2 text-[11px] uppercase tracking-wider"
        style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
      >
        <div>Project</div><div>Stage</div><div>Items</div><div>Next due</div>
      </div>
      {projects.length === 0 && (
        <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          No projects yet. Click "New Project".
        </div>
      )}
      {projects.map((p) => <ProjectRow key={p.id} project={p} />)}
    </div>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const items = useLiveQuery(() => db.items.where('projectId').equals(project.id).toArray(), [project.id], []);
  const currentId = currentStageId(project.stages, items);
  const currentStage = project.stages.find((s) => s.id === currentId);
  const due = nextDueDate(items, todayMs());

  return (
    <Link
      to={`/project/${project.id}`}
      className="grid grid-cols-[2fr_1fr_1fr_1fr] px-4 py-2.5 text-sm hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className="font-medium truncate">{project.name}</div>
      <div style={{ color: currentStage?.color ?? 'var(--text-muted)' }}>{currentStage?.name ?? '—'}</div>
      <div style={{ color: 'var(--text-muted)' }}>{items.length}</div>
      <div style={{ color: 'var(--text-muted)' }}>{due ? formatShortDate(due) : '—'}</div>
    </Link>
  );
}
```

- [ ] **Step 3: `src/features/projects/PortfolioTimeline.tsx` stub**

```tsx
import type { Project } from '../../db/schema';
export function PortfolioTimeline({ projects: _p }: { projects: Project[] }) {
  return <div className="glass p-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>Portfolio Timeline — Task 20.</div>;
}
```

- [ ] **Step 4: Replace `src/features/projects/HomePage.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/schema';
import { ProjectCard } from './ProjectCard';
import { ProjectList } from './ProjectList';
import { NewProjectDialog } from './NewProjectDialog';
import { PortfolioTimeline } from './PortfolioTimeline';

type Tab = 'projects' | 'timeline';

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('projects');
  const [dialog, setDialog] = useState(false);

  const active = useLiveQuery(() => db.projects.filter((p) => p.archivedAt === null).toArray(), [], []);
  const pinned = active.filter((p) => p.pinned);
  const all = [...active].sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === 'n' &&
        !dialog &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setDialog(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Workspace</div>
          <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
        </div>
        <div className="flex gap-2 items-center">
          <div className="glass p-1 flex">
            {(['projects', 'timeline'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 text-xs font-semibold rounded transition ${tab === t ? 'text-white' : ''}`}
                style={{ background: tab === t ? 'var(--text-primary)' : 'transparent' }}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => setDialog(true)} className="px-3 py-1.5 rounded-md text-sm" style={{ background: 'var(--stage-slate)', color: '#fff' }}>
            + New Project
          </button>
        </div>
      </div>

      {tab === 'projects' && (
        <>
          {pinned.length > 0 && (
            <div className="mb-6">
              <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Pinned · {pinned.length}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pinned.map((p) => <ProjectCard key={p.id} project={p} />)}
              </div>
            </div>
          )}
          <div>
            <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              All projects · {all.length}
            </div>
            {all.length === 0 ? (
              <div className="glass p-10 text-center">
                <div className="text-base font-semibold mb-1">No projects yet</div>
                <div className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  Create your first project to start tracking.
                </div>
                <button onClick={() => setDialog(true)} className="px-4 py-2 rounded text-sm" style={{ background: 'var(--stage-slate)', color: '#fff' }}>
                  + New Project
                </button>
                <div className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
                  Or press <kbd className="px-1 py-0.5 rounded border" style={{ borderColor: 'var(--border)' }}>n</kbd>
                </div>
              </div>
            ) : (
              <ProjectList projects={all} />
            )}
          </div>
        </>
      )}

      {tab === 'timeline' && <PortfolioTimeline projects={active} />}

      {dialog && <NewProjectDialog onClose={() => setDialog(false)} />}
    </div>
  );
}
```

- [ ] **Step 5: Dogfood + commit**

```bash
pnpm dev    # press n → create project, verify navigation
git add .
git commit -m "projects: add Home with empty state + 'n' shortcut"
```

---

### Task 16: Project Detail (header, progress, view toggle, stage manager)

**Files:** `ProjectHeader.tsx`, `StageManager.tsx`, `KanbanView.tsx` (stub), `TimelineView.tsx` (stub), replace `ProjectDetailPage.tsx`.

- [ ] **Step 1: `src/features/projects/ProjectHeader.tsx`**

```tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../db/schema';
import { renameProject, togglePin, archiveProject, deleteProject } from '../../db/mutations';

export function ProjectHeader({ project }: { project: Project }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => { setName(project.name); }, [project.name]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  async function commit() {
    setEditing(false);
    if (name.trim() && name.trim() !== project.name) {
      await renameProject(project.id, name.trim());
    } else {
      setName(project.name);
    }
  }

  async function onArchive() {
    await archiveProject(project.id);
    navigate('/');
  }

  async function onDelete() {
    if (window.confirm(`Delete "${project.name}" and all its items? This cannot be undone.`)) {
      await deleteProject(project.id);
      navigate('/');
    }
  }

  return (
    <div className="flex items-center gap-3 mb-6">
      {editing ? (
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setName(project.name); setEditing(false); }
          }}
          className="text-2xl font-semibold tracking-tight bg-transparent outline-none border-b"
          style={{ borderColor: 'var(--border)' }}
        />
      ) : (
        <h1 className="text-2xl font-semibold tracking-tight cursor-text" onClick={() => setEditing(true)}>
          {project.name}
        </h1>
      )}
      <button
        onClick={() => togglePin(project.id)}
        className="ml-auto text-sm px-2 py-1 rounded hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
        title={project.pinned ? 'Unpin' : 'Pin'}
      >
        {project.pinned ? '★ Pinned' : '☆ Pin'}
      </button>
      <button onClick={onArchive} className="text-sm px-2 py-1 rounded hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">Archive</button>
      <button onClick={onDelete} className="text-sm px-2 py-1 rounded hover:bg-black/[0.04] dark:hover:bg-white/[0.04]" style={{ color: 'var(--stage-rose)' }}>
        Delete
      </button>
    </div>
  );
}
```

- [ ] **Step 2: `src/features/projects/StageManager.tsx`**

```tsx
import { useState } from 'react';
import type { Project, Stage } from '../../db/schema';
import { addStage, renameStage, recolorStage, deleteStage, reorderStages } from '../../db/mutations';

const PALETTE = ['#6b7ca8', '#c4a66f', '#85b89d', '#9a6b71', '#7a8c9a', '#9c8a7e'];

export function StageManager({ project, onClose }: { project: Project; onClose: () => void }) {
  const [pendingDelete, setPendingDelete] = useState<Stage | null>(null);
  const [fallbackStageId, setFallbackStageId] = useState<string>('');
  const sortedStages = [...project.stages].sort((a, b) => a.order - b.order);

  async function move(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= sortedStages.length) return;
    const ids = sortedStages.map((s) => s.id);
    [ids[idx], ids[next]] = [ids[next], ids[idx]];
    await reorderStages(project.id, ids);
  }

  async function add() {
    const color = PALETTE[project.stages.length % PALETTE.length];
    await addStage(project.id, 'New stage', color);
  }

  async function confirmDelete() {
    if (!pendingDelete || !fallbackStageId) return;
    await deleteStage(project.id, pendingDelete.id, fallbackStageId);
    setPendingDelete(null);
    setFallbackStageId('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="glass glass-inner w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold tracking-tight mb-4">Manage stages</h2>
        <div className="space-y-2 mb-4">
          {sortedStages.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="px-1 disabled:opacity-30">▲</button>
              <button onClick={() => move(i, 1)} disabled={i === sortedStages.length - 1} className="px-1 disabled:opacity-30">▼</button>
              <input
                defaultValue={s.name}
                onBlur={(e) => renameStage(project.id, s.id, e.target.value.trim() || s.name)}
                className="flex-1 bg-transparent border-b outline-none text-sm py-1"
                style={{ borderColor: 'var(--border)' }}
              />
              <div className="flex gap-1">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => recolorStage(project.id, s.id, c)}
                    className="w-4 h-4 rounded-full border"
                    style={{ background: c, borderColor: s.color === c ? 'var(--text-primary)' : 'transparent' }}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  setPendingDelete(s);
                  const others = project.stages.filter((x) => x.id !== s.id);
                  setFallbackStageId(others[0]?.id ?? '');
                }}
                disabled={project.stages.length <= 1}
                className="text-sm px-2 py-1 disabled:opacity-30"
                style={{ color: 'var(--stage-rose)' }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <button onClick={add} className="text-sm px-3 py-1.5 rounded border w-full" style={{ borderColor: 'var(--border)' }}>
          + Add stage
        </button>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-3 py-1.5 rounded text-sm">Done</button>
        </div>
        {pendingDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="glass glass-inner p-5 max-w-sm w-full">
              <p className="text-sm mb-3">Delete stage "{pendingDelete.name}". Move its items to:</p>
              <select
                value={fallbackStageId}
                onChange={(e) => setFallbackStageId(e.target.value)}
                className="w-full bg-transparent border rounded px-2 py-1 mb-4"
                style={{ borderColor: 'var(--border)' }}
              >
                {project.stages.filter((s) => s.id !== pendingDelete.id).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setPendingDelete(null); setFallbackStageId(''); }} className="px-3 py-1.5 rounded text-sm">Cancel</button>
                <button onClick={confirmDelete} className="px-3 py-1.5 rounded text-sm" style={{ background: 'var(--stage-rose)', color: '#fff' }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Stub Kanban + Timeline**

`src/features/projects/KanbanView.tsx`:
```tsx
import type { Project, Item } from '../../db/schema';
export function KanbanView({ project: _p, items: _i }: { project: Project; items: Item[] }) {
  return <div className="glass p-8 text-sm" style={{ color: 'var(--text-muted)' }}>Kanban — Task 18.</div>;
}
```

`src/features/projects/TimelineView.tsx`:
```tsx
import type { Project, Item } from '../../db/schema';
export function TimelineView({ project: _p, items: _i }: { project: Project; items: Item[] }) {
  return <div className="glass p-8 text-sm" style={{ color: 'var(--text-muted)' }}>Timeline — Task 19.</div>;
}
```

- [ ] **Step 4: Replace `src/features/projects/ProjectDetailPage.tsx`**

```tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/schema';
import { ProjectHeader } from './ProjectHeader';
import { ProgressStrip } from './ProgressStrip';
import { KanbanView } from './KanbanView';
import { TimelineView } from './TimelineView';
import { StageManager } from './StageManager';

type Tab = 'kanban' | 'timeline';

export default function ProjectDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('kanban');
  const [stageMgr, setStageMgr] = useState(false);

  const project = useLiveQuery(() => db.projects.get(id), [id]);
  const items = useLiveQuery(() => db.items.where('projectId').equals(id).toArray(), [id], []);

  if (!project) return <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Project not found.</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <ProjectHeader project={project} />
      <div className="glass p-4 mb-4">
        <ProgressStrip stages={project.stages} items={items} variant="full" />
      </div>
      <div className="flex justify-between items-center mb-3">
        <div className="glass p-1 flex">
          {(['kanban', 'timeline'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs font-semibold rounded transition ${tab === t ? 'text-white' : ''}`}
              style={{ background: tab === t ? 'var(--text-primary)' : 'transparent' }}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={() => setStageMgr(true)} className="text-sm px-3 py-1.5 rounded hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">
          Manage stages
        </button>
      </div>
      {tab === 'kanban' && <KanbanView project={project} items={items} />}
      {tab === 'timeline' && <TimelineView project={project} items={items} />}
      {stageMgr && <StageManager project={project} onClose={() => setStageMgr(false)} />}
    </div>
  );
}
```

- [ ] **Step 5: Dogfood + commit**

```bash
pnpm dev    # edit name, pin, manage stages
git add .
git commit -m "projects: add detail page (header, progress, toggle, stage manager)"
```

---

## Phase 5 — Items + Kanban

### Task 17: ItemCard + ItemDrawer (markdown editor)

**Files:** `src/features/items/ItemCard.tsx`, replace `src/features/items/ItemDrawer.tsx`.

- [ ] **Step 1: `src/features/items/ItemCard.tsx`**

```tsx
import type { Item, Stage } from '../../db/schema';
import { formatShortDate } from '../../lib/dates';
import { useUI } from '../../state/ui';

const STATUS_LABEL: Record<Item['status'], string> = {
  todo: 'Todo', doing: 'Doing', done: 'Done', blocked: 'Blocked',
};

export function ItemCard({ item, stage }: { item: Item; stage: Stage }) {
  const openDrawer = useUI((s) => s.openDrawer);
  const accent = item.status === 'doing' ? stage.color : null;

  return (
    <button
      onClick={() => openDrawer(item.id)}
      className="glass w-full text-left p-3 transition hover:translate-y-[-1px]"
      style={accent ? { borderLeft: `3px solid ${accent}` } : undefined}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="text-sm font-semibold leading-snug">{item.title}</div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{
            background: item.status === 'blocked' ? 'rgba(154,107,113,0.15)' : 'rgba(127,127,127,0.1)',
            color: item.status === 'blocked' ? 'var(--stage-rose)' : 'var(--text-muted)',
          }}
        >
          {STATUS_LABEL[item.status]}
        </span>
      </div>
      {item.dueDate && (
        <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
          Due {formatShortDate(item.dueDate)}
        </div>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Replace `src/features/items/ItemDrawer.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import MDEditor from '@uiw/react-md-editor';
import { db, type ItemStatus } from '../../db/schema';
import { useUI } from '../../state/ui';
import { updateItem, deleteItem } from '../../db/mutations';

const STATUSES: ItemStatus[] = ['todo', 'doing', 'done', 'blocked'];

function toDateInput(ms: number | null): string {
  if (ms === null) return '';
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fromDateInput(s: string): number | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

export function ItemDrawer() {
  const itemId = useUI((s) => s.drawerItemId);
  const closeDrawer = useUI((s) => s.closeDrawer);
  const item = useLiveQuery(() => (itemId ? db.items.get(itemId) : undefined), [itemId]);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setNotes(item.notes);
    }
  }, [item?.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer();
    }
    if (itemId) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [itemId, closeDrawer]);

  if (!itemId || !item) return null;

  async function commitTitle() {
    if (item && title.trim() && title.trim() !== item.title) {
      await updateItem(item.id, { title: title.trim() });
    }
  }

  async function commitNotes() {
    if (item && notes !== item.notes) {
      await updateItem(item.id, { notes });
    }
  }

  async function onDelete() {
    if (window.confirm(`Delete "${item.title}"?`)) {
      await deleteItem(item.id);
      closeDrawer();
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={closeDrawer} />
      <aside
        className="fixed top-0 right-0 bottom-0 w-[480px] z-50 p-6 overflow-auto glass"
        style={{ borderRadius: '12px 0 0 12px', animation: 'tpmDrawerIn 200ms ease-out' }}
      >
        <style>{`@keyframes tpmDrawerIn { from { transform: translateX(20px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
        <div className="flex justify-between items-start mb-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="text-lg font-semibold tracking-tight bg-transparent outline-none flex-1 border-b"
            style={{ borderColor: 'var(--border)' }}
          />
          <button onClick={closeDrawer} className="ml-2 px-2 text-lg" aria-label="Close">×</button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Status</label>
            <select
              value={item.status}
              onChange={(e) => updateItem(item.id, { status: e.target.value as ItemStatus })}
              className="w-full bg-transparent border rounded px-2 py-1 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Start</label>
            <input
              type="date"
              value={toDateInput(item.startDate)}
              onChange={(e) => updateItem(item.id, { startDate: fromDateInput(e.target.value) })}
              className="w-full bg-transparent border rounded px-2 py-1 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Due</label>
            <input
              type="date"
              value={toDateInput(item.dueDate)}
              onChange={(e) => updateItem(item.id, { dueDate: fromDateInput(e.target.value) })}
              className="w-full bg-transparent border rounded px-2 py-1 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>
        </div>
        <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Notes</label>
        <div data-color-mode="auto" onBlur={commitNotes}>
          <MDEditor value={notes} onChange={(v) => setNotes(v ?? '')} height={300} preview="edit" />
        </div>
        <div className="flex justify-between mt-4">
          <button onClick={onDelete} className="text-sm" style={{ color: 'var(--stage-rose)' }}>Delete item</button>
          <button onClick={closeDrawer} className="text-sm px-3 py-1.5 rounded">Close</button>
        </div>
      </aside>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "items: add ItemCard + ItemDrawer (markdown editor)"
```

---

### Task 18: KanbanView with dnd-kit

**Files:** replace `src/features/projects/KanbanView.tsx`.

- [ ] **Step 1: Implement**

```tsx
import { useState } from 'react';
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Project, Item, Stage } from '../../db/schema';
import { ItemCard } from '../items/ItemCard';
import { createItem, moveItemToStage, reorderItem } from '../../db/mutations';

export function KanbanView({ project, items }: { project: Project; items: Item[] }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const stagesSorted = [...project.stages].sort((a, b) => a.order - b.order);
  const itemsByStage = new Map<string, Item[]>();
  for (const s of stagesSorted) itemsByStage.set(s.id, []);
  for (const item of items) {
    const list = itemsByStage.get(item.stageId);
    if (list) list.push(item);
  }
  for (const list of itemsByStage.values()) list.sort((a, b) => a.order - b.order);

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const activeItem = items.find((i) => i.id === active.id);
    if (!activeItem) return;
    const overId = String(over.id);
    const overStage = stagesSorted.find((s) => overId === `stage-${s.id}`);
    const overItem = items.find((i) => i.id === overId);
    const targetStageId = overStage?.id ?? overItem?.stageId;
    if (!targetStageId) return;
    if (targetStageId !== activeItem.stageId) {
      await moveItemToStage(activeItem.id, targetStageId);
    } else if (overItem) {
      const list = itemsByStage.get(targetStageId) ?? [];
      const oldIdx = list.findIndex((i) => i.id === activeItem.id);
      const newIdx = list.findIndex((i) => i.id === overItem.id);
      if (oldIdx === -1 || newIdx === -1) return;
      const reordered = [...list];
      reordered.splice(oldIdx, 1);
      reordered.splice(newIdx, 0, activeItem);
      await reorderItem(project.id, targetStageId, reordered.map((i) => i.id));
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${stagesSorted.length}, minmax(0, 1fr))` }}>
        {stagesSorted.map((stage) => (
          <KanbanColumn key={stage.id} stage={stage} items={itemsByStage.get(stage.id) ?? []} projectId={project.id} />
        ))}
      </div>
    </DndContext>
  );
}

function KanbanColumn({ stage, items, projectId }: { stage: Stage; items: Item[]; projectId: string }) {
  return (
    <div id={`stage-${stage.id}`} className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: stage.color }}>{stage.name}</span>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{items.length}</span>
      </div>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 min-h-[60px]">
          {items.map((item) => <SortableItem key={item.id} item={item} stage={stage} />)}
        </div>
      </SortableContext>
      <AddItemButton projectId={projectId} stageId={stage.id} />
    </div>
  );
}

function SortableItem({ item, stage }: { item: Item; stage: Stage }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <ItemCard item={item} stage={stage} />
    </div>
  );
}

function AddItemButton({ projectId, stageId }: { projectId: string; stageId: string }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  async function commit() {
    if (title.trim()) await createItem(projectId, stageId, title.trim());
    setTitle('');
    setAdding(false);
  }

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="text-[12px] py-1.5 rounded border border-dashed"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        + Add item
      </button>
    );
  }
  return (
    <input
      autoFocus
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') { setTitle(''); setAdding(false); }
      }}
      placeholder="Item title"
      className="w-full px-2 py-1.5 text-sm rounded border bg-transparent outline-none"
      style={{ borderColor: 'var(--border)' }}
    />
  );
}
```

- [ ] **Step 2: Dogfood + commit**

```bash
pnpm dev    # add items, drag between columns, click to open drawer
git add .
git commit -m "kanban: add dnd-kit Kanban + stage history on move"
```

---

## Phase 6 — Timeline views

### Task 19: Per-project Timeline

**Files:** `src/lib/timeline.ts`, `src/lib/timeline.test.ts`, replace `TimelineView.tsx`.

- [ ] **Step 1: `src/lib/timeline.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { computeRange, monthTicks, percentInRange } from './timeline';

describe('timeline math', () => {
  it('snaps min to month start, max to next month start', () => {
    const a = new Date('2026-05-15').getTime();
    const b = new Date('2026-07-10').getTime();
    const [start, end] = computeRange([a, b]);
    expect(new Date(start).getDate()).toBe(1);
    expect(new Date(end).getMonth()).toBe(7);
  });
  it('falls back to a 2-month window when empty', () => {
    const [start, end] = computeRange([]);
    expect(end).toBeGreaterThan(start);
  });
  it('monthTicks one entry per month', () => {
    expect(monthTicks(new Date('2026-01-01').getTime(), new Date('2026-04-01').getTime())).toHaveLength(4);
  });
  it('percentInRange returns 0..100', () => {
    expect(percentInRange(50, 0, 100)).toBe(50);
    expect(percentInRange(0, 0, 100)).toBe(0);
    expect(percentInRange(100, 0, 100)).toBe(100);
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
pnpm test src/lib/timeline.test.ts
```

- [ ] **Step 3: `src/lib/timeline.ts`**

```ts
export function computeRange(timestamps: number[]): [number, number] {
  if (timestamps.length === 0) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 1).getTime();
    return [start, end];
  }
  const minMs = Math.min(...timestamps);
  const maxMs = Math.max(...timestamps);
  const start = new Date(minMs);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(maxMs);
  end.setMonth(end.getMonth() + 1, 1);
  end.setHours(0, 0, 0, 0);
  return [start.getTime(), end.getTime()];
}

export function monthTicks(startMs: number, endMs: number): { ms: number; label: string }[] {
  const ticks: { ms: number; label: string }[] = [];
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const cur = new Date(startMs);
  cur.setDate(1);
  while (cur.getTime() < endMs) {
    ticks.push({ ms: cur.getTime(), label: fmt.format(cur) });
    cur.setMonth(cur.getMonth() + 1);
  }
  return ticks;
}

export function percentInRange(ms: number, startMs: number, endMs: number): number {
  if (endMs === startMs) return 0;
  return ((ms - startMs) / (endMs - startMs)) * 100;
}
```

- [ ] **Step 4: Run — expect pass**

```bash
pnpm test src/lib/timeline.test.ts
```

- [ ] **Step 5: Replace `src/features/projects/TimelineView.tsx`**

```tsx
import type { Project, Item, Stage } from '../../db/schema';
import { computeRange, monthTicks, percentInRange } from '../../lib/timeline';
import { useUI } from '../../state/ui';

export function TimelineView({ project, items }: { project: Project; items: Item[] }) {
  const stagesSorted = [...project.stages].sort((a, b) => a.order - b.order);
  const datedItems = items.filter((i) => i.startDate !== null || i.dueDate !== null);
  const undatedItems = items.filter((i) => i.startDate === null && i.dueDate === null);
  const allTimes = datedItems.flatMap((i) => [i.startDate, i.dueDate].filter((v): v is number => v !== null));
  const [start, end] = computeRange(allTimes);
  const ticks = monthTicks(start, end);

  return (
    <div className="glass p-4">
      <div className="grid mb-3" style={{ gridTemplateColumns: `repeat(${ticks.length}, 1fr)` }}>
        {ticks.map((t) => (
          <div key={t.ms} className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t.label}</div>
        ))}
      </div>
      {stagesSorted.map((stage) => {
        const stageItems = datedItems.filter((i) => i.stageId === stage.id);
        if (stageItems.length === 0) return null;
        return (
          <div key={stage.id} className="mb-4">
            <div className="text-[11px] font-bold tracking-wider uppercase mb-2" style={{ color: stage.color }}>{stage.name}</div>
            {stageItems.map((item) => <TimelineBar key={item.id} item={item} stage={stage} start={start} end={end} />)}
          </div>
        );
      })}
      {undatedItems.length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[11px] font-bold tracking-wider uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
            No date · {undatedItems.length}
          </div>
          {undatedItems.map((i) => <UndatedRow key={i.id} item={i} />)}
        </div>
      )}
    </div>
  );
}

function TimelineBar({ item, stage, start, end }: { item: Item; stage: Stage; start: number; end: number }) {
  const openDrawer = useUI((s) => s.openDrawer);
  const left = percentInRange(item.startDate ?? item.dueDate ?? start, start, end);
  const right = percentInRange(item.dueDate ?? item.startDate ?? start, start, end);
  const width = Math.max(0.5, right - left);
  return (
    <div className="relative h-6 mb-1.5 rounded" style={{ background: 'rgba(127,127,127,0.06)' }}>
      <button
        onClick={() => openDrawer(item.id)}
        className="absolute top-0 h-full rounded text-[11px] text-left px-2 truncate hover:brightness-110 transition"
        style={{ left: `${left}%`, width: `${width}%`, background: stage.color, color: '#fff' }}
        title={item.title}
      >
        {item.title}
      </button>
    </div>
  );
}

function UndatedRow({ item }: { item: Item }) {
  const openDrawer = useUI((s) => s.openDrawer);
  return (
    <button onClick={() => openDrawer(item.id)} className="block text-sm py-1 hover:underline">{item.title}</button>
  );
}
```

- [ ] **Step 6: Dogfood + commit**

```bash
pnpm dev
git add .
git commit -m "timeline: add per-project Timeline"
```

---

### Task 20: Portfolio Timeline

**Files:** replace `src/features/projects/PortfolioTimeline.tsx`.

- [ ] **Step 1: Implement**

```tsx
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Project } from '../../db/schema';
import { computeRange, monthTicks, percentInRange } from '../../lib/timeline';
import { currentStageId, projectDuration } from '../../db/queries';

export function PortfolioTimeline({ projects }: { projects: Project[] }) {
  const allItems = useLiveQuery(() => db.items.toArray(), [], []);

  const rows = projects.map((p) => {
    const items = allItems.filter((i) => i.projectId === p.id);
    const duration = projectDuration(items);
    const csid = currentStageId(p.stages, items);
    const stage = p.stages.find((s) => s.id === csid);
    return { project: p, duration, stage };
  });

  const allTimes = rows.flatMap((r) => (r.duration ? [r.duration[0], r.duration[1]] : []));
  const undated = rows.filter((r) => !r.duration);
  const dated = rows.filter((r) => r.duration);

  if (allTimes.length === 0) {
    return (
      <div className="glass p-8 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
        No projects have dated items yet. Open a project and set start/due dates on items to see them here.
      </div>
    );
  }

  const [start, end] = computeRange(allTimes);
  const ticks = monthTicks(start, end);

  return (
    <div className="glass p-4">
      <div className="grid mb-3" style={{ gridTemplateColumns: `200px repeat(${ticks.length}, 1fr)` }}>
        <div />
        {ticks.map((t) => (
          <div key={t.ms} className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t.label}</div>
        ))}
      </div>
      {dated.map(({ project, duration, stage }) => {
        const left = percentInRange(duration![0], start, end);
        const right = percentInRange(duration![1], start, end);
        const width = Math.max(1, right - left);
        return (
          <div key={project.id} className="grid items-center mb-2" style={{ gridTemplateColumns: `200px 1fr` }}>
            <Link to={`/project/${project.id}`} className="text-sm truncate pr-2 hover:underline">{project.name}</Link>
            <div className="relative h-6 rounded" style={{ background: 'rgba(127,127,127,0.06)' }}>
              <Link
                to={`/project/${project.id}`}
                className="absolute top-0 h-full rounded text-[11px] px-2 leading-6 truncate text-white"
                style={{ left: `${left}%`, width: `${width}%`, background: stage?.color ?? '#888' }}
                title={`${project.name} · ${stage?.name}`}
              >
                {stage?.name}
              </Link>
            </div>
          </div>
        );
      })}
      {undated.length > 0 && (
        <div className="mt-4 pt-4 border-t text-[11px]" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          {undated.length} project{undated.length === 1 ? '' : 's'} have no dated items and aren't shown here.
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Dogfood + commit**

```bash
pnpm dev
git add .
git commit -m "timeline: add Portfolio Timeline on Home"
```

---

## Phase 7 — Inbox

### Task 21: Capture + list

**Files:** `InboxList.tsx`, `ConvertDialog.tsx` (stub), replace `InboxPage.tsx`.

- [ ] **Step 1: Stub `ConvertDialog`**

`src/features/inbox/ConvertDialog.tsx`:
```tsx
import type { InboxEntry } from '../../db/schema';
export function ConvertDialog({ entry: _e, onClose }: { entry: InboxEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="glass p-6">Convert dialog — Task 22.</div>
    </div>
  );
}
```

- [ ] **Step 2: `src/features/inbox/InboxList.tsx`**

```tsx
import { useState } from 'react';
import type { InboxEntry } from '../../db/schema';
import { dismissInboxEntry, updateInboxEntry } from '../../db/mutations';
import { ConvertDialog } from './ConvertDialog';
import { formatShortDate } from '../../lib/dates';

export function InboxList({ entries }: { entries: InboxEntry[] }) {
  const [converting, setConverting] = useState<InboxEntry | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {entries.length === 0 && (
        <div className="glass p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Inbox is empty. Type above to capture an action item.
        </div>
      )}
      {entries.map((e) => (
        <div key={e.id} className="glass p-3 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {editingId === e.id ? (
              <input
                autoFocus
                defaultValue={e.title}
                onBlur={(ev) => {
                  updateInboxEntry(e.id, { title: ev.target.value.trim() || e.title });
                  setEditingId(null);
                }}
                onKeyDown={(ev) => ev.key === 'Enter' && (ev.target as HTMLInputElement).blur()}
                className="w-full bg-transparent border-b outline-none text-sm py-0.5"
                style={{ borderColor: 'var(--border)' }}
              />
            ) : (
              <div className="text-sm font-medium" onDoubleClick={() => setEditingId(e.id)}>{e.title}</div>
            )}
            {e.notes && (
              <div className="text-[11px] mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                {e.notes.slice(0, 80)}{e.notes.length > 80 ? '…' : ''}
              </div>
            )}
            <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{formatShortDate(e.createdAt)}</div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setConverting(e)} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--stage-slate)', color: '#fff' }}>
              Convert
            </button>
            <button onClick={() => dismissInboxEntry(e.id)} className="text-xs px-2 py-1 rounded hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">
              Dismiss
            </button>
          </div>
        </div>
      ))}
      {converting && <ConvertDialog entry={converting} onClose={() => setConverting(null)} />}
    </div>
  );
}
```

- [ ] **Step 3: Replace `src/features/inbox/InboxPage.tsx`**

```tsx
import { useState, useEffect, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/schema';
import { createInboxEntry } from '../../db/mutations';
import { InboxList } from './InboxList';

export default function InboxPage() {
  const [title, setTitle] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const entries = useLiveQuery(() => db.inboxEntries.orderBy('createdAt').reverse().toArray(), [], []);
  const visible = showHistory ? entries : entries.filter((e) => e.status === 'open');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === 'i' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        document.getElementById('inbox-capture')?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await createInboxEntry(title.trim());
    setTitle('');
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Capture</div>
        <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
      </div>
      <form onSubmit={submit} className="mb-4">
        <input
          id="inbox-capture"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add to inbox… (press 'i' to focus)"
          className="glass w-full px-4 py-3 text-sm outline-none"
          style={{ background: 'var(--surface)' }}
        />
      </form>
      <div className="flex justify-between items-center mb-3">
        <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {showHistory ? 'All entries' : 'Open'} · {visible.length}
        </div>
        <button onClick={() => setShowHistory((s) => !s)} className="text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>
          {showHistory ? 'Hide history' : 'Show history'}
        </button>
      </div>
      <InboxList entries={visible} />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "inbox: add capture + list with history toggle"
```

---

### Task 22: ConvertDialog

**Files:** replace `src/features/inbox/ConvertDialog.tsx`.

- [ ] **Step 1: Implement**

```tsx
import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type InboxEntry } from '../../db/schema';
import { convertInboxEntry } from '../../db/mutations';

export function ConvertDialog({ entry, onClose }: { entry: InboxEntry; onClose: () => void }) {
  const projects = useLiveQuery(() => db.projects.filter((p) => p.archivedAt === null).sortBy('name'), [], []);
  const [projectId, setProjectId] = useState('');
  const [stageId, setStageId] = useState('');

  useEffect(() => {
    if (projects.length > 0 && !projectId) {
      const first = projects[0];
      setProjectId(first.id);
      setStageId(first.stages[0]?.id ?? '');
    }
  }, [projects.length]);

  const project = projects.find((p) => p.id === projectId);
  useEffect(() => {
    if (project && !project.stages.some((s) => s.id === stageId)) {
      setStageId(project.stages[0]?.id ?? '');
    }
  }, [project?.id]);

  async function submit() {
    if (!projectId || !stageId) return;
    await convertInboxEntry(entry.id, projectId, stageId);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="glass glass-inner w-full max-w-md p-6">
        <h2 className="text-lg font-semibold tracking-tight mb-1">Convert to project item</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>"{entry.title}"</p>
        {projects.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No projects yet. Create one first from Home.</p>
        ) : (
          <>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-transparent border rounded px-2 py-1.5 mb-3 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Stage</label>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className="w-full bg-transparent border rounded px-2 py-1.5 mb-4 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              {project?.stages.slice().sort((a, b) => a.order - b.order).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded text-sm">Cancel</button>
          <button onClick={submit} disabled={!projectId || !stageId} className="px-3 py-1.5 rounded text-sm disabled:opacity-40" style={{ background: 'var(--stage-slate)', color: '#fff' }}>
            Convert
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Dogfood + commit**

```bash
pnpm dev
git add .
git commit -m "inbox: add Convert dialog"
```

---

## Phase 8 — Reports

### Task 23: Report generator (TDD)

**Files:** `src/features/reports/generate.ts`, `src/features/reports/generate.test.ts`

- [ ] **Step 1: `src/features/reports/generate.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { generateReport, type ReportInput } from './generate';
import type { Project, Item } from '../../db/schema';

function mkProject(name: string, stages = [{ id: 's1', name: 'Plan', color: '#000', order: 0 }]): Project {
  return { id: name, name, template: 'custom', stages, pinned: false, archivedAt: null, createdAt: 0 };
}

function mkItem(overrides: Partial<Item>): Item {
  return {
    id: 'i', projectId: 'p', stageId: 's1', title: 'T', status: 'todo',
    startDate: null, dueDate: null, notes: '', order: 0,
    stageHistory: [{ stageId: 's1', enteredAt: 0 }],
    createdAt: 0, completedAt: null,
    ...overrides,
  };
}

describe('generateReport', () => {
  const range: ReportInput['range'] = { start: 1000, end: 2000 };

  it('empty when no projects', () => {
    expect(generateReport({ projects: [], items: [], range, now: 1500 }).rows).toEqual([]);
  });

  it('counts completed in range', () => {
    const p = mkProject('A');
    const items = [
      mkItem({ id: 'a', projectId: 'A', status: 'done', completedAt: 1500 }),
      mkItem({ id: 'b', projectId: 'A', status: 'done', completedAt: 500 }),
      mkItem({ id: 'c', projectId: 'A', status: 'done', completedAt: 2500 }),
    ];
    const r = generateReport({ projects: [p], items, range, now: 1500 });
    expect(r.rows[0].completedInRange.map((i) => i.id)).toEqual(['a']);
  });

  it('counts items that entered new stage in range', () => {
    const p = mkProject('A');
    const items = [
      mkItem({ id: 'x', projectId: 'A', stageHistory: [
        { stageId: 's1', enteredAt: 0 }, { stageId: 's1', enteredAt: 1500 },
      ]}),
      mkItem({ id: 'y', projectId: 'A', stageHistory: [{ stageId: 's1', enteredAt: 500 }] }),
    ];
    const r = generateReport({ projects: [p], items, range, now: 1500 });
    expect(r.rows[0].movedInRange.map((i) => i.id)).toEqual(['x']);
  });

  it('lists blocked', () => {
    const p = mkProject('A');
    const items = [mkItem({ id: 'b', projectId: 'A', status: 'blocked' })];
    const r = generateReport({ projects: [p], items, range, now: 1500 });
    expect(r.rows[0].blocked.map((i) => i.id)).toEqual(['b']);
  });

  it('lists next 3 deadlines sorted', () => {
    const p = mkProject('A');
    const items = [
      mkItem({ id: 'a', projectId: 'A', dueDate: 3000 }),
      mkItem({ id: 'b', projectId: 'A', dueDate: 2500 }),
      mkItem({ id: 'c', projectId: 'A', dueDate: 4000 }),
      mkItem({ id: 'd', projectId: 'A', dueDate: 5000 }),
      mkItem({ id: 'e', projectId: 'A', dueDate: 1000 }),
    ];
    const r = generateReport({ projects: [p], items, range, now: 2000 });
    expect(r.rows[0].nextDeadlines.map((i) => i.id)).toEqual(['b', 'a', 'c']);
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
pnpm test src/features/reports/generate.test.ts
```

- [ ] **Step 3: `src/features/reports/generate.ts`**

```ts
import type { Project, Item } from '../../db/schema';
import { currentStageId } from '../../db/queries';

export type ReportInput = {
  projects: Project[];
  items: Item[];
  range: { start: number; end: number };
  now: number;
};

export type ReportRow = {
  project: Project;
  currentStageName: string;
  completedInRange: Item[];
  movedInRange: Item[];
  blocked: Item[];
  nextDeadlines: Item[];
};

export type Report = {
  rows: ReportRow[];
  range: { start: number; end: number };
  generatedAt: number;
};

export function generateReport(input: ReportInput): Report {
  const { projects, items, range, now } = input;
  const rows: ReportRow[] = projects.map((project) => {
    const projectItems = items.filter((i) => i.projectId === project.id);
    const completedInRange = projectItems.filter(
      (i) => i.completedAt !== null && i.completedAt >= range.start && i.completedAt <= range.end,
    );
    const movedInRange = projectItems.filter((i) =>
      i.stageHistory.some(
        (t, idx) => idx > 0 && t.enteredAt >= range.start && t.enteredAt <= range.end,
      ),
    );
    const blocked = projectItems.filter((i) => i.status === 'blocked');
    const nextDeadlines = projectItems
      .filter((i): i is Item & { dueDate: number } => i.dueDate !== null && i.dueDate >= now)
      .sort((a, b) => a.dueDate - b.dueDate)
      .slice(0, 3);
    const csid = currentStageId(project.stages, projectItems);
    const currentStage = project.stages.find((s) => s.id === csid);
    return {
      project,
      currentStageName: currentStage?.name ?? '—',
      completedInRange,
      movedInRange,
      blocked,
      nextDeadlines,
    };
  });
  return { rows, range, generatedAt: now };
}
```

- [ ] **Step 4: Run + commit**

```bash
pnpm test src/features/reports/generate.test.ts
git add .
git commit -m "reports: add pure report generator"
```

---

### Task 24: Markdown formatter (TDD)

**Files:** `src/features/reports/exportMarkdown.ts`, `src/features/reports/exportMarkdown.test.ts`

- [ ] **Step 1: `src/features/reports/exportMarkdown.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { reportToMarkdown } from './exportMarkdown';
import type { Report } from './generate';

const baseReport: Report = {
  range: { start: new Date('2026-05-01').getTime(), end: new Date('2026-05-31').getTime() },
  generatedAt: new Date('2026-05-31').getTime(),
  rows: [
    {
      project: { id: 'p1', name: 'Test Project', template: 'software', stages: [], pinned: false, archivedAt: null, createdAt: 0 },
      currentStageName: 'Build',
      completedInRange: [{ id: 'a', title: 'Done item' } as any],
      movedInRange: [],
      blocked: [{ id: 'b', title: 'Blocker' } as any],
      nextDeadlines: [{ id: 'd', title: 'Soon', dueDate: new Date('2026-06-05').getTime() } as any],
    },
  ],
};

describe('reportToMarkdown', () => {
  it('includes the date range', () => {
    expect(reportToMarkdown(baseReport)).toMatch(/May/);
  });
  it('lists project + current stage', () => {
    const md = reportToMarkdown(baseReport);
    expect(md).toContain('Test Project');
    expect(md).toContain('Build');
  });
  it('includes sections', () => {
    const md = reportToMarkdown(baseReport);
    expect(md).toContain('Done item');
    expect(md).toContain('Blocker');
    expect(md).toContain('Soon');
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
pnpm test src/features/reports/exportMarkdown.test.ts
```

- [ ] **Step 3: `src/features/reports/exportMarkdown.ts`**

```ts
import type { Report } from './generate';
import { formatShortDate } from '../../lib/dates';

export function reportToMarkdown(report: Report): string {
  const startStr = formatShortDate(report.range.start);
  const endStr = formatShortDate(report.range.end);
  const lines: string[] = [];
  lines.push(`# Status Report — ${startStr} → ${endStr}`);
  lines.push('');
  for (const row of report.rows) {
    lines.push(`## ${row.project.name}`);
    lines.push(`**Current stage:** ${row.currentStageName}`);
    lines.push('');
    if (row.completedInRange.length > 0) {
      lines.push('**Completed this period:**');
      for (const i of row.completedInRange) lines.push(`- ${i.title}`);
      lines.push('');
    }
    if (row.movedInRange.length > 0) {
      lines.push('**Moved between stages:**');
      for (const i of row.movedInRange) lines.push(`- ${i.title}`);
      lines.push('');
    }
    if (row.blocked.length > 0) {
      lines.push('**Blocked:**');
      for (const i of row.blocked) lines.push(`- ${i.title}`);
      lines.push('');
    }
    if (row.nextDeadlines.length > 0) {
      lines.push('**Next deadlines:**');
      for (const i of row.nextDeadlines) {
        lines.push(`- ${i.title} — ${formatShortDate(i.dueDate)}`);
      }
      lines.push('');
    }
    if (
      row.completedInRange.length === 0 &&
      row.movedInRange.length === 0 &&
      row.blocked.length === 0 &&
      row.nextDeadlines.length === 0
    ) {
      lines.push('_No activity in this period._');
      lines.push('');
    }
  }
  return lines.join('\n');
}
```

- [ ] **Step 4: Run + commit**

```bash
pnpm test src/features/reports/exportMarkdown.test.ts
git add .
git commit -m "reports: add markdown formatter"
```

---

### Task 25: Reports page (preview + copy + safe PDF)

**Files:** `src/features/reports/ReportPreview.tsx`, `src/features/reports/exportPdf.ts`, replace `ReportsPage.tsx`.

`ReportPreview` uses `react-markdown` (renders to React nodes — safe by default). `exportPdf` runs marked → DOMPurify, then DOM-builds the popup window via createElement / appendChild / DOMParser — no document.write, no innerHTML.

- [ ] **Step 1: `src/features/reports/exportPdf.ts`**

```ts
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export async function exportPdf(markdown: string, filename = 'report.pdf'): Promise<void> {
  const rawHtml = await marked(markdown);
  const safeHtml = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });

  const win = window.open('', '_blank', 'width=900,height=1200');
  if (!win) throw new Error('Popup blocked');

  const doc = win.document;
  doc.title = filename;

  const style = doc.createElement('style');
  style.textContent =
    "body { font-family: 'Lexend', system-ui, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #23262e; }" +
    " h1 { font-size: 24px; letter-spacing: -0.01em; }" +
    " h2 { font-size: 18px; margin-top: 28px; }" +
    " ul { padding-left: 20px; }" +
    " li { margin: 4px 0; }" +
    " @media print { body { margin: 20px; } }";
  doc.head.appendChild(style);

  // Parse sanitized HTML into nodes and append (avoids raw HTML assignment to the DOM).
  const parser = new DOMParser();
  const parsed = parser.parseFromString(safeHtml, 'text/html');
  for (const node of Array.from(parsed.body.childNodes)) {
    doc.body.appendChild(doc.importNode(node, true));
  }

  win.focus();
  setTimeout(() => win.print(), 250);
}
```

- [ ] **Step 2: `src/features/reports/ReportPreview.tsx`**

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ReportPreview({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 3: Replace `src/features/reports/ReportsPage.tsx`**

```tsx
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/schema';
import { generateReport, type Report } from './generate';
import { reportToMarkdown } from './exportMarkdown';
import { ReportPreview } from './ReportPreview';
import { exportPdf } from './exportPdf';
import { startOfDayMs, endOfDayMs, todayMs } from '../../lib/dates';

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoOffset(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

function isoToMs(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

export default function ReportsPage() {
  const [startIso, setStartIso] = useState(isoOffset(-7));
  const [endIso, setEndIso] = useState(isoToday());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [report, setReport] = useState<Report | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const projects = useLiveQuery(() => db.projects.filter((p) => p.archivedAt === null).sortBy('name'), [], []);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function selectAll() {
    setSelected(new Set(projects.map((p) => p.id)));
  }

  async function generate() {
    const targetIds = selected.size === 0 ? new Set(projects.map((p) => p.id)) : selected;
    const targets = projects.filter((p) => targetIds.has(p.id));
    const allItems = await db.items.where('projectId').anyOf([...targetIds]).toArray();
    setReport(
      generateReport({
        projects: targets,
        items: allItems,
        range: { start: startOfDayMs(isoToMs(startIso)), end: endOfDayMs(isoToMs(endIso)) },
        now: todayMs(),
      }),
    );
  }

  const markdown = report ? reportToMarkdown(report) : '';

  async function copyMd() {
    try {
      await navigator.clipboard.writeText(markdown);
      setMsg('Copied to clipboard.');
      setTimeout(() => setMsg(null), 1500);
    } catch {
      setMsg('Copy failed.');
    }
  }

  async function pdf() {
    try {
      await exportPdf(markdown);
    } catch {
      setMsg('PDF blocked. Use Copy markdown.');
      await copyMd();
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
      </div>
      <div className="glass p-4 mb-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>From</label>
            <input
              type="date"
              value={startIso}
              onChange={(e) => setStartIso(e.target.value)}
              className="w-full bg-transparent border rounded px-2 py-1 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>To</label>
            <input
              type="date"
              value={endIso}
              onChange={(e) => setEndIso(e.target.value)}
              className="w-full bg-transparent border rounded px-2 py-1 text-sm"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>
        </div>
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Projects ({selected.size === 0 ? 'all' : selected.size})
            </label>
            <button onClick={selectAll} className="text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>Select all</button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-auto">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`text-xs px-2 py-1 rounded border ${selected.has(p.id) ? 'ring-2' : ''}`}
                style={{ borderColor: 'var(--border)', background: selected.has(p.id) ? 'var(--surface)' : 'transparent' }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <button onClick={generate} className="px-4 py-2 rounded text-sm" style={{ background: 'var(--stage-slate)', color: '#fff' }}>
          Generate
        </button>
      </div>
      {msg && <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{msg}</div>}
      {report && (
        <div className="glass p-6">
          <div className="flex justify-end gap-2 mb-4">
            <button onClick={copyMd} className="text-sm px-3 py-1.5 rounded hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">
              Copy markdown
            </button>
            <button onClick={pdf} className="text-sm px-3 py-1.5 rounded" style={{ background: 'var(--text-primary)', color: 'var(--bg-base)' }}>
              Download PDF
            </button>
          </div>
          <ReportPreview markdown={markdown} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Dogfood + commit**

```bash
pnpm dev    # set range → Generate → Copy markdown / Download PDF
git add .
git commit -m "reports: add Reports page with safe preview and DOM-built PDF popup"
```

---

## Phase 9 — Settings

### Task 26: Templates editor

**Files:** `src/features/settings/TemplatesEditor.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useState, useEffect } from 'react';
import type { ProjectTemplate, Stage } from '../../db/schema';
import { TEMPLATE_NAMES, templateLabel, getTemplateStages } from '../../lib/templates';

const STORAGE_KEY = 'tpm-templates';

type Stored = Record<ProjectTemplate, Omit<Stage, 'id'>[]>;

function loadStored(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Stored;
  } catch {
    /* ignore */
  }
  const out = {} as Stored;
  for (const t of TEMPLATE_NAMES) {
    out[t] = getTemplateStages(t).map(({ id: _id, ...rest }) => rest);
  }
  return out;
}

function save(s: Stored) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function TemplatesEditor() {
  const [stored, setStored] = useState<Stored>(() => loadStored());
  const [active, setActive] = useState<ProjectTemplate>('software');

  useEffect(() => { save(stored); }, [stored]);

  const stages = stored[active];

  function update(idx: number, patch: Partial<Omit<Stage, 'id'>>) {
    setStored({ ...stored, [active]: stages.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  }

  function addStage() {
    setStored({ ...stored, [active]: [...stages, { name: 'New stage', color: '#6b7ca8', order: stages.length }] });
  }

  function removeStage(idx: number) {
    const next = stages.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i }));
    setStored({ ...stored, [active]: next });
  }

  return (
    <section className="glass p-5 mb-4">
      <h2 className="text-sm font-semibold tracking-tight mb-3">Templates</h2>
      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        Edit the default stages for newly created projects. Existing projects are unaffected.
      </p>
      <div className="flex gap-1 mb-3">
        {TEMPLATE_NAMES.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`text-xs px-3 py-1 rounded border ${active === t ? 'ring-2' : ''}`}
            style={{ borderColor: 'var(--border)', background: active === t ? 'var(--surface)' : 'transparent' }}
          >
            {templateLabel(t)}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {stages.map((s, i) => (
          <div key={`${active}-${i}`} className="flex gap-2 items-center">
            <input
              defaultValue={s.name}
              onBlur={(e) => update(i, { name: e.target.value.trim() || s.name })}
              className="flex-1 bg-transparent border-b text-sm py-1 outline-none"
              style={{ borderColor: 'var(--border)' }}
            />
            <input
              type="color"
              defaultValue={s.color}
              onBlur={(e) => update(i, { color: e.target.value })}
              className="w-7 h-7 bg-transparent border rounded"
              style={{ borderColor: 'var(--border)' }}
            />
            <button onClick={() => removeStage(i)} className="text-xs px-2 py-1" style={{ color: 'var(--stage-rose)' }}>Remove</button>
          </div>
        ))}
        <button onClick={addStage} className="text-xs px-3 py-1.5 rounded border w-full" style={{ borderColor: 'var(--border)' }}>
          + Add stage
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "settings: add Templates editor"
```

---

### Task 27: Appearance + DataIO + Archived

**Files:** `AppearanceSettings.tsx`, `DataIO.tsx`, `ArchivedProjects.tsx`, replace `SettingsPage.tsx`.

- [ ] **Step 1: `src/features/settings/AppearanceSettings.tsx`**

```tsx
import { useUI, type Theme, type Font } from '../../state/ui';

const themes: Theme[] = ['light', 'dark', 'system'];
const fonts: { id: Font; label: string }[] = [
  { id: 'lexend', label: 'Lexend (default)' },
  { id: 'opendyslexic', label: 'OpenDyslexic' },
];

export function AppearanceSettings() {
  const { theme, font, setTheme, setFont } = useUI();
  return (
    <section className="glass p-5 mb-4">
      <h2 className="text-sm font-semibold tracking-tight mb-3">Appearance</h2>
      <div className="mb-4">
        <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Theme</label>
        <div className="flex gap-1">
          {themes.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`text-xs px-3 py-1.5 rounded border ${theme === t ? 'ring-2' : ''}`}
              style={{ borderColor: 'var(--border)', background: theme === t ? 'var(--surface)' : 'transparent' }}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Font</label>
        <div className="flex gap-1">
          {fonts.map((f) => (
            <button
              key={f.id}
              onClick={() => setFont(f.id)}
              className={`text-xs px-3 py-1.5 rounded border ${font === f.id ? 'ring-2' : ''}`}
              style={{ borderColor: 'var(--border)', background: font === f.id ? 'var(--surface)' : 'transparent' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: `src/features/settings/DataIO.tsx`**

```tsx
import { useState, useRef } from 'react';
import { db, type Project, type Item, type InboxEntry } from '../../db/schema';

type ExportShape = {
  version: 1;
  exportedAt: number;
  projects: Project[];
  items: Item[];
  inboxEntries: InboxEntry[];
};

function validate(parsed: unknown): { ok: true; data: ExportShape } | { ok: false; error: string } {
  if (!parsed || typeof parsed !== 'object') return { ok: false, error: 'Not an object' };
  const o = parsed as Record<string, unknown>;
  if (o.version !== 1) return { ok: false, error: `Unsupported version ${o.version}` };
  if (!Array.isArray(o.projects)) return { ok: false, error: 'projects is not an array' };
  if (!Array.isArray(o.items)) return { ok: false, error: 'items is not an array' };
  if (!Array.isArray(o.inboxEntries)) return { ok: false, error: 'inboxEntries is not an array' };
  for (const p of o.projects as unknown[]) {
    if (!p || typeof p !== 'object') return { ok: false, error: 'Bad project' };
    const pp = p as Record<string, unknown>;
    if (typeof pp.id !== 'string' || typeof pp.name !== 'string' || !Array.isArray(pp.stages)) {
      return { ok: false, error: `Project ${pp.id ?? '?'} is missing fields` };
    }
  }
  for (const i of o.items as unknown[]) {
    if (!i || typeof i !== 'object') return { ok: false, error: 'Bad item' };
    const ii = i as Record<string, unknown>;
    if (typeof ii.id !== 'string' || typeof ii.projectId !== 'string' || typeof ii.stageId !== 'string') {
      return { ok: false, error: `Item ${ii.id ?? '?'} is missing required fields` };
    }
  }
  return { ok: true, data: parsed as ExportShape };
}

export function DataIO() {
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function exportAll() {
    const [projects, items, inboxEntries] = await Promise.all([
      db.projects.toArray(),
      db.items.toArray(),
      db.inboxEntries.toArray(),
    ]);
    const data: ExportShape = { version: 1, exportedAt: Date.now(), projects, items, inboxEntries };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `the-project-maneger-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg('Exported.');
  }

  async function importFromFile(file: File) {
    setMsg(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch (e) {
      setMsg(`Invalid JSON: ${(e as Error).message}`);
      return;
    }
    const result = validate(parsed);
    if (!result.ok) {
      setMsg(`Import failed: ${result.error}`);
      return;
    }
    if (!window.confirm('Replace ALL current data with the import? This cannot be undone.')) return;
    await db.transaction('rw', db.projects, db.items, db.inboxEntries, async () => {
      await Promise.all([db.projects.clear(), db.items.clear(), db.inboxEntries.clear()]);
      await db.projects.bulkAdd(result.data.projects);
      await db.items.bulkAdd(result.data.items);
      await db.inboxEntries.bulkAdd(result.data.inboxEntries);
    });
    setMsg(`Imported ${result.data.projects.length} projects, ${result.data.items.length} items.`);
  }

  return (
    <section className="glass p-5 mb-4">
      <h2 className="text-sm font-semibold tracking-tight mb-3">Data</h2>
      <div className="flex gap-2 mb-2">
        <button onClick={exportAll} className="text-sm px-3 py-1.5 rounded border" style={{ borderColor: 'var(--border)' }}>
          Export all (JSON)
        </button>
        <button onClick={() => fileRef.current?.click()} className="text-sm px-3 py-1.5 rounded border" style={{ borderColor: 'var(--border)' }}>
          Import JSON…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importFromFile(f);
            e.target.value = '';
          }}
        />
      </div>
      {msg && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{msg}</div>}
    </section>
  );
}
```

- [ ] **Step 3: `src/features/settings/ArchivedProjects.tsx`**

```tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/schema';
import { restoreProject, deleteProject } from '../../db/mutations';
import { formatShortDate } from '../../lib/dates';

export function ArchivedProjects() {
  const archived = useLiveQuery(() => db.projects.filter((p) => p.archivedAt !== null).toArray(), [], []);
  return (
    <section className="glass p-5 mb-4">
      <h2 className="text-sm font-semibold tracking-tight mb-3">Archived projects</h2>
      {archived.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>None.</p>
      ) : (
        <div className="space-y-1">
          {archived.map((p) => (
            <div key={p.id} className="flex items-center gap-2 py-1.5 text-sm">
              <span className="flex-1 truncate">{p.name}</span>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Archived {p.archivedAt ? formatShortDate(p.archivedAt) : ''}
              </span>
              <button onClick={() => restoreProject(p.id)} className="text-xs px-2 py-1 rounded hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">
                Restore
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Permanently delete "${p.name}" and its items?`)) deleteProject(p.id);
                }}
                className="text-xs px-2 py-1"
                style={{ color: 'var(--stage-rose)' }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Replace `src/features/settings/SettingsPage.tsx`**

```tsx
import { TemplatesEditor } from './TemplatesEditor';
import { AppearanceSettings } from './AppearanceSettings';
import { DataIO } from './DataIO';
import { ArchivedProjects } from './ArchivedProjects';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Preferences</div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>
      <AppearanceSettings />
      <TemplatesEditor />
      <DataIO />
      <ArchivedProjects />
    </div>
  );
}
```

- [ ] **Step 5: Dogfood + commit**

```bash
pnpm dev    # toggle theme, font; export and re-import; archive + restore
git add .
git commit -m "settings: add Appearance, DataIO, ArchivedProjects"
```

---

## Phase 10 — PWA + final pass

### Task 28: PWA — manifest, icons, service worker

**Files:** modify `vite.config.ts`, create `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable.png`.

- [ ] **Step 1: Placeholder icons**

```bash
mkdir -p public
if command -v magick >/dev/null; then
  magick -size 192x192 xc:'#6b7ca8' public/icon-192.png
  magick -size 512x512 xc:'#6b7ca8' public/icon-512.png
  magick -size 512x512 xc:'#6b7ca8' public/icon-maskable.png
else
  echo "ImageMagick not installed — drop 192x192, 512x512, and 512x512 maskable PNGs into public/"
fi
```

If `magick` is unavailable, create them in any image editor before continuing.

- [ ] **Step 2: Replace `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'icon-maskable.png'],
      manifest: {
        name: 'The Project Maneger',
        short_name: 'Maneger',
        description: 'Personal project tracker — local-first PWA.',
        theme_color: '#6b7ca8',
        background_color: '#0e1014',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    css: false,
  },
});
```

- [ ] **Step 3: Build + preview + install**

```bash
pnpm build
pnpm preview    # in Chrome address bar, click Install
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "pwa: add manifest, service worker, install affordance"
```

---

### Task 29: Final pass — tests, build, manual checklist, tag

- [ ] **Step 1: Tests**

```bash
pnpm test
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 3: Production build**

```bash
pnpm build
```

- [ ] **Step 4: Manual release checklist**

```
[ ] Create project from Software template
[ ] Add 4 items across stages
[ ] Drag item to a different column → DevTools → IndexedDB → verify stageHistory grew
[ ] Set due dates on 2 items
[ ] Toggle Timeline → bars render
[ ] Pin project → it appears in sidebar
[ ] Add Inbox entry → convert to project item
[ ] Reports → 30-day range → Generate → preview renders
[ ] Copy markdown → paste into a text editor, verify formatting
[ ] Download PDF → print preview opens
[ ] Settings → toggle dark mode, then OpenDyslexic font
[ ] Settings → Export JSON
[ ] DevTools → IndexedDB → delete `the_project_maneger`
[ ] Refresh → empty state
[ ] Settings → Import the JSON → all data restored
[ ] Archive a project → leaves Home, appears in Archived
[ ] Restore archived project → returns to Home
[ ] Install as PWA → confirm dock icon and standalone window
```

- [ ] **Step 5: Tag**

```bash
git add .
git commit -m "release: v0.1.0 — initial dogfoodable build" --allow-empty
git tag v0.1.0
```

---

## Self-Review Notes

Spec coverage:

- §3 Core concepts → Tasks 4 + 6 + 7.
- §3.5 current stage / §3.6 project duration → Task 8.
- §5.1 Sidebar → Task 11.
- §5.2 Home → Tasks 15 + 20.
- §5.3 Project Detail → Tasks 16, 17, 18, 19.
- §5.4 Inbox → Tasks 21 + 22.
- §5.5 Reports → Tasks 23, 24, 25.
- §5.6 Settings → Tasks 26 + 27.
- §7 Calm Glass + dark/light → Task 1 CSS.
- §7.3 Lexend default + OpenDyslexic toggle → Task 1 fonts + Task 27.
- §8 error handling → JSON validation in DataIO, stage-delete fallback dialog, project-delete confirm, PDF popup fallback, undated lane on Timeline, archived hidden by default.
- §9 testing → Vitest covers `lib/`, `db/`, `state/`, `features/reports/generate.ts`.
- §10 deployment → Task 28.

**Acceptable v1 shortcuts:**

- IndexedDB quota-exceeded banner is not globally watched. Single-user usage is well below quota.
- Toasts are inline per page (Reports / DataIO).
- Drag-and-drop has dnd-kit's KeyboardSensor (Tab to focus, Space to pick up, arrows to move).
- PWA icons are placeholder solid color — replace before public release.
- `react-to-print` was listed in the spec stack but `exportPdf.ts` uses a sanitized popup + `window.print()` instead (smaller surface).

**Plan complete.**

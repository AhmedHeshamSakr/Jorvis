# The Project Maneger — Design Spec

**Date:** 2026-05-03
**Status:** Draft, awaiting user review
**Owner:** Ahmed Hesham

## 1. Purpose

A personal, single-user PWA for tracking projects across the AWQAF program (26+ projects, 5 workstreams), Arabic ASR work, Flutter apps, and side projects.

The tool must be **simple, practical, and visually beautiful**. The user explicitly does not want AI features, integrations, or complex workflows. They want to add a project, see it in a beautiful organized layout, drop content under stages, and at the end of the week generate a status report for leadership.

**Top three pains it solves (in priority order):**
1. Reporting upward — generating weekly/monthly status reports for leadership
2. Action item tracking — items from meetings disappearing into the void
3. Cross-project view — losing the ability to see what overlaps across many projects

## 2. Non-Goals (v1)

Explicitly out of scope to keep v1 shippable:

- Stakeholder / contact management
- AI features of any kind (no summaries, no auto-extraction, no LLM)
- Cloud sync / multi-device sync
- Authentication / accounts
- Notifications / reminders
- Project-to-project dependencies
- Attachments / file uploads
- Tags / labels
- Global search
- Mobile-specific layout (PWA installs on mobile, but layout is desktop-first)

These may be revisited after the user has lived with v1 for a few weeks.

## 3. Core Concepts

### 3.1 Project
A container for related work. Created from a template (Software / Research / Content / Custom). Has an ordered list of stages. Can be pinned (shown on the Home dashboard) or archived (hidden from default views).

### 3.2 Stage
An ordered phase within a project. Has a name, color, and order. Stages are customizable per project — templates seed the initial set, but the user can rename, reorder, add, or delete stages anytime.

Default stage palette (calm, desaturated):
- Slate blue `#6b7ca8`
- Warm sand `#c4a66f`
- Sage green `#85b89d`
- Dusty rose `#9a6b71`

### 3.3 Item
A unit of work under a stage. Holds: title, status (`todo` / `doing` / `done` / `blocked`), optional start and due dates, and markdown notes for free-form content.

### 3.4 Inbox Entry
A quick-capture entry that has not yet been assigned to a project. Lives in the global Inbox until the user converts it to a project Item or dismisses it. Solves the "I just got out of a meeting and need to dump 5 actions in 10 seconds" friction.

### 3.5 Derived: "Current Stage" of a Project
Computed, not stored. **Definition:** the leftmost stage (by `order`) that has at least one item with `status !== 'done'`. If all items are done, current stage = the rightmost stage. If the project has zero items, current stage = the leftmost stage. This single rule drives every "current stage" reference in the UI.

### 3.6 Derived: Project Duration
Computed, not stored. **Definition:** `[min(item.startDate ?? item.dueDate), max(item.dueDate ?? item.startDate)]` across all items in the project that have at least one date. Projects with zero dated items do not appear on the Portfolio Timeline (a banner explains this and links to set dates).

## 4. Data Model

```ts
type ProjectTemplate = 'software' | 'research' | 'content' | 'custom';

type Stage = {
  id: string;
  name: string;
  color: string;   // hex
  order: number;
};

type Project = {
  id: string;
  name: string;
  template: ProjectTemplate;
  stages: Stage[];
  pinned: boolean;
  archivedAt: number | null;  // epoch ms; null = active
  createdAt: number;
};

type ItemStatus = 'todo' | 'doing' | 'done' | 'blocked';

type StageTransition = {
  stageId: string;
  enteredAt: number;          // epoch ms
};

type Item = {
  id: string;
  projectId: string;
  stageId: string;            // current stage; mirrors last entry in stageHistory
  title: string;
  status: ItemStatus;
  startDate: number | null;   // epoch ms
  dueDate: number | null;     // epoch ms
  notes: string;              // markdown
  order: number;              // ordering within (projectId, stageId)
  stageHistory: StageTransition[];  // append-only; first entry = creation stage
  createdAt: number;
  completedAt: number | null;
};

type InboxStatus = 'open' | 'converted' | 'dismissed';

type InboxEntry = {
  id: string;
  title: string;
  notes: string;              // markdown
  status: InboxStatus;
  convertedToItemId: string | null;
  createdAt: number;
};
```

Stored in IndexedDB via Dexie. Three tables: `projects`, `items`, `inboxEntries`.

## 5. Screens

Five top-level routes, all behind a persistent sidebar.

### 5.1 Sidebar (always visible)
- App name / logo
- Home (`/`)
- Inbox (`/inbox`) — badge with open entry count
- Reports (`/reports`)
- Settings (`/settings`)
- Divider
- Pinned projects (quick links to `/project/:id`)

### 5.2 Home (`/`)
Toggle: **Projects** | **Timeline**.

**Projects view** (default):
- Pinned projects rendered as cards on top: project name, mini progress strip across all stages, current stage label, item count.
- Below: full list of all active projects as a sortable table (name, current stage, item count, next due date).
- `+ New Project` button.

**Timeline view**:
- Portfolio Gantt: one row per project, horizontal bar showing project duration, colored by current stage. Hovering a bar shows project name + stage breakdown.

### 5.3 Project Detail (`/project/:id`)
Header: project name (inline-edit on click), pin toggle, archive button.

Below header: **Progress strip** — one segment per stage, each showing fill % (`done count / total count` for that stage) and the stage label.

Toggle: **Kanban** | **Timeline**.

**Kanban view** (default):
- Columns = stages, in order. Each column header shows stage name + item count.
- Cards = items. Card shows title, status pill, due date.
- Drag and drop between columns reassigns `stageId` and appends a new `StageTransition` to `stageHistory`. Drag within column changes `order` only (no history entry).
- Click a card → opens **Item Drawer** on the right side (does not navigate away). The drawer edits all Item fields: title, status, start/due dates, markdown notes (rendered with `@uiw/react-md-editor`), plus a delete button.
- `+ Add item` placeholder at the bottom of each column.

**Timeline view**:
- Per-project Gantt grouped by stage. Items with no dates are bucketed into a "No date" lane at the bottom (not hidden).

### 5.4 Inbox (`/inbox`)
- Top: capture input — single field, Enter creates a new entry instantly.
- Below: list of open entries. Each shows title, notes preview (first ~80 chars of rendered markdown), age.
- Per-entry actions: **Convert to project item** (opens dialog: pick project + stage), **Dismiss**, **Edit**.
- Converted/dismissed entries are hidden by default; toggle to show history.

### 5.5 Reports (`/reports`)
- Form: date range picker, project multi-select (default: all active projects), `Generate` button.
- Output (rendered in-page):
  - Per project: name, current stage (per §3.5), items completed in range (`completedAt` within range), items that entered a new stage in range (any `stageHistory.enteredAt` within range), blocked items (`status === 'blocked'`), next 3 upcoming deadlines (`dueDate >= now`, sorted ascending).
- Actions: `Copy markdown`, `Download PDF`.

### 5.6 Settings (`/settings`)
- **Templates** editor: define default stages for each template (Software, Research, Content). Custom template starts blank.
- **Appearance**: theme toggle (Light / Dark / System), font toggle (Lexend default, OpenDyslexic alternative).
- **Data**: Export all (downloads JSON), Import (uploads JSON, validates atomically before writing).
- **Archived projects**: list with restore action.

## 6. Architecture

Pure frontend, single-page application, local-first. No backend.

### 6.1 Stack

| Concern | Choice |
|---|---|
| Framework | React 18 |
| Build | Vite |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Local DB | IndexedDB via Dexie |
| Reactive queries | `dexie-react-hooks` (`useLiveQuery`) |
| UI state | Zustand |
| Routing | react-router v6 |
| Drag & drop | dnd-kit |
| Markdown editor | `@uiw/react-md-editor` |
| PDF export | `react-to-print` + `marked` |
| PWA | `vite-plugin-pwa` |
| Fonts | Lexend (primary), OpenDyslexic (alternative) — both via `@fontsource` |

### 6.2 Folder Structure

```
src/
  app/
    Layout.tsx              # sidebar + main outlet, theme provider
    routes.tsx              # route table
  features/
    projects/
      ProjectList.tsx
      ProjectCard.tsx       # pinned card + mini strip
      ProjectDetail.tsx
      KanbanView.tsx
      TimelineView.tsx
      PortfolioTimeline.tsx
      ProgressStrip.tsx
      NewProjectDialog.tsx
    items/
      ItemCard.tsx
      ItemDrawer.tsx        # editor (right-side slide-in)
    inbox/
      InboxList.tsx
      InboxEntry.tsx
      ConvertDialog.tsx
    reports/
      ReportForm.tsx
      ReportPreview.tsx
      generate.ts           # pure: data + range -> report model
      exportMarkdown.ts
      exportPdf.ts
    settings/
      TemplatesEditor.tsx
      AppearanceSettings.tsx
      DataIO.tsx
      ArchivedProjects.tsx
  db/
    schema.ts               # Dexie schema + types
    queries.ts              # all reads
    mutations.ts            # all writes (atomic transactions)
    migrations.ts           # version bumps
  state/
    ui.ts                   # zustand: drawer open, active toggle, theme, font
  lib/
    templates.ts            # built-in stage templates
    dates.ts                # date helpers for Timeline
    ids.ts                  # id generator (nanoid)
  styles/
    globals.css             # Tailwind + CSS vars for theme/font
  main.tsx
  manifest.webmanifest
public/
  icons/                    # PWA icons (192, 512, maskable)
```

### 6.3 Data Flow

One-direction:

```
User action → mutation (db/mutations.ts) → Dexie write
                                              ↓
                                        liveQuery fires
                                              ↓
                                    Components re-render
```

No domain-data caching layer. Components subscribe directly via `useLiveQuery`. UI-only state (drawer open, active view, theme) lives in Zustand.

All mutations are wrapped in `db.transaction()`. Imports from JSON are validated end-to-end before any write — partial imports never happen.

## 7. Visual Design

**The most important pillar of this project.** Quality of UI/UX is a first-class requirement, not a polish phase.

### 7.1 Aesthetic
**Calm Glass.** Translucent surfaces with `backdrop-filter: blur(12px)`, hairline borders (`1px rgba(255,255,255,0.06)` dark, `rgba(0,0,0,0.06)` light), subtle inner highlight + soft drop shadow. Restraint with color, depth without noise. Long-session friendly.

### 7.2 Color Palette

**Stage colors (desaturated, used semantically):**
- Slate blue `#6b7ca8`
- Warm sand `#c4a66f`
- Sage green `#85b89d`
- Dusty rose `#9a6b71`

These are also exposed as CSS custom properties so user-defined stages can pick from a curated set.

**Surfaces — Dark mode:**
- Base: radial gradient `#1a1f2c → #0e1014`
- Surface: `rgba(255,255,255,0.03)`
- Border: `rgba(255,255,255,0.06)`
- Text primary: `#e6e9ef`
- Text muted: `#7d8696`

**Surfaces — Light mode:**
- Base: radial gradient `#ffffff → #f6f5f1`
- Surface: `rgba(255,255,255,0.7)`
- Border: `rgba(0,0,0,0.06)`
- Text primary: `#23262e`
- Text muted: `#7a7e88`

### 7.3 Typography
- **Primary font: Lexend** — evidence-backed for reading proficiency, dyslexia-friendly, professional.
- **Alternative: OpenDyslexic** — toggleable in Settings.
- Headings: tight letter-spacing (`-0.01em` to `-0.02em`), weights 600–700.
- Body: generous line-height (`1.6+`), regular weight.
- Labels: small uppercase, letter-spacing `0.04em`.

### 7.4 Motion
- All transitions: 200ms ease-out.
- Drawer: slide in from right.
- View toggles (Kanban ↔ Timeline): 200ms cross-fade.
- Card hover: subtle 1–2px lift with shadow grow.
- Drag preview: 0.95 scale, light glow.
- No bounces, no flashy entrances, no parallax.

### 7.5 Interaction Polish
- Local-first means **no loading spinners** anywhere — writes are instant.
- All inline edits commit on blur or Enter; Escape cancels.
- Toasts for: import success, export success, errors. Bottom-center, auto-dismiss 3s.
- Empty states are pleasant illustrations + a single CTA, not bare text.
- Keyboard: `n` for new project (Home), `i` for new inbox entry (Inbox), `Esc` to close drawer/dialog. (Full shortcut polish deferred.)

### 7.6 Accessibility
- WCAG AA contrast ratios met in both themes.
- Focus rings visible on all interactive elements.
- Drag-and-drop has keyboard alternative (move card up/down/left/right with arrow keys when focused).
- All icons have aria-labels.

## 8. Error Handling

| Scenario | Behavior |
|---|---|
| IndexedDB quota exceeded | Banner: "Storage full. Export your data and clear archived projects." Block writes that would push over. |
| IndexedDB unavailable (private mode etc.) | Fatal screen with explanation + link to enable storage. |
| JSON import validation fails | Reject with precise error (`missing field X on item Y`). Existing data untouched. |
| JSON import passes validation | Atomic write in single transaction. |
| PDF export fails | Toast + automatic fallback to "Copy markdown". |
| Drag-drop drops on invalid target | Snap card back to origin. |
| Delete a stage that has items | Modal: "Move items to which stage?" — required selection before delete. |
| Delete a project | Modal confirmation: "Delete N items too. This can't be undone." |
| Reorder stages while items exist | Items keep `stageId`, only column position changes. Safe. |
| Item with no dates in Timeline view | Bucketed into "No date" lane at bottom — not hidden. |
| Project with zero items | Empty progress strip, kanban shows `+ Add item` placeholders, timeline shows zero-width project. |
| Inbox entry converted | InboxEntry stays in DB with `status: converted` and `convertedToItemId` set. Hidden from default Inbox list, visible under "show history". |
| Archived project | Hidden from Home and excluded from Reports by default. Restorable from Settings. |

## 9. Testing Strategy

Light and scoped — this is a personal tool that gets dogfooded daily.

- **Vitest** for pure functions:
  - `lib/dates.ts`
  - `lib/templates.ts`
  - `features/reports/generate.ts`
  - `db/mutations.ts` (with fake-indexeddb)
  - JSON import/export validation
- **React Testing Library** for components with logic:
  - `KanbanView` drag handler
  - `ItemDrawer` save flow
  - `ConvertDialog`
  - `ReportForm`
- **No E2E framework for v1.** Daily dogfooding is the test.
- **Pre-release manual checklist:** create project → add items → drag between stages → toggle Timeline → generate report → export JSON → reimport into fresh DB → verify identical state.

## 10. Deployment

- Static build via `vite build`.
- Hostable on any static host (Vercel, Netlify, Cloudflare Pages — all free tier). No backend, no env vars, no secrets.
- Service worker (from `vite-plugin-pwa`) handles offline cache and update prompts.
- User installs to dock/launchpad via the browser's "Install app" affordance.

## 11. Open Questions

None blocking. The following are explicit defer-decisions, captured here so they're not forgotten:

- **Sync / multi-device:** Will revisit after a month of single-device usage. Most likely path is Firebase (already in user's stack), gated behind optional sign-in so the local-first model is preserved.
- **Stakeholder management:** Deferred from v1 entirely. May surface as a separate "People" section later, with project-membership and "last contacted" tracking.
- **AI:** Explicitly excluded. Will not be added unless the user reverses this position.

# Migration Notes

Per-version log of breaking changes that touch user-visible storage:
**IndexedDB schema** (`src/db/schema.ts`), **localStorage keys** (`tpm-ui`, `tpm-templates`, etc.), or **JSON dump format** (`src/db/validate.ts`).

The rule: every entry below must answer two questions —
1. **What changed?** (one line)
2. **What's the migration?** (code snippet or "none — additive only")

If a release has no entry here, it had no storage-shape changes. UI/feature/styling changes are out of scope — see [CHANGELOG.md](CHANGELOG.md) for those.

---

## v0.1.2 (in progress)

No storage-shape changes yet.

Service worker registration switched from `autoUpdate` to `prompt` mode — users now see a *"A new version is ready"* toast instead of a silent reload. **Not** a storage migration; called out here for visibility because it changes the user-facing update experience.

## v0.1.1 — 2026-05-04

**Storage shape:** unchanged.

The hardening pass added validation guards (`assertHexColor`, `isValidDump` tightening) but no schema or key changes. v0.1.0 dumps import cleanly into v0.1.1.

## v0.1.0 — 2026-05-04

Baseline. Three IndexedDB tables (`projects`, `items`, `inboxEntries`) at Dexie version `1`. localStorage keys in use: `tpm-ui` (theme + font), `tpm-templates` (custom stage templates).

---

## Known migration debt (not yet shipped)

These are scheduled for whichever release first justifies a major bump:

### `tpm-` localStorage keys → `jorvis-` prefix

The `tpm-` prefix is a leftover from the project's pre-rebrand name ("The Project Maneger"). All four references should migrate together, with backward-compat read at first boot:

```ts
// Run once at app boot, before any store hydrates
const PAIRS: [oldKey: string, newKey: string][] = [
  ['tpm-ui', 'jorvis-ui'],
  ['tpm-templates', 'jorvis-templates'],
];

for (const [oldKey, newKey] of PAIRS) {
  if (localStorage.getItem(newKey)) continue;            // already migrated
  const v = localStorage.getItem(oldKey);
  if (v == null) continue;                                // never had it
  localStorage.setItem(newKey, v);
  localStorage.removeItem(oldKey);
}
```

Files to update in the same commit:
- `src/state/ui.ts:28` — `name: 'tpm-ui'` → `'jorvis-ui'`
- `src/lib/templates.ts:17` — `'tpm-templates'` → `'jorvis-templates'`
- `src/lib/templates.test.ts:5` — same
- `src/features/settings/TemplatesEditor.tsx:6` — same
- `src/features/settings/DataIO.tsx:22` — `tpm-backup-…` filename → `jorvis-backup-…`

### Dexie version bumps (template, when needed)

```ts
// src/db/schema.ts — adding a 'priority' field to items
db.version(1).stores({ ... });          // keep all old versions defined
db.version(2)
  .stores({ items: 'id, projectId, stageId, priority' })  // add new index
  .upgrade((tx) =>
    tx.table('items').toCollection().modify((item) => {
      item.priority = item.priority ?? 'normal';            // backfill
    }),
  );
```

**Never** delete or modify a previous `db.version(N)` block — Dexie replays them in order to upgrade users from any historical schema.

### JSON dump version bumps

When `isValidDump` is tightened to require a new field, bump the dump's own `version` field and add a back-fill in `bulkAdd`:

```ts
// On import, if dump.version < CURRENT, run a migration before bulkAdd
if (dump.version === 1) {
  for (const item of dump.items) item.priority = item.priority ?? 'normal';
  dump.version = 2;
}
```

---

## Pre-deploy checklist for storage-touching commits

Before merging anything that edits `src/db/`, `src/state/ui.ts`, or `src/lib/templates.ts`:

- [ ] `pnpm test` passes (validator and migration tests included)
- [ ] Manually test the upgrade path: install previous version → seed data → check out new branch → `pnpm dev` → confirm data appears, no console errors
- [ ] Round-trip the JSON dump: Settings → Data → Export, then Clear all, then Import — verify everything is restored
- [ ] If Dexie version bumped, also test the **fresh install** path — clear IndexedDB in DevTools and reload to confirm `db.version(1)` still applies cleanly to new users
- [ ] Update the entry above for the new version

---

## When users hit a `VersionError` in the wild

If a user reports the app won't load and the console shows `VersionError` from Dexie, it means their stored DB version is *higher* than the code's current version (i.e. they ran a newer build, then rolled back). Recovery: have them export their data via the previous version (or extract it from DevTools → Application → IndexedDB → Export), then clear storage and re-import.

This is rare with auto-update, but possible if a user is on a stale tab from a previous session and you've reverted a deploy.

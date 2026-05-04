# Changelog

All user-facing changes to Jorvis are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For storage-shape migrations and the developer-side upgrade path, see [MIGRATION_NOTES.md](MIGRATION_NOTES.md).

---

## [Unreleased]

### Added
- **Update toast** — when a new version of Jorvis is deployed, you now see a small *"A new version is ready"* notification in the bottom-right corner with **Refresh** and **Dismiss** buttons. No more silent reloads in the middle of writing an item.
- **Version pin in Settings** — the Settings page now shows the version you're running (`Jorvis v0.1.x`) in a footer, alongside a link to the GitHub repo. Helpful when reporting bugs.
- **Brand icon on macOS Dock, Windows Taskbar, and Android home screen** — added 192×192, 512×512, maskable, and apple-touch PNG icons so installed PWAs display the Jorvis brand icon instead of a generic browser globe.
- **Live demo link** in README pointing to [jorvis.netlify.app](https://jorvis.netlify.app).
- **MIGRATION_NOTES.md** — internal reference for storage-shape changes between releases (developer-facing).
- **CHANGELOG.md** — this file.

### Changed
- **Service worker update mode**: switched from `autoUpdate` to `prompt`. The app no longer reloads itself on a background update; you choose when to refresh.

### Internal
- Package metadata (`author`, `homepage`, `repository`, `bugs`) added to `package.json`.
- Removed the internal `PLAN.md` from version control (kept locally).
- Generalized purpose statement in `SPEC.md` for public release.
- **Changelog-lint workflow** (`.github/workflows/changelog.yml`) — fails PRs to `main` that don't add a bullet under `## [Unreleased]`. Auto-skips docs/config-only PRs; bypassable with the `skip-changelog` label.

## [0.1.1] — 2026-05-04

Security hardening pass closing every finding from the v0.1.0 internal review, plus open-source release prep.

### Security
- **PDF export**: switched the popup to a hidden iframe. Modern browsers return `null` from `window.open(..., 'noopener')`, which made the previous popup-based flow non-functional and incidentally trimmed attack surface.
- **JSON import**: shape-validation via `isValidDump` before bulk-add; 50 MB cap; explicit second-confirm before destructive imports.
- **Strict Content Security Policy** (`default-src 'self'`, no inline scripts, no remote sources) — promoted from `<meta>` to real HTTP headers via `netlify.toml`, alongside HSTS, Referrer-Policy, Permissions-Policy, and X-Frame-Options.
- **Hex-color guard**: stage colors are validated at mutation time and on JSON import (`assertHexColor`), preventing CSS injection via crafted color strings.
- Bumped `vitest` to v4 (clears 2 of 4 audit findings; remaining 2 are dev-only).
- 11 new validator tests added (80 tests total passing).

### Added
- TypeScript `strict` mode + `forceConsistentCasingInFileNames`.
- GitHub Actions CI: install + typecheck + tests + build on every push and PR to `main`.
- MIT `LICENSE`, public `README`, `SECURITY.md` with private vulnerability reporting flow.
- `netlify.toml` with build configuration, SPA fallback, immutable caching for `/assets/*`, and no-cache for `sw.js`.

### Changed
- TS compile target lowered from `ES2023` to `ES2022` for Edge Tools schema compatibility (no behavior change — covers everything in use).
- App rebranded from *The Project Maneger* to **Jorvis**, tagline *"Jarvis, but you do the thinking."*

## [0.1.0] — 2026-05-04

Initial release. All ten development phases complete.

### Added

#### Database & domain model
- Dexie / IndexedDB schema for three tables: `projects`, `items`, `inboxEntries`.
- Project, item, stage, and inbox CRUD mutations.
- Derived queries: current stage, progress percentage, duration, next due date.

#### Project pages
- **Home** — pinned project cards, sortable list view, portfolio-wide timeline.
- **Per-project detail** — header, stage manager, drag-and-drop Kanban (`@dnd-kit`), per-project Gantt-style **Timeline**.

#### Items
- Card view + side drawer with full Markdown editor (`@uiw/react-md-editor`).
- Drag-and-drop between Kanban stages with sortable column rendering.

#### Inbox
- Quick-capture (anywhere, anytime), list view, dismiss, convert-to-item dialog with project / stage picker.

#### Reports
- One-click status report generator: progress bars per project, recent stage moves, blocked items.
- Export as Markdown (`.md`) or print to PDF.

#### Settings
- System / light / dark theme picker with live preview.
- Font picker: Lexend Variable (default, dyslexia-friendly) or OpenDyslexic.
- Custom stage templates editor (add / rename / recolor / reorder / delete).
- JSON backup / restore (export full DB, import with validation).
- Archived projects view (restore or delete-forever with cascade).

#### PWA
- `vite-plugin-pwa` configured with `autoUpdate` service worker (changed to `prompt` in unreleased).
- Manifest with light + dark theme colors, apple-touch-icon, install support.
- Works fully offline after first load.

### Stack

React 19 · Vite 8 · TypeScript (strict) · Tailwind 3 · Dexie (IndexedDB) · Zustand · `@dnd-kit` · `react-markdown` + DOMPurify · `vite-plugin-pwa` · Vitest + jsdom + `fake-indexeddb` · 80 tests passing.

---

[Unreleased]: https://github.com/AhmedHeshamSakr/Jorvis/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/AhmedHeshamSakr/Jorvis/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/AhmedHeshamSakr/Jorvis/releases/tag/v0.1.0

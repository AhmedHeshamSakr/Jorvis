# Jorvis

> Jarvis, but you do the thinking.

A local-first PWA for tracking your personal projects. No accounts, no backend, no AI — just stages, items, drag-and-drop, and one-click status reports. Everything lives in your browser's IndexedDB on your own device.

## Why

Because most project trackers either send your data to a server you didn't ask about, or hide it behind an "AI assistant" that needs your data to work. Jorvis does neither. It's the project manager your mom made you.

## Try it

Live demo: _coming soon_

Or run locally:

```bash
pnpm install
pnpm dev      # dev server at http://localhost:5173
pnpm test     # vitest (80 tests)
pnpm build    # production build with PWA enabled
pnpm preview  # serve the production build
```

Once it's running, in Chrome / Edge click the install icon in the URL bar, or in Safari use **File → Add to Dock**. It launches like a native app.

## Features

- Per-project **Kanban** with drag-and-drop, plus a **Timeline** (Gantt-style) view
- **Home** — pinned project cards, sortable list, portfolio-wide Timeline
- **Inbox** — quick-capture thoughts, then convert them into project items
- **One-click status reports** — auto-generated markdown with progress bars, recent stage moves, blocked items; export as `.md` or print to PDF
- **Settings** — light/dark/system theme, Lexend or OpenDyslexic font, custom stage templates, JSON backup/restore, archived projects
- **PWA** — installs to your home screen / dock, works offline, auto-updates

## Stack

React 19 · Vite 8 · TypeScript (strict) · Tailwind 3 · Dexie (IndexedDB) · Zustand · @dnd-kit · react-markdown · DOMPurify · vite-plugin-pwa · Vitest

## Design

- **Calm Glass** aesthetic — desaturated palette (`#6b7ca8` slate · `#c4a66f` sand · `#85b89d` sage · `#9a6b71` rose), translucent surfaces, subtle blur
- **Lexend Variable** default font (dyslexia-friendly), **OpenDyslexic** alternative — togglable in Settings
- Dark, light, and system themes

## Security

The app is single-user and local-first. There is no server, no auth, no API. Your data never leaves your device. Strangers visiting the same URL load the same JS bundle but see only their own (empty) IndexedDB; same-origin policy keeps installs isolated.

For details on the threat model and the v0.1.1 hardening pass (CSP, sanitized PDF export, validated JSON import, hex-color guard against CSS injection), see commit `4acdf1f`.

## Data shape

Three IndexedDB tables: `projects`, `items`, `inboxEntries`. See [`src/db/schema.ts`](src/db/schema.ts).

The Settings → Data section exports/imports a versioned JSON dump so you can back up, sync between devices, or migrate browsers.

## License

MIT — see [LICENSE](LICENSE).

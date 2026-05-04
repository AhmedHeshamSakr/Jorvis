# Security

Jorvis is a local-first PWA. There is no server, no auth, no API. Your data lives in your browser's IndexedDB on your device. Strangers visiting the deployed URL load the same JS bundle but see only their own (empty) IndexedDB; same-origin policy keeps installs isolated.

## Reporting a vulnerability

If you find a security issue, please **do not** open a public GitHub issue. Instead, open a private security advisory via GitHub:

> Repository → **Security** tab → **Report a vulnerability**

Or email the maintainer (see `LICENSE` for the copyright line).

I'll acknowledge within 7 days and aim to ship a fix within 30 days for high-severity findings.

## Hardening summary (v0.1.1)

- **CSP** — strict policy, no remote scripts, no inline scripts, no `data:` script sources. Set both as a meta tag (`index.html`) and as an HTTP header (`netlify.toml`).
- **Markdown rendering** — `react-markdown` runs in safe-by-default mode (no raw HTML); the PDF export sanitizes via `marked` + `DOMPurify` with explicit `FORBID_TAGS`/`FORBID_ATTR`/`ALLOWED_URI_REGEXP`.
- **PDF export** — printed via a hidden same-document iframe (`adoptNode` from a `DOMParser` document) instead of a popup window.
- **JSON import** — file size capped at 50 MB, full schema validation via `isValidDump` before any DB write, two-confirm flow.
- **Stage colors** — validated against `^#[0-9a-fA-F]{3,8}$` in mutations and import to prevent CSS injection through the `style={{ background: stage.color }}` sites.
- **Service worker** — caches build artifacts only; no user data ever cached.

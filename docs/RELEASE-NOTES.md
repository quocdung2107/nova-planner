# NOVA Planner 0.1.0 — Release Notes

First release of NOVA Planner, a premium local-first personal planner for
Windows, macOS and Linux.

## What's included

- **Dashboard** with an at-a-glance overview of tasks, projects, notes and recent work.
- **Tasks** — drag-and-drop Kanban board with priorities, due dates, search and archive.
- **Calendar** — month view driven by task due dates, per-day agenda, and an overdue list.
- **Habits** — streaks and a one-click last-7-days tracking strip.
- **Project Planner** — Gantt-style timelines with colour-coded phases and work items.
- **Notes** — Markdown with live preview, tags, auto-save and PDF export.
- **Ctrl+K command palette** — global search across tasks, notes and projects, plus instant quick-add of tasks.
- **Backup & restore** — export/import the entire database as a single `.db` file from the profile menu.
- **Save Links** and **Work Log** modules.
- Light and dark themes, "starlight violet" premium design, Inter typography.
- Local-only storage in SQLite: no account, no cloud, works fully offline.

## Known limitations

- **Installers are unsigned.** Windows SmartScreen and macOS Gatekeeper
  will warn on first launch; [docs/INSTALL.md](INSTALL.md) explains how to
  proceed on each platform.
- **No cloud sync in v1, by design.** Data lives on one device; use
  database export/import to move between machines.
- **Save Links and Work Log** are carried over from the base application
  (Personal OS) and have not been redesigned for NOVA yet.
- The Notes module loads its Markdown/PDF tooling on demand, so it may
  open a moment slower than other modules on first use.

## How the installers are produced

Installers are built by the **Release** GitHub Actions workflow
(`.github/workflows/release.yml`):

- Run it manually from the Actions tab to get the Windows, macOS and
  Linux bundles as downloadable artifacts of the workflow run.
- Or push a `v*` tag (e.g. `v0.1.0`) to also publish the installers as a
  GitHub Release.

App icons are generated during the build from the NOVA logo
(`npm run icons`); they are not stored in the repository.

# NOVA Planner

**A premium, local-first personal planner — tasks, calendar, projects, habits and notes in one calm desktop app. Your data never leaves your device.**

NOVA Planner brings your day together without accounts, subscriptions or
cloud servers. Everything is stored in a local SQLite database on your own
computer, and the app works fully offline.

## Features

- **Dashboard** — an at-a-glance overview of today's tasks, active projects and recent work.
- **Tasks** — drag-and-drop Kanban board (To Do / In Progress / Completed) with priorities, due dates, search and archive.
- **Calendar** — month view of everything with a due date, a per-day agenda, and an overdue list so nothing slips.
- **Habits** — daily habit tracking with streaks and a last-7-days strip you can toggle with one click.
- **Projects** — a simple Gantt-style planner with colour-coded phases, people and week ranges.
- **Notes** — Markdown editor with live preview, tags, auto-save and PDF export.
- **Quick add & search** — press `Ctrl+K` (or `Cmd+K` on macOS) to search tasks, notes and projects, or create a task from anywhere in the app.
- **Backup & restore** — export your whole database to a single `.db` file and import it on any machine.
- **Light & dark themes** — with system-preference support.
- **Private by design** — local SQLite storage only. No account, no cloud, no telemetry.

Also included: **Save Links** (bookmark manager) and **Work Log** (a weekly
log of finished work).

## Download & install

Pre-built installers for Windows, macOS and Linux are published on the
[GitHub Releases](https://github.com/quocdung2107/nova-planner/releases) page. Step-by-step install instructions —
including how to open the app past the Windows SmartScreen and macOS
Gatekeeper warnings (the builds are currently unsigned) — are in
[docs/INSTALL.md](docs/INSTALL.md).

New to the app? The [User Guide](docs/USER-GUIDE.md) walks through every
module in a few minutes.

## Build from source

Requirements: Node.js 20+, and the Rust toolchain plus the platform
prerequisites listed in the [Tauri v2 documentation](https://v2.tauri.app/start/prerequisites/).

```bash
git clone https://github.com/quocdung2107/nova-planner.git nova-planner
cd nova-planner
npm ci
npm run icons        # generates src-tauri/icons from the NOVA logo (icons are not stored in git)
npm run tauri dev    # run in development
npm run tauri build  # produce installers under src-tauri/target/release/bundle/
```

Notes:

- The Inter and JetBrains Mono fonts come from the `@expo-google-fonts/*`
  npm packages, so `npm ci` is the only download you need — no font files
  are stored in this repository.
- `npm run build` type-checks (TypeScript strict) and builds the frontend
  into `dist/` without the desktop shell.
- Release installers for all three platforms are built by the
  `.github/workflows/release.yml` GitHub Actions workflow (manual run, or
  push a `v*` tag to also create a GitHub Release).

## Privacy

All of your data — tasks, notes, projects, habits, profile — lives in one
SQLite database file inside the app's data folder on your own machine
(look for the `com.nova.planner` folder in your OS application-data
directory). Nothing is sent anywhere; there is no sync in v1, by design.
Use **Export database** from the profile menu to keep your own backups.

## License

NOVA Planner is built on [Personal OS](https://github.com/im4aLL/personal-os)
by Md Habibullah Al Hadi, used under the MIT License — see [LICENSE](LICENSE)
for the original license text and [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)
for full attributions, including font licenses.

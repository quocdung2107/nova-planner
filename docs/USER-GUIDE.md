# NOVA Planner — User Guide

## First run

The first time you open NOVA Planner, a short setup asks for a display name
and email for your local profile. That's it — there is no account to create
and nothing leaves your device. Your data is stored locally in a SQLite
database (see the FAQ for the exact location).

## The modules

### Dashboard
Your home screen: in-progress tasks, recent work, notes and links, and your
active project timelines at a glance. Start here each morning.

### Todo (Tasks)
A drag-and-drop Kanban board with three columns — **Todo**, **In
Progress**, **Completed**. Each task can have a description, a priority
(low / medium / high), and a due date. Use the search box to filter, and
archive finished tasks instead of deleting them if you want a record —
archived tasks can be viewed and restored from the board.

### Calendar
A month view that shows every task on its due date (up to three chips per
day, with a "+N more" indicator). Click any day to see its agenda on the
right, add a task with that date pre-filled, or click a task to edit it.
Incomplete tasks past their due date are collected in an **Overdue** list
under the agenda so nothing gets lost.

### Habits
Create a habit, pick a colour, and click the circles in the last-7-days
strip to mark each day done or not done. The app tracks your current
**streak** (consecutive days up to today) and how many of the last 7 days
you completed. Click a habit to rename it, change its colour, or delete it.

### Project Planner
Plan projects on a simple Gantt-style timeline. A project has a start date
and a number of weeks; inside it you organise work into colour-coded
**phases** and add **work items** with a week range, a status and an owner.
Drag to reorder projects, phases and items.

### Notes
A Markdown editor with live preview, tags and auto-save — just start
typing. Pin important notes to the top. From a note you can also export a
polished **PDF** (the export uses the same Inter / JetBrains Mono fonts as
the app, so PDFs look like your notes on screen).

### Save Links
Save any URL and the app fetches its title and favicon automatically.
Organise links with tags, then filter or search them later.

### Work Log
Log completed work with start/end dates and tags. Entries are grouped by
week, which makes weekly reviews and reports painless.

## Quick add & global search — Ctrl+K

Press **`Ctrl+K`** (Windows/Linux) or **`Cmd+K`** (macOS) anywhere in the
app — or click the **Search…** button in the top bar.

- Type to search across **tasks, notes and projects**; select a result to
  jump to its module.
- The first result is always **"Create task: '…'"** — select it (or press
  Enter) to create a task with that title instantly, without opening the
  board first. This is the fastest way to capture a thought.

## Backup & restore

Your whole planner is one database file, which makes backup simple:

- **Export:** profile menu (bottom-left) → **Export database** → save the
  `.db` file (the suggested name is `nova-planner-backup.db`).
- **Import:** profile menu → **Import database** → pick a previously
  exported file. The app reloads with that data. Importing **replaces**
  your current data, so export first if you want to keep both.

Back up before updating the app and before moving to a new computer.

## Themes & basics

- Toggle **light / dark** theme with the sun/moon button in the top bar;
  the app also follows your system preference.
- The sidebar can be collapsed with the button in the top bar.
- Everything works offline. There is nothing to sign in to.

## FAQ

**Where is my data stored?**
In a SQLite file inside the app's data folder — look for `com.nova.planner`
in your OS application-data directory (`%APPDATA%` on Windows,
`~/Library/Application Support` on macOS, `~/.local/share` on Linux).

**Does NOVA Planner sync between devices?**
Not in v1 — local-only storage is a deliberate design choice for privacy.
To move your data, export the database on one machine and import it on
the other.

**Do I need an internet connection?**
No. The app is fully functional offline. (Fetching a title/favicon for a
saved link is the only feature that uses the network.)

**I deleted something by accident. Can I get it back?**
Tasks can be archived instead of deleted and restored from the archive.
For everything else, restore your most recent database export.

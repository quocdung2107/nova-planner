# Changelog

All notable changes to Personal OS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0]

### Added

- Infinite scroll for Save Links with cursor-based pagination (50 per page) and skeleton placeholders
- Shared `TagInput` component with keyboard navigation and suggestion dropdown, used by links, notes, and work logs
- Real project completion on the dashboard: done/total work-item counts with a Done badge, falling back to time-based progress when a project has no items
- `getProjectProgress` query aggregating done/total work items per project

### Changed

- Links list uses a single first-page load path with generation-guarded store updates to avoid double-fetch and stale results
- Note, link, and work-log tag editors consolidated onto one shared component with an inline dropdown
- Note tag saves are serialized per note and flushed on note switch to prevent interleaved writes
- Project progress stats load alongside projects in the store

### Fixed

- Tag filter applies immediately even with text in the search box; the lagging debounced search no longer clears it
- Links empty-state copy reacts to the settled search instead of in-flight keystrokes

## [1.4.0]

### Added

- Drag-and-drop reordering for projects in the sidebar
- Drag-and-drop reordering for Gantt work items and separators
- Resource name autocomplete when editing work items
- `position` column on projects with migration and cloud sync support

### Changed

- Projects list now orders by `position` instead of `created_at`
- Gantt resource column is center-aligned; comment tooltips wrap long text
- Cloud writes use non-blocking `mirrorToCloud` so local saves succeed even when remote is unreachable
- New app logo and icon set, with light/dark variants in the sidebar

## [1.3.0]

### Added

- PDF export dialog with per-export footer and date override
- Embedded Inter and JetBrains Mono fonts in note editor and PDF export
- Privacy mode toggle on the note list
- Custom thin scrollbar styling

### Changed

- Scrollbar CSS moved out of `App.css` into its own file
- Work log entry dates show the weekday

### Fixed

- Save link dialog overflow by wrapping long title/domain text

## [1.2.0]

### Added

- Note pinning to keep important notes at the top of the list
- Note export for backup or sharing

### Changed

- Confirmation dialog before deleting notes, to prevent accidental data loss
- Icons added to the note export menu

## [1.1.0]

### Added

- GitHub-themed syntax highlighting for fenced code blocks in note preview (light/dark aware)
- Floating "Add as todo" button when selecting text in note preview
- Font size controls for notes, persisted across edit and preview panes
- Archived todos dialog for viewing/managing archived tasks

### Fixed

- Todo drag-and-drop now correctly reorders cards within and across kanban columns (previously only column changes were tracked; position was silently dropped)
- Kanban column drop-target highlighting now reacts to hovering over a card, not just empty column space
- Scroll position now syncs between note edit and preview modes instead of resetting to the top on switch

### Internal

- Migrated todo drag-and-drop to `@dnd-kit/sortable` for proper index-aware drop handling

## [1.0.0-beta]

Initial release.

Windows and macOS work as expected.
Linux is available via Snap (`sudo snap install personalos`), with known issues:

- Cloud mode does not work on Arch Linux; WebKitGTK inside the strict Snap sandbox fails the frontend `fetch()` request even though the network itself is fine
- AUR package registration was disabled at release time
- The deb package was not tested

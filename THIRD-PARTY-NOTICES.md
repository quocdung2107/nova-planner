# Third-Party Notices — NOVA Planner

NOVA Planner is developed on top of open-source software. The original
copyright and license notices are preserved in this repository, as required
by the respective licenses.

## Base application

- **Personal OS** by Md Habibullah Al Hadi — MIT License
  Source: https://github.com/im4aLL/personal-os
  The full MIT license text, including the original copyright notice, is in
  the `LICENSE` file at the root of this repository and must be included
  with any distribution of NOVA Planner.

## Components and ideas evaluated for reuse (not yet bundled)

- **FlowDesk** by umitkara — MIT License (command palette, quick capture and
  calendar concepts reviewed; no code bundled yet)
- **full-calendar** by Yassir Jeraidi — MIT License (calendar UI patterns
  reviewed; no code bundled yet)
- **trud-calendar** by trudapp contributors — MIT License (calendar engine
  reviewed; no code bundled yet)

If code from any of the projects above is bundled in a future release, its
copyright notice will be added to this file before that release ships.

## Fonts

The fonts are not stored in this repository. They are provided by npm
packages that distribute the Google Fonts builds of each family:

- **Inter** — via `@expo-google-fonts/inter`. Inter is licensed under the
  SIL Open Font License 1.1; the license file ships inside the package.
- **JetBrains Mono** — via `@expo-google-fonts/jetbrains-mono`. JetBrains
  Mono is licensed under the SIL Open Font License 1.1; the license file
  ships inside the package.

## Excluded

- **Daycove** by Martzcode is licensed under the GNU AGPL-3.0. No Daycove
  code is used in NOVA Planner, because AGPL obligations are incompatible
  with the planned closed commercial distribution.

## Dependencies

All npm and Cargo dependencies are used under their own licenses (mostly
MIT / Apache-2.0 / BSD). A generated dependency license report will be added
before the first commercial release.

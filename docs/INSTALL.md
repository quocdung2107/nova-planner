# Installing NOVA Planner

Download the installer for your platform from the project's GitHub
**Releases** page, then follow the steps below.

> **Unsigned builds:** NOVA Planner installers are not code-signed yet.
> Windows and macOS will warn you the first time you open the app. This is
> expected — follow the steps for your platform and only download
> installers from this project's official Releases page.

## Windows

You get two choices with the same app inside:

- **`.exe` (NSIS installer)** — recommended. Double-click it and follow the wizard.
- **`.msi`** — standard Windows Installer package, double-click to install.

**SmartScreen warning:** if Windows shows "Windows protected your PC":

1. Click **More info**.
2. Click **Run anyway**.
3. Continue the installation as normal.

The app appears in the Start menu as **NOVA Planner** afterwards.

**Uninstall:** Settings → Apps → Installed apps → NOVA Planner → Uninstall
(or Control Panel → Programs and Features).

## macOS

1. Download the **`.dmg`** file (it is a universal build for both Intel and
   Apple Silicon Macs).
2. Open the `.dmg` and drag **NOVA Planner** into the **Applications** folder.
3. First launch: in Finder, open Applications, **right-click (or
   Control-click) NOVA Planner → Open**, then confirm **Open** in the
   dialog. You only need to do this once.

**If macOS still blocks it:** open **System Settings → Privacy &
Security**, scroll to the Security section, and click **Open Anyway** next
to the NOVA Planner message, then launch the app again.

**Uninstall:** drag NOVA Planner from Applications to the Trash.

## Linux

- **`.deb`** (Debian / Ubuntu / Mint):
  ```bash
  sudo dpkg -i NOVA-Planner_*.deb
  # if dependencies are missing afterwards:
  sudo apt-get install -f
  ```
- **`.AppImage`** (any distribution):
  ```bash
  chmod +x NOVA-Planner_*.AppImage
  ./NOVA-Planner_*.AppImage
  ```

**Uninstall:** `sudo apt remove nova-planner` for the `.deb`, or simply
delete the AppImage file.

## Where your data lives

Everything is stored in a single SQLite database inside the app's data
folder, under a folder named after the app identifier `com.nova.planner`:

- **Windows:** `%APPDATA%\com.nova.planner\`
- **macOS:** `~/Library/Application Support/com.nova.planner/`
- **Linux:** `~/.local/share/com.nova.planner/`

Uninstalling the app does not automatically delete this folder. Delete it
manually if you want to remove your data completely.

## Before you update

Updating to a new version keeps your data — the database stays in place.
Even so, make a backup first; it takes ten seconds:

1. Open the profile menu (bottom-left corner of the app).
2. Choose **Export database** and save the `.db` file somewhere safe.
3. Install the new version. If anything looks wrong, use **Import
   database** from the same menu to restore your backup.

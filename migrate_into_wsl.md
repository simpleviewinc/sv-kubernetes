# Migrate into WSL

## What is this about?

On Windows, your **application** and **container** repos (the code you install with `sv install`) may live here:

- `C:\sv-kubernetes\applications`
- `C:\sv-kubernetes\containers`

The `sv` tool runs inside **WSL** (a Linux environment on your PC). When your repos stay on the `C:` drive, Windows and WSL pass files back and forth constantly. That is slower and can cause problems when building or starting apps.

**Migrating** means copying those repos into WSL’s own storage so everything lives in one place. After that, `sv` looks for your projects there instead of under `C:\sv-kubernetes\applications` and `C:\sv-kubernetes\containers`.

## Do I have to do this?

**No.** You can keep using the `C:\sv-kubernetes\applications` and `C:\sv-kubernetes\containers` folders if everything works for you today. There is no deadline to migrate at this time.

- **New installs** are set up on the WSL side automatically during [Windows installation](install_windows.md).
- **Existing installs** can proceed with migrating whenever you want to.

## Before you start the migration

1. Confirm WSL works: open Command Prompt and run `wsl -u root`. You should get a Linux prompt.
2. Stop all of your applications.
   - `helm list` to show running applications
   - `sv stop [application]` to stop each application
4. Type `exit` to leave.
5. Close any editors or terminals that have files open under `C:\sv-kubernetes\applications` or `C:\sv-kubernetes\containers`.
6. If you plan to let the migration script automatically copy your repos, allow plenty of time; the copy step can run for **hours**.

## How to run the migration

1. Pull the latest `sv-kubernetes` changes on the master branch.
2. Open **Command Prompt**.
3. Enter WSL as root:

   ```bash
   wsl -u root
   ```

4. Run the migration script:

   ```bash
   bash /sv/scripts/migrate_wsl.sh
   ```

5. The script updates your settings so `sv` knows to use the new locations.

6. If you already have repos under `C:\sv-kubernetes\applications` or `C:\sv-kubernetes\containers`, the script will ask whether to **copy** them into WSL. See the next section.

## Copying your repos

The script can copy everything from the old folders into WSL for you. **Allowing the migration script to do this automatically can take a _really_ long time**. A few small repos might finish in minutes. Many repos—or large ones with lots of files—can take **hours**. The script shows progress while it runs.

When you see:

```text
Would you like to copy automatically? (y/n)
```

- Press **`y`** to copy your repos automatically.
- Press **`n`** to skip copying. Your settings will still be updated, but you will need to put repos in the new place yourself—e.g. run `sv install` again for each project, or copy the folders manually.

## After migration: where to find your repos

Do not open or edit projects here anymore (they are no longer used by `sv`):

- `C:\sv-kubernetes\applications`
- `C:\sv-kubernetes\containers`

Use the new locations below instead.

### From Windows (File Explorer)

1. Open File Explorer.
2. In the address bar, paste one of these:

   ```text
   \\wsl.localhost\Ubuntu\root\sv-kubernetes\applications
   \\wsl.localhost\Ubuntu\root\sv-kubernetes\containers
   ```

3. Press Enter. Pin these locations in Windows Explorer if you use them often, or update existing shortcuts to these paths.

### From WSL

```bash
cd /root/sv-kubernetes/applications
```

For containers:

```bash
cd /root/sv-kubernetes/containers
```

## Tooling

After migration, open repos from their WSL locations—not from `C:\sv-kubernetes\applications` or `C:\sv-kubernetes\containers`.

### VS Code or Cursor

You need the **WSL** extension installed in the editor (in VS Code this is “WSL”; Cursor includes equivalent remote/WSL support).

**Connect to WSL**

1. Open the Command Palette (`Ctrl+Shift+P`).
2. Run **“WSL: Connect to WSL”** (VS Code) or the equivalent WSL connect command in Cursor.
3. The editor reconnects with a WSL session. The window title or status bar should indicate you are connected to WSL (often showing `WSL: Ubuntu` or similar).

**Open a repo**

With WSL connected:

1. Open the Command Palette again.
2. Run **“WSL: Open Folder in WSL”** (or **File → Open Folder** while connected to WSL).
3. Navigate to your repo, for example:

   ```text
   /root/sv-kubernetes/applications/my-app
   # or
   /root/sv-kubernetes/containers/my-container
   ```

Alternatively, in File Explorer go to `\\wsl.localhost\Ubuntu\root\sv-kubernetes\applications\my-app`, right-click the folder, and choose **Open with Code** or **Open with Cursor** if that option is available.

**Extensions inside WSL**

Extensions installed only on Windows do not automatically apply to files opened in WSL. After you connect to WSL and open a folder there, check the Extensions view: many extensions show an **Install in WSL** button. Install (or reinstall) language and tooling extensions there so linting, debugging, and formatters work against your WSL repos.

### Git clients with a UI (e.g. TortoiseGit)

GUI Git tools on Windows can still work with migrated repos. Use File Explorer to reach the repo on the WSL filesystem, then use the client’s usual right-click menu on that folder:

```text
\\wsl.localhost\Ubuntu\root\sv-kubernetes\applications\my-app
```

TortoiseGit and similar tools operate on that path like any other folder Windows can see. You do not need to run them from inside the WSL terminal.

## Update your shortcuts and bookmarks

Update anything that still points at the old `C:\` paths—desktop shortcuts, editor recents, File Explorer bookmarks, team doc links, and so on.

Examples for a repo named `my-app`:

- File Explorer: `\\wsl.localhost\Ubuntu\root\sv-kubernetes\applications\my-app`
- WSL: `/root/sv-kubernetes/applications/my-app`

The sv-kubernetes **install** folder stays at `C:\sv-kubernetes`. Only your **application and container** project folders move.

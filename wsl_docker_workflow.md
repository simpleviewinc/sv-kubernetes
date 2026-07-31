# WSL Docker Workflow (opt-in)

Use this when you want the **Docker variant** (PowerShell `sv` / `cms`) with application and container repos on the **fast WSL Linux filesystem**.

This workflow is **opt-in**. It does not change the default [`docker-compose.yml`](docker-compose.yml), [`scripts/windows_profile.ps1`](scripts/windows_profile.ps1), or [`scripts/windows_init.ps1`](scripts/windows_init.ps1). Legacy users who never run the linker keep their existing behavior.

## What you get

| Piece | Role |
|-------|------|
| [`scripts/link_wsl_in_docker.ps1`](scripts/link_wsl_in_docker.ps1) | One-time installer |
| [`scripts/unlink_wsl_in_docker.ps1`](scripts/unlink_wsl_in_docker.ps1) | Undo installer (profile + hybrid `.env`; filesystem optional) |
| [`scripts/windows_profile_wsl_docker.ps1`](scripts/windows_profile_wsl_docker.ps1) | Profile that loads the legacy profile, then uses a Compose override |
| [`docker-compose.wsl.yml`](docker-compose.wsl.yml) | Binds `SV_KUBERNETES_MOUNT_PATH` → `/sv-wsl` inside the CLI |
| Existing [`scripts/migrate_wsl.sh`](scripts/migrate_wsl.sh) | Copies repos into WSL when `.wsl_migrated` is missing |

After linking:

- **Edit** apps/containers with Cursor/VS Code **WSL Remote** under `/root/sv-kubernetes`.
- **Run** `sv` / `cms` from **Windows PowerShell** (not `wsl -u root` for day-to-day `sv`).
- Inside the CLI: `/sv` is tooling on `C:`; `/sv-wsl` is the WSL copy of applications and containers.

## Prerequisites

1. Complete the normal [Windows installation](install_windows.md) (WSL, Docker Desktop with Kubernetes, `windows_init.ps1`).
2. Docker Desktop shows **Engine Running** and **Kubernetes Running**.
3. You can enter WSL: `wsl -u root`.
4. (Run as administrator) PowerShell window — the linker creates a profile symlink the same way `windows_init.ps1` does.

## One-time setup

From PowerShell (as Admin):

```powershell
powershell C:\sv-kubernetes\scripts\link_wsl_in_docker.ps1
```

The linker:

1. Ensures the migration cloud-init template is in place (`windows_prepare_migration.ps1`).
2. If `.wsl_migrated` is **missing**, runs `bash /sv/scripts/migrate_wsl.sh` inside WSL (may ask to copy repos; that can take a long time).
3. If `.wsl_migrated` is **present**, skips migration and continues with `.env` + profile setup.
4. Writes workflow `.env` values (`APPS_FOLDER`, `CONTAINERS_FOLDER`, `SV_KUBERNETES_MOUNT_PATH`, `IS_DOCKER_DESKTOP`, `WSL_DISTRO_NAME`).
5. Symlinks your PowerShell profile to `windows_profile_wsl_docker.ps1` (same pattern as `windows_init.ps1`).

Then:

```powershell
# If you just migrated:
wsl --shutdown
# Start Docker Desktop and wait for Engine + Kubernetes

# New PowerShell window, then:
sv-kube-stop
sv-kube-run
sv debug
```

Recreating the CLI (`sv-kube-stop` / `sv-kube-run`) is required so Compose applies [`docker-compose.wsl.yml`](docker-compose.wsl.yml) and mounts `/sv-wsl`. A new PowerShell window is required so `$PROFILE` loads the WSL Docker overrides.

Expect something like:

- `APPS_FOLDER=/sv-wsl/applications`
- `SV_KUBERNETES_MOUNT_PATH=/run/desktop/mnt/host/wsl/sv-kubernetes`

Confirm the WSL bind:

```powershell
sv-kube-enter
ls /sv-wsl/applications
exit
```

## Day-to-day

| Task | Where |
|------|--------|
| `sv start` / `sv install` / `sv logs` / `cms …` | Windows **PowerShell** |
| Edit application / container source | Cursor/VS Code **WSL Remote** → `/root/sv-kubernetes/...` |
| Edit `sv-kubernetes` tooling / `.env` | `C:\sv-kubernetes` |

App aliases such as `cms` are registered by trusted local code in `windows_profile_wsl_docker.ps1` when `.wsl_migrated` exists or `cms-kube` is present under `C:\sv-kubernetes\applications`. You do not need to change PowerShell execution policy, sign scripts, or run `Unblock-File` on WSL paths.

## Paths

Do not treat these as canonical after migration:

- `C:\sv-kubernetes\applications`
- `C:\sv-kubernetes\containers`

`C:\sv-kubernetes` itself stays as the tooling install.

Useful locations:

- File Explorer: `\\wsl.localhost\Ubuntu\root\sv-kubernetes\applications` (replace `Ubuntu` with `WSL_DISTRO_NAME` from `.env`)
- WSL / IDE: `/root/sv-kubernetes/applications`
- Docker CLI: `/sv-wsl/applications`

## Rollback (unlink)

Opt-in changes are **two layers**. Unlink restores the Docker/profile layer by default; WSL filesystem migration is separate.

### 1. Undo the WSL Docker workflow (recommended)

From an elevated PowerShell:

```powershell
powershell C:\sv-kubernetes\scripts\unlink_wsl_in_docker.ps1
```

This:

1. Symlinks `$PROFILE` back to `windows_profile.ps1`.
2. Restores `.env` from `internal\.env_wsl` when hybrid WSL Docker values are detected.
3. Does **not** run filesystem rollback by default (`.wsl_migrated` and WSL repos stay until you undo them below).

Useful switches:

- `-ProfileOnly` — restore `$PROFILE` only; leave `.env` alone.
- `-WithFilesystemRollback` — also run `rollback_wsl.sh` in WSL when `.wsl_migrated` exists.

Then open a **new** PowerShell window and recreate the CLI:

```powershell
sv-kube-stop
sv-kube-run
sv debug
```

Expect `SV_KUBERNETES_MOUNT_PATH` under `/run/desktop/mnt/host/c/sv-kubernetes`. The Compose override file stays in the repo but is unused once the legacy profile loads.

### 2. Undo the WSL filesystem migration (separate)

If you still have `.wsl_migrated` and want apps/containers back under `C:\sv-kubernetes`:

```bash
wsl -u root
bash /sv/scripts/rollback_wsl.sh
exit
```

Or in one step with unlink:

```powershell
powershell C:\sv-kubernetes\scripts\unlink_wsl_in_docker.ps1 -WithFilesystemRollback
```

Then recreate the CLI again (`sv-kube-stop` / `sv-kube-run`).

## Troubleshooting

### `ls /sv-wsl` missing inside the CLI

Constants can look correct (from `.env`) while Compose never mounted `/sv-wsl`. Confirm a **new** PowerShell window prints `WSL Docker workflow` on startup, then recreate the CLI (`sv-kube-stop` / `sv-kube-run`).

If recreate fails or `/sv-wsl` is still missing, the host bind may be absent. From WSL as root:

```bash
ln -sfn /mnt/c/sv-kubernetes /sv
bash /sv/scripts/migrate_wsl.sh --force
```

Then `wsl --shutdown`, start Docker Desktop, and `sv-kube-stop` / `sv-kube-run` again.

### `sv debug` still shows the C: mount path

Compose caches env at container create time. Recreate:

```powershell
sv-kube-stop
sv-kube-run
sv debug
```

### PowerShell says `install_aliases.ps1` is not digitally signed

You should not be loading app scripts from `\\wsl.localhost\...`. Confirm `$PROFILE` loads `windows_profile_wsl_docker.ps1`, open a new PowerShell window, and retry `cms help`.

### CrashLoopBackOff after migration

Scripts copied from Windows may lack the executable bit. Fix in WSL, restart from PowerShell:

```powershell
sv stop cms-kube
# In WSL:
# chmod +x /root/sv-kubernetes/applications/cms-kube/containers/cli/docker-entrypoint.sh
sv start cms-kube local
```

See also [migrate_into_wsl.md](migrate_into_wsl.md) for the shared migration/rollback details.

## Manual verification (unlink)

| Scenario | Expected |
|----------|----------|
| After unlink | `$PROFILE` is a symlink to `windows_profile.ps1`; hybrid `.env` restored from `internal\.env_wsl` |
| `-ProfileOnly` | Profile restored; `.env` unchanged |
| `-WithFilesystemRollback` with `.wsl_migrated` | Delegates to `rollback_wsl.sh` in WSL after profile/env steps |
| After unlink + `sv-kube-stop` / `sv-kube-run` | Legacy profile uses base `docker-compose.yml` only (no `/sv-wsl` bind) |

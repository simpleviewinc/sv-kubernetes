#Requires -RunAsAdministrator
# Reverses the opt-in WSL Docker linker (PowerShell profile + hybrid .env).
# Does not modify windows_profile.ps1, docker-compose.yml, migrate_wsl.sh, or
# rollback_wsl.sh. Does not delete docker-compose.wsl.yml (unused once profile
# is legacy). Filesystem rollback is optional; default leaves .wsl_migrated alone.

param(
	[switch]$ProfileOnly,
	[switch]$WithFilesystemRollback
)

$ErrorActionPreference = "Stop"

$svKubernetesPath = "C:\sv-kubernetes"
$legacyProfile = Join-Path $svKubernetesPath "scripts\windows_profile.ps1"
$migratedMarker = Join-Path $svKubernetesPath ".wsl_migrated"
$envFile = Join-Path $svKubernetesPath ".env"
$envWslTemplate = Join-Path $svKubernetesPath "internal\.env_wsl"

Write-Output "Unlinking WSL Docker workflow (profile + optional .env)"

if (-Not (Test-Path -LiteralPath $svKubernetesPath)) {
	throw "Expected sv-kubernetes at $svKubernetesPath"
}
if (-Not (Test-Path -LiteralPath $legacyProfile)) {
	throw "Missing $legacyProfile"
}

Write-Output "Pointing PowerShell profile at legacy windows_profile.ps1"
$psProfileDir = Split-Path -Parent $PROFILE
New-Item -ItemType Directory -Force -Path $psProfileDir | Out-Null
New-Item -ItemType SymbolicLink -Path $PROFILE -Target $legacyProfile -Force | Out-Null

if ($ProfileOnly) {
	Write-Output "Skipping .env restore (-ProfileOnly)"
} else {
	$restoreEnv = $false
	if (Test-Path -LiteralPath $migratedMarker) {
		$restoreEnv = $true
	} elseif (Test-Path -LiteralPath $envFile) {
		$content = Get-Content -LiteralPath $envFile -Raw -ErrorAction SilentlyContinue
		if ($content -and (
			$content -match '(?m)^\s*APPS_FOLDER\s*=\s*/sv-wsl' -or
			$content -match '(?m)^\s*SV_KUBERNETES_MOUNT_PATH\s*=\s*.*wsl/sv-kubernetes'
		)) {
			$restoreEnv = $true
		}
	}

	if ($restoreEnv) {
		if (-Not (Test-Path -LiteralPath $envWslTemplate)) {
			throw "Missing template $envWslTemplate"
		}
		Copy-Item -LiteralPath $envWslTemplate -Destination $envFile -Force
		Write-Output "Restored .env from internal\.env_wsl"
		if (Test-Path -LiteralPath $migratedMarker) {
			Write-Warning ".wsl_migrated still exists. Application/container repos may still live under WSL. Run bash /sv/scripts/rollback_wsl.sh from WSL, or re-run this script with -WithFilesystemRollback."
		}
	} else {
		Write-Output ".env does not look like the hybrid WSL Docker workflow; leaving it unchanged"
	}
}

if ($WithFilesystemRollback) {
	if (-Not (Test-Path -LiteralPath $migratedMarker)) {
		Write-Output "No .wsl_migrated marker; skipping filesystem rollback"
	} elseif (-Not (Get-Command wsl -ErrorAction SilentlyContinue)) {
		throw "WSL is required for -WithFilesystemRollback"
	} else {
		Write-Output "Running rollback_wsl.sh inside WSL (may prompt to copy repos)..."
		wsl -u root -- bash -lc 'ln -sfn /mnt/c/sv-kubernetes /sv && bash /sv/scripts/rollback_wsl.sh'
		if ($LASTEXITCODE -ne 0) {
			throw "rollback_wsl.sh failed with exit code $LASTEXITCODE"
		}
	}
}

Write-Output ""
Write-Output "WSL Docker workflow unlinked."
Write-Output "Next steps:"
Write-Output "  1. Open a NEW PowerShell window so the restored profile loads"
Write-Output "  2. Recreate the CLI (base docker-compose.yml only):"
Write-Output "       sv-kube-stop"
Write-Output "       sv-kube-run"
Write-Output "       sv debug"
Write-Output "  3. Expect SV_KUBERNETES_MOUNT_PATH under /run/desktop/mnt/host/c/sv-kubernetes"
if ((Test-Path -LiteralPath $migratedMarker) -and (-Not $WithFilesystemRollback)) {
	Write-Output "  4. To undo the WSL filesystem migration as well:"
	Write-Output "       wsl -u root -- bash -lc 'ln -sfn /mnt/c/sv-kubernetes /sv && bash /sv/scripts/rollback_wsl.sh'"
	Write-Output "     or re-run: powershell C:\sv-kubernetes\scripts\unlink_wsl_in_docker.ps1 -WithFilesystemRollback"
}
Write-Output ""
Write-Output "See wsl_docker_workflow.md for details."

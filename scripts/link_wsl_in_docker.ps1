#Requires -RunAsAdministrator
# One-time installer for the opt-in WSL-backed Docker workflow.
# Does not modify windows_profile.ps1, windows_init.ps1, docker-compose.yml,
# migrate_wsl.sh, or rollback_wsl.sh.

$ErrorActionPreference = "Stop"

$svKubernetesPath = "C:\sv-kubernetes"
$wslDockerProfile = Join-Path $svKubernetesPath "scripts\windows_profile_wsl_docker.ps1"
$wslCompose = Join-Path $svKubernetesPath "docker-compose.wsl.yml"
$migratedMarker = Join-Path $svKubernetesPath ".wsl_migrated"
$envFile = Join-Path $svKubernetesPath ".env"
$prepareMigration = Join-Path $svKubernetesPath "scripts\windows_prepare_migration.ps1"

function Set-EnvFileValue {
	param([string]$Key, [string]$Value)

	if (-Not (Test-Path -LiteralPath $envFile)) {
		New-Item -ItemType File -Path $envFile -Force | Out-Null
	}

	$escapedKey = [regex]::Escape($Key)
	$content = @(Get-Content -LiteralPath $envFile -ErrorAction SilentlyContinue)
	$updated = $false
	$newContent = foreach ($line in $content) {
		if ($line -match ("^\s*" + $escapedKey + "\s*=")) {
			$updated = $true
			"$Key=$Value"
		} else {
			$line
		}
	}
	if (-Not $updated) {
		$newContent += "$Key=$Value"
	}
	Set-Content -LiteralPath $envFile -Value $newContent -Encoding ascii
}

Write-Output "Linking WSL filesystem into the Docker CLI workflow"

if (-Not (Test-Path -LiteralPath $svKubernetesPath)) {
	throw "Expected sv-kubernetes at $svKubernetesPath"
}
if (-Not (Test-Path -LiteralPath $wslDockerProfile)) {
	throw "Missing $wslDockerProfile"
}
if (-Not (Test-Path -LiteralPath $wslCompose)) {
	throw "Missing $wslCompose"
}
if (-Not (Get-Command wsl -ErrorAction SilentlyContinue)) {
	throw "WSL is required. Install/configure WSL first (see install_windows.md)."
}
if (-Not (Get-Command docker -ErrorAction SilentlyContinue)) {
	throw "Docker is required. Install Docker Desktop and ensure it is on PATH."
}

$ErrorActionPreference = "SilentlyContinue"
docker info *>$null
$dockerOk = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = "Stop"
if (-Not $dockerOk) {
	throw "Docker Desktop does not appear to be running. Start it (Engine + Kubernetes Running) and retry."
}

if (Test-Path -LiteralPath $prepareMigration) {
	Write-Output "Preparing WSL migration cloud-init config"
	& powershell -NoProfile -ExecutionPolicy Bypass -File $prepareMigration
}

if (-Not (Test-Path -LiteralPath $migratedMarker)) {
	Write-Output "No .wsl_migrated marker found. Running migrate_wsl.sh inside WSL..."
	Write-Output "This may prompt to copy application/container repos (can take a long time)."
	wsl -u root -- bash -lc 'ln -sfn /mnt/c/sv-kubernetes /sv && bash /sv/scripts/migrate_wsl.sh'
	if ($LASTEXITCODE -ne 0) {
		throw "migrate_wsl.sh failed with exit code $LASTEXITCODE"
	}
	if (-Not (Test-Path -LiteralPath $migratedMarker)) {
		throw "Migration finished but .wsl_migrated was not created. Check WSL output and retry."
	}
} else {
	Write-Output "Found .wsl_migrated; skipping migration"
}

$distroName = (wsl -u root -- printenv WSL_DISTRO_NAME 2>$null | Out-String).Trim()
if ([string]::IsNullOrWhiteSpace($distroName)) {
	$distroName = "Ubuntu"
}
Write-Output "Using WSL distro: $distroName"

Set-EnvFileValue -Key "WSL_DISTRO_NAME" -Value $distroName
Set-EnvFileValue -Key "IS_DOCKER_DESKTOP" -Value "true"
Set-EnvFileValue -Key "APPS_FOLDER" -Value "/sv-wsl/applications"
Set-EnvFileValue -Key "CONTAINERS_FOLDER" -Value "/sv-wsl/containers"
Set-EnvFileValue -Key "SV_KUBERNETES_MOUNT_PATH" -Value "/run/desktop/mnt/host/wsl/sv-kubernetes"

Write-Output "Pointing PowerShell profile at WSL Docker workflow"
$psProfileDir = Split-Path -Parent $PROFILE
New-Item -ItemType Directory -Force -Path $psProfileDir | Out-Null
New-Item -ItemType SymbolicLink -Path $PROFILE -Target $wslDockerProfile -Force | Out-Null

Write-Output ""
Write-Output "WSL Docker workflow linked."
Write-Output "Next steps:"
Write-Output "  1. Open a NEW PowerShell window so the updated profile loads"
Write-Output "  2. If you just migrated: wsl --shutdown, then start Docker Desktop"
Write-Output "  3. Recreate the CLI so it picks up .env + the WSL compose override:"
Write-Output "       sv-kube-stop"
Write-Output "       sv-kube-run"
Write-Output "       sv debug"
Write-Output "  4. Expect APPS_FOLDER=/sv-wsl/applications and SV_KUBERNETES_MOUNT_PATH under /run/desktop/mnt/host/wsl/"
Write-Output ""
Write-Output "See wsl_docker_workflow.md for day-to-day usage and rollback (unlink_wsl_in_docker.ps1)."

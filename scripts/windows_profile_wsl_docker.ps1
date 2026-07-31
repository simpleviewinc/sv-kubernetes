# Opt-in WSL-backed Docker workflow profile.
# Loads the legacy Windows profile, then overrides compose invocations to include
# docker-compose.wsl.yml and registers the cms alias without loading scripts from WSL UNC paths.

$svKubernetesPath = "C:\sv-kubernetes"
. (Join-Path $svKubernetesPath "scripts\windows_profile.ps1")

function Get-SvKubernetesComposeFileArgs {
	return @(
		"--project-directory", $svKubernetesPath,
		"-f", (Join-Path $svKubernetesPath "docker-compose.yml"),
		"-f", (Join-Path $svKubernetesPath "docker-compose.wsl.yml")
	)
}

function SvKubernetesContainerExists {
	$composeArgs = Get-SvKubernetesComposeFileArgs
	$containerExists = docker compose @composeArgs ps --services | Where-Object { $_ -eq 'cli' }
	return $containerExists
}

function DockerExecSvKubernetesSv {
	if (-Not (SvKubernetesContainerExists)) {
		DockerRunSvKubernetes
	}

	$composeArgs = Get-SvKubernetesComposeFileArgs
	docker compose @composeArgs exec cli sv $args
}

function DockerEnterSvKubernetes {
	if (-Not (SvKubernetesContainerExists)) {
		DockerRunSvKubernetes
	}

	$composeArgs = Get-SvKubernetesComposeFileArgs
	docker compose @composeArgs exec cli bash
}

function DockerRunSvKubernetes {
	Write-Output "Building sv-kubernetes:local image (WSL Docker workflow)"
	$composeArgs = Get-SvKubernetesComposeFileArgs
	docker compose @composeArgs build cli

	Write-Output "Running sv-kubernetes container (WSL Docker workflow)"
	docker compose @composeArgs up -d cli
}

function DockerStopSvKubernetes {
	$composeArgs = Get-SvKubernetesComposeFileArgs
	docker compose @composeArgs down
}

Set-Alias -Name sv -Value DockerExecSvKubernetesSv -Force -Scope Global -Option allScope
Set-Alias -Name sv-kube-run -Value DockerRunSvKubernetes -Force -Scope Global -Option allScope
Set-Alias -Name sv-kube-stop -Value DockerStopSvKubernetes -Force -Scope Global -Option allScope
Set-Alias -Name sv-kube-enter -Value DockerEnterSvKubernetes -Force -Scope Global -Option allScope

# Register cms locally — do not dot-source install_aliases.ps1 over \\wsl.localhost UNC paths.
function CmsLocalCli {
	DockerExecSvKubernetesSv script cms-kube cms_cli.sh $args
}

$cmsLocal = Join-Path $svKubernetesPath "applications\cms-kube"
$migrated = Test-Path -LiteralPath (Join-Path $svKubernetesPath ".wsl_migrated")
if ($migrated -or (Test-Path -LiteralPath $cmsLocal)) {
	Write-Output "Setting-up CMS Kube aliases (WSL Docker workflow)"
	Set-Alias -Name cms -Value CmsLocalCli -Force -Scope Global -Option allScope
}

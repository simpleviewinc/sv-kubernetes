$svKubernetesPath = "C:\sv-kubernetes"

function SvKubernetesContainerExists {
	$containerExists = docker compose --project-directory $svKubernetesPath ps --services | Where-Object { $_ -eq 'cli' }
	return $containerExists
}

function DockerExecSvKubernetesSv {
	if (-Not (SvKubernetesContainerExists)) {
		DockerRunSvKubernetes
	}

	docker compose --project-directory $svKubernetesPath exec cli sv $args
}

function DockerEnterSvKubernetes {
	if (-Not (SvKubernetesContainerExists)) {
		DockerRunSvKubernetes
	}

	docker compose --project-directory $svKubernetesPath exec cli bash
}

function DockerRunSvKubernetes {
	Write-Output "Building sv-kubernetes:local image"
	docker compose --project-directory $svKubernetesPath build cli

	Write-Output "Running sv-kubernetes container"
	docker compose --project-directory $svKubernetesPath up -d cli
}

function DockerStopSvKubernetes {
	docker compose --project-directory $svKubernetesPath down
}

Write-Output "Setting-up SV Kubernetes aliases"
Set-Alias -Name sv -Value DockerExecSvKubernetesSv -Force -Scope Global -Option allScope
Set-Alias -Name sv-kube-run -Value DockerRunSvKubernetes -Force -Scope Global -Option allScope
Set-Alias -Name sv-kube-stop -Value DockerStopSvKubernetes -Force -Scope Global -Option allScope
Set-Alias -Name sv-kube-enter -Value DockerEnterSvKubernetes -Force -Scope Global -Option allScope

# Import the Chocolatey Profile that contains the necessary code to enable
# tab-completions to function for `choco`.
# Be aware that if you are missing these lines from your profile, tab completion
# for `choco` will not function.
# See https://ch0.co/tab-completion for details.
$ChocolateyProfile = "$env:ChocolateyInstall\helpers\chocolateyProfile.psm1"
if (Test-Path($ChocolateyProfile)) {
  Import-Module "$ChocolateyProfile"
}

# Load app-defined aliases
$BaseRoot = 'C:\sv-kubernetes\applications'
$TargetFileName = 'install_aliases.ps1'

$appDirectories = Get-ChildItem -LiteralPath $BaseRoot -Directory -ErrorAction SilentlyContinue |
    ForEach-Object {
        $scriptsDir = Join-Path $_.FullName 'scripts'
        if (Test-Path -LiteralPath $scriptsDir) {
            Get-ChildItem -LiteralPath $scriptsDir -Filter $TargetFileName -File -ErrorAction SilentlyContinue
        }
    } |
    Sort-Object -Property FullName -Unique

foreach ($file in $appDirectories) {
	Write-Output "Loading user profile script $($file.FullName) ..."
    . $file.FullName
}

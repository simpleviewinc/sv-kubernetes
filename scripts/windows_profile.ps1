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
	docker compose --project-directory $svKubernetesPath up -d
}

function DockerStopSvKubernetes {
	docker compose --project-directory $svKubernetesPath down
}

Write-Output "Setting-up SV Kubernetes aliases"
Set-Alias -Name sv -Value DockerExecSvKubernetesSv -Force -Scope Global -Option allScope
Set-Alias -Name sv-kube-run -Value DockerRunSvKubernetes -Force -Scope Global -Option allScope
Set-Alias -Name sv-kube-stop -Value DockerStopSvKubernetes -Force -Scope Global -Option allScope
Set-Alias -Name sv-kube-enter -Value DockerEnterSvKubernetes -Force -Scope Global -Option allScope

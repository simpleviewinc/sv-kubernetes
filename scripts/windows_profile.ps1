$svKubernetesPath = "C:\sv-kubernetes"
$svKubernetesImage = "sv-kubernetes:local"
$svKubernetesContainer = "sv-kubernetes"

function SvKubernetesContainerExists {
	$containerExists = docker ps -a --format "{{.Names}}" | Where-Object { $_ -eq $svKubernetesContainer }
	return $containerExists
}

function DockerExecSvKubernetesSv {
	if (-Not (SvKubernetesContainerExists)) {
		DockerRunSvKubernetes
	}

	docker exec -it sv-kubernetes sv $args
}

function DockerEnterSvKubernetes {
	if (-Not (SvKubernetesContainerExists)) {
		DockerRunSvKubernetes
	}

	docker exec -it sv-kubernetes bash
}

function DockerRunSvKubernetes {
	Write-Output "Removing sv-kubernetes container"
	docker rm -f $svKubernetesContainer

	Write-Output "Building sv-kubernetes:local image"
	docker build -t $svKubernetesImage $svKubernetesPath

	Write-Output "Running sv-kubernetes container"
	docker run -d `
		--restart always `
		--name $svKubernetesContainer `
		--hostname sv-kube `
		--network host `
		-v ${svKubernetesPath}\internal\gcloud:/root/.config/gcloud `
		-v $Env:UserProfile\.kube\config:/.kube/config `
		-v $Env:UserProfile\.ssh\github_key:/root/.ssh/github_key `
		-v ${svKubernetesPath}:/sv `
		-v "//var/run/docker.sock://var/run/docker.sock" `
		$svKubernetesImage
}

Write-Output "Setting-up SV Kubernetes aliases"
Set-Alias -Name sv -Value DockerExecSvKubernetesSv -Force -Scope Global -Option allScope
Set-Alias -Name sv-kube-run -Value DockerRunSvKubernetes -Force -Scope Global -Option allScope
Set-Alias -Name sv-kube-enter -Value DockerEnterSvKubernetes -Force -Scope Global -Option allScope

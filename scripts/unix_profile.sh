#!/bin/bash
SV_KUBERNETES_PATH=$(realpath $(dirname $(realpath ${BASH_SOURCE[0]}))/..)
ARCH=$(arch | sed s/aarch64/arm64/ | sed s/x86_64/amd64/)

function sv_kubernetes_container_exists {
	docker compose --project-directory ${SV_KUBERNETES_PATH} ps --services | grep -i 'cli'
}

function docker_exec_sv_kubernetes {
	if ! sv_kubernetes_container_exists; then
		docker_run_sv_kubernetes
	fi

	docker compose --project-directory ${SV_KUBERNETES_PATH} exec cli sv $@
}

function docker_enter_sv_kubernetes {
	if ! sv_kubernetes_container_exists; then
		docker_run_sv_kubernetes
	fi

	docker compose --project-directory ${SV_KUBERNETES_PATH} exec cli bash
}

function docker_run_sv_kubernetes {
	echo "Building sv-kubernetes:local image"
	docker compose --project-directory ${SV_KUBERNETES_PATH} build cli

	echo "Running sv-kubernetes container"
	docker compose --project-directory ${SV_KUBERNETES_PATH} up -d
}

function docker_stop_sv_kubernetes {
	docker compose --project-directory ${SV_KUBERNETES_PATH} down
}

echo "Setting-up SV Kubernetes aliases"
alias sv='docker_exec_sv_kubernetes'
alias sv-kube-run='docker_run_sv_kubernetes'
alias sv-kube-stop='docker_stop_sv_kubernetes'
alias sv-kube-enter='docker_enter_sv_kubernetes'

. /sv/scripts/errorHandler.sh
. /sv/scripts/platform_lookup.sh
. /sv/scripts/variables.sh
. /sv/scripts/requireRoot.sh

# Minikube does not start properly on ARM64 when we specify --kubernetes-version
kubernetes_version=
if [[ "${PLATFORM}" != "arm64" ]]; then
    kubernetes_version="--kubernetes-version=$kubectl_version"
fi

# the singular command to start minikube, this is executed by the custom minikube service
minikube start \
	--force \
	--driver=docker \
	--container-runtime="docker" \
	--extra-config=apiserver.service-node-port-range=80-32767 \
	${kubernetes_version} \
	--static-ip="$minikube_ip" \
	--mount \
	--mount-string="/sv:/sv" \
	--memory="$(node /sv/internal/getMinikubeMem.js)" \
	--ports="443:443" \
	--ports="80:80" \
	--ports="12002:12002"

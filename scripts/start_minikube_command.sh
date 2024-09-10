. /sv/scripts/errorHandler.sh
. /sv/scripts/variables.sh
. /sv/scripts/requireRoot.sh

# For ARM64 platform: wait for SMB folder to be fully mounted (see AUT-2327)
if [[ "${PLATFORM}" == "arm64" ]]; then
	echo -n "Waiting for SMB folder to be mounted... "
	until [ -n "$(mount | grep '/sv-kubernetes on /sv type cifs')" ]; do
		sleep 5
	done
	echo "OK"
fi

# the singular command to start minikube, this is executed by the custom minikube service
minikube start \
	--force \
	--driver=docker \
	--container-runtime="docker" \
	--extra-config=apiserver.service-node-port-range=80-32767 \
	--kubernetes-version="$kubectl_version" \
	--static-ip="$minikube_ip" \
	--mount \
	--mount-string="/sv:/sv" \
	--memory="$(node /sv/internal/getMinikubeMem.js)" \
	--ports="443:443" \
	--ports="80:80" \
	--ports="12002:12002" \
	--ports="30000:30000" \
	--ports="30001:30001"

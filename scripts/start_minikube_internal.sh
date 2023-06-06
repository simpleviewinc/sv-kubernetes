. /sv/scripts/errorHandler.sh
. /sv/scripts/variables.sh
. /sv/scripts/requireVagrant.sh

minikube start \
	--driver=docker \
	--extra-config=apiserver.service-node-port-range=80-32767 \
	--kubernetes-version="$kubectl_version" \
	--static-ip="$minikube_ip" \
	--mount \
	--mount-string="/sv:/sv" \
	--memory="$(node /sv/internal/getMinikubeMem.js)" \
	--ports="443:443" \
	--ports="80:80" \
	--ports="12002:12002"
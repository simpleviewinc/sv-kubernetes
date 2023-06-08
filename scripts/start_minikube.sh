. /sv/scripts/errorHandler.sh
. /sv/scripts/variables.sh
. /sv/scripts/requireRoot.sh

running=$(sudo -H -u vagrant minikube ip 2> /dev/null || true)
kubernetes_expected="Server Version: $kubectl_version"
kubernetes_running=$(kubectl version -o json | jq .serverVersion.gitVersion || true)
minikube_start="false"

if [ "$running" != "$minikube_ip" ]; then
	# not running start it up
	minikube_start="true"
elif [ "$kubernetes_running" != "$kubernetes_expected" ]; then
	echo "Running Applications:"
	helm list
	echo ""
	echo "Your minikube is out of date and needs to be updated. You will need to restart all running apps once it's complete"
	read -p "[Enter] to continue, type no to skip: " continue

	if [ "$continue" != "no" ]; then
		# user has approved the restart, clear out their existing minikube
		minikube_start="true"

		. /sv/scripts/delete_minikube.sh
	fi
fi

if [ "$minikube_start" == "true" ]; then
	# often users end up with root owned files in their /home/vagrant folder and this bombs minikube start
	rm -rf /home/vagrant/.minikube
	sudo -H -u vagrant minikube start \
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
fi

# adds coredns so that external dns entries finish quickly
kubectl apply -f /sv/internal/coredns_config.yaml

. /sv/scripts/start_helm.sh

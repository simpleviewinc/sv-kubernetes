. /sv/scripts/errorHandler.sh

running=$(minikube ip 2> /dev/null || true)
running_expected="10.0.2.15"
kubernetes_version="v1.26.5"
kubernetes_expected="Server Version: $kubernetes_version"
kubernetes_running=$(kubectl version --short | grep "Server Version" || true)
minikube_start="false"

if [ "$running" != "$running_expected" ]; then
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

		. /sv/scripts/stop_minikube.sh
	fi
fi

if [ "$minikube_start" == "true" ]; then
	minikube start \
		--driver=docker \
		--extra-config=apiserver.service-node-port-range=80-32767 \
		--kubernetes-version="$kubernetes_version" \
		--memory=2200mb \
		--cpus 2

	# adds coredns so that external dns entries finish quickly
	kubectl apply -f /sv/internal/coredns_config.yaml

	# systemctl enable kubelet.service
fi

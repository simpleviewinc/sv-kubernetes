. /sv/scripts/errorHandler.sh
. /sv/scripts/variables.sh
. /sv/scripts/requireRoot.sh

running=$(minikube ip 2> /dev/null || true)
kubernetes_expected="$kubectl_version"
kubernetes_running=$(kubectl version -o json | jq -r .serverVersion.gitVersion || true)
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
	. /sv/scripts/start_minikube_command.sh
fi

# adds coredns so that external dns entries finish quickly
kubectl apply -f /sv/internal/coredns_config.yaml

. /sv/scripts/start_helm.sh

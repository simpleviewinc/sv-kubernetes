if [ `whoami` != "root" ]; then
	echo "Script must be executed as root"
	exit 1
fi

. /sv/scripts/errorHandler.sh

. /sv/scripts/install_dnsmasq.sh
. /sv/scripts/install_github.sh
. /sv/scripts/install_sv.sh
. /sv/scripts/install_minikube.sh
. /sv/scripts/install_kubectl.sh
. /sv/scripts/install_docker.sh
. /sv/scripts/install_helm.sh

. /sv/scripts/start_minikube.sh
. /sv/scripts/start_helm.sh

coredns=$(minikube addons list | grep "coredns: disabled" || echo "enabled")
if [ "$coredns" == "enabled" ]; then
	minikube addons disable coredns || true
fi

kubedns=$(minikube addons list | grep "kube-dns: disabled" || echo "enabled")
if [ "$kubedns" != "enabled" ]; then
	minikube addons enable kube-dns
fi

# authorize local kubernetes to pull from remote GCR
gcr_pull=$(kubectl get secrets gcr-pull 2> /dev/null || echo "missing")
if [ "$gcr_pull" == "missing" ]; then
	kubectl create -f /sv/internal/gcrPullSecret.yaml
fi

# build server config
sv _buildSvInfo
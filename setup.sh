if [ `whoami` != "root" ]; then
	echo "Script must be executed as root"
	exit 1
fi

. /sv/scripts/errorHandler.sh

. /sv/scripts/install_dnsmasq.sh
. /sv/scripts/install_github.sh
. /sv/scripts/install_sv.sh
. /sv/scripts/install_minikube.sh
. /sv/scripts/install_gcloud.sh
. /sv/scripts/install_kubectl.sh
. /sv/scripts/install_docker.sh
. /sv/scripts/install_helm.sh
. /sv/scripts/install_kubesec.sh

. /sv/scripts/start_minikube.sh
. /sv/scripts/start_helm.sh

. /sv/scripts/install_kube_dns_addon.sh

coredns=$(minikube addons list | grep "coredns: enabled" || echo "not_installed")
if [ "$coredns" != "not_installed" ]; then
	minikube addons disable coredns || true
fi

kubedns=$(minikube addons list | grep "kube-dns: disabled" || echo "enabled")
if [ "$kubedns" != "enabled" ]; then
	minikube addons enable kube-dns
fi

# remove the coredns deployment if it was installed as a chart rather an addon
coredns_chart=$(kubectl get all --all-namespaces | grep "coredns" || echo "installed")
if [ "$coredns_chart" == "installed" ]; then
	kubectl delete deployment.apps/coredns -n kube-system
	kubectl delete cm coredns -n kube-system
fi

# authorize local kubernetes to pull from remote GCR
gcr_pull=$(kubectl get secrets gcr-pull 2> /dev/null || echo "missing")
if [ "$gcr_pull" == "missing" ]; then
	kubectl create -f /sv/internal/gcrPullSecret.yaml
fi

gcloud auth application-default login

# build server config
sv _buildSvInfo
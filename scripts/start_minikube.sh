. /sv/scripts/errorHandler.sh

running=$(minikube ip 2> /dev/null || true)
running_expected="10.0.2.15"
kubernetes_version="v1.13.7"

if [ "$running" != "$running_expected" ]; then
	minikube start --vm-driver=none --extra-config=apiserver.service-node-port-range=80-32767 --kubernetes-version="$kubernetes_version" --cpus 2
	
	# start any systems that need to be booted up after minikube starts
	. /sv/scripts/start_helm.sh
fi

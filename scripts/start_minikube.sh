. /sv/scripts/errorHandler.sh

running=$(minikube ip 2> /dev/null || true)
running_expected="10.0.2.15"
kubernetes_version="v1.13.7"

if [ "$running" != "$running_expected" ]; then
	minikube start --vm-driver=none --extra-config=apiserver.service-node-port-range=80-32767 --kubernetes-version="$kubernetes_version" --cpus=2
	# configMap changes are lost everytime minikube stops - must reapply with every start
	kubectl apply -f /sv/internal/kube-dns.yaml
fi

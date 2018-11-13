. /sv/scripts/errorHandler.sh

running=$(minikube ip 2> /dev/null || true)
running_expected="10.0.2.15"

if [ "$running" != "$running_expected" ]; then
	minikube start --vm-driver=none --extra-config=apiserver.service-node-port-range=80-32767
fi

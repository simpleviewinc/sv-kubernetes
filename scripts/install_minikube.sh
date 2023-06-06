. /sv/scripts/errorHandler.sh

# minikube_version="v1.30.1" # previous v1.13.0
current_minikube_version=$(minikube version 2> /dev/null || true)
minikube_version_expected="minikube version: $minikube_version"

if [ "$current_minikube_version" != "$minikube_version_expected" ]; then
	apt-get update
	apt-get install -y curl socat conntrack

	cd /tmp
	curl -Lo minikube https://storage.googleapis.com/minikube/releases/$minikube_version/minikube-linux-amd64
	chmod +x minikube
	mv minikube /usr/bin/
fi

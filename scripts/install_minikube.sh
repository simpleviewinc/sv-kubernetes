minikube_version=$(minikube version 2> /dev/null || true)
minikube_version_expected="minikube version: v0.30.0"

if [ "$minikube_version" != "$minikube_version_expected" ]; then
	apt-get update
	apt-get install -y curl socat

	cd /tmp
	curl -Lo minikube https://storage.googleapis.com/minikube/releases/v0.30.0/minikube-linux-amd64
	chmod +x minikube
	mv minikube /usr/bin/
fi

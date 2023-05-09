. /sv/scripts/errorHandler.sh

kubectl_version="v1.27.1" # previous version v1.21.14
current_kubectl_version=$(kubectl version --client --short 2> /dev/null || true)
kubectl_version_expected=$"Client Version: $kubectl_version"

if [ "$current_kubectl_version" != "$kubectl_version_expected" ]; then
	apt-get update
	apt-get install -y curl

	cd /tmp
	curl -Lo kubectl https://storage.googleapis.com/kubernetes-release/release/$kubectl_version/bin/linux/amd64/kubectl
	chmod +x kubectl
	mv kubectl /usr/bin/
fi

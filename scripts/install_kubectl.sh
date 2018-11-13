. /sv/scripts/errorHandler.sh

kubectl_version=$(kubectl version --client --short 2> /dev/null || true)
kubectl_version_expected=$"Client Version: v1.11.0"

if [ "$kubectl_version" != "$kubectl_version_expected" ]; then
	apt-get update
	apt-get install -y curl
	
	cd /tmp
	curl -Lo kubectl https://storage.googleapis.com/kubernetes-release/release/v1.11.0/bin/linux/amd64/kubectl
	chmod +x kubectl
	mv kubectl /usr/bin/
fi

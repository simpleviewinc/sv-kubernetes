. /sv/scripts/errorHandler.sh

helm_version=$(helm version --client --short 2> /dev/null || true)
helm_version_expected="Client: v2.10.0+g9ad53aa"

if [ "$helm_version" != "$helm_version_expected" ]; then
	apt-get update
	apt-get install -y curl

	cd /tmp
	curl -Lo helm.tar.gz https://storage.googleapis.com/kubernetes-helm/helm-v2.10.0-linux-amd64.tar.gz
	tar -zxvf helm.tar.gz
	rm helm.tar.gz
	mv linux-amd64/helm /usr/bin/helm
	rm -rf linux-amd64
fi

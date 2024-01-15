. /sv/scripts/errorHandler.sh
. /sv/scripts/variables.sh

helm_version=$(helm version --client --short 2> /dev/null || true)
helm_version_expected="Client: v2.17.0+ga690bad"

if [ "$helm_version" != "$helm_version_expected" ]; then
	apt-get update
	apt-get install -y curl

	cd /tmp
	curl -Lo helm.tar.gz https://get.helm.sh/helm-v2.17.0-linux-${PLATFORM}.tar.gz
	tar -zxvf helm.tar.gz
	rm helm.tar.gz
	mv linux-${PLATFORM}/helm /usr/bin/helm
	rm -rf linux-${PLATFORM}
fi

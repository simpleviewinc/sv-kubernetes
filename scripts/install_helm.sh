. /sv/scripts/errorHandler.sh
. /sv/scripts/variables.sh

helm_version_current=$(helm version --client --short 2> /dev/null || true)

if ! [[ "$helm_version_current" =~ $helm_version ]]; then
	apt-get update
	apt-get install -y curl

	cd /tmp
	curl -Lo helm.tar.gz https://get.helm.sh/helm-${helm_version}-linux-${PLATFORM}.tar.gz
	tar -zxvf helm.tar.gz
	rm helm.tar.gz
	mv linux-${PLATFORM}/helm /usr/bin/helm
	rm -rf linux-${PLATFORM}
fi

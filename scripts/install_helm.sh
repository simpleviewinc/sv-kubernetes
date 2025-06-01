. /sv/scripts/errorHandler.sh
. /sv/scripts/variables.sh

helm_version_current=$(helm version --template='{{.Version}}' 2> /dev/null || true)

if [[ "$helm_version_current" != $helm_version ]]; then
	apt-get update
	apt-get install -y curl

	cd /tmp
	curl -Lo helm.tar.gz https://get.helm.sh/helm-${helm_version}-linux-${PLATFORM}.tar.gz
	tar -zxvf helm.tar.gz
	rm helm.tar.gz
	mv linux-${PLATFORM}/helm /usr/bin/helm
	rm -rf linux-${PLATFORM}
fi

# AUT-2125 | AUT-2126
# Install 2to3 helm plugin for migration purposes
helm plugin install https://github.com/helm/helm-2to3.git 2> /dev/null || true

# ensure we're on the right repo
helm repo rm stable || true
helm repo add stable https://charts.helm.sh/stable

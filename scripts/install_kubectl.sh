. /sv/scripts/errorHandler.sh
. /sv/scripts/platform_lookup.sh
. /sv/scripts/variables.sh

current_kubectl_version=$(kubectl version --client -o json | jq -r .clientVersion.gitVersion 2> /dev/null || true)

if [ "$current_kubectl_version" != "$kubectl_version" ]; then
	apt-get update
	apt-get install -y curl

	cd /tmp
	curl -Lo kubectl https://storage.googleapis.com/kubernetes-release/release/$kubectl_version/bin/linux/${PLATFORM}/kubectl
	chmod +x kubectl
	mv kubectl /usr/bin/
fi

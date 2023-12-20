. /sv/scripts/errorHandler.sh

helm_plugins=$(helm plugin list | grep tiller || true)

if [ -z "$helm_plugins" ]; then
	helm init --tiller-image=jessestuart/tiller --upgrade --history-max=3

	# install tiller for context switching [AUT-313]
	helm plugin install https://github.com/rimusz/helm-tiller || true
fi

# install the binary necessary to run helm tiller run -- commands
if [ ! -f /root/.helm/plugins/helm-tiller/bin/tiller ]; then
	docker create --name tiller jessestuart/tiller:v2.17.0 /bin/sh
	mkdir -p /root/.helm/plugins/helm-tiller/bin
	docker cp tiller:/tiller /root/.helm/plugins/helm-tiller/bin/
	docker rm -fv tiller
fi

# ensure we're on the right repo
helm repo rm stable || true
helm repo add stable https://charts.helm.sh/stable

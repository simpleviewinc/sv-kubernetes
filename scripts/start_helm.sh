. /sv/scripts/errorHandler.sh

helm init --upgrade --history-max=3

# install tiller for context switching [AUT-313]
helm plugin install https://github.com/rimusz/helm-tiller || true

# install the binary necessary to run helm tiller run -- commands
if [ ! -f /home/vagrant/.helm/plugins/helm-tiller/bin/tiller ]; then
	docker create --name tiller helmpack/tiller:v2.17.0 /bin/sh
	docker cp tiller:/tiller /home/vagrant/.helm/plugins/helm-tiller/bin/
	docker rm -fv tiller
fi

# ensure we're on the right repo
helm repo rm stable || true
helm repo add stable https://charts.helm.sh/stable
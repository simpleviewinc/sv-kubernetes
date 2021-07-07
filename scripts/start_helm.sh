. /sv/scripts/errorHandler.sh

helm init --upgrade --history-max=3

# install tiller for context switching [AUT-313]
helm plugin install https://github.com/rimusz/helm-tiller || true

# ensure we're on the right repo
helm repo rm stable || true
helm repo add stable https://charts.helm.sh/stable
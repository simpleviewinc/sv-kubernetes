. /sv/scripts/errorHandler.sh

helm init --upgrade --history-max=3

# install tiller for context switching [AUT-313]
helm plugin install https://github.com/rimusz/helm-tiller
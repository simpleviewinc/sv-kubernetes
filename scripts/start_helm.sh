. /sv/scripts/errorHandler.sh

# ensure we're on the right repo
helm repo rm stable || true
helm repo add stable https://charts.helm.sh/stable

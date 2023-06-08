. /sv/scripts/errorHandler.sh
. /sv/scripts/requireRoot.sh

. /sv/scripts/install_github.sh

. /sv/scripts/start_minikube.sh

gcloud auth login --update-adc

# build server config
sv _buildSvInfo

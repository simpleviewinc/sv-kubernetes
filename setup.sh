. /sv/scripts/errorHandler.sh
. /sv/scripts/platform_lookup.sh
. /sv/scripts/requireRoot.sh

. /sv/scripts/install_github.sh

. /sv/scripts/start_minikube.sh

gcloud auth login --update-adc

# build server config
sv _buildSvInfo

sv fixDate

if [[ "${PLATFORM}" = "arm64" ]]; then
    # Force delete/init of tiller with an arm64 compatible image
    echo 'Force reload tiller image... '
    sleep 30
    kubectl delete deployment tiller-deploy --namespace kube-system
    helm init --tiller-image=jessestuart/tiller
fi

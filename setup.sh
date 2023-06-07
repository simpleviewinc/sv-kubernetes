. /sv/scripts/errorHandler.sh
. /sv/scripts/requireRoot.sh

apt-get update

bash /sv/scripts/extend_disk.sh

. /sv/scripts/install_misc.sh
. /sv/scripts/install_dnsmasq.sh
. /sv/scripts/install_github.sh
. /sv/scripts/install_go.sh
. /sv/scripts/install_ntp.sh
. /sv/scripts/install_sv.sh
. /sv/scripts/install_minikube.sh
. /sv/scripts/install_gcloud.sh
. /sv/scripts/install_kubectl.sh
. /sv/scripts/install_docker.sh
. /sv/scripts/install_cridockerd.sh
. /sv/scripts/install_helm.sh
. /sv/scripts/install_kubesec.sh
. /sv/scripts/install_crontab.sh

. /sv/scripts/start_minikube.sh

gcloud auth login --update-adc

# build server config
sv _buildSvInfo

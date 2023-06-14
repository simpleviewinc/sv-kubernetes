. /sv/scripts/errorHandler.sh
. /sv/scripts/requireRoot.sh

apt-get update

. /sv/scripts/setup_root.sh
. /sv/scripts/install_misc.sh
. /sv/scripts/install_dnsmasq.sh
. /sv/scripts/install_sv.sh
. /sv/scripts/install_minikube.sh
. /sv/scripts/install_gcloud.sh
. /sv/scripts/install_kubectl.sh
. /sv/scripts/install_docker.sh
. /sv/scripts/install_helm.sh
. /sv/scripts/install_kubesec.sh
. /sv/scripts/install_crontab.sh

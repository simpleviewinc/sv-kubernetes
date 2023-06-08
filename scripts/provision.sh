. /sv/scripts/errorHandler.sh
. /sv/scripts/requireRoot.sh

apt-get update

. /sv/scripts/install_misc.sh
. /sv/scripts/install_dnsmasq.sh
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

# add vagrant to the docker group so it can properly start minikube
usermod -aG docker vagrant

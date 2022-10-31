if [ `whoami` != "root" ]; then
	echo "Script must be executed as root"
	exit 1
fi

. /sv/scripts/errorHandler.sh

apt-get update

bash /sv/scripts/extend_disk.sh

. /sv/scripts/install_dnsmasq.sh
. /sv/scripts/install_github.sh
. /sv/scripts/install_sv.sh
. /sv/scripts/install_minikube.sh
. /sv/scripts/install_gcloud.sh
. /sv/scripts/install_kubectl.sh
. /sv/scripts/install_docker.sh
. /sv/scripts/install_helm.sh
. /sv/scripts/install_kubesec.sh
. /sv/scripts/install_crontab.sh

. /sv/scripts/start_minikube.sh
. /sv/scripts/start_helm.sh

gcloud auth login --update-adc

# build server config
sv _buildSvInfo

if [ `whoami` != "root" ]; then
	echo "Script must be executed as root"
	exit 1
fi

. /scripts/errorHandler.sh

apt-get update

bash /scripts/install_sv.sh

. /scripts/install_misc.sh
#. /scripts/install_dnsmasq.sh
. /scripts/install_github.sh
. /scripts/install_ntp.sh
. /scripts/install_sv.sh
. /scripts/install_minikube.sh
. /scripts/install_gcloud.sh
. /scripts/install_kubectl.sh
. /scripts/install_docker.sh
. /scripts/install_helm.sh
. /scripts/install_kubesec.sh
#. /scripts/install_crontab.sh

. /scripts/start_minikube.sh
. /scripts/start_helm.sh

gcloud auth login --update-adc

# build server config
sv _buildSvInfo

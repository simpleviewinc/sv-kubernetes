. /sv/scripts/errorHandler.sh
. /sv/scripts/variables.sh
. /sv/scripts/requireRoot.sh

# the singular command to start minikube, this is executed by the custom minikube service
. /sv/scripts/start_minikube_command.sh

# adds coredns so that external dns entries finish quickly
kubectl apply -f /sv/internal/coredns_config.yaml

. /sv/scripts/start_helm.sh

# only register it to start on reboot after it's successfully installed
systemctl enable minikube

. /sv/scripts/errorHandler.sh
. /sv/scripts/requireRoot.sh

# needed or minikube periodically throws HOST_JUJU_LOCK_PERMISSION errors
sysctl fs.protected_regular=0

# allow the root user to login
# set their password to vagrant for ease of use like the vagrant user
echo -e "vagrant\nvagrant" | passwd root

# Override SSH Config
cp /sv/internal/sshd_config /etc/ssh/sshd_config

service sshd restart

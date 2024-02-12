. /sv/scripts/errorHandler.sh
. /sv/scripts/requireRoot.sh

# needed or minikube periodically throws HOST_JUJU_LOCK_PERMISSION errors
sysctl fs.protected_regular=0

# allow the root user to login
# set their password to vagrant for ease of use like the vagrant user
echo -e "vagrant\nvagrant" | passwd root

# Override SSH Config
cat <<-'EOF' > /etc/ssh/sshd_config
Include /etc/ssh/sshd_config.d/*.conf
PasswordAuthentication yes
KbdInteractiveAuthentication no
UsePAM yes
X11Forwarding yes
PrintMotd no
AcceptEnv LANG LC_*
Subsystem	sftp	/usr/lib/openssh/sftp-server
PermitRootLogin yes
EOF

service sshd restart

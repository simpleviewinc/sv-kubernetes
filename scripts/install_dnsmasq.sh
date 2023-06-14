. /sv/scripts/errorHandler.sh
. /sv/scripts/requireRoot.sh

# install dnsmasq
apt-get install -y dnsmasq
cp /sv/internal/dnsmasq.conf /etc/dnsmasq.conf
systemctl restart dnsmasq

# Ubuntu 22.04 ships with systemd-resolved which conflicts with dnsmasq
# We're removing their installation
systemctl disable systemd-resolved
systemctl stop systemd-resolved

# initialize our resolve.conf
unlink /etc/resolv.conf
echo "nameserver 127.0.0.1" > /etc/resolv.conf
# internal systems have a tendency to write to resolv.conf so we block it by making it read only
chattr +i /etc/resolv.conf

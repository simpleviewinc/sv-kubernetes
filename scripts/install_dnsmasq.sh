. /sv/scripts/errorHandler.sh

apt-get install dnsmasq
cp /sv/internal/dnsmasq.conf /etc/dnsmasq.conf
/etc/init.d/dnsmasq restart

rm /etc/resolv.conf
echo "nameserver 127.0.0.1" > /etc/resolv.conf
chattr +i /etc/resolv.conf
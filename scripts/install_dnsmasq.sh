. /sv/scripts/errorHandler.sh

apt-get install dnsmasq
cp /sv/internal/dnsmasq.conf /etc/dnsmasq.conf
/etc/init.d/dnsmasq restart

# on initial boot the file is a symlink, so we can't chattr that, so we only want to chattr it if it's a file
if [ -h /etc/resolv.conf ]; then
	echo "file is a symlink."
elif [ -f /etc/resolv.conf ]; then
	chattr -i /etc/resolv.conf
fi

rm /etc/resolv.conf
echo "nameserver 127.0.0.1" > /etc/resolv.conf
chattr +i /etc/resolv.conf
if [ `whoami` != "vagrant" ]; then
	echo "Script must be executed as vagrant"
	exit 1
fi

if [ $HOME != "/home/vagrant" ]; then
	echo "HOME must be /home/vagrant"
	exit 1
fi
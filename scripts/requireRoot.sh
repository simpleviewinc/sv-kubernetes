if [ `whoami` != "root" ]; then
	echo "Script must be executed as root"
	exit 1
fi

if [ $HOME != "/root" ]; then
	echo "Script must be executed as sudo -H"
	exit 1
fi
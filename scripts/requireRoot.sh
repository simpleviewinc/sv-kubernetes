if [ `whoami` != "root" ]; then
	echo "Script must be executed as root"
	exit 1
fi

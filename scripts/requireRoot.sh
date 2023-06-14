if [ `whoami` != "root" ]; then
	echo "Script must be executed as root"
	exit 1
fi

if [ "$HOME" != "/root" ]; then
	if [ "$HOME" == "/home/vagrant" ]; then
		echo "You should login as the root user rather than vagrant. Exit your shell and relog as user root password vagrant."
	else
		echo "Home directory not properly set ensure you are running as the root user, running sudo is not recommended."
	fi
fi

folder="/sv/internal/github"

mkdir -p /root/.ssh
chmod 700 /root/.ssh
cp $folder/ssh_config /root/.ssh/config
chmod 600 /root/.ssh/config

if [ -f "/etc/wsl.conf" ]; then
	read -p "Enter windows user name: " user_name
	cp /mnt/c/Users/$user_name/.ssh/github_key /home/vagrant/.ssh/github_key
	chmod 600 /home/vagrant/.ssh/github_key
fi

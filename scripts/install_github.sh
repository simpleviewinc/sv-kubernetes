folder="/sv/internal/github"

mkdir -p /root/.ssh
cp $folder/ssh_config /root/.ssh/config
chmod 600 -R /root/.ssh/

folder="/sv/internal/github"

mkdir -p /root/.ssh
cp /home/vagrant/.ssh/github_key /root/.ssh/github_key
cp $folder/ssh_config /root/.ssh/config
chmod 600 -R /root/.ssh/
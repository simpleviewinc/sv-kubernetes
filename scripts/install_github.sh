folder="/sv/internal/github"
cp $folder/github_key /root/github_key
chmod 600 /root/github_key

cp $folder/.gitconfig /root/.gitconfig
chmod 600 /root/.gitconfig

mkdir -p /root/.ssh
cp $folder/ssh_config /root/.ssh/config
chmod 600 -R /root/.ssh/
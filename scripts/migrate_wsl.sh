ln -sfn /root/sv-kubernetes /sv-wsl
mkdir -p /mnt/wsl/sv-kubernetes
mkdir -p /root/sv-kubernetes
mount --bind /root/sv-kubernetes /mnt/wsl/sv-kubernetes

cat >> /root/.profile <<'EOF'

export APPS_FOLDER="/sv-wsl/applications"
export CONTAINERS_FOLDER="/sv-wsl/containers"

EOF

source /root/.profile

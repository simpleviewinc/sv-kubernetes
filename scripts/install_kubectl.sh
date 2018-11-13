apt-get update
apt-get install -y curl

cd /tmp
curl -Lo kubectl https://storage.googleapis.com/kubernetes-release/release/v1.11.0/bin/linux/amd64/kubectl
chmod +x kubectl
mv kubectl /usr/bin/
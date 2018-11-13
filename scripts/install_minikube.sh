apt-get update
apt-get install -y curl

cd /tmp
curl -Lo minikube https://storage.googleapis.com/minikube/releases/v0.30.0/minikube-linux-amd64
chmod +x minikube
mv minikube /usr/bin/
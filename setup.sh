if [ `whoami` != "root" ]; then
	echo "Script must be executed as root"
	exit 1
fi

cd /sv/

mkdir -p /opt/sv

cp /sv/internal/resolv.conf /etc/resolv.conf

yum install nano -y

# install xz for upacking node
yum install xz -y

# install socat for helm
yum install socat -y

# install unzip for terraform
yum install unzip -y

# install node
curl -LO https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-x64.tar.xz
tar -xJf ./node-v8.11.3-linux-x64.tar.xz
mv ./node-v8.11.3-linux-x64 /usr/local/etc/node
ln -sfn /usr/local/etc/node/bin/node /usr/bin/node
ln -sfn /usr/local/etc/node/bin/npm /usr/bin/npm
rm ./node-v8.11.3-linux-x64.tar.xz

# install google cloud sdk
cp /sv/internal/google-cloud-sdk.repo /etc/yum.repos.d
yum install google-cloud-sdk -y

# install kubectl
curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.11.0/bin/linux/amd64/kubectl
chmod +x ./kubectl
mv ./kubectl /usr/local/bin/
ln -sfn /usr/local/bin/kubectl /usr/bin/kubectl

# install minikube
curl -Lo minikube https://storage.googleapis.com/minikube/releases/v0.28.2/minikube-linux-amd64
chmod +x ./minikube
mv ./minikube /usr/local/bin/
ln -sfn /usr/local/bin/minikube /usr/bin/minikube

# install docker
yum install -y yum-utils device-mapper-persistent-data lvm2
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
yum install docker-ce-18.03.0.ce-1.el7.centos.x86_64 -y
systemctl start docker

# no idea what this does, needed to get minikube to start
modprobe br_netfilter
sysctl -w net.bridge.bridge-nf-call-iptables=1

# disable selinux
setenforce 0 || true

# start minikube
minikube start --vm-driver=none

# install npm packages
cp /sv/internal/package.json /opt/sv/package.json
cd /opt/sv/
npm install
ln -sfn /opt/sv/node_modules /node_modules
cd /sv/

mkdir -p /sv/applications
mkdir -p /sv/containers

ln -sfn /sv/lib/sv.js /usr/bin/sv

# init gcloud
gcloud init
gcloud auth configure-docker

# install helm
curl -Lo ./helm.tar.gz https://storage.googleapis.com/kubernetes-helm/helm-v2.10.0-linux-amd64.tar.gz
tar -zxvf ./helm.tar.gz
rm ./helm.tar.gz
mv ./linux-amd64/helm /usr/bin/helm
rm -rf ./linux-amd64
helm init

# build server config
sv _buildSvInfo
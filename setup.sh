if [ `whoami` != "root" ]; then
	echo "Script must be executed as root"
	exit 1
fi

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
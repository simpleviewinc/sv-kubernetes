. /sv/scripts/errorHandler.sh

containernetworkplugins_version="v1.3.0" # previous none

apt-get update
apt-get install -y curl

cd /tmp
curl -Lo cni.tar.gz "https://github.com/containernetworking/plugins/releases/download/$containernetworkplugins_version/cni-plugins-linux-amd64-$containernetworkplugins_version.tgz"
sudo mkdir -p /opt/cni/bin
sudo tar -xf cni.tar.gz -C /opt/cni/bin
rm -f cni.tar.gz

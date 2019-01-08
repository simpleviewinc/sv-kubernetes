. /sv/scripts/errorHandler.sh

node_version=$(node --version 2> /dev/null || true)
node_version_expected=v8.11.3

if [ "$node_version" != "$node_version_expected" ]; then
	apt-get update
	apt-get install -y git curl
	
	cd /tmp
	curl -Lo node.tar.xz https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-x64.tar.xz
	tar -xJf node.tar.xz
	rm node.tar.xz
	rm -rf /usr/local/etc/node
	mv node-v8.11.3-linux-x64 /usr/local/etc/node
	ln -sfn /usr/local/etc/node/bin/node /usr/bin/node
	ln -sfn /usr/local/etc/node/bin/npm /usr/bin/npm
fi

apt-get install -y ntp
timedatectl set-ntp on

mkdir -p /opt/sv
cp /sv/sv/package.json /opt/sv/package.json
cd /opt/sv/
npm prune
npm install
ln -sfn /opt/sv/node_modules /node_modules

chmod +x /sv/sv/sv.js
ln -sfn /sv/sv/sv.js /usr/bin/sv

mkdir -p /sv/applications
mkdir -p /sv/containers
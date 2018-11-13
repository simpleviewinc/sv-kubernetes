. /sv/scripts/errorHandler.sh

apt-get update
apt-get install -y git curl

NODE_VERSION=v8.11.3

node=$(node --version 2> /dev/null || true)

if [ $node != "v8.11.3" ]; then
	cd /tmp
	curl -Lo node.tar.xz https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-x64.tar.xz
	tar -xJf node.tar.xz
	rm node.tar.xz
	rm -rf /usr/local/etc/node
	mv node-v8.11.3-linux-x64 /usr/local/etc/node
	ln -sfn /usr/local/etc/node/bin/node /usr/bin/node
	ln -sfn /usr/local/etc/node/bin/npm /usr/bin/npm
fi

mkdir -p /opt/sv
cp /sv/sv/package.json /opt/sv/package.json
cd /opt/sv/
npm prune
npm install
ln -sfn /opt/sv/node_modules /node_modules

cp /sv/sv/sv.js /usr/bin/sv
chmod +x /usr/bin/sv

mkdir -p /sv/applications
mkdir -p /sv/containers
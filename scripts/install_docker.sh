. /sv/scripts/errorHandler.sh
. /sv/scripts/variables.sh

ubuntu_release="ubuntu.22.04~jammy"

apt-get update
apt-get install -y \
	ca-certificates \
	curl \
	gnupg \
	lsb-release
mkdir -m 0755 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo \
	"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
	$(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install --allow-downgrades -y \
	docker-ce=5:$docker_version-1~$ubuntu_release \
	docker-ce-cli=5:$docker_version-1~$ubuntu_release \
	docker-compose-plugin=$docker_compose_version-1~$ubuntu_release \
	containerd.io

. /sv/scripts/errorHandler.sh
. /sv/scripts/variables.sh

current_docker_version=$(docker --version 2> /dev/null || true)
docker_version_expected="Docker version $docker_version, build $docker_build_hash"
current_docker_compose_version=$(docker compose version 2> /dev/null || true)
docker_compose_version_expected="Docker Compose version v$docker_compose_version"

ubuntu_release="ubuntu-jammy"

if [ "$current_docker_version" != "$docker_version_expected" ]; then
	apt-get update
	apt-get install -y \
		ca-certificates \
		curl \
		gnupg \
		lsb-release
	mkdir -m 0755 -p /etc/apt/keyrings
	curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
	echo \
		"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
		$(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
	apt-get update
	apt-get install --allow-downgrades -y docker-ce=5:$docker_version~3-0~$ubuntu_release docker-ce-cli=5:$docker_version~3-0~$ubuntu_release containerd.io
fi

if [ "$current_docker_compose_version" != "$docker_compose_version_expected" ]; then
	apt-get update
	apt-get install --allow-downgrades -y docker-compose-plugin=$docker_compose_version~$ubuntu_release
fi

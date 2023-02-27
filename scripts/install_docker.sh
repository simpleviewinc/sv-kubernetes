. /sv/scripts/errorHandler.sh

docker_version=$(docker --version 2> /dev/null || true)
docker_version_expected="Docker version 20.10.22, build aa7e414"
docker_compose_version=$(docker compose version 2> /dev/null || true)
docker_compose_version_expected="Docker Compose version v2.5.0"

if [ "$docker_version" != "$docker_version_expected" ]; then
	apt-get update
	apt-get install -y \
		ca-certificates \
		curl \
		gnupg \
		lsb-release
	mkdir -m 0755 -p /etc/apt/keyrings
	curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
	echo \
		"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
		$(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
	apt-get update
	apt-get install --allow-downgrades -y docker-ce=5:20.10.22~3-0~ubuntu-bionic docker-ce-cli=5:20.10.22~3-0~ubuntu-bionic containerd.io
fi

if [ "$docker_compose_version" != "$docker_compose_version_expected" ]; then
	apt-get update
	apt-get install --allow-downgrades -y docker-compose-plugin=2.5.0~ubuntu-bionic
fi

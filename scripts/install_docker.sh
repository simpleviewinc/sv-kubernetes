. /sv/scripts/errorHandler.sh

docker_version=$(docker --version 2> /dev/null || true)
docker_version_expected="Docker version 20.10.16, build aa7e414"
docker_compose_version=$(docker compose version 2> /dev/null || true)
docker_compose_version_expected="Docker Compose version v2.5.0"

if [ "$docker_version" != "$docker_version_expected" ]; then
	apt-get update
	apt-get install -y \
		ca-certificates \
		curl \
		gnupg \
		lsb-release
	curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
	add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
	apt-get update
	apt-get install -y docker-ce=5:20.10.16~3-0~ubuntu-bionic docker-ce-cli containerd.io
fi

if [ "$docker_compose_version" != "$docker_compose_version_expected" ]; then
	apt-get update
	apt-get install -y docker-compose-plugin=2.5.0~ubuntu-bionic
fi

. /sv/scripts/errorHandler.sh

docker_version=$(docker --version 2> /dev/null || true)
docker_version_expected="Docker version 18.06.1-ce, build e68fc7a"

if [ "$docker_version" != "$docker_version_expected" ]; then
	apt-get update
	apt-get install -y apt-transport-https ca-certificates curl software-properties-common
	curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
	add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
	apt-get update
	apt-get install -y docker-ce=18.06.1~ce~3-0~ubuntu
fi

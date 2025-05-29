#!/bin/bash
SV_KUBERNETES_PATH=/mnt/c/sv-kubernetes
mkdir -p ${SV_KUBERNETES_PATH}/internal/gcloud

docker rm -f sv-kubernetes
docker build -t sv-kubernetes:${1:-latest} ${SV_KUBERNETES_PATH}
docker run -d \
	--restart always \
	--name sv-kubernetes \
	--hostname sv-kube \
	--network host \
	-v ${SV_KUBERNETES_PATH}/internal/gcloud:/root/.config/gcloud \
	-v ~/.kube/config:/.kube/config \
	-v ~/.ssh/github_key:/root/.ssh/github_key:ro \
	-v ${SV_KUBERNETES_PATH}:/sv \
	-v /var/run/docker.sock:/var/run/docker.sock \
	sv-kubernetes:${1:-latest}

docker exec -it sv-kubernetes git config --global --add safe.directory '*'
docker exec -it sv-kubernetes gcloud config unset core/custom_ca_certs_file
docker exec -it sv-kubernetes gcloud auth login --update-adc --no-launch-browser
docker exec -it sv-kubernetes chmod -R +rwx /root/.config/gcloud

if ! grep -qiP '^docker start sv-kubernetes' ~/.bashrc; then
	echo "docker start sv-kubernetes" >> ~/.bashrc
fi

if grep -qiP '^alias sv=' ~/.bashrc; then
    sed -i "s,alias sv=.*,alias sv='docker exec -it sv-kubernetes sv'," ~/.bashrc
else
	echo "alias sv='docker exec -it sv-kubernetes sv'" >> ~/.bashrc
fi

source ~/.bashrc

#!/bin/bash
GRANICUS_CA_PATH=/usr/local/share/ca-certificates/netskope.crt
ARCH=$(arch | sed s/aarch64/arm64/ | sed s/x86_64/amd64/)
if [[ "${ARCH}" == "arm64" ]]; then
	SV_KUBERNETES_PATH=/Users/Shared/sv-kubernetes
else
	SV_KUBERNETES_PATH=/mnt/c/sv-kubernetes
	[[ ! -r ${GRANICUS_CA_PATH} ]] &&
		sudo bash ${SV_KUBERNETES_PATH}/scripts/setup_granicus_ca.sh
fi

docker rm -f sv-kubernetes
docker build -t sv-kubernetes:${1:-latest} ${SV_KUBERNETES_PATH}
docker run -d \
	--restart unless-stopped \
	--name sv-kubernetes \
	--hostname sv-kube \
	--network host \
	-v ~/.kube/config:/.kube/config \
	-v ~/.ssh/github_key:/root/.ssh/github_key:ro \
	-v ${SV_KUBERNETES_PATH}:/sv \
	-v /var/run/docker.sock:/var/run/docker.sock \
	sv-kubernetes:${1:-latest}

docker exec -it sv-kubernetes git config --global --add safe.directory '*'
docker exec -it sv-kubernetes gcloud config unset core/custom_ca_certs_file
docker exec -it sv-kubernetes gcloud auth login --update-adc --no-launch-browser

if ! grep -qiP '^docker start sv-kubernetes' ~/.bashrc; then
	echo "docker start sv-kubernetes" >> ~/.bashrc
fi

if grep -qiP '^alias sv=' ~/.bashrc; then
    sed -i "s,alias sv=.*,alias sv='docker exec -it sv-kubernetes sv'," ~/.bashrc
else
	echo "alias sv='docker exec -it sv-kubernetes sv'" >> ~/.bashrc
fi

cert_vars=('NODE_EXTRA_CA_CERTS' 'SSL_CERT_FILE' 'REQUESTS_CA_BUNDLE' 'AWS_CA_BUNDLE' 'CURL_CA_BUNDLE' 'GIT_SSL_CAPATH' 'HTTPLIB2_CA_CERTS')
for cert_var in ${cert_vars[@]}
do
	if grep -qiP "^export ${cert_var}=" ~/.bashrc; then
		sed -i "s,export ${cert_var}=.*,export ${cert_var}=/usr/local/share/ca-certificates/granicus.crt," ~/.bashrc
	else
		echo "export ${cert_var}=/usr/local/share/ca-certificates/granicus.crt" >> ~/.bashrc
	fi
done

source ~/.bashrc

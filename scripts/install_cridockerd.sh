. /sv/scripts/errorHandler.sh

cridockerd_version="0.3.2" # previous none
current_cridockerd_version=$(cri-dockerd --version 2> /dev/null || true)
cridockerd_version_expected="cri-dockerd version: $cridockerd_version (23513f4c)"

if [ "$current_cridockerd_version" != "$cridockerd_version_expected" ]; then
	curl -Lo cri-dockerd.tgz https://github.com/Mirantis/cri-dockerd/releases/download/v$cridockerd_version/cri-dockerd-$cridockerd_version.amd64.tgz
	tar -xf cri-dockerd.tgz
	rm cri-dockerd.tgz
	mv cri-dockerd/cri-dockerd /usr/bin/cri-dockerd
	rm -rf cri-dockerd
fi
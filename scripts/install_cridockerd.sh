. /sv/scripts/errorHandler.sh
. /sv/scripts/requireRoot.sh
. /sv/scripts/variables.sh

current_cridockerd_version=$(cri-dockerd --version 2>&1 || true)
cridockerd_version_expected=$(printf "cri-dockerd $cridockerd_version (HEAD)\n\n\n")

if [ "$current_cridockerd_version" != "$cridockerd_version_expected" ]; then
	# install process from https://github.com/Mirantis/cri-dockerd
	cd /tmp
	rm -rf cri-dockerd
	git clone https://github.com/Mirantis/cri-dockerd.git
	cd cri-dockerd
	mkdir bin
	echo "Building cri-dockerd from source..."
	go build -o bin/cri-dockerd
	mkdir -p /usr/local/bin
	install -o root -g root -m 0755 bin/cri-dockerd /usr/local/bin/cri-dockerd
	cp -a packaging/systemd/* /etc/systemd/system
	sed -i -e 's,/usr/bin/cri-dockerd,/usr/local/bin/cri-dockerd,' /etc/systemd/system/cri-docker.service
	systemctl daemon-reload
	systemctl enable cri-docker.service
	systemctl enable --now cri-docker.socket
fi

. /sv/scripts/errorHandler.sh
. /sv/scripts/variables.sh

# get the version, take the first line that takes CNI dummy plugin vx.x.x and use sed to extract just the version
current_cni_version=$(/opt/cni/bin/dummy 2>&1 | grep "CNI dummy plugin" | sed "s/CNI dummy plugin \(.*\)/\1/" || true)

if [ "$current_cni_version" != "$cni_version" ]; then
	rm -rf /opt/cni
	cd /tmp
	curl -Lo cni.tar.gz "https://github.com/containernetworking/plugins/releases/download/$cni_version/cni-plugins-linux-amd64-$cni_version.tgz"
	mkdir -p /opt/cni/bin
	tar -xf cni.tar.gz -C /opt/cni/bin
	rm -f cni.tar.gz
fi

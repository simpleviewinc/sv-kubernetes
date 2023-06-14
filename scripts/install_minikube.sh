. /sv/scripts/errorHandler.sh
. /sv/scripts/variables.sh

current_minikube_version=$(minikube version -o json | jq -r .minikubeVersion || true)
minikube_version_expected="$minikube_version"

if [ "$current_minikube_version" != "$minikube_version_expected" ]; then
	apt-get update
	apt-get install -y curl socat conntrack

	cd /tmp
	curl -Lo minikube https://storage.googleapis.com/minikube/releases/$minikube_version/minikube-linux-amd64
	chmod +x minikube
	mv minikube /usr/bin/
fi

cp /sv/internal/minikube.service /etc/systemd/system/minikube.service
chmod 0644 /etc/systemd/system/minikube.service
systemctl daemon-reload
systemctl enable minikube

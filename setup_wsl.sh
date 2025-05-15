[ $(cat -A /mnt/c/sv-kubernetes/internal/line_ending_test) != "$" ] && echo "Improper line endings" && exit 1;

ln -sfn /mnt/c/sv-kubernetes /sv
mkdir -p /root/{.kube,.config}
mkdir -p /mnt/c/sv-kubernetes/internal/gcloud
ln -sfn /home/vagrant/.kube/config /root/.kube/config
ln -sfn /mnt/c/sv-kubernetes/internal/gcloud /root/.config/gcloud
chmod 600 /home/vagrant/.kube/config
chmod 600 /root/.kube/config
cp /home/vagrant/.bashrc /root/.bashrc
cp /sv/internal/wsl.conf /etc/wsl.conf

. /sv/scripts/errorHandler.sh
. /sv/scripts/requireRoot.sh

. /sv/scripts/install_misc.sh
. /sv/scripts/install_sv.sh
. /sv/scripts/install_github.sh
. /sv/scripts/install_gcloud.sh
. /sv/scripts/install_kubectl.sh
. /sv/scripts/install_helm.sh
. /sv/scripts/install_kubesec.sh

gcloud auth login --update-adc --no-launch-browser

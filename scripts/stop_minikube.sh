minikube delete --all --purge
rm -rf /etc/kubernetes/addons
rm -rf /root/.minikube

systemctl disable kubelet.service

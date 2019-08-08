. /sv/scripts/errorHandler.sh

kubectl apply -f /sv/internal/kube-dns-addon/kube-dns-cm.yaml
kubectl apply -f /sv/internal/kube-dns-addon/kube-dns-controller.yaml
kubectl apply -f /sv/internal/kube-dns-addon/kube-dns-svc.yaml
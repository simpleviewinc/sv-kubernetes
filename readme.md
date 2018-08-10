# installation

Clone the repo to your local computer

From windows

```
D:\cms30\cms-vagrant-kubernetes
vagrant up
```

SSH into the box

```
sudo bash /sv/setup.sh
```

Now minikube should be running and your box is setup to add services. git clone services into the /services/ folder.

## Add a service
```
sudo kubectl apply -f /sv/services/[serviceFolder]
```

## See existing deployments
```
sudo kubectl get deployments
```

## Delete a deployment
If you need restart a deployment you can delete it at re-add it

```
sudo kubectl delete deployment [deployment]
```
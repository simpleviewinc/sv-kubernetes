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

Now minikube/kubernetes should be running and your box is setup to add services.

## Add an application

Git clone your application repository into the /sv/applications folder

## Start an application

The `applicationName` should be the name of the folder in your /applications/ folder.

```
sudo sv start application [applicationName]
```

## Stop an application

The `applicationName` should be the name of the folder in your /applications/ folder.

```
sudo sv stop application [applicationName]
```

# Useful commands

* See all that's running - `sudo kubectl get all`
* Delete content - `sudo kubectl delete [type] [name]` (sv stop application does this for you)
* See minikube logs - `sudo minikube logs`
* Add a gcloud context for deployment - `sudo gcloud container clusters get-credentials [clusterName]`
* See current config - `sudo kubectl config`
* See current context - `sudo kubectl config current-context`
* Switch to context - `sudo kubectl config use-context [context]`
* Apply a config (sv start application is preferred) - `sudo kubectl apply -f /path/to/file.yaml`
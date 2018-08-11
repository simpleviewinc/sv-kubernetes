BETA - Pending review or orchestration between CMS/CRM/Baberstock

# Overview

This repository is meant to be a base to install kubernetes and begin running applications on your machine and remote in the Google Cloud Engine (gce). The overall structure of the repo is:

* - /applications/ - Individual repos are checked out which contain yaml files and tools needed to manage individual applications.
* - /containers/ - Individual repos are checked out, each repo is responsible for a single container.
* sv - sv command allows us to easily start/stop/deploy applications locally and to the gce.

The goal of this repository is for multiple departments to eventually share the repo and utilize the repo allowing all groups to have the same basic workflow for doing containerized workflows. The complexity of the different applications and departments should be primarily contained within their  repositories in /applications/ and within their containers in /containers/.

# Installation

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
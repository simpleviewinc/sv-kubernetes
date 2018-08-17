BETA - Pending review and orchestration between CMS/CRM/Baberstock

# Overview

This repository is meant to be a base to install kubernetes and begin running applications on your machine and remote in the Google Cloud Engine (gce). The overall structure of the repo is:

* - /applications/ - Individual repos are checked out which contain yaml files and tools needed to manage individual applications.
* - /containers/ - Individual repos are checked out, each repo is responsible for a single container.
* sv - sv command allows us to easily start/stop/deploy applications locally and to the gce.

# Project Goals

* The goal of this repository is for multiple departments to eventually share this repo for their working environment to ensure similar containerized workflows in all departments. The complexity of the different applications and departments should be primarily contained within their  repositories in /applications/ and within their containers in /containers/.
* Avoid vendor lock-in by utilizing all open sources tools available on any hosting provider. Kubernetes gives us an application deployment framework that can be employed at any hosting provider.
* Handle deployment, provisioning, and orchestration between all services within an application to avoid engineering of deployment and maintenance processes across departments.
* Allow applications to be split into smaller containerized pieces. The goal is for this to be an iterative process where one UI may communicate with many microservices. Older code is converted into containerized services in a way so that SaaS users are unaware of the switch out.
* Allow developers within Simpleview to more easily move from product to product by providing a familiar working environment across departments. The containers will still be fully managed by the individual teams, and the tools those teams used will be determined by those teams.

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

## Watch a container for changes

The `containerName` is the folder of the container. It will watches this folder for changes and trigger a docker build, tag it, and restarts any pods using it.

Pods using the container need the label `sv-pod` which matches the `containerName`.

This is a development only tool, should not be used in production.

```
sudo sv watch container [containerName] [name:tag]
sudo sv watch container cms-test-node node:latest
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

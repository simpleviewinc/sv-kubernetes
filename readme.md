BETA - Pending review and orchestration between CMS/CRM/Baberstock

# Overview

This repository is meant to be a base to install kubernetes and begin running applications on your machine and remote in the Google Cloud Engine (gce). The overall structure of the repo is:

* - /applications/ - Individual repos are checked out which contain Helm charts and tools needed to manage individual applications.
* - /containers/ - Individual repos are checked out, each repo is responsible for a single container.
* sv - sv command allows us to easily start/stop/deploy applications locally and to the gce.

# Project Goals

* The goal of this repository is for multiple departments to eventually share this repo for their working environment to ensure similar containerized workflows in all departments. The complexity of the different applications and departments should be primarily contained within their  repositories in /applications/ and within their containers in /containers/.
* Avoid vendor lock-in by utilizing all open sources tools available on any hosting provider. Kubernetes gives us an application deployment framework that can be employed at any hosting provider.
* Handle deployment, provisioning, and orchestration between all services within an application to avoid engineering of deployment and maintenance processes across departments.
* Allow applications to be split into smaller containerized pieces. The goal is for this to be an iterative process where one UI may communicate with many microservices. Older code is converted into containerized services in a way so that SaaS users are unaware of the switch out.
* Allow developers within Simpleview to more easily move from product to product by providing a familiar working environment across departments. The containers will still be fully managed by the individual teams, and the tools those teams used will be determined by those teams.
* Be the platform where we can build a microservice system based on the concept of making all APIs externalizable similar to the initiatve put in place at Amazon via [this memo](https://apievangelist.com/2012/01/12/the-secret-to-amazons-success-internal-apis/).

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

Now minikube, kubernetes, docker and helm should be running and your box is setup to add applications and containers.

# sv command

* [sv build](docs/sv_build.md) - Build a container.
* [sv restart](docs/sv_restart.md) - Restart a specific container in an application, used for development purposes.
* [sv start](docs/sv_start.md) - Start an application.
* [sv stop](docs/sv_stop.md) - Stop an application.

# Useful commands

* See all that's running - `sudo kubectl get all`
* Get a pods logs - `sudo kubectl logs [podname]`
* See minikube logs - `sudo minikube logs`
* Add a gcloud context for deployment - `sudo gcloud container clusters get-credentials [clusterName]`
* See current config - `sudo kubectl config`
* See current context - `sudo kubectl config current-context`
* Switch to context - `sudo kubectl config use-context [context]`
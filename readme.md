BETA - Pending review and orchestration between CMS/CRM/Baberstock

# Overview

This repository is meant to be a base to install Kubernetes, Helm and begin running applications on your machine and remote in the Google Cloud Engine (gce). The overall structure of the repo is:

* - /applications/ - Individual repos are checked out which contain Helm charts and tools needed to manage individual applications.
* - /containers/ - Individual repos are checked out, each repo is responsible for a single container.
* sv - sv command allows us to easily start/stop/deploy applications locally and to the gce.

## Project Goals

* The goal of this repository is for multiple departments to eventually share this repo for their working environment to ensure similar containerized workflows in all departments. The complexity of the different applications and departments should be primarily contained within their  repositories in /applications/ and within their containers in /containers/.
* Avoid vendor lock-in by utilizing all open sources tools available on any hosting provider. Kubernetes gives us an application deployment framework that can be employed at any hosting provider.
* Handle deployment, provisioning, and orchestration between all services within an application to avoid engineering of deployment and maintenance processes across departments.
* Allow applications to be split into smaller containerized pieces. The goal is for this to be an iterative process where one UI may communicate with many microservices. Older code is converted into containerized services in a way so that SaaS users are unaware of the switch out.
* Allow developers within Simpleview to more easily move from product to product by providing a familiar working environment across departments. The containers will still be fully managed by the individual teams, and the tools those teams used will be determined by those teams.
* Be the platform where we can build a microservice system based on the concept of making all APIs externalizable similar to the initiatve put in place at Amazon via [this memo](https://apievangelist.com/2012/01/12/the-secret-to-amazons-success-internal-apis/).

## Installation

Clone the repo to your local computer

Open a command prompt as Admin and `cd` to the folder which you checked out this repository.

```
# windows cmd
vagrant up
```

SSH into the box

```
# ssh putty session
sudo bash /sv/setup.sh
```

Now minikube, kubernetes, docker and helm should be running and your box is setup to add applications and containers.

## sv command

* [sv build](docs/sv_build.md) - Build a container.
* [sv restart](docs/sv_restart.md) - Restart a specific container in an application, used for development purposes.
* [sv start](docs/sv_start.md) - Start an application.
* [sv stop](docs/sv_stop.md) - Stop an application.

# Application Structure

Applications are written as [Helm charts](https://docs.helm.sh/). Our `sv` library wraps the capabilities of Helm and Kubernetes to ensure an easy development environment.

[sv-kubernetes-example-app](https://github.com/simpleviewinc/sv-kubernetes-example-app) - A functioning example application.

Application Structure

* Charts.yaml - required - The basic file for the project. See [Helm Charts.yaml](https://docs.helm.sh/developing_charts#the-chart-yaml-file).
* values.yaml - optional - Variables loaded into your application templates.
* values_[env].yaml - optional - Variables to load specific to the server environment.
* /templates/ - required - The folder to store templates for each resource in your application. It is recommended to keep one Kubernetes entity per file for simplicity.

The `sv` wrapper makes available some values which can be utilized in application templates.

* sv
	* ids - An object containing each "container:tag" reference with the Docker image_id. This is a hash of the exact contents, to verify whether the container has changed.
		* Reccommened use-case is to refer to `checksum: {{ index .Values.sv.ids "image:tag" }}`. In the `annotations` of your deployment.yaml template. This way the container will only restart if the checksum has changed.
		* If the image name is coming from a variable, you can utilize that by swapping `"image:tag"` for `.Values.my_image_variable`.
	* server_config
		* env - The current server environment. Allows conditional logic in your templates based on environment.

Best Practices:

* In your template files utilize the `{{ .Release.name }}-name` for naming each component. This will pull the name from your Charts.yaml file so all of the portions of this application are clearly named.
* In your values.yaml hard-code the image:tag you will be utilizing. This ensures rollback capability.
* In your values_local.yaml specify a variable for each container with it's value being `[image]:local` and reference that in your deployment files.
* In your deployment files, utilize the checksum described above, to allow `sudo sv restart` to work efficiently.
* On local it is recommended to mount a directory for content which changes frequently, such as html/css/js which does not require a process reboot. You'll want to ensure that you are doing a COPY for this content to ensure it works in non-local environments.

# Container Structure

Containers are written as standard Docker containers.

[sv-kubernetes-example-container)(https://github.com/simpleviewinc/sv-kubernetes-example-container) - A functioning example container.

* Since we are running the system with Kubernetes the recommendation is that containers have their default command as /bin/bash to allow easily running `docker run -it image:tag` to debug. In the Helm chart you will indicate your normal start-up command.
* Seek to minimize the number of layers in your Dockerfile while also maximizing the cache re-use. This means placing the actions which rarely change high in your file, and the actions which frequently change lower in the file.
* If you are using a local mount, ensure that you are performing a COPY for that content so the Dockerfile works in non-local environments.

# Useful commands

* See all that's running - `sudo kubectl get all`
* Get a pods logs - `sudo kubectl logs [podname]`
* See minikube logs - `sudo minikube logs`
* Add a gcloud context for deployment - `sudo gcloud container clusters get-credentials [clusterName]`
* See current config - `sudo kubectl config`
* See current context - `sudo kubectl config current-context`
* Switch to context - `sudo kubectl config use-context [context]`
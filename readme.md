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

Run `sudo sv` for documentation within the VM.

* [sv build](docs/sv_build.md) - Build a container.
* [sv restart](docs/sv_restart.md) - Restart a specific container in an application, used for development purposes.
* [sv start](docs/sv_start.md) - Start an application.
* [sv stop](docs/sv_stop.md) - Stop an application.

# Applications

Applications are written as [Helm charts](https://docs.helm.sh/). Our `sv` library wraps the capabilities of Helm and Kubernetes to ensure an easy development environment.

[sv-kubernetes-example-app](https://github.com/simpleviewinc/sv-kubernetes-example-app) - A functioning example application.

## Application Structure

* Charts.yaml - required - The basic file for the project. See [Helm Charts.yaml](https://docs.helm.sh/developing_charts#the-chart-yaml-file) for documentation.
* values.yaml - optional - Variables loaded into your application templates.
* values_[env].yaml - optional - Variables to load specific to the environment.
* /templates/ - required - The folder to store templates for each resource in your application. It is recommended to keep one Kubernetes entity per file for simplicity.

The `.Values.sv` exposes values which can be utilized in application templates.

* sv
	* ids - An object containing each "image:tag" reference with the Docker image_id. The value is a hash of the exact contents, to verify whether the container has changed.
		* Recommended use-case is to refer to `checksum: {{ index .Values.sv.ids "image:tag" }}`. In the `annotations` of your deployment.yaml template. This way the container will only restart if the checksum has changed.
		* If the image name is coming from a variable, you can utilize that by swapping `"image:tag"` for `.Values.my_image_variable`. See example application for reference.
	* env - The current server environment. Allows conditional logic in your templates based on environment. See example application for reference.

Best Practices:

* In your template files utilize the `{{ .Release.name }}-name` for naming each component. This will pull the name from your Charts.yaml file so all of the portions of this application are clearly named.
* In your values.yaml hard-code the `image:tag` you will be utilizing. This ensures rollback capability.
* In your values_local.yaml specify a variable for each container with it's value being `[image]:local` and reference that in your deployment files.
* In your deployment files, utilize the checksum described above, to allow `sudo sv restart` to work efficiently.
* On local it is recommended to mount a directory for content which changes frequently, such as html/css/js which does not require a process reboot. You'll want to ensure that you are doing a COPY for this content to ensure it works in non-local environments.
* To utilize the GCR container registry, you will want to put `imagePullSecrets` using `gcr-pull` in your yaml files. Reference [sv-kubernetes-example-container](https://github.com/simpleviewinc/sv-kubernetes-example-container) for an example.

## Container Structure

Containers are written as standard Docker containers.

[sv-kubernetes-example-container](https://github.com/simpleviewinc/sv-kubernetes-example-container) - A functioning example container.

* Your docker container should be built in a way so that they ship functional in remote environments, and then for local development directories can be mounted for the CMD/Entrypoint can be changed.
* Seek to minimize the number of layers in your Dockerfile while also maximizing the cache re-use. This means placing the actions which rarely change high in your file, and the actions which frequently change lower in the file.
* If you are using a local mount, ensure that you are performing a COPY for that content so the Dockerfile works in non-local environments.

## Enable Cloud Build

The recommendation is that Docker images are built and tagged automatically upon a git push to the github repo.

The best practice for naming your images is `gcr.io/$PROJECT_ID/$REPO_NAME:${BRANCH_NAME}-${version}`. This ensures that the tag contains the branch name as well as the semver of your container. This allows containers to be build for dev/test environments as well as ensuring each is properly utilizing a semver.

In order to utilize the system you can copy/paste the `cloudbuild.yaml` and `build.sh` and `version` from the [sv-kubernetes-example-container](https://github.com/simpleviewinc/sv-kubernetes-example-container). Into your container. From there Owen can setup the build trigger to automate your container generation.

# Other useful Docker/Kubernetes commands

* See all applications that are running - `sudo helm list`
* See all that's running - `sudo kubectl get all`
* Get a pods logs - `sudo kubectl logs [podname]`
* See minikube logs - `sudo minikube logs`
* See current config - `sudo kubectl config`
* See current context - `sudo kubectl config current-context`
* Run a container to debug - `sudo docker run -it image:tag`

Connecting to clusters

* List projects - `sudo gcloud projects list`
* Switch project - `sudo gcloud config set project [project]`
* Get cluster credentials - `sudo gcloud container clusters get-credentials [clusterName]`
* Get available contexts - `sudo kubectl config get-contexts`
* Switch to context - `sudo kubectl config use-context [context]`
# Overview

* [Change Log](changelog.md)
* [Dockerfile Best Practices](dockerfile_best_practices.md)
* [Secrets](secrets.md)

This repository is meant to be a base to install Kubernetes, Helm and begin running applications on your machine and remote in the Google Cloud Engine (gce). The overall structure of the repo is:

* /applications/ - Individual repos are checked out which contain Helm charts and tools needed to manage individual applications and containers.
* /containers/ - Individual repos are checked out, each repo is responsible for a single container.
* sv - sv command allows us to easily start/stop/deploy applications locally and to the gce.

## Project Goals

* The goal of this repository is for multiple departments to eventually share this repo for their working environment to ensure similar containerized workflows in all departments. The complexity of the different applications and departments should be primarily contained within their repositories in /applications/ and within their containers in /containers/.
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
# ssh putty session (192.168.50.100)
sudo bash /sv/setup.sh
```

Now minikube, kubernetes, docker and helm should be running and your box is setup to add applications and containers.

## Local Development

Often in order to work your project you will want to install and start the following applications.

* `sv-kube-proxy` allows you to access resources on your box at `kube.simpleview.io`.
	* If your application needs an additional nginx entry, please pull request it in to that repo.
* `sv-graphl` proxies to your application's graphql server. It can be accessed at `graphql.kube.simpleview.io`.
	* If your application needs an additional graphql, please pull request it in to that repo.

```
sudo sv install sv-kube-proxy
sudo sv start sv-kube-proxy local --build

sudo sv install sv-graphql
sudo sv start sv-graphql local --build
```

## sv command

Run `sudo sv` for documentation within the VM.

* [sv build](docs/sv_build.md) - Build a container.
* [sv install](docs/sv_install.md) - Install an application.
* [sv logs](docs/sv_logs.md) - Get logging information for a deployment.
* [sv start](docs/sv_start.md) - Start an application.
* [sv stop](docs/sv_stop.md) - Stop an application.
* [sv enterPod](docs/sv_enterPod.md) - Enter a running container.
* [sv execPod](docs/sv_execPod.md) - Execute a command on a running container.
* [sv restartPod](docs/sv_restartPod.md) - Restart a pod in an application.
* [sv test](docs/sv_test.md) - Run tests for an application.
* [sv editSecrets](docs/sv_editSecrets.md) - Manage secrets for an application.

# Applications

Applications are written as [Helm charts](https://docs.helm.sh/). Our `sv` library wraps the capabilities of Helm and Kubernetes to ensure an easy development environment.

[sv-kubernetes-example](https://github.com/simpleviewinc/sv-kubernetes-example) - A functioning example application.

## Naming

The recommended approach is to utilize a single repo which contains your application and it's containers. In cases where you want to share containers with other applications, the recommendation is to keep those folders out of your application and instead build them separately.

* App Repo - `[department]-[name]`, example `sv-kubernetes-example`

## Repo Structure

* /chart/ - Helm Chart
	* Chart.yaml - required - The basic file for the project. See [Helm Charts.yaml](https://docs.helm.sh/developing_charts#the-chart-yaml-file) for documentation.
	* The `name` in your Chart.yaml should exactly match the name of the repository.
	* values.yaml - optional - Variables loaded into your application templates.
	* values_[env].yaml - optional - Variables to load specific to the environment.
	* /templates/ - required - The folder to store templates for each resource in your application. It is recommended to keep one Kubernetes entity per file for simplicity.
* /containers/
	* /`[NAME]`/
		* /lib/ - A folder that will likely be `COPY`'d into your container via the `Dockerfile`
		* Dockerfile
* settings.yaml - Needed for specifying the version of your application for container tagging.
* readme.md - Documentation entrypoint for the application.

### settings.yaml

* version - string - The semver that will be appended to your compiled containers.
* dockerBase - string - The root of the docker registry which your container and tag are appended. E.g. `gcr.io/sv-shared-231700`.
* buildOrder - array of string - The build order of the containers. Needed when doing multi-part docker builds that utilize a shared container.
* dependencies - array of object - Other applications and containers this repository needs installed to function.
	* name - string - required - Name of the repository
	* branch - string - default 'master' - The branch to checkout
	* type - string - default 'app' - Whether the repository is a app repo or a container repo.
* secrets_key - string - The key used to encrypt the secrets for the project. All developers of the application need access to this key to build/run the application. *When using a GCP secret you must prefix with `gcp:`*

example:
```
version: 1.0.0
dockerBase: gcr.io/sv-shared-231700
buildOrder:
  - container1
  - container2
  - container3
dependencies:
  - name: sv-graphql-client
    type: container
  - name: sv-kube-proxy
secrets_key: gcp:projects/sv-shared-231700/locations/global/keyRings/kubernetes/cryptoKeys/default
```

## Chart Additional Capabilities

The `.Values.sv` exposes values which can be utilized in application templates.

* sv
	* ids - An object containing each "image:tag" reference with the Docker image_id. The value is a hash of the exact contents, to verify whether the container has changed.
		* Recommended use-case is to refer to `checksum: {{ index .Values.sv.ids "image:tag" }}`. In the `annotations` of your deployment.yaml template. This way the container will only restart if the checksum has changed.
		* If the image name is coming from a variable, you can utilize that by swapping `"image:tag"` for `.Values.my_image_variable`. See example application for reference.
	* env - The current env dictated by the `sv start` command.
	* containerPath - The path to the `/containers/` folder within the application. This way you can use relative paths to your containers making `yaml` files more portable between projects.
	* applicationPath - The path to the folder of the application itself.
	* deploymentName - The sv system boots the app as "app" in all non-test environments, but in test it named with the name of the branch so "crm-pull-5". In cases where this value needs to be none, you can use `{{ .Values.sv.deploymentName }}` and it will work in all envs.
	* tag - When loading in non-local environments the tag for containers is `branch-version`. On local it's just `local`. You can utilize `{{ .Values.sv.tag}}` to get the value of the tag in all environments.

Best Practices:

* In your template files utilize the `{{ .Release.name }}-name` for naming each component. This will pull the name from your Charts.yaml file so all of the portions of this application are clearly named.
* In your values.yaml hard-code the `image:tag` you will be utilizing. This ensures rollback capability.
* In your values_local.yaml specify a variable for each container with it's value being `[image]:local` and reference that in your deployment files.
* In your deployment files, utilize the checksum described above, to allow `sv start` to restart only the containers with changes.
* On local it is recommended to mount a directory for content which changes frequently, such as html/css/js which does not require a process reboot. You'll want to ensure that you are doing a COPY for this content to ensure it works in non-local environments.
* To utilize the GCR container registry, you will want to put `imagePullSecrets` using `gcr-pull` in your yaml files. Reference [sv-kubernetes-example](https://github.com/simpleviewinc/sv-kubernetes-example) for an example.
* Use [secrets](docs/sv_editSecrets.md) to secure and encrypt information such as DB passwords, tokens, and any proprietary data that your application needs. 

## Container Structure

Containers are written as standard Docker containers.

[sv-kubernetes-example-server](https://github.com/simpleviewinc/sv-kubernetes-example/tree/master/containers/server) - A functioning example container.

* Your docker container should be built in a way so that they ship functional for a remote environments, and then for local development directories can be mounted for the CMD/Entrypoint can be changed.
	* In practice this means that on local you might mount in a hot folder, but elsewhere the `Dockerfile` will compile the necessary resources.
* Seek to minimize the number of layers in your Dockerfile while also maximizing the cache re-use. This means placing the actions which rarely change high in your file, and the actions which frequently change lower in the file.
* If you are using a local mount, ensure that you are performing a COPY for that content so the Dockerfile works in non-local environments.

# Other useful Docker/Kubernetes commands

* See all applications that are running - `sudo helm list`
* See all that's running - `sudo kubectl get all`
* Get a pods logs - `sudo kubectl logs [podname]`
* See minikube logs - `sudo minikube logs`
* See current config - `sudo kubectl config`
* See current context - `sudo kubectl config current-context`
* Run a container to debug - `sudo docker run -it image:tag`
* Run a container with a specific command - `sudo docker run -it image:tag /bin/bash`
* Enter a running container - `sudo kubectl exec -it [podName] /bin/bash`
* Describe pod for debugging pod boot errors - `sudo kubectl describe pod [podName]`

Connecting to clusters

* List projects - `sudo gcloud projects list`
* Switch project - `sudo gcloud config set project [project]`
* Get cluster credentials - `sudo gcloud container clusters get-credentials [clusterName]`
* Get available contexts - `sudo kubectl config get-contexts`
* Switch to context - `sudo kubectl config use-context [context]`
* Delete context - `sudo kubectl config delete-context [context]`

# CI/CD Philosophy

sv-kubernetes applications are recommended to be setup with CI/CD using the following plan. This plan is handled by circleci and the [sv-deploy-gce](https://github.com/simpleviewinc/sv-deploy-gce) docker container.

* Pull requests trigger unit test execution via deployment to a cluster called test.
* Pushes to a branch trigger deployment to a kubernetes cluster aligning with the branch.
	* develop -> dev
	* qa -> qa
	* staging -> staging
	* master -> live
* In cases where you want to mandate unit test execution prior to deployment, utilize Github's branch protection feature to only allow merging via pull request. This way your pull request to that branch will have the unit tests executed, and then, upon completion and your approval, the merge will trigger the deployment.
* Images will be tagged with the branch and the version from the `settings.yaml` file.
* It is not required for each department to utilize all environmental clusters. Their workflow and what works best for them is up to them.
* It is recommended that the branches from dev -> qa -> staging -> master are kept "in sync" so that master never has a commit which is not present on dev. This means you'll never want to push or PR directly to master, it should always come from the environment before it.
* The recommended development flow is PR features/bugs to develop -> merge -> pr develop to qa -> merge -> pr qa to staging -> merge -> pr staging to live.
* If you have a smaller department or don't need all environments, then simplify the flow to something like PR to (qa, dev, staging) -> merge -> pr to live -> merge. Whatever model you choose, have all tickets utilize the same release pathway.

# Getting it running in the cloud

Setting up CI/CD is relative easy but there are a few pitfalls to make sure it's working. Most of it doesn't have to do with the CI/CD system itself, but rather making sure your application is ready to function in non-live environments.

* While running in non-local environments your mounted folders will not work. The `Dockerfile` in your containers needs to be setup assuming it's `live` configuration. So if you need to run webpack or some other utility to compile code, your Dockerfile should be doing that.
* Copy the `.circleci` folder from the `sv-kubernetes-example` project into the root of your project.
* Ensure that you have a `settings.yaml` file in the root of your project. This should have a `version: SEMVER` inside it. This will be utilized in tagging your images in each environment with your current application's version.
* In your deployments for the container setup, you will likely want `imagePullPolicy: Always` in all non-local environments. See the `sv-kubernetes-example` app for an example.
* In your deployments for the container setup, you will need to be calculating your `$image` dynamically to include your base image + the dynamically generated tag.
	* An example of this is `{{ $image := printf "%s:%s" .Values.imageBase .Values.sv.tag }}` . The `{{ .Values.imageBase }}` is an arbitrary variable. It could be anything from your values files. The `.Values.sv.tag` is the dynamically generated tag by the CI/CD system. This ensures the right image is loaded in the right env.
	* If you need a multi-container example see `sv-auth` as an example.
* If you are exposing a front-end service with a hostname the recommendation is to go through the `sv-kube-proxy` as it will provide a consistent IP and SSL termination. If you need a cert or a service published, submit a pull request to that repository or contact Owen.
* If you need a consistent IP address for routing for `sv-kube-proxy` or `sv-graphql` utilize [internal load balancer](https://cloud.google.com/kubernetes-engine/docs/how-to/internal-load-balancing)
	* Add the annotation `cloud.google.com/load-balancer-type: "Internal"`
	* Use `type: LoadBalancer` and `loadBalancerIP: IP`. The IP address should take your root CIDR and start at 10. So for the sv-shared project the root CIDR is `10.0.0.0/24` so the first static IP would be assigned at `10.0.0.10`. For the `sv-crm` project the root CIDR is `10.1.0.0/24` so the first static IP would be `10.1.0.10`. Increment from there as more IP addresses are added.
		* sv-shared static ips - `10.0.0.10` and increment.
		* crm static ips - `10.1.0.10` and increment.
	* The IP address will be the same for all environments since each environment is on it's own VPC network allowing re-use of IP addresses. This also helps to simplify config.
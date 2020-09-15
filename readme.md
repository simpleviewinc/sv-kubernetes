# Overview

* [Change Log](changelog.md)
* [Dockerfile Best Practices](dockerfile_best_practices.md)
* [Secrets](secrets.md)
* [Storage](storage.md)

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

Clone the repo to your local computer. Ensure your git client is setup properly to not tamper with line endings with AutoCrlf `false` and SafeCrlf `warn`, see [this thread](https://discourse.devops.simpleviewtools.com/t/unable-to-setup-sv-kubernetes/68) for more info.

Open a command prompt as Admin and `cd` to the folder which you checked out this repository.

```
# windows cmd
vagrant up
```

SSH into the box at IP address: 192.168.50.100

Username: vagrant
Password: vagrant

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
* `sv-geo` A microservice that returns geo location. Queries can be ran in the graphql playground at `graphql.kube.simpleview.io`.
	* This repo is not required but if you are planning on building a graphql microservice it is recommended to pull down so that you can pull up a functional graphql application to ensure your env is functional.

```
sudo sv install sv-kube-proxy
sudo sv start sv-kube-proxy local --build

sudo sv install sv-graphql
sudo sv start sv-graphql local --build

sudo sv install sv-geo
sudo sv start sv-geo local --build
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
* [sv describePod](docs/sv_describePod.md) - Show details of a specific pod.
* [sv restartPod](docs/sv_restartPod.md) - Restart a pod in an application.
* [sv test](docs/sv_test.md) - Run tests for an application.
* [sv editSecrets](docs/sv_editSecrets.md) - Manage secrets for an application.
* [sv debug](docs/sv_debug.md) - Output the versions and state of your local box for devops debugging purposes.
* [sv fixDate](docs/sv_fixDate.md) - Re-syncs your linux clock, sometimes needed after the box was sleeping for a while.
* [sv switchContext](docs/sv_switchContext.md) - Switch between Kubernetes Contexts.
* [sv getContext](docs/sv_getContext.md) - Get the current Kubernetes Context.
* [sv listProjects](docs/sv_listProjects.md) - List available kubernetes projects.

## Troubleshooting
Here are a few scenarios and useful commands that can help troubleshoot your application(s)

* If you receive the error `/sv/setup.sh: line 25: syntax error: unexpected end of file` when you attempt to run `sudo bash /sv/setup.sh`:
    * This indicates that the repo was cloned with Windows line endings instead of Unix line endings
    * To fix, follow the instructions in this [discourse answer](https://discourse.devops.simpleviewtools.com/t/unable-to-setup-sv-kubernetes/68)
* Verify the application started:
    *   `sudo kubectl get all`
    *   All pods should be in ready 1/1 and status RUNNING
* If the pods haven't started or are stuck in `ContainerCreating` describe the pod to see why it won't start:
    * `sudo sv describePod [podname]`
    * This should show the kubernetes events on a pod such as whether it can't mount a directory, or can't pull an image, or lacks some sort of permission.
* If the pod has started but isn't responding to a browser request:
    * `sudo sv logs --filter=test-application-container --watch`
    * This will follow the `stdout` and `stderr` from the container allowing you to watch the output to see if it's bootlooping to failing in another way.
* If your application is failing to start because of a helm or kubernetes error:
    * `sudo sv start [my-app] local --dry-run --debug`
    * This will output the compiled version of your kubernetes configs, with variables filled in. You can review the compiled yaml and see if there is an error in the way you are handling variables.
* If you need to shell into a container so that you can explore it while it's running:
    * `sudo sv enterPod test-application-container`
    * This will shell into the running container so you can explore the runtime environment and folder structure.
* If you have experienced a power outage or shutdown your environment without running `vagrant halt` please see the discourse article
  [here](https://discourse.devops.simpleviewtools.com/t/unable-to-access-running-applications-in-sv-kubernetes-after-vagrant-workstation-reboot/167/2)

# Application

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
* buildOrder_live - array of string - Build order for live, overwrites buildOrder if specified.
* buildOrder_qa - array of string - Build order for qa, overwrites buildOrder if specified.
* buildOrder_dev - array of string - Build order for dev, overwrites buildOrder if specified.
* buildOrder_local - array of string - Build order for local, overwrites buildOrder if specified.
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
		* Recommended use-case is to refer to `checksum: "{{ index .Values.sv.ids image:tag }}"`. In the `annotations` of your deployment.yaml template. This way the container will only restart if the checksum has changed.
		* If the image name is coming from a variable, you can utilize that by swapping `"image:tag"` for `.Values.my_image_variable`. See example application for reference.
	* env - The current env dictated by the `sv start` command.
	* containerPath - The path to the `/containers/` folder within the application. This way you can use relative paths to your containers making `yaml` files more portable between projects.
	* applicationPath - The path to the folder of the application itself.
	* deploymentName - The sv system boots the app as "app" in all non-test environments, but in test it named with the name of the branch so "crm-pull-5". In cases where this value needs to be none, you can use `{{ .Values.sv.deploymentName }}` and it will work in all envs.
	* tag - When loading in non-local environments the tag for containers is `env`. On local it's just `local`. In pull requests it is `pull-NUM`. Best practice is to utilize `{{ .Values.sv.tag}}` to get the value of the tag in all environments.
	* dockerRegistry - The dockerRegistry prefix will be set to either `""` or `settings.dockerBase/` to allow you to prefix your image urls in all envs.

Best Practices:

* In your kubernetes template files utilize the `{{ .Release.Name }}-name` for naming each component. This will pull the name from your Charts.yaml file so all of the portions of this application are clearly named.
* It is recommended that you utilize variables at the top of each chart file. This allows you to reference those values in multiple places throughout your chartfile so you can change them in one place. It also assists with the possible versioning of chart files when you need to support multiple versions of a container simultaneously.
	```
    {{ $name := "server" }}
    {{ $version := "v1" }}
    {{ $fullName := printf "%s-%s-%s" .Release.Name $name $version }}
    {{ $image := printf "%s%s-%s-%s:%s" .Values.sv.dockerRegistry .Chart.Name $name $version .Values.sv.tag }}
    ```
* While you should use `{{ .Release.Name }}` when naming your kubernetes components, **do not use `{{ .Release.Name }}` when naming a docker image**. This will prevent it from working on the test environment on pull requests. Instead ensure that your Chart.yaml has the right name and use `{{ .Chart.Name }}`.
* In your deployment files, utilize the checksum described above, to allow `sv start` to restart only the containers with changes.
* On local it is recommended to mount a directory for content which changes frequently, such as html/css/js which does not require a process reboot. You'll want to ensure that you are doing a COPY for this content to ensure it works in non-local environments.
* Use [secrets](docs/sv_editSecrets.md) to secure and encrypt information such as DB passwords, tokens, and any proprietary data that your application needs.
* Always run `vagrant halt` to shutdown the environment prior to shutting down the host machine.

## Container Structure

Containers are written as standard Docker containers.

[sv-kubernetes-example-server](https://github.com/simpleviewinc/sv-kubernetes-example/tree/master/containers/server) - A functioning example container.

* Your docker container should be built in a way so that they ship functional for a remote environments, and then for local development directories can be mounted for the CMD/Entrypoint can be changed.
	* In practice this means that on local you might mount in a hot folder, but elsewhere the `Dockerfile` will compile the necessary resources.
* Seek to minimize the number of layers in your Dockerfile while also maximizing the cache re-use. This means placing the actions which rarely change high in your file, and the actions which frequently change lower in the file.
* If you are using a local mount, ensure that you are performing a COPY for that content so the Dockerfile works in non-local environments.

## Slack Notifications

The following are the recommended best practices for keeping your team notified about changes within a repository.

* Create/Use an existing channel within slack that is unique to your application. If possible, public is preferred, since you never know who might need notifications.
* Within that channel `/github subscribe simpleview/MY-APPLICATION` that will cause all github PRs, commits etc to notify the channel.
* Go into the CircleCI -> find the project -> click the settings gear next to the project -> Chat notifications.
	* Set the webhook URL to https://hooks.slack.com/services/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
	* Set the room to the slack channel you are using.
	* This will ensure that anyone subscribed to the channel will get notifications for each deployment and PR success via circle-ci.
* In your projects readme, include the name of the slack channel that people can use for being subscribed to notifications about your product.

## Running commands on Dev/Test Clusters
This section provides information on how to switch contexts to a dev/test cluster.
* Acquire access to the cluster by following the documentation [here] (https://wiki.simpleviewtools.com/display/DEVOPS/Acquiring+Access+to+Kubernetes+Cluster)
* Ensure you are running the latest version of `sv-kubernetes`
* Ensure you are gcloud authenticated by running this command in sv-kubernetes `sudo gcloud auth login`
* When on a non-local cluster, commands that alter the clusters state, such as `start` or `stop` must run through `helm tiller`.
	* Ex: `sudo sv start sv-graphql local` now becomes `sudo helm tiller run sv start sv-graphql local`.
	* This does not affect commands like `sudo sv logs` or `sudo sv enterPod` those can be run like normal.
* When on a non-local cluster `--build` will not work as expected, because it does not push the built container to the cloud, for the remote instance to grab it. If you need to alter the runtime state either do it via `sudo sv enterPod` or push a new build via the normal CI/CD.

*Related Commands*:
* [listProjects](docs/sv_listProjects.md)
* [switchContext](docs/sv_switchContext.md)
* [getContext](docs/sv_getContext.md)

# Other useful Docker/Kubernetes commands

* See all applications that are running - `sudo helm list`
* See all that's running - `sudo kubectl get all`
* See all that's running, including kubernetes system services - `sudo kubectl get all --all-namespaces`
* Start an application and see the compiled configs - `sudo sv start [app] [env] --dry-run --debug`
* Get a pods logs - `sudo kubectl logs [podname]`
* See minikube logs - `sudo minikube logs`
* See current config - `sudo kubectl config`
* See current context - `sudo kubectl config current-context`
* Run a container to debug - `sudo docker run -it image:tag`
* Run a container with a specific command - `sudo docker run -it image:tag /bin/bash`
* Enter a running container - `sudo kubectl exec -it [podName] /bin/bash`
* Describe the nodes of a kubernetes cluster - `sudo kubectl describe nodes`
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

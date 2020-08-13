# sv-kubernetes changelog

## 8/13/2020
* Adds `--github` flag to `sv install` for easily installing from a remote:branch for PR review.

## 05/19/2020
* Update Kubernetes version from 1.13.7 to 1.14.10

## 02/26/2020
* Update sv.js to contain new commands `sv switchContext`, `sv getContext` and `sv listProjects`.

## 01/20/2020
* Update vagrant box version from 201807.12.0 to 201912.14.0
* `sv logs` no longer requires passing `--filter`, it is now implied. So both `sudo sv logs sv-kubernetes-example` and `sudo sv logs --filter=sv-kubernetes-example` are valid.
* `sv logs` now supports multi-container pods.
* `sv enterPod` now supports multi-container pods.

## 12/05/2019
* Adds a weekly cron job to run the `docker system prune -f` command which cleans dangling images, containers, volumes and networks.
* This cron job runs on Friday's and only affects docker/kubernetes resources that are no longer used (dangling)

## 11/25/2019

* Fixes issue with images on pull requests being tagged incorrectly. Previously all images for pull requests were tagged as `:test` meaning that you could encounter race conditions between multiple pull requests. They now receive a unique name relative to the PR number, `:pull-NUM`. If you are using `{{ .Values.sv.tag }}` in your chart, then it should pick up the fix without change.
* `{{ .Release.Name }}` should not be used in Docker image tags, instead use `{{ .Chart.Name }}`. `{{ .Release.Name }}` is still recommended for naming for all kubernetes resources. The `{{ .Release.Name}}` changes depending on when the application boots in alias mode, such as for PRs where we support multiple variants of the same app in the same environment, while `{{ .Chart.Name }}` stays consistent for the application, so it's appropriate for using in a Docker image tag.
* Kubernetes secret template updated to utilize a `{{ .Release.Name }}` variable so that it works appropriately with Pull Requests. Pre-existing secrets should be updated to use the variable and wrap the whole value in `""` otherwise you may receive a decryption error.

## 11/11/2019

* Updates sv start to set `.Values.sv.dockerRegistry` to simplify building the docker image references in deployment files.
* Adds support for per env `settings.buildOrder`
	* Options now available in settings.yaml `buildOrder_live`, `buildOrder_qa`, `buildOrder_dev`, `buildOrder_test`
	* Env specific buildOrders overwrite the global `buildOrder` setting
* Building of containers will now log a date stamp with when they start and finish to help determine which containers are building slow.

## 10/24/2019

* Adds `sv fixDate` for resyncing the linux clock if it has drifted.

## 10/1/2019

* Adds `sv debug` for assisting in debugging purposes.
* Accessing help documentation for a command now requires `sudo sv [command] --help` since not all commands have arguments.

## 9/6/2019

* [#17](https://github.com/simpleviewinc/sv-kubernetes/pull/17) via Zeke - Adds `sv execPod` to run an arbitrary command on a running container. Updates `sv enterPod` so that it uses bash if available and falls back to sh if not.

## 9/5/2019

* The deployment system will now leverage docker layer caching.
* Images tagged for in the GCR used to be tagged with `ENV-VERSION` they are now just being tagged with `ENV` so an example would be `gcr.io/sv-shared-231700/sv-deploy-gce:dev`.

## 8/8/2019

* Upgrade Kubernetes from `1.11 -> 1.13.7`
* Increase box memory from `2 GB -> 4 GB`
* Increase box cpu from `1 cpu -> 2 cpus`
* Upgrade minikube version from `v0.30.0 -> v1.3.0`
* Upgrade kubectl version from `1.11.0 -> 1.13.7`
* Update minikube to use 2 CPUs

## 7/10/2019

* Breaking change to how secrets are managed. `secrets_key` must now be added to the settings.yaml. See the secrets docs for more info.

## 7/5/2019

* Adds ability to pass `--build-arg` to `sv start` to pass custom docker build args.
* `sv start` will now automatically pass a `SV_ENV=env` build arg to all builds allowing Dockerfile's to have conditional behavior based on the env. Please use this with caution as different builds based on environment, by definition, introduce differnces between environments.

## 5/8/2019

* Adds `sv restartPod` to restart one pod in an application.

## 4/30/2019

* In the test environment we can now run multiple pull requests at the same time by giving them each a unique application name via the `--alias` flag. If you need to know the name of the deployed app you can access the `sv.deploymentName` variable in your helm chart.

## 4/12/2019

* Adds support for applications to have dependencies to allow installing/updating an app and all of it's dependencies in one call.

## 4/10/2019

* Added support for `settings.buildOrder` for handling multi-step docker builds.
* Added support for `settings.dockerBase`.

## 4/3/2019

* Added `sv script` for executing scripts within your repositories.
* Added `sv copyFrom` for copying files out of running containers.

## 3/14/2019

* Adds a mechanic to verify if the sv-kubernetes installation is out of date, ran when executing `sv` commands.

## 3/13/2019

* Updates the `sv install` command to update a checkout if it already exists as well as support switching to the proper remote/branch.

## 3/5/2019

* Adds dnsmasq to sv-kubernetes to improve performance of building docker containers and dns lookups OUTSIDE the kubernetes env.

## 3/1/2019

* Attempts to fix DNS delay issues by utilizing a kube-dns config map to bypass the VirtualBox dns routing which appears to cause delays.

## 2/11/2019

* `sv-local-proxy` is now `sv-kube-proxy` since it will be utilized in other environments to handle proxying requests and SSL termination.

## 1/27/2019

* `sv test` now requires the container to have `metadata.annotations.sv-test-command` to declare the test command.

## 1/17/2019

* Changes the way the github authentication works. Previously it was using the token, now it's using the ssh key file to allow submodules to work better.

## 11/28/2018

* Switching from utilizing separate repos for each container and moving to put the container repo within the application folder.
* Deprecated the `settings.yaml` capability, it is no longer required based on moving the repos.

## 11/15/2018

* sv-kubernetes system refactored to built on a Ubuntu box instead of Centos.
* Build scripts re-engineered so that the main `setup.sh` can be executed multiple times to update all necessary pieces.
* Build scripts split into sub-scripts to allow them to be executed individually when the time arises.
* `settings.yaml` file can now be placed in the root of your application helm repo and specify an array of containers. Each container will be cloned down on a `sv install`, in addition the containers can be auto-build when running `sv start`
* `sv restart` removed and replace with `--build`.
* `sv start app env --build` will now build all containers specified in the `settings.yaml` file.
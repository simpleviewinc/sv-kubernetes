# sv-kubernetes changelog

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
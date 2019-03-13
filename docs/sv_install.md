Usage: sudo sv install [name]

Checks out a repository from a specific remote/branch. It will not start the application, you still need to build/start depending on your goal.

If the repository is already checked out, it will update it to the desired remote, branch and perform a git pull.

## Supported Flags

* `--type` - default `app` - `app` or `container` - Whether the repo being checked out is an app to checkout to `/sv/applications/` or a container to checkout to `/sv/containers/`.
* `--branch` - default `master` - The name of the branch to checkout.
* `--remote` - default `origin` - The name of the remote fork to utilize.

Example:
```
# install an application
sudo sv install sv-kubernetes-example-app
# install a container repo
sudo sv install sv-local-proxy-server --type=container
# install a develop branch from a remote
sudo sv install sv-kubernetes-example-app --remote=mkes99 --branch=develop
```
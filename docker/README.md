# SV Kubernetes in Docker

Running sv-kubernetes using Docker Desktop requires the following
features and systems:

* [WSL v2](../readme_wsl.md#install-wsl)
* [Docker Desktop WSL2 backend](../readme_wsl.md#install-docker-engine)
* [sv-kubernetes] github repo checked out to `C:\sv-kubernetes`
* Local admin permissions (ability to run sudo and install softwares)
* A `github_key` stored at `~/.ssh/github_key` (mode 600)


## Run sv-kubernetes container

Run `bash docker/install.sh` to build and run the
`sv-kubernetes` container.

At the end of the setup, it will ask you to go through the Google Cloud
authentication process. If you skipped it you can reconnect at any time
by running `gcloud auth login --update-adc --no-launch-browser` in the
container.


## Usage

An bash `alias` is automatically added to `~/.bashrc` during the
installation so that you can use `sv [CMD]` seamlessly.



[sv-kubernetes]: https://github.com/simpleviewinc/sv-kubernetes

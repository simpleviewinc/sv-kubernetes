# Mac Installation

Running sv-kubernetes MacOS (ARM64) requires the following features and systems:

* Unix Terminal setup to use Bash shell
* Ability to run sudo in Terminal and install software as Admin.
* Git installed and accessible in Terminal
* Docker Engine - See instructions below for installation.


## Checkout Repo

```
cd /Users/Shared
git clone git@github.com:simpleviewinc/sv-kubernetes.git
cd sv-kubernetes
git checkout develop
```


## Setup Environment

In Terminal:

```
sudo bash /Users/Shared/sv-kubernetes/scripts/unix_init.sh ${USER} && . ~/.bash_aliases
```

and it should output `Success` at the end.

* Note: If the script prompted you to create a `github_key` you will need to upload it to Github so that it can be utilized.
    * The Github docs are located [Here](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account?platform=linux&tool=webui)
    * Remember your public keyfile is named `github_key.pub` and not id_ed25519.pub so you’ll need to adjust the instructions.
    * The name of the key in Github's UI doesn’t technically matter, but the best practice is to name it with the use-case, so sv-kubernetes might be practical.

After installation, you need to login to gcloud. Enter SV Kubernetes container by running `sv-kube-enter` and then run `gcloud auth login --update-adc --no-launch-browser`.


## Install Docker Engine

[Click here](https://docs.docker.com/desktop/setup/install/mac-install/) to download the latest version of **_Docker Desktop for Mac with Apple silicon_**.

After installation, follow the instructions to [Enable Kubernetes](https://docs.docker.com/desktop/features/kubernetes/#install-and-turn-on-kubernetes).

At the bottom of the screen in docker desktop you should see `Engine Running` and `Kubernetes Running`.


## Usage

From here install and start the repos you desire:

* `sv install REPO`
* `sv start REPO local --build`


## Debugging

* `Improper line endings`
    * Your sv-kubernetes repository is improperly cloned and the line endings are being converted. You need to ensure that the getting setting `core.autocrlf=false` and then delete and re-clone the repository.
* Is Docker Desktop running?
    * Start it, ensure that it says Engine Running and Kubernetes Running in the bottom left. If it doesn't, check the Docker Engine installations steps above.
* Is the WSL using the proper IP address?
    * In windows command prompt run `ifconfig`. There should be an entry for `lo0:` with `inet 192.168.50.100`. If it is not, then you need to ensure you ran `unix_init.sh`. Re-run that script as Admin, and then reboot.
* `hostPort` entries are failing because a low port cannot be used.
    * When use hostPort you can also declare the service as of `type: LoadBalancer` and do not declare an IP address. It will still be accessible at the main `192.168.50.100:PORT`.

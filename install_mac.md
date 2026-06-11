# Mac Installation

Running sv-kubernetes MacOS (ARM64) requires the following features and systems:

* Unix Terminal running either Bash or Zsh.
* Ability to run sudo in Terminal and install software as Admin.
* Git installed and accessible in Terminal
* Docker Engine - See instructions below for installation.


## Checkout Repo

```
git clone https://github.com/simpleviewinc/sv-kubernetes.git && cd sv-kubernetes
```


## Install Docker Engine

[Click here](https://docs.docker.com/desktop/setup/install/mac-install/) to download the latest version of **_Docker Desktop for Mac with Apple silicon_**.

After installation, enable Kubernetes. **IMPORTANT: Choose the `kubeadm` provisioner before turning Kubernetes on** — this is required for sv-kubernetes:

1. Open Docker Desktop **Settings → Kubernetes**.
2. Under **Cluster settings**, select **`kubeadm`** as the provisioner (do NOT use `kind`).
3. Check **Enable Kubernetes** and click **Apply & restart**.

At the bottom of the screen in docker desktop you should see `Engine Running` and `Kubernetes Running`.


## Setup Environment

From the repository root (where you ran `cd sv-kubernetes` above):

```
sudo bash scripts/unix_init.sh ${USER} && . ~/.bash_aliases
```

and it should output `Success` at the end. The `&& . ~/.bash_aliases` loads the `sv` aliases into your current shell. The script also wires the aliases into both `~/.bash_profile` and `~/.zshrc`, so they persist whether you use Bash or Zsh in new terminals.

* Note: If the script prompted you to create a `github_key` you will need to upload it to Github so that it can be utilized.
    * The Github docs are located [Here](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account?platform=linux&tool=webui)
    * Remember your public keyfile is named `github_key.pub` and not id_ed25519.pub so you’ll need to adjust the instructions.
    * The name of the key in Github's UI doesn’t technically matter, but the best practice is to name it with the use-case, so sv-kubernetes might be practical.


## Usage

`sv-kube-enter` builds (first run only) and drops you into the CLI container; the `sv` commands below all run inside it.

```
# Enter the CLI container. The first run builds the image and can take a while.
sv-kube-enter

# Authenticate gcloud for Application Default Credentials (used to decrypt secrets),
# then authenticate the sv tooling.
gcloud auth login --update-adc --no-launch-browser # use your simpleviewinc.com account
sv authLogin # use your dc.gdi account

# Install and start the proxy and cms-kube.
sv install cms-kube --branch=staging
sv start sv-kube-proxy local --build
sv start cms-kube local --build

# Wait until every pod reports READY n/n.
kubectl get all

# Enter the cms-kube pod and set up the client.
sv enterPod cms-kube
sv setupClient rc
sv startClient rc
```

To install and start any other repo, the general form is:

* `sv install REPO`
* `sv start REPO local --build`


## Debugging

* `Improper line endings`
    * Your sv-kubernetes repository is improperly cloned and the line endings are being converted. You need to ensure that the getting setting `core.autocrlf=false` and then delete and re-clone the repository.
* Is Docker Desktop running?
    * Start it, ensure that it says Engine Running and Kubernetes Running in the bottom left. If it doesn't, check the Docker Engine installations steps above.
* Services at `192.168.50.100:PORT` are unreachable.
    * `unix_init.sh` adds a loopback alias for `192.168.50.100` on `lo0`. Confirm it exists by running `ifconfig lo0` in Terminal — you should see an `inet 192.168.50.100` entry. If it is missing, re-run `unix_init.sh` (with `sudo`) and reboot.
* `hostPort` entries are failing because a low port cannot be used.
    * When use hostPort you can also declare the service as of `type: LoadBalancer` and do not declare an IP address. It will still be accessible at the main `192.168.50.100:PORT`.

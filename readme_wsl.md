# WSL Installation and Management

Running sv-kubernetes via the WSL requires the following features and systems:

* WSL v2 - See intructions below for installation.
* Docker Engine - See instructions below for installation.
* Ability to run CMD prompt as Admin and install software as Admin.
* sv-kubernetes github repo checked out to C:/sv-kubernetes
* A `github_key` stored at `C:\Users\your.username\.ssh\github_key`

## Install WSL

If you do not have the WSL installed on your machine run the following in a command prompt in Admin mode:

```
wsl --install
```

1. After running `wsl --install` the very first time it will ask to reboot your computer.
2. After reboot, browse to C:\sv-kubernetes\scripts\wsl_regedit.bat and right-click and select `Run as Administrator`.
3. Next in a command prompt, not as admin, run `wsl` and it will prompt a username and password, use `vagrant` for username and password. You should now be at a linux command prompt.
4. `exit` - Your wsl installation should be complete.

### Reinitializing your WSL distribution

If you want to reset your WSL distribution, run the following commands.

* `wsl --list` - determine the current installation that you want to reset. Do not reset your docker-desktop instance.
* `wsl --unregister InstallationName`
* `wsl --install Ubuntu`
* `wsl --set-default Ubuntu`
* `wsl` - Set username and password to `vagrant` and you should be good to go. `exit`.
* Proceed to the Setup WSL Instance section.

## Install Docker Engine

[Click here](https://docs.docker.com/desktop/setup/install/windows-install/) to download the latest version of Docker Engine. Use the installer method. When prompted choose `WSL 2 instead of Hyper-V`.

* After installation, `windows key`, search for docker, and start docker desktop.
* In the settings gear in the top-right:
    * Ensure that the `Use the WSL 2 based engine` is checked.
    * Resources -> WSL Ingration -> Ensure `Enabled integration with my default WSL distro` is checked.
    * Kubernetes -> Ensure `Enable Kubernetes` is checked.

At the bottom of the screen in docker desktop you should see `Engine Running` and `Kubernetes Running`.

## Setup WSL instance

Once all software is properly installed run

* `wsl -u root` - Always access the wsl as root from now on.
* `bash /mnt/c/sv-kubernetes/setup_wsl.sh` and follow the prompts
* `kubectl get all` should successfully complete, showing that there are no deployments running on your kubernetes instance.

## Usage

From here install and start the repos you desire:

* `sv install REPO`
* `sv start REPO local --build`

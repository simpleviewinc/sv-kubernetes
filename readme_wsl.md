# WSL Installation and Management

Running sv-kubernetes via the WSL requires the following features and systems:

* WSL v2 - See intructions below for installation.
* Docker Engine - See instructions below for installation.
* Ability to run CMD prompt as Admin and install software as Admin.
* sv-kubernetes github repo checked out to C:/sv-kubernetes
* A `github_key` stored at `C:\Users\your.username\.ssh\github_key`

## Install WSL

You need to configure the WSL on your machine.

1. Copy the `.wslconfig` from `sv-kubernetes/internal/.wslconfig` to `C:\Users\YOUR_NAME\.wslconfig`.
2. Open a CMD prompt as Admin, and run `wsl --install`, this will install all necessary components for you to run the wsl.
3. After running `wsl --install Ubuntu` the very first time it will ask to reboot your computer.
4. After reboot, browse to C:\sv-kubernetes\scripts\wsl_regedit.bat and right-click and select `Run as Administrator`.
5. Next in a command prompt, not as admin, run `wsl` and it will prompt a username and password, use `vagrant` for username and password. You should now be at a linux command prompt.
6. `exit` - Your wsl installation should be complete.

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
    * Kubernetes -> Ensure `Enable Kubernetes` is checked. If not checked, check it and click Apply & Restart.

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

## Debugging

* Is Docker Desktop running?
    * Start it, ensure that it says Engine Running and Kubernetes Running in the bottom left. If it doesn't, check the Docker Engine installations steps above.
* Is the WSL using the proper IP address?
    * In windows command prompt run `ipconfig`. There should be an entry for `Ethernet adapter vEthernet (WSL (Hyper-V firewall))` and it's IPv4 Address must be `192.168.50.100`. If it is not, then you need to ensure you ran the `wsl_regedit.bat` called out in the WSL install steps. Re-run that script as Admin, and then reboot.
* `Error: 0x80370102 The virtual machine could not be started because a required feature is not installed`
    * Open powershell as admin and run `bcdedit /set hypervisorlaunchtype Auto`.
* `hostPort` entries are failing because a low port cannot be used.
    * When use hostPort you can also declare the service as of `type: LoadBalancer` and do not declare an IP address. It will still be accessible at the main `192.168.50.100:PORT`.

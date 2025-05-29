# WSL Installation and Management

Running sv-kubernetes via the WSL requires the following features and systems:

* WSL v2 - See intructions below for installation.
* Docker Engine - See instructions below for installation.
* Ability to run CMD prompt as Admin and install software as Admin.
* sv-kubernetes github repo checked out to `C:\sv-kubernetes`
* A `github_key` stored at `C:\Users\your.username\.ssh\github_key`
* Enabled Virtual Machine Platform and Windows Subsystem Linux.

## Install WSL

You need to configure the WSL on your machine.

1. Check that necessary features are enabled. Hit the windows key and type in `Turn Windows Features on or off`. It should bring up a UI of checkboxes.
    * Ensure that both `Virtual Machine Platform` and `Windows Subsystem for Linux` are checked. If they are not checked, check them, they will install and your machine will reboot.
2. In CMD prompt as Admin:
    * `powershell C:\sv-kubernetes\scripts\windows_init.ps1` and it should output `Success` at the end.
3. In CMD prompt as Admin:
    * Run `wsl --version` you should be on at least `WSL version: 2.4.13.0`. If your version is older, you will need to update your wsl version. If you are on a newer version it likely will work ok, but it hasn't been officially tested. If the command `wsl --version` fails with an error saying that `wsl --version` doesn't exist, then you should update.
        * Download the proper version of wsl by clicking the following link: [Download WSL](https://github.com/microsoft/WSL/releases/download/2.4.13/wsl.2.4.13.0.x64.msi)
        * Once downloaded, run the file.
        * After complete, re-run command prompt and run `wsl --version` and ensure it's been updated.
    * Run `wsl --install --no-distribution`. You may be prompted to reboot, if so reboot and then continue after the reboot.
    * Run `wsl --install Ubuntu`
    * Run `wsl --set-default Ubuntu`.
    * Run `wsl`. It should boot the instance and enter into an Ubuntu console.
    * Run `exit`.

## Install Docker Engine

[Click here](https://docs.docker.com/desktop/setup/install/windows-install/) to download the latest version of Docker Engine. Use the installer method. Run the installer as administrator. When prompted choose `WSL 2 instead of Hyper-V`.

* After installation, `windows key`, search for docker, and start docker desktop.
* In the settings gear in the top-right:
    * Ensure that the `Use the WSL 2 based engine` is checked.
    * Resources -> WSL Ingration -> Ensure `Enabled integration with my default WSL distro` is checked.
    * Kubernetes -> Ensure `Enable Kubernetes` is checked. If not checked, check it and click Apply & Restart.
    * Under "Software Updates" uncheck "Automatically check for updates" and "Always download updates"

At the bottom of the screen in docker desktop you should see `Engine Running` and `Kubernetes Running`.

## Setup WSL instance

Once all software is properly installed run in non-admin CMD prompt:

* `wsl -u root` - Always access the wsl as root from now on.
* `bash /mnt/c/sv-kubernetes/setup_wsl.sh` and follow the prompts
* `kubectl get all` should successfully complete, showing that there are no deployments running on your kubernetes instance.

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
    * In windows command prompt run `ipconfig`. There should be an entry for `Ethernet adapter vEthernet (WSL (Hyper-V firewall))` and it's IPv4 Address must be `192.168.50.100`. If it is not, then you need to ensure you ran the `wsl_regedit.bat` called out in the WSL install steps. Re-run that script as Admin, and then reboot.
* `Error: 0x80370102 The virtual machine could not be started because a required feature is not installed`
    * Open powershell as admin and run `bcdedit /set hypervisorlaunchtype Auto`.
* `hostPort` entries are failing because a low port cannot be used.
    * When use hostPort you can also declare the service as of `type: LoadBalancer` and do not declare an IP address. It will still be accessible at the main `192.168.50.100:PORT`.

### Reinitializing your WSL distribution

If you want to reset your WSL distribution, run the following commands.

* `wsl --list` - determine the current installation that you want to reset. Do not reset your docker-desktop instance.
* `wsl --unregister InstallationName`
* `wsl --install Ubuntu`
* `wsl --set-default Ubuntu`
* `wsl`, ensure no errors on entry, `exit`.
* Proceed to the Setup WSL Instance section.

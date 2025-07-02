#!/bin/bash -l
set -e

if [[ -z "${1}" ]]; then
	echo "ERROR: User argument missing, run ${BASH_SOURCE[0]%/*} \${USER}"
	exit 1
fi
USERNAME="${1}"

if ! git --version 2>&1; then
	echo "ERROR: Git must be installed to proceed."
	exit 1
fi

SV_KUBERNETES_PATH=$(realpath $(dirname $(realpath ${BASH_SOURCE[0]}))/..)
ARCH=$(arch | sed s/aarch64/arm64/ | sed s/x86_64/amd64/)
if [[ "${ARCH}" == "arm64" ]]; then
	USER_PROFILE_DIR="/Users/${USERNAME}"
	INTERNAL_ENV_FILE=".env_mac"
else
	USER_PROFILE_DIR="/home/${USERNAME}"
	INTERNAL_ENV_FILE=".env_wsl"
fi

if [[ ! -d "${USER_PROFILE_DIR}" ]]; then
	echo "ERROR: User directory ${USER_PROFILE_DIR} does not exist"
	exit 1
fi

# Git configuration
if ! git config --global safe.directory; then
	git config --global safe.directory '*'
fi

if ! git config --global core.autocrlf false; then
	git config --global core.autocrlf false
fi

# SSH configuration
SSH_DIR="${USER_PROFILE_DIR}/.ssh"
mkdir -p "${SSH_DIR}"

# ensure we have a valid github_key
GITHUB_KEY_PATH="${SSH_DIR}/github_key"
if [[ ! -f "${GITHUB_KEY_PATH}" ]]; then
	echo "github_key does not exist, creating a new ssh key..."
	read -p "Enter your github user email address: " email
	ssh-keygen -t ed25519 -C ${email} -f ${GITHUB_KEY_PATH} -N ""
	echo "github_key created at ${GITHUB_KEY_PATH}, you will need to upload to github to ensure it's usable."
fi

# ensure we have the ssh config with our github_key
SSH_CONFIG_PATH="${SSH_DIR}/config"
if [[ ! -f "${SSH_CONFIG_PATH}" ]]; then
	cp ${SV_KUBERNETES_PATH}/internal/github/ssh_config ${SSH_CONFIG_PATH}
fi
chown -R ${USERNAME} ${SSH_DIR}

echo "Setting up network interfaces"
if [[ "${ARCH}" == "arm64" ]]; then
	if ! /sbin/ifconfig lo0 | grep -i 'inet 192.168.50.100'; then
		/sbin/ifconfig lo0 alias 192.168.50.100

		cat <<-'EOF' > /Library/LaunchDaemons/sv-kubernetes.ifconfig.plist
	<?xml version="1.0" encoding="UTF-8"?>
	<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
	<plist version="1.0">
	<dict>
		<key>Label</key>
		<string>sv-kubernetes.ifconfig</string>
		<key>RunAtLoad</key>
		<true/>
		<key>ProgramArguments</key>
		<array>
		<string>/sbin/ifconfig</string>
		<string>lo0</string>
		<string>alias</string>
		<string>192.168.50.100</string>
		</array>
	</dict>
	</plist>
	EOF

		launchctl enable system/sv-kubernetes.ifconfig
	fi
else
	echo "WARNING:"
	echo "You are trying to run sv-kubernetes in a Windows-based Unix system."
	echo "To reach micro-services you need to create the proper network alias"
	echo "by running the following in a PowerShell as Administrator:"
	echo
	echo '	netsh interface ipv4 add address "Loopback Pseudo-Interface 1" 192.168.50.100 255.255.255.255'
	echo
fi

echo "Copying user profile script"
if [[ "${ARCH}" == "arm64" ]]; then
	touch ${USER_PROFILE_DIR}/.bash_profile
	if ! grep -qi '. ~/.bash_aliases' ${USER_PROFILE_DIR}/.bash_profile; then
		echo 'if [ -f ~/.bash_aliases ]; then . ~/.bash_aliases; fi' >> ${USER_PROFILE_DIR}/.bash_profile
	fi
fi
ln -sfn ${SV_KUBERNETES_PATH}/scripts/unix_profile.sh ${USER_PROFILE_DIR}/.bash_aliases

cp ${SV_KUBERNETES_PATH}/internal/${INTERNAL_ENV_FILE} ${SV_KUBERNETES_PATH}/.env
sed -i -e '/SV_KUBERNETES_MOUNT_PATH=/d' ${SV_KUBERNETES_PATH}/.env
echo "SV_KUBERNETES_MOUNT_PATH=${SV_KUBERNETES_PATH}" >> ${SV_KUBERNETES_PATH}/.env

echo "Success"

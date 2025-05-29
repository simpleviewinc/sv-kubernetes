#Requires -RunAsAdministrator
$keyPath = "$Env:UserProfile\.ssh\github_key"
$githubKeyExists = Test-Path -Path $keyPath

if ($githubKeyExists -eq $false) {
	echo "ERROR: Github key at $keyPath does not exist, please ensure you have configured your environment correctly."
	exit 1
}

echo "Setting up network interfaces"
netsh interface ipv4 add address "Loopback Pseudo-Interface 1" 192.168.50.100 255.255.255.255
echo "Copying .cloud-init config"
New-Item -ItemType Directory -Force -Path C:\Users\$Env:UserName\.cloud-init | Out-Null
copy $PSScriptRoot\..\internal\Ubuntu.user-data C:\Users\$Env:UserName\.cloud-init\Ubuntu.user-data
echo "Success"

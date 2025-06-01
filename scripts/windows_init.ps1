#Requires -RunAsAdministrator
try {
	$gitVersion = git --version 2>&1
} catch {
	echo "ERROR: Git must be installed to proceed."
	exit 1
}

# show file extensions by default
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" -Name "HideFileExt" -Value 0

# show hidden files by default
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" -Name "Hidden" -Value 1

# enable the old-school context menu to see all available options without needing to click to see everything
New-Item -Path "HKCU:\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32" -Force | Out-Null
New-ItemProperty -Path "HKCU:\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32" -Name "(default)" -Value "" -PropertyType String -Force | Out-Null

$safeDirectory = git config --global safe.directory
if (-not $safeDirectory) {
	git config --global safe.directory *
}

$crlf = git config --global core.autocrlf false
if (-not $crlf) {
	git config --global core.autocrlf false
}

# ensure we have the .ssh folder
$sshPath = "$Env:UserProfile\.ssh"
New-Item -ItemType Directory -Force -Path $sshPath | Out-Null

# ensure we have a valid github_key
$keyPath = "$sshPath\github_key"
$githubKeyExists = Test-Path -Path $keyPath

if ($githubKeyExists -eq $false) {
	echo "github_key does not exist, creating a new ssh key..."
	$email = Read-Host "Enter your github user email address"
	ssh-keygen -t ed25519 -C $email -f $keyPath -P '""'
	echo "github_key created at ${keyPath}, you will need to upload to github to ensure it's usable."
}

# ensure we have the ssh config with our github_key
$sshConfigPath = "$sshPath\config"
if ((Test-Path -Path $sshConfigPath) -eq $false) {
	copy $PSScriptRoot\..\internal\github\ssh_config $sshConfigPath
}

echo "Setting up network interfaces"
netsh interface ipv4 add address "Loopback Pseudo-Interface 1" 192.168.50.100 255.255.255.255

echo "Copying .cloud-init config"
New-Item -ItemType Directory -Force -Path $Env:UserProfile\.cloud-init | Out-Null
copy $PSScriptRoot\..\internal\Ubuntu.user-data $Env:UserProfile\.cloud-init\Ubuntu.user-data

Write-Output "Copying user profile script"
$psProfileDir = "$Env:UserProfile\Documents\WindowsPowerShell"
New-Item -ItemType Directory -Force -Path $psProfileDir | Out-Null
New-Item -ItemType SymbolicLink -Path $PROFILE -Target "$PSScriptRoot\windows_profile.ps1" -Force | Out-Null

echo "Success"

$destDir = Join-Path $Env:UserProfile '.cloud-init'
New-Item -ItemType Directory -Path $destDir -Force | Out-Null
Copy-Item -Path 'C:\sv-kubernetes\internal\Ubuntu.user-data' -Destination (Join-Path $destDir 'Ubuntu.user-data') -Force

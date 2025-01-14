reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Lxss" /v NatGatewayIpAddress /d 192.168.50.100 /f
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Lxss" /v NatNetwork /d 192.168.50.0/24 /f
@pause

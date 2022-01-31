#!/usr/bin/env bash

touch /etc/profile.d/http_proxy.sh
echo "export CERT_PASSWORD_SV_MISC=>>>MODIFY-TOKEN-HERE<<<" > http_proxy.sh
sudo mv http_proxy.sh /etc/profile.d/http_proxy.sh

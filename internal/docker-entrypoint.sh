#!/bin/bash -l
set -e

chmod 600 /root/.ssh/config
chmod 600 /root/.ssh/github_key
chmod 600 /root/.kube/config
mkdir -p /root/.config
ln -sfn /sv/internal/gcloud /root/.config/gcloud

# `exec` is used here to replace the parent process
# so our application receives any sent signals
exec $@

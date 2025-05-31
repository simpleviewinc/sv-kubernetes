#!/bin/bash -l
set -e

chmod 600 /root/.ssh/github_key

# `exec` is used here to replace the parent process
# so our application receives any sent signals
exec $@

#!/bin/bash -l
set -e

export GOOGLE_APPLICATION_CREDENTIALS=/tmp/service_key

# `exec` is used here to replace the parent process
# so our application receives any sent signals
exec $@

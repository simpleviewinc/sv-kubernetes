#!/bin/bash -l
set -e

# `exec` is used here to replace the parent process
# so our application receives any sent signals
exec $@

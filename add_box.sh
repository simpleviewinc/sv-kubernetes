#!/bin/bash
. ./scripts/platform_lookup.sh
BOX_BUILD_DIR=output-sv-kubernetes-arm64

if [[ "${PLATFORM}" = "arm64" ]]; then
    # Add Vagrant box
    vagrant box add "${BOX_BUILD_DIR}/package.box" --name owenallenaz/sv-kubernetes-arm64 --force
else
    vagrant box add output-sv-kubernetes/package.box --name owenallenaz/sv-kubernetes --force
fi

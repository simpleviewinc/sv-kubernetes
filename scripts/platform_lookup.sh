#!/bin/bash
PLATFORM=$(uname -m)
PLATFORM=${PLATFORM//aarch64/arm64}
PLATFORM=${PLATFORM//x86_64/amd64}
if [[ -z "${PLATFORM}" ]]; then
    PLATFORM=amd64
fi

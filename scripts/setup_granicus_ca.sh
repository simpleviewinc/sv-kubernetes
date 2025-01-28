#!/bin/bash
BASHRC_PATH=/home/vagrant/.bashrc
GRANICUS_CA_PATH=/usr/local/share/ca-certificates/netskope.crt

function add_or_replace_export() {
    if [[ -n "${1}" ]]; then
        grep -q "^export ${1} =" ${BASHRC_PATH} \
            && sed -i "s,${1}=.*,${1}=${GRANICUS_CA_PATH}," ${BASHRC_PATH} \
            || echo "export ${1}=${GRANICUS_CA_PATH}" >> ${BASHRC_PATH}
    fi
}

## Install Granicus CA certificates
apt update
apt install -y ca-certificates
cp /mnt/c/sv-kubernetes/internal/ssl/*.crt ${GRANICUS_CA_PATH%/*}/
update-ca-certificates

add_or_replace_export NODE_EXTRA_CA_CERTS

. ${BASHRC_PATH}

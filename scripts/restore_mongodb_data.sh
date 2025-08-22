#!/bin/bash

## NOTE: AUT-2179
# This current script does not work on Apple Silicon MacOS!
# For some reasons, the volume is not mounted on the VM and
# therefore cannot be restored to the remote folder.
##

MONGODB_DATA_DIR=${MONGODB_DATA_DIR:-/var/lib/docker/volumes/minikube/_data/lib/cms-mongo-local-mongodb-data}
LOCAL_DATA_DIR=/sv/mongodb_data_local

MONGODB_DEPLOYED=$(kubectl get deployment cms-mongo-local-mongo)
MONGODB_STATUS=$?

if [[ "${MONGODB_STATUS}" -eq 0 ]]
then
    echo -n "Stopping MongoDB service... "
    SV_STOP=$(sv stop cms-mongo-local)
    echo "done"
fi

echo -n "Restoring data to ${MONGODB_DATA_DIR}... "
rm -rf ${MONGODB_DATA_DIR}
cp -rp ${LOCAL_DATA_DIR} ${MONGODB_DATA_DIR}
echo "done"

if [[ "${MONGODB_STATUS}" -eq 0 ]]
then
    echo -n "Starting MongoDB service... "
    SV_START=$(sv start cms-mongo-local local --build)
    echo "done"
fi

Usage: sudo sv copyFrom [pod] [pathFrom] [pathTo]

Copies a file out of a running container. `pathFrom` should be the path inside the container and `pathTo` is the path on your local machine.

* Pass `--container`, alias `-c`, in order to copy from a specific container in a multi-container pod.

Example:
```
# copy the package-lock.json file out of the sv-auth-graphql container
sudo sv copyFrom sv-auth-graphql /app/package-lock.json /sv/applications/sv-auth/containers/graphql/package-lock.json
# copy the package-lock.json file out of the sv-redirects-server container inside a multi-container pod
sudo sv copyFrom sv-redirects-server -c utils /app/package-lock.json /sv/applications/sv-redirects/containers/utils/package-lock.json
```
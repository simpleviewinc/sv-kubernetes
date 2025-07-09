Usage: sudo sv copyTo [pod] [pathFrom] [pathTo]

Copies a file out of a running container. `pathFrom` should be the path inside the container and `pathTo` is the path on your local machine.

* Pass `--container`, alias `-c`, in order to copy from a specific container in a multi-container pod.

Example:
```
# copy the package-lock.json file out of the sv-auth-graphql container
sudo sv copyTo sv-auth-graphql /sv/applications/sv-auth/containers/graphql/package-lock.json /app/package-lock.json
# copy the package-lock.json file out of the sv-redirects-server container inside a multi-container pod
sudo sv copyTo sv-redirects-server -c utils /sv/applications/sv-redirects/containers/utils/package-lock.json /app/package-lock.json
```

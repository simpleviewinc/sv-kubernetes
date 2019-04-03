Usage: sudo sv copyFrom [container] [pathFrom] [pathTo]

Copies a file out of a running container. `pathFrom` should be the path inside the container and `pathTo` is the path on your local machine.

Example:
```
# copy the package-lock.json file out of the sv-auth-graphql container
sudo sv copyFrom sv-auth-graphql /app/package-lock.json /sv/applications/sv-auth/containers/graphql/package-lock.json
```
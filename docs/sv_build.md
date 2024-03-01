Usage: sudo sv build [container]

Build a container from a folder located in your /containers/ folder.

Will result in a local docker image being tagged [container]:local

## Supported Flags

* `--app` - If building an application's container, specify the name of the app.
* `--name` - The name of the container.
* `--pushTag` - If passed it will append this tag and attempt a docker push on that tag.
* `--build-arg` - If passed the build-arg will be passed to the Dockerfile. Pass multiple times for multiple values.

Example:
```
# build the container in /applications/sv-kubernetes-example-app/containers/server/
sudo sv build --app=sv-kubernetes-example-app --name=server
# build a stand-alone container repo at /containers/server/
sudo sv build --name=server
```
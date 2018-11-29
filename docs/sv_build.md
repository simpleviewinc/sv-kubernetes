Usage: sudo sv build [container]

Build a container from a folder located in your /containers/ folder.

Will result in a local docker image being tagged [container]:local

Example:
```
# build the container in /applications/sv-kubernetes-example-app/containers/server/
sudo sv build --app=sv-kubernetes-example-app --name=server
# build a stand-alone container repo at /containers/server/
sudo sv build --name=server
```
Usage: sudo sv build [container] [tag]

Build a container from a folder located in your /containers/ folder.

Will result in a local docker image being tagged [container]:[tag]

Kubernetes does not support the 'latest' tag locally, so it is disallowed.

Example:
```
sudo sv build test-container test
```
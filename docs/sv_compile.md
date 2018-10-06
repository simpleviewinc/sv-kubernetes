Usage: sudo sv compile [container] [--optionA=a --optionB=b]

**Do not run this command unless you want to push a container a remote container registry**

Compile a container on your local machine and push to the container registry, defaults to the Google Container Registry.

The compiled image will be placed in the registry and tagged with `BRANCH_NAME-VERSION` in example `master-1.0.0`.

## Supported Flags

* `--project_id` - `--project_id=sv-shared` - Defaults to `sv-shared`. Push to the GCR of a specific project.
* `--branch_name` - `--branch_name=master` - Defaults to `master`. The branch name of the container being compiled. Will be included in the default tag.
* `--tags` - `--tags=latest` - Defaults to `undefined`. Additional tags to apply, such as `latest`.
* `--image` - Defaults to the GCR registry. Pass your own to utilize another.

Example:
```
sudo sv compile sv-kubernetes-example-container
sudo sv compile sv-kubernetes-example-container --project_id=sv-crm --branch_name=develop --tags=latest --image=sv-compile-container:local
```
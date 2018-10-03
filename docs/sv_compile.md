Usage: sudo sv compile [container] [--optionA=a --optionB=b]

**Do not run this command unless you want to push a container to the GCR**

Compile a container on your local machine and push to the Google Container Registry.

By default every repo will be placed in the GCR and tagged with `BRANCH_NAME-VERSION` in example `master-1.0.0`.

## Supported Flags

* `--project_id` - `--project_id=sv-shared` - Defaults to `sv-shared`. Push to the GCR of a specific project.
* `--branch_name` - `--branch_name=master` - Defaults to `master`. The branch name of the container being compiled. Will be included in the default tag.
* `--tags` - `--tags=latest` - Defaults to `undefined`. Additional tags to apply, such as `latest`.

Example:
```
sudo sv compile sv-kubernetes-example-container
sudo sv compile sv-kubernetes-example-container --project_id=sv-crm --branch_name=develop --tags=latest
```
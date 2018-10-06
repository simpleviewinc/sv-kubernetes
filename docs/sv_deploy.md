Usage: sudo sv compile [applicationName] [--optionA=a --optionB=b]

**Do not run this command unless you want to push an app to a remote Kubernetes**

Deploy an application on your local machine to a remote kubernetes.

## Supported Flags

* `--project_id` - `--project_id=sv-shared` - Defaults to `sv-shared`. Push to the GCR of a specific project.
* `--cluster` - `--cluster=dev` - The name of the kubernetes cluster.
* `--env` - `--env=dev` - The environment to utilize for the application.
* `--image` - The image to use for the deployment, defaults to the GCE Kubernetes image.

Example:
```
sudo sv deploy sv-kubernetes-example-app --project-id=sv-shared --cluster=dev --env=dev
sudo sv deploy sv-kubernetes-example-app --project-id=sv-shared --cluster=dev --env=dev --image=sv-deploy-kubernetes:local
```
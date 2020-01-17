Usage: sudo sv logs --filter=x --watch

Get kubernetes logs for pods which match a filter.

* For `--filter` you will want to pass the name of the deployment.
* For `--container` you will want to pass the name of the contianer for multi container pods.
* For `--watch` it will listen to the current and future iterations on that deployment.

Example:
```
# get logs for the pods of a deployment
sudo sv logs --filter=sv-kubernetes-example-app
# get logs for a container of a single pod deployment
sudo sv logs --filter=sv-redirects-server --container=graphql-v1
# get logs and follow 
sudo sv logs --filter=sv-kubernetes-example-app --watch
# get logs for a container of a single pod deployment and follow
sudo sv logs --filter=sv-redirects-server --container=graphql-v1 --watch
```
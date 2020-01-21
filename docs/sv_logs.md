Usage: sudo sv logs [applicationName|applicationName-podName] --watch

Get kubernetes logs for pods which match a filter.

## Supported Flags

* For `--container` (`-c`), to specify a single container within a multi container pods.
* For `--watch` it will listen to the current and future iterations on that deployment.

Example:
```
# get logs for the pods of a deployment
sudo sv logs sv-kubernetes-example-app
# get logs for specific container in any pod
sudo sv logs sv-redirects -c graphql-v1
# get logs for specific container in a specific pod
sudo sv logs sv-redirects-server -c graphql-v1
# get logs and follow 
sudo sv logs sv-kubernetes-example-app --watch
```
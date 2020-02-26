Usage: sudo sv switchContext -p [project] -c [cluster]

Switch Kubernetes Context for Minikue & GKE Clusters

* Pass `--cluster` to switch between [dev|test|local] clusters. 
* Pass `--project` in order to select the GCP project you'd like to switch contexts to [devops|sv-shared|etc.]. 
	* Note: --project is not required for the local cluster and is ignored

> You must have a role on the GKE cluster in order to switch contexts.
> Contact DEVOPS before running this command for a GKE resource.
> In general, developers are only granted access to dev/test clusters. If you need access to other clusters, please reach out to devops.

Example:
```
# switch to local context
sudo sv switchContext -c local
# switch to a gke cluster
sudo sv switchContext -c dev -p devops
```
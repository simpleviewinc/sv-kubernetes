# Persistent Storage

This article covers different techniques for persistent storage within a Kubernetes environment. There isn't a one-sized fits all answer as every approach has pros and cons. The following are our recommended methods for storing files. There are some key considerations when determining what form of storage to use. Before looking at the types of storage, consider these questions.

* How many different pods/containers within my application are reading/writing the data?
* Do other applications need to be able to read/write data?
* Does the data need to be accessible only within one environment (dev, qa, live) or across environments (e.g. dev env accesses live data)?
* Do different readers/writers have different permissions?
* How often is the data read? How often is it written?
* What are the performance tolerations on read and write?
* Does your application need access to shared data at ALL times or only at a specific life-cycle moment? In example, do you just need the data just at init and never again, or do you need to continually read/write throughout the life of the Pod.

**Given that persistent storage is complex, our recommendation is that you contact DEVOPS prior to picking a persistent technology so we can help you determine the right solution for your application's needs.**

## Persistent Disk

Using Kubernetes [gcePersistentDisk](https://kubernetes.io/docs/concepts/storage/volumes/#gcepersistentdisk) attaches a GCP disk to a specific Host box in the Kubernetes cluster, it then exposes that disk to your Pod. The attached disk will behave like a native linux disk in everyway. While this may seem like the obvious solution, there are some important limitations to this approach in Kubernetes.

* Pros
    *  Easy to access storage behaves like a normal linux disk.
    *  Viable for high-read/high-write workloads like hosting a database.
* Cons
    * A GCP disk can only be attached to **one** kubernetes Node at a time. Most of our kubernetes clusters consist of 2 nodes and as we scale the system out will likely become more than 2 nodes. So if your application has a Deployment with replicas, then ALL of the replicas for that deployment must be hosted on the same Node. Normally, kubernetes distributes the replicas for a Pods across all nodes to spread the load so it would place 2 replices on one Host-1 and 2 replicas on Host-2. This is not possible if a persistent disk is required, Kubernetes would need to mount all 4 replicas to the same Host, but that may have negative affects on application fault tolerance/scalability.
    * Your application will need appropriate taints/tolerances/targetting to ensure that the Pod needing the disk is always allocated to the host machine with the disk attached.
    * In some Kubernetes update scenarios, there may be unavoidable downtime because the disk cannot be attached to two Hosts at once preventing Kubernetes from running the old app and the new app simultaneously (as usually occurs during most zero-downtime deployments).
    * The data cannot be accessed by other environments, projects, unless they are hosted on the exact same Kubernetes Host.

### Installation/Usage

1. Contact DEVOPS to provision a disk.
2. Update Chart to include the new provisioned disk via a standard mount.

## NFS

Simpleview has an network file server (NFS) hosted in every Kubernetes environment, which can be accessed by any project that needs it. It is running at all times, and applications can connect to it once they submit a request to DEVOPS. It provides a behavior that is similar to a native linux disk, but has a couple caveats.

* Pros
    * Can read/write for any number of Pods and Applications (including outside your clusters).
    * Performance is slower than a native disk, but not by a lot. In general the performance is directly coupled to the size of the files being transfered, not the number of reads. Reading tiny files will perform nearly identical to a native disk. Reading large files will be slower than native disks due to transfer cost.
    * In live and qa environments this is using [Google Cloud Filestore](https://cloud.google.com/filestore) to ensure high availability. In other environments to reduce costs, we are powering it with an sv-kubernetes application [sv-nfs](https://github.com/simpleviewinc/sv-nfs).
* Cons
    * Can only read/write from within the **same environment**. This means that qa can read from qa, and live can read from live, but qa could not read from live.
    * File-system events do not function like a native disk. You cannot lock files or watch files like a native linux disk.
    * Can only be read from within the sv-kubernetes VPC (virtual private cloud). The NFS server cannot be connected it outside of the GCP projects that make up our VPC.
    * Not possible to permission out specific files/folders/projects to specific users. All content is available to someone connected to the NFS.

### Installation/Usage

1. Contact DEVOPS to provision a folder on the NFS servers for your project.
2. Add the NFS mount to your deployment file by adding the following two parts.
    ```
    # Mount to application at /app/nfs
    - name: nfs
      mountPath: "/app/nfs"
      subPath: {{ .Release.Name }}
    # Create a mount for NFS
    - name: nfs
      nfs:
        server: 1.2.3.4
        path: /sv_nfs_{{ .Values.sv.env }}
    ```
    * See the functioning example at [sv-kubernetes-example](https://github.com/simpleviewinc/sv-kubernetes-example) for where to add that code.

## GCP Bucket

Using [gcsfuse](https://cloud.google.com/storage/docs/gcs-fuse) you can mount a [GCP Storage Bucket](https://cloud.google.com/storage/docs) as a linux file system. It allows you to read and write like they are normal files and folders, but those actions are persisted into a storage bucket hosted in the Google Cloud.

* Pros
    * Can read/write from any system anywhere, including within Kubernetes and outside of Kubernetes. This also mean the data can be read/write across all environments and projects.
    * Ability to grant read/write/admin access to specific Google users and service accounts. This means some users can read, while others can admin.
* Cons
    * Performance is significantly worse than the other methods. Read performance is between 1 - 100ms per read. Write performance is between 1000ms and 2000ms per write. In practice, reads are comparable to NFS, but writes are 100x to 1000x slower than NFS. For read-heavy applications, there are techniques to get native disk read performance via rsync or caching. There is no way to improve the write performance.
    * File-system events do not function like a native disk. You cannot lock files or watch files like a native linux disk.

### Installation/Usage

1. Contact DEVOPS to provision the buckets that your system will require and which service accounts/users should be granted access to those buckets and what access each should be granted (read/write/admin). If your application does not have secrets setup or a service account, please ensure DEVOPS handles this as well.
1. Download the `gcs_mount.sh` from the sv-kubernetes-example pull request and place it in your container's code. This file will handle mounting the bucket with some reasonable defaults and error handling.
1. In a container that needs to mount the bucket, update the `Dockerfile` to install `gcsfuse`. See the [installation instructions](https://github.com/GoogleCloudPlatform/gcsfuse/blob/master/docs/installing.md) provided by Google.
1. Update the `Dockerfile` so that the `CMD` now runs `CMD ["bash", "-c", "./gcs_mount.sh && YOUR_PREVIOUS _COMMAND"]`. Basically we need to run the gcs_mount bash file prior to executing your command. If it gets intricate you can also create an `init.sh` which contains the `./gcs_mount.sh` command AND your command. One key caveat is that gcs_mount.sh **must be run by** `bash`, if you attempt to run under `sh` it will not work due to line endings complications in the SERVICE_ACCOUNT_JSON strings.
1. Update deployment to specify env config values. Most applications just need the required keys defined.
    * SERVICE_ACCOUNT_JSON (required) - The service account for your application that will be used for granting permissions. If you need to use **different** credentials for your main app and the bucket, you can specify SV_GCS_MOUNT_CREDENTIALS to have the system read from a different ENV value.
    * SV_GCS_MOUNT_DIR (required) - The directory where the bucket will be mounted.
    * SV_GCS_MOUNT_BUCKET (required) - The name of the bucket (not the url, just it's name).
    * SV_GCS_MOUNT_KEYPATH (optional) - default `/var/lib/google_credentials.json` - Specify this key only if there is a reason the creds cannot be stored in the default location.
    * SV_GCS_MOUNT_CREDENTIALS (optional) - default `SERVICE_ACCOUNT_JSON`. This is the name of the ENV value that stores the credentials that Google should use for mounting the bucket. At execution, the gcs_mount.sh file will copy the contents of this env value and store them at SV_GCS_MOUNT_KEYPATH to pass to `gcsfuse`.
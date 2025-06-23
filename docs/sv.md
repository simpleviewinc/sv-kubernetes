Usage: sudo sv [command]

Commands:
	authLogin             Authenticates the current user with auth and stores a refresh token for user in applications
	authToken             Generates an auth token from the stored refresh token stores it and echoes it to the user
	build                 Build a container and tag it
	copyFrom              Copy a file from a running container
	deleteEvicted         Delete all pods which are in a failed state from the cluster
	editSecrets           Edit/Create secret files
	enterPod              Enter a running container
	getContext            Get the current Kubernetes Context
	getSecretsGroups      Output all Google groups with permissions on a given applications secrets_key
	restartPod            Restart a running pod
	install               Install a application or container to your local machine
	listProjects          List available projects for use with switchContext
	logs                  Getting logging information for a set of pods
	logFailed             Output the logs for all failed container/initContainers running on the cluster
	script                Executes a script from an application repo
	start                 Start an Helm chart
	stop                  Stop a Helm chart
	switchContext         Switch between Kubernetes Contexts
	test                  Execute tests within running containers
	topPods               Display the memory and cpu req and usage for all pods
	minikubeSystemPrune   Cleans up all docker images, containers, networks that aren't being used in the minikube env

Run 'sudo sv [command] --help' for more information on that command

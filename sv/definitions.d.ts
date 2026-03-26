export interface GetCurrentPodsArgs {
	allNamespaces?:boolean
	name?: string
	filter?: (val: PodResult) => boolean
	container?: string
}

export interface Container {
	name: string
	resources?: {
		requests?: {
			cpu?: string
			memory?: string
		}
	}
}

export interface ContainerStatus {
	name: string
	imageID: string
	ready: boolean
	lastState: {
		terminated?: ContainerState
	}
	state: {
		terminated?: ContainerState
		running?: ContainerState
	}
}

export interface ContainerState {
	startedAt: string
	reason?: string
	exitCode?: number
}

export interface PodRaw {
	metadata: {
		name: string
		namespace: string
		annotations: { [key: string]: string }
		deletionTimestamp: string
	}
	spec: {
		nodeName: string
		containers: Container[]
		initContainers?: Container[]
	}
	status: {
		podIP: string
		phase: string
		reason: string
		containerStatuses: ContainerStatus[]
		initContainerStatuses?: ContainerStatus[]
	}
}

export interface PodJson {
	items: PodRaw[]
}

export interface PodResult {
	name: string
	testCommand: string
	rootName: string
	nodeName: string
	namespace: string
	ip: string
	containers: {
		name: string
		resources: {
			requests: {
				cpu: string
				memory: string
			}
		}
	}[]
	containerNames: string[]
	runningContainerNames: string[]
	errorContainerNames: string[]
	status: string
	raw: PodRaw
}

interface Dependency {
	name: string
	branch?: string
	type?: string
}

interface BuildArgContainer {
	/**
	 * The name of container within the application that will receive the build args.
	*/
	container: string
	/**
	 * Whether to use the alias as the image name prefix when building the container.
	 * If true, and the application is "my-app" with alias "custom-app", and the container is "web",
	 * the built image will be tagged as "custom-app-web" instead of "my-app-web".
	 */
	useAlias?: boolean
	/**
	 * Array of arguments to pass to the container
	 */
	args: BuildArg[]
	/**
	 * Whether or not to build the container. This can be a calculated value from secrets or env vars like a BuildArg.path
	 */
	build?: boolean
}

interface BuildArg {
	/**
	 * Name of the argument that the container will receive. Should correspond with an ARG name in your Dockerfile.
	 */
	name: string
	/**
	 * The path to populate the value for the argument.
	 * Use "values.keyName" to reference something from the values files.
	 * Use "secrets.keyName" to reference a secret.
	 * Use "secrets_env.keyName" to reference a env-specific secret.
	 */
	path: string
}

export interface SettingsDef {
	version: string
	dockerBase?: string
	buildOrder?: string[]
	buildOrder_live?: string[]
	buildOrder_qa?: string[]
	buildOrder_dev?: string[]
	buildOrder_local?: string[]
	dependencies?: Dependency[]
	secrets_key?: string
	buildArgs: BuildArgContainer[]
}

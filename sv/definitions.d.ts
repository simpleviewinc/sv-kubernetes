export interface GetCurrentPodsArgs {
	allNamespaces?:boolean
	name?: string
	filter?: (val: PodResult) => boolean
	container?: string
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
		containers: [
			{
				name: string
				resources?: {
					requests?: {
						cpu?: string
						memory?: string
					}
				}
			}
		]
	}
	status: {
		podIP: string
		phase: string
		reason: string
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
	 * Array of arguments to pass to the container
	 */
	args: BuildArg[]
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

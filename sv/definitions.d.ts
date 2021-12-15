export interface PodJson {
	items: [
		{
			metadata : {
				name: string,
				annotations : { [key: string]: string }
			},
			podIP : string,
			spec : {
				containers : [
					{
						name: string
					}
				]
			},
			status : {
				phase : string
			}
		}
	]
}

interface Dependency {
	name: string
	branch?: string
	type?: string
}

interface BuildArg {
	name: string
	path: string
}

interface BuildArgContainer {
	container: string
	args: BuildArg[]
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
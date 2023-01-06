//@ts-check
const commandLineArgs = require("command-line-args");
const js_yaml = require("js-yaml");
const fs = require("fs");
const lodash = require("lodash");

const {
	deepMerge,
	exec,
	execSilent,
	getCurrentPods,
	loadYaml,
	loadSettingsYaml,
	log,
	validatePath
} = require("./utils");

const constants = require("./constants");

function build({ argv }) {
	const flags = commandLineArgs([
		{ name : "name", type : String },
		{ name : "app", type : String },
		{ name : "pushTag", type : String },
		{ name : "env", type : String },
		{ name : "build-arg", type : String, multiple: true }
	], { argv });

	if (flags.name === undefined) {
		throw new Error(`Must specify '--name'`);
	}

	let path;
	let appPath;
	let containerName;

	if (flags.app === undefined) {
		path = `${constants.CONTAINERS_FOLDER}/${flags.name}`;
		containerName = flags.name;
	} else {
		appPath = `${constants.APPS_FOLDER}/${flags.app}`;
		path = `${appPath}/containers/${flags.name}`;
		containerName = `${flags.app}-${flags.name}`;
	}

	validatePath(path);

	const commandArgs = [];
	commandArgs.push(`-t ${containerName}:local`);

	if (flags.pushTag !== undefined) {
		commandArgs.push(`-t ${flags.pushTag}`);
	}

	if (flags.pushTag !== undefined) {
		// if we have a pushTag attempt a pull so we can prime the docker cache, if the remote image doesn't exist, we ignore the error
		exec(`cd ${path} && docker pull ${flags.pushTag} || true`);
		commandArgs.push(`--cache-from ${flags.pushTag}`);
	}

	const buildArgs = {};

	const settings = loadSettingsYaml(flags.app);
	const containerBuildArgs = settings.buildArgs ? settings.buildArgs.filter(val => val.container === flags.name)[0] : undefined;

	if (flags.app !== undefined && containerBuildArgs !== undefined) {
		const mergeData = {};
		const secretsPath = `${appPath}/chart/secrets.yaml`;
		if (fs.existsSync(secretsPath)) {
			const str = execSilent(`kubesec decrypt ${secretsPath}`).toString();
			const yaml = js_yaml.safeLoad(str);
			mergeData.secrets = yaml.stringData;
		}

		const secretsEnvPath = `${appPath}/chart/secrets_${flags.env}.yaml`;
		if (fs.existsSync(secretsEnvPath)) {
			const str = execSilent(`kubesec decrypt ${secretsEnvPath}`).toString();
			const yaml = js_yaml.safeLoad(str);
			mergeData.secrets_env = yaml.stringData;
		}

		const rootValues = loadYaml(`${appPath}/chart/values.yaml`);
		const envValues = loadYaml(`${appPath}/chart/values_${flags.env}.yaml`);
		mergeData.values = deepMerge(rootValues, envValues);

		for(let arg of containerBuildArgs.args) {
			const value = lodash.get(mergeData, arg.path);

			if (value !== undefined) {
				buildArgs[arg.name] = value;
			}
		}
	}

	if (flags["build-arg"] !== undefined) {
		for(let arg of flags["build-arg"]) {
			const parts = arg.split("=");
			buildArgs[parts[0]] = parts[1];
		}
	}

	if (flags.env !== undefined) {
		buildArgs.SV_ENV = flags.env;
	}

	for(let [key, value] of Object.entries(buildArgs)) {
		commandArgs.push(`--build-arg ${key}='${value}'`);
	}

	const commandArgString = commandArgs.join(" ");

	log(`Starting build of ${containerName}`);
	exec(`cd ${path} && DOCKER_BUILDKIT=1 docker build ${commandArgString} .`);
	log(`Completed build of ${containerName}`);

	if (flags.pushTag !== undefined) {
		exec(`cd ${path} && docker push ${flags.pushTag}`);
	}
}

function deleteEvicted({ argv }) {
	const pods = getCurrentPods();

	const evictedPods = pods.filter(val => val.raw.status.reason === "Evicted");

	for(let pod of evictedPods) {
		exec(`kubectl delete pod ${pod.name}`);
	}

	console.log(`${evictedPods.length} pods deleted.`);
}

module.exports.build = build;
module.exports.deleteEvicted = deleteEvicted;

//@ts-check
const { execSync } = require("child_process");
const fs = require("fs");
const lodash = require("lodash");
const chalk = require("chalk");
const js_yaml = require("js-yaml");
const read = require('read');
const util = require("util");

const constants = require("./constants");
const readP = util.promisify(read);

/**
 * Prompt the user for confirmation if running an action on a non-local environment to prevent mistakes
 */
async function confirmContextCommand(context, confirmActions = true, readOptions = {}) {
	if (
		confirmActions !== true
		||
		[constants.LOCAL_CONTEXT_DESKTOP, constants.LOCAL_CONTEXT_MINIKUBE].includes(context) === true
	) {
		return true;
	}

	let result;
	try {
		result = await readP(Object.assign({
			prompt : "You are performing an action on a non-local cluster.\n[Enter] to continue or ctrl+c to cancel."
		}, readOptions));
	} catch(err) {
		console.log(`\n${err.message}`);
		return false;
	}

	if (result !== undefined && result.length !== 0) {
		console.log("unexpected data");
		return false;
	}

	return true;
}

function exec(command, options = {}) {
	return execSync(command, { stdio : "inherit", ...options });
}

function execSilent(command, options = {}) {
	return execSync(command, { ...options }).toString().trim();
}

async function logContext(confirmActions = process.env.BYPASS_SV_COMMAND_CONTROL !== "true") {
	const currentContext = getCurrentContext();
	console.log(chalk.green(`[Current Context]: ${currentContext}`));

	// ensure we should proceed with the action if the context isn't on their local kube
	const shouldContinue = await confirmContextCommand(currentContext, confirmActions);
	if (!shouldContinue) {
		process.exit(1);
	}
}

function getCurrentContext() {
	return execSync("kubectl config current-context").toString().trim();
}

/**
 * Deep-merge an object with another object where arrays overwrite rather than blending.
 * @param {Object} object
 * @param {Object} object2
*/
function deepMerge(object, object2) {
	return lodash.mergeWith(object, object2, function(objValue, srcValue) {
		if (objValue instanceof Array) {
			return srcValue;
		}
	});
}

function validatePath(path) {
	if (fs.existsSync(path) === false) {
		throw new Error(`Invalid path ${path}`);
	}
}

function mapBuildArgs(args=[]) {
	return args.map(arg => `--build-arg ${arg}`);
}

/**
 * Read a YAML file
 * @param {string} path - Path to load the YAML from.
*/
function loadYaml(path) {
	if (fs.existsSync(path) === false) {
		return {};
	}

	const yaml = js_yaml.safeLoad(fs.readFileSync(path));
	return yaml;
}

/**
 * Returns the settings yaml for an application
 * @param {string} app - Name of the application.
 * @returns {import("./definitions").SettingsDef}
*/
function loadSettingsYaml(app) {
	return loadYaml(`${constants.APPS_FOLDER}/${app}/settings.yaml`)
}

function log(str) {
	var now = new Date();

	console.log(now.toISOString(), str);
}

/**
 *
 * @param {import("./definitions").GetCurrentPodsArgs} [args]
 */
function getCurrentPodsV2(args = {}) {
	/** @type {import("./definitions").PodJson}*/
	const all = JSON.parse(execSync(`kubectl get pods -o json ${args.allNamespaces ? "--all-namespaces": ""}`, { maxBuffer : 100 * 1024 * 1024 }).toString());

	// pods which are scheduled for deletion, we can effectively ignore for logging purposes
	const originalPods = all.items.filter(val => val.metadata.deletionTimestamp === undefined);

	/**
	 * @param {import("./definitions").ContainerStatus[]} statuses
	*/
	function getRunningContainers(statuses) {
		return statuses
			.filter(val => val.state.running !== undefined)
			.map(val => val.name)
	}

	// simplify the return for downstream functions
	/** @type {import("./definitions").PodResult[]} */
	let pods = originalPods.map(val => {
		const allStatuses = [
			...(val.status.initContainerStatuses ?? []),
			...(val.status.containerStatuses ?? [])
		];

		return {
			name : val.metadata.name,
			testCommand : val.metadata.annotations !== undefined && val.metadata.annotations["sv-test-command"] ? val.metadata.annotations["sv-test-command"] : undefined,
			rootName : val.metadata.name.replace(/-[^\-]+-[^\-]+$/, ""),
			nodeName: val.spec.nodeName,
			namespace: val.metadata.namespace,
			ip : val.status.podIP,
			containers: val.spec.containers.map(val => {
				const cpuRequest = lodash.get(val, "resources.requests.cpu");
				const memoryRequest = lodash.get(val, "resources.requests.memory");

				const resources = {
					requests: {
						cpu: cpuRequest !== undefined ? cpuRequest : "0",
						memory: memoryRequest !== undefined ? memoryRequest : "0"
					}
				}

				return {
					name: val.name,
					resources
				}
			}),
			containerNames : [
				...val.spec.containers.map(val => val.name),
				...(val.spec.initContainers ?? []).map(val => val.name)
			],
			runningContainerNames: getRunningContainers(allStatuses),
			errorContainerNames: allStatuses.filter(val => {
				return val.ready === false && val.imageID !== ""
			}).map(val => {
				return val.name
			}),
			status : val.status.phase,
			raw : val
		}
	});

	// If we have want a specific name
	if (args.name) {
		pods = pods.filter(val => val.name.match(args.name));
	}

	// if we have a passed in filter, apply it
	if (args.filter) {
		pods = pods.filter(args.filter);
	}

	// if we have a passed in container, filter to pods which have that container
	// also clean out the containerNames to only contain the specified container for easier downstream code
	if (args.container !== undefined) {
		pods = pods.filter(val => val.containerNames.includes(args.container));
		pods.forEach(pod => {
			pod.containerNames = pod.containerNames.filter(val => val === args.container);
			pod.runningContainerNames = pod.runningContainerNames.filter(val => val === args.container);
		});
	}

	return pods;
}

/**
 * @deprecated Keeping until we can refactor other calls to use the newer syntax
 * @param {string} [filter] - The pod or application you are filtering on
 * @param {string} [container] - The name of the container, if passed will only returns pods with that container and containerNames will only contain this container
 */
function getCurrentPods(filter, container) {
	return getCurrentPodsV2({
		name: filter,
		container
	})
}

/**
 * Returns the environment variables necessary for our docker build command to run using the minikube docker daemon.
 * The minikube docker-env is supposed to support -o json but that's not working right now, so have to manually parse.
 * */
function getMinikubeDockerEnv() {
	const result = execSilent(`minikube docker-env`);
	const lines = result.split("\n");
	const resultObj = {};
	for (const line of lines) {
		if (!line.startsWith("export ")) {
			continue;
		}

		const matcher = line.match(/export (.*?)="(.*)"/);
		resultObj[matcher[1]] = matcher[2];
	}

	return resultObj;
}

function _isMinikubeEnv() {
	try {
		execSilent("which minikube");
	} catch {
		return false;
	}

	return true;
}
const isMinikubeEnv = lodash.memoize(_isMinikubeEnv);

function _isDockerDesktopEnv() {
	// TODO: Change to `process.env.IS_DOCKER_DESKTOP === "1"` once
	//       sv-kube in Docker container is the only supported setup
	return (process.env.IS_DOCKER_DESKTOP || "1") === "1";
}
const isDockerDesktopEnv = lodash.memoize(_isDockerDesktopEnv);

function _isArmEnv() {
	return process.arch !== "x64";
}
const isArmEnv = lodash.memoize(_isArmEnv);

function getDockerEnv() {
	return isMinikubeEnv() ? {
		...process.env,
		...getMinikubeDockerEnv()
	} : process.env;
}

async function getAuthTokenFromRefreshToken(refreshToken) {
	const fetchResult = await fetch(constants.GRAPH_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			variables: {
				token: refreshToken
			},
			query: `
				query($token: String!) {
					auth {
						refresh_token(refresh_token: $token) {
							success
							message
							token
						}
					}
				}
			`
		})
	});

	const json = await fetchResult.json();
	const result = json.data.auth.refresh_token;
	if (!result.success) {
		throw new Error(result.message);
	}

	return result.token;
}

module.exports.confirmContextCommand = confirmContextCommand;
module.exports.deepMerge = deepMerge;
module.exports.exec = exec;
module.exports.execSilent = execSilent;
module.exports.getAuthTokenFromRefreshToken = getAuthTokenFromRefreshToken;
module.exports.getCurrentContext = getCurrentContext;
module.exports.getCurrentPods = getCurrentPods;
module.exports.getCurrentPodsV2 = getCurrentPodsV2;
module.exports.getDockerEnv = getDockerEnv;
module.exports.getMinikubeDockerEnv = getMinikubeDockerEnv;
module.exports.isMinikubeEnv = isMinikubeEnv;
module.exports.isDockerDesktopEnv = isDockerDesktopEnv;
module.exports.isArmEnv = isArmEnv;
module.exports.loadSettingsYaml = loadSettingsYaml;
module.exports.loadYaml = loadYaml;
module.exports.log = log;
module.exports.logContext = logContext;
module.exports.mapBuildArgs = mapBuildArgs;
module.exports.validatePath = validatePath;

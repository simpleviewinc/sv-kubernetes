//@ts-check
const { execSync } = require("child_process");
const fs = require("fs");
const lodash = require("lodash");
const chalk = require("chalk");
const js_yaml = require("js-yaml");

const constants = require("./constants");

function exec(command, options = {}) {
	return execSync(command, { stdio : "inherit", ...options });
}

function execSilent(command, options = {}) {
	return execSync(command, { ...options }).toString().trim();
}

function logContext() {
	console.log(chalk.green(`[Current Context]: ${getCurrentContext()}`));
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
 * @param {string} [filter] - The pod or application you are filtering on
 * @param {string} [container] - The name of the container, if passed will only returns pods with that container and containerNames will only contain this container
 */
 function getCurrentPods(filter, container) {
	/** @type {import("./definitions").PodJson}*/
	const all = JSON.parse(execSync(`kubectl get pods -o json`, { maxBuffer : 100 * 1024 * 1024 }).toString());

	// pods which are scheduled for deletion, we can effectively ignore for logging purposes
	const originalPods = all.items.filter(val => val.metadata.deletionTimestamp === undefined);

	// simplify the return for downstream functions
	let pods = originalPods.map(val => ({
		name : val.metadata.name,
		testCommand : val.metadata.annotations !== undefined && val.metadata.annotations["sv-test-command"] ? val.metadata.annotations["sv-test-command"] : undefined,
		rootName : val.metadata.name.replace(/-[^\-]+-[^\-]+$/, ""),
		ip : val.podIP,
		containerNames : val.spec.containers.map(val => val.name),
		status : val.status.phase,
		raw : val
	}));

	// if we have a passed in filter, apply it
	if (filter) {
		pods = pods.filter(val => val.name.match(filter));
	}

	// if we have a passed in container, filter to pods which have that container
	// also clean out the containerNames to only contain the specified container for easier downstream code
	if (container !== undefined) {
		pods = pods.filter(val => val.containerNames.includes(container));
		pods.forEach(pod => {
			pod.containerNames = [container];
		});
	}

	return pods;
}

module.exports.deepMerge = deepMerge;
module.exports.exec = exec;
module.exports.execSilent = execSilent;
module.exports.getCurrentContext = getCurrentContext;
module.exports.getCurrentPods = getCurrentPods;
module.exports.loadSettingsYaml = loadSettingsYaml;
module.exports.loadYaml = loadYaml;
module.exports.log = log;
module.exports.logContext = logContext;
module.exports.mapBuildArgs = mapBuildArgs;
module.exports.validatePath = validatePath;

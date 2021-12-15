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
 * @param {Object} object
 * @param {...Object} sources
*/
function deepMerge(object, sources) {
	return lodash.mergeWith(object, sources, function(objValue, srcValue) {
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

module.exports.deepMerge = deepMerge;
module.exports.exec = exec;
module.exports.execSilent = execSilent;
module.exports.getCurrentContext = getCurrentContext;
module.exports.loadSettingsYaml = loadSettingsYaml;
module.exports.loadYaml = loadYaml;
module.exports.log = log;
module.exports.logContext = logContext;
module.exports.mapBuildArgs = mapBuildArgs;
module.exports.validatePath = validatePath;
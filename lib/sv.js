#!/usr/bin/env node

var fs = require("fs");
var child_process = require("child_process");
var read = require("read");
var util = require("util");

var scriptName = process.argv[2];
var argv = process.argv.filter(function(val, i){ return i > 2; });

const validEnvs = ["local", "dev", "test", "staging", "live"];

var scripts = {};

var exec = function(command) {
	return child_process.execSync(command, { stdio : "inherit" });
}

// public scripts
scripts.build = function(args) {
	var container = args.argv[0];
	
	validateContainer(container);
	
	exec(`cd /sv/containers/${container} && docker build -t ${container}:local .`);
}

scripts.compile = function(args) {
	const container = args.argv.shift();
	
	validateContainer(container);
	
	const supportedFlags = ["project_id", "branch_name", "tags"];
	const flags = {
		project_id : "sv-shared",
		branch_name : "master"
	};
	
	args.argv.forEach(function(val) {
		var temp = val.split("=");
		var tagName = temp[0].replace(/^--/, "");
		if (supportedFlags.includes(tagName) === false) {
			throw new Error(`Unsupported flag ${tagName}, valid flags are ${supportedFlags.join(", ")}`);
		}
		
		flags[tagName] = temp[1];
	});
	
	exec(`rm -rf /tmp/test`);
	exec(`cp -R /sv/containers/${container} /tmp/test`);
	exec(`docker run -it -e PROJECT_ID=${flags.project_id} -e REPO_NAME=${container} -e BRANCH_NAME=${flags.branch_name} ${flags.tags ? `-e TAGS=${flags.tags}` : ""} -v /tmp/test:/repo -v /var/run/docker.sock:/var/run/docker.sock gcr.io/sv-shared/sv-compile-container:latest`);
}

scripts.install = function(args) {
	const type = args.argv[0];
	const name = args.argv[1];
	
	if (["app", "container"].includes(type) === false) {
		throw new Error("Type must be 'app' or 'container'");
	}
	
	const resultType = {
		app : "applications",
		container : "containers"
	}
	
	const github_token = fs.readFileSync(`/sv/internal/github_token`).toString();
	
	exec(`git clone https://${github_token}@github.com/simpleviewinc/${name} /sv/${resultType[type]}/${name}`);
}

scripts.restart = function(args) {
	var applicationName = args.argv[0];
	var container = args.argv[1];
	var env = args.argv[2];
	
	validateApp(applicationName);
	validateContainer(container);
	validateEnv(env);
	
	exec(`sv build ${container}`);
	exec(`sv _buildSvInfo`);
	exec(`sv start ${applicationName} ${env}`);
}

scripts.start = function(args) {
	var myArgs = args.argv.slice();
	var applicationName = myArgs.shift();
	var env = myArgs.shift();
	
	validateApp(applicationName);
	validateEnv(env);
	
	var appFolder = `/sv/applications/${applicationName}`;
	
	var envFile = `${appFolder}/values_${env}.yaml`;
	if (fs.existsSync(envFile)) {
		myArgs.unshift(`-f ${envFile}`);
	}
	
	console.log(`Starting application '${applicationName}' in env '${env}'`);
	exec(`helm upgrade ${applicationName} ${appFolder}/ --install --set sv.env=${env} -f /sv/internal/sv.json ${myArgs.join(" ")}`);
}

scripts.stop = function(args) {
	var applicationName = args.argv[0];
	
	exec(`helm delete ${applicationName} --purge`);
}

//// PRIVATE METHODS

const validateEnv = function(env) {
	if (validEnvs.includes(env) === false) {
		throw new Error(`Invalid env ${env}`);
	}
}

const validateApp = function(app) {
	const folder = `/sv/applications/${app}`;
	if (fs.existsSync(folder) === false) {
		throw new Error(`Invalid app ${app}`);
	}
}

const validateContainer = function(container) {
	const folder = `/sv/containers/${container}`;
	if (fs.existsSync(folder) === false) {
		throw new Error(`Invalid container ${container}`);
	}
}

// stores the state of the docker registry in a local file, exposing to to sv start
scripts._buildSvInfo = function(args) {
	var test = child_process.execSync(`docker image list --format "{{.Repository}},{{.Tag}},{{.ID}}" --filter "dangling=false"`);
	var results = {
		sv : {
			ids : {}
		}
	};
	var items = test.toString().split("\n");
	items.pop(); // remove trailing bogus item
	items.forEach(function(val, i) {
		var items = val.split(",");
		results.sv.ids[`${items[0]}:${items[1]}`] = items[2];
	});
	
	fs.writeFileSync(`/sv/internal/sv.json`, JSON.stringify(results, null, "\t"));
}

if (process.argv.length < 3) {
	console.log(fs.readFileSync(`/sv/docs/sv.md`).toString());
	return;
}

if (process.argv.length < 4) {
	var docPath = `/sv/docs/sv_${scriptName}.md`;
	if (fs.existsSync(docPath)) {
		console.log(fs.readFileSync(docPath).toString());
		return;
	}
}

if (scripts[scriptName] === undefined) {
	console.log(`Script '${scriptName}' doesn't exist.`);
	return;
}

scripts[scriptName]({ argv : argv });
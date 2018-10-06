#!/usr/bin/env node

var fs = require("fs");
var child_process = require("child_process");
var read = require("read");
var util = require("util");
const commandLineArgs = require("command-line-args");

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
	var flags = commandLineArgs([
		{ name : "container", type : String, defaultOption : true },
		{ name : "image", type : String, defaultValue : "gcr.io/sv-shared/sv-compile-container:latest" },
		{ name : "project_id", type : String },
		{ name : "branch_name", type : String },
		{ name : "tags", type : String }
	], { argv : args.argv });
	
	validateContainer(flags.container);
	
	const requiredArgs = ["container", "image", "project_id", "branch_name"];
	requiredArgs.forEach(function(val, i) {
		if (flags[val] === undefined) {
			throw new Error(`Required argument '${val}' not provided`);
		}
	});
	
	exec(`rm -rf /tmp/test`);
	exec(`cp -R /sv/containers/${flags.container} /tmp/test`);
	exec(`docker run -it -e PROJECT_ID=${flags.project_id} -e REPO_NAME=${flags.container} -e BRANCH_NAME=${flags.branch_name} ${flags.tags ? `-e TAGS=${flags.tags}` : ""} -v /tmp/test:/repo -v /var/run/docker.sock:/var/run/docker.sock ${flags.image}`);
}

scripts.deploy = function(args) {
	var flags = commandLineArgs([
		{ name : "applicationName", type : String, defaultOption : true },
		{ name : "image", type : String, defaultValue : "gcr.io/sv-shared/sv-deploy-kubernetes:latest" },
		{ name : "project_id", type : String },
		{ name : "cluster", type : String },
		{ name : "env", type : String }
	], { argv : args.argv });
	
	validateApp(flags.applicationName);
	validateEnv(flags.env);
	
	const requiredArgs = ["applicationName", "image", "project_id", "cluster", "env"];
	requiredArgs.forEach(function(val, i) {
		if (flags[val] === undefined) {
			throw new Error(`Required argument '${val}' not provided`);
		}
	});
	
	exec(`rm -rf /tmp/test`);
	exec(`cp -R /sv/applications/${flags.applicationName} /tmp/test`);
	exec(`docker run -it -e PROJECT_ID=${flags.project_id} -e CLUSTER=${flags.cluster} -e ENV=${flags.env} -e APPLICATION=${flags.applicationName} -v /tmp/test:/repo ${flags.image} deploy`);
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
	const path = `/sv/${resultType[type]}/${name}`;
	
	if (fs.existsSync(path)) {
		throw new Error("Something already exists at that path.");
	}
	
	exec(`git clone https://${github_token}@github.com/simpleviewinc/${name} ${path}`);
	exec(`cd ${path} && git remote set-url origin git@github.com:simpleviewinc/${name}.git`);
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
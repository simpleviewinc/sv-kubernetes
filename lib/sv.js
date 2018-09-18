#!/bin/env node

var fs = require("fs");
var child_process = require("child_process");
var read = require("read");
var util = require("util");

var readP = util.promisify(read);

var scriptName = process.argv[2];
var argv = process.argv.filter(function(val, i){ return i > 2; });

var scripts = {};

var exec = function(command) {
	return child_process.execSync(command, { stdio : "inherit" });
}

// public scripts

scripts.build = function(args) {
	var container = args.argv[0];
	var name = args.argv[1];
	if (name === "latest") {
		throw new Error("latest tag does not work with Kubernetes locally");
	}
	
	exec(`cd /sv/containers/${container} && docker build -t ${container}:${name} .`);
}

scripts.restart = function(args) {
	var applicationName = args.argv[0];
	var container = args.argv[1];
	var name = args.argv[2];
	exec(`sv build ${container} ${name}`);
	exec(`sv _buildSvInfo`);
	exec(`sv start ${applicationName}`);
}

scripts.start = function(args) {
	var myArgs = args.argv.slice();
	var serverConfig = JSON.parse(fs.readFileSync(`/sv/internal/server_config.json`).toString());
	var applicationName = myArgs.shift();
	var appFolder = `/sv/applications/${applicationName}`;
	var envFile = `${appFolder}/values_${serverConfig.env}.yaml`;
	
	if (fs.existsSync(envFile)) {
		myArgs.unshift(`-f ${envFile}`);
	}
	
	exec(`helm upgrade ${applicationName} /sv/applications/${applicationName}/ --install -f /sv/internal/sv.json ${myArgs.join(" ")}`);
}

scripts.stop = function(args) {
	var applicationName = args.argv[0];
	exec(`helm delete ${applicationName} --purge`);
}

//// PRIVATE METHODS

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
	
	var server_config = fs.readFileSync(`/sv/internal/server_config.json`).toString();
	results.sv.server_config = JSON.parse(server_config);
	
	fs.writeFileSync(`/sv/internal/sv.json`, JSON.stringify(results, null, "\t"));
}

scripts._buildServerConfig = async function(args) {
	var temp = await readP({ prompt : "env (hit enter to use 'local' default): ", default : "local" });
	var result = { env : temp };
	fs.writeFileSync("/sv/internal/server_config.json", JSON.stringify(result, null, "\t"));
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
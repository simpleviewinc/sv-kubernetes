#!/bin/env node

var fs = require("fs");
var child_process = require("child_process");
var chokidar = require("chokidar");

var scriptName = process.argv[2];
var argv = process.argv.filter(function(val, i){ return i > 2; });

var scripts = {};

var exec = function(command) {
	return child_process.execSync(command, { stdio : "inherit" });
}

scripts.watch = function(args) {
	if (args.argv.length === 0) {
		console.log("sudo sv watch [application] [container] [name:tag]");
		return;
	}
	
	var applicationName = args.argv[0];
	var container = args.argv[1];
	var tag = args.argv[2];
	var watcher = chokidar.watch(`/sv/containers/${container}`, {
		ignored : [
			"node_modules",
			/(^|[\/])\../
		],
		usePolling : true,
		interval : 100
	}).on("all", function(event, path) {
		console.log(event, path);
	});
	
	watcher.on("ready", function() {
		console.log("watching...");
		watcher.on("all", function(event, path) {
			exec(`sv restart container ${applicationName} ${container} ${name}`);
			console.log("Restarted");
		});
	});
}

scripts.build = function(args) {
	if (args.argv.length < 2) {
		console.log("sudo sv build [container] [name:tag]");
		return;
	}
	
	var container = args.argv[0];
	var name = args.argv[1];
	exec(`cd /sv/containers/${container} && docker build -t ${name} .`);
}

scripts.restart = function(args) {
	if (args.argv.length === 0) {
		console.log("sudo sv restart [application] [container] [name:tag]");
		return;
	}
	
	var applicationName = args.argv[0];
	var container = args.argv[1];
	var name = args.argv[2];
	exec(`sv build ${container} ${name}`);
	exec(`sv buildSvInfo`);
	exec(`sv start ${applicationName}`);
}

scripts.start = function(args) {
	if (args.argv.length === 0) {
		console.log("sudo sv start [applicationName]");
		return;
	}
	
	var myArgs = args.argv.slice();
	var serverConfig = JSON.parse(fs.readFileSync(`/sv/server_config.json`).toString());
	var applicationName = myArgs.shift();
	var appFolder = `/sv/applications/${applicationName}`;
	var envFile = `${appFolder}/values_${serverConfig.env}.yaml`;
	
	if (fs.existsSync(envFile)) {
		myArgs.unshift(`-f ${envFile}`);
	}
	
	if (serverConfig.env === "local") {
		myArgs.unshift(`-f /sv/internal/sv.json`);
	}
	
	exec(`helm upgrade ${applicationName} /sv/applications/${applicationName}/ --install ${myArgs.join(" ")}`);
}

// stores the state of the docker registry in a local file, exposing to to sv start
scripts.buildSvInfo = function(args) {
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

scripts.stop = function(args) {
	if (args.argv.length === 0) {
		console.log("sudo sv stop [applicationName]");
		return;
	}
	
	var applicationName = args.argv[0];
	exec(`helm delete ${applicationName} --purge`);
}

scripts[scriptName]({ argv : argv });
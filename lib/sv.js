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
		console.log("sudo sv watch container [container] [name:tag]");
		return;
	}
	
	var container = args.argv[1];
	var name = args.argv[2];
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
			exec(`sv restart container ${container} ${name}`);
			console.log("Restarted");
		});
	});
}

scripts.restart = function(args) {
	if (args.argv.length === 0) {
		console.log("sudo sv restart container [container] [name:tag]");
		return;
	}
	
	var container = args.argv[1];
	var name = args.argv[2];
	exec(`cd /sv/containers/${container} && docker build -t ${name} .`);
	exec(`kubectl delete pod -l sv-pod=${container}`);
}

scripts.start = function(args) {
	if (args.argv.length === 0) {
		console.log("sudo sv start application [applicationName]");
		return;
	}
	
	var applicationName = args.argv[1];
	exec(`kubectl apply -f /sv/applications/${applicationName}`);
}

scripts.stop = function(args) {
	if (args.argv.length === 0) {
		console.log("sudo sv stop application [applicationName]");
		return;
	}
	
	var applicationName = args.argv[1];
	exec(`kubectl delete deployment -l sv-application=${applicationName}`);
	exec(`kubectl delete service -l sv-application=${applicationName}`);
}

scripts[scriptName]({ argv : argv });
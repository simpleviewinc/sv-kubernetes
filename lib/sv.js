#!/bin/env node

var fs = require("fs");
var child_process = require("child_process");

var scriptName = process.argv[2];
var argv = process.argv.filter(function(val, i){ return i > 2; });

var scripts = {};

scripts.test = function() {
	
}

scripts.install = function() {
	
}

scripts.start = function(args) {
	if (args.argv.length === 0) {
		console.log("sudo sv start application [applicationName]");
		return;
	}
	
	var applicationName = args.argv[1];
	child_process.execSync(`kubectl apply -f /sv/applications/${applicationName}`, { stdio : "inherit" });
}

scripts.stop = function(args) {
	if (args.argv.length === 0) {
		console.log("sudo sv stop application [applicationName]");
		return;
	}
	
	var applicationName = args.argv[1];
	child_process.execSync(`kubectl delete deployment -l sv-application=${applicationName}`, { stdio : "inherit" });
	child_process.execSync(`kubectl delete service -l sv-application=${applicationName}`, { stdio : "inherit" });
}

scripts[scriptName]({ argv : argv });
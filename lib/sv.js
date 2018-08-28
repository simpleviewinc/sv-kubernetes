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

scripts.set = function(args) {
	if (args.argv.length === 0) {
		console.error("sudo sv set image [deployment] [continainer] [image]");
		return;
	}

	const deployment = args.argv[1];
	const container = args.argv[2]
	const image = args.argv[3];

	exec(`kubectl set image deployment/${deployment} ${container}=${image}`)
}

const _watch = function(args) {
	if (args.argv.length === 0) {
		return "sudo sv _watch [[path], ...]";
	}

	const paths = args.argv.map(val => val.path);
	const watcher = chokidar.watch(paths, {
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
			const matchPaths = args.argv.filter(val => path.indexOf(val.path) === 0);
			if (matchPaths.length === 0) { throw new Error("Path '${path}' lacks callback"); }

			try {
				matchPaths[0].handler();
				console.log("--- Restarted ---");
			} catch(err) {
				console.error(err)
				console.log("--- Restart failed. Using previous config settings ---");
			}
		});
	});
}

// if tag not present - this should update the tag - uuid
scripts.watch = function(args) {
	if (args.argv.length === 0) {
		console.error("sudo sv watch application [application]");
		console.error("-- or --");
		console.error("sudo sv watch container [container] [name:tag]");
		return;
	}
	
	const type = args.argv[0]
	const item = args.argv[1];
	const itemArgs = args.argv.slice(2) || [];

	const watchArgs = [{
		path : `/sv/${type}s/${item}/`,
		handler : function() {
			exec(`sv restart ${type} ${item} ${itemArgs.join(" ")}`);
		}
	}];

	_watch({ argv : watchArgs });
}

scripts.develop = function(args) {
	fs.readFile("/sv/develop_config.json", "utf8", function (err, data) {
		if (err) { throw err; }
		const watchArgs = [];
		const config = JSON.parse(data);
		config.watch = config.watch || {};

		const updateImages = function(pods) {
			pods.forEach(function(pod, i) {
				if (pod.image === undefined) { throw new Error(`Required field 'watch.sv-pods[${i}].image' missing.`); }
				const name = pod.image.name;
				const container = pod.image.container || "*";
				const tag = pod.image.tag || "latest";

				exec(`sv set image ${pod.label} ${container} ${name}:${tag}`);
			});
		}

		const watchApps = config.watch["sv-applications"] || [];
		watchApps.forEach(function(app) {
			const tag = app.tag || "latest";
			exec(`sv start application ${app.label}`);
			watchArgs.push({
				path : `/sv/applications/${app.label}/`,
				handler : function() {
					exec(`sv restart application ${app.label}`);

					// loop over watched containers and reset images after restart
					updateImages(watchPods);
				}
			});
		});

		const watchPods = config.watch["sv-pods"] || [];
		updateImages(watchPods);
		watchPods.forEach(function(pod, i) {
			const name = pod.image.name;
			const tag = pod.image.tag || "latest";

			watchArgs.push({
				path : `/sv/containers/${pod.label}/`,
				handler : function() {
					exec(`sv restart container ${pod.label} ${name}:${tag}`);
				}
			});
		});

		_watch({ argv : watchArgs });
	});

}

scripts.restart = function(args) {
	const help = function() {
		console.error("sudo sv restart application [application]");
		console.error("-- or --");
		console.error("sudo sv restart container [container] [name:tag]");	
	}

	if (args.argv.length <= 1) {
		return help();
	}
	
	const type = args.argv[0]
	const item = args.argv[1];
	const itemArgs = args.argv.slice(2) || [];

	if (type == "application") {
		exec(`sv start ${type} ${item}`);
	} else if (type === "container") {
		if (itemArgs.length === 0) { return help(); }
		exec(`cd /sv/containers/${item} && docker build -t ${itemArgs[0]} .`);
		exec(`kubectl delete pod -l sv-pod=${item}`);
	}

}

scripts.start = function(args) {
	if (args.argv.length === 0) {
		console.error("sudo sv start application [applicationName]");
		return;
	}
	
	var applicationName = args.argv[1];
	exec(`kubectl apply -f /sv/applications/${applicationName}`);
}

scripts.stop = function(args) {
	if (args.argv.length === 0) {
		console.error("sudo sv stop application [applicationName]");
		return;
	}
	
	var applicationName = args.argv[1];
	exec(`kubectl delete deployment -l sv-application=${applicationName}`);
	exec(`kubectl delete service -l sv-application=${applicationName}`);
}

scripts[scriptName]({ argv : argv });
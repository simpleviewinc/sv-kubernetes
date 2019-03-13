#!/usr/bin/env node

const fs = require("fs");
const child_process = require("child_process");
const read = require("read");
const util = require("util");
const commandLineArgs = require("command-line-args");
const js_yaml = require("js-yaml");

var scriptName = process.argv[2];
var argv = process.argv.filter(function(val, i){ return i > 2; });

const validEnvs = ["local", "dev", "test", "qa", "staging", "live"];

var scripts = {};

var exec = function(command) {
	return child_process.execSync(command, { stdio : "inherit" });
}

// public scripts
scripts.build = function(args) {
	const flags = commandLineArgs([
		{ name : "name", type : String },
		{ name : "app", type : String },
	], { argv : args.argv });
	
	if (flags.name === undefined) {
		throw new Error(`Must specify '--name'`);
	}
	
	let path;
	let tag;
	
	if (flags.app === undefined) {
		path = `/sv/containers/${flags.name}`;
		tag = flags.name;
	} else {
		path = `/sv/applications/${flags.app}/containers/${flags.name}`;
		tag = `${flags.app}-${flags.name}`;
	}
	
	validatePath(path);
	
	exec(`cd ${path} && docker build -t ${tag}:local .`);
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
	const { name, type,branch_name } = commandLineArgs([
		{ name : "name", type : String, defaultOption : true },
		{ name : "type", type : String, defaultValue : "app" },
		{ name : "branch_name", type : String, defaultValue: "" }
	], { argv : args.argv });

	if (["app", "container"].includes(type) === false) {
		throw new Error("Type must be 'app' or 'container'");
	}

	const resultType = {
		app : "applications",
		container : "containers"
	}

	let branchArg = ``;
	if(branch_name.length){
		branchArg = `-b ${branch_name}`
	}

	const github_token = fs.readFileSync(`/sv/internal/github_token`).toString();
	const path = `/sv/${resultType[type]}/${name}`;

	if (fs.existsSync(path)) {
		console.log(`skipping '${path}', something already exists at the path.`);
		return;
	}
	let cmd = `git clone --recurse-submodules git@github.com:simpleviewinc/${name}.git ${branchArg} ${path}`;
	console.log(cmd);
	exec(cmd);
}

scripts.start = function(args) {
	var myArgs = args.argv.slice();
	var applicationName = myArgs.shift();
	var env = myArgs.shift();
	
	validateApp(applicationName);
	validateEnv(env);
	
	var flags = commandLineArgs([
		{ name : "build", type : String }
	], { argv : myArgs, stopAtFirstUnknown : true });
	
	// set our args to those flags we don't recognize or an empty array if there are none
	myArgs = flags._unknown || [];
	
	const appFolder = `/sv/applications/${applicationName}`;
	const chartFolder = `${appFolder}/chart`;
	const containerFolder = `${appFolder}/containers`;
	
	var envFile = `${chartFolder}/values_${env}.yaml`;
	if (fs.existsSync(envFile)) {
		myArgs.unshift(`-f ${envFile}`);
	}
	
	if (flags.build !== undefined && fs.existsSync(containerFolder)) {
		const isDirectory = source => fs.lstatSync(containerFolder + '/' + source).isDirectory()
		const dirs = fs.readdirSync(containerFolder).filter(isDirectory);
		dirs.forEach(function(val, i) {
			exec(`sv build --app=${applicationName} --name=${val}`);
		});
		
		exec(`sv _buildSvInfo`);
	}
	
	const settings = loadSettingsYaml(applicationName);
	const tag = env === "local" ? "local" : `${env}-${settings.version}`;
	
	console.log(`Starting application '${applicationName}' in env '${env}'`);
	exec(`helm upgrade ${applicationName} ${chartFolder} --install --set sv.tag=${tag} --set sv.env=${env} --set sv.applicationPath=${appFolder} --set sv.containerPath=${containerFolder} -f /sv/internal/sv.json ${myArgs.join(" ")}`);
}

scripts.stop = function(args) {
	var applicationName = args.argv[0];
	
	exec(`helm delete ${applicationName} --purge`);
}

scripts.logs = function(args) {
	var flags = commandLineArgs([
		// filter to only listen on a specific set of pods
		{ name : "filter", type : String },
		// watch the pods to listen as the pods start/stop/restart
		{ name : "watch", type : String }
	], { argv : args.argv });
	
	if (flags.watch === undefined) {
		var pods = getCurrentPods(flags.filter);
		
		pods.forEach(function(val) {
			exec(`kubectl logs ${val.name}`);
		});
	} else {
		watchPods(flags.filter);
		setInterval(function() {
			watchPods(flags.filter);
		}, 2000);
	}
}

scripts.test = function(args) {
	var flags = commandLineArgs([
		{ name : "name", type : String, defaultOption : true }
	], { argv : args.argv });
	
	var names = [];
	var pods = getCurrentPods(flags.name).filter(val => val.testCommand !== undefined);
	
	pods.forEach(function(val, i) {
		if (names.includes(val.rootName) === true) {
			// we have already tested this container
			return;
		}
		
		names.push(val.rootName);
		
		exec(`kubectl exec -it ${val.name} ${val.testCommand}`);
	});
}

scripts.enterPod = function(args) {
	var podName = args.argv[0];
	var pod = getCurrentPods(podName)[0];
	console.log("Entering Pod:", pod.name)
	exec(`kubectl exec -it ${pod.name} /bin/sh`);
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

const validatePath = function(path) {
	if (fs.existsSync(path) === false) {
		throw new Error(`Invalid path ${path}`);
	}
}

const loadSettingsYaml = function(app) {
	const path = `/sv/applications/${app}/settings.yaml`;
	console.log(path);
	if (fs.existsSync(path) === false) {
		return {};
	}
	
	const settings = js_yaml.safeLoad(fs.readFileSync(path));
	return settings;
}

const getCurrentPods = function(filter) {
	const all = JSON.parse(child_process.execSync(`kubectl get pods -o json`));
	
	// pods which are scheduled for deletion, we can effectively ignore for logging purposes
	var pods = all.items.filter(val => val.metadata.deletionTimestamp === undefined);
	
	// simplify the return for downstream functions
	pods = pods.map(val => ({
		name : val.metadata.name,
		testCommand : val.metadata.annotations["sv-test-command"],
		rootName : val.metadata.name.replace(/-[^\-]+-[^\-]+$/, ""),
		ip : val.podIP
	}));
	
	// if we have a passed in filter, apply it
	if (filter) {
		pods = pods.filter(val => val.name.match(filter));
	}
	
	return pods;
}

const _watched = [];
async function watchPods(filter) {
	var pods = getCurrentPods(filter);
	var names = pods.map(val => val.name);
	
	names.forEach(function(val, i) {
		if (_watched[val] === undefined) {
			console.log(`Adding watcher for pod ${val}`);
			var child = child_process.spawn(`kubectl`, ["logs", val, "-f"], { stdio : "inherit" });
			child.on("close", function(code) {
				console.log(`pod closing ${val} ${code}`);
				delete _watched[val];
			});
			
			_watched[val] = child;
		}
	});
	
	for(var i in _watched) {
		if (names.includes(i) === false) {
			_watched[i].kill();
		}
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
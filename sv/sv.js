#!/usr/bin/env node

const fs = require("fs");
const { execSync, spawn } = require("child_process");
const read = require("read");
const util = require("util");
const commandLineArgs = require("command-line-args");
const js_yaml = require("js-yaml");
const git_state = require("git-state");

const readP = util.promisify(read);
var scriptName = process.argv[2];
var argv = process.argv.filter(function(val, i){ return i > 2; });

const validEnvs = ["local", "dev", "test", "qa", "staging", "live"];

var scripts = {};

var exec = function(command, options = {}) {
	return execSync(command, Object.assign({ stdio : "inherit" }, options));
}

var execSilent = function(command, options = {}) {
	return execSync(command, Object.assign({ stdio : "pipe" }, options)).toString().trim();
}

function checkOutdated() {
	const path = `/tmp/check_outdated.txt`;
	const allowedAge = 1000 * 60 * 60 * 24;
	if (!fs.existsSync(path)) {
		execSilent(`touch ${path}`);
	}
	
	const stats = fs.statSync(path);
	if (stats.mtimeMs + allowedAge > Date.now()) {
		// we have checked for updates already today, do nothing
		return;
	}
	
	execSilent("git fetch", { cwd : "/sv" });
	const status = gitStatus("/sv");
	if (status === "behind") {
		console.log("-----------------");
		console.log("WARNING: Your sv-kubernetes is out of date. Please git pull and re-run setup.sh to update.");
		console.log("See the change log at https://github.com/simpleviewinc/sv-kubernetes/blob/master/changelog.md for more info.");
		console.log("-----------------");
	}
	
	execSilent(`touch ${path}`);
}

function gitStatus(path) {
	const localCommit = execSilent(`git rev-parse @`, { cwd : path });
	const remoteCommit = execSilent(`git rev-parse @{u}`, { cwd : path });
	const baseCommit = execSilent(`git merge-base @ @{u}`, { cwd : path });
	
	// check the status of our remote working copy versus the remote to see if we have changes
	if (localCommit === remoteCommit) {
		return "equal";
	} else if (baseCommit !== localCommit) {
		return "ahead";
	} else {
		return "behind";
	}
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

scripts.install = async function(args) {
	const { name, type, branch, remote } = commandLineArgs([
		{ name : "name", type : String, defaultOption : true },
		{ name : "type", type : String, defaultValue : "app" },
		{ name : "branch", type : String, defaultValue : "master" },
		{ name : "remote", type : String, defaultValue : "origin" }
	], { argv : args.argv });
	
	if (["app", "container"].includes(type) === false) {
		throw new Error("Type must be 'app' or 'container'");
	}
	
	const resultType = {
		app : "applications",
		container : "containers"
	}
	
	const github_token = fs.readFileSync(`/sv/internal/github_token`).toString();
	const path = `/sv/${resultType[type]}/${name}`;
	
	if (!fs.existsSync(path)) {
		// initialize the repo from sv origin master branch
		exec(`git clone --recurse-submodules git@github.com:simpleviewinc/${name}.git ${path}`);
	}
	
	// execute from a specific path pipes the output via stdio inherit
	const execPath = function(str) {
		return exec(str, { cwd : path });
	}
	
	// execute from a specific path but return the result to a variable rather than stdio
	const execPathSilent = function(str) {
		return execSilent(str, { cwd : path });
	}
	
	const desiredRemoteBranch = `remotes/${remote}/${branch}`;
	const desiredLocalBranch = remote === "origin" ? branch : `${remote}-${branch}`;
	const localTracking = `${remote}/${branch}`;
	
	// if we are referencing another remote, we need to add it to the repository
	if (remote !== "origin") {
		try {
			// check if the remote exists, will throw if it doesn't
			execPathSilent(`git remote | grep ${remote}$`)
		} catch(e) {
			// remote doesn't exist, add it
			execPath(`git remote add ${remote} git@github.com:${remote}/${name}.git`);
		}
	}
	
	// pull down the latest code from that remote
	execPath(`git fetch ${remote}`);
	
	// check out local copy to see if we have untracked changes
	const result = git_state.checkSync(path);
	for(var i of ["dirty", "untracked"]) {
		if (result[i] > 0) {
			console.log(`${path} has uncommitted changes, unable to update, or switch to another branch/remote.`);
			return;
		}
	}
	
	const tracking = execPathSilent(`git rev-parse --abbrev-ref --symbolic-full-name @{u}`);
	
	if (localTracking !== tracking) {
		console.log(`Repository ${path} is currently checked out to '${tracking}' this will switch it to '${localTracking}'`);
		const result = await readP({ prompt : "Press [enter] to continue, or type 'no' to skip: " });
		if (result !== "no") {
			try {
				// check if the branch exists already on this repo
				execPath(`git branch | grep "${desiredLocalBranch}"`);
			} catch(e) {
				// branch doesn't exist, add it
				execPath(`git branch "${desiredLocalBranch}" --track "${desiredRemoteBranch}"`);
			}
			
			execPath(`git checkout "${desiredLocalBranch}"`);
		}
	}
	
	const status = gitStatus(path);
	if (status !== "equal") {
		console.log(`Repository ${path} can be updated, this will git pull those changes.`);
		const result = await readP({ prompt : "Press [enter] to continue, or type 'no' to skip: " });
		if (result !== "no") {
			execPath(`git pull`);
		}
	}
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
	const all = JSON.parse(execSync(`kubectl get pods -o json`));
	
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
			var child = spawn(`kubectl`, ["logs", val, "-f"], { stdio : "inherit" });
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
	var test = execSync(`docker image list --format "{{.Repository}},{{.Tag}},{{.ID}}" --filter "dangling=false"`);
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

checkOutdated();

scripts[scriptName]({ argv : argv });
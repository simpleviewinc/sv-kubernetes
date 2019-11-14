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

function log(str) {
	var now = new Date();
	
	console.log(now.toISOString(), str);
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

function mapBuildArgs(args=[]) {
	return args.map(arg => `--build-arg ${arg}`);
}

// public scripts
scripts.build = function(args) {
	const flags = commandLineArgs([
		{ name : "name", type : String },
		{ name : "app", type : String },
		{ name : "pushTag", type : String },
		{ name : "build-arg", type : String, multiple: true }
	], { argv : args.argv });
	
	if (flags.name === undefined) {
		throw new Error(`Must specify '--name'`);
	}
	
	let path;
	let containerName;
	
	if (flags.app === undefined) {
		path = `/sv/containers/${flags.name}`;
		containerName = flags.name;
	} else {
		path = `/sv/applications/${flags.app}/containers/${flags.name}`;
		containerName = `${flags.app}-${flags.name}`;
	}
	
	validatePath(path);
	
	const commandArgs = [];
	commandArgs.push(`-t ${containerName}:local`);
	
	if (flags.pushTag !== undefined) {
		commandArgs.push(`-t ${flags.pushTag}`);
	}
	
	if (flags.pushTag !== undefined) {
		// if we have a pushTag attempt a pull so we can prime the docker cache, if the remote image doesn't exist, we ignore the error
		exec(`cd ${path} && docker pull ${flags.pushTag} || true`);
		commandArgs.push(`--cache-from ${flags.pushTag}`);
	}
	
	if (flags["build-arg"] !== undefined) {
		commandArgs.push(...mapBuildArgs(flags["build-arg"]));
	}
	
	const commandArgString = commandArgs.join(" ");
	log(`Starting build of ${containerName}`);
	exec(`cd ${path} && docker build ${commandArgString} .`);
	log(`Completed build of ${containerName}`);
	
	if (flags.pushTag !== undefined) {
		exec(`cd ${path} && docker push ${flags.pushTag}`);
	}
}

scripts.install = async function(args) {
	const { name, type, branch, remote, "no-dependencies" : noDependencies } = commandLineArgs([
		{ name : "name", type : String, defaultOption : true },
		{ name : "type", type : String, defaultValue : "app" },
		{ name : "branch", type : String, defaultValue : "master" },
		{ name : "remote", type : String, defaultValue : "origin" },
		{ name : "no-dependencies", type : Boolean }
	], { argv : args.argv });
	
	if (name === undefined) {
		throw new Error("Must specify an application.");
	}
	
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
				execPath(`git show-ref "refs/heads/${desiredLocalBranch}"`);
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
	
	if (type === "app" && !noDependencies) {
		// if we are install an app, see if the app has dependencies and sv install those as well
		const settings = loadSettingsYaml(name);
		if (settings.dependencies) {
			for(var [key, dependency] of Object.entries(settings.dependencies)) {
				const argsArr = [];
				if (dependency.type) {
					argsArr.push(`--type=${dependency.type}`);
				}
				
				if (dependency.branch) {
					argsArr.push(`--branch=${dependency.branch}`);
				}
				
				const argString = argsArr.join(" ");
				
				exec(`sv install ${dependency.name} ${argString}`);
			}
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
		{ name : "build", type : Boolean },
		{ name : "push", type : Boolean },
		{ name : "alias", type : String },
		{ name : "build-arg", type : String, multiple: true }
	], { argv : myArgs, stopAtFirstUnknown : true });
	
	const commandArgs = [];
	const deploymentName = flags.alias !== undefined ? flags.alias : applicationName;
	const appFolder = `/sv/applications/${applicationName}`;
	const chartFolder = `${appFolder}/chart`;
	const containerFolder = `${appFolder}/containers`;
	
	commandArgs.push(
		deploymentName,
		chartFolder,
		`--install`,
		`--set sv.deploymentName=${deploymentName}`,
		`--set sv.env=${env}`,
		`--set sv.applicationPath=${appFolder}`,
		`--set sv.containerPath=${containerFolder}`,
		`-f /sv/internal/sv.json`
	);
	
	var envFile = `${chartFolder}/values_${env}.yaml`;
	if (fs.existsSync(envFile)) {
		commandArgs.push(`-f ${envFile}`);
	}
	
	const settings = loadSettingsYaml(applicationName);
	// use the dockerBase from config or dynamically generate it, the env variable will be present in circleci
	const dockerBase = settings.dockerBase || `gcr.io/${process.env.PROJECT_ID}`;
	
	for(let [key, val] of Object.entries(settings)) {
		if (typeof val === "string") {
			commandArgs.push(`--set sv.settings.${key}=${val}`);
		}
	}
	
	const tag = env;
	commandArgs.push(`--set sv.tag=${tag}`);

	const dockerRegistry = env !== "local" ? `${dockerBase}/` : "";
	commandArgs.push(`--set sv.dockerRegistry=${dockerRegistry}`);

	if (flags.build !== undefined) {
		const buildArgs = [
			`--app ${applicationName}`,
			`--build-arg SV_ENV=${env}`
		];
		
		if (flags["build-arg"] !== undefined) {
			buildArgs.push(...mapBuildArgs(flags["build-arg"]));
		}
		
		const isDirectory = source => fs.lstatSync(containerFolder + '/' + source).isDirectory()
		const dirs =
			settings[`buildOrder_${env}`] ||
			settings.buildOrder ||
			fs.readdirSync(containerFolder).filter(isDirectory)
		;
		
		dirs.forEach(function(val, i) {
			const myBuildArgs = [...buildArgs];
			myBuildArgs.push(`--name ${val}`);
			
			if (flags.push === true) {
				myBuildArgs.push(`--pushTag=${dockerBase}/${applicationName}-${val}:${tag}`);
			}
			
			const buildArgString = myBuildArgs.join(" ");
			
			exec(`sv build ${buildArgString}`);
		});
		
		exec(`sv _buildSvInfo`);
	}
	
	const secretFilesArray = [
		{
			encrypted : `${chartFolder}/secrets.yaml`,
			decrypted : `${chartFolder}/templates/secrets.dec.yaml`
		},
		{
			encrypted : `${chartFolder}/secrets_${env}.yaml`,
			decrypted : `${chartFolder}/templates/secrets_${env}.dec.yaml`
		}
	]
	
	function deleteSecrets() {
		secretFilesArray.forEach(file => {
			// ensure the file exists before attempting to delete it.
			if (fs.existsSync(file.decrypted)) {
				fs.unlinkSync(file.decrypted)
			}
		});
	}
	
	// Load Secrets
	secretFilesArray.forEach(file => {
		// check if the encrypted file exists before loading
		if (fs.existsSync(file.encrypted)) {
			try {
				exec(`kubesec decrypt ${file.encrypted} > ${file.decrypted}`);
			} catch(e) {
				// if we failed to decrypt, delete what was decrypted, and then throw
				deleteSecrets();
				throw e;
			}
		}
	});
	
	// append flags we don't recognize to pass to upgrade
	if (flags._unknown) {
		commandArgs.push(...flags._unknown);
	}
	
	const commandArgString = commandArgs.join(" ");
	
	try {
		console.log(`Starting application '${applicationName}' as '${deploymentName}' in env '${env}'`);
		exec(`helm upgrade ${commandArgString}`);
	} finally {
		// always delete decrypted files after upgrade.
		deleteSecrets();
	}
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
		
		console.log(`Running tests on ${val.name}`);
		try {
			exec(`kubectl exec -it ${val.name} ${val.testCommand}`);
		} catch(e) {
			// ensure that this process counts as failing, but allows us to continue running other tests
			process.exitCode = 1;
		}
	});
}

scripts.enterPod = function(args) {
	var podName = args.argv[0];
	var pod = getCurrentPods(podName)[0];
	// pick the best available shell, exec $shell replaces the initial /bin/sh with whatever shell it chooses to run
	const cmd = `/bin/sh -c 'shell=$(which bash >/dev/null 2>&1 && echo "bash" || echo "sh"); exec $shell'`
	console.log(`Entering Pod: ${pod.name}`);
	exec(`kubectl exec -it ${pod.name} -- ${cmd}`);
}

scripts.execPod = function(args) {
	const [podName, ...cmdParams] = args.argv;
	var pod = getCurrentPods(podName)[0];
	var cmd = cmdParams.join(" ");
	console.log(`Executing on pod: ${pod.name}`);
	exec(`kubectl exec -it ${pod.name} -- ${cmd}`);
}

scripts.describePod = function(args) {
	const podName = args.argv[0];
	if (podName === undefined) {
		throw new Error("Must specify a pod to enter.");
	}
	
	const pod = getCurrentPods(podName)[0];
	if (pod === undefined) {
		throw new Error(`${podName} not is not currently installed or running.`);
	}
	
	console.log(`Describe Pod: ${pod.name}`);
	exec(`kubectl describe pod/${pod.name}`);
}

scripts.copyFrom = function(args) {
	const podName = args.argv[0];
	const pathFrom = args.argv[1];
	const pathTo = args.argv[2];
	const pod = getCurrentPods(podName)[0];
	execSilent(`kubectl cp ${pod.name}:"${pathFrom}" "${pathTo}"`);
	console.log(`Copy complete to ${pathTo}`);
}

scripts.script = function(args) {
	const [applicationName, scriptName, ...flags] = args.argv;
	
	validateApp(applicationName);
	
	const appPath = `/sv/applications/${applicationName}`;
	
	const envVars = {
		SV_APP_PATH : appPath,
		SV_APP_NAME : applicationName
	};
	
	const rootPath = `${appPath}/scripts/${scriptName}`;
	const isJsFile = fs.existsSync(`${rootPath}.js`);
	
	const path = isJsFile ? rootPath + ".js" : rootPath;
	
	const script = `${path} ${flags.join(" ")}`;
	
	exec(script, {
		env : Object.assign({}, process.env, envVars)
	});
}

scripts.restartPod = function(args) {
	const podName = args.argv[0];
	const pods = getCurrentPods(podName);
	
	if (pods.length > 1) {
		throw new Error("Pod name returned more than 1 pod.");
	}
	
	exec(`kubectl delete pod ${pods[0].name} --force --grace-period=0`);
}

scripts.editSecrets = function (args) {
	const myArgs = args.argv.slice();
	const applicationName = myArgs.shift();
	
	const flags = commandLineArgs([
		{ name : "env", type : String }
	], { argv : myArgs, stopAtFirstUnknown : true });
	
	validateApp(applicationName);
	if (flags.env) {
		validateEnv(flags.env)
	}
	
	const appFolder = `/sv/applications/${applicationName}`;
	const chartFolder = `${appFolder}/chart`;
	const containerFolder = `${appFolder}/containers`;
	let secretsTemplate = fs.readFileSync(`/sv/internal/secretsTemplate.yaml`).toString();
	const envValue = flags.env ? "env" : "all";
	const secretName = `${applicationName}-secrets-${envValue}`;
	secretsTemplate = secretsTemplate.replace('$$name$$', secretName);
	secretsTemplate = secretsTemplate.replace('$$env$$', flags.env || "all");
	
	const secretsFile = flags.env ? `${chartFolder}/secrets_${flags.env}.yaml` : `${chartFolder}/secrets.yaml`;
	
	// start the new secrets file from the secretsTemplate.yaml file.
	if (!fs.existsSync(secretsFile)) {
		fs.writeFileSync(secretsFile, secretsTemplate);
	}
	
	const settings = loadSettingsYaml(applicationName);
	
	if (settings.secrets_key === undefined) {
		throw new Error("You must have a 'secrets_key' variable in your settings.yaml.");
	}
	
	exec(`EDITOR=nano kubesec edit -if --key=${settings.secrets_key} ${secretsFile}`);
}

scripts.debug = function(args) {
	function reverse(str) {
		console.log("\x1b[7m%s\x1b[0m", str);
	}
	
	function block(title, fn) {
		console.log("--------");
		reverse(title);
		console.log("");
		fn();
		console.log("");
	}
	
	block("Kubernetes Version", () => exec(`kubectl version --short`));
	block("Docker Version", () => exec(`docker -v`));
	block("Minikube Version", () => exec(`minikube version`));
	block("Helm Version", () => exec(`helm version`));
	block("sv-kubernetes", () => {
		const branch = execSilent(`git rev-parse --abbrev-ref --symbolic-full-name @{u}`, { cwd : "/sv" });
		const commit = execSilent(`git rev-parse @`, { cwd : "/sv" });
		console.log(`${branch} at ${commit}`);
	});
	block("Nodes", () => exec(`kubectl describe nodes`));
	block("All Running", () => exec(`kubectl get all --all-namespaces`));
}

scripts.fixDate = function() {
	exec(`service ntp stop`);
	exec(`sudo ntpd -gq`);
	exec(`service ntp start`);
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
		testCommand : val.metadata.annotations !== undefined && val.metadata.annotations["sv-test-command"] ? val.metadata.annotations["sv-test-command"] : undefined,
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

if (process.argv.length === 4 && process.argv[3] === "--help") {
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
#!/usr/bin/env node
//@ts-check

if (process.getuid() !== 0) {
	throw new Error("'sv' commands must be run as root");
}

const fs = require("fs");
const { execSync, spawn, fork } = require("child_process");
const read = require("read");
const util = require("util");
const commandLineArgs = require("command-line-args");
const git_state = require("git-state");
const chalk = require('chalk');
const crypto = require("crypto")
const scriptsNew = require("./scripts");

const {
	exec,
	execSilent,
	getCurrentContext,
	getCurrentPods,
	getCurrentPodsV2,
	loadSettingsYaml,
	logContext,
	mapBuildArgs,
	getDockerEnv,
	isWslEnv,
	isMinikubeEnv,
} = require("./utils");

const constants = require("./constants");

const readP = util.promisify(read);
var scriptName = process.argv[2];
var argv = process.argv.filter(function(val, i){ return i > 2; });

const validEnvs = ["local", "dev", "test", "qa", "staging", "live"];

/** @type {Record<string, ({}: { argv: string[] }) => void>} */
const scripts = { ...scriptsNew };

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
scripts.install = async function(args) {
	let { name, type, branch, remote, "no-dependencies" : noDependencies, github } = commandLineArgs([
		{ name : "name", type : String, defaultOption : true },
		{ name : "type", type : String, defaultValue : "app" },
		{ name : "branch", type : String, defaultValue : "master" },
		{ name : "remote", type : String, defaultValue : "origin" },
		{ name : "github", type : String },
		{ name : "no-dependencies", type : Boolean }
	], { argv : args.argv });

	if (github !== undefined) {
		const match = github.match(/^(.*?):(.*)$/);
		if (match === null || match.length !== 3) {
			throw new Error(`Github flag is invalid, must be in the form copied from github like --github="remote:branch"`);
		}

		remote = match[1];
		branch = match[2];
	}

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
	execPath(`git fetch --recurse-submodules ${remote}`);

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
			execPath(`git submodule update --init --recursive`);
		}
	}

	const status = gitStatus(path);
	if (status !== "equal") {
		console.log(`Repository ${path} can be updated, this will git pull those changes.`);
		const result = await readP({ prompt : "Press [enter] to continue, or type 'no' to skip: " });
		if (result !== "no") {
			execPath(`git pull --recurse-submodules`);
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
	logContext();

	var myArgs = args.argv.slice();
	var applicationName = myArgs.shift();
	var env = myArgs.shift();

	validateApp(applicationName);
	validateEnv(env);

	var flags = commandLineArgs([
		{ name : "build", type : Boolean },
		{ name : "push", type : Boolean },
		{ name : "alias", type : String },
		{ name : "tag", type : String },
		{ name : "build-arg", type : String, multiple: true }
	], { argv : myArgs, stopAtFirstUnknown : true });

	const commandArgs = [];
	const deploymentName = flags.alias !== undefined ? flags.alias : applicationName;
	const rootKubeFolder = isWslEnv() ? `/run/desktop/mnt/host/c/sv-kubernetes` : `/sv`;
	const appFolder = `/sv/applications/${applicationName}`;
	const chartFolder = `${appFolder}/chart`;
	const containerFolder = `${appFolder}/containers`;
	const externalApplicationFolder = `${rootKubeFolder}/applications/${applicationName}`;
	const externalContainerFolder = `${externalApplicationFolder}/containers`;
	const rootContainersFolder = `${rootKubeFolder}/containers`;

	commandArgs.push(
		deploymentName,
		chartFolder,
		`--install`,
		`--set sv.deploymentName=${deploymentName}`,
		`--set sv.env=${env}`,
		`--set sv.applicationPath=${externalApplicationFolder}`,
		`--set sv.containerPath=${externalContainerFolder}`,
		`--set sv.rootContainerPath=${rootContainersFolder}`,
		`--set sv.rootPath=${rootKubeFolder}`,
		`--set sv.canHostPort=${isMinikubeEnv()}`,
		`--set sv.isWsl=${isWslEnv()}`,
		`--set sv.isMinikube=${isMinikubeEnv()}`,
		`--set sv.refreshToken=$(cat /sv/internal/refresh_token 2>/dev/null)`,
		`--set sv.userInfo.email=$(cat /sv/internal/user_info.json 2>/dev/null | jq -r .email)`,
		`--set sv.applicationGitSha=$(git -C ${appFolder} rev-parse HEAD)`,
		`--set sv.applicationGitBranch=$(git -C ${appFolder} rev-parse --abbrev-ref HEAD)`,
		`-f /sv/internal/sv.json`
	);

	const envFile = `${chartFolder}/values_${env}.yaml`;
	if (fs.existsSync(envFile)) {
		commandArgs.push(`-f ${envFile}`);
	}

	const overwriteFile = `${chartFolder}/values_overwrite.yaml`;
	if (fs.existsSync(overwriteFile)) {
		commandArgs.push(`-f ${overwriteFile}`);
	}

	const settings = loadSettingsYaml(applicationName);
	// use the dockerBase from config or dynamically generate it, the env variable will be present in circleci
	const dockerBase = settings.dockerBase || `gcr.io/${process.env.PROJECT_ID}`;

	for(let [key, val] of Object.entries(settings)) {
		if (typeof val === "string") {
			commandArgs.push(`--set sv.settings.${key}=${val}`);
		}
	}

	const tag = flags.tag !== undefined ? flags.tag : env;
	commandArgs.push(`--set sv.tag=${tag}`);

	const dockerRegistry = env !== "local" ? `${dockerBase}/` : ``;
	commandArgs.push(`--set sv.dockerRegistry=${dockerRegistry}`);

	if (flags.build !== undefined) {
		const buildArgs = [
			`--app ${applicationName}`,
			`--env ${env}`
		];

		if (flags["build-arg"] !== undefined) {
			buildArgs.push(...mapBuildArgs(flags["build-arg"]));
		}

		const isDirectory = source => fs.lstatSync(containerFolder + '/' + source).isDirectory()

		// Build application containers
		const dirs =
			settings[`buildOrder_${env}`] ||
			settings.buildOrder ||
			fs.readdirSync(containerFolder).filter(isDirectory)
		;

		dirs.forEach(function(val, i) {
			if (val.startsWith("external/")) {
				const containerName = val.replace(/external\//, "");
				exec(`sv build --name=${containerName} --env=${env}`);
				return;
			}

			const myBuildArgs = [...buildArgs];
			myBuildArgs.push(`--name ${val}`);

			if (flags.push === true) {
				myBuildArgs.push(`--pushTag=${dockerRegistry}${applicationName}-${val}:${tag}`);
			}

			const buildArgString = myBuildArgs.join(" ");

			exec(`sv build ${buildArgString}`);
		});

		exec(`sv _buildSvInfo`);
	}

	const secretFilesArray = [
		{
			encrypted : `${chartFolder}/secrets.yaml`,
			decrypted : `${chartFolder}/templates/secrets.dec.yaml`,
			svValue : "secretsChecksum"
		},
		{
			encrypted : `${chartFolder}/secrets_${env}.yaml`,
			decrypted : `${chartFolder}/templates/secrets_${env}.dec.yaml`,
			svValue : "secretsEnvChecksum"
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
		let checksum;

		// check if the encrypted file exists before loading
		if (fs.existsSync(file.encrypted)) {
			try {
				exec(`kubesec decrypt ${file.encrypted} > ${file.decrypted}`);
			} catch(e) {
				// if we failed to decrypt, delete what was decrypted, and then throw
				deleteSecrets();
				throw e;
			}

			// read the secrets file and md5 hash the contents
			checksum = crypto.createHash("md5").update(fs.readFileSync(file.encrypted)).digest("hex");
		}

		commandArgs.push(`--set sv.${file.svValue}=${checksum ? checksum : ""}`);
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
	logContext();

	var applicationName = args.argv[0];

	exec(`helm uninstall ${applicationName}`);
}

scripts.logs = function(args) {
	var flags = commandLineArgs([
		// filter to only listen on a specific set of pods
		{ name : "filter", type : String, defaultOption : true },
		{ name : "container", alias : "c", type : String },
		// watch the pods to listen as the pods start/stop/restart
		{ name : "watch", type : String }
	], { argv : args.argv });

	if (flags.filter === undefined) {
		throw new Error("Must specify an application/pod to retrieve logs from.");
	}

	if (flags.watch === undefined) {
		var pods = getCurrentPods(flags.filter, flags.container);

		pods.forEach(function(pod) {
			pod.containerNames.forEach(containerName => {
				exec(`kubectl logs ${pod.name} -c ${containerName}`);
			});
		});
	} else {
		const watch = function() {
			watchPods(flags.filter, flags.container);
		}

		watch();
		setInterval(watch, 2000);
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
			exec(`kubectl exec -it ${val.name} -- ${val.testCommand}`);
		} catch(e) {
			// ensure that this process counts as failing, but allows us to continue running other tests
			process.exitCode = 1;
		}
	});
};

scripts.switchContext = function (args) {
	let flags = commandLineArgs([
		{ name : "project", type: String, alias : "p" },
		{ name : "cluster", type: String, alias : "c" }
	], { argv: args.argv });

	// must always pass a cluster
	if (flags.cluster === undefined) {
		throw new Error("You must pass a {cluster} of type [dev|test|local]");
	}

	if (flags.cluster !== "local" && flags.project === undefined) {
		throw new Error("You must provide a {project} and a {cluster} of type [dev|test] when switching to GCP resources");
	}

	try {
		if (flags.cluster !== "local") {
			exec(`USE_GKE_GCLOUD_AUTH_PLUGIN=True gcloud container clusters get-credentials ${flags.cluster} --zone us-east1-b --project sv-${flags.project}-231700`);
			exec(`kubectl config use-context ${getCurrentContext()}`);
		} else if (isWslEnv()) {
			exec(`kubectl config use-context docker-desktop`);
		} else {
			exec(`kubectl config use-context minikube`);
		}
	} catch(err) {
		throw new Error(`Error Switching Contexts\nCluster: ${chalk.blue(flags.cluster)}\nProject: ${chalk.blue(flags.project)}`);
	}
};

scripts.getContext = function (args) {
	logContext();
}

scripts.listProjects = function() {
	const data = JSON.parse(execSync(`gcloud projects list --filter sv- --format json`).toString().trim());

	// the project switch mechanics only allow sv-foo-231700 so we're enforcing that here
	const regex = /^sv\-(.+)-231700$/

	const temp = data
		.filter(val => val.projectId.match(/^sv\-.+-231700$/))
		.map(val => val.projectId.replace(regex, "$1"))
	;

	temp.sort();

	console.log(temp.join("\n"));
}

scripts.enterPod = function(args) {
	var flags = commandLineArgs([
		{ name : "podName", type : String, defaultOption : true },
		{ name : "container", alias : "c", type : String }
	], { argv : args.argv });

	var pod = getCurrentPods(flags.podName, flags.container)[0];

	if (pod === undefined) {
		throw new Error("Pod not found");
	}

	// pick the best available shell, exec $shell replaces the initial /bin/sh with whatever shell it chooses to run
	const cmd = `/bin/sh -c 'shell=$(which bash >/dev/null 2>&1 && echo "bash" || echo "sh"); exec $shell'`
	console.log(`Entering Pod: ${pod.name}`);
	try {
		exec(`kubectl exec -it ${pod.name} -c ${pod.containerNames[0]} -- ${cmd}`);
	} catch(e) {
		// blackholing error, since stderr, stdout streamed to console
		// otherwise this throws if the last run command was a non-0 command
	}
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
	var flags = commandLineArgs([
		// filter to only listen on a specific set of pods
		{ name : "container", alias : "c", type : String },
		{ name : "args", type : String, multiple : true, defaultOption : true }
	], { argv : args.argv });

	const podName = flags.args[0];
	const pathFrom = flags.args[1];
	const pathTo = flags.args[2];
	const pod = getCurrentPods(podName)[0];

	const containerString = flags.container !== undefined ? `-c ${flags.container}` : "";

	execSilent(`kubectl cp ${containerString} ${pod.name}:"${pathFrom}" "${pathTo}"`);
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

	const env = {
		...getDockerEnv(),
		...envVars
	};

	if (isJsFile) {
		fork(path, flags, {
			env
		});
	} else {
		const script = `${path} ${flags.join(" ")}`;

		exec(script, {
			env
		});
	}
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

	const appFolder = `${constants.APPS_FOLDER}/${applicationName}`;
	const chartFolder = `${appFolder}/chart`;

	const secretsFlag = flags.env ? 'env' : 'all';
	let secretsTemplate = fs.readFileSync(`/sv/internal/secretsTemplate.yaml`).toString();
	secretsTemplate = secretsTemplate.replace(/\$\$env\$\$/g, secretsFlag );

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
		try {
			fn();
		} catch (err) {
			// no need to use the error, we're already streaming the output to the console
		}
		console.log("");
	}

	block("Memory Utilized", () => exec(`sudo free -m`));
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
	exec(`systemctl restart systemd-timesyncd`);
}

/**
 * Delete pods which are in a failed status, usually due to eviction. Kubernetes leaves these behind so developers can debug them, but they can clutter if too many are left behind
 */
scripts.deleteFailedPods = function() {
	const pods = getCurrentPods();
	const failed = pods.filter(val => val.status === "Failed");
	for(let [key, val] of Object.entries(failed)) {
		console.log("deleting", val.name);
		execSync(`kubectl delete pod ${val.name}`);
	}
}

//// PRIVATE METHODS

const validateEnv = function(env) {
	if (validEnvs.includes(env) === false) {
		throw new Error(`Invalid env ${env}`);
	}
}

const validateApp = function(app) {
	const folder = `${constants.APPS_FOLDER}/${app}`;

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

const _watched = {};
async function watchPods(filter, container) {
	const pods = getCurrentPods(filter, container);
	const names = [];

	pods.forEach(({ name, runningContainerNames }) => {
		runningContainerNames.forEach(containerName => {
			const key = `${name}:${containerName}`;
			names.push(key);

			if (_watched[key] === undefined) {
				console.log(`Adding watcher for pod ${key}`);
				var child = spawn(`kubectl`, ["logs", name, "-f", "-c", containerName], { stdio : "inherit" });
				child.on("close", function(code) {
					console.log(`pod closing ${key} ${code}`);
					delete _watched[key];
				});

				_watched[key] = child;
			}
		});
	});

	for(var i in _watched) {
		if (names.includes(i) === false) {
			_watched[i].kill();
		}
	}
}

// stores the state of the docker registry in a local file, exposing to to sv start
scripts._buildSvInfo = function(args) {
	var test = execSync(`docker image list --format "{{.Repository}},{{.Tag}},{{.ID}}" --filter "dangling=false"`, {
		env: getDockerEnv()
	});
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
	process.exit();
}

if (process.argv.length === 4 && process.argv[3] === "--help") {
	var docPath = `/sv/docs/sv_${scriptName}.md`;
	if (fs.existsSync(docPath)) {
		console.log(fs.readFileSync(docPath).toString());
		process.exit();
	}
}

if (scripts[scriptName] === undefined) {
	console.log(`Script '${scriptName}' doesn't exist.`);
	process.exit();
}

checkOutdated();

scripts[scriptName]({ argv : argv });

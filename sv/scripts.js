//@ts-check
const commandLineArgs = require("command-line-args");
const js_yaml = require("js-yaml");
const fs = require("fs");
const lodash = require("lodash");
const read = require("read");
const util = require("util");

const {
	deepMerge,
	exec,
	execSilent,
	getCurrentPods,
	loadYaml,
	loadSettingsYaml,
	log,
	validatePath,
	getDockerEnv,
	getCurrentPodsV2,
	getAuthTokenFromRefreshToken
} = require("./utils");

const constants = require("./constants");

const readP = util.promisify(read);

function build({ argv }) {
	const flags = commandLineArgs([
		{ name : "name", type : String },
		{ name : "app", type : String },
		{ name : "pushTag", type : String },
		{ name : "env", type : String },
		{ name : "build-arg", type : String, multiple: true }
	], { argv });

	if (flags.name === undefined) {
		throw new Error(`Must specify '--name'`);
	}

	let path;
	let appPath;
	let containerName;

	if (flags.app === undefined) {
		path = `${constants.CONTAINERS_FOLDER}/${flags.name}`;
		containerName = flags.name;
	} else {
		appPath = `${constants.APPS_FOLDER}/${flags.app}`;
		path = `${appPath}/containers/${flags.name}`;
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

	const buildArgs = {};

	const settings = loadSettingsYaml(flags.app);
	const containerBuildArgs = settings.buildArgs ? settings.buildArgs.filter(val => val.container === flags.name)[0] : undefined;

	if (flags.app !== undefined && containerBuildArgs !== undefined) {
		const mergeData = {};
		const secretsPath = `${appPath}/chart/secrets.yaml`;
		if (fs.existsSync(secretsPath)) {
			const str = execSilent(`kubesec decrypt ${secretsPath}`).toString();
			const yaml = js_yaml.safeLoad(str);
			mergeData.secrets = yaml.stringData;
		}

		const secretsEnvPath = `${appPath}/chart/secrets_${flags.env}.yaml`;
		if (fs.existsSync(secretsEnvPath)) {
			const str = execSilent(`kubesec decrypt ${secretsEnvPath}`).toString();
			const yaml = js_yaml.safeLoad(str);
			mergeData.secrets_env = yaml.stringData;
		}

		const rootValues = loadYaml(`${appPath}/chart/values.yaml`);
		const envValues = loadYaml(`${appPath}/chart/values_${flags.env}.yaml`);
		mergeData.values = deepMerge(rootValues, envValues);

		for(let arg of containerBuildArgs.args) {
			const value = lodash.get(mergeData, arg.path);

			if (value !== undefined) {
				buildArgs[arg.name] = value;
			}
		}
	}

	if (flags["build-arg"] !== undefined) {
		for(let arg of flags["build-arg"]) {
			const parts = arg.split("=");
			buildArgs[parts[0]] = parts[1];
		}
	}

	if (flags.env !== undefined) {
		buildArgs.SV_ENV = flags.env;
	}

	for(let [key, value] of Object.entries(buildArgs)) {
		commandArgs.push(`--build-arg ${key}='${value}'`);
	}

	const commandArgString = commandArgs.join(" ");

	log(`Starting build of ${containerName}`);

	exec(`cd ${path} && docker build ${commandArgString} .`, {
		env: getDockerEnv()
	});
	log(`Completed build of ${containerName}`);

	if (flags.pushTag !== undefined) {
		exec(`cd ${path} && docker push ${flags.pushTag}`);
	}
}

function deleteEvicted({ argv }) {
	const pods = getCurrentPods();

	const evictedPods = pods.filter(val => val.raw.status.reason === "Evicted");

	for(let pod of evictedPods) {
		exec(`kubectl delete pod ${pod.name}`);
	}

	console.log(`${evictedPods.length} pods deleted.`);
}

/**
 * Get the current cpu, memory for all pods on the cluster
 */
function topPods() {
	const pods = getCurrentPodsV2({ allNamespaces: true });
	const podIndex = lodash.keyBy(pods, "name");

	const topResult = execSilent("kubectl top pods --all-namespaces --no-headers --containers").toString();
	const rows = topResult.split("\n").map(val => {
		// the data comes in whitespace separated, and thus splits it apart
		const parts = val.split(/\s+/);
		return {
			namespace: parts[0],
			podName: parts[1],
			container: parts[2],
			cpu: parts[3],
			memory: parts[4]
		}
	});

	const cleaned = rows.map(row => {
		// find our pod reference so we can get the requests
		const pod = podIndex[row.podName];
		const container = pod.containers.filter(val => val.name === row.container)[0];

		return {
			name: row.podName,
			container: container.name,
			node: pod.nodeName,
			namespace: pod.namespace,
			cpuUsed: row.cpu,
			cpuRequest: container.resources.requests.cpu,
			memoryUsed: row.memory,
			memoryRequest: container.resources.requests.memory
		}
	});

	// This generates a single string with all of the files with one space sepearating every term
	const entryString = cleaned.map(val => {
		return Object.values(val).join(" ");
	}).join("\n");

	fs.writeFileSync("/tmp/topPods.txt", entryString);

	// column will convert our one-space separated output into neatly formatted linux column output
	exec(`column -t --table-columns "POD,CONTAINER,NODE,NAMESPACE,CPU(USED),CPU(REQ),MEM(USED),MEM(REQ)" /tmp/topPods.txt`);
}

function minikubeSystemPrune() {
	exec(`docker system prune`, {
		env: getDockerEnv()
	});
}

function logFailed() {
	const pods = getCurrentPodsV2();
	for (const pod of pods) {
		for (const container of pod.errorContainerNames) {
			console.log(`---POD: ${pod.name} CONTAINER: ${container} ---`);
			exec(`kubectl logs ${pod.name} -c ${container}`);
		}
	}
}

async function authLogin() {
	const graphUrl = "https://graphql.simpleviewinc.com";
	const headers = {
		"Content-Type": "application/json"
	}

	console.log("Visit https://auth.simpleviewinc.com/ and log in. Once complete click on 'Refresh Token' and paste the value here.");
	const refreshToken = await readP({ prompt: "Paste Refresh Token: " });

	const token = await getAuthTokenFromRefreshToken(refreshToken);

	const userFetch = await fetch(graphUrl, {
		method: "POST",
		headers: {
			...headers,
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			query: `
				query {
					auth {
						current(acct_id: "sv-all") {
							success
							message
							doc {
								email
								firstname
								lastname
								sv
							}
						}
					}
				}
			`
		})
	});

	const json = await userFetch.json();
	const userResult = json.data.auth.current;
	if (!userResult.success) {
		throw new Error(userResult.message);
	}

	if (!userResult.doc.sv === true) {
		throw new Error("User is not SV, unable to proceed.");
	}

	console.log("Logged in as: ", userResult.doc.email);
	await fs.writeFileSync(constants.REFRESH_TOKEN_PATH, refreshToken);
	await fs.writeFileSync("/sv/internal/auth_token", token);
	await fs.writeFileSync("/sv/internal/user_info.json", JSON.stringify(userResult.doc));
}

async function authToken() {
	if (!fs.existsSync(constants.REFRESH_TOKEN_PATH)) {
		throw new Error("Must login with 'sv authLogin'.");
	}

	const token = await getAuthTokenFromRefreshToken(await fs.readFileSync(constants.REFRESH_TOKEN_PATH).toString());
	await fs.writeFileSync(constants.AUTH_TOKEN_PATH, token);
	console.log("Generated token: ");
	console.log(token);
}

module.exports.build = build;
module.exports.minikubeSystemPrune = minikubeSystemPrune;
module.exports.deleteEvicted = deleteEvicted;
module.exports.topPods = topPods;
module.exports.logFailed = logFailed;
module.exports.authLogin = authLogin;
module.exports.authToken = authToken;

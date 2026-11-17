//@ts-check
const fs = require("fs");
const js_yaml = require("js-yaml");

const { exec } = require("./utils");

// Google service account id, then @, then a project id, then the fixed suffix.
const SERVICE_ACCOUNT_EMAIL = /^[a-z][a-z0-9-]{4,28}[a-z0-9]@[a-z][a-z0-9-]{4,28}[a-z0-9]\.iam\.gserviceaccount\.com$/;

/**
 * Chart contract. Set this only on environments that should run without a JSON key:
 *
 * workloadIdentity:
 *   gcpServiceAccount: <service-account-email>
 *
 * sv applies a ServiceAccount named from the email's account id and passes that
 * name to the chart as sv.workloadIdentityServiceAccount. sv stop does not delete it.
 *
 * @param {string} chartFolder
 * @param {string} env
 * @returns {{ name: string, gcpServiceAccount: string } | undefined}
 */
function workloadIdentityForChart(chartFolder, env) {
	const files = [
		`${chartFolder}/values.yaml`,
		`${chartFolder}/values_${env}.yaml`,
		`${chartFolder}/values_overwrite.yaml`
	];

	/** @type {string | undefined} */
	let gcpServiceAccount;

	for (const file of files) {
		if (fs.existsSync(file) === false) {
			continue;
		}

		const yaml = js_yaml.safeLoad(fs.readFileSync(file, "utf8")) || {};
		if (yaml.workloadIdentity == null || typeof yaml.workloadIdentity !== "object") {
			continue;
		}
		if (!("gcpServiceAccount" in yaml.workloadIdentity)) {
			continue;
		}

		gcpServiceAccount = yaml.workloadIdentity.gcpServiceAccount;
	}

	if (gcpServiceAccount === undefined || gcpServiceAccount === "" || gcpServiceAccount === null) {
		return undefined;
	}

	if (typeof gcpServiceAccount !== "string" || SERVICE_ACCOUNT_EMAIL.test(gcpServiceAccount) === false) {
		throw new Error("workloadIdentity.gcpServiceAccount must be a Google service account email.");
	}

	return {
		name: gcpServiceAccount.split("@")[0],
		gcpServiceAccount
	};
}

/**
 * @param {string[] | undefined} helmArgs
 * @returns {string | undefined}
 */
function namespaceFromHelmArgs(helmArgs) {
	if (helmArgs === undefined) {
		return undefined;
	}

	for (let i = 0; i < helmArgs.length; i++) {
		const arg = helmArgs[i];
		if (arg === "--namespace" || arg === "-n") {
			return helmArgs[i + 1];
		}
		if (arg.startsWith("--namespace=")) {
			return arg.slice("--namespace=".length);
		}
	}

	return undefined;
}

/**
 * Server-side apply so the account has no Helm owner and later releases can update it.
 * @param {{ name: string, gcpServiceAccount: string }} identity
 * @param {string | undefined} namespace
 */
function applyWorkloadIdentityServiceAccount(identity, namespace) {
	const manifest = js_yaml.safeDump({
		apiVersion: "v1",
		kind: "ServiceAccount",
		metadata: {
			name: identity.name,
			annotations: {
				"iam.gke.io/gcp-service-account": identity.gcpServiceAccount
			}
		}
	});

	const namespaceArg = namespace ? `--namespace ${namespace}` : "";
	console.log(`Applying workload identity service account '${identity.name}'`);
	exec(`kubectl apply --server-side --field-manager=sv ${namespaceArg} -f -`, {
		input: manifest,
		stdio: ["pipe", "inherit", "inherit"]
	});
}

module.exports = {
	applyWorkloadIdentityServiceAccount,
	namespaceFromHelmArgs,
	workloadIdentityForChart
};

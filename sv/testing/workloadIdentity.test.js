const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { namespaceFromHelmArgs, workloadIdentityForChart } = require("../workloadIdentity");

const EMAIL = "app-worker@example-project.iam.gserviceaccount.com";

describe(__filename, function() {
	/** @type {string} */
	let chartFolder;

	beforeEach(function() {
		chartFolder = fs.mkdtempSync(path.join(os.tmpdir(), "wif-"));
	});

	afterEach(function() {
		fs.rmSync(chartFolder, { recursive: true, force: true });
	});

	function write(name, body) {
		fs.writeFileSync(path.join(chartFolder, name), body);
	}

	it("returns nothing when the chart does not opt in", function() {
		write("values.yaml", "replicas: 1\n");
		assert.strictEqual(workloadIdentityForChart(chartFolder, "test"), undefined);
	});

	it("uses the account id as the Kubernetes service account name", function() {
		write("values.yaml", `workloadIdentity:\n  gcpServiceAccount: ${EMAIL}\n`);
		assert.deepStrictEqual(workloadIdentityForChart(chartFolder, "test"), {
			name: "app-worker",
			gcpServiceAccount: EMAIL
		});
	});

	it("lets the env values replace the base email", function() {
		write("values.yaml", "workloadIdentity:\n  gcpServiceAccount: other-worker@example-project.iam.gserviceaccount.com\n");
		write("values_test.yaml", `workloadIdentity:\n  gcpServiceAccount: ${EMAIL}\n`);
		assert.strictEqual(workloadIdentityForChart(chartFolder, "test").gcpServiceAccount, EMAIL);
	});

	it("lets an empty env value turn the account off", function() {
		write("values.yaml", `workloadIdentity:\n  gcpServiceAccount: ${EMAIL}\n`);
		write("values_test.yaml", "workloadIdentity:\n  gcpServiceAccount: \"\"\n");
		assert.strictEqual(workloadIdentityForChart(chartFolder, "test"), undefined);
	});

	it("rejects an email that is not a Google service account", function() {
		write("values.yaml", "workloadIdentity:\n  gcpServiceAccount: not-an-email\n");
		assert.throws(() => workloadIdentityForChart(chartFolder, "test"), /Google service account email/);
	});

	it("reads a namespace passed through to helm", function() {
		assert.strictEqual(namespaceFromHelmArgs(["--namespace", "apps"]), "apps");
		assert.strictEqual(namespaceFromHelmArgs(["--namespace=apps"]), "apps");
		assert.strictEqual(namespaceFromHelmArgs(["-n", "apps"]), "apps");
		assert.strictEqual(namespaceFromHelmArgs(undefined), undefined);
	});
});

const assert = require("assert");

const getVarsPath = require.resolve("../deploy/getVars");

const envKeys = ["REPO_NAME", "BRANCH_NAME", "CIRCLE_PR_NUMBER", "PR_NUMBER", "LEGACY_ENV", "HELM_TIMEOUT"];

function load(overrides) {
	const previous = {};
	for (const key of envKeys) {
		previous[key] = process.env[key];
		if (overrides[key] === undefined) {
			delete process.env[key];
		} else {
			process.env[key] = overrides[key];
		}
	}

	delete require.cache[getVarsPath];
	try {
		return require(getVarsPath)();
	} finally {
		delete require.cache[getVarsPath];
		for (const key of envKeys) {
			if (previous[key] === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = previous[key];
			}
		}
	}
}

function deploy(branch, extra) {
	return load(Object.assign({ REPO_NAME : "apex", BRANCH_NAME : branch }, extra));
}

describe("deploy/getVars", function() {
	describe("existing branches stay on their own release", function() {
		const expected = {
			develop : "dev",
			qa : "qa",
			staging : "staging",
			master : "live"
		};

		for (const [branch, envName] of Object.entries(expected)) {
			it(branch, function() {
				const vars = deploy(branch);
				assert.strictEqual(vars.env, envName);
				assert.strictEqual(vars.isPreview, false);
				assert.strictEqual(vars.aliasName, "apex");
				assert.strictEqual(vars.aliasFlag, "");
				assert.strictEqual(vars.tagFlag, "");
				assert.strictEqual(vars.isPull, false);
			});
		}

		it("pull request", function() {
			const vars = deploy("preview/dev/client-scaling", { CIRCLE_PR_NUMBER : "42" });
			assert.strictEqual(vars.isPull, true);
			assert.strictEqual(vars.isPreview, false);
			assert.strictEqual(vars.env, "test");
			assert.strictEqual(vars.aliasFlag, "--alias apex-pull-42");
			assert.strictEqual(vars.tagFlag, "--tag pull-42");
		});

		it("unrelated branch", function() {
			const vars = deploy("feature/something");
			assert.strictEqual(vars.isPreview, false);
			assert.strictEqual(vars.env, undefined);
			assert.strictEqual(vars.aliasFlag, "");
			assert.strictEqual(vars.tagFlag, "");
		});

		it("pull request number without a CircleCI number", function() {
			const vars = deploy("develop", { PR_NUMBER : "7" });
			assert.strictEqual(vars.isPull, true);
			assert.strictEqual(vars.isPreview, false);
			assert.strictEqual(vars.env, "test");
			assert.strictEqual(vars.aliasFlag, "--alias apex-pull-7");
			assert.strictEqual(vars.tagFlag, "--tag pull-7");
		});

		it("keeps a numeric helm timeout in seconds", function() {
			const vars = deploy("develop", { HELM_TIMEOUT : "300" });
			assert.strictEqual(vars.helmTimeout, "300s");
			assert.strictEqual(vars.aliasFlag, "");
		});

		it("keeps a duration helm timeout unchanged", function() {
			const vars = deploy("qa", { HELM_TIMEOUT : "5m0s" });
			assert.strictEqual(vars.helmTimeout, "5m0s");
		});
	});

	describe("non-legacy branches stay on their own release", function() {
		const expected = {
			develop : "int",
			int : "int",
			qa : "qc",
			qc : "qc",
			staging : "stage",
			stage : "stage",
			master : "prod",
			prod : "prod"
		};

		for (const [branch, envName] of Object.entries(expected)) {
			it(branch, function() {
				const vars = deploy(branch, { LEGACY_ENV : "false" });
				assert.strictEqual(vars.env, envName);
				assert.strictEqual(vars.isPreview, false);
				assert.strictEqual(vars.aliasName, "apex");
				assert.strictEqual(vars.aliasFlag, "");
				assert.strictEqual(vars.tagFlag, "");
				assert.strictEqual(vars.isPull, false);
			});
		}
	});

	describe("preview branches", function() {
		const expected = {
			"preview/dev/client-scaling" : { env : "dev", name : "pdev-client-scaling" },
			"preview/qa/client-scaling" : { env : "qa", name : "pqa-client-scaling" },
			"preview/staging/client-scaling" : { env : "staging", name : "pstaging-client-scaling" }
		};

		for (const [branch, want] of Object.entries(expected)) {
			it(branch, function() {
				const vars = deploy(branch);
				assert.strictEqual(vars.env, want.env);
				assert.strictEqual(vars.isPreview, true);
				assert.strictEqual(vars.isPull, false);
				assert.strictEqual(vars.aliasFlag, `--alias apex-${want.name}`);
				assert.strictEqual(vars.tagFlag, `--tag ${want.name}`);
			});
		}

		it("rejects live", function() {
			const vars = deploy("preview/live/client-scaling");
			assert.strictEqual(vars.isPreview, false);
			assert.strictEqual(vars.aliasFlag, "");
		});

		it("rejects a slug that is not a helm name", function() {
			const vars = deploy("preview/dev/Bad_Slug");
			assert.strictEqual(vars.isPreview, false);
			assert.strictEqual(vars.aliasFlag, "");
		});

		it("rejects a release name over 53 characters", function() {
			assert.throws(
				() => deploy(`preview/staging/${"a".repeat(45)}`),
				/exceeds 53 characters/
			);
		});

		it("uses the resolved env name when LEGACY_ENV is false", function() {
			const cases = {
				"preview/dev/client-scaling" : { env : "int", name : "pint-client-scaling" },
				"preview/qa/client-scaling" : { env : "qc", name : "pqc-client-scaling" },
				"preview/staging/client-scaling" : { env : "stage", name : "pstage-client-scaling" }
			};
			for (const [branch, want] of Object.entries(cases)) {
				const vars = deploy(branch, { LEGACY_ENV : "false" });
				assert.strictEqual(vars.env, want.env, branch);
				assert.strictEqual(vars.isPreview, true, branch);
				assert.strictEqual(vars.aliasFlag, `--alias apex-${want.name}`, branch);
				assert.strictEqual(vars.tagFlag, `--tag ${want.name}`, branch);
			}
		});

		it("does not change the helm timeout", function() {
			const vars = deploy("preview/dev/client-scaling", { HELM_TIMEOUT : "300" });
			assert.strictEqual(vars.helmTimeout, "300s");
			assert.strictEqual(vars.tagFlag, "--tag pdev-client-scaling");
		});

		it("accepts non-legacy env names", function() {
			const expected = {
				"preview/int/client-scaling" : { env : "int", name : "pint-client-scaling" },
				"preview/qc/client-scaling" : { env : "qc", name : "pqc-client-scaling" },
				"preview/stage/client-scaling" : { env : "stage", name : "pstage-client-scaling" }
			};
			for (const [branch, want] of Object.entries(expected)) {
				const vars = deploy(branch, { LEGACY_ENV : "false" });
				assert.strictEqual(vars.env, want.env, branch);
				assert.strictEqual(vars.aliasFlag, `--alias apex-${want.name}`, branch);
				assert.strictEqual(vars.tagFlag, `--tag ${want.name}`, branch);
			}
		});

		it("rejects non-legacy env names on a legacy pipeline", function() {
			assert.throws(
				() => deploy("preview/qc/client-scaling"),
				/does not map to a cluster/
			);
		});

		it("rejects prod", function() {
			const vars = deploy("preview/prod/client-scaling", { LEGACY_ENV : "false" });
			assert.strictEqual(vars.isPreview, false);
			assert.strictEqual(vars.aliasFlag, "");
		});
	});
});

//@ts-check
const env = require("env-var");
const CIRCLE_PR_NUMBER = env.get("CIRCLE_PR_NUMBER").asInt();
const PR_NUMBER = env.get("PR_NUMBER").asInt();
const LEGACY_ENV = env.get("LEGACY_ENV").default("true").asBool();
const REPO_NAME = env.get("REPO_NAME").required().asString();
const HELM_TIMEOUT = env.get("HELM_TIMEOUT").default("5m0s").asString();
const BRANCH_NAME = env.get("BRANCH_NAME").required().asString();

const isPull = PR_NUMBER !== undefined || CIRCLE_PR_NUMBER !== undefined;
const prNumber = isPull ? (PR_NUMBER !== undefined ? PR_NUMBER : CIRCLE_PR_NUMBER) : undefined;
// preview/<env>/<slug> deploys beside the env's own release. Live and prod are not previewable.
const previewBranches = {
	dev : "develop",
	int : "int",
	qa : "qa",
	qc : "qc",
	staging : "staging",
	stage : "stage"
};
const previewMatch = isPull ? null : BRANCH_NAME.match(/^preview\/(dev|int|qa|qc|staging|stage)\/([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)$/);
const previewEnv = previewMatch ? previewMatch[1] : undefined;
const previewSlug = previewMatch ? previewMatch[2] : undefined;
const isPreview = previewSlug !== undefined;
const branchName = isPull ? "test" : isPreview ? previewBranches[previewEnv] : BRANCH_NAME;

/** @type {Record<string, string>} */
const envs = LEGACY_ENV === true ? {
	master : "live",
	staging : "staging",
	develop : "dev",
	qa : "qa",
	test : "test"
} : {
	master : "prod",
	prod : "prod",
	staging : "stage",
	stage : "stage",
	develop : "int",
	int : "int",
	qa : "qc",
	qc : "qc",
	test : "test"
};

// int, qc, and stage exist only on the non-legacy map. Fail closed rather than tagging "pundefined-".
if (isPreview && envs[branchName] === undefined) {
	throw new Error(`Preview branch '${BRANCH_NAME}' does not map to a cluster when LEGACY_ENV=${LEGACY_ENV}`);
}

// Charts detect a preview by the "p<sv.env>-" tag prefix, so it must follow the resolved env name.
const previewName = isPreview ? `p${envs[branchName]}-${previewSlug}` : undefined;
const aliasName = isPull ? `${REPO_NAME}-pull-${prNumber}` : isPreview ? `${REPO_NAME}-${previewName}` : REPO_NAME;
const aliasFlag = isPull || isPreview ? `--alias ${aliasName}` : '';
const tagFlag = isPull ? `--tag pull-${prNumber}` : isPreview ? `--tag ${previewName}` : '';

// Helm release names are limited to 53 characters.
if (isPreview && aliasName.length > 53) {
	throw new Error(`Preview release name '${aliasName}' exceeds 53 characters, shorten the slug`);
}

// if the HELM_TIMEOUT was just 300, or 500 we default it to seconds for backward compat
const helmTimeout = HELM_TIMEOUT.match(/^[0-9]+$/) ? `${HELM_TIMEOUT}s` : HELM_TIMEOUT;

function getVars() {
	return {
		env: envs[branchName],
		isPull,
		isPreview,
		previewEnv,
		previewSlug,
		prNumber,
		repoName: REPO_NAME,
		branchName,
		aliasName,
		aliasFlag,
		tagFlag,
		helmTimeout
	}
}

module.exports = getVars;

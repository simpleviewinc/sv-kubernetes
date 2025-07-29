//@ts-check
const env = require("env-var");
const CIRCLE_PR_NUMBER = env.get("CIRCLE_PR_NUMBER").asInt();
const REPO_NAME = env.get("REPO_NAME").required().asString();
const HELM_TIMEOUT = env.get("HELM_TIMEOUT").default("5m0s").asString();
const BRANCH_NAME = env.get("BRANCH_NAME").required().asString();

const isPull = CIRCLE_PR_NUMBER !== undefined;
const branchName = isPull ? "test" : BRANCH_NAME;
const aliasName = isPull ? `${REPO_NAME}-pull-${CIRCLE_PR_NUMBER}` : REPO_NAME;
const aliasFlag = isPull ? `--alias ${aliasName}` : '';
const tagFlag = isPull ? `--tag pull-${CIRCLE_PR_NUMBER}` : '';

/** @type {Record<string, string>} */
const envs = {
	master : "live",
	staging : "staging",
	develop : "dev",
	qa : "qa",
	test : "test"
}

// if the HELM_TIMEOUT was just 300, or 500 we default it to seconds for backward compat
const helmTimeout = HELM_TIMEOUT.match(/^[0-9]+$/) ? `${HELM_TIMEOUT}s` : HELM_TIMEOUT;

function getVars() {
	return {
		env: envs[branchName],
		isPull,
		prNumber: CIRCLE_PR_NUMBER,
		repoName: REPO_NAME,
		branchName,
		aliasName,
		aliasFlag,
		tagFlag,
		helmTimeout
	}
}

module.exports = getVars;

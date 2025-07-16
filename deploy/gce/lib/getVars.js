const envVars = ["PROJECT_ID", "REPO_NAME", "BRANCH_NAME", "ZONE", "GCLOUD_SERVICE_KEY"];

envVars.forEach(function(val, i) {
	if (process.env[val] === undefined) {
		throw new Error(`${val} env variable is required`);
	}
});

const isPull = process.env.CIRCLE_PR_NUMBER !== undefined;
const prNumber = Number(process.env.CIRCLE_PR_NUMBER);
const branchName = isPull ? "test" : process.env.BRANCH_NAME;
const aliasName = isPull ? `${process.env.REPO_NAME}-pull-${prNumber}` : process.env.REPO_NAME;
const aliasFlag = isPull ? `--alias ${aliasName}` : '';
const tagFlag = isPull ? `--tag pull-${prNumber}` : '';

//Timeout option for Helm in seconds
const helmTimeout = process.env.HELM_TIMEOUT !== undefined ? process.env.HELM_TIMEOUT : 300;

const envs = {
	master : "live",
	staging : "staging",
	develop : "dev",
	qa : "qa",
	test : "test"
}

function getVars() {
	return {
		env: envs[branchName],
		isPull,
		prNumber,
		branchName,
		aliasName,
		aliasFlag,
		tagFlag,
		helmTimeout
	}
}

module.exports = getVars;
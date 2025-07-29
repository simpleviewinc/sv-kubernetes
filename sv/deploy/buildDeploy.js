//@ts-check
const env = require("env-var");
const { exec } = require("../utils");
const getVars = require("./getVars");

const REPO_NAME = env.get("REPO_NAME").required().asString();

function buildDeploy() {
	const {
		env,
		aliasFlag,
		tagFlag,
		helmTimeout
	} = getVars();

	exec(`sv start ${REPO_NAME} ${env} --build ${aliasFlag} ${tagFlag} --push --wait --atomic --timeout ${helmTimeout}`);
}

module.exports = buildDeploy;

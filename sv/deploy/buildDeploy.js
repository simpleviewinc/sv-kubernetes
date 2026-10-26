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
		previewFlag,
		helmTimeout
	} = getVars();

	exec(`sv start ${REPO_NAME} ${env} --build ${aliasFlag} ${tagFlag} ${previewFlag} --push --wait --atomic --timeout ${helmTimeout}`);
}

module.exports = buildDeploy;

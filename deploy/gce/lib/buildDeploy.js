const exec = require("./exec");
const getVars = require("./getVars");

function buildDeploy() {
	const {
		env,
		aliasFlag,
		tagFlag,
		helmTimeout
	} = getVars();

	exec(`sv start ${process.env.REPO_NAME} ${env} --build ${aliasFlag} ${tagFlag} --push --wait --atomic --timeout ${helmTimeout}`);
}

module.exports = buildDeploy;

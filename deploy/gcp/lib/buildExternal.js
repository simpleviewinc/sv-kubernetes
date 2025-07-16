const exec = require("./exec");
const getVars = require("./getVars");

function buildExternal() {
	const {
		env,
		tagFlag
	} = getVars();

	const tag = tagFlag.length > 0 ? tagFlag.split(' ').last() : process.env.BRANCH_NAME;

	exec(`sv build --name=${process.env.REPO_NAME} --env=${env} --pushTag=gcr.io/${process.env.PROJECT_ID}/${process.env.REPO_NAME}:${tag}`);
}

module.exports = buildExternal;

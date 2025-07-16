const exec = require("./exec");
const getVars = require("./getVars");

function undeploy() {
	const {
		aliasName
	} = getVars();

	exec(`helm tiller run -- sv stop ${aliasName}`);
}

module.exports = undeploy;
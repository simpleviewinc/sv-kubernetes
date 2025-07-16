const exec = require("./exec");
const getVars = require("./getVars");

function undeploy() {
	const {
		aliasName
	} = getVars();

	exec(`sv stop ${aliasName}`);
}

module.exports = undeploy;

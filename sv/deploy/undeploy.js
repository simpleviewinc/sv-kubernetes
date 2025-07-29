//@ts-check
const { exec } = require("../utils");
const getVars = require("./getVars");

function undeploy() {
	const {
		aliasName
	} = getVars();

	exec(`sv stop ${aliasName}`);
}

module.exports = undeploy;

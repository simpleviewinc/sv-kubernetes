const exec = require("./exec");
const getVars = require("./getVars");

function test() {
	const {
		aliasName
	} = getVars();

	exec(`sv test ${aliasName}`);
}

module.exports = test;
//@ts-check
const { exec } = require("../utils");
const getVars = require("./getVars");

function test() {
	const {
		aliasName
	} = getVars();

	exec(`sv test ${aliasName}`);
}

module.exports = test;

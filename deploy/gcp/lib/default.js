console.warn("------------------");
console.warn("DEPRECATED: usage of node /app/lib/default.js is deprecated. Please refer to sv-deploy-gce for implementation: https://github.com/simpleviewinc/sv-deploy-gce/blob/master/README.md.");
console.warn("------------------");

const test = require("./test");
const buildDeploy = require("./buildDeploy");
const undeploy = require("./undeploy");
const getVars = require("./getVars");
const setup = require("./setup");

const {
	isPull
} = getVars();

setup();
buildDeploy();

if (isPull) {
	// if we are a pull request we run the tests and undeploy after
	try {
		test();
	} catch (error) {
		process.exitCode = 1;
	}
	
	undeploy();
}

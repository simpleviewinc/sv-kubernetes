const child_process = require("child_process");

function exec(command) {
	return child_process.execSync(command, { stdio : "inherit" });
}

module.exports = exec;
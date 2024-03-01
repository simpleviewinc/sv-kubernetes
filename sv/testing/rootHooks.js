if (process.getuid() !== 0) {
	throw new Error("Tests must be run as sudo.");
}

const constants = require("../constants");

constants.APPS_FOLDER = `${__dirname}/applications`;
constants.CONTAINERS_FOLDER = `${__dirname}/containers`;
const mocha = require("mocha");

// Spec stays in the job log. XUnit writes the JUnit file CircleCI collects.
function CIReporter(runner, options) {
	this.spec = new mocha.reporters.Spec(runner, options);
	this.xunit = new mocha.reporters.XUnit(runner, options);
}

CIReporter.prototype.done = function(failures, fn) {
	this.xunit.done(failures, fn);
};

module.exports = CIReporter;

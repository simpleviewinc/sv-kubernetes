#!/bin/env node

var scriptName = process.argv[2];
var argv = process.argv.filter(function(val, i){ return i > 2; });

var scripts = {};

scripts.test = function() {
	
}

scripts.install = function() {
	
}

scripts[scriptName]({ argv : argv });
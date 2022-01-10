const assert = require("assert");
const fs = require("fs");
const { testArray } = require("@simpleview/mochalib");

const scripts = require("../scripts");
const utils = require("../utils");

const dockerfilePaths = [
	`${__dirname}/applications/build-test/containers/test`,
	`${__dirname}/containers/container-test`,
	`${__dirname}/applications/settings-test/containers/test`,
	`${__dirname}/applications/settings-test/containers/build-arg-secrets`
]

describe(__filename, function() {
	before(async function() {
		for(let path of dockerfilePaths) {
			await fs.promises.copyFile(`${__dirname}/Dockerfile`, `${path}/Dockerfile`);
			await fs.promises.writeFile(`${path}/name`, path);
		}
	});

	after(async function() {
		for(let path of dockerfilePaths) {
			await fs.promises.unlink(`${path}/Dockerfile`);
			await fs.promises.unlink(`${path}/name`);
		}
	});

	this.timeout(30000);

	describe("build", function() {
		const tests = [
			{
				name : "build app container without build args or settings",
				args : {
					argv : ["--app=build-test", "--name=test"],
					tag : "build-test-test:local",
					name : `${__dirname}/applications/build-test/containers/test`,
					vars : {
						env : "",
						var1 : "",
						var2 : "",
						var3 : ""
					}
				}
			},
			{
				name : "build app container with env value and build arg",
				args : {
					argv : ["--app=build-test", "--name=test", "--env=local", "--build-arg=VAR1=var1value"],
					tag : "build-test-test:local",
					name : `${__dirname}/applications/build-test/containers/test`,
					vars : {
						env : "local",
						var1 : "var1value",
						var2 : "",
						var3 : ""
					}
				}
			},
			{
				name : "build app container with env value and multiple build args",
				args : {
					argv : ["--app=build-test", "--name=test", "--env=local", "--build-arg=VAR1=var1value", "--build-arg=VAR2=var2value", "--build-arg=VAR3=var3value"],
					tag : "build-test-test:local",
					name : `${__dirname}/applications/build-test/containers/test`,
					vars : {
						env : "local",
						var1 : "var1value",
						var2 : "var2value",
						var3 : "var3value"
					}
				}
			},
			{
				name : "build app container with settings defined build args and no env",
				args : {
					argv : ["--app=settings-test", "--name=test"],
					tag : "settings-test-test:local",
					name : `${__dirname}/applications/settings-test/containers/test`,
					vars : {
						env : "",
						var1 : "keyValue",
						var2 : "key2Value",
						var3 : ""
					}
				}
			},
			{
				name : "build app container with settings defined build args overwritten by command line",
				args : {
					argv : ["--app=settings-test", "--name=test", "--build-arg=VAR1=overwrite"],
					tag : "settings-test-test:local",
					name : `${__dirname}/applications/settings-test/containers/test`,
					vars : {
						env : "",
						var1 : "overwrite",
						var2 : "key2Value",
						var3 : ""
					}
				}
			},
			{
				name : "build app container with settings defined build args and env",
				args : {
					argv : ["--app=settings-test", "--name=test", "--env=local"],
					tag : "settings-test-test:local",
					name : `${__dirname}/applications/settings-test/containers/test`,
					vars : {
						env : "local",
						var1 : "keyValue_local",
						var2 : "key2Value",
						var3 : ""
					}
				}
			},
			{
				name : "build app container with settings defined build args and env dev",
				args : {
					argv : ["--app=settings-test", "--name=test", "--env=dev"],
					tag : "settings-test-test:local",
					name : `${__dirname}/applications/settings-test/containers/test`,
					vars : {
						env : "dev",
						var1 : "keyValue",
						var2 : "key2Value",
						var3 : ""
					}
				}
			},
			{
				name : "build app container with settings and secret buildArgs",
				args : {
					argv : ["--app=settings-test", "--name=build-arg-secrets", "--env=local"],
					tag : "settings-test-build-arg-secrets:local",
					name : `${__dirname}/applications/settings-test/containers/build-arg-secrets`,
					vars : {
						env : "local",
						var1 : "keyValue_local",
						var2 : "secret var value",
						var3 : "local test"
					}
				}
			},
			{
				name : "build container without build args or settings",
				args : {
					argv : ["--name=container-test"],
					tag : "container-test:local",
					name : `${__dirname}/containers/container-test`,
					vars : {
						env : "",
						var1 : "",
						var2 : "",
						var3 : ""
					}
				}
			},
			{
				name : "should not allow overwrite of SV_ENV",
				args : {
					argv : ["--name=container-test", "--env=local", "--build-arg=VAR1=var1Value", "--build-arg=SV_ENV=dev"],
					tag : "container-test:local",
					name : `${__dirname}/containers/container-test`,
					vars : {
						env : "local",
						var1 : "var1Value",
						var2 : "",
						var3 : ""
					}
				}
			}
		];

		testArray(tests, async function(test) {
			utils.execSilent(`docker rmi ${test.tag} -f`);

			scripts.build({ argv : test.argv });

			const name = utils.execSilent(`docker run ${test.tag} cat /tmp/name`);
			assert.strictEqual(name, test.name);

			const vars = JSON.parse(utils.execSilent(`docker run ${test.tag} cat /tmp/vars`));
			assert.deepStrictEqual(vars, test.vars);
		});
	});
});
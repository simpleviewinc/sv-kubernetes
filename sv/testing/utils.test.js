const assert = require("assert");
const sinon = require('sinon');

const { testArray } = require("@simpleview/mochalib");
const { Readable, PassThrough } = require('stream');

const utils = require("../utils");

describe(__filename, function() {
	describe("deepMerge", function() {
		const tests = [
			{
				name : "two objects",
				args : {
					args : [
						{ foo : "fooValue" },
						{ bar : "barValue" }
					],
					result : {
						foo : "fooValue",
						bar : "barValue"
					}
				}
			},
			{
				name : "should not merge arrays",
				args : {
					args : [
						{ foo : "fooValue", arr : [1] },
						{ foo : "fooValue2", arr : [2, 3] }
					],
					result : {
						foo : "fooValue2",
						arr : [2, 3]
					}
				}
			},
			{
				name : "should merge nested",
				args : {
					args : [
						{ foo : "fooValue", nested : { firstObj : true } },
						{ bar : "barValue", nested : { secondObj : true } }
					],
					result : {
						foo : "fooValue",
						bar : "barValue",
						nested : {
							firstObj : true,
							secondObj : true
						}
					}
				}
			}
		];

		testArray(tests, function(test) {
			const result = utils.deepMerge(...test.args);

			assert.deepStrictEqual(result, test.result);
		});
	});

	describe("mapBuildArgs", function() {
		const tests = [
			{
				name : "no args",
				args : {
					result : []
				}
			},
			{
				name : "one arg",
				args : {
					args : [
						"foo=fooValue"
					],
					result : [
						"--build-arg foo=fooValue"
					]
				}
			},
			{
				name : "two args",
				args : {
					args : [
						"foo=fooValue",
						"bar=barValue"
					],
					result : [
						"--build-arg foo=fooValue",
						"--build-arg bar=barValue"
					]
				}
			}
		]

		testArray(tests, function(test) {
			const result = utils.mapBuildArgs(test.args);
			assert.deepStrictEqual(result, test.result);
		});
	});

	describe("confirmContextCommand", function() {
		beforeEach(() => {
			sinon.stub(process, 'exit');
			sinon.stub(console, 'log');
			process.env.BYPASS_SV_COMMAND_CONTROL = "no";
		});

		afterEach(() => {
			process.exit.restore();
			console.log.restore();
		});

		const tests = [
			{
				name : "Skip command confirmation in local context (minikube)",
				args : {
					context: "minikube",
					result: true
				}
			},
			{
				name : "Skip command confirmation in local context (desktop)",
				args : {
					context: "docker-context",
					result: true
				}
			},
			{
				name : "Bypass command confirmation (CI/CD)",
				args : {
					bypassCommandControl: "yes",
					context: "test_context",
					result: true
				}
			},
			{
				name : "Disable context command confirmation",
				args : {
					confirmActions: false,
					context: "test_context",
					result: true
				}
			},
			{
				name : "Confirm action with [Enter]",
				args : {
					context: "test_context",
					result: ''
				}
			},
			{
				name : "Cancel action with [Ctrl-C]",
				args : {
					context: "test_context",
					streamData: "\x03",
					exit_code: 1,
					error_log: "\ncanceled"
				}
			},
			{
				name : "Cancel action with unexpected data",
				args : {
					context: "test_context",
					streamData: "unexpected_data\n",
					exit_code: 1,
					error_log: "unexpected data",
					result: "unexpected_data"
				}
			}
		];

		testArray(tests, async function(test) {
			if (test.bypassCommandControl !== undefined) {
				process.env.BYPASS_SV_COMMAND_CONTROL = test.bypassCommandControl;
			}

			const readableStream = Readable.from(test.streamData || "\n");
			const result = await utils.confirmContextCommand(
				test.context,
				test.confirmActions,
				{input: readableStream, output: new PassThrough(), terminal: true}
			);
			assert.strictEqual(result, test.result);

			if (test.exit_code !== undefined) {
				assert(process.exit.isSinonProxy);
				sinon.assert.called(process.exit);
				assert.strictEqual(process.exit.args[0][0], test.exit_code);
			}

			if (test.error_log !== undefined) {
				assert(console.log.isSinonProxy);
				sinon.assert.called(console.log);
				sinon.assert.calledWith(console.log, test.error_log);
			}
		});
	});
});

const assert = require("assert");
const { testArray } = require("@simpleview/mochalib");

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
});
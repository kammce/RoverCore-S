"use strict";

describe('Testing RandomSineWave Class', function () {
	// Loading Libraries
	var RandomSineWave = require('../../../modules/RandomSineWave/RandomSineWave');
	var Model = require('../../../utilities/Model');

	describe('Testing RandomSineWave Updating model', function () {
		this.timeout(6000);
		it('Three values read from model should be changing', function (done) {
			var model = new Model(function() {});

			var util = {
				name: "RandomSineWave",
				feedback: function() {},
				log:  function() {},
				model: model
			};

			var test_unit = new RandomSineWave(util);

			var values = [0, 0, 0];
			var count = 0;

			function sample (argument) {
				setTimeout(function() {
					values[count++] = model.get("random");
					if(count < 3) {
						sample();
					} else {
						resolve();
					}
				}, 1000);
			}
			function resolve() {
				expect(values[0]).to.not.equal(values[1]);
				expect(values[1]).to.not.equal(values[2]);
				expect(values[2]).to.not.equal(values[0]);
				done();
			}
			sample();
		});
	});
});
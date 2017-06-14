"use strict";

describe('Testing RandomSineWave Class', function () {
	// Loading Libraries
	var RandomSineWave = require('../../modules/RandomSineWave/RandomSineWave');
	var Model = require('../../utilities/Model');

	describe('Testing RandomSineWave Updating model', function () {
		this.timeout(3000);
		it('Three values read from model should be changing', function (done) {
			var model = new Model(function() {});

			var log = function() {};
			log.setColor = function() {};

			var util = {
				name: "RandomSineWave",
				feedback: function() {},
				log: log,
				model: model
			};

			var test_unit = new RandomSineWave(util);

			var values = [0, 0, 0];
			var count = 0;

			function sample() {
				setTimeout(function() {
					values[count++] = model.get("Random");
					if(count < 3) {
						sample();
					} else {
						resolve();
					}
				}, 500);
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
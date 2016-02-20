"use strict";

var SensorSuite = require('../../../modules/SensorSuite/SensorSuite');

describe('Testing SensorSuite Class', function () {
	var expected_log;
	var expected_feedback;

	var log = function() { }
	log.output = function(input) {
		expected_log = "";
		for (var i = 0; i < arguments.length; i++) {
			if(typeof arguments[i] === "object") {
				expected_log += JSON.stringify(arguments[i])+"\n";
			} else {
				expected_log += arguments[i];
			}
		}
	};

	var feedback = function(input) {
		expected_feedback = "";
		for (var i = 0; i < arguments.length; i++) {
			if(typeof arguments[i] === "object") {
				expected_feedback += JSON.stringify(arguments[i])+"\n";
			} else {
				expected_feedback += arguments[i];
			}
		}
	};
	var i2c = function() {}; // filler i2c object (not used in test)
	var model = function() {}; // filler model object (not used in test)

	var test_lobe = new SensorSuite("SensorSuite", feedback, log, 500, i2c, model);

	describe('Testing SensorSuite Methods', function () {
		it('#react() should be called', function () {
			test_lobe.react("TESTING");
			expect(expected_log).to.equal(`REACTING ${test_lobe.name}: TESTING`);
			expect(expected_feedback).to.equal(`SensorSuiteREACTING ${test_lobe.name}: TESTING`);
		});
		it('#halt() should be called', function () {
			test_lobe.halt();
			expect(expected_log).to.equal(`HALTING ${test_lobe.name}`);
			expect(expected_feedback).to.equal(`SensorSuiteHALTING ${test_lobe.name}`);
		});
		it('#resume() should be called', function () {
			test_lobe.resume();
			expect(expected_log).to.equal(`RESUMING ${test_lobe.name}`);
			expect(expected_feedback).to.equal(`SensorSuiteRESUMING ${test_lobe.name}`);
		});
		it('#idle() should be called', function () {
			test_lobe.idle();
			expect(expected_log).to.equal(`IDLING ${test_lobe.name}`);
			expect(expected_feedback).to.equal(`SensorSuiteIDLING ${test_lobe.name}`);
		});
	});
});

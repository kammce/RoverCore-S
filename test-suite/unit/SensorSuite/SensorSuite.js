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
		describe('Function: wakeUp()', function() {
			it('expected data read to start', function () {   //wakeUp()
				test_lobe.wakeUp();
//				test_lobe.readData();
				expect(test_lobe.awake).to.equal(1);
//				expect(expected_log).to.equal(`REACTING ${test_lobe.name}: TESTING`);
//				expect(expected_feedback).to.equal(`SensorSuiteREACTING ${test_lobe.name}: TESTING`);
			});
		});
		describe('Function: readData()', function() {
			it('expected data to be read in', function () {
				expect();
//				expect(expected_log).to.equal(`HALTING ${test_lobe.name}`);
//				expect(expected_feedback).to.equal(`SensorSuiteHALTING ${test_lobe.name}`);
			});
		});
		describe('Function: convertPosition()', function() {
			it('expected position value to be converted to angles', function () {
				expect(test_lobe.xangle).to.equal();
				expect(test_lobe.yangle).to.equal();
//				expect(expected_log).to.equal(`RESUMING ${test_lobe.name}`);
//				expect(expected_feedback).to.equal(`SensorSuiteRESUMING ${test_lobe.name}`);
			});
		});
		describe('Function: convertTemp()', function() {
			it('expected temperature value to be converted to celsius', function () {
				expect(test_lobe.temp).to.equal();
//				expect(expected_log).to.equal(`IDLING ${test_lobe.name}`);
//				expect(expected_feedback).to.equal(`SensorSuiteIDLING ${test_lobe.name}`);
			});
		});
		describe('Function: log()', function() {
			it('expected data to be logged', function () {
				expect(expected_log).to.equal(`IDLING ${test_lobe.name}`);
//				expect(expected_feedback).to.equal(`SensorSuiteIDLING ${test_lobe.name}`);
			});
		});
		describe('Function: sleep()', function() {
			it('expected data read to stop', function () {
				test_lobe.sleep();
				expect(test_lobe.awake).to.equal(0);
//				expect(expected_log).to.equal(`IDLING ${test_lobe.name}`);
//				expect(expected_feedback).to.equal(`SensorSuiteIDLING ${test_lobe.name}`);
			});
		});
	});
});

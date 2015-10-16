"use strict";

var Model = require('../../../modules/Model');

describe('Testing Model Class', function () {
	var test_unit = new Model();

	it('registerMemory("TEST_UNIT") should have key "TEST_UNIT" in database', 
	function (done) {
		setTimeout(function() {
			test_unit.registerMemory("TEST_UNIT");
			expect(test_unit.database['TEST_UNIT']).to.be.ok;
			expect(test_unit.database['TEST_UNIT']['timestamp']).to.be.a('number');
			expect(test_unit.database['TEST_UNIT']['timestamp']).to.be.above(test_unit.epoch);
			done();
		}, 50);
	});
	it('set() sets internal database to appropriate value', function () {
		test_unit.set("TEST_UNIT", 'SET_TEST_VALUE');
		expect(test_unit.database['TEST_UNIT']['value']).to.equal('SET_TEST_VALUE');
		expect(test_unit.database['TEST_UNIT']['timestamp']).to.be.above(test_unit.epoch);
	});
	it('get() returns expected value from database', function () {
		test_unit.set("TEST_UNIT", 'GET_TEST_VALUE');
		var time_before_get = test_unit.database['TEST_UNIT']['timestamp'];
		var result = test_unit.get("TEST_UNIT");
		var time_after_get = test_unit.database['TEST_UNIT']['timestamp'];
		// Expect returned value to be equal to value in database
		expect(result).to.equal(test_unit.database['TEST_UNIT']['value']);
		// Expect returned value to be equal to what was 'set' in database
		expect(result).to.equal('GET_TEST_VALUE');
		// Timestamp should not be altered by get operation
		expect(time_after_get).to.equal(time_before_get);
	});
	it('getMemory() returns the full database', function () {
		// Flush database
		test_unit.database = {};
		// Register Memory two items into memory
		test_unit.registerMemory("TEST_UNIT0");
		test_unit.registerMemory("TEST_UNIT1");
		// Values to be set
		test_unit.set("TEST_UNIT0", 'SET_TEST_VALUE0');
		test_unit.set("TEST_UNIT1", 'SET_TEST_VALUE1');
		// Force timestamp to 0 (otherwise timestamp is not determinate)
		test_unit.database['TEST_UNIT0']['timestamp'] = 0;
		test_unit.database['TEST_UNIT1']['timestamp'] = 0;

		expect(test_unit.database).to.eql({
			"TEST_UNIT0": {
				timestamp: 0,
				value: 'SET_TEST_VALUE0'
			},
			"TEST_UNIT1": {
				timestamp: 0,
				value: 'SET_TEST_VALUE1'
			}
		});
	});

	// @param {Number} timestamp parameter tells getMemory() to return all
	//		registered data values that have been changed after that value.
	describe('Testing getMemory() with input timestamping', function () {

		it('getMemory() returns full database with 0 timestamp', function () {
			// Flush database
			test_unit.database = {};
			// Register Memory two items into memory
			test_unit.registerMemory("TEST_UNIT0");
			test_unit.registerMemory("TEST_UNIT1");
			// Values to be set
			test_unit.set("TEST_UNIT0", 'SET_TEST_VALUE0');
			test_unit.set("TEST_UNIT1", 'SET_TEST_VALUE1');
			// Force timestamp to 0 (otherwise timestamp is not determinate)
			test_unit.database['TEST_UNIT0']['timestamp'] = 0;
			test_unit.database['TEST_UNIT1']['timestamp'] = 0;

			var full_database = test_unit.getMemory(0);
			
			expect(full_database).to.eql({
				"TEST_UNIT0": {
					timestamp: 0,
					value: 'SET_TEST_VALUE0'
				},
				"TEST_UNIT1": {
					timestamp: 0,
					value: 'SET_TEST_VALUE1'
				}
			});
		});
		it('getMemory() returns empty with timestamp 1 day in the future', function () {
			// Flush database
			test_unit.database = {};
			// Register Memory two items into memory
			test_unit.registerMemory("TEST_UNIT0");
			test_unit.registerMemory("TEST_UNIT1");
			// Values to be set
			test_unit.set("TEST_UNIT0", 'SET_TEST_VALUE0');
			test_unit.set("TEST_UNIT1", 'SET_TEST_VALUE1');
			// Force timestamp to 0 (otherwise timestamp is not determinate)
			test_unit.database['TEST_UNIT0']['timestamp'] = test_unit.epoch;
			test_unit.database['TEST_UNIT1']['timestamp'] = test_unit.epoch;
			// One day in milliseconds = 86400000
			var empty_structure = test_unit.getMemory((new Date())+86400000);
			// Returned value is empty structure
			expect(empty_structure).to.eql({});
		});
		it('Test that getMemory() only returns items updated ', function () {
			// Flush database
			test_unit.database = {};
			// Register Memory two items into memory
			test_unit.registerMemory("TEST_UNIT0");
			test_unit.registerMemory("TEST_UNIT1");
			// Values to be set
			test_unit.set("TEST_UNIT0", 'SET_TEST_VALUE0');
			test_unit.set("TEST_UNIT1", 'SET_TEST_VALUE1');
			// Force timestamp to 0 (otherwise timestamp is not determinate)
			test_unit.database['TEST_UNIT0']['timestamp'] = test_unit.epoch;
			test_unit.database['TEST_UNIT1']['timestamp'] = test_unit.epoch-100;
			// One day in milliseconds = 86400000
			var empty_structure = test_unit.getMemory(test_unit.epoch);
			// Returned value should be 
			expect(empty_structure).to.eql({
				"TEST_UNIT0": {
					timestamp: test_unit.epoch,
					value: 'SET_TEST_VALUE0'
				}
			});
		});
	});
});

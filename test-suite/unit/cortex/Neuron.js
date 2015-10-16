"use strict";

var Neuron = require('../../../modules/Neuron');


describe('Neuron Class Construction', function () {
	it('should fail to construct and return empty object without initial parameters', function () {
		var test_unit = new Neuron();
		assert.equal(Object.keys(test_unit).length, 0);
	});
	it('should construct with initial parameters', function () {
		var test_unit = new Neuron("unit_test", function feedback() {}, function color_log() {}, 1000);
		assert.ok(test_unit);
	});
});

describe('Testing Neuron Class', function () {
	var test_unit = new Neuron("unit_test", function feedback() {}, function color_log() {}, 1000);
	describe('Testing _halt() Method', function () {
		it('Assert that function will return "UNDEF" if halt is undefined.', function () {
			test_unit.halt = undefined;
			assert.equal(test_unit._halt(), "UNDEF");
		});
		it('Create stub idle function, assert that function returns true for a defined function.', function () {
			test_unit.halt = function() { return true; };
			assert.isTrue(test_unit._halt());
			assert.equal(test_unit.state, "HALTED");
		});
	});
	describe('Testing _resume() Method', function () {
		it('Assert that function will return "UNDEF" if resume is undefined.', function () {
			test_unit.resume = undefined;
			assert.equal(test_unit._resume(), "UNDEF");
		});
		it('Create stub resume function, assert that function returns true for a defined function.', function () {
			test_unit.resume = function() { return true; };
			assert.isTrue(test_unit._resume());
			assert.equal(test_unit.state, "RUNNING");
		});
	});
	describe('Testing _idle() Method', function () {
		it('Assert that function will return "UNDEF" if idle is undefined.', function () {
			test_unit.idle = undefined;
			assert.equal(test_unit._idle(), "UNDEF");
		});
		// it('Assert that function will return false if halted.', function () {
		// 	test_unit._halt();
		// 	test_unit.idle = function() { return true; };
		// 	assert.isFalse(test_unit._idle());
		// });
		it('Create stub idle function, assert that function returns true for a defined function.', function () {
			test_unit.idle = function() { return true; };
			assert.isTrue(test_unit._idle());
			assert.equal(test_unit.state, "IDLING");
		});
	});
	describe('Testing _react() Method', function () {
		it('Assert that method will return "UNDEF" if react is undefined.', function () {
			test_unit.react = undefined;
			// Inserted parameter to prove that UNDEF 
			// only occurs when react is undefined and 
			// not based on input parameter.
			assert.equal(test_unit._react("input"), "UNDEF");
		});
		it('Assert that method will return "NO-ACTION" when given an undefined or null input.', function () {
			test_unit.react = function() { return "REACT-RAN-WHEN-IT-SHOULD-NOT-HAVE!"; };
			assert.equal(test_unit._react(), "NO-ACTION");
			assert.equal(test_unit._react(null), "NO-ACTION");
		});
		it('Assert that method will return "NO-ACTION" if halted.', function () {
			test_unit.halt = function() { return true; };
			test_unit._halt();
			test_unit.react = function() { return "REACT-RAN-WHEN-IT-SHOULD-NOT-HAVE!"; };
			assert.equal(test_unit._react("input"), "NO-ACTION");
		});
		it('Assert that method will return true given a stub react function and adequate input.', function () {
			test_unit.resume = function() { return true; };
			test_unit._resume();
			test_unit.react = function() { return true; };
			assert.isTrue(test_unit._react("input"));
		});
	});
});
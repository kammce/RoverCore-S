"use strict";

var Log = require('../../../modules/Log');

describe('Testing Log Class', function () {
	var write, log, output = '';
	/* https://github.com/mochajs/mocha/issues/1582 */
	// restore process.stdout.write() and console.log() to their previous glory
	var cleanup = function() {
		process.stdout.write = write;
		console.log = log;
	};

	beforeEach(function() {
		// store these functions to restore later because we are messing with them
		write = process.stdout.write;
		log = console.log;
		output = "";
		// our stub will concatenate any output to a string
		process.stdout.write = console.log = function(s) {
			output += s;
		};
	});

	// restore after each test
	afterEach(cleanup);

	describe('Testing log() function', function () {
		it('Expect function to output to stdout when given a string', function () {
			var test_unit = new Log("test_unit0", "cyan");
			test_unit.log("hello world");
			Log.stored_log = "";
			expect(output).to.contain("hello world");
			// Check that static variable stored_log contains output value
			expect(Log.stored_log).to.contain("hello world", "Output was not written to static variable stored_log.");
		});
		it('Expect function to output to stdout when given an structure', function () {
			var test_unit = new Log("test_unit1", "cyan");
			test_unit.log({a: 1, b:2});
			Log.stored_log = "";
			// Check that static variable stored_log contains output value
			expect(output).to.contain("{a: 1, b:2}");
			expect(Log.stored_log).to.contain("{a: 1, b:2}", "Output was not written to static variable stored_log.");
		});
		it('Expect function to output to stdout when given both a string and structure', function () {
			var test_unit = new Log("test_unit2", "cyan");
			test_unit.log("hello world", {a: 1, b:2});
			expect(output).to.contain("{a: 1, b:2}");
			expect(output).to.contain("hello world");
			// Check that static variable stored_log contains output value
			expect(Log.stored_log).to.contain("{a: 1, b:2}", "Output was not written to static variable stored_log.");
			expect(Log.stored_log).to.contain("hello world", "Output was not written to static variable stored_log.");
		});
		it('Visually check if output is cyan', function (done) {
			// Restore process.stdout.write and console.log
			process.stdout.write = write;
			console.log = log;
			var test_unit = new Log("test_unit3", "cyan");
			test_unit.log("hello world");
			done();
		});
	});
	describe('Testing mute() & unmute() methods', function () {
		it('Mute one log, expect only one log can output. Unmute logs, expect both to output', 
			function () {
			// Create two Logs
			var test_unit0 = new Log("test_unit4", "cyan");
			var test_unit1 = new Log("test_unit5", "green");
			// Expect that they both can output
			test_unit0.log("Test0");
			test_unit1.log("Test1");
			expect(output).to.contain("Test0");
			expect(output).to.contain("Test1");
			// Flush output
			output = "";
			// Mute one 
			test_unit0.mute();
			//Attempt to log both, expect only log two to output.
			test_unit0.log("Test0");
			test_unit1.log("Test1");
			expect(output).to.not.contain("Test0");
			expect(output).to.contain("Test1");
			// Flush output
			output = "";
			//Unmute one.
			test_unit0.unmute();
			//Attempt to log both, expect both logs to output.
			test_unit0.log("Test0");
			test_unit1.log("Test1");
			expect(output).to.not.contain("Test0");
			expect(output).to.contain("Test1");
		});
		it('Attempting to mute a non-existing module return false', function () {
			expect(Log.mute("does_not_exist")).to.be.false;
			expect(Log.unmute("does_not_exist")).to.be.false;
		});
		it('Attempting to mute an existing module should return true', function () {
			var test_unit = new Log("test_unit_true0", "green");
			expect(test_unit.mute("test_unit_true0")).to.be.true;
			expect(test_unit.unmute("test_unit_true0")).to.be.true;
		});
	});

	describe('Testing static mute() & unmute() methods', function () {
		it('Mute one log, expect only one log can output. Unmute logs, expect both to output', 
			function () {
			// Create two Logs
			var test_unit0 = new Log("test_unit6", "cyan");
			var test_unit1 = new Log("test_unit7", "green");
			// Expect that they both can output
			test_unit0.log("Test0");
			test_unit1.log("Test1");
			expect(output).to.contain("Test0");
			expect(output).to.contain("Test1");
			// Flush output
			output = "";
			// Mute one 
			Log.mute("test_unit6");
			//Attempt to log both, expect only log two to output.
			test_unit0.log("Test0");
			test_unit1.log("Test1");
			expect(output).to.not.contain("Test0");
			expect(output).to.contain("Test1");
			// Flush output
			output = "";
			//Unmute one.
			Log.unmute("test_unit6");
			//Attempt to log both, expect both logs to output.
			test_unit0.log("Test0");
			test_unit1.log("Test1");
			expect(output).to.not.contain("Test0");
			expect(output).to.contain("Test1");
		});
		it('Attempting to mute a non-existing module return false', function () {
			expect(Log.mute("does_not_exist")).to.be.false;
			expect(Log.unmute("does_not_exist")).to.be.false;
		});
		it('Attempting to mute an existing module should return true', function () {
			var test_unit = new Log("test_unit_true1", "green");
			expect(Log.mute("test_unit_true1")).to.be.true;
			expect(Log.unmute("test_unit_true1")).to.be.true;
		});
	});
});

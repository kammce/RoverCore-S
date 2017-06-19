"use strict";

var Log = require("Log");

describe("Testing Log Class", function()
{
	var write, log, output = "";

	// restore after each test
	beforeEach(function()
	{
		// store these functions to restore later because we are messing with them
		write = process.stdout.write;
		log = console.log;
		output = "";
		// our stub will concatenate any output to a string
		process.stdout.write = console.log = function()
		{
			for (var i = 0; i < arguments.length; i++)
			{
				if (typeof arguments[i] === "object")
				{
					output += JSON.stringify(arguments[i]) + "\n";
				}
				else
				{
					output += arguments[i];
				}
			}
		};
	});

	// restore process.stdout.write() and console.log() to their previous glory
	afterEach(function()
	{
		process.stdout.write = write;
		console.log = log;
	});
	after(function()
	{
		Log.deleteLogs();
	});
	/* TODO: Make create test to check if that Log statically creates only one log per require("Log") */
	describe("#output()", function()
	{
		it("Expect function to output to stdout when given a string", function()
		{
			var test_unit = new Log("test_unit0", "cyan");
			//fs.writeFileSync(test_unit.output_file, "");
			test_unit.output("hello world");
			// Should find hello world in log
			expect(output).to.contain("hello world");
			// Should find module name in log
			expect(output).to.contain("test_unit0");
			// Check that log file contains output value
			//expect(fs.readFileSync(test_unit.output_file, "ascii")).to.contain("hello world", "Output was not written to file.");
		});
		it("Expect function to output to stdout when given an structure", function()
		{
			var test_unit = new Log("test_unit1", "cyan");
			//fs.writeFileSync(test_unit.output_file, "");
			test_unit.output(
			{
				"a": 1,
				"b": 2
			});
			expect(output).to.contain("{\"a\":1,\"b\":2}");
			// Check that log file contains output value
			//expect(fs.readFileSync(test_unit.output_file, "ascii")).to.contain("{"a":1,"b":2}", "Output was not written to file.");
		});
		it("Expect function to output to stdout when given both a string and structure", function()
		{
			var test_unit = new Log("test_unit2", "cyan");
			//fs.writeFileSync(test_unit.output_file, "");
			test_unit.output("hello world",
			{
				"a": 1,
				"b": 2
			});
			expect(output).to.contain("{\"a\":1,\"b\":2}");
			expect(output).to.contain("hello world");
			// Check that log file contains output value
			//expect(fs.readFileSync(test_unit.output_file, "ascii")).to.contain("{"a":1,"b":2}", "Output was not written to file.");
			// Check that log file contains output value
			//expect(fs.readFileSync(test_unit.output_file, "ascii")).to.contain("hello world", "Output was not written to file.");
		});
		it("Visually check if output is cyan, yellow and green", function()
		{
			// Restore process.stdout.write and console.log
			process.stdout.write = write;
			console.log = log;
			var test_unit0 = new Log("visual_test_unit_0", "cyan");
			test_unit0.output("THIS SHOULD COME OUT THE COLOR CYAN!!");
			var test_unit1 = new Log("visual_test_unit_1", "yellow");
			test_unit1.output("THIS SHOULD COME OUT THE COLOR YELLOW!!");
			var test_unit2 = new Log("visual_test_unit_2", "green");
			test_unit2.output("THIS SHOULD COME OUT THE COLOR GREEN!!");
		});
	});
	describe("#mute(), #unmute()", function()
	{
		it("Mute one log, expect only one log can output. Unmute logs, expect both to output",
			function()
			{
				// Create two Logs
				var test_unit0 = new Log("test_unit4", "cyan");
				var test_unit1 = new Log("test_unit5", "green");
				// Expect that they both can output
				test_unit0.output("Test0");
				test_unit1.output("Test1");
				expect(output).to.contain("Test0");
				expect(output).to.contain("Test1");
				// Flush output
				output = "";
				// Mute one
				test_unit0.mute();
				//Attempt to log both, expect only log two to output.
				test_unit0.output("Test0");
				test_unit1.output("Test1");
				expect(output).to.not.contain("Test0");
				expect(output).to.contain("Test1");
				// Flush output
				output = "";
				//Unmute one.
				test_unit0.unmute();
				//Attempt to log both, expect both logs to output.
				test_unit0.output("Test0");
				test_unit1.output("Test1");
				expect(output).to.contain("Test0");
				expect(output).to.contain("Test1");
			});
	});

	describe("static #mute(), static #unmute()", function()
	{
		it("Mute one log, expect only one log can output. Unmute logs, expect both to output", function()
		{
			// Create two Logs
			var test_unit0 = new Log("test_unit6", "cyan");
			var test_unit1 = new Log("test_unit7", "green");
			// Expect that they both can output
			test_unit0.output("Test0");
			test_unit1.output("Test1");
			expect(output).to.contain("Test0");
			expect(output).to.contain("Test1");
			// Flush output
			output = "";
			// Mute one
			expect(Log.mute("test_unit6")).to.be.true;
			log(Log._mutes);
			//Attempt to log both, expect only log two to output.
			test_unit0.output("Test0");
			test_unit1.output("Test1");
			expect(output).to.not.contain("Test0");
			expect(output).to.contain("Test1");
			// Flush output
			output = "";
			//Unmute one.
			expect(Log.unmute("test_unit6")).to.be.true;
			//Attempt to log both, expect both logs to output.
			test_unit0.output("Test0");
			test_unit1.output("Test1");
			expect(output).to.contain("Test0");
			expect(output).to.contain("Test1");
		});
		it("Attempting to mute a non-existing module return false", function()
		{
			expect(Log.mute("does_not_exist")).to.be.false;
			expect(Log.unmute("does_not_exist")).to.be.false;
		});
		it("Attempting to mute an existing module should return true", function()
		{

			var test_unit0 = new Log("test_unit_true1", "green"); // jshint unused: false
			expect(Log.mute("test_unit_true1")).to.be.true;
			expect(Log.unmute("test_unit_true1")).to.be.true;
		});
	});
});

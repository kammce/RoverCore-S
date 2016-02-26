"use strict";

var Arm = require("../../../modules/Arm/Arm.js");
var i2c_lib = require("../../../modules/Arm/TEST_i2c-bus.js");
var LOG = require("../../../modules/Arm/TEST_Log.js");
var Model = require("../../../modules/Arm/TEST_Model.js");
var assert = require("chai").assert;
var expect = require("chai").expect;
var should = require("chai").should;

describe("Testing class Arm:", function(){
	var i2c = new i2c_lib();
	var model = new Model();
	var error = null, error2 = null;
	var feedback = function(){};
	var color_log = new LOG("ARM", "yellow");
	var testunit = new Arm("Arm", feedback, color_log, 4000, i2c, model);

	// Base functions (the others depend on them to a certain extent)
	describe("function isSafe():", function(){	//sync way
		var safeAngles = {
			base: 180,
			shoulder: 50,
			elbow: 66,
			wrist: 180
		};
		var unsafeAngles = {
			base: 360,
			shoulder: 360,
			elbow: 360,
			wrist: 360
		};
		var unsafeSingle = {
			base: 90,
			shoulder: 56,
			elbow: 79,
			wrist: 165
		}
		it("Expected isSafe() to return true on safe angle parameters", function(){	//each it() call defines a function test case
			expect(testunit.isSafe(safeAngles)).to.eql(true);
		});
		it("Expected isSafe() to return false on unsafe angle parameters", function(){
			expect(testunit.isSafe(unsafeAngles)).to.eql(false);
		});
		it("Expected isSafe() to return false on even just one unsafe angle parameter", function(){
			expect(testunit.isSafe(unsafeSingle)).to.eql(false);
		});
	});
	describe("function readadc():", function(){
		var testobj = testunit.readadc(0x00);
		it("Expected readadc() to return an object with all required keys", function(){
			expect(testobj).to.have.all.keys("bpos","spos","epos", "cpos");			
		});
		// it("Expected readadc() to not contain any null or undefined values", function () {
		// 	expect(testobj.bpos).to.not.be.null;
		// 	expect(testobj.spos).to.not.be.null;
		// 	expect(testobj.epos).to.not.be.null;
		// 	expect(testobj.cpos).to.not.be.null;
		// });
	});

	// Utility functions (use the base functions)
	describe("function moveServo():", function(){
		var base_old = testunit.target.base;
		var base_new = 54;
		var output = testunit.moveServo("base", base_new);

		it("Expected moveServo() to return an object with microseconds and direction after moving base to the specified angle", function(){
			expect(output).to.have.all.keys("usec", "dir");
		});
		it("Expected moveServo() to have changed target.base after moving base to the specified angle", function(){
			expect(testunit.target.base).to.not.equal(base_old);
		});

		var base_old2 = testunit.target.base;
		var output2 = testunit.moveServo("base", "stop");

		it("Expected moveServo() to return 'stopped' when 'stop' is specified", function(){
			expect(output2).to.eql("stopped");
		});
		it("Expected moveServo() to not change target.base after stopping base motor", function(){
			expect(testunit.target.base).to.equal(base_old2);
		});
	});
	describe("function moveActuator():", function(){
		var shoulder_old = testunit.target.shoulder;
		var shoulder_new = 54;
		var output = testunit.moveActuator("shoulder", shoulder_new);

		it("Expected moveActuator() to return an object with duty and direction after moving shoulder to the specified angle", function(){
			expect(output).to.have.all.keys("duty_cycle", "dir");
		});
		it("Expected moveActuator() to have changed target.shoulder after moving shoulder to the specified angle", function(){
			expect(testunit.target.shoulder).to.not.equal(shoulder_old);
		});

		var shoulder_old2 = testunit.target.shoulder;
		var output2 = testunit.moveActuator("shoulder", "stop");

		it("Expected moveActuator() to return 'stopped' when 'stop' is specified", function(){
			expect(output2).to.eql("stopped");
		});
		it("Expected moveActuator() to not change target.shoulder after stopping shoulder motor", function(){
			expect(testunit.target.shoulder).to.equal(shoulder_old2);
		});
	});

	describe("function react():", function(){
		var old_target = testunit.target;
		it("Expected react() to have changed target when given the command to move to a new position", function(){
			var input = {
				name: "move",
				data: {
					"base": 15,
					"shoulder": 43,
					"elbow": 15,
					"wrist": 50
				}
			};
			testunit.react(input);
			var new_target = testunit.target;

			expect(new_target.base).to.not.eql(old_target.base);
			expect(new_target.shoulder).to.not.eql(old_target.shoulder);
			expect(new_target.elbow).to.not.eql(old_target.elbow);
			expect(new_target.wrist).to.not.eql(old_target.wrist);
		});
	});
	/*  Wyatt & Austin's claw functions  */
	// describe("function claw():", function(){
	// 	it("Expected claw() to exist", function(){
	// 		expect(testunit.claw).to.be.a("function");
	// 	});
	// });
	// describe("function switchTool():", function(){
	// 	it("Expected switchTool() to exist", function(){
	// 		expect(testunit.switchTool).to.be.a("function");
	// 	});
	// });
	// describe("function tool():", function(){
	// 	it("Expected tool() to exist", function(){
	// 		expect(testunit.tool).to.be.a("function");
	// 	});
	// });
	/*  End Wyatt & Austin's claw functions  */
});

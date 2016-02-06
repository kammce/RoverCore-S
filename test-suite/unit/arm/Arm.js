"use strict"

var Arm = require("../../../modules/Arm/Arm.js");
var i2c_to_pwm = require("../../../../modules/Arm/i2c_to_pwm.js");
var assert = require("chai").assert;
var expect = require("chai").expect;
var should = require("chai").should;

describe("Testing class Arm:", function(){
	// Includes
	class i2c_lib {		// Dummy class resembling an instance of object Bus from the i2c-bus library
		constructor(){
			this.readI2cBlock = function (addr, cmd, len, buf, callback){
				var registerNum = cmd;
				var err = null;
				var buffer = buf;
				var bytesread = len;	// emulates len number of bytes (motor positions) that have been read
				callback(err, bytesread, buffer);
			};
		}
	};
	
	var i2c = new i2c_lib();
	var model = "";
	var error = null, error2 = null;
	var feedback = function(){};


	var testunit = new Arm("Arm", feedback, "yellow", 4000, i2c, model);
	var safeAngles = {
		base: 180,
		shoulder: 180,
		elbow: 180,
		wrist: 180
	};
	var unsafeAngles = {
		base: 360,
		shoulder: 360,
		elbow: 360,
		wrist: 360
	};
	/*it("#Arm()", function(done){	//async way
		// assert.strictEqual(testunit.name, "Arm", "module_name is Arm");
		// assert.typeOf(testunit.feedback, "function", "feedback is a function");
		expect(testunit.name, "testunit.name should be a string").to.be.a("string");
		expect(testunit.log, "testunit.log (color_log parameter) should be yellow").to.equal("yellow");
		expect(testunit.name, "testunit.name should be Arm").to.equal("Arm");
		done();
	});*/

	// Base functions (the others depend on them to a certain extent)
	describe("function isSafe():", function(){	//sync way
		it("Expected isSafe() to return true on safe angle parameters", function(){	//each it() call defines a function test case
			expect(testunit.isSafe(safeAngles)).to.eql(true);
		});
		it("Expected isSafe() to return false on unsafe angle parameters", function(){
			expect(testunit.isSafe(unsafeAngles)).to.eql(false);
		});
	});
	describe("function readadc():", function(){
		it("Expected readadc() to return an object with all required keys", function(){
			expect(testunit.readadc(0x00)).to.have.all.keys("bpos","spos","epos","wpos_l","wpos_r");
		});
	});

	// Utility functions (use the base functions)
	describe("function moveServo():", function(){		// Need to know how I will use class PWM_Driver()
		it("Expected moveServo() to change target.base when moving base", function(){
			expect(testunit.moveServo("base", 54)).to.change(testunit.target, "base");
		});
		it("Expected moveServo() to change target.wrist when moving wrist", function(){
			expect(testunit.moveServo("wrist", 54)).to.change(testunit.target, "wrist");
		});
	});
	describe("function moveActuator():", function(){	// Need to know how I will use class PWM_Driver()
		it("Expected moveActuator() to change target.shoulder when moving shoulder", function(){
			expect(testunit.moveActuator("shoulder", 54)).to.change(testunit.target, "shoulder");
		});
		it("Expected moveActuator() to change target.elbow when moving elbow", function(){
			expect(testunit.moveActuator("elbow", 54)).to.change(testunit.target, "elbow");
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
	
	// testunit.i2c.close(function(err){
	// 	if(err){
	// 		error2 = "err";
	// 	}
	// 	else{
	// 		error2 = "closed";
	// 	}
	// });

});

"use strict"

var Arm = require("../../../modules/Arm/Arm.js");
var assert = require("chai").assert;
var expect = require("chai").expect;
var should = require("chai").should;

describe("Testing class Arm:", function(){
	// Includes
	var i2clib = require("i2c-bus");
	var model = "";
	var error = null, error2 = null;
	var feedback = function(){};

	var i2c = i2clib.open(0,function(err){
		if(err){
			error = "err";
		}
		else {
			error = "ok";
		}
	});

	var testunit = new Arm("Arm", feedback, "yellow", 4000, i2c, model);
	var safeAngles = {
		b: 180,
		s: 180,
		e: 180,
		w: 180
	};
	var unsafeAngles = {
		b: 0,
		s: 0,
		e: 0,
		w: 0
	};
	// it("#Arm()", function(done){	//async way
	// 	// assert.strictEqual(testunit.name, "Arm", "module_name is Arm");
	// 	// assert.typeOf(testunit.feedback, "function", "feedback is a function");
	// 	expect(testunit.name, "testunit.name should be a string").to.be.a("string");
	// 	expect(testunit.log, "testunit.log (color_log parameter) should be yellow").to.equal("yellow");
	// 	expect(testunit.name, "testunit.name should be Arm").to.equal("Arm");
	// 	done();
	// });
	describe("function isSafe():", function(){	//sync way
		it("Expected isSafe() to return true on safe angle parameters", function(){	//each it() call defines a function test case
			expect(testunit.isSafe(safeAngles)).to.equal(true);
		});
		it("Expected isSafe() to return false on unsafe angle parameters", function(){
			expect(testunit.isSafe(unsafeAngles)).to.equal(false);
		});
	});
	describe("function moveServo():", function(){		// Need to know how I will use class PWM_Driver()
		it("Expected moveServo() to change savedposition", function(){
			expect(testunit.moveServo("base", 54)).to.change(testunit.savedposition, "");
		});
	});
	describe("function moveActuator():", function(){	// Need to know how I will use class PWM_Driver()
		// it("Expected moveActuator() to call the i2c library", function(){
		// 	expect(testunit.moveActuator("shoulder", 200));
		// });
	});
	describe("function readadc():", function(){
		it("Expected readadc() to return an object with all required keys", function(){
			expect(testunit.readadc(/*i2c_address*/)).to.have.all.keys("bpos","spos","epos","wpos");
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
	testunit.i2c.close(function(err){
		if(err){
			error2 = "err";
		}
		else{
			error2 = "closed";
		}
	});
	
});

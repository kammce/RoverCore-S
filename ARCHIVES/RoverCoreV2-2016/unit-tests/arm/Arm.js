"use strict";

var Arm = require("../../../modules/Arm/Arm.js");
var i2c_lib = require("../../../modules/Arm/TEST_i2c-bus.js");
var LOG = require("../../../modules/Arm/TEST_Log.js");
var Model = require("../../../modules/Arm/TEST_Model.js");
var assert = require("chai").assert;
var expect = require("chai").expect;
var should = require("chai").should;

/*Commented out all code for FanController unit test, SensorSuite lobe and unit test,
to get this test working*/

describe("Testing class Arm:", function(){
	var i2c = new i2c_lib();
	var model = new Model();
	var error = null, error2 = null;
	var feedback = function(){};
	var color_log = new LOG("ARM", "yellow");
	var testunit = new Arm("Arm", feedback, color_log, 4000, i2c, model);

	// Base functions (the others depend on them to a certain extent)
	describe("function rectify():", function(){
		var high = {
            "wrist": 180,
            "elbow": 76,
            "base": 180,
            "shoulder": 58,
            "claw": 60      //TBD
        }
        var low = {
            "wrist": 0,
            "elbow": 0,
            "base": 0,
            "shoulder": 0,
            "claw": 0       //TBD
        }
        var testAngles = {
        	"wrist": 10,
            "elbow": 100,
            "base": 190,
            "shoulder": 60,
            "claw": 100      //TBD
        };

        testunit.rectify(testAngles);

		it("Expected rectify() to change angles to be within limits when given out-of-bound angles", function(){
			// Below upper limits
			expect(testAngles.wrist).to.be.below(high.wrist + 1);
			expect(testAngles.elbow).to.be.below(high.elbow + 1);
			expect(testAngles.base).to.be.below(high.base + 1);
			expect(testAngles.shoulder).to.be.below(high.shoulder + 1);
			expect(testAngles.claw).to.be.below(high.claw + 1);

			// Above lower limits
			expect(testAngles.wrist).to.be.above(1 + low.wrist);
			expect(testAngles.elbow).to.be.above(1 + low.elbow);
			expect(testAngles.base).to.be.above(1 + low.base);
			expect(testAngles.shoulder).to.be.above(1 + low.shoulder);
			expect(testAngles.claw).to.be.above(1 + low.claw);
		});
	});

	describe("function turnLaser():", function(){
		testunit.turnLaser(1);

		it("Expected turnLaser() to change laser state", function(){
			expect(testunit.laser).to.eql(1);
		});
	});

	describe("function moveArm():", function(){
		var input = {
			"base": 74,
			"shoulder": 23,
			"elbow": 19,
			"wrist": 90
		};

		testunit.moveArm(input);

		it("Expected moveArm() to change the target position", function(){
			expect(testunit.target.base).to.eql(input.base);
			expect(testunit.target.shoulder).to.eql(input.shoulder);
			expect(testunit.target.elbow).to.eql(input.elbow);
			expect(testunit.target.wrist).to.eql(input.wrist);
		});
		it("Expected moveArm() to have issued a command and consequently changed the recorded current position", function(){
			expect(testunit.position.base).to.eql(input.base);
			expect(testunit.position.shoulder).to.eql(input.shoulder);
			expect(testunit.position.elbow).to.eql(input.elbow);
			expect(testunit.position.wrist).to.eql(input.wrist);
		});
	});

	describe("function moveClaw():", function(){
		var input = {
			"rotate": -1,
			"direction": 1,
			"grab": 1,
			"force": 45
		};

		testunit.moveClaw(input);
		it("Expected moveClaw() to change the target position of the claw/wrist roll", function(){
			expect(testunit.target.claw).to.eql(input.grab);
			expect(testunit.target.roll).to.eql(input.rotate);
			expect(testunit.target.rolldir).to.eql(input.direction);
		});
		it("Expected moveClaw() to have issued a command and consequently changed the recorded current position", function(){
			/*Need to Ask: Will claw finger position, current force, current roll angle, and current roll direction be given to me?*/
			expect(testunit.position.claw).to.eql(testunit.serial.new_movement.clawAngle);

			// var newForce = parseInt(testunit.position.claw.substring(1));

			// expect(newForce).to.eql(input.force);
			// expect(testunit.position.roll).to.eql(input.rotate); // SAMD will feed back current angle, not -1 in this case, so this is a bad test
			expect(testunit.position.rolldir).to.eql(input.direction);
		});
	});

	describe("function limitCurrent():", function(){
		var oldClawLimit = testunit.current_limit.claw;
		var limitArm = {
			"base": 98.67,
			"shoulder": 23.09,
			"elbow": 19.76,
			"wrist": 90,
			"claw": 68.78
		};
		
		testunit.limitCurrent(limitArm);
		it("Expected limitCurrent() to change all current_limits to given values", function(){
			expect(testunit.current_limit).to.eql(limitArm);
		});
	});

	describe("function react():", function(){
		this.timeout(500);	//each test (i.e. "it()") inherits a timeout of 500 ms, approx.
		var armTest = {
			"name": "move",
			"data": {
				"base": 140,
				"shoulder": 15,
				"elbow": 45,
				"wrist": 106
			}
		};
		var clawTest = {
			"name:": "claw",
			"data":{
				"rotate": -1,
				"direction": 1,
				"grab": 1,
				"force": 45.89
			}
		};
		var toolTest = {
			"name:": "tool",
			"data":{
				"option": "laser",
				"param": 1
			}
		};
		var limitTest = {
			"name": "limit",
			"data": {
				"base": 54.76,
				"shoulder": 13.87,
				"elbow": 35.74,
				"wrist": 69.90
			}
		};
		
		it("Expected react() to move the arm to the position given", function(){
			testunit.react(armTest);

			expect(testunit.position.base).to.eql(armTest.data.base);
			expect(testunit.position.shoulder).to.eql(armTest.data.shoulder);
			expect(testunit.position.elbow).to.eql(armTest.data.elbow);
			expect(testunit.position.wrist).to.eql(armTest.data.wrist);
		});
		it("Expected react() to move the claw to the position given, and change the claw current limit", function(){
			testunit.react(clawTest);

			expect(testunit.position.claw).to.eql(testunit.serial.new_movement.clawAngle);
			expect(testunit.position.rolldir).to.eql(clawTest.data.direction);
		});
		it("Expected react() to change the laser power state to the one given", function(){
			testunit.react(toolTest);

			expect(testunit.laser).to.eql(toolTest.data.param);
		});
		it("Expected react() to change the current limits of all but the claw motor", function(){
			testunit.react(limitTest);
			var limitArm = {
				"base": limitTest.data.base,
				"shoulder": limitTest.data.shoulder,
				"elbow": limitTest.data.elbow,
				"wrist": limitTest.data.wrist,
				"claw": testunit.current_limit.claw
			}

			expect(testunit.current_limit).to.eql(limitArm);
		});
	});
});

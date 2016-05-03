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
			expect(testunit.target.claw).to.contain("g");

			var newForce = parseInt(testunit.target.claw.substring(1));

			expect(newForce).to.eql(input.force);
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

	// describe("function isSafe():", function(){	//sync way
	// 	var safeAngles = {
	// 		base: 180,
	// 		shoulder: 50,
	// 		elbow: 66,
	// 		wrist: 180
	// 	};
	// 	var unsafeAngles = {
	// 		base: 360,
	// 		shoulder: 360,
	// 		elbow: 360,
	// 		wrist: 360
	// 	};
	// 	var unsafeSingle = {
	// 		base: 90,
	// 		shoulder: 56,
	// 		elbow: 79,
	// 		wrist: 165
	// 	}
	// 	it("Expected isSafe() to return true on safe angle parameters", function(){	//each it() call defines a function test case
	// 		expect(testunit.isSafe(safeAngles)).to.eql(true);
	// 	});
	// 	it("Expected isSafe() to return false on unsafe angle parameters", function(){
	// 		expect(testunit.isSafe(unsafeAngles)).to.eql(false);
	// 	});
	// 	it("Expected isSafe() to return false on even just one unsafe angle parameter", function(){
	// 		expect(testunit.isSafe(unsafeSingle)).to.eql(false);
	// 	});
	// });
	// describe("function readadc():", function(){
	// 	var testobj = testunit.readadc(0x00);
	// 	it("Expected readadc() to return an object with all required keys", function(){
	// 		expect(testobj).to.have.all.keys("bpos","spos","epos", "cpos");			
	// 	});
	// 	// it("Expected readadc() to not contain any null or undefined values", function () {
	// 	// 	expect(testobj.bpos).to.not.be.null;
	// 	// 	expect(testobj.spos).to.not.be.null;
	// 	// 	expect(testobj.epos).to.not.be.null;
	// 	// 	expect(testobj.cpos).to.not.be.null;
	// 	// });
	// });

	// describe("function switchTool()", function(){
	// 	var tooltest = new Arm("Arm", feedback, color_log, 4000, i2c, model);
	// 	var tool_old = tooltest.tool;

	// 	// var output = tooltest.switchTool(tool_new);
	// 	it("Expected switchTool(1) to have went to and grabbed tool 1 from toolposition1",function(){
	// 		tooltest.switchTool(1);
	// 		expect(tooltest.target.claw).to.equal(tooltest.toolposition1.claw);
	// 		expect(tooltest.target.wrist_r).to.equal(tooltest.toolposition1.wrist_r);
	// 		expect(tooltest.target.wrist_l).to.equal(tooltest.toolposition1.wrist_l);	
	// 		expect(tooltest.tool).to.not.equal(tool_old);
	// 		expect(tooltest.tool).to.equal(1);		
	// 	});
	// 	it("Expected Arm to be in a safe position after switching to tool 1",function(){
	// 		expect(tooltest.target.shoulder).to.equal(tooltest.idleposition.shoulder);
	// 		expect(tooltest.target.elbow).to.equal(tooltest.idleposition.elbow);
	// 	});

	// 	it("Expected switchTool(2) to have went to and grabbed tool 2 from toolposition2",function(){
	// 		tool_old = tooltest.tool;
	// 		expect(tooltest.tool).to.equal(tool_old);
	// 		tooltest.switchTool(2);
	// 		expect(tooltest.target.claw).to.equal(tooltest.toolposition2.claw);
	// 		expect(tooltest.target.wrist_r).to.equal(tooltest.toolposition2.wrist_r);
	// 		expect(tooltest.target.wrist_l).to.equal(tooltest.toolposition2.wrist_l);	
	// 		expect(tooltest.tool).to.not.equal(tool_old);
	// 		expect(tooltest.tool).to.equal(2);		
	// 	});
	// 	it("Expected Arm to be in a safe position after switching to tool 2",function(){
	// 		expect(tooltest.target.shoulder).to.equal(tooltest.idleposition.shoulder);
	// 		expect(tooltest.target.elbow).to.equal(tooltest.idleposition.elbow);
	// 	});

	// 	it("Expected switchTool(0) to have emptied the claw",function(){
	// 		tool_old = tooltest.tool;
	// 		tooltest.switchTool(0);
	// 		expect(tooltest.target.claw).to.not.equal(tooltest.toolposition2.claw);
	// 		expect(tooltest.tool).to.equal(0);						
	// 	});
	// 	it("Expected Arm to be in a safe position after switching to tool 2",function(){
	// 		expect(tooltest.target.shoulder).to.equal(tooltest.idleposition.shoulder);
	// 		expect(tooltest.target.elbow).to.equal(tooltest.idleposition.elbow);
	// 	});
		
		
	// });

	// describe("function moveServo():", function(){
	// 	var base_old = testunit.target.base;
	// 	var base_new = 54;
	// 	var output = testunit.moveServo("base", base_new);

	// 	it("Expected moveServo() to return an object with microseconds and direction after moving base to the specified angle", function(){
	// 		expect(output).to.have.all.keys("usec", "dir");
	// 	});
	// 	it("Expected moveServo() to have changed target.base after moving base to the specified angle", function(){
	// 		expect(testunit.target.base).to.not.equal(base_old);
	// 	});

	// 	var base_old2 = testunit.target.base;
	// 	var output2 = testunit.moveServo("base", "stop");

	// 	it("Expected moveServo() to return 'stopped' when 'stop' is specified", function(){
	// 		expect(output2).to.eql("stopped");
	// 	});
	// 	it("Expected moveServo() to not change target.base after stopping base motor", function(){
	// 		expect(testunit.target.base).to.equal(base_old2);
	// 	});
	// });
	// describe("function moveActuator():", function(){
	// 	var shoulder_old = testunit.target.shoulder;
	// 	var shoulder_new = 54;
	// 	var output = testunit.moveActuator("shoulder", shoulder_new);

	// 	it("Expected moveActuator() to return an object with duty and direction after moving shoulder to the specified angle", function(){
	// 		expect(output).to.have.all.keys("duty_cycle", "dir");
	// 	});
	// 	it("Expected moveActuator() to have changed target.shoulder after moving shoulder to the specified angle", function(){
	// 		expect(testunit.target.shoulder).to.not.equal(shoulder_old);
	// 	});

	// 	var shoulder_old2 = testunit.target.shoulder;
	// 	var output2 = testunit.moveActuator("shoulder", "stop");

	// 	it("Expected moveActuator() to return 'stopped' when 'stop' is specified", function(){
	// 		expect(output2).to.eql("stopped");
	// 	});
	// 	it("Expected moveActuator() to not change target.shoulder after stopping shoulder motor", function(){
	// 		expect(testunit.target.shoulder).to.equal(shoulder_old2);
	// 	});
	// });

	// describe("function grab()", function(){
	// 	var claw_old = testunit.position;
	// 	var claw_new = 54;
	// 	var output = testunit.grab(claw_new);

	// 	it("Expected grab() to have changed target.claw after moving claw to the specified angle", function(){
	// 		expect(testunit.target.claw).to.not.equal(claw_old);
	// 	});

	// });

	// describe("function react():", function(){
	// 	var old_target = testunit.target;
	// 	it("Expected react() to have changed target when given the command to move to a new position", function(){
	// 		var input = {
	// 			name: "move",
	// 			data: {
	// 				"base": 15,
	// 				"shoulder": 43,
	// 				"elbow": 15,
	// 				"wrist": 50
	// 			}
	// 		};
	// 		testunit.react(input);
	// 		var new_target = testunit.target;

	// 		expect(new_target.base).to.not.eql(old_target.base);
	// 		expect(new_target.shoulder).to.not.eql(old_target.shoulder);
	// 		expect(new_target.elbow).to.not.eql(old_target.elbow);
	// 		expect(new_target.wrist).to.not.eql(old_target.wrist);
	// 	});
	// });
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

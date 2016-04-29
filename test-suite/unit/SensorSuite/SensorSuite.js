"use strict";

var SensorSuite = require('../../../modules/SensorSuite/SensorSuite');
var expect = require('chai').expect;

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


class modelClass {
    constructor(some1,some2,some3) {
      this.some1 = "";
      this.some2 = "";
      this.some3 = "";
    }
    registerMemory(some1) {
      this.some1 = some1;
    }
    set(some1, some2) {
      this.some2 = 35;
    }

  };
	module.exports = modelClass;
	var model = new modelClass();

	var awake = 0;
	class i2c_bus{
		constructor(something1, something2, something3) {

		}
		writeByteSync(dev_addr, register, command){
			awake = command;

		}
		readByteSync(dev_addr, register){
			if(register === 0x10 || register === 0x11 || register === 0x12){
				return "0";
			}
			if(register === 0x02){
				return "1";
			} 
			else return "180";
		}
		readByte(dev_addr, register, cb){
			return "180";
		}
		reset(){
			dev_addr1 =[], dev_addr2 =[];
			register1 =[], register2 =[];
			command1 =[], command2 =[];
		}
	};
	module.exports = i2c_bus;
	var i2c = new i2c_bus();

	var dummyTemp = 176;

	var toFixed;
//	var i2c = function() {}; // filler i2c object (not used in test)
	// var model = function() {}; // filler model object (not used in test)

	var test_lobe = new SensorSuite("SensorSuite", feedback, log, 500, i2c, model);

	describe('Testing SensorSuite Methods', function () {
		describe('Function: react(input)', function () {
			it('#react() should be called', function () {
				test_lobe.react("TESTING");
				expect(expected_log).to.equal(`REACTING ${test_lobe.name}: TESTING`);
				expect(expected_feedback).to.equal(`SensorSuiteREACTING ${test_lobe.name}: TESTING`);
			});
		});
		describe('Function: halt()', function() {
			it('#halt() should be called', function () {
				test_lobe.halt();
				expect(expected_log).to.equal(`HALTING ${test_lobe.name}`);
				expect(expected_feedback).to.equal(`SensorSuiteHALTING ${test_lobe.name}`);
			});
		});
		describe('Function: resume()', function() {
			it('#resume() should be called', function () {
				test_lobe.resume();
				expect(expected_log).to.equal(`RESUMING ${test_lobe.name}`);
				expect(expected_feedback).to.equal(`SensorSuiteRESUMING ${test_lobe.name}`);
			});
		});
		describe('Function: idle()', function() {
			it('#idle() should be called', function () {
				test_lobe.idle();
				expect(expected_log).to.equal(`IDLING ${test_lobe.name}`);
				expect(expected_feedback).to.equal(`SensorSuiteIDLING ${test_lobe.name}`);
			});
		});
		describe('Function: wakeUp()', function() {
			it('expected data read to start', function () {   //wakeUp()
				test_lobe.mpu.wakeUp();
				expect(awake).to.equal(1);
			});
		});
		describe('Function: readData()', function() {
			it('expected data to be read in', function () {
				test_lobe.mpu.readData();
				expect(test_lobe.mpu.inputs[17]).to.equal(-19276);
				expect(test_lobe.mpu.inputs[18]).to.equal(-19276);
				expect(test_lobe.mpu.inputs[19]).to.equal(-19276);
				expect(test_lobe.mpu.inputs[20]).to.equal(-19276);
				expect(test_lobe.mpu.inputs[25]).to.equal(-9638);
				expect(test_lobe.mpu.inputs[24]).to.equal(-9638);
			});
		});
		describe('Function: convertPosition()', function() {
			it('expected position values to be converted to angles', function () {
				test_lobe.mpu.convertPosition();
				expect(test_lobe.mpu.inputs[27]).to.equal('-35.264');//
				expect(test_lobe.mpu.inputs[28]).to.equal('-35.264');//
				// expect(test_lobe.mpu.zangle).to.equal(-35.26390990826984);
			});
		});
		describe('Function: convertTemp()', function() {
			it('expected temperature value to be converted to celsius', function () {
				test_lobe.mpu.convertTemp();
				expect(test_lobe.mpu.inputs[29]).to.equal('-20.164');//
			});
		});
		describe('Function: log()', function() {
			it('expected data to be logged', function () {
				test_lobe.mpu.Log();
				expect(expected_log).to.equal("x-angle: -35.264 y-angle: -35.264 temperature: -20.164");
			});
		});
		describe('Function: sleep()', function() {
			it('expected data read to stop', function () {
				test_lobe.mpu.sleep();
				expect(awake).to.equal(0);
			});
		});
		describe('Function: convertCompass()', function() {
      it('expected compass value to be converted to degrees relative to North', function () {
        test_lobe.mpu.convertCompass();
        expect(test_lobe.mpu.inputs[30]).to.equal(45);
      });
    });
    describe('Function: updateModel()', function() {
      it('expected model to be updated', function () {
        test_lobe.updateModel();
        expect(model.some1).to.equal('MPU');
        expect(model.some2).to.equal(35);
      });
    });
	// 	describe('Function: groundTemp()', function() {
	// 		it('expected temperature conversion to celsius', function () {
	// 			test_lobe.lm35.groundTemp();
	// 			expect(test_lobe.groundTemp()).to.equal(85.9375);
	// 		});
	// 	describe('Function: humidity()', function() {
	// 		it('expected temperature conversion to percentage', function () {
	// 			test_lobe.humidity();
	// 			expect(test_lobe.humidity()).to.equal(??????);
	// 		});
	// 	});
	 });
});

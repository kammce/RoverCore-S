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


	var dev_addr1 =[], dev_addr2 =[];
	var	register1 =[], register2 =[];
	var	command1 =[], command2 =[];
	var awake = 0;
	class i2c_bus{
		constructor(something1, something2, something3) {}

		writeByteSync(dev_addr, register, command){
			command1.push(command);
		}
		readByteSync(dev_addr, register){
			if(register === 0x10 || register === 0x11 || register === 0x12){
				return "0";
			}
			else if(register === 0x02){
				return 1;
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

//	var i2c = function() {}; // filler i2c object (not used in test)
	// var model = function() {}; // filler model object (not used in test)

	var i2c = new i2c_bus();
	var Model = require('../../../modules/Model');
	var model = new Model(function() {});

	var util = {
		name: "SensorSuite",
		feedback: feedback,
		log: log,
		idle_timeout: 500,
		i2c: i2c,
		model: model
	};

	var test_lobe = new SensorSuite(util);


	var Model = require('../../../modules/Model');
	var model = new Model(function() {});

	var util = {
		name: "SensorSuite",
		feedback: feedback,
		log: log,
		idle_timeout: 500,
		i2c: i2c,
		model: model
	};

	var test_lobe = new SensorSuite(util);

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
				expect(command1[0]).to.equal(1);
				// expect(command1[1]).to.equal(1);
				i2c.reset();
			});
		});
		describe('Function: readData()', function() {
			it('expected data to be read in', function () {
				test_lobe.mpu.readData();
				// expect(test_lobe.mpu.inputs[14]).to.equal(0);
				expect(test_lobe.mpu.inputs[17]).to.equal(-19276);
				expect(test_lobe.mpu.inputs[18]).to.equal(-19276);
				expect(test_lobe.mpu.inputs[19]).to.equal(-19276);
				expect(test_lobe.mpu.inputs[20]).to.equal(-19276);
				// expect(test_lobe.mpu.inputs[25]).to.equal(-9638);
				// expect(test_lobe.mpu.inputs[24]).to.equal(-9638);
			});
		});
		describe('Function: convertPosition()', function() {
			it('expected position values to be converted to angles', function () {
				test_lobe.mpu.convertPosition();
				expect(test_lobe.mpu.inputs[27]).to.equal(-135);
				expect(test_lobe.mpu.inputs[28]).to.equal(-135);
			});
		});
		describe('Function: convertTemp()', function() {
			it('expected temperature value to be converted to celsius', function () {
				test_lobe.mpu.convertTemp();
				expect(test_lobe.mpu.inputs[29]).to.equal(-36.735);
			});
		});
		describe('Function: log()', function() {
			it('expected data to be logged', function () {
				test_lobe.mpu.Log();
				expect(expected_log).to.equal("pitch: -135 roll: -135 temperature: -36.735");
			});
		});
		describe('Function: sleep()', function() {
			it('expected data read to stop', function () {
				test_lobe.mpu.sleep();
				expect(command1[0]).to.equal(0);
				i2c.reset();
			});
		});
		// describe('Function: convertCompass()', function() {
  //     it('expected compass value to be converted to degrees relative to North', function () {
  //       test_lobe.mpu.convertCompass();
  //       expect(test_lobe.mpu.inputs[30]).to.equal(45);
  //     });
  //   });
    describe('Function: updateModel()', function() {
      it('expected model to be updated', function () {
        test_lobe.updateModel();
        	expect(model.database['MPU'].value.pitch).to.equal(test_lobe.mpu.inputs[27]);
        // expect(model.get('MPU')).to.equal('MPU');
      });
    });
	 });
});

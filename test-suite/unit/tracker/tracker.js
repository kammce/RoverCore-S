"use strict";

var Tracker = require('../../../modules/Tracker/Tracker');

describe('Testing Tracker Class', function() {
	var expected_log;
	var expected_feedback;
	var log = function() { }
	log.output = function(input) { 
		expected_log = "";
		for (var i = 0; i < arguments.length; i++) {
			console.log(arguments[i]);
		} 
	};
	var feedback = function(input) { 
		expected_feedback = "";
		for (var i = 0; i < arguments.length; i++) {
			console.log(arguments[i]);
		} 
	};
	var MODEL = require('../../../modules/Model');
	var model = new MODEL(feedback);
	// var I2C_BUS = require('i2c-bus');
	// var i2c = I2C_BUS.openSync(3);
	console.log(model.get);
	function i2c() {}
	var test_lobe = new Tracker("Tracker", feedback, log, 2000, i2c, model);

	describe('Testing Tracker Methods', function() {
		it('#moveAngleLocal', function() {
			expect(test_lobe.moveAngleLocal([180, 90], [0,0])).to.eql([180, 90]);
			expect(test_lobe.moveAngleLocal([90, 0], [360, 0])).to.eql([450, 0]);
			expect(test_lobe.moveAngleLocal([200, 0], [540, 0])).to.eql([200, 0]);
			expect(test_lobe.moveAngleLocal([0, 100], [0, 0])).to.eql([0, 90]);
		});
		it('#moveInterval', function() {
			expect(test_lobe.moveInterval([10,10], [20, 20], [0, 0, 0], 
				[false, false])).to.eql([30, 30]);
			expect(test_lobe.moveInterval([20, 20], [620, 80], [0, 0, 0], 
				[false, false])).to.eql([630, 90]);

		});
		it('#angleToPWM', function(){
			expect(test_lobe.angleToPWM([0,0])).to.eql([1500, 1500]);
			expect(test_lobe.angleToPWM([630, 90])).to.eql([2400 , 2500]);
		});
		it('#defaultConfig', function(){
			expect(test_lobe.defaultConfig([0,0])).to.be.true;
			expect(test_lobe.defaultConfig([1000, 180])).to.be.false;
		});
		it('#recalibrate', function(){
			test_lobe.defaultConfig([90, 90]);
			expect(test_lobe.recalibrate()).to.eql([90, 90]);
		});
		/*
		it('#getGimbalPosition', function(){
			test_lobe.moveAngleLocal([90, 90]);
			expect(test_lobe.getGimbalPosition()).to.eql([90,90]);
		});
*/
		it('#react moveAngleLocal', function(done){
			test_lobe.moveAngleLocal = function (value) {				
				expect(value).be.eql([0,0]);
				done();
			};
			test_lobe.react({
				command : "moveAngleLocal",
				value : {
					yaw : 0,
					pitch : 0
				}
			});
		});
		it('#react moveInterval', function(done) {
			test_lobe.moveInterval = function (value, currentPosition, 
				roverOrientation, stabilize) {
				expect(value).to.eql([0,0]);
				done();
				return [0,0];			

			};
			test_lobe.react({
				command : "moveInterval",
				value : {
					yaw : 0,
					pitch : 0,
					stabilizeYaw : false,
					stabilizePitch :false
				}
			});
		});
		it('#react defaultConfig', function(done) {
			test_lobe.defaultConfig = function(value) {
				expect(value).to.eql([0,0]);
				done();
			};
			test_lobe.react({
				command : "defaultConfig",
				value : {
					yaw : 0,
					pitch : 0
				}
			});
		});
		it('#react recalibrate', function(done) {
			test_lobe.recalibrate = function() {
				expect(true).to.be.true;				
				done();
			};
			test_lobe.react({
				command : "recalibrate"
			});
		});

		it('#halt move to position', function(done){
			test_lobe.moveAngleLocal = function(value) {
				expect(value).to.eql([0, -90]);
				done();								
			};
			test_lobe.halt();
		});
		
		it('#halt turn servo off', function(done) {
			test_lobe.servoWrite = function() {
				done();
			}
			//test_lobe.halt();
		});

		it('#resume', function(done){
			test_lobe.recalibrate = function() {
				expect(true).to.be.true;
				done();				
				return test_lobe.defaultPosition;
							
			};
			test_lobe.resume();

		});
		it('#idle', function(){
			test_lobe.recalibrate = function() {
				expect(true).to.be.true;
				done();				
				return test_lobe.defaultPosition;
							
			};
			test_lobe.idle();
		});
		it('#getDistance', function(){
			expect(test_lobe.getDistance()).to.be.not.empty;
		});
		it('#servoWrite', function(){
			expect(false).to.be.true;
		});
		it('#updateModel', function() {
			
			test_lobe.react(
				{
				command : "moveAngleLocal",
				value : {
					yaw : 90,
					pitch : 90
					}
				});		
					
			expect(model.database['CAMERA GIMBAL']['value']).to.eql({
				yaw: 90,
				pitch: 90
			});
			//test for LIDAR

		});
	});
});
"use strict";

var Tracker = require('../../../modules/Tracker/Tracker');
var I2CTest = require('../../../modules/Tracker/I2CTest');

describe('Testing Tracker Class', function() {
	var expected_log;
	var expected_feedback;
	var log = function() { };
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
	//var PWMDriver = require('../../../modules/PWMDriver');
	var model = new MODEL(feedback);
	// var I2C_BUS = require('i2c-bus');
	// var i2c = I2C_BUS.openSync(3);
	console.log(model.get);	
	
	var dutyPin = [], microPin = [];
	var dutyValue = [], microValue = [];	
	var i2c = new I2CTest();
	var test_lobe = new Tracker("Tracker", feedback, log, 2000, i2c, model, true);


	describe('#react moveAngleLocal', function(){
			before(function(done){
				test_lobe.gimbalPosition = [0,0];
				test_lobe.react({					
					mode: "moveAngleLocal",
					yaw: 4, 
					pitch: 5					
				});
				done();
			});

			it('#react moveAngleLocal should correctly modify gimbalPosition', function(){			
				expect(test_lobe.gimbalPosition).is.eql([4,5]);
			});
			it('#react moveAngleLocal should send correct signal to servo',function() {
				expect(test_lobe.pwm.microValue.pop()).to.eql(1556);
				expect(test_lobe.pwm.microValue.pop()).to.eql(1506);
			});
		});

	describe('#react moveInterval', function(){
		before(function(done){
			test_lobe.gimbalPosition = [0,0];
			test_lobe.react({
				mode: "moveInterval",
					yaw: 5, 
					pitch: 6
			});
			done();
		});
		it('#moveInterval should correctly modify gimbalPosition', function() {		
			
			expect(test_lobe.gimbalPosition).is.eql([5,6]);
		});
	});

	describe('#react defaultConfig', function(){
		before(function(done){
			test_lobe.react({
				mode: "defaultConfig",
				yaw: 1,
				pitch: 2
			});
			done();
		});
		it('# defaultConfig should correctly set default servo position', function(){
			expect(test_lobe.defaultPosition).is.eql([1,2]);
		});
	});
	describe('#react recalibrate', function(){
		before(function(done){
			test_lobe.react({
				mode : "recalibrate"
			});
			done();
		});
		it('#recalibrate should return to default position', function(){
			expect(test_lobe.gimbalPosition).is.eql(test_lobe.defaultPosition);
		});
	});

	describe('#resume', function(){
		before(function(done){
			test_lobe.resume();
			done();
		});
		it('#resume should return to default position', function(){
			expect(test_lobe.gimbalPosition).is.eql(test_lobe.defaultPosition);
		});		
	});

	describe('#idle', function(){
		before(function(done){
			test_lobe.idle();
			done();
		});
		it('#idle should return to default position', function(){
			expect(test_lobe.gimbalPosition).is.eql(test_lobe.defaultPosition);
		});
	});
	
	describe('#halt', function(){
		before(function(done){
			test_lobe.halt();
			setTimeout(function(){ done(); }, 1200);
		});
		it('#halt should move gimbal to shutdown position', function(){
			expect(test_lobe.gimbalPosition).is.eql([0,-90]);
		});
		it('#halt should set servo duty cycle to 100', function(){
			expect(test_lobe.pwm.dutyValue.pop()).to.eql(100);
			expect(test_lobe.pwm.dutyValue.pop()).to.eql(100);
		});
	});

	describe('#updateModel', function(){
		before(function(done){
			test_lobe.react(
				{
				mode : "moveAngleLocal",				
				yaw : 90,
				pitch : 90						
				});
			setTimeout(done(),100);
		});
		it('#model should be updated when react is called', function(){
			expect(model.database['CAMERA GIMBAL']['value']).to.eql({
					yaw: 90,
					pitch: 90
			});
		});
		//Test lidar
	});

	describe('#testing standard class functions', function(){
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
		it('#getDistance', function(){
			expect(test_lobe.getDistance()).to.be.not.empty;
		});	
		*/
	});	

	describe('#lidar getDistance', function(){
		
		before(function(done) {
			test_lobe.react({
				mode: "getDistance"
			});
			setTimeout(function(){done();}, 50);
		});
		it('#getDistance should return correct distance', function(){
			expect(test_lobe.lidarMeasurement).to.eql(271);
		});
	});

	describe('#lidar checkLidarHealth', function(){
		before(function(done){
			test_lobe.react({
				mode: "lidarHealth"
			});
			setTimeout(function(){done();}, 20);
		});
		it('#checkLidarHealth should return true', function(){
			expect(test_lobe.lidarHealth).to.be.true;
		});
	});		
	
});
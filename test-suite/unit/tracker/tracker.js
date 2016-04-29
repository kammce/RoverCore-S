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


	describe('#react moveAngle', function(){				

			it('#react moveAngle should correctly modify gimbalPosition', function(){			
				test_lobe.target = {
            		yaw: 0,
            		pitch: 0
       			 };
				test_lobe.react({					
					mode: "moveAngle",
					yaw: 4, 
					pitch: 5					
				});
				expect(test_lobe.target).is.eql({
					yaw: 4,
					pitch: 5
				});
			});
			
		});

	describe('#react moveInterval', function(){			
		
		it('#moveInterval should correctly modify gimbalPosition', function() {		
			test_lobe.target = {
	    		yaw: 0,
	    		pitch: 0
			 };

			test_lobe.react({
				mode: "moveInterval",
				yaw: 5, 
				pitch: 6
			});

			expect(test_lobe.target).is.eql({
				yaw: 5,
				pitch: 6
			});
		});
	});

	describe('#react defaultConfig', function(){			
		
		it('# defaultConfig should correctly set default servo position', function(){
			test_lobe.react({
				mode: "setHome",
				yaw: 1,
				pitch: 2
			});

			expect(test_lobe.defaultPosition).is.eql({
				yaw: 1,
				pitch: 2
			});
		});
	});
	describe('#react recalibrate', function(){					
		
		it('#recalibrate should return to default position', function(){
			test_lobe.react({
				mode : "moveHome"
			});
			expect(test_lobe.target).is.eql(test_lobe.defaultPosition);
		});
	});

	describe('#resume', function(){
		
		it('#resume should return to default position', function(){
			test_lobe.resume();
			expect(test_lobe.target).is.eql(test_lobe.defaultPosition);
		});		
	});

	describe('#idle', function(){
		
		it('#idle should return to default position', function(){
			test_lobe.idle();
			expect(test_lobe.target).is.eql(test_lobe.defaultPosition);
		});
	});
	
	describe('#halt', function(){
		before(function(done){
			test_lobe.halt();
			setTimeout(function(){ done(); }, 1200);
		});
		it('#halt should move gimbal to shutdown position', function(){
			expect(test_lobe.target).is.eql({
				yaw: 0,
				pitch: 90
			});
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
				mode : "moveAngle",				
				yaw : 90,
				pitch : 90						
				});
			setTimeout(done(),100);
		});
		it('#model should be updated when react is called', function(){
			expect(model.database['CAMERA GIMBAL']['value']).to.eql(test_lobe.output);
		});
		//Test lidar
	});

	describe('#testing standard class functions', function(){
		it('#moveAngle', function() {
			expect(test_lobe.moveAngleLocal({yaw: 180, pitch: 90 }, {yaw:0, pitch:0 })).to.eql({yaw: 180, pitch: 90 });
			expect(test_lobe.moveAngleLocal({yaw: 90, pitch:0 }, {yaw:360, pitch: 0 })).to.eql({yaw: 450, pitch: 0 });
			expect(test_lobe.moveAngleLocal({yaw: 200, pitch: 0 }, {yaw: 540, pitch: 0 })).to.eql({yaw: 200, pitch: 0 });			
		});
		
		it('#moveInterval', function() {
			expect(test_lobe.moveInterval({yaw: 10, pitch: 10 }, {yaw: 20, pitch: 20})).to.eql({yaw: 30, pitch: 30});
			expect(test_lobe.moveInterval({yaw: 20, pitch: 20}, {yaw: 620, pitch: 80})).to.eql({yaw: 630, pitch: 100});

		});
		it('#angleToPWM', function(){
			expect(test_lobe.angleToPWM({yaw: 0, pitch: 0})).to.eql([1500,1500]);
			expect(test_lobe.angleToPWM({yaw: 630, pitch: 90})).to.eql([2400, 2500]);
		});
		it('#defaultConfig', function(){
			expect(test_lobe.defaultConfig({yaw: 0, pitch: 0})).to.be.true;
			expect(test_lobe.defaultConfig({yaw: 1000, pitch: 180})).to.be.false;
		});
		it('#recalibrate', function(){
			test_lobe.defaultConfig({yaw: 90, pitch: 90});
			expect(test_lobe.recalibrate()).to.eql({yaw: 90, pitch: 90});
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
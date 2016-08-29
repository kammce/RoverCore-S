'use strict';
describe('Testing driveSystem', function(){
	var driveSystem = require('../../../modules/driveSystem/driveSystem');
	var dataInject = {mode: '',speed:0, angle:0, limit:'', PIDState:''};
	var dataOutput = {mode: '',speed:0, angle:0, limit:'', PIDState:''};
	class serialport{
		constructor(){

		}
		on(type, callfunction){
			//callfunction(dataInject);
		}
		write(data){
			if(data[0] === 'S'){
				var data1 = data.split(",");
				var dataSpeed = data1[0];
				dataSpeed = dataSpeed.replace("S", "");
				dataOutput.speed = parseInt(dataSpeed);
				var dataAngle = data1[1];
				dataAngle = dataAngle.replace("\n", "");
				data1[1] = dataAngle;
				dataOutput.angle = parseInt(dataAngle);
			}
			if(data[0] === 'M'){
				var dataMode = data;
				dataMode = dataMode.replace("M", "");
				dataMode = dataMode.replace("\n", "");
				dataOutput.mode = dataMode;
			}
			if(data[0] === 'L'){
				var dataLimit = data;
				dataLimit = dataLimit.replace("L", "");
				dataLimit = dataLimit.replace("\n", "");
				dataOutput.limit = parseInt(dataLimit);
			}
			if(data[0] === 'P'){
				var dataPIDState = data;
				dataPIDState = dataPIDState.replace("P", "");
				dataPIDState = dataPIDState.replace("\n", "");
				dataOutput.PIDState = dataPIDState;
			}
		}
		reset(){
			dataOutput = {mode: '',speed:0, angle:0, limit:'', PIDState:''};;
		}
	};
	class log{
		constructor(){

		}
		output(data){

		}
	};
	
	var feedback = function(blah1, blah2, blah3){};
	var serialportInject = new serialport();
	var logInject = new log();

	var name, idle_timeout, i2c, model;


	var util = {
		name: "DriveSystem",
		feedback: feedback,
		log: logInject,
		idle_timeout: 2000,
		i2c: i2c,
		model: model,
		serial: serialportInject,
	};

	var test_unit = new driveSystem(util);

	describe('Testing Constructor Initialization', function(){
		before(function() {
			dataInject.mode = 'c';
			dataInject.speed = 0;
			dataInject.angle = 90;
			dataInject.limit = 50;
			dataInject.PIDState = 'on';
			test_unit.sendState();
  		});
  			it('Comparing data from mission control to data sent to Fist', function(){
				expect(dataInject).to.eql(dataOutput);
		});  
  		after(function() {
   			serialportInject.reset();
   			dataInject.mode = 'c';
			dataInject.speed = 0;
			dataInject.angle = 90;
			dataInject.limit = 50;
			dataInject.PIDState = 'on';
			test_unit.halt();
			test_unit.resume();
			test_unit.sendState();
 		});
	});
	describe('Testing react', function(){
		describe('Verifying react returns', function(){
			it('Assert that the call back is True when react is called', function(){

				expect(test_unit.react(dataInject)).to.eql(true);
			});
			it('Assert that the call back is False when Halt is called', function(){
				test_unit.halt();
				expect(test_unit.react(dataInject)).to.eql(false);
			});
			it('Assert that the call back is True when Resume is called', function(){
				test_unit.resume();
				expect(test_unit.react(dataInject)).to.eql(true);
			});
			it('Assert that the call back is False when Idle is called', function(){
				test_unit.idle();
				expect(test_unit.react(dataInject)).to.eql(false);
			});
		});
		describe('Verifying Data through module', function(){
			before(function() {
				dataInject.speed = 98;
				dataInject.angle = 34;
				dataInject.mode = 'T';
				dataInject.limit = 25;
				dataInject.PIDState = 'off';
				test_unit.halt();
				test_unit.resume();
	    		test_unit.react(dataInject);
	    		test_unit.sendState();
	  		});
	  		it('Comparing data from mission control to data sent to Fist', function(){
				expect(dataInject).to.eql(dataOutput);
			});  			
	  		after(function() {
	   			serialportInject.reset();
	   			dataInject.mode = 'c';
				dataInject.speed = 0;
				dataInject.angle = 90;
				dataInject.limit = 50;
				dataInject.PIDState = 'on';
				test_unit.sendState();
	 		});
		});
	});
/*
setTimeout(function() {
	  			it('Comparing data from mission control to data sent to Fist', function(){
				expect(dataInject).to.eql(dataOutput);
				})
  			},120
  		);


*/
	describe('Testing halt', function(){
		
	});

	describe('Testing resume', function(){
		
	});

	describe('Testing idle', function(){
		
	});
});















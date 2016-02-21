'use strict';
describe('Testing PWMDriver', function(){
	var driveSystem = require('../../modules/driveSystem');
	var dataInject = {'speed', 'angle', 'mode', 'limit', 'PIDState'};
	var dataOutput
	class serialport{
		constructor(){

		}
		on(type, callfunction){
			callfunction(dataInject);
		}
		write(data){
			if(data[0] === 'M'){
				parese
			}
			dataOutput = data;
		}
	};
	class log{
		constructor(){

		}
		output(data){

		}
	};
	module.exports = serialport;
	module.exports = log;

	var serialportInject = new serialport();

	var name, feedback, idel_timeout, i2c, model;
	var test_unit = new driveSystem(name, feedback, color_log, idel_timeout, i2c, model, serialportInject);

	describe('Testing react', function(){
		before(function() {
			dataInject.speed = 50
			dataInject.angle = 75
			dataInject.mode = 'c'
			dataInject.limit = 50
			dataInject.PIDState = 'on'
    		test_unit.react(dataInject);
  		});
  		after(function() {
   			i2c.reset();
 		});
	});

	describe('Testing halt', function(){
		
	});

	describe('Testing resume', function(){
		
	});

	describe('Testing idle', function(){
		
	});
});















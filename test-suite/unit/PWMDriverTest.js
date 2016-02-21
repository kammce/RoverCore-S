'use strict';
describe('Testing PWMDriver', function(){
	var PWMDriver = require('../../modules/PWMDriver');
	var dev_addr1 =[], dev_addr2 =[];
	var register1 =[], register2 =[];
	var command1 =[], command2 =[];
	class i2c_bus{
		constructor(something1, something2, something3) {
			
		}
		writeByteSync(dev_addr, register, command){
			dev_addr1.push(dev_addr);
			register1.push(register);
			command1.push(command);
			
		}
		readByteSync(dev_addr, register){

		}
		writeByte(dev_addr, register, command, cb){
			dev_addr2.push(dev_addr);
			register2.push(register);
			command2.push(command);
		}
		readByte(dev_addr, register, cb){

		}
		reset(){
			dev_addr1 =[], dev_addr2 =[];
			register1 =[], register2 =[];
			command1 =[], command2 =[];
		}
	};
	module.exports = i2c_bus;
	var i2c = new i2c_bus();
	var test_unit = new PWMDriver(50,100,i2c);
	

	describe('Testing all functions for propper returns', function(){
		it('Set Duty', function(){
			expect(test_unit.setDUTY(3, 50)).to.eql(true);
			expect(test_unit.setDUTY(3, 500)).to.eql(false);
			expect(test_unit.setDUTY(3, '50')).to.eql(false);
		});
		it('Set PWM', function(){
			expect(test_unit.setPWM(3, 0, 4095)).to.eql(true);
			expect(test_unit.setPWM(3, 0, 4999)).to.eql(false);
			expect(test_unit.setPWM(3, 4999, 0)).to.eql(false);
			expect(test_unit.setPWM(3, 0, '4040')).to.eql(false);
		});
		it('Set Micro', function(){
			expect(test_unit.setDUTY(3, 1000000)).to.eql(false);
			expect(test_unit.setDUTY(3, 100)).to.eql(true);
			expect(test_unit.setDUTY(3, '50')).to.eql(false);
		});
	});
	describe('Testing setDuty', function(){
		before(function() {
    		test_unit.setDUTY(3, 50);
  		});
  		after(function() {
   			i2c.reset();
 		});
		it('checking sendpwmRegOnL inputs to sm-bus', function(){
			expect(register2[0]).to.eql(0x12);
			expect(command2[0]).to.eql(0x00);
		});
		it('checking sendpwmRegOnH inputs to sm-bus', function(){
			expect(register2[1]).to.eql(0x13);
			expect(command2[1]).to.eql(0x00);
		});
		it('checking sendpwmRegOffL inputs to sm-bus', function(){
			expect(register2[2]).to.eql(0x14);
			expect(command2[2]).to.eql(0xFF);
		});
		it('checking sendpwmRegOffH inputs to sm-bus', function(){
			expect(register2[3]).to.eql(0x15);
			expect(command2[3]).to.eql(0x07);
		});
	});
	describe('Testing setPWM', function(){
		before(function() {
    		test_unit.setPWM(3, 200, 2000);
  		});
  		after(function() {
   			i2c.reset();
 		});		
		it('checking sendpwmRegOnL inputs to sm-bus', function(){
			expect(register2[0]).to.eql(0x12);
			expect(command2[0]).to.eql(0xc8);
		});
		it('checking sendpwmRegOnH inputs to sm-bus', function(){
			expect(register2[1]).to.eql(0x13);
			expect(command2[1]).to.eql(0x00);
		});
		it('checking sendpwmRegOffL inputs to sm-bus', function(){
			expect(register2[2]).to.eql(0x14);
			expect(command2[2]).to.eql(0xD0);
		});
		it('checking sendpwmRegOffH inputs to sm-bus', function(){
			expect(register2[3]).to.eql(0x15);
			expect(command2[3]).to.eql(0x07);
		});
	});
	describe('Testing setMicro', function(){
		before(function() {
			test_unit.setMICRO(3, 100);
			});
  		after(function() {
   			i2c.reset();
 		});		
		it('checking sendpwmRegOnL inputs to sm-bus', function(){
			expect(register2[0]).to.eql(0x12);
			expect(command2[0]).to.eql(0x00);
		});
		it('checking sendpwmRegOnH inputs to sm-bus', function(){
			expect(register2[1]).to.eql(0x13);
			expect(command2[1]).to.eql(0x00);
		});
		it('checking sendpwmRegOffL inputs to sm-bus', function(){
			expect(register2[2]).to.eql(0x14);
			expect(command2[2]).to.eql(0x28);
		});
		it('checking sendpwmRegOffH inputs to sm-bus', function(){
			expect(register2[3]).to.eql(0x15);
			expect(command2[3]).to.eql(0x00);
		});
	});
});

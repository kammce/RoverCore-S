"use strict";
	var i2c = require("i2c-bus");
		//var i2c1 = i2c.open(1);
//Send address byte to select device. 
//Then send command byte to select register.
//then send data byte to register or read data byte.

//High byte ---- [7:5] reserved [4] full on [3:0] first 4 bits of 4096.    
//Low  byte ---- [7:0] last 8 bits of 4096.

//SM-BUS Signal Format
//Start condition (S) | slave address | R/~W | Acknowledgement from slave | 
//Control register | Acknowledgement from slave | Data Byte | Acknowledgement from slave | stop condition(P)

//    bus.writeByte(addr, cmd, byte, cb)
//    addr - I2C device address
//    cmd -  command code
//    byte - data byte
//    cb -   completion callback
//dev_addr       = 0x40;
		//SUBADR1        = 0x02;
		//SUBADR2        = 0x03;
		//SUBADR3		 = 0x04;
		//MODE1 		 = 0x00;
		//PRESCALE  	 = 0xFE;
		//LED0_ON_L 	 = 0x06;
		//LED0_ON_H 	 = 0x07;
		//LED0_OFF_L	 = 0x08;
		//LED0_OFF_H 	 = 0x09;
		//ALLLED_ON_L 	 = 0xFA;
		//ALLLED_ON_H 	 = 0xFB;
		//ALLLED_OFF_L 	 = 0xFC;
		//ALLLED_OFF_H 	 = 0xFD;
class PWM_Driver {
	constructor (port, freq){
		const dev_addr       = 0x40;
		const MODE1 		 = 0x00;
		var prescale = Math.floor((((25000000 / 4096) / freq) - 1) + 0.5);
		var freq = freq * 0.9;
		var i2c1 = i2c.openSync(port);
		console.log("Serial Port Opened");
		i2c1.writeByteSync(dev_addr, MODE1, 0x00);
		console.log("Board Reset");
		var oldmode = i2c1.readByteSync(dev_addr, MODE1); 
		console.log("Old Mode read "+ oldmode);
		var newmode = parseInt((oldmode & 0x7F) | 0x10);
		i2c1.writeByteSync(dev_addr, MODE1, newmode);
		console.log("New Mode Sent " + newmode);
		i2c1.writeByteSync(dev_addr, MODE1, prescale);
		console.log("Prescale Sent " + prescale);
		i2c1.writeByteSync(dev_addr, MODE1, oldmode);
		console.log("Old Mode Sent ");
		setTimeout(function(){i2c1.writeByteSync(dev_addr, MODE1, (oldmode | 0xa1))}, 5,
			function(err) {if (err){console.log("error is here");throw err;}}
		);
		console.log("Final Mode Sent ");
		i2c1.closeSync();
		console.log("Serial Port Closed ");
	}
	//Public Functions///////////////////////////////////////////////////////////////////////////
	setDUTY(i2c_port, pwm_pin, duty){
		var i2c1;
		const dev_addr       = 0x40;
		const MODE1 		 = 0x00;
		const LED0_ON_L 	 = 0x06;
		const LED0_ON_H 	 = 0x07;
		const LED0_OFF_L	 = 0x08;
		const LED0_OFF_H 	 = 0x09;
		var openPWM = function(port, freq){
  		  return new Promise(function(resolve, reject) {
    		i2c1 = i2c.open(port, function (err) {
   			if (err) {throw err;}
   			console.log("Opened PWM");
    		resolve(freq);
   			});
    		});
		};
		
		var closePWM = function(){
			return new Promise(function(resolve, reject) {
				i2c1.close(function (err) {
					if (err){ throw err;}
					console.log("Closed PWM");
					resolve(1);
				});
			});
		};
		var sendpwmRegOnL = function(num, on){
			return new Promise(function(resolve, reject) {
				console.log("before");
				i2c1.writeByte(dev_addr, LED0_ON_L+4*num, genByteL(on), function(err){ 
					if (err){console.log("error is here");throw err;}console.log("part 1");resolve(1);});
			 });
		};
		var sendpwmRegOnH = function(num, on){
			return new Promise(function(resolve, reject) {
				i2c1.writeByte(dev_addr, LED0_ON_H+(4*num), genByteH(on), function(err){ 
					if (err){throw err;}console.log("part 2");resolve(1);});
			 });
			
		};
		var sendpwmRegOffL = function(num, off){
			return new Promise(function(resolve, reject) {
				i2c1.writeByte(dev_addr, LED0_OFF_L+(4*num), genByteL(off), function(err){ 
					if (err){throw err;}console.log("part 3");resolve(1);});
				
			 });
		};
		var sendpwmRegOffH = function(num, off){
			return new Promise(function(resolve, reject) {
				i2c1.writeByte(dev_addr, LED0_OFF_H+(4*num), genByteH(off), function(err){ 
					if (err){throw err;}console.log("part 4");resolve(1);});
				
			 });
		};
		var genByteH = function (input){
			if(!isNumber(input)){
				console.log("Invalid Data Type in genByteH");
				throw "Invalid Data Type in genByteH";
			}
			var MSB = input >> 8;
			if(input==4096){
				MSB = 16;
			}
			return MSB;
		};
		var genByteL = function (input){
			if(!isNumber(input)){
				console.log("Invalid Data Type in genByteL");
				throw "Invalid Data Type in genByteL";
			}
			var LSB = input & 0x0FF;
			if(input==4096){
				LSB = 0;
			}
			return LSB;
		};
		var isNumber = function (o) {
		    if(typeof o == "number" || (typeof o == "object" && o.constructor === Number)){
		    	return true;
		    }
		    else return false;
		};
		if(isNumber(duty) && duty<=100 && duty>=0){
			console.log("            DUTY" + duty); 
			openPWM(i2c_port, 100)
				.then(sendpwmRegOnL(pwm_pin, 0))
				.then(sendpwmRegOnH(pwm_pin, 0))
				.then(sendpwmRegOffL(pwm_pin, 4095*(duty/100)))
				.then(sendpwmRegOffH(pwm_pin, 4095*(duty/100)))
				.then(closePWM());
		}
		else{
			console.log("input parameter in function <setDuty> is inccorect value or wrong type.");
		}
	}

	setPWM(i2c_port, pwm_pin, on, off){
		var i2c1;
		const dev_addr       = 0x40;
		const MODE1 		 = 0x00;
		const LED0_ON_L 	 = 0x06;
		const LED0_ON_H 	 = 0x07;
		const LED0_OFF_L	 = 0x08;
		const LED0_OFF_H 	 = 0x09;
		var openPWM = function(port, freq){
  		  return new Promise(function(resolve, reject) {
    		i2c1 = i2c.open(port, function (err) {
   			if (err) {throw err;}
   			console.log("Opened PWM");
    		resolve(freq);
   			});
    		});
		};
		
		var closePWM = function(){
			return new Promise(function(resolve, reject) {
				i2c1.close(function (err) {
					if (err){ throw err;}
					console.log("Closed PWM");
					resolve(1);
				});
			});
		};
		var sendpwmRegOnL = function(num, on){
			return new Promise(function(resolve, reject) {
				console.log("before");
				i2c1.writeByte(dev_addr, LED0_ON_L+4*num, genByteL(on), function(err){ 
					if (err){console.log("error is here");throw err;}console.log("part 1");resolve(1);});
			 });
		};
		var sendpwmRegOnH = function(num, on){
			return new Promise(function(resolve, reject) {
				i2c1.writeByte(dev_addr, LED0_ON_H+(4*num), genByteH(on), function(err){ 
					if (err){throw err;}console.log("part 2");resolve(1);});
			 });
			
		};
		var sendpwmRegOffL = function(num, off){
			return new Promise(function(resolve, reject) {
				i2c1.writeByte(dev_addr, LED0_OFF_L+(4*num), genByteL(off), function(err){ 
					if (err){throw err;}console.log("part 3");resolve(1);});
				
			 });
		};
		var sendpwmRegOffH = function(num, off){
			return new Promise(function(resolve, reject) {
				i2c1.writeByte(dev_addr, LED0_OFF_H+(4*num), genByteH(off), function(err){ 
					if (err){throw err;}console.log("part 4");resolve(1);});
				
			 });
		};
		var genByteH = function (input){
			if(!isNumber(input)){
				console.log("Invalid Data Type in genByteH");
				throw "Invalid Data Type in genByteH";
			}
			var MSB = input >> 8;
			if(input==4096){
				MSB = 16;
			}
			return MSB;
		};
		var genByteL = function (input){
			if(!isNumber(input)){
				console.log("Invalid Data Type in genByteL");
				throw "Invalid Data Type in genByteL";
			}
			var LSB = input & 0x0FF;
			if(input==4096){
				LSB = 0;
			}
			return LSB;
		};
		var isNumber = function (o) {
		    if(typeof o == "number" || (typeof o == "object" && o.constructor === Number)){
		    	return true;
		    }
		    else return false;
		};
		if(isNumber(on) && isNumber(off) &&
		   on<=4096 && on>=0 && off<=4096 && off>=0){
				openPWM(i2c_port, 100)
					.then(sendpwmRegOnL(pwm_pin, on))
					.then(sendpwmRegOnH(pwm_pin, on))
					.then(sendpwmRegOffL(pwm_pin, off))
					.then(sendpwmRegOffH(pwm_pin, off))
					.then(closePWM());
		}
		else{
			console.log("input parameters in function <setPWM> are inccorect values or wrong types.");
		}
	}
}//EndClass

var PWM = new PWM_Driver(2, 100);
//PWM.setPWM(2, 0, 0, 4095);
PWM.setDUTY(2, 0, 0);
setTimeout(function(){PWM.setDUTY(2, 1, 10)}, 20);
setTimeout(function(){PWM.setDUTY(2, 2, 20)}, 40);
setTimeout(function(){PWM.setDUTY(2, 3, 30)}, 60);
setTimeout(function(){PWM.setDUTY(2, 4, 40)}, 80);
setTimeout(function(){PWM.setDUTY(2, 5, 50)}, 100);
setTimeout(function(){PWM.setDUTY(2, 6, 60)}, 120);
setTimeout(function(){PWM.setDUTY(2, 7, 70)}, 140);
setTimeout(function(){PWM.setDUTY(2, 8, 80)}, 160);
setTimeout(function(){PWM.setDUTY(2, 9, 90)}, 180);
setTimeout(function(){PWM.setDUTY(2, 10, 100)}, 200);

//PWM.initialize(2, 100);
//setTimeout(PWM.setDUTY(50), 500);	



//


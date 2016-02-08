"use strict";

//High byte ---- [7:5] reserved [4] full on [3:0] first 4 bits of 4096.    
//Low  byte ---- [7:0] last 8 bits of 4096.

//SM-BUS Signal Format
//Start condition (S) | slave address | R/~W | Acknowledgement from slave | 
//Control register | Acknowledgement from slave | Data Byte | Acknowledgement from slave | stop condition(P)

//  bus.writeByte(addr, cmd, byte, cb)
//  addr - I2C device address
//  cmd -  command code
//  byte - data byte
//  cb -   completion callback
//	dev_addr      	 = 0x40;
//	SUBADR1       	 = 0x02;
//	SUBADR2       	 = 0x03;
//	SUBADR3			 = 0x04;
//	MODE1 			 = 0x00;
//	PRESCALE  		 = 0xFE;
//	LED0_ON_L 		 = 0x06;
//	LED0_ON_H 		 = 0x07;
//	LED0_OFF_L		 = 0x08;
//	LED0_OFF_H 		 = 0x09;
//	ALLLED_ON_L 	 = 0xFA;
//	ALLLED_ON_H 	 = 0xFB;
//	ALLLED_OFF_L 	 = 0xFC;
//	ALLLED_OFF_H 	 = 0xFD;
class PWMDriver {
	constructor(address, freq, i2c){
		this.i2c = i2c;
		this.freq = freq;
		this.dev_addr = address;
		var mode = 0x00;
		var prescale = Math.floor((((25000000 / 4096) / freq) - 1) + 0.5);
		var freq = freq * 0.9;
		i2c.writeByteSync(address, mode, 0x00);
		var oldmode = i2c.readByteSync(address, mode); 
		var newmode = parseInt((oldmode & 0x7F) | 0x10);
		i2c.writeByteSync(address, mode, newmode);
		i2c.writeByteSync(address, mode, prescale);
		i2c.writeByteSync(address, mode, oldmode);
		setTimeout(function(){i2c.writeByteSync(address, mode, (oldmode | 0xa1))}, 5,
			function(err) {console.log("HERE");if (err){throw err;}}
		);
	}
	setDUTY(pin, duty){
		var i2c = this.i2c;
		const dev_addr       = 0x40;
		const LED0_ON_L 	 = 0x06;
		const LED0_ON_H 	 = 0x07;
		const LED0_OFF_L	 = 0x08;
		const LED0_OFF_H 	 = 0x09;
		var sendpwmRegOnL = function(num, on){
			return new Promise(function(resolve, reject) {
				i2c.writeByte(dev_addr, LED0_ON_L+4*num, genByteL(on), function(err){ 
					if (err){console.log("error is here");throw err;}resolve(1);});
			 });
		};
		var sendpwmRegOnH = function(num, on){
			return new Promise(function(resolve, reject) {
				i2c.writeByte(dev_addr, LED0_ON_H+(4*num), genByteH(on), function(err){ 
					if (err){throw err;}resolve(1);});
			 });
		};
		var sendpwmRegOffL = function(num, off){
			return new Promise(function(resolve, reject) {
				i2c.writeByte(dev_addr, LED0_OFF_L+(4*num), genByteL(off), function(err){ 
					if (err){throw err;}resolve(1);});
				
			 });
		};
		var sendpwmRegOffH = function(num, off){
			return new Promise(function(resolve, reject) {
				i2c.writeByte(dev_addr, LED0_OFF_H+(4*num), genByteH(off), function(err){ 
					if (err){throw err;}resolve(1);});
				
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
			sendpwmRegOnL(pin, 0)
				.then(sendpwmRegOnH(pin, 0))
				.then(sendpwmRegOffL(pin, 4095*(duty/100)))
				.then(sendpwmRegOffH(pin, 4095*(duty/100)));
			return true;
		}
		else{
			//console.log("input parameter in function <setDuty> is inccorect value or wrong type.");
			return false;
		}
	}
	setMICRO(pin, micro){
		var i2c = this.i2c;
		var freq = this.freq;
		var oneMicro = 0.000001*(freq *4096);
		var tick = Math.floor(micro*oneMicro);
		const dev_addr       = 0x40;
		const LED0_ON_L 	 = 0x06;
		const LED0_ON_H 	 = 0x07;
		const LED0_OFF_L	 = 0x08;
		const LED0_OFF_H 	 = 0x09;
		var sendpwmRegOnL = function(num, on){
			return new Promise(function(resolve, reject) {
				i2c.writeByte(dev_addr, LED0_ON_L+4*num, genByteL(on), function(err){ 
					if (err){throw err;}resolve(1);});
			 });
		};
		var sendpwmRegOnH = function(num, on){
			return new Promise(function(resolve, reject) {
				i2c.writeByte(dev_addr, LED0_ON_H+(4*num), genByteH(on), function(err){ 
					if (err){throw err;}resolve(1);});
			 });
			
		};
		var sendpwmRegOffL = function(num, off){
			return new Promise(function(resolve, reject) {
				i2c.writeByte(dev_addr, LED0_OFF_L+(4*num), genByteL(off), function(err){ 
					if (err){throw err;}resolve(1);});
				
			 });
		};
		var sendpwmRegOffH = function(num, off){
			return new Promise(function(resolve, reject) {
				i2c.writeByte(dev_addr, LED0_OFF_H+(4*num), genByteH(off), function(err){ 
					if (err){throw err;}resolve(1);});
				
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
		if(isNumber(micro) && tick>1  && tick<4096){
			sendpwmRegOnL(pin, 0)
				.then(sendpwmRegOnH(pin, 0))
				.then(sendpwmRegOffL(pin, tick))
				.then(sendpwmRegOffH(pin, tick));
			return true;
		}
		else {
			console.log("<setMicro> micro is not an integer or frequency|resolution is not supported")
			return false;
		}
	}
	setPWM(pin, on, off){
		var i2c = this.i2c;
		const dev_addr       = 0x40;
		const LED0_ON_L 	 = 0x06;
		const LED0_ON_H 	 = 0x07;
		const LED0_OFF_L	 = 0x08;
		const LED0_OFF_H 	 = 0x09;
		var sendpwmRegOnL = function(num, on){
			return new Promise(function(resolve, reject) {
				i2c.writeByte(dev_addr, LED0_ON_L+4*num, genByteL(on), function(err){ 
					if (err){throw err;}resolve(1);});
			 });
		};
		var sendpwmRegOnH = function(num, on){
			return new Promise(function(resolve, reject) {
				i2c.writeByte(dev_addr, LED0_ON_H+(4*num), genByteH(on), function(err){ 
					if (err){throw err;}resolve(1);});
			 });
			
		};
		var sendpwmRegOffL = function(num, off){
			return new Promise(function(resolve, reject) {
				i2c.writeByte(dev_addr, LED0_OFF_L+(4*num), genByteL(off), function(err){ 
					if (err){throw err;}resolve(1);});
				
			 });
		};
		var sendpwmRegOffH = function(num, off){
			return new Promise(function(resolve, reject) {
				i2c.writeByte(dev_addr, LED0_OFF_H+(4*num), genByteH(off), function(err){ 
					if (err){throw err;}resolve(1);});
				
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
		if(isNumber(on) && isNumber(off) && on<4096 && on>=0 && off<4096 && off>=0){
			sendpwmRegOnL(pin, on)
				.then(sendpwmRegOnH(pin, on))
				.then(sendpwmRegOffL(pin, off))
				.then(sendpwmRegOffH(pin, off));
			return true;
		}
		else {
			return false;
		}
	}
};
module.exports = PWMDriver;
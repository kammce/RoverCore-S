"use strict";

var Neuron = require('../Neuron');

class FanController extends Neuron {
	constructor(util) {
		super(util);
		this.name = util.name;
		this.feedback = util.feedback;
		this.log = util.log;
		this.idle_time = util.idle_timeout;
		this.i2c = util.i2c;
		this.model = util.model;

		this.TEMP = [];
		this.TEMPLIMIT = [];
		this.InitReg = [];
		this.tach1 = 0;
		this.tach2 = 0;
		this.tach3 = 0;
		this.tach4 = 0;
		var parent = this;
		parent.setRegister();
		//Memory stored in Model
		parent.model.registerMemory('Temperature Readings');
		parent.model.registerMemory('Fan Speed');
		parent.model.registerMemory('Limit Registers');
		var update = setInterval(function(){
			parent.updateTemp();
		},1000);
	}
	react(input) {
		/*Manual input?
		LEARN ABOUT ME AND FIX ME
		*/
		var name = input.name; //from mission control
		var data = input.data; //from mission control
		switch(name){
			case "writeTempLimits": {
				this.writeTempLimits(data.upper,data.lower);
				break;
			}
			case "editRegister": {
				this.editRegister(data.register, data.newvalue);
				break;
			}
			case "readRegister": {
				this.readRegister(data.register);
				break;
			}
			case "setRegister": {
				this.setRegister();
				break;
			}
			case "readFanSpeed": {
				this.readFanSpeed();
				break;
			}
			case "readTemp": {
				this.readTemp();
				break;
			}
		}

		this.log.output(`REACTING ${this.name}: `, input);
		this.feedback(this.name ,`REACTING ${this.name}: `, input);
	}
	halt() {
		this.log.output(`HALTING ${this.name}`);
		this.feedback(this.name ,`HALTING ${this.name}`);
	}
	resume() {
		this.log.output(`RESUMING ${this.name}`);
		this.feedback(this.name ,`RESUMING ${this.name}`);
	}
	idle() {
		this.log.output(`IDLING ${this.name}`);
		this.feedback(this.name ,`IDLING ${this.name}`);
	}
	decodeTEMP(temp) {
		if(temp>=128){
			return (temp - 256);
		} else{
			return temp;
		}
	}
	codeTEMP(value){
		if(value<0){
			return parseInt((value+256).toString(16),16);
		} else{
			return parseInt(value.toString(16),16);
		}
	}
	updateTemp() {
		var i2c = this.i2c;
		this.TEMP = [];
		//1-10 Temperature sensor, max temperature
		this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x20)));
		this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x21)));
		this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x22)));
		this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x23)));
		this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x24)));
		this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x25)));
		this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x26)));
		this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x27)));
		this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x28)));
		this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x29)));
		this.TEMP.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x78)));
		this.model.set('Temperature Readings', {
			Temperature1: this.TEMP[0],
			Temperature2: this.TEMP[1],
			Temperature3: this.TEMP[2],
			Temperature4: this.TEMP[3],
			Temperature5: this.TEMP[4]
		});
	return;
	}
	readTemp() {
		this.log.output(`${this.model.get('Temperature Readings').Temperature1}`);
		return this.TEMP;
	}
	writeTempLimits(UPPER_TEMP,LOWER_TEMP) {
		var UPPER = this.codeTEMP(UPPER_TEMP);
		var LOWER = this.codeTEMP(LOWER_TEMP);
		var i2c = this.i2c;
		this.TEMPLIMIT = [];
		i2c.writeByteSync(0x2C,0x45,UPPER);
		i2c.writeByteSync(0x2C,0x47,UPPER);
		i2c.writeByteSync(0x2C,0x49,UPPER);
		i2c.writeByteSync(0x2C,0x4B,UPPER);
		i2c.writeByteSync(0x2C,0x4D,UPPER);
		i2c.writeByteSync(0x2C,0x4F,UPPER);
		i2c.writeByteSync(0x2C,0x51,UPPER);
		i2c.writeByteSync(0x2C,0x53,UPPER);
		i2c.writeByteSync(0x2C,0x55,UPPER);
		i2c.writeByteSync(0x2C,0x57,UPPER);
		i2c.writeByteSync(0x2C,0x44,LOWER);
		i2c.writeByteSync(0x2C,0x46,LOWER);
		i2c.writeByteSync(0x2C,0x48,LOWER);
		i2c.writeByteSync(0x2C,0x4A,LOWER);
		i2c.writeByteSync(0x2C,0x4C,LOWER);
		i2c.writeByteSync(0x2C,0x4E,LOWER);
		i2c.writeByteSync(0x2C,0x50,LOWER);
		i2c.writeByteSync(0x2C,0x52,LOWER);
		i2c.writeByteSync(0x2C,0x54,LOWER);
		i2c.writeByteSync(0x2C,0x56,LOWER);
		//For Unittesting
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x45)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x47)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x49)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x4B)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x4D)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x4F)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x51)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x53)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x55)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x57)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x44)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x46)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x48)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x4A)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x4C)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x4E)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x50)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x52)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x54)));
		this.TEMPLIMIT.push(this.decodeTEMP(i2c.readByteSync(0x2C,0x56)));
		this.model.set('Temperature Limits', {
			Upper: UPPER,
			Lower: LOWER
		});
		return this.TEMPLIMIT;
	}
	 setRegister() {    //Settings/Enabling System for Automatic Control
		var i2c = this.i2c;
		this.InitReg = [];
		this.writeTempLimits(127,0); //Seting the upper and lower temperature limits
		i2c.writeByteSync(0x2C,0x68,0x60); //Sets Fan 1,2 to automatic control
		i2c.writeByteSync(0x2C,0x69,0x60); //Sets Fan 3,4 to automatic control
		/*
		Set which TMP05 is to control the fan with REG 0x7C and 0x7D, or set to hottest
		*/
		i2c.writeByteSync(0x2C,0x7C,0x00);
		i2c.writeByteSync(0x2C,0x7D,0x00);
		/*
		Set TEMPmin for each fan with REG 0x6E to 0x71
		*/
		i2c.writeByteSync(0x2C,0x6E,0x5A);
		i2c.writeByteSync(0x2C,0x6F,0x5A);
		i2c.writeByteSync(0x2C,0x70,0x5A);
		i2c.writeByteSync(0x2C,0x71,0x5A);
		/*
		Setting the PWM Min Duty Cycle to 50% for all four fans
		Fan will run at PWMmin when temp exceeds TEMPmin
		*/
		i2c.writeByteSync(0x2C,0x6A,0x80);
		i2c.writeByteSync(0x2C,0x6B,0x80);
		i2c.writeByteSync(0x2C,0x6C,0x80);
		i2c.writeByteSync(0x2C,0x6D,0x80);
		 /*
		Setting PWMmax, the maximum PWM duty cycle, to max by writing to registers 0x38 to 0x3B.
		*/
		i2c.writeByteSync(0x2C,0x38,0xFF);
		i2c.writeByteSync(0x2C,0x39,0xFF);
		i2c.writeByteSync(0x2C,0x3A,0xFF);
		i2c.writeByteSync(0x2C,0x3B,0xFF);
		/*
		Write to the STRT bit in Configuration Register 1 (0x40 Bit[0]) to start the ADT7470 monitoring cycle.
		Set Bit 7 in this register to 1 to enable the TMP05 start pulse.
		*/
		i2c.writeByteSync(0x2C,0x40,0x81);
		return this.InitReg;
	 }
	 editRegister(CMD_ADDR,value) {
		var i2c = this.i2c;
		i2c.writeByteSync(0x2C,CMD_ADDR,value);
		return i2c.readByteSync(0x2C,CMD_ADDR);
	 }
	 readRegister(CMD_ADDR) {
		var i2c = this.i2c;
		var reading = i2c.readByteSync(0x2C,CMD_ADDR);
		this.log.output('${CMD_ADDR}: ${this.TEMP[4]}');
		return reading;


	 }
	 readFanSpeed(){
		var i2c = this.i2c;

		//Reading high and low bytes for Tach
		var tach1low = i2c.readByteSync(0x2C, 0x2A);
		var tach1high = i2c.readByteSync(0x2C, 0x2B);
		var tach2low = i2c.readByteSync(0x2C, 0x2C);
		var tach2high = i2c.readByteSync(0x2C, 0x2D);
		var tach3low = i2c.readByteSync(0x2C, 0x2E);
		var tach3high = i2c.readByteSync(0x2C, 0x2F);
		var tach4low = i2c.readByteSync(0x2C, 0x30);
		var tach4high = i2c.readByteSync(0x2C, 0x31);

		//Converting to Binary String
		tach1low = Number(tach1low).toString(2);
		tach1high = Number(tach1high).toString(2);
		tach2low = Number(tach2low).toString(2);
		tach2high = Number(tach2high).toString(2);
		tach3low = Number(tach3low).toString(2);
		tach3high = Number(tach3high).toString(2);
		tach4low = Number(tach4low).toString(2);
		tach4high = Number(tach4high).toString(2);
		//above function does not store leading 0's

		//fills in leading 0's
		tach1low = "00000000".substr(tach1low.length) + tach1low;
		tach1high = "00000000".substr(tach1high.length) + tach1high;
		tach2low = "00000000".substr(tach2low.length) + tach2low;
		tach2high = "00000000".substr(tach2high.length) + tach2high;
		tach3low = "00000000".substr(tach3low.length) + tach3low;
		tach3high = "00000000".substr(tach3high.length) + tach3high;
		tach4low = "00000000".substr(tach4low.length) + tach4low;
		tach4high = "00000000".substr(tach4high.length) + tach4high;

		//combine high and low bytes
		this.tach1 = tach1high + tach1low;
		this.tach2 = tach2high + tach2low;
		this.tach3 = tach3high + tach3low;
		this.tach4 = tach4high + tach4low;

		//convert to decimal
		if(this.tach1 > "1000000000000000"){
		  this.tach1 = parseInt(this.tach1,2) - Math.pow(2,16);
		}
		else{
		  this.tach1 = parseInt(this.tach1,2);
		}
		if(this.tach2 > "1000000000000000"){
		  this.tach2 = parseInt(this.tach2,2) - Math.pow(2,16);
		}
		else{
		  this.tach2 = parseInt(this.tach2,2);
		}
		if(this.tach3 > "1000000000000000"){
		  this.tach3 = parseInt(this.tach3,2) - Math.pow(2,16);
		}
		else{
		  this.tach3 = parseInt(this.tach3,2);
		}
		if(this.tach4 > "1000000000000000"){
		  this.tach4 = parseInt(this.tach4,2) - Math.pow(2,16);
		}
		else{
		  this.tach4 = parseInt(this.tach4,2);
		}
		//tach1-4 reading complete set to model
		this.model.set('Fan Speed', {
			Fan1: this.tach1,
			Fan2: this.tach2,
			Fan3: this.tach3,
			Fan4: this.tach4
		});
		//output to console
		 this.log.output(`Fan Speed 1: ${this.tach1} 
			Fan Speed 2: ${this.tach2} 
			Fan Speed 3: ${this.tach3} 
			Fan Speed 4: ${this.tach4}`);
	 }
}

module.exports = FanController;

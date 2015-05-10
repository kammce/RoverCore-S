"use strict";
//Dynamixel Instruction Packet Format: 0xFF 0xFF ID LENGTH INSTRUCTION PARAMETER#1 ... PARAMETER#N CHECK_SUM
/*Includes*/
var SerialPort = require("serialport").SerialPort;
var Skeleton = require("../skeleton.js");

/*Functions/Prototypes*/
Arm.prototype = new Skeleton("Arm");
Arm.prototype.constructor = Arm;

var busy = false;//Handles signal traffic jams
var ready4next = true;
var ready = {
	base: false,
	shoulderL: false,
	shoulderR: false,
	elbow: false,
	wrist: false
}

function Arm (model_ref){
	/*When declaring a var inside the Arm class, i.e. here, the prototype functions cannot access them, for they need to be properties, not variables, so for the prototype function "moveMotor" to access 'defaulted', for example, defaulted needs to be declared as a property of function Arm, not a variable. Therefore, we use 'this.defaulted'*/
	this.model = model_ref;
	/*Globals*/
	this.serial = new SerialPort("/dev/ttyO1", {
	    baudrate: 57600,
	    //databits:8,
	    //parity: 'none'
	});
	this.defaulted = false;

	/*Setup Action call*/
	this.actionBuffer = new Buffer(6);
		var index = 0; //index iterator
		var checksum = 0xFE + 0x02 + 0x05;
		this.actionBuffer[index++] = 0xFF; //ÿ Signature Byte Char
		this.actionBuffer[index++] = 0xFF; //ÿ Signature Byte Char
		this.actionBuffer[index++] = 0xFE; // ID Byte Char
		this.actionBuffer[index++] = 0x02; //packet length
		this.actionBuffer[index++] = 0x05; //instruction byte
		this.actionBuffer[index++] = ~checksum & 0xFF;
	/*Setup Data Schema*/
	this.schema = { //format for data being passed to arm.prototype.handle(data);
		"type" : "object",
		"properties" : {
			"base" : "Number", //Degree value, from 0 to 360
			//"shoulderL" : "Number", //Degree value, from 0 to 360
			"shoulderR" : "Number", //Degree value, from 0 to 360
			"elbow" : "Number", //Degree value, from 0 to 360
			"wrist" : "Number", //Degree value, from 0 to 360
			"speed" : "Number" //Value of motor RPM, expects value from 1 to 117
			// "setID" : "Number" //For initial setup only. Used to set the ids of different servos
		}
	}

	//Switch Activator Codes
	this.turn = {ON: 0x01, OFF: 0x00};
	//Instruction Codes
	this.operation = {PING: 0x01, READ: 0x02, WRITE: 0x03, REGWRITE: 0x04, ACTION:0x05};
	//Motor IDs **NOTE:ALL == broadcast to all motors for execution
	this.id = {ALL: 0xFE, BASE: 0x00, LEFTSHOULDER: 0x01, RIGHTSHOULDER: 0x02, ELBOW: 0x03, WRIST: 0x04};
	this.testing = "hello world";
	//Servo Register Addresses **NOTE:TORQUE enables motor movement
	this.edit = {POSITION: 0x1E, SPEED: 0x20, CCW: 0x08, CW: 0x06, TORQUE: 0x18, LED: 0x19};

	/*Setup command standards (saves processing time)*/
	this.standards = {
		write: {instruction: this.operation.WRITE, register: this.edit.POSITION},
		regwrite: {instruction: this.operation.REGWRITE, register: this.edit.POSITION},
	}
	/*Initiate Serialport*/
		this.serial.on('open', function(err) {
		    if(err){
		    	console.log(err);
		    }
		    else{
		    	// console.log('>>SerialPort is Open<<'); //For Debugging
		    }
		});
		this.serial.on('err', function(err){
			console.log(err);
		});
}


Arm.prototype.handle = function(input){ //Input is an object, with members outlined when sending control signals via mission-control-test.html
	//This handle function Sends Commands to Dynamixel MX-64
	if(this.defaulted == false){
		console.log("Enabling Torque");
		this.writePacket(this.operation.WRITE, this.id.ALL, this.edit.TORQUE, this.turn.ON);
		this.writePacket(this.operation.WRITE, this.id.ALL, this.edit.SPEED, 0x48,0x00); //Set movement speed to 15 rpm, 300 in decimal
		this.defaulted = true;
	}
	if(!busy /*&& ready4next*/){
		busy = true;
		ready4next = false;
		if(typeof input.shoulderL != "undefined"){
			var pos = input.shoulderL;
			if(pos < 45){pos = 45;}	else if (pos > 220){	pos = 220;} //angle limiter
			var newval = (pos - 300) * (-1);
			this.moveMotor(this.id.LEFTSHOULDER, pos);
			this.moveMotor(this.id.RIGHTSHOULDER, newval);
			if(ready.shoulderL && ready.shoulderR){
				this.callAction(this.actionBuffer);
			}
		}
		if(typeof input.base != "undefined"){
			this.moveMotorMX(this.id.BASE, input.base);
		}
		if(typeof input.elbow != "undefined"){
			var pos = input.elbow;
			if(pos < 70){pos = 70;} else if (pos > 220){pos = 220;} //angle limiter
			this.moveMotor(this.id.ELBOW, pos);
		}
		if(typeof input.wrist != "undefined"){
			var pos = input.wrist;
			if(pos < 120){pos = 120;} else if (pos > 240){pos = 240;} //angle limiter
			this.moveMotor(this.id.WRIST, input.wrist);
		}
	}
	
	// if(ready4next = false){
	// 	this.callAction(this.actionBuffer);
	// }
};

Arm.prototype.moveMotor = function(ID, number) { //Info is an object, with members outlined when sending control signals via arm interface html
	var hexdeg = (number/300) * 1023;/*(number/360) * 4095;*/ //for MX series: 360 and 4095. for RX series: 300 and 1023
	if(hexdeg > 1023){
		hexdeg = 1023;
	}
	if(hexdeg < 0){
		hexdeg = 0;
	}
	var high = (hexdeg >> 8) & 0xFF; //grab the highbyte
	var low = hexdeg & 0xFF; //format hexdeg to have only the lowbyte
	//console.log("H:" + high + "  L:" + low);
	this.standards.regwrite.motorID = ID;
	this.standards.regwrite.lowbyte = low;
	this.standards.regwrite.highbyte = high;
	this.writePacket(this.standards.regwrite);
};

Arm.prototype.moveMotorMX = function(ID, number) { //Info is an object, with members outlined when sending control signals via arm interface html
	// console.log("Enabling Torque");
	// writePacket(WRITE, ALL, TORQUE, ON); //highbyte not used, set to default 0xFFFF
	var hexdeg = (number/360) * 4095; //for MX series: 360 and 4095. for RX series: 300 and 1023
	if(hexdeg > 4095){
		hexdeg = 4095;
	}
	if(hexdeg < 0){
		hexdeg = 0;
	}
	var high = (hexdeg >> 8) & 0xFF; //grab the highbyte
	var low = hexdeg & 0xFF; //format hexdeg to have only the lowbyte
	//console.log("H:" + high + "  L:" + low);
	this.standards.regwrite.motorID = ID;
	this.standards.regwrite.lowbyte = low;
	this.standards.regwrite.highbyte = high;
	this.writePacket(this.standards.regwrite);
};

Arm.prototype.setSpeed = function(ID, number) { //Info is an object, with members outlined when sending control signals via arm interface html
	var hexdeg = (number/360) * 4095;
	if(hexdeg > 4095){
		hexdeg = 4095;
	}
	if(hexdeg < 0){
		hexdeg = 0;
	}
	var high = (hexdeg >> 8) & 0xFF; //grab the highbyte
	var low = hexdeg & 0xFF; //format hexdeg to have only the lowbyte
	//console.log("H:" + high + "  L:" + low);
	this.writePacket(this.operation.WRITE, ID, this.edit.SPEED, low, high);
};

Arm.prototype.callAction = function(input){
	this.serial.write(input, function(ptr){
		busy = false;
		console.log("No longer busy");
		ready.shoulderL = false;
		ready.shoulderR = false;
		setTimeout(function(){
			ready4next = true;
		}, 100);
	});
}

Arm.prototype.writePacket = function(obj){ //parameters==object with motor IDs and values, use member finding to determine what to do
	console.log("Controlling Motor " + obj.motorID); //For Debugging
	var length = 0;
	var command = new Buffer(10); //Command buffer object. Sending Strings caused problems, resulting in data corruption
	if(typeof obj.highbyte == "undefined") { //determine length through undefined parameter "highbyte"
		length = 2+2;
	} else {
		length = 3+2;
	}	
	
	for(var i = 0; i < command.length; i++) { //clear the command buffer
		command[i] = 0x00;
	};

	var i = 0;
	var checksum = 0;
	/*Put the control packet together*/
	/*Method 2: Send all at once after compiling elements together into buffer*/
	command[i++] = 0xFF; //ÿ Signature Byte Char
	command[i++] = 0xFF; //ÿ Signature Byte Char
	command[i++] = obj.motorID; // ID Byte Char
	command[i++] = length; //packet length
	command[i++] = obj.instruction; //instruction byte
	command[i++] = obj.register; //first parameter will always be the register address
	command[i++] = obj.lowbyte; //value/lowbyte, depending on the function call
	checksum = parseInt(obj.motorID) + parseInt(length) + parseInt(obj.instruction) + parseInt(obj.register) + parseInt(obj.lowbyte); //Assumes command is not PING, which uses neither lowbyte nor highbyte
	if(typeof obj.highbyte != "undefined"){
		command[i++] = obj.highbyte; //highbyte
		checksum += parseInt(obj.highbyte);
	}
	command[i++] = ~checksum & 0xFF; //Invert bits with Not bit operator and shave off high bytes, leaving only the lowest byte to determine checksum length
	// command += "-"; //For use in testing with Arduino Feedback
	/*Send control packet and prep for reuse*/
	var ptr = this;
	this.serial.write(command, function(ptr) {
		if(obj.motorID == 0x01){
			ready.shoulderL = true;
		}
		else if(obj.motorID == 0x02){
			ready.shoulderR = true;
		}
	});
	//console.log(">>Sent " + typeof command +  " Ctrl Signal To " + motorID + ":" + command); //For Debugging
}

Arm.prototype.resume = function() {};
Arm.prototype.halt = function(data) {};

Arm.prototype.print = function(){ //For Debugging
	console.log("Hello " + this.model_ref);
}

/*Main, For Debugging*/
// var a = new Arm(); //For Debugging: Object initialization
// var interval = 0;

// setInterval(function(){
// 	if(interval = 0){
// 		a.handle({base: 360, shoulderL: 180, shoulderR: 30, elbow: 0, wrist: 0}); //For Debugging: For the member function
// 		interval = 1;
// 	}
// 	else if(interval = 1){
// 		a.handle({base: 360, shoulderL: 0, shoulderR: 30, elbow: 0, wrist: 0}); /*//For Debugging: For the member function*/
// 		interval = 0;
// 	}
// }, 1000);

module.exports = exports = Arm;

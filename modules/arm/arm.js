"use strict";
//Dynamixel Instruction Packet Format: 0xFF 0xFF ID LENGTH INSTRUCTION PARAMETER#1 ... PARAMETER#N CHECK_SUM
/*Includes*/
var SerialPort = require("serialport").SerialPort;
var Skeleton = require("../skeleton.js");

/*Globals*/
var serial = new SerialPort("/dev/ttyO2", {
    baudrate: 57600,
    //databits:8,
    //parity: 'none'
});
var defaulted = false;
// console.log("Hello, starting..."); //For Debugging
var schema = { //format for data being passed to arm.prototype.handle(data);
	"type" : "object",
	"properties" : {
		"base" : "Number", //Degree value, from 0 to 360
		"shoulderL" : "Number", //Degree value, from 0 to 360
		"shoulderR" : "Number", //Degree value, from 0 to 360
		"elbow" : "Number", //Degree value, from 0 to 360
		"wrist" : "Number", //Degree value, from 0 to 360
		"speed" : "Number" //Value of motor RPM, expects value from 1 to 117
	}
}

//Value Codes
var ON = 0x01,
    OFF = 0x00;
//Instruction Codes
var PING = 0X01,
    READ = 0x02,
    WRITE = 0x03,
    REGWRITE = 0X04,
    ACTION = 0X05;
//Motor IDs **NOTE:ALL == broadcast to all motors for execution
var ALL = 0xFE,
    BASE = 0x00,
    LEFTSHOULDER = 0x01,
    RIGHTSHOULDER = 0x02,
    ELBOW = 0x03,
    WRIST = 0x04;
//Servo Register Addresses
var POSITION = 0x1E,
    SPEED = 0x20,
    CCW = 0x08,
    CW = 0x06,
    TORQUE = 0x18, //Used to enable motor movement
    LED = 0x19;

/*Initiate Serialport*/
	serial.on('open', function(err) {
	    if(err){
	    	console.log(err);
	    }
	    else{
	    	console.log('>>SerialPort is Open<<'); //For Debugging
	    	// moveMotor(input[2]);
	    	// serial.close();
	    }
	});
	serial.on('err', function(err){
		console.log(err);
	});

/*Functions/Prototypes*/
Arm.prototype = new Skeleton("Arm");
Arm.prototype.constructor = Arm;

function Arm (model_ref){
	this.model = model_ref;
}


Arm.prototype.handle = function(input){ //Info is an object, with members outlined when sending control signals via mission-control-test.html
	//This handle function Sends Commands to Dynamixel MX-64
	if(defaulted == false){
		console.log("Enabling Torque");
		control(WRITE, ALL, TORQUE, ON);
		defaulted = true;
	}
	if(input.base != undefined){
		moveMotor(BASE, input.base);
	}
	if(input.shoulderL != undefined){
		moveMotor(LEFTSHOULDER, input.shoulderL);
	}
	if(input.shoulderR != undefined){
		moveMotor(RIGHTSHOULDER, input.shoulderR);
	}
	if(input.elbow != undefined){
		moveMotor(ELBOW, input.elbow);
	}
	if(input.wrist != undefined){
		moveMotor(WRIST, input.wrist);
	}
	// if(input.speed != undefined){
	// 	setSpeed(ALL, input.speed);
	// }
};

function moveMotor(ID, number) { //Info is an object, with members outlined when sending control signals via arm interface html
	// console.log("Enabling Torque");
	// writePacket(WRITE, ALL, TORQUE, ON); //highbyte not used, set to default 0xFFFF
	var hexdeg = (number/360) * 4095;
	if(hexdeg > 4095){
		hexdeg = 4095;
	}
	if(hexdeg < 0){
		hexdeg = 0;
	}
	var high = (hexdeg >> 8) & 0xFF; //grab the highbyte
	var low = hexdeg & 0xFF; //format hexdeg to have only the lowbyte
	console.log("H:" + high + "  L:" + low);
	writePacket(WRITE, ID, POSITION, low, high);
};

function setSpeed(ID, number) { //Info is an object, with members outlined when sending control signals via arm interface html
	var hexdeg = (number/360) * 4095;
	if(hexdeg > 4095){
		hexdeg = 4095;
	}
	if(hexdeg < 0){
		hexdeg = 0;
	}
	var high = (hexdeg >> 8) & 0xFF; //grab the highbyte
	var low = hexdeg & 0xFF; //format hexdeg to have only the lowbyte
	console.log("H:" + high + "  L:" + low);
	writePacket(WRITE, ID, SPEED, low, high);
};

function writePacket(instruction, motorID, register, lowbyte, highbyte){ //parameters==object with motor IDs and values, use member finding to determine what to do
	console.log("Controlling Motor " + motorID);
	var length = 0;
	if(typeof highbyte == "undefined") { //determine length through undefined parameter "highbyte"
		length = 2+2;
	} else {
		length = 3+2;
	}
 //Sets highbyte to a default of 65535 unless otherwise specified (i.e. position commands require low and highbyte whereas torque and led commands require only one value byte, making highbyte unused)
	var command = new Buffer(10); //Command buffer object. Sending Strings caused problems, resulting in data corruption
	
	for (var i = 0; i < command.length; i++) { //clear the command buffer
		command[i] = 0x00;
	};

	var i = 0;
	var checksum = 0;
	/*Put the control packet together*/
	/*Method 2: Send all at once*/
	command[i++] = 0xFF; //ÿ Signature Byte Char
	command[i++] = 0xFF; //ÿ Signature Byte Char
	command[i++] = motorID; // ID Byte Char
	command[i++] = length; //packet length
	command[i++] = instruction; //instruction byte
	command[i++] = register; //first parameter will always be the register address
	command[i++] = lowbyte; //value/lowbyte, depending on the function call
	checksum = parseInt(motorID) + parseInt(length) + parseInt(instruction) + parseInt(register) + parseInt(lowbyte); //Assumes command is not PING, which uses neither lowbyte nor highbyte
	if(typeof highbyte != "undefined"){
		command[i++] = highbyte; //highbyte
		checksum += parseInt(highbyte);
	}
	command[i++] = ~checksum & 0xFF; //Invert bits with Not bit operator and shave off high bytes, leaving only the lowest byte to determine checksum length
	// command += "-"; //For use in testing with Arduino Feedback
	/*Send control packet and prep for reuse*/
	serial.write(command, function() {});
	console.log(">>Sent " + typeof command +  " Ctrl Signal To " + motorID + ":" + command); //For Debugging
}

Arm.prototype.resume = function() {};
Arm.prototype.halt = function(data) {};

module.exports = exports = Arm;
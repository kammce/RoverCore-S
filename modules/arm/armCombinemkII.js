"use strict";
//Dynamixel Instruction Packet Format: 0xFF 0xFF ID LENGTH INSTRUCTION PARAMETER#1 ... PARAMETER#N CHECK_SUM
//MX-64AR VCC=12V, LC Electronics rs485 Uart converter VCC=5V
/*Includes*/
var SerialPort = require("serialport").SerialPort;
var Skeleton = require("../skeleton.js");

/*Globals*/
var inbox = "";
var defaultSet = false;
var iterations = 0;
/*SerialPort Communication*/
/*For use in actual rover, controlled thru BeagleBone Black*/
// var serial = new SERIALPORT.SerialPort("for/path/to/uart/device,/See_READMEarm.txt", {
//     baudrate: 57600
// });
/*For use in local system testing; Read/Write stream to USB*/
var serial = new SerialPort("/dev/ttyACM1", {
    baudrate: 57600
});
//Value Codes
var ON = 1,
	OFF = 0;
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
//format for data being passed to arm.prototype.handle(data);
var schema = {
    "type": "object",
    "properties": {
    	// "enable": "Number" //Bool to turn motor torque on or off. To be implemented in GUI later...
        "base": "Number", //Degree value, from 0 to 360
        "shoulderL": "Number", //Degree value, from 0 to 360
        "shoulderR": "Number", //Degree value, from 0 to 360
        "elbow": "Number", //Degree value, from 0 to 360
        "wrist": "Number", //Degree value, from 0 to 360
        "speed": "Number" //Value of motor RPM, expects value from 1 to 117
    }
}

/*Functions/Prototypes*/
Arm.prototype = new Skeleton("Arm");
Arm.prototype.constructor = Arm;

function Arm(model_ref) {
    this.model = model_ref;
}

/*Initiate Serialport*/
serial.on('open', function() {
    console.log('>>SerialPort is Open<<'); //For Debugging
    // serial.on('data', function(data) {
    //     // inbox += data.toString('ascii'); //For Debugging
    //     inbox += data.toString('utf8'); //In ASCII format, save what is received in a buffer
    //     if(inbox.indexOf("-") != -1) { //When you find the end of line char, print out the buffer
    //     	console.log(">>" + typeof data + " Response:" + inbox); //For debugging. Output the response from device to console
    //     	inbox = ""; //Once buffer is sent out, clear it
    //     }
    //     // inbox = data.toString('utf8');
    //     // console.log(">>" + typeof data + " Response:" + data);
    // });
});

Arm.prototype.handle = function(input) { //Info is an object, with members outlined when sending control signals via arm interface html
	if(defaultSet == false && iterations < 1){ //Default: initiate motor movement
		control(WRITE, ALL, TORQUE, ON); //highbyte not used, set to default 0xFFFF
		iterations++;
	}
	// if(input.base != undefined){
	// 	var hexdeg = motorAngle(input.base); //grab the initial hex val of the degree position
	// 	var high = hexdeg >> 8; //grab the highbyte
	// 	var low = hexdeg & 0xFF //format hexdeg to have only the lowbyte
	// 	control(WRITE, BASE, POSITION, low, high);
	// }
	if(input.shoulderL != undefined){
		var hexdeg = motorAngle(input.shoulderL); //grab the initial hex val of the degree position
		var high = hexdeg >> 8; //grab the highbyte
		var low = hexdeg & 0xFF //format hexdeg to have only the lowbyte
		control(WRITE, LEFTSHOULDER, POSITION, low, high);
	}
	// if(input.shoulderR != undefined){
	// 	var hexdeg = motorAngle(input.shoulderR); //grab the initial hex val of the degree position
	// 	var high = hexdeg >> 8; //grab the highbyte
	// 	var low = hexdeg & 0xFF //format hexdeg to have only the lowbyte
	// 	control(WRITE, RIGHTSHOULDER, POSITION, low, high);
	// }
	// if(input.elbow != undefined){
	// 	var hexdeg = motorAngle(input.elbow); //grab the initial hex val of the degree position
	// 	var high = hexdeg >> 8; //grab the highbyte
	// 	var low = hexdeg & 0xFF //format hexdeg to have only the lowbyte
	// 	control(WRITE, ELBOW, POSITION, low, high);
	// }
	// if(input.wrist != undefined){
	// 	var hexdeg = motorAngle(input.wrist); //grab the initial hex val of the degree position
	// 	var high = hexdeg >> 8; //grab the highbyte
	// 	var low = hexdeg & 0xFF //format hexdeg to have only the lowbyte
	// 	control(WRITE, WRIST, POSITION, low, high);
	// }
	if(input.speed != undefined){
		var hexdeg = motorSpeed(input.speed); //grab the initial hex val of the degree position
		var high = hexdeg >> 8; //grab the highbyte
		var low = hexdeg & 0xFF //format hexdeg to have only the lowbyte
		control(WRITE, ALL, SPEED, low, high);
	}
};

function control(instruction, motorID, register, lowbyte, highbyte){ //parameters==object with motor IDs and values, use member finding to determine what to do
	highbyte = highbyte || 0xFFFF; //Sets highbyte to a default of 65535 unless otherwise specified (i.e. position commands require low and highbyte whereas torque and led commands require only one value byte, making highbyte unused)
	var command = ""; //Command string. Servos read bytes; Strings are valid ways to send them
	var length = 0;
	var checksum = 0;
	if(highbyte != 0xFFFF){ //If the highbyte value was specified, i.e. used in function call
		length = 3+2; //(register address, lowbyte, highbyte) + (instruction byte, checksum)
	}
	else{
		length = 2+2; //(register address, value byte) + (instruction byte, checksum)
	}

	/*Put the control packet together*/
	command += String.fromCharCode(0xFF); //ÿ Signature Byte Char
	command += String.fromCharCode(0xFF); //ÿ Signature Byte Char
	command += String.fromCharCode(motorID); // ID Byte Char
	command += String.fromCharCode(length); //packet length
	command += String.fromCharCode(instruction); //instruction byte
	command += String.fromCharCode(register); //first parameter will always be the register address
	command += String.fromCharCode(lowbyte); //value/lowbyte, depending on the function call
	checksum = parseInt(motorID) + parseInt(length) + parseInt(instruction) + parseInt(register) + parseInt(lowbyte); //Assumes command is not PING, which uses neither lowbyte nor highbyte
	if(highbyte != 0xFFFF){
		command += String.fromCharCode(highbyte); //highbyte
		checksum += parseInt(highbyte);
	}
	command += String.fromCharCode(~checksum & 0xFF); //Invert bits with Not bit operator and shave off high bytes, leaving only the lowest byte to determine chekcsum length
	command += "-"; //For use in testing with Arduino Feedback
	/*Send control packet and prep for reuse*/
	serial.write(command, function() {});
	console.log(">>Sent Control Signal: " + command); //For Debugging
	command = ""; //clear command string for reuse
}

function highNum (mynumber){ //Converts 10-15 to their hexadecimal digit counterparts
	if(mynumber == 15){
		return "F";
	}
	else if(mynumber == 14){
		return "E";
	}
	else if(mynumber == 13){
		return "D";
	}
	else if(mynumber == 12){
		return "C";
	}
	else if(mynumber == 11){
		return "B";
	}
	else if(mynumber == 10){
		return "A";
	}
	else{
		return "[err]";
	}
}

function motorSpeed(speedInput){ //speedInput expected to be a number between 0 - 117.07 rpm
	//Dynamixel Instruction Packet Format: 0xFF 0xFF ID LENGTH INSTRUCTION PARAMETER#1 ... PARAMETER#N CHECK_SUM
	var remainders = [];
	var hexed = false;
	var g = 1;

	/*Main*/
	var maxSpeed = (speedInput/117.07) * 1023; //with resolution divider = 1, 0 = 0 degrees, and 4095 = 360 degrees.
	var rounded = maxSpeed.toFixed(); //Rounds number to zero decimal places
	if(rounded > 1023){	// limits speed between 0.114 and 117.07 rpm
		rounded = 1023;
	}
	while(hexed == false){ //While hexadecimal number is incomplete:
		remainders[g] = rounded % 16; //remainders of this division are said to be the hexadecimal digits (see converting decimal to hexadecimal)
		rounded = (rounded - remainders[g])/16;
		if(rounded == 0){
			remainders.push('0x');
			hexed = true;
		}
		if(remainders[g] > 9){
			var temp = remainders[g];
			remainders[g] = highNum(temp);
		}
		g++;
	}

	//Yields the digits of the hexadecimal number corresponding to the Dynamixel Speed number map (0.114 rpm increments).
	var end = remainders.reverse().join().replace(/,/g, '');
	var motorSpeed_Hex = parseInt(end);
	
	//For Debugging...
	// console.log("Dynamixel Hexadecimal Signal: " + end); //Converting the hexadecimal number to decimal yields the number of Dynamixel degree increments to yield your desired degree.
	// console.log("Decimal Value: " + parseInt(end));
	// console.log("<motorSpeed Hex: " + end + " motorSpeed: " + motorSpeed_Hex + ">"); //motorSpeed Hex For Debugging

	return parseInt(end); //returns int value
}

function motorAngle(degreeInput){ //degreeInput expected to be a number between 0 - 360 degrees
	//Dynamixel Instruction Packet Format: 0xFF 0xFF ID LENGTH INSTRUCTION PARAMETER#1 ... PARAMETER#N CHECK_SUM
	var remainders = [];
	var hexed = false;
	var y = 1;

	/*Main*/
	var goalPos = (degreeInput/360) * 4095; //with resolution divider = 1, 0 = 0 degrees, and 4095 = 360 degrees.
	var rounded = goalPos.toFixed(); //Rounds number to zero decimal places
	if(rounded > 4095){	// limits position between 0 and 360
		rounded = 4095;
	}
	while(hexed == false){ //While hexadecimal number is incomplete:
		remainders[y] = rounded % 16; //remainders of this division are said to be the hexadecimal digits (see converting decimal to hexadecimal)
		rounded = (rounded - remainders[y])/16;
		if(rounded == 0){
			remainders.push('0x');
			hexed = true;
		}
		if(remainders[y] > 9){
			var temp = remainders[y];
			remainders[y] = highNum(temp);
		}
		y++;
	}
	//Yields the digits of the hexadecimal number corresponding to the Dynamixel Angle number map (0.088 deg increments).
	var end = remainders.reverse().join().replace(/,/g, '');
	var motorAngle_Hex = parseInt(end);
	
	//For Debugging...
	// console.log("Dynamixel Hexadecimal Signal: " + end); //Converting the hexadecimal number to decimal yields the number of Dynamixel degree increments to yield your desired degree.
	// console.log("Decimal Value: " + parseInt(end));
	// console.log("<motorAngle Hex: " + end + " motorAngle: " + motorAngle_Hex + ">"); //motorAngle Hex For Debugging

	return parseInt(end); //returns int value
}

Arm.prototype.resume = function() {};
Arm.prototype.halt = function(data) {};

module.exports = exports = Arm;
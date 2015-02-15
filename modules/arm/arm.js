"use strict";
//Dynamixel Instruction Packet Format: 0xFF 0xFF ID LENGTH INSTRUCTION PARAMETER#1 ... PARAMETER#N CHECK_SUM
/*Includes*/
var SerialPort = require("serialport").SerialPort;
var servoPos = require("./writePacket.js");
var Skeleton = require("../skeleton.js");

/*Globals*/
// var serial = new SERIALPORT.SerialPort("for/path/to/uart/device,/See_READMEarm.txt", { baudrate: 9600 }); //For use in actual rover
var serial = new SerialPort("/dev/ttyACM0", { baudrate: 9600 } ); //For use in local system testing; Read/Write stream to USB
var goalPosition = 0x1E, movingSpeed = 0x20, ccwAngleLimit = 0x08, cwAngleLimit = 0x06; //Motor Control Table Addresses
var baseID = 0x00, shoulderLID = 0x01, shoulderRID = 0x02, elbowID = 0x03, wristID = 0x04, broadcastID = 0xFE; //Motor ID Tags **NOTE:broadcastID == broadcast to all motors
var command = [];
var inbox = ""; //data buffer for recieving responses from device
var i = 0;
var schema = { //format for data being passed to arm.prototype.handle(data);
	"type" : "object",
	"properties" : {
		"base" : {
			"type" : "Number", //Degree value, from 0 to 360
		},
		"shoulderL" : {
			"type" : "Number", //Degree value, from 0 to 360
		},
		"shoulderR" : {
			"type" : "Number", //Degree value, from 0 to 360
		},
		"elbow" : {
			"type" : "Number", //Degree value, from 0 to 360
		},
		"wrist" : {
			"type" : "Number", //Degree value, from 0 to 360
		},
		"speed" : {
			"type" : "Number", //Motor RPM value, from 1 to 117
		},
	}
}

/*Functions/Prototypes*/
Arm.prototype = new Skeleton("Arm");
Arm.prototype.constructor = Arm;

function Arm (model_ref){
	this.model = model_ref;
}

serial.on('open', function(){
	console.log('>>SerialPort is Open<<'); //For Debugging
	serial.on('data', function(data) {
		inbox += data.toString('ascii'); //In ASCII format, save what is received in a buffer
		if(inbox.indexOf("-") != -1) { //When you find the end of line char, print out the buffer
			console.log(">>Response: " + inbox.replace("-", " ")); //For debugging. Output the response from device to console
			inbox = ""; //Once buffer is sent out, clear it
		}
	});
});

Arm.prototype.handle = function(data){ //Data is an object, with members outlined when sending control signals via mission-control-test.html
	//This handle function Sends Commands to Dynamixel MX-64
		for(var i = 0; i < 9; i++){ //Loop to send packets
			//Send packets defining initial motor restraints
			if(i < 4){
				command = servoPos(180,i+1,ccwAngleLimit); 
				console.log("	<Set Motor ccW Limit: " + command + ">");
			}
			else if(i == 4 && data.base != undefined){
				command = servoPos(data.base,baseID,goalPosition);
				console.log("	<Set Motor Position: " + command + ">");
			}
			else if(i == 5 && data.shoulderL != undefined){
				command = servoPos(data.shoulderL,shoulderLID,goalPosition);
				console.log("	<Set Motor Position: " + command + ">");
			}
			else if(i == 6 && data.shoulderR != undefined){
				command = servoPos(data.shoulderR,shoulderRID,goalPosition);
				console.log("	<Set Motor Position: " + command + ">");
			}
			else if(i == 7 && data.elbow != undefined){
				command = servoPos(data.elbow,elbowID,goalPosition);
				console.log("	<Set Motor Position: " + command + ">");
			}
			else if(i == 8 && data.wrist != undefined){
				command = servoPos(data.wrist,wristID,goalPosition);
				console.log("	<Set Motor Position: " + command + ">");
			}
			else if(i == 9 && data.speed != undefined){ //All motors have same speed
				command = servoPos(data.speed,broadcastID,movingSpeed);
				console.log("	<Set Motor Speed: " + command + ">");
			}
			serial.write(command+"-", function(){ //Send command buffer to device
				serial.drain(function(){ //Wait for buffer to be fully sent, and then do the stuff below...
					command = [];
				});
			});
		}

		// console.log("Waiting..."); //For debugging
		//All Motor's default is clockwise limit:0x0000, counterclockwise limit:0x0FFF
	// }
};

Arm.prototype.resume = function() {};
Arm.prototype.halt = function(data) {};

module.exports = exports = Arm;
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
var motorValuesSet = false;
var inbox = ""; //data buffer for recieving responses from device
var defaultSet = false;
var i = 0;
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

/*Functions/Prototypes*/
Arm.prototype = new Skeleton("Arm");
Arm.prototype.constructor = Arm;

function Arm (model_ref){
	this.model = model_ref;
}

serial.on('open', function(){
	console.log('>>SerialPort is Open<<'); //For Debugging
	/*Data watcher is for Debugging*/
	serial.on('data', function(data) {
		// inbox += data.toString('ascii');
		inbox += data.toString('utf8'); //In ASCII format, save what is received in a buffer
		if(inbox.indexOf("-") != -1) { //When you find the end of line char, print out the buffer
			console.log(">>Response: " + inbox); //For debugging. Output the response from device to console
			inbox = ""; //Once buffer is sent out, clear it
		}
	});
});

Arm.prototype.handle = function(info){ //Info is an object, with members outlined when sending control signals via mission-control-test.html
	//This handle function Sends Commands to Dynamixel MX-64
	if(info){
		motorValuesSet = false;
	}
	if(motorValuesSet == false){ 
		if(defaultSet == false){/*For Debugging*/
				// serial.write("Communication Initiated-"); //For Debugging. Note there may be delay in the startup of serialport
		}

		//Loop to send packets
		for(var i = 0; i < 10; i++){
			if(i >= 4){
				defaultSet = true; //Once the initial motor restraints are set, don't reset them.
			}
			//Send packets defining initial motor restraints
			if(i < 4 && defaultSet == false){
				command = servoPos(180,i+1,ccwAngleLimit); 
				console.log("	<Set Motor ccW Limit: " + command + ">");
			}
			else if(i == 4 && info.base != undefined){
				command = servoPos(info.base,baseID,goalPosition);
				console.log("	<Set Motor Position: " + command + ">");
			}
			else if(i == 5 && info.shoulderL != undefined){
				command = servoPos(info.shoulderL,shoulderLID,goalPosition);
				console.log("	<Set Motor Position: " + command + ">");
			}
			else if(i == 6 && info.shoulderR != undefined){
				command = servoPos(info.shoulderR,shoulderRID,goalPosition);
				console.log("	<Set Motor Position: " + command + ">");
			}
			else if(i == 7 && info.elbow != undefined){
				command = servoPos(info.elbow,elbowID,goalPosition);
				console.log("	<Set Motor Position: " + command + ">");
			}
			else if(i == 8 && info.wrist != undefined){
				command = servoPos(info.wrist,wristID,goalPosition);
				console.log("	<Set Motor Position: " + command + ">");
			}
			else if(i == 9 && info.speed != undefined){ //All motors have same speed
				command = servoPos(info.speed,broadcastID,movingSpeed);
				console.log("	<Set Motor Speed: " + command + ">");
			}
			//Send command buffer to device
			serial.write(command + "-", function(){
				serial.drain(function(){ //Wait for buffer to be fully sent, and then do the stuff below...
					command = [];
					if(i >= 9){ //Once all motor values are sent...
						motorValuesSet = true;
					}
				});
			});
		}

		//For debugging
		// console.log("Waiting..."); 
		//All Motor's default is cw:0x0000, ccw:0x0FFF
	}
};

Arm.prototype.resume = function() {};
Arm.prototype.halt = function(data) {};

module.exports = exports = Arm;
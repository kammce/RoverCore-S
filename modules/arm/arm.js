"use strict";
//Dynamixel Instruction Packet Format: 0xFF 0xFF ID LENGTH INSTRUCTION PARAMETER#1 ... PARAMETER#N CHECK_SUM
//default baud rate of servo is 9600 bps(baud)
//For robotic arm, we'll probably have all motors except the base motor be in joint-mode, because they are joints, not meant to rotate at a limited angle

/*Globals*/

var servoPos = require("/home/rj/repos/bitbucket/rovercore/modules/arm/writePacket.js");
var Skeleton = require("../skeleton.js");
var goalPosition = 0x1E, movingSpeed = 0x20, ccwAngleLimit = 0x08, cwAngleLimit = 0x06; //Motor Control Table Addresses
var baseID = 0x00, shoulderLID = 0x01, shoulderRID = 0x02, elbowID = 0x03, wristID = 0x04, broadcastID = 0xFE; //Motor ID Tags **NOTE:broadcastID == broadcast to all motors
var command = [];
var setMotorMode = false;

/*Functions/Prototypes*/
Arm.prototype = new Skeleton("Arm");
Arm.prototype.constructor = Arm;

function Arm (model_ref){
	this.model = model_ref;
}

Arm.prototype.handle = function(data){ //Data is an object, with members outlined when sending control signals via mission-control-test.html
	//This handle function Sends Commands to Dynamixel MX-64
	if(setMotorMode == false){ //Set all but Base motors to joint-mode: Base goes from 0-360 ccw, all else go 0-180 ccw
		for(var i = 0; i < 4; i++){
			command = servoPos(180,i+1,ccwAngleLimit); //Sets all but base ccw limit to 180, allowing it movement from 0-180* ccw, with the bottom == 0*
			console.log("	<Set Motor ccW Limit: " + command + ">");
		}
		//All Motor's default is cw:0x0000, ccw:0x0FFF
		// command = servoPos(180,baseID,ccwAngleLimit); //Sets Base motor ccw limit to 180, allowing it movement from 0-180* ccw, with the bottom == 0*
		// console.log("	<Set Motor ccW Limit: " + command + ">");
		// command = servoPos(180,baseID,cwAngleLimit); //Sets Base motor cw limit to 180, allowing it movement from 0-180* ccw, with the bottom == 0*
		// console.log("	<Set Motor cW Limit: " + command + ">");
		command = [];
		setMotorMode = true;
		//For Debugging
		// console.log("setMotorMode: " + setMotorMode);
	}
	if(data.base != undefined){
		command = servoPos(data.base,baseID,goalPosition);
		console.log("	<Set Motor Position: " + command + ">");
		command = [];
	}
	if(data.shoulderL != undefined){
		command = servoPos(data.shoulderL,shoulderLID,goalPosition);
		console.log("	<Set Motor Position: " + command + ">");
		command = [];
	}
	if(data.shoulderR != undefined){
		command = servoPos(data.shoulderR,shoulderRID,goalPosition);
		console.log("	<Set Motor Position: " + command + ">");
		command = [];
	}
	if(data.elbow != undefined){
		command = servoPos(data.elbow,elbowID,goalPosition);
		console.log("	<Set Motor Position: " + command + ">");
		command = [];
	}
	if(data.wrist != undefined){
		command = servoPos(data.wrist,wristID,goalPosition);
		console.log("	<Set Motor Position: " + command + ">");
		command = [];
	}
	if(data.speed != undefined){ //All motors have same speed
		command = servoPos(data.speed,broadcastID,movingSpeed);
		console.log("	<Set Motor Speed: " + command + ">");
		command = [];
	}
	//For debugging html response...
	// console.log(this.module+" Received: " + data);
	// console.log(">Base:" + data.base);
	// console.log(">ShoulderL:" + data.shoulderL);
	// console.log(">ShoulderR:" + data.shoulderR);
	// console.log(">Elbow:" + data.elbow);
	// console.log(">Wrist:" + data.wrist);
	// console.log(">Speed:" + data.speed);
};

Arm.prototype.resume = function() {};
Arm.prototype.halt = function(data) {};

module.exports = exports = Arm;
"use strict";
//Dynamixel Instruction Packet Format: 0xFF 0xFF ID LENGTH INSTRUCTION PARAMETER#1 ... PARAMETER#N CHECK_SUM
//MX-64AR VCC=12V, LC Electronics rs485 Uart converter VCC=5V
/*Includes*/
var SerialPort = require("serialport").SerialPort;
var Skeleton = require("../skeleton.js");

/*Globals*/
//For use in actual rover
// var serial = new SERIALPORT.SerialPort("for/path/to/uart/device,/See_READMEarm.txt", { baudrate: 9600 }); 
//For use in local system testing; Read/Write stream to USB
var serial = new SerialPort("/dev/ttyACM0", { baudrate: 57600 } );
//Instruction Codes
var PING = 0X01, READ = 0x02, WRITE = 0x03, REGWRITE = 0X04, ACTION = 0X05;
//Servo Control Table Addresses
var goalPosition = 0x1E, movingSpeed = 0x20, ccwAngleLimit = 0x08, cwAngleLimit = 0x06, torqueOn = 0x18;
//Motor IDs **NOTE:broadcastID == broadcast to all motors
var baseID = 0x00, shoulderLID = 0x01, shoulderRID = 0x02, elbowID = 0x03, wristID = 0x04, broadcastID = 0xFE;
var command = [];
var motorValuesSet = false;
var inbox = ""; //data buffer for recieving responses from device
var defaultSet = false;
var i = 0;
var mybool = false;
//format for data being passed to arm.prototype.handle(data);
var schema = {
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
		//inbox += data.toString('utf8'); //In ASCII format, save what is received in a buffer
		// if(inbox.indexOf("-") != -1) { //When you find the end of line char, print out the buffer
		// 	console.log(">>Response: " + inbox); //For debugging. Output the response from device to console
		// 	inbox = ""; //Once buffer is sent out, clear it
		// }
		// inbox = data.toString('utf8');
		// console.log(">>Response: " + typeof data);
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

		// //Loop to send packets
		// for(var i = 0; i < 11; i++){
		// 	// if(i >= 4){
		// 	// 	defaultSet = true; //Once the initial motor restraints are set, don't reset them.
		// 	// }
		// 	// //Send packets defining initial motor restraints
		// 	// if(i < 4 && defaultSet == false){
		// 	// 	command = writePacket(WRITE,i+1,[ccwAngleLimit,180]); 
		// 	// 	console.log("	<Set Motor ccW Limit: " + command + ">");
		// 	// }
		// 	// else if(i == 4 && info.base != undefined){
		// 	// 	command = writePacket(WRITE,baseID,[goalPosition,info.base]);
		// 	// 	console.log("	<Set Motor Position: " + command + ">");
		// 	// }
		// 	// else if(i == 5 && info.shoulderL != undefined){
		// 	// 	command = writePacket(WRITE,shoulderLID,[goalPosition,info.shoulderL]);
		// 	// 	console.log("	<Set Motor Position: " + command + ">");
		// 	// }
		// 	// else if(i == 6 && info.shoulderR != undefined){
		// 	// 	command = writePacket(WRITE,shoulderRID,[goalPosition,info.shoulderR]);
		// 	// 	console.log("	<Set Motor Position: " + command + ">");
		// 	// }
		// 	// else if(i == 7 && info.elbow != undefined){
		// 	// 	command = writePacket(WRITE,elbowID,[goalPosition,info.elbow]);
		// 	// 	console.log("	<Set Motor Position: " + command + ">");
		// 	// }
		// 	// else if(i == 8 && info.wrist != undefined){
		// 	// 	command = writePacket(WRITE,wristID,[goalPosition,info.wrist]);
		// 	// 	console.log("	<Set Motor Position: " + command + ">");
		// 	// }
		// 	// else if(i == 9 && info.speed != undefined){ //All motors have same speed
		// 	// 	command = writePacket(WRITE,broadcastID,[movingSpeed,info.speed]);
		// 	// 	console.log("	<Set Motor Speed: " + command + ">");
		// 	// }
		// 	// else if(i == 10){
		// 	// 	command = writePacket(WRITE,broadcastID,[torqueOn, 1]); //enable servo movement
		// 	// 	console.log("	<Set Motor Torque: " + command + ">");
		// 	// }
		// 	if(i == 9 /*&& mybool == false*/){
		// 		command = writePacket(WRITE,broadcastID,[torqueOn, 1]); //enable servo movement
		// 		console.log("	<Set Motor Torque: " + command + ">");
		// 		if(i == 3){
		// 			mybool = true;
		// 		}
		// 	}
		// 	if(i == 10){
		// 		command = writePacket(WRITE,broadcastID,[goalPosition, info.base]);
		// 		console.log("	<Set Motor Position: " + command + ">");
		// 	}
		// 	//Send command buffer to device
		// 	// var sendit = JSON.stringify(command.join());
		// 	var tosend = "";
		// 	for(var z = 0; z < command.length; z++){
		// 		tosend += command[z].toString();
		// 		if(z == command.length){
		// 			// tosend += "-";
		// 		}
		// 		console.log(tosend);
		// 	}
		// 	tosend += "-";
		// 	// servo.write(0xFF); // Sync
		// 	// servo.write(0xFF); // Start
		// 	// servo.write(0xFE); // Broadcast ID
		// 	// servo.write(2+2);  // Length
		// 	// servo.write(0x03); // WRITE_DATA
		// 	// servo.write(0x19); // Param 1: Start Addr of write data
		// 	// servo.write((byte)0x00); // Param 2: Data to write @ addr 0x19
		// 	// servo.write(~((0xFE)+(2+2+0x03+0x19+(byte)0x00))); // Checksum
		// 	tosend = writePacket(WRITE, 0xFE, [0x19,0x00])+"-";

		// }
		var send = writePacket(WRITE, 0xFE, [0x19,0x00]);
		serial.write(0xFF, function() {});
		//For debugging
		// console.log("Waiting..."); 
		//All Motor's default is cw:0x0000, ccw:0x0FFF
	}
};

Arm.prototype.resume = function() {};
Arm.prototype.halt = function(data) {};
//==================================================================

function writePacket(action, motorID, parameter) { //Ex: writePacket(WRITE, baseID, [goalposition,360])
	var length = parameter.length+2;
	var checksum = 0;
	var output = "";
	var buff = [ 0xFF, 0xFF, motorID, length, action ];
	for (var i = 0; i < parameter.length; i++) {
		buff.push(parameter[i]);
	};
	// Generate Checksum
	for (var i = 0; i < parameter.length; i++) {
		checksum += parameter[i];
	};
	// Generate output
	for (var i = 0; i < buff.length; i++) {
		output += String.fromCharCode(buff[i]);
	};
	// Append checksum
	output += String.fromCharCode(~(checksum & 0x00FF));

	return output;

/*	//MotorID type number ex: 0x01
	//Action type number const: ex: WRITE
	//parm type array: ex: [0x19, 0x01]
	var temp;
	var high;
	var low;
	var output = [String.fromCharCode(0xff), String.fromCharCode(0xff)];
	var exporter = parameter; //sets exporter to paramter array
	var packetlength = 0;
	var CHECK_SUM = 0;
	var ctrlTblAddress = exporter[0]; //First element = ctrlTblAddress
	var value = 0;

	// For Debugging
	var motorTag = ["ALL", "BASE", "LEFT SHOULDER", "RIGHT SHOULDER", "ELBOW", "WRIST"];
	var ctrlTblTag = ["Speed", "Position", "CCW Limit", "CW Limit"];

	//Determine Binary Values to Write
	if(ctrlTblAddress == movingSpeed){ //If the packet is intended for a change in the motor speed
		value = exporter[1];
		temp = motorSpeed(value);
	}
	else if(ctrlTblAddress == goalPosition){ //If the packet is intended for a change in the motor angle position
		value = exporter[1];
		temp = motorAngle(value);
	}
	else if(ctrlTblAddress == ccwAngleLimit || ctrlTblAddress == cwAngleLimit){ //If packet is intended to change max/min (ccw/cw) angle limits
		value = exporter[1];
		temp = motorAngle(value);
	}
	else if(ctrlTblAddress == torqueOn){
		//No calculations/binary conversion needed.
		temp = exporter[1]; //The 1 to turn torque on, or 0 to turn it off
	}
	temp = parseInt(temp);

	
	//For Standard Writing(i.e. writing to goalposition, anglelimit(cw or ccw), or moving speed)
	if(ctrlTblAddress == movingSpeed || ctrlTblAddress == goalPosition || ctrlTblAddress == ccwAngleLimit || ctrlTblAddress == cwAngleLimit){
		//Packet Byte Formatter
		if(temp > 255){ //Any number greater than 255 will have a non-zero high byte to send (255 = 0x00FF, 256 = 0x0100)
			high = temp >> 8; //Bitshift Right: Gets rid of lower byte (e.g. the lower 2 hex digits0, leaving only the higher byte
			low = temp & 0x00FF;
		}
		else{
			high = 0x00;
			low = temp & 0xFF;
		}
		exporter.pop();
		exporter.push(low, high); //exporter[0]=ctrlTblAddress, exporter[1,2,..]=others
		packetlength = exporter.length + 2; //(# of parameters including checksum)+ 2(action/instruction & checksum, checksum is added later)
		CHECK_SUM = writeCheckSum(motorID, packetlength, action, [ctrlTblAddress, low, high]); //standard goalpos wirte packet length = 0x05, action{WRITE=0x03, READ=0x02, .....}
		// Output each element in form of its corresponding byte (will come up as ASCII/Unicode chars)
		exporter.push(CHECK_SUM); //last parameter to be added onto output
		// packetlength = exporter.length + 1; //(# of parameters including checksum)+ 1(action/instruction)
		// output.push(String.fromCharCode(motorID), String.fromCharCode(packetlength), String.fromCharCode(action));
		// for(var i = 0; i < exporter.length; i++){
		// 	output.push(String.fromCharCode(exporter[i]));
		// }
	}
	else if(ctrlTblAddress == torqueOn){
		packetlength = exporter.length + 2;
		CHECK_SUM = writeCheckSum(motorID, packetlength, action, [ctrlTblAddress, temp]);
		exporter.push(CHECK_SUM);
	}
	output.push(String.fromCharCode(motorID), String.fromCharCode(packetlength), String.fromCharCode(action));
	for(var t = 0; t < exporter.length; t++){
		output.push(String.fromCharCode(exporter[t]));
	}
	// output.push(String.fromCharCode(motorID), String.fromCharCode(packetlength), String.fromCharCode(action), String.fromCharCode(ctrlTblAddress), String.fromCharCode(low), String.fromCharCode(high), String.fromCharCode(CHECK_SUM));
	*/
	//return output;
}

function writeCheckSum (ID, Length, Instruction, Parameters){ //based on andOperator.js
	// var high = 0;
	// var low = 0;
	var num;
	var paramSum = 0;
	for(var h = 0; h < Parameters.length; h++){
		paramSum += Parameters[h] //adds ctrlTblAddress values and all else, whether it be sum of low/high bytes, a single byte, etc.
	}
	var temp = (ID + Length + Instruction + paramSum) & 0x00FF;
	num = (~temp) & 0x00FF;
	//For Debugging...
	//console.log("Num: " + num);
	return num;
}

function motorSpeed(speedInput){ //speedInput expected to be a number between 0 - 117.07 rpm
	/*Includes*/

	/*Globals*/
	
	//Dynamixel Instruction Packet Format: 0xFF 0xFF ID LENGTH INSTRUCTION PARAMETER#1 ... PARAMETER#N CHECK_SUM
	var remainders = [];
	var hexed = false;
	var g = 1;

	/*Functions*/
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

	return end; //returns the hexadecimal value as a string. To convert to numerical value, use parseInt() (see javascript reference)
}

function motorAngle(degreeInput){ //degreeInput expected to be a number between 0 - 360 degrees
	/*Includes*/

	/*Globals*/
	
	//Dynamixel Instruction Packet Format: 0xFF 0xFF ID LENGTH INSTRUCTION PARAMETER#1 ... PARAMETER#N CHECK_SUM
	var remainders = [];
	var hexed = false;
	var y = 1;

	/*Functions*/
	function highNum (mynumber){
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

	return end; //returns the hexadecimal value as a string. To convert to numerical value, use parseInt() (see js)
}

module.exports = exports = Arm;
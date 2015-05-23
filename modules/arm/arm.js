"use strict"; //Working Version, mk1
//Dynamixel Instruction Packet Format: 0xFF 0xFF ID LENGTH INSTRUCTION PARAMETER#1 ... PARAMETER#N CHECK_SUM
/*Includes*/
var SerialPort = require("serialport").SerialPort;
var Skeleton = require("../skeleton.js");

/*Functions/Prototypes*/
Arm.prototype = new Skeleton("Arm");
Arm.prototype.constructor = Arm;

function Arm (model_ref, feedback, spine, debug) { //model_ref, a feedback variable that allows arm to return stuff to the interfaces globally, and a global spint var that allows global access to the spine (bbb pinouts)
	var parent = this;
	this.debug = debug; //boolean value to toggle console log traffic.
	this.busy = false;//Handles signal traffic jams
	this.ready = [false,false,false,false,false]; //readiness flags (when all true, send Action cmd)

/*	When declaring a var inside the Arm class, i.e. here, the prototype functions cannot access them,
for they need to be properties, not variables, so for the prototype function "moveMotor" to access
'defaulted', for example, defaulted needs to be declared as a property of function Arm, not a variable
Therefore, use 'this.defaulted'
*/
	// Globals
	this.model = model_ref;
	this.feedback = feedback;
	this.spine = spine;
	this.serial = new SerialPort("/dev/ttyO5", { //set up serial comms
	    baudrate: 57600,
	    //databits:8,
	    //parity: 'none'
	});
	/*Setup Pump Pinouts*/
	this.depressurizer = { //deflate Balloon
		// valve: 'P8_26',
		pin: 'P8_27'
	},
	this.pressurizer = { //inflate Balloon
		// valve: 'P8_28',
		pin: 'P8_29'
	}
	this.spine.expose(this.depressurizer.pin, "OUTPUT"); //Same as Arduino's pinMode
	this.spine.expose(this.pressurizer.pin, "OUTPUT");

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
			"shoulder" : "Number", //Degree value, from 0 to 360
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
	this.edit = {POSITION: 0x1E, SPEED: 0x20, CCW: 0x08, CW: 0x06, TORQUE: 0x18, LED: 0x19, MAXTORQUE: 0x22 , ALARMSHUTDOWN: 0x12};

	/*Setup command standards (saves processing time)*/
	this.standards = {
		write: {instruction: this.operation.WRITE, register: this.edit.POSITION},
		regwrite: {instruction: this.operation.REGWRITE, register: this.edit.POSITION},
	}

	// generate motor standard
	this.motorStandard = new Buffer(9);
	this.motorStandard[0] = 0xFF; // ÿ Signature Byte Char
	this.motorStandard[1] = 0xFF; // ÿ Signature Byte Char
	this.motorStandard[2] = 0x00; // ID Byte Char NEEDS TO CHANGE
	this.motorStandard[3] = 0x05; // packet length
	this.motorStandard[4] = 0x04; // instruction byte
	this.motorStandard[5] = 0x1E; // register addr 0x05
	this.motorStandard[6] = 0xFF; // low
	this.motorStandard[7] = 0x01; // high
	this.motorStandard[8] = 0x00; // checksum

	/*Initiate Serialport*/
	this.serial.on('open', function(err) {
	    if(err) { console.log(err); }
	});
	this.serial.on('err', function(err){
		console.log(err);
	});

	this.invalid_input = false;
	this.posBuffer = {
		shoulderL: 150,
		shoulderR: 150,
		elbow: 150,
		wrist: 150,
		base: 285
	}
	this.setposition = function(){
		console.log("setting position");
		//copy posBuffer positions into separate vars to prevent changes to positions while calculations are being done (this will mess up motors)
		var sdL = parent.posBuffer.shoulderL;
		var sdR = parent.posBuffer.shoulderR;
		var wMtr = parent.posBuffer.wrist;
		var eMtr = parent.posBuffer.elbow;
		var bMtr = parent.posBuffer.base;
		if(sdL != (sdR - 300) * (-1)){ //check if left servo is synced with the right servo
			sdL = (sdR - 300) * (-1);
		}
		parent.moveMotor(parent.id.LEFTSHOULDER, sdL);
		parent.moveMotor(parent.id.RIGHTSHOULDER, sdR);
		parent.moveMotor(parent.id.WRIST, wMtr);
		parent.moveMotor(parent.id.ELBOW, eMtr);
		parent.moveMotorMX(parent.id.BASE, bMtr);
	}
	//this.respondTimer = setInterval(this.setposition, 100);
	this.respondTimer;
}

Arm.prototype.checkAllMotors = function(first_argument) { //checks flags & sends action when all true
	var parent = this; //points to function Arm (the Arm class)
	if(this.debug){
		console.log(this.ready);
	}
	if(this.ready[0] && this.ready[1] && this.ready[2] && this.ready[3] && this.ready[4]) {
		if(this.debug){
			console.log("Getting called into action!!");
		}
		this.serial.write(this.actionBuffer, function() {
			setTimeout(function() {
				parent.serial.write(parent.actionBuffer, function() {
					parent.ready = [false,false,false,false,false];
					//parent.busy = false;
					if(parent.debug){
						console.log("No longer busy");
					}
				});
			}, 5);
		});
	}	
	// for (var i = 0; i < this.ready.length; i++) {
	// 	if(!this.ready[i]) { return; }
	// };
	// this.callAction(this.actionBuffer);
};

Arm.prototype.handle = function(input){ //Input is an object, with members outlined when sending control signals via mission-control-test.html
	if(this.debug){
		console.log("Handling arm"); //The handle function Sends Commands to Dynamixel MX-64 & RX-64
	}
	var parent = this; //pointer to the arm class
	/*Pump Control Block*/
	if(!_.isUndefined(input["pump"])){ //If a pump command to pump in/out exists
		if(typeof input["pump"] == "string"){
			// this.invalid_input = false;
			if(input.pump == "grip"){ //-1 = suck air out of balloon
				this.spine.digitalWrite(this.pressurizer.pin, this.turn.OFF); //pump off first
				this.spine.digitalWrite(this.depressurizer.pin, this.turn.ON); //other pump on last
				/*Since continuous deflation poses no risk of destrution to balloon/arm, no timeout is
				needed.*/
				if(this.debug){
					console.log("Pump: grippin'");
				}
			}
			if(input.pump == "stop"){ //0 = stop all in case of emergency
				this.spine.digitalWrite(this.pressurizer.pin, this.turn.OFF); //pump off first
				this.spine.digitalWrite(this.depressurizer.pin, this.turn.OFF); //other pump offpin
				if(this.debug){
					console.log("Pump: stoppin'");
				}
			}
			if(input.pump == "drop"){ //1 = pump air into balloon
				this.spine.digitalWrite(this.depressurizer.pin, this.turn.OFF); //pump off first
				this.spine.digitalWrite(this.pressurizer.pin, this.turn.ON); //other pump on last
				setTimeout(function(){ //w/o parent, "this" would refer to the most immediate function/class, aka setTimeout, which has now property 'pump'
					parent.spine.digitalWrite(parent.pressurizer.pin, parent.turn.OFF); //pump off first
				}, 4000); //In case of connection loss, balloon inflation will cease after x seconds
				if(this.debug){
					console.log("Pump: drop it!");
				}
			}
		}
		else{
			if(this.debug){
				console.log("Pump: Invalid Value");
			}
		}
	}
	/*Speed Control Block*/
	if(!_.isUndefined(input["speed"])){
		if(input.speed == "slow"){
			this.writePacket({
				instruction:this.operation.WRITE, 
				motorID:this.id.ALL,
				register:this.edit.SPEED, 
				lowbyte:0x28,
				highbyte:0x00
			});
			if(this.debug){
				console.log("Speed: Slow");
			}
		}
		else if(input.speed == "normal"){
			this.writePacket({
				instruction:this.operation.WRITE, 
				motorID:this.id.ALL,
				register:this.edit.SPEED, 
				lowbyte:0x40,
				highbyte:0x00
			});
			if(this.debug){
				console.log("Speed: Normal");
			}			
		}
		else if(input.speed == "fast"){
			this.writePacket({
				instruction:this.operation.WRITE, 
				motorID:this.id.ALL,
				register:this.edit.SPEED, 
				lowbyte:0x48,
				highbyte:0x00
			});
			if(this.debug){
				console.log("Speed: Normal");
			}			
		}
		else{
			if(this.debug){
				console.log("Speed: Invalid Value");
			}
		}
	}
	/* Block*/
	if(!_.isUndefined(input["line"])){
		if(input["line"] == "online") {
			clearInterval(this.respondTimer);
			this.respondTimer = setInterval(this.setposition, 100);
		}
		if(input["line"] == "offline") {
			clearInterval(this.respondTimer);
		}
	}
	/*Torque Control Block*/
	if(!_.isUndefined(input["torque"])){
		if(input.torque == "off"){ //interface is telling you to turn off torque
			clearInterval(this.respondTimer);
			setTimeout(function() {
				parent.writePacket({ //Enable Torque
					instruction:parent.operation.WRITE, 
					motorID:parent.id.ALL, 
					register:parent.edit.TORQUE, 
					lowbyte:parent.turn.OFF
				});
				if(parent.debug){
					console.log("Torque: Deactivating");
				}
			}, 50);
		}
		else if(input.torque == "on"){ //interface is telling you to turn on torque
			clearInterval(this.respondTimer);
			this.writePacket({ //Enable Torque
				instruction:this.operation.WRITE, 
				motorID:this.id.ALL, 
				register:this.edit.TORQUE, 
				lowbyte:this.turn.ON
			});
			if(this.debug){
				console.log("Torque: Activating");
			}
		}
		else{
			if(this.debug){
				console.log("Torque: Invalid Value");
			}
		}
	}
	/*Torque Reset Block*/
	if(!_.isUndefined(input["reset"])){ //should changed max torque back to max when arm overtorques
		this.writePacket({
			instruction: this.operation.WRITE,
			motorID: this.id.ALL,
			register: this.edit.MAXTORQUE,
			lowbyte: 0xFF,
			highbyte: 0x03
		});
		setTimeout(
			this.writePacket({
				instruction: this.operation.WRITE,
				motorID: this.id.ALL,
				register: this.edit.ALARMSHUTDOWN,
				lowbyte: 0x24
			}), 500);
	}
	/*Arm Control Block*/
	//if(this.busy) { return "ARM IS BUSY!"; } //If busy, return msg to interface, do nothing, else:
	if(this.defaulted == false) { //If defaults not yet set
		if(this.debug){
			console.log("Enabling Torque");
		}
		this.writePacket({ //Enable Torque
			instruction:this.operation.WRITE, 
			motorID:this.id.ALL, 
			register:this.edit.TORQUE, 
			lowbyte:this.turn.ON
		});
		this.writePacket({
			instruction:this.operation.WRITE, 
			motorID:this.id.ALL,
			register:this.edit.SPEED, 
			lowbyte:0x40,
			highbyte:0x00
		});
		this.defaulted = true;
	}
	//this.busy = true;
	//this.invalid_input = true;
	if(!_.isUndefined(input["shoulder"])) { //If shoulder element exists
		//this.invalid_input = false;
		var pos = input.shoulder;
		if(pos < 45) {pos = 45;} else if (pos > 180){ pos = 180;} //angle limiter
		var newval = (pos - 300) * (-1);
		// this.moveMotor(this.id.LEFTSHOULDER, newval);
		// this.moveMotor(this.id.RIGHTSHOULDER, pos);
		this.posBuffer.shoulderL = newval;
		this.posBuffer.shoulderR = pos;
		if(this.debug){
			console.log("shoulder if statement has been called");
		}
		// this.callAction(this.actionBuffer);
	}
	if(!_.isUndefined(input["wrist"])) { //If wrist element exists
		//this.invalid_input = false;
		var wrst = input.wrist;
		if(wrst < 100){wrst = 100;} else if (wrst > 240){wrst = 240;} //angle limiter
		// this.moveMotor(this.id.WRIST, wrst);
		this.posBuffer.wrist = wrst;
	}
	if(!_.isUndefined(input["elbow"])) { //If elbow element exists
		//this.invalid_input = false;
		var elb = input.elbow;
		if(elb < 70){elb = 70;} else if (elb > 205){elb = 205;} //angle limiter
		// this.moveMotor(this.id.ELBOW, elb);
		this.posBuffer.elbow = elb;
	}
	if(!_.isUndefined(input["base"])) { //If base element exists
		//this.invalid_input = false;
		var bs = input.base;
		if(bs < 240){bs = 240;} else if (bs > 340){bs = 340;} //angle limiter
		if(this.debug){
			console.log("base if statement has been called");
		}
		// this.moveMotorMX(this.id.BASE, bs);
		this.posBuffer.base = bs;
	}
	/*
	if(this.invalid_input) {
		this.busy = false;
		if(this.debug){
			console.log("invalid input to arm handler!");
		}
	}
	*/
	// if(this.ready.shoulderL && this.ready.shoulderR){
	// 	this.callAction(this.actionBuffer);
	// }
};

Arm.prototype.moveMotor = function(ID, number) { //Info is an object, with members outlined when sending control signals via arm interface html
	var parent = this;
	var std = JSON.parse(JSON.stringify(this.motorStandard));
	var hexdeg = (number/300) * 1023;/*(number/360) * 4095;*/ //for MX series: 360 and 4095. for RX series: 300 and 1023
	if(hexdeg > 1023) {
		hexdeg = 1023;
	}
	if(hexdeg < 0){
		hexdeg = 0;
	}
	var high = (hexdeg >> 8) & 0xFF; //grab the highbyte
	var low = hexdeg & 0xFF; //format hexdeg to have only the lowbyte
	//console.log("H:" + high + "  L:" + low);
	std[2] = ID;
	std[6] = low;
	std[7] = high;
	std[8] = 0x00;
	var sum = 0;
	for (var i = 2; i < std.length; i++) {
		sum += std[i];
	};
	std[8] = (~sum) & 0xFF;
//	console.log(std);
	this.serial.write(std, function() {
		setTimeout(function() {
			parent.serial.write(std, function() {
				parent.ready[ID] = true;
				parent.checkAllMotors();
				if(parent.debug){
					console.log("Motor ID = "+ID+" has finished sending!");
				}
			});
		}, 2);
	});
};

Arm.prototype.moveMotorMX = function(ID, number) { //Info is an object, with members outlined when sending control signals via arm interface html
	// console.log("Enabling Torque");
	// writePacket(WRITE, ALL, TORQUE, ON); //highbyte not used, set to default 0xFFFF
/*	var hexdeg = (number/360) * 4095; //for MX series: 360 and 4095. for RX series: 300 and 1023
	if(hexdeg > 4095){
		hexdeg = 4095;
	}
	if(hexdeg < 0){
		hexdeg = 0;
	}
	var high = (hexdeg >> 8) & 0xFF; //grab the highbyte
	var low = hexdeg & 0xFF; //format hexdeg to have only the lowbyte
	//console.log("H:" + high + "  L:" + low);
	// this.standards.regwrite.motorID = ID;
	// this.standards.regwrite.lowbyte = low;
	// this.standards.regwrite.highbyte = high;
	// this.writePacket(this.standards.regwrite);
	this.motorStandard[2] = ID;
	this.motorStandard[6] = low;
	this.motorStandard[7] = high;
	this.writePacket(this.motorStandard);
*/

	var parent = this;
	var std = JSON.parse(JSON.stringify(this.motorStandard));
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
	std[2] = ID;
	std[6] = low;
	std[7] = high;
	std[8] = 0x00;
	var sum = 0;
	for (var i = 2; i < std.length; i++) {
		sum += std[i];
	};
	std[8] = (~sum) & 0xFF;
	this.serial.write(std, function() {
		setTimeout(function() {
			parent.serial.write(std, function() {
				parent.ready[ID] = true;
				parent.checkAllMotors();
				if(parent.debug){
					console.log("Motor ID = "+ID+" has finished sending!");
				}
			});
		}, 2);
	});
	/*
	this.serial.write(std, function() {
		parent.ready[ID] = true;
		parent.checkAllMotors();
		if(parent.debug){
			console.log("Motor ID = "+ID+" has finished sending!");
		}
	});
	*/
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

Arm.prototype.writePacket = function(obj){ //parameters==object with motor IDs and values, use member finding to determine what to do
	if(this.debug){
		console.log("Controlling Motor " + obj.motorID); //For Debugging
	}
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
	var parent = this;
	this.serial.write(command, function() {});
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

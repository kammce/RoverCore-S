"use strict";

var Skeleton = require("../skeleton.js");
Tracker.prototype = new Skeleton("Tracker");
Tracker.prototype.constructor = Tracker;

function Tracker(model_ref, feedback, debug) {

	this.debug = debug;
	this.model = model_ref;
	this.feedback = feedback;
	this.zoom = 1;
	this.mins = [-60, -180, -10]; //Minimum values for Pitch, Yaw, and Roll
	this.maxs = [30, 180, 10];
	this.ranges = [this.maxs[0] - this.mins[0],
					this.maxs[1] - this.mins[1],
					this.maxs[2] - this.maxs[2]];
	this.deltaDegrees = [this.ranges[0]/254, this.ranges[1]/254, this.ranges[2]/254];
	this.PWMs = [254,127,127];
	this.curDegrees = [0,0,0];

	var parent = this;
	var serialport = require("serialport")
	var SerialPort = serialport.SerialPort;
	//console.log("Starting serial connection");

	this.serialport = new SerialPort("/dev/ttyO4", {
		baudrate: 9600,
		parse : serialport.parsers.readline("\r\n")
	});
	this.serialport.on("open", function(error) {
		if(error) {
			console.log(err);
		} else {console.log("TRACKER: Ready for serial communication")};

		
	});
	
	var tempVal = "";
	this.serialport.on("data", function(data) {
			if(this.debug) {
				console.log("Length of data: " + data.toString().length);
				console.log("Received data: " + data.toString() +"\n");
			}
			if(data.toString() == "\n" || data.toString() == "\r\n") return;
			
			var str = data.toString();
			if(str.indexOf("Q") < 0) {
				tempVal += str;
			} else {
				tempVal += str.substring(0, str.indexOf("Q"));
				parent.model.tracker.range = parseFloat(tempVal);
				tempVal = "";
				parent.serialport.flush();
			}
	});
}

Tracker.prototype.handle = function(data) {
	console.log(this.module+" Recieved ", data);
	if(data["req"] == "Set Rotations") {
		this.setRotations(data);
	} else if (data["req"] == "Set Zoom") {
		this.setZoom(data);
	} else if(data["req"] == "Get Range") {
		this.getRange();
	} else if(data["req"] == "Reset") {
		this.serialport.write("r\r\n");
	}
};

Tracker.prototype.resume = function() {};
Tracker.prototype.halt = function() {};

Tracker.prototype.setRotations = function(data) {
	
	var parent = this;
	var pitchVal = data["pitch"];
	var yawVal = data["yaw"];
	var rollVal = data["roll"];
	if(this.debug) {
		console.log("Roll value: " + rollVal);
		console.log("Roll delta degrees: " + this.deltaDegrees[2]);
	}
	if(this.PWMs[0] + pitchVal > 0 && this.PWMs[0] + pitchVal < 255) {
		this.curDegrees[0] = this.mins[0] + (this.PWMs[0] + pitchVal) * this.deltaDegrees[0];
		this.PWMs[0] += pitchVal;
	}
	if(this.PWMs[1] + yawVal > 0 && this.PWMs[1] + yawVal < 255) {
		this.curDegrees[1] = this.mins[1] + (this.PWMs[1] + yawVal) * this.deltaDegrees[1];	
		this.PWMs[1] += yawVal;
	}
	if(this.PWMs[2] + rollVal > 0 && this.PWMs[2] + rollVal < 255) {
		this.curDegrees[2] = this.curDegrees[2] + 10*rollVal;
		this.PWMS[2] += 10*rollVal;
	}
	
	this.model.tracker.pitch = this.curDegrees[0];
	this.model.tracker.yaw = this.curDegrees[1];
	this.model.tracker.roll = this.curDegrees[2];
	//console.log("Roll PWM value: " + this.PWMs[2]);
	this.serialport.write("g"+","+pitchVal+","+yawVal+","+rollVal+"n");
}

Tracker.prototype.getRange = function() {
	this.serialport.write("l\r\n");
}


Tracker.prototype.setZoom = function(data) {
	console.log("Setting zoom");
	this.zoom = data["zoom"];
	this.model.tracker.zoom = data["zoom"];
	this.serialport.write("z,"+this.zoom+"\r\n");
}

module.exports = exports = Tracker;

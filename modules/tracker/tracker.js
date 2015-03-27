"use strict";

var Skeleton = require("../skeleton.js");
Tracker.prototype = new Skeleton("Tracker");
Tracker.prototype.constructor = Tracker;

function Tracker(model_ref, feedback) {

	this.model = model_ref;
	this.feedback = feedback;
	this.zoom = 1;
	this.mins = [-90, 0, 0]; //Minimum values for Pitch, Yaw, and Roll
	this.maxs = [0, 180, 180];
	this.ranges = [this.maxs[0] - this.mins[0],
					this.maxs[1] - this.mins[1],
					this.maxs[2] - this.maxs[2]];
	this.deltaDegrees = [this.ranges[0]/254, this.ranges[1]/254, this.ranges[2]/254];
	this.PWMs = [0,0,0];
	this.curDegrees = [0,0,0];

	var parent = this;
	var serialport = require("serialport")
	var SerialPort = serialport.SerialPort;
	console.log("Starting serial connection");

	this.serialport = new SerialPort("/dev/ttyO2", {
		baudrate: 9600,
		parse : serialport.parsers.readline("\r\n")
	});
	this.serialport.on("open", function(error) {
		if(error) {
			console.log(err);
		} else {console.log("Ready for serial communication")};

		
	});
	
	var tempVal = "";
	this.serialport.on("data", function(data) {
			console.log("Length of data: " + data.toString().length);
			console.log("Received data: " + data.toString() +"\n");
			if(data.toString() == "\n" || data.toString() == "\r\n") return;
			if(tempVal.length == 0) { 
				tempVal = data.toString();
			} else {
				tempVal += data.toString();
			}
			if(tempVal.length >= 5) {
				parent.model.tracker.range = parseFloat(tempVal) || 10;
				
				parent.serialport.flush();
				tempVal = "";
				
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
	}
};

Tracker.prototype.resume = function() {};
Tracker.prototype.halt = function() {};

Tracker.prototype.setRotations = function(data) {
	
	var parent = this;
	var pitchVal = data["pitch"];
	var yawVal = data["yaw"];

	this.curDegrees[0] = this.mins[0] + (this.PWMs[0] + pitchVal) * this.deltaDegrees[0];
	this.curDegrees[1] = this.mins[1] + (this.PWMs[1] + yawVal) * this.deltaDegrees[1];
	this.PWMs[0] += pitchVal;
	this.PWMs[1] += yawVal;

	this.model.tracker.pitch = this.curDegrees[0];
	this.model.tracker.yaw = this.curDegrees[1];
	this.serialport.write("g"+","+pitchVal+","+yawVal+","+0+"\r\n");
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
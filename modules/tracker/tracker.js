"use strict";

var Skeleton = require("../skeleton.js");
Tracker.prototype = new Skeleton("Tracker");
Tracker.prototype.constructor = Tracker;

function Tracker(model_ref, feedback) {

	this.model = model_ref;
	this.feedback = feedback;
	this.pitch = 0;
	this.yaw = 0;
	this.zoom = 1;
	this.lat = 0;
	this.lng = 0;

	var serialport = require("serialport")
	var SerialPort = serialport.SerialPort;
	// this.serialport = new SerialPort("/dev/tty.usbmodem1411", {
	// 	baudrate: 9600,
	// 	parse : serialport.parsers.readline("\r\n")
	// });
	
}

Tracker.prototype.handle = function(data) {
	console.log(this.module+" Recieved ", data);
	if(data["req"] == "Set Rotations") {
		this.setRotations(data);
	} else if (data["req"] == "Get Rotations") {
		return this.getRotations();
	}  else if (data["req"] == "Set Zoom") {
		this.setZoom(data);
	}
};

Tracker.prototype.resume = function() {};
Tracker.prototype.halt = function() {};

Tracker.prototype.setRotations = function(data) {
	var parent = this;
	var pitch = data["pitch"];
	var yaw = data["yaw"];
	this.yaw = yaw;
	this.pitch = pitch;
	// this.serialport.write(data["pitch"]+","+data["yaw"]+"\r\n");

	// this.serialport.on("data", function(data) {
	// 	console.log("TRACKER: Setting pitch and yaw");
	// 	parent.pitch = pitch;
	// 	parent.yaw = yaw;
	// 	parent.model.pitch = pitch;
	// 	parent.model.yaw = yaw;
	// 	console.log("Pitch: " + parent.pitch + "  Yaw: " + parent.yaw);
	// });
}

Tracker.prototype.getRotations = function() {
	return { pitch : this.pitch , yaw : this.yaw };
}

Tracker.prototype.setZoom = function(data) {
	console.log("Setting zoom");
	this.zoom = data["zoom"];
	this.model.zoom = data["zoom"];
}

module.exports = exports = Tracker;
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
	console.log("TRACKER: Setting pitch and yaw");
	this.pitch = data["pitch"];
	this.yaw = data["yaw"];
	this.model.pitch = data["pitch"];
	this.model.yaw = data["yaw"];
	console.log("Pitch: " + this.pitch + "  Yaw: " + this.yaw);
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
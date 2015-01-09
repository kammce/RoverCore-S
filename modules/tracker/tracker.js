"use strict";

var Skeleton = require("../skeleton.js");
Tracker.prototype = new Skeleton("Tracker");
Tracker.prototype.constructor = Tracker;

function Tracker(model_ref, feedback) {
	this.model = model_ref;
	this.feedback = feedback;
}
Tracker.prototype.handle = function(data) {
	console.log(this.module+" Recieved ", data);
	if(data["req"] == "Set Rotations") {
		this.setRotations(data);
	} else if (data["req"] == "Get Rotations") {
		return this.getRotations();
	} 
};

Tracker.prototype.resume = function() {};
Tracker.prototype.halt = function() {};

Tracker.prototype.setRotations = function(data) {
	console.log("TRACKER: Setting pitch and yaw");
	this.pitch = data["pitch"];
	this.yaw = data["yaw"];
	console.log("Pitch: " + this.pitch + "  Yaw: " + this.yaw);
}

Tracker.prototype.getRotations = function() {
	return { pitch : this.pitch , yaw : this.yaw };
}

module.exports = exports = Tracker;
"use strict";

var Skeleton = require("../skeleton.js");
Motor.prototype = new Skeleton("Motor");
Motor.prototype.constructor = Motor;

function Motor(model_ref) {
	this.model = model_ref;
	this.fs = require('fs');
	this.exec = require('child_process').exec;
	//this.dev_tty = "/dev/ttyACM0";
	// Made for beaglebone black
	this.dev_tty = "/dev/ttyO4";

	//Set Arduino to 115200 baud rate and lock it down
	var setup_stty = this.exec('stty -F '+this.dev_tty+' raw speed 115200 ; tail -f '+this.dev_tty);
}
Motor.prototype.handle = function(data) {
	if(typeof data == "string") {
		if(isNaN(data)) {
			console.log("invalid action: ", data);
		} else {
			this.fs.appendFileSync(this.dev_tty, data);	
		}
	}
};
Motor.prototype.resume = function() {};
Motor.prototype.halt = function() {};


module.exports = exports = Motor;

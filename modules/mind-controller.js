"use strict";

function MindController(feedback) {
	var model = require('./model.js');
	var Sensor = require('./sensor/sensor.js');
	var Motor = require('./motor/motor.js');
	var Arm = require('./arm/arm.js');
	var Tracker = require('./tracker/tracker.js');
	var Video = require('./video/video.js');
	var Logger = require('./logger.js');

	this.model = model;

	this.sensor = new Sensor(model, feedback);
	this.motor = new Motor(model, feedback);
	this.arm = new Arm(model, feedback);
	this.tracker = new Tracker(model, feedback);
	this.video = new Video(model, feedback);
	this.logger = new Logger(model, feedback);

	this.priority = {
		motor: 1,
		arm: 1,
		sensor: 1,
		tracker: 1
	}

	this.mc_connected = false;
	this.is_halted = false;
	this.is_initialized = false;
}
MindController.prototype.handle = function(data) {
	console.log("No current handlers for MindController, found", data);
}; 
MindController.prototype.halt = function(data) {
	if(!this.is_halted) {
		//// Force everyone to halt and to stop accepting interrupts
		this.sensor._halt();
		this.motor._halt();
		this.arm._halt();
		this.tracker._halt();
		this.video._halt();
		//this.logger._halt();
		this.is_halted = true;
	}
}; 
MindController.prototype.resume = function() {
	if(this.is_halted) {
		//// Tell everyone to resume and to accept interrupts again
		this.sensor._resume();
		this.motor._resume();
		this.arm._resume();
		this.tracker._resume();
		this.video._resume();
		//this.logger._resume();
		this.is_halted = false;
	}
}
MindController.prototype.initialize = function() {
	if(!this.is_initialized) {
		this.is_initialized = true;
		//// Do something magical here. :D
	} else {
		this.resume();
	}
}

module.exports = exports = MindController;
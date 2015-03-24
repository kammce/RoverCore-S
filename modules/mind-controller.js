"use strict";

function MindController(feedback, simulation) {
	this.priority = {
		motor: 1,
		arm: 1,
		sensor: 500,
		tracker: 1
	}

	this.mc_connected = false;
	this.is_halted = false;
	this.is_initialized = false;
	this.feedback = feedback;

	var Skeleton = require('./skeleton.js');
	var parent = this;
	var model = require('./model.js');
	this.model = model;

	if(simulation == true) {
		// var Tracker = require('./tracker/tracker.js');
		// this.tracker = new Tracker(model, feedback);
		this.sensor = new Skeleton("SENSOR");
		this.motor = new Skeleton("MOTOR");
		this.arm = new Skeleton("ARM");
		this.tracker = new Tracker("TRACKER");
		this.logger = new Skeleton("LOGGER");
	} else {
		var Sensor = require('./sensor/sensor.js');
		var Motor = require('./motor/motor.js');
		var Arm = require('./arm/arm.js');
		var Tracker = require('./tracker/tracker.js');
		var Logger = require('./logger.js');
		this.sensor = new Sensor(model, feedback);
		this.motor = new Motor(model, feedback);
		this.arm = new Arm(model, feedback);
		this.tracker = new Tracker(model, feedback);
		this.logger = new Logger(model, feedback);
	}
}
MindController.prototype.handle = function(data) {
	switch(data['directive']) {
		case "DISCONNECT":
			this.halt(data['info']);
			break;
		case "CONNECT":
			this.resume(data['info']);
			break;
		default:
			console.log("No current handlers for MindController, found", data);
			break;
	}
}; 
MindController.prototype.halt = function(data) {
	// This happens when there is a disconnect from the server.
	if(_.isUndefined(data)) {
		if(!this.is_halted) {
			//// Force everyone to halt and to stop accepting interrupts
			this.sensor._halt();
			this.motor._halt();
			this.arm._halt();
			this.tracker._halt();
			//this.logger._halt();
			this.is_halted = true;
		}
	} else {
		switch(data) {
			case 'navigator':
				this.motor._halt();
				break;
			case 'archaeologist':
				this.arm._halt();
				break;
			case 'tracker':
				this.tracker._halt();
				break;
			default: 
				console.log(data+ " Disconnected");
				break;
		}
	}
}; 
MindController.prototype.resume = function(data) {
	if(_.isUndefined(data)) {
		if(!this.is_halted) {
			//// Force everyone to halt and to stop accepting interrupts
			this.sensor._resume();
			this.motor._resume();
			this.arm._resume();
			this.tracker._resume();
			//this.logger._resume();
			this.is_resumeed = true;
		}
	} else {
		switch(data) {
			case 'navigator':
				this.motor._resume();
				break;
			case 'archaeologist':
				this.arm._resume();
				break;
			case 'tracker':
				this.tracker._resume();
				break;
			// case 'SENSOR':
			// 	this.sensor._resume();
			// 	break;
			default:
				console.log(data+" Connected");
				break;
		}
	}
}
MindController.prototype.initialize = function() {
	var parent = this;
	if(!this.is_initialized) {
		this.is_initialized = true;
		this.sensor_loop = setInterval(function() {
			parent.model.test = Math.random();
			parent.feedback("SENSORS", parent.model);
		}, parent.priority.sensor);
		//// Do something magical here. :D
	} else {
		this.resume();
	}
}

module.exports = exports = MindController;
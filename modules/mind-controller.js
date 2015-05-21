"use strict";

function MindController(feedback, simulation, debug) {
	this.priority = {
		motor: 1,
		arm: 1,
		sensor: 250,
		tracker: 1
	};

	this.mc_connected = false;
	this.is_halted = false;
	this.is_initialized = false;
	this.feedback = feedback;

	var Skeleton = require('./skeleton.js');
	var parent = this;
	var model = require('./model.js');
	
	this.model = model;

	this.RST = {
		TRACKER: "P9_23",
		AUX: "P9_25"
	};

	if(simulation == true) {
		this.sensor = new Skeleton("SENSOR");
		this.motor = new Skeleton("MOTOR");
		this.arm = new Skeleton("ARM");
		this.tracker = new Skeleton("TRACKER");
		this.logger = new Skeleton("LOGGER");
	} else {
		var spine = new SPINE();
		//Turning on Arduinos
		// P9_23 = RST ttyO4 = Tracker
		// P9_25 = RST ttyO2 = AUX
		spine.expose(this.RST.Tracker, "OUTPUT");
		spine.expose(this.RST.AUX, "OUTPUT");
		spine.digitalWrite(this.RST.Tracker, 0);
		spine.digitalWrite(this.RST.AUX, 0);
		setTimeout(function()) {
			spine.digitalWrite(this.RST.Tracker, 1);
			spine.digitalWrite(this.RST.AUX, 1);
		}, 500);
		// Initializing Modules
		var Sensor = require('./sensor/sensor.js');
		var Motor = require('./motor/motor.js');
		var Arm = require('./arm/arm.js');
		var Tracker = require('./tracker/tracker.js');
		var Logger = require('./logger.js');
		this.sensor = new Sensor(model, feedback, spine, debug);
		this.motor = new Motor(model, feedback, spine, debug);
		this.arm = new Arm(model, feedback, spine, debug);
		this.tracker = new Tracker(model, feedback, spine, debug);
		this.logger = new Logger(model, feedback, spine, debug);
	}
}

MindController.prototype.handle = function(data) {
	switch(data['directive']) {
		case "DISCONNECT":
			this.halt(data['info']);
			break;
		case 'NOTCONNECTED':
			break;
		case "CONNECT":
			this.resume(data['info']);
			break;
		case "RESTART":
			this.halt();
			this.feedback("CORTEX", "Shutting down CORTEX (should be revived by forever-monitor)");
			process.exit();
		case "RESTART-AUX":
			spine.digitalWrite(this.RST.AUX, 0);
			setTimeout(function()) {
				spine.digitalWrite(this.RST.AUX, 1);
			}, 500);
			this.feedback("CORTEX", "RESTARTING AUX");
		case "RESTART-TRACKER":
			spine.digitalWrite(this.RST.Tracker, 0);
			setTimeout(function()) {
				spine.digitalWrite(this.RST.Tracker, 1);
			}, 500);
			this.feedback("CORTEX", "RESTARTING TRACKER");
		default:
			console.log("MindController does not have a handler for", data);
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
			case 'SENSOR':
			 	this.sensor._resume();
			 	break;
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


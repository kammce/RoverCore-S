"use strict";

function Spine(feedback) {
	this.os = require('os');
	this.hardware = {
		pwms: {
			pins: ["P8_13", "P8_13", "P8_19", "P8_34", "P8_36", "P9_28", "P9_29"],
			path: function(pin) {
				return "/sys/devices/ocp.3/pwm_test_"+pin+".*/";
			}
		},
		uarts: [ "/dev/ttyO1", "/dev/ttyO2", "/dev/ttyO4", "/dev/ttyO5" ],
		gpios: {
			exposed: [],
			path: function(gpio) {
				return "/sys/class/gpio/gpio"+gpio;
			},

		}
	}
	this.pinMap = {

	}

	if(this.os == 'beaglebone') {
		console.log("System Hostname is Beaglebone");
		console.log("Checking if UARTS are enabled");
	} else {
		console.log("Running on none Beagblebone platform.");
	}
}
Spine.prototype.pinMap = function(pin, ) {
	
}; 
Spine.prototype.pinMode = function(pin, ) {
	
}; 
Spine.prototype.digitalRead = function(pin) {
	var gpio = this.pinmap(pin);
	if(_.isUndefined(gpio)) {
		console.log("Invalid PIN "+pin);
		return false;
	} 
	var path = this.hardware.gpios.path(gpio);
	var contents = fs.readFileSync(path);
	if(_.isUndefined(contents)) {
		console.log("Could not read PIN "+pin);
	} else {
		return contents;
	}	
}; 
Spine.prototype.digitalWrite = function(pin, data) {
	if(!_.isNumber(data) || ) {
		console.log("Invalid PIN "+pin);
		return false;
	}
	var gpio = this.pinmap(pin);
	if(_.isUndefined(gpio)) {
		console.log("Invalid PIN "+pin);
		return false;
	} 
	var path = this.hardware.gpios.path(gpio);
	var contents = fs.readWriteSync(path, data+"");
	if(_.isUndefined(contents)) {
		console.log("Could not read PIN "+pin);
	} else {
		return contents;
	}	
}; 
Spine.prototype.uartSend = function(uart, msg) {
	
};

module.exports = exports = MindController;
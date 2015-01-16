"use strict";

function Spine(feedback) {
	this.os = require('os');
	this.hardware = {
		pwm: {
			pins: ["P8_13", "P8_13", "P8_19", "P8_34", "P8_36", "P9_28", "P9_29"],
			path: function(pin) {
				return "/sys/devices/ocp.3/pwm_test_"+pin+".*/";
			}
		},
		uart: [ "/dev/ttyO1", "/dev/ttyO2", "/dev/ttyO4", "/dev/ttyO5" ],
		gpio: 

	}


	if(this.os == 'beaglebone') {
		console.log("System Hostname is Beaglebone");
		console.log("Checking if PWM and UARTS are enabled");

		console.log("Check failed! Please add this line to the uEnv.txt file:");
		console.log("\toptargs=quiet drm.debug=7 capemgr.enable_partno=BB-UART1,BB-UART2,BB-UART4,BB-UART5,am33xx_pwm,bone_pwm_P8_13,bone_pwm_P8_19,bone_pwm_P8_34,bone_pwm_P8_36,bone_pwm_P9_28,bone_pwm_P9_29");

 		console.log("Initializing GPIOs");
		console.log("Configuring & Enabling PWMS (defaults to 0 duty cycle)");
	} else {
		console.log("Running on none Beagblebone platform.");
	}
}
Spine.prototype.handle = function(data) {
	console.log("No current handlers for Spine, found", data);
}; 

module.exports = exports = MindController;
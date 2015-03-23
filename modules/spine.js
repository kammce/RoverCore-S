"use strict";
/* 
 *	var s = require('./spine.js'); 
 *	s = new s();
 *
 *	s.expose("P9_41", "OUTPUT");
 *	s.digitalWrite("P9_41", 1);
 *
 *	s.expose("P9_42", "INPUT");
 *	s.digitalRead("P9_42");
 *
 */

function Spine(feedback) {
	var pinIndex = [
	    {
	        "name": "GPIO1_6",
	        "gpio": 38,
	        "key": "P8_3"
	    },
	    {
	        "name": "GPIO1_7",
	        "gpio": 39,
	        "key": "P8_4"
	    },
	    {
	        "name": "GPIO1_2",
	        "gpio": 34,
	        "key": "P8_5"
	    },
	    {
	        "name": "GPIO1_3",
	        "gpio": 35,
	        "key": "P8_6"
	    },
	    {
	        "name": "GPIO1_13",
	        "gpio": 45,
	        "key": "P8_11"
	    },
	    {
	        "name": "GPIO1_12",
	        "gpio": 44,
	        "key": "P8_12"
	    },
	    {
	        "name": "EHRPWM2B",
	        "gpio": 23,
	        "key": "P8_13"
	    },
	    {
	        "name": "GPIO0_26",
	        "gpio": 26,
	        "key": "P8_14"
	    },
	    {
	        "name": "GPIO1_15",
	        "gpio": 47,
	        "key": "P8_15"
	    },
	    {
	        "name": "GPIO1_14",
	        "gpio": 46,
	        "key": "P8_16"
	    },
	    {
	        "name": "GPIO0_27",
	        "gpio": 27,
	        "key": "P8_17"
	    },
	    {
	        "name": "GPIO2_1",
	        "gpio": 65,
	        "key": "P8_18"
	    },
	    {
	        "name": "EHRPWM2A",
	        "gpio": 22,
	        "key": "P8_19"
	    },
	    {
	        "name": "GPIO1_29",
	        "gpio": 61,
	        "key": "P8_26"
	    },
	    {
	        "name": "GPIO2_22",
	        "gpio": 86,
	        "key": "P8_27"
	    },
	    {
	        "name": "GPIO2_24",
	        "gpio": 88,
	        "key": "P8_28"
	    },
	    {
	        "name": "GPIO2_23",
	        "gpio": 87,
	        "key": "P8_29",
	    },
	    {
	        "name": "GPIO2_25",
	        "gpio": 89,
	        "key": "P8_30"
	    },
	    {
	        "name": "GPIO2_12",
	        "gpio": 76,
	        "key": "P8_39"
	    },
	    {
	        "name": "GPIO2_13",
	        "gpio": 77,
	        "key": "P8_40"
	    },
	    {
	        "name": "GPIO2_10",
	        "gpio": 74,
	        "key": "P8_41"
	    },
	    {
	        "name": "GPIO2_11",
	        "gpio": 75,
	        "key": "P8_42"
	    },
	    {
	        "name": "GPIO2_8",
	        "gpio": 72,
	        "key": "P8_43"
	    },
	    {
	        "name": "GPIO2_9",
	        "gpio": 73,
	        "key": "P8_44"
	    },
	    {
	        "name": "GPIO2_6",
	        "gpio": 70,
	        "key": "P8_45"
	    },
	    {
	        "name": "GPIO2_7",
	        "gpio": 71,
	        "key": "P8_46"
	    },
	    {
	        "name": "GPIO1_28",
	        "gpio": 60,
	        "key": "P9_12"
	    },
	    {
	        "name": "GPIO1_16",
	        "gpio": 48,
	        "key": "P9_15",
	    },
	    {
	        "name": "GPIO1_17",
	        "gpio": 49,
	        "key": "P9_23"
	    },
	    {
	        "name": "GPIO3_21",
	        "gpio": 117,
	        "key": "P9_25"
	    },
	    {
	        "name": "GPIO3_19",
	        "gpio": 115,
	        "key": "P9_27"
	    },
	    {
	        "name": "GPIO0_20",
	        "gpio": 20,
	        "key": "P9_41",
	    },
	    {
	        "name": "GPIO0_7",
	        "gpio": 7,
	        "key": "P9_42",
	    }
	];
	
	this.pins = {};
	this.hardware = {
		pwms: ["P8_13", "P8_19", "P8_34", "P8_36", "P9_28", "P9_29"],
		uarts: ["/dev/ttyO1", "/dev/ttyO2", "/dev/ttyO4", "/dev/ttyO5" ],
		gpios: {
			"P8_39": "/sys/class/gpio/gpio76",
			"P8_40": "/sys/class/gpio/gpio77",
			"P8_41": "/sys/class/gpio/gpio74",
			"P8_42": "/sys/class/gpio/gpio75",
			"P8_43": "/sys/class/gpio/gpio72",
			"P8_44": "/sys/class/gpio/gpio73"
		}
	}

	/*
	function uEnvMsg() {
		console.log("Please add this line to the /boot/uboot/uEnv.txt file: ");
		console.log("\t optargs=quiet drm.debug=7 capemgr.enable_partno=BB-UART1,BB-UART2,BB-UART4,BB-UART5,am33xx_pwm,bone_pwm_P8_13,bone_pwm_P8_19,bone_pwm_P8_34,bone_pwm_P8_36,bone_pwm_P9_28,bone_pwm_P9_29,BB-I2C0,BB-I2C1");
	}*/
	console.log("Systems Check...");
	if(os.hostname() == 'beaglebone') {
		console.log("System Hostname is Beaglebone");
		console.log("Setting up UARTS");

		var slots_path = glob.sync("/sys/devices/bone_capemgr.*/slots"); 
		if(slots_path.length == 0) {
			console.log("Could not find bone cape manager slots file!");
			return;
		}
		// Inserting firmware into Device tree structure slots.

		console.log("Setting up UARTs");	
		fs.writeFileSync(slots_path, "BB-UART1");
		fs.writeFileSync(slots_path, "BB-UART2");
		fs.writeFileSync(slots_path, "BB-UART4");
		fs.writeFileSync(slots_path, "BB-UART5");
		console.log("\tUARTs set");

		console.log("Setting up I2Cs");
		fs.writeFileSync(slots_path, "BB-I2C0");
		fs.writeFileSync(slots_path, "BB-I2C1");
		console.log("\tI2Cs set");

		console.log("Setting up PWMs");
		fs.writeFileSync(slots_path, "am33xx_pwm");
		fs.writeFileSync(slots_path, "bone_pwm_P8_13_custom");
		fs.writeFileSync(slots_path, "bone_pwm_P8_19_custom");
		fs.writeFileSync(slots_path, "bone_pwm_P8_34_custom");
		fs.writeFileSync(slots_path, "bone_pwm_P8_36_custom");
		fs.writeFileSync(slots_path, "bone_pwm_P9_28_custom");
		fs.writeFileSync(slots_path, "bone_pwm_P9_29_custom");
		console.log("\tPWMs set");
		
		console.log("Exporting GPIOs");
		for (var i = 72; i <= 77; ++i) {
			if(!fs.existsSync("/sys/class/gpio/gpio"+i)) {
				fs.writeFileSync("/sys/class/gpio/export", i+"");
			}
		};
		console.log("Setting up GPIOs");
		for (var i = 72; i <= 77; ++i) {
			fs.writeFileSync("/sys/class/gpio/gpio"+i+"/active_low", 0);
			fs.writeFileSync("/sys/class/gpio/gpio"+i+"/direction", "out");
			fs.writeFileSync("/sys/class/gpio/gpio"+i+"/edge", "none");
			fs.writeFileSync("/sys/class/gpio/gpio"+i+"/value", 0);
		};
		console.log("\tGPIO Setup complete");

		this.pins = {};
		for(var i in pinIndex) {
		    this.pins[pinIndex[i].key] = pinIndex[i];
		}
	} else {
		console.log("Running on none Beagblebone platform.");
	}
}
Spine.prototype.setPWM = function(_pin, percent) {
	if(typeof percent != "number") {
		console.log("Invalid pwm value, must between 0.0 and 1.0 ");
		return false;
	}
	if(percent > 1 || percent < 0) {
		console.log("Invalid pwm value, must between 0.0 and 1.0 ");
		return false;
	}
	var map = {
		"P8_13": 0,
		"P8_19": 1,
		"P8_34": 2,
		"P8_36": 3,
		"P9_28": 4,
		"P9_29": 5
	};
	var path = this.hardware.pwms[map[_pin]];
	if(typeof path == "undefined") {
		console.log("Invalid pwm pin: "+_pin);  
		return;
	}
	var maxnsec = 500000;
	var duty = Math.round(maxnsec*percent)+"";
	fs.writeFile(path+"/duty", duty);
	return true;
}; 
Spine.prototype.digitalWrite = function(_pin, level) {
	if(typeof level != "number") {
		console.log("Invalid pin value, must between 0 and 1.");
		return false;
	}
	if(level != 1 && level != 0) {
		console.log("Invalid pin value, must be 0 and 1.");
		return false;
	}
	var path = this.hardware.gpios[_pin];
	if(typeof path == "undefined") {
		console.log("Invalid gpio pin: "+_pin);  
		return;
	}
	fs.writeFile(path+"/value", level);
	return true;
}; 
Spine.prototype.digitalRead = function(_pin) {
	var path = this.hardware.gpios[_pin];
	if(typeof path == "undefined") {
		console.log("Invalid gpio pin: "+_pin);  
		return;
	}
	//fs readFileSync returns a buffer with two bytes.
	//The buffer has binary numbers.
	//Sub 48 to get 0 or 1 values.
	return (fs.readFileSync(path+"/value")[0]-48);
}; 
Spine.prototype.expose = function(_pin, direction) {
	if(typeof this.pins[_pin] == "undefined") {
		console.log("Invalid pin");
		return false;
	}

	if(direction != "OUTPUT" && direction != "INPUT") {
		console.log("Invalid direction, must be OUTPUT or INPUT");
		return false;
	}
	
	var gpio = this.pins[_pin]["gpio"];
	var dir = (direction == "OUTPUT") ? "out" : "in";

	if(!fs.existsSync("/sys/class/gpio/gpio"+gpio)) {
		fs.writeFileSync("/sys/class/gpio/export", gpio+"");
	}
	fs.writeFileSync("/sys/class/gpio/gpio"+gpio+"/active_low", 0);
	fs.writeFileSync("/sys/class/gpio/gpio"+gpio+"/direction", dir);
	fs.writeFileSync("/sys/class/gpio/gpio"+gpio+"/edge", "none");
	if(dir == "out") {
		fs.writeFileSync("/sys/class/gpio/gpio"+gpio+"/value", 0);	
	}
	this.hardware.gpios[_pin] = "/sys/class/gpio/gpio"+gpio;
	return true;
}; 

module.exports = exports = Spine;

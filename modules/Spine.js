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

class Spine {
	constructor() {

	}
}
Spine.pinIndex = [
	{
		"gpio": 15,
		"key": 18
	},
	{
		"gpio": 18,
		"key": 19
	},
	{
		"gpio": 13,
		"key": 21
	},
	{
		"gpio": 17,
		"key": 22
	},
	{
		"gpio": 26,
		"key": 24
	},
	{
		"gpio": 24,
		"key": 25
	},
	{
		"gpio": 20,
		"key": 28
	},
	{
		"gpio": 21,
		"key": 29
	},
	{
		"gpio": 19,
		"key": 30
	},
	{
		"gpio": 22,
		"key": 31
	},
	{
		"gpio": 11,
		"key": 190
	},
	{
		"gpio": 9,
		"key": 191
	},
	{
		"gpio": 7,
		"key": 192
	}
];


function Spine(feedback) {
	
	
	this.pins = {};
	this.hardware = {
		// Labels for PWM pins
		pwms: ["P8_13", "P8_19", "P8_34", "P8_36", "P9_28", "P9_29"],
		// UART communication devices
		uarts: ["/dev/ttyO1", "/dev/ttyO2", "/dev/ttyO4", "/dev/ttyO5" ],
		// Motor Control GPIOs
		gpios: {
			"P8_39": "/sys/class/gpio/gpio76",
			"P8_40": "/sys/class/gpio/gpio77",
			"P8_41": "/sys/class/gpio/gpio74",
			"P8_42": "/sys/class/gpio/gpio75",
			"P8_43": "/sys/class/gpio/gpio72",
			"P8_44": "/sys/class/gpio/gpio73"
		}
	}

	function loadFirmware(path, firmware) {
		try {
			console.log("Loading Firmware "+firmware);
			fs.writeFileSync(path, firmware);
		} catch(e) {
			console.log("DTS "+firmware+" is already loaded");
			//console.log(e);
		}
	}
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
		
		slots_path = slots_path[0];

		console.log("Setting up UARTs");	
		loadFirmware(slots_path, "BB-UART1");
		loadFirmware(slots_path, "BB-UART2");
		loadFirmware(slots_path, "BB-UART4");
		loadFirmware(slots_path, "BB-UART5");
		console.log("\tUARTs set");

		console.log("Setting up I2Cs");
		loadFirmware(slots_path, "BB-I2C0");
		loadFirmware(slots_path, "BB-I2C1");
		console.log("\tI2Cs set");

		console.log("Setting up PWMs");
		loadFirmware(slots_path, "am33xx_pwm");
		loadFirmware(slots_path, "BONE_PWM_A");
		loadFirmware(slots_path, "BONE_PWM_B");
		loadFirmware(slots_path, "BONE_PWM_C");
		loadFirmware(slots_path, "BONE_PWM_D");
		loadFirmware(slots_path, "BONE_PWM_E");
		loadFirmware(slots_path, "BONE_PWM_F");
		console.log("\tPWMs set");
	
		console.log("Checking if PWMs are enabled");
		for (var i = this.hardware.pwms.length - 1; i >= 0; i--) {
			var path = glob.sync("/sys/devices/ocp.*/pwm_test_"+this.hardware.pwms[i]+".*/");
			if(path.length == 0) {
				console.log("Not all PWMs are initalized!");
				break;
			}
			this.hardware.pwms[i] = path[0];
		};
		console.log("PWMS exist and paths generated.");
		console.log("\tPWM Check complete");

		console.log("Setting up PWMs");
		// NOTE: This has been removed because polarity and duty cycle are set to 0 by default in the firmware configurations.
		/*
		for (var i = this.hardware.pwms.length - 1; i >= 0; i--) {
			var path = this.hardware.pwms[i];
			console.log(path);
			fs.writeFileSync(path+"polarity", "0");
			fs.writeFileSync(path+"duty", "0");
		};
		*/
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
		console.log(this.pins);
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
	fs.writeFile(path+"/duty", duty, function(){});
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
	fs.writeFile(path+"/value", level, function(){});
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
		console.log("Invalid pin "+_pin);
		console.log(this.pins[_pin]);
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



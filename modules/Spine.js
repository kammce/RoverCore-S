"use strict";
/* 
 *	var Spine = require('./spine.js'); 
 *	var spine = new Spine();
 *
 *	spine.expose(18, "OUTPUT");
 *	spine.digitalWrite(7, 1);
 *
 *	spine.expose(15, "INPUT");
 *	spine.digitalRead(15);
 *
 */

var fs = require('fs');
var os = require('os');

class Spine {
	constructor() {
		console.log("Systems Check...");
		if(os.hostname() === 'odroid') {
			console.log("System Hostname is Odroid");
			this.constructor.pins = {};
			for(var i in this.constructor.pinIndex) {
			    this.constructor.pins[this.constructor.pinIndex[i].key] = this.constructor.pinIndex[i];
			}
		} else {
			console.log("Running on none Odroid platform.");
		}
	}
}
Spine.pins = {};
Spine.pinIndex = [ 
	{ "gpio": 18,  "key": 15 },
	{ "gpio": 19,  "key": 18 },
	{ "gpio": 21,  "key": 13 },
	{ "gpio": 22,  "key": 17 },
	{ "gpio": 24,  "key": 26 },
	{ "gpio": 25,  "key": 24 },
	{ "gpio": 28,  "key": 20 },
	{ "gpio": 29,  "key": 21 },
	{ "gpio": 30,  "key": 19 },
	{ "gpio": 31,  "key": 22 },
	{ "gpio": 190, "key": 11 },
	{ "gpio": 191, "key": 9 },
	{ "gpio": 192, "key": 7 }
];

Spine.digitalWrite = function(_pin, level) {
	if(typeof level !== "number") {
		console.log("Invalid pin value, must between 0 and 1.");
		return false;
	}
	if(level !== 1 && level !== 0) {
		console.log("Invalid pin value, must be 0 and 1.");
		return false;
	}
	var path = this.constructor.hardware.gpios[_pin];
	if(typeof path === "undefined") {
		console.log("Invalid gpio pin: "+_pin);  
		return;
	}
	fs.writeFile(path+"/value", level, function(){});
	return true;
}; 
Spine.digitalRead = function(_pin) {
	var path = this.constructor.hardware.gpios[_pin];
	if(typeof path === "undefined") {
		console.log("Invalid gpio pin: "+_pin);  
		return;
	}
	//fs readFileSync returns a buffer with two bytes.
	//The buffer has binary numbers.
	//Sub 48 to get 0 or 1 values.
	return (fs.readFileSync(path+"/value")[0]-48);
}; 
Spine.expose = function(_pin, direction) {
	if(typeof this.constructor.pins[_pin] === "undefined") {
		console.log("Invalid pin "+_pin);
		console.log(this.constructor.pins[_pin]);
		return false;
	}

	if(direction !== "OUTPUT" && direction !== "INPUT") {
		console.log("Invalid direction, must be OUTPUT or INPUT");
		return false;
	}
	
	var gpio = this.constructor.pins[_pin]["gpio"];
	var dir = (direction === "OUTPUT") ? "out" : "in";

	if(!fs.existsSync("/sys/class/gpio/gpio"+gpio)) {
		fs.writeFileSync("/sys/class/gpio/export", gpio+"");
	}
	fs.writeFileSync("/sys/class/gpio/gpio"+gpio+"/active_low", 0);
	fs.writeFileSync("/sys/class/gpio/gpio"+gpio+"/direction", dir);
	fs.writeFileSync("/sys/class/gpio/gpio"+gpio+"/edge", "none");
	if(dir === "out") {
		fs.writeFileSync("/sys/class/gpio/gpio"+gpio+"/value", 0);	
	}
	this.constructor.hardware.gpios[_pin] = "/sys/class/gpio/gpio"+gpio;
	return true;
}; 

module.exports = exports = Spine;
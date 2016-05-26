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
		this.pins = {};
		this.pinIndex = [ 
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
		for(var i in this.pinIndex) {
		    this.pins[this.pinIndex[i].key] = this.pinIndex[i];
		}
		console.log(this.pins);
	}
	digitalWrite(_pin, level) {
		if(level !== 1 && level !== 0) {
			console.log("Invalid pin value, must be 0 and 1.");
			return false;
		}
		var path = "/sys/class/gpio/gpio"+this.pins[_pin]["gpio"];
		fs.writeFile(path+"/value", level, function(){});
		return true;
	}

	digitalRead(_pin) {
		var path = "/sys/class/gpio/gpio"+this.pins[_pin]["gpio"];
		if(typeof path === "undefined") {
			console.log("Invalid gpio pin: "+_pin);  
			return;
		}
		//fs readFileSync returns a buffer with two bytes.
		//The buffer has binary numbers.
		//Sub 48 to get 0 or 1 values.
		return (fs.readFileSync(path+"/value")[0]-48);
	}

	expose(_pin, direction) {
		if(typeof this.pins[_pin] === "undefined") {
			console.log("Invalid pin "+_pin);
			console.log(this.pins[_pin]);
			return false;
		}

		if(direction !== "OUTPUT" && direction !== "INPUT") {
			console.log("Invalid direction, must be OUTPUT or INPUT");
			return false;
		}
		
		var gpio = this.pins[_pin]["gpio"];
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
		return true;
	}
}

module.exports = Spine;
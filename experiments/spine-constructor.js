"use strict";

class Spine {
	constructor() {
		this.constructor.pins = {};
		for(var i in this.constructor.pinIndex) {
		    this.constructor.pins[this.constructor.pinIndex[i].key] = this.constructor.pinIndex[i];
		}
		console.log(this.constructor.pins);
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
Spine.hardware = {};

var s = new Spine();

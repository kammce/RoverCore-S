"use strict";

class PWMDriverTest{				
	constructor() {
		this.dutyPin = [];
		this.microPin = [];
		this.dutyValue = [];
		this.microValue = [];
	}
	setDUTY(pin, duty) {					
		this.dutyPin.push(pin);
		this.dutyValue.push(duty);
	}
	setMICRO(pin, micro) {					
		this.microPin.push(pin);
		this.microValue.push(micro);
	}
}

module.exports = PWMDriverTest;
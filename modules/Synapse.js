"use strict";

var Brainstem = require('./Brainstem');

class Synapse {
	constructor(i2c_address, net_address, priority) {
		this.i2c_address = i2c_address;
		this.net_address = net_address;
		this.priority = priority;
	}
	write(data, callback) {
		var buffer;
		if(Buffer.isBuffer(data)) {
			buffer = data;
		} else {
			buffer = new Buffer(data);
		}

		Brainstem.queuePacket({
			net_address: this.net_address, 
			i2c_address: this.i2c_address, 
			priority: this.priority,
			buffer: buffer,
			callback: callback
		});
	}
	read(length, callback) {
		if(!Number.isInteger(length)) {
			throw new Error("First parameter 'Read' length must be an integer");
		}
		Brainstem.queuePacket({
			net_address: this.net_address, 
			i2c_address: this.i2c_address, 
			priority: this.priority,
			buffer: length,
			callback: callback
		});
	}
}

module.exports = Synapse;
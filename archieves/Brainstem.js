"use strict";

class Brainstem {
	constructor() {
		this.network_address = 0;
	}
	setNetAddress(addr) {
		if(typeof addr === "number") {
			if(addr >= 0 && addr <= 7) {
				this.network_address = addr;
			}
		}
	}
	getNextPacket() {
		return this.constructor.queue.shift();
	}
}
// NOTE: to make this queue more efficent,
// 		create an array that allocates 2000 
//		elements that does not expand.
Brainstem.queue = [];
Brainstem.queuePacket = function(param) {
	// Check parameter
	if(typeof param !== "object") {
		throw new Error("Invalid input");
	}

	// Check net_address
	if(typeof param['net_address'] !== "number") {
		throw new Error("Invalid net_address type");
	}
	if(param['net_address'] < 0 || param['net_address'] > 7) {
		throw new Error("Invalid net_address value");
	}
	// Check i2c_address
	if(typeof param['i2c_address'] !== "number") {
		throw new Error("Invalid i2c_address type");
	}
	if(param['i2c_address'] <= 0x07 || param['i2c_address'] > 0xC7) {
		throw new Error("Invalid i2c_address value");
	}
	// Check priority
	if(typeof param['priority'] !== "number") {
		throw new Error("Invalid priority type");
	}
	if(param['priority'] < 0 || param['priority'] > 2) {
		throw new Error("Invalid priority value");
	}
	// Check write_buffer_or_read_length
	if(typeof param['buffer'] !== "number" && 
		!Buffer.isBuffer(param['buffer'])) {
		throw new Error("Invalid buffer type");
	}
	// Place into Queue
	if(param['priority'] === 0x0) {
		Brainstem.queue.unshift(param);
	} else {
		Brainstem.queue.push(param);
	}
};
/*
{
	net_addr: hex(0-7), 
	i2c_addr: hex(), 
	priority: integer(0-3), 
	buffer: <buffer> | integer
	write: true/false,
	callback: function() {}
}
*/

module.exports = Brainstem;
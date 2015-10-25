"use strict";

var Brainstem = require('../../../modules/Brainstem');

describe('Testing Brainstem Class', function () {
	var test_unit = new Brainstem();

	function arePacketsEqual(a,b) {
		if(a['net_address'] !== b['net_address']) {
			throw new Error(`net_address do not equal, ${a['net_address']} :: ${b['net_address']}`);
			return false;	
		} else if(a['i2c_address'] !== b['i2c_address']) {
			throw new Error(`i2c_address do not equal, ${a['i2c_address']} :: ${b['i2c_address']}`);
			return false;
		} else if(a['priority'] !== b['priority']) {
			throw new Error(`priority do not equal, ${a['priority']} :: ${b['priority']}`);
			return false;
		} 
		if(typeof a['buffer'] === "number" && typeof b['buffer'] === "number") {
			if(a['buffer'] !== b['buffer']) {
				throw new Error(`buffer do not equal, ${a['buffer']} :: ${b['buffer']}`);
				return false;
			} 	
		} else {
			if(!a['buffer'].equals(b['buffer'])) {
				throw new Error(`buffer do not equal, ${a['buffer']} :: ${b['buffer']}`);
				return false;
			}
		}
		return true;
	}

	describe('Testing static queuePacket() method', function () {
		it('Single Byte Write.', function () {
			Brainstem.queue = [];
			
			var packet = {
				net_address: 0, 
				i2c_address: 0x08, 
				priority: 0x1,
				buffer: new Buffer([0xAA]),
				callback: function() {}
			};

			Brainstem.queuePacket(packet);

			expect(arePacketsEqual(Brainstem.queue[0], packet), "Queue and Expected value do not match").to.be.true;

		});
		it('Two Byte Write.', function () {
			Brainstem.queue = [];
			var packet0 = {
				net_address: 0, 
				i2c_address: 0x08, 
				priority: 0x1,
				buffer: new Buffer([0xAA]),
				callback: function() {}
			};
			var packet1 = {
				net_address: 1, 
				i2c_address: 0x09, 
				priority: 0x02, 
				buffer: new Buffer([0xAB]),  
				callback: function() {}
			};

			Brainstem.queuePacket(packet0);
			Brainstem.queuePacket(packet1);

			expect(arePacketsEqual(Brainstem.queue[0], packet0), "Queue and Expected value do not match").to.be.true;

			expect(arePacketsEqual(Brainstem.queue[1], packet1), "Queue and Expected value do not match").to.be.true;

			expect(Brainstem.queue.length).to.equal(2);
		});
		it('Set an Immediate Write Packet.', function () {
			Brainstem.queue = [];
			
			var packet0 = {
				net_address: 0, 
				i2c_address: 0x08, 
				priority: 0x1,
				buffer: new Buffer([0xAA]),
				callback: function() {}
			};
			
			var packet1 = {
				net_address: 1, 
				i2c_address: 0x09, 
				priority: 0x00, 
				buffer: new Buffer([0xAB]),  
				callback: function() {}
			};

			Brainstem.queuePacket(packet0);
			Brainstem.queuePacket(packet1);

			// The packet with priority 0 should be place in the front of the line.
			expect(arePacketsEqual(Brainstem.queue[0],packet1), "Queue and Expected value do not match").to.be.true;
			//
			expect(arePacketsEqual(Brainstem.queue[1],packet0), "Queue and Expected value do not match").to.be.true;

			expect(Brainstem.queue.length).to.equal(2);
		});
	});
	describe('Testing getNextPacket() method', function () {
		it('Testing getNextPacket()', function () {
			var test_unit = new Brainstem();
			var packet0 = {
				net_address: 0, 
				i2c_address: 0xA1, 
				priority: 1,
				buffer: 4, // read 4 bytes
				callback: function() {}
			};
			var packet1 = {
				net_address: 0, 
				i2c_address: 0xA0, 
				priority: 1,
				buffer: new Buffer([0xAA, 0xBB, 0xCC]),
				callback: function() {}
			};
			Brainstem.queue = [packet0, packet1];
			var packet_returned = test_unit.getNextPacket();

			expect(arePacketsEqual(packet_returned,packet0), "Queue and Expected value do not match").to.be.true;

			expect(arePacketsEqual(Brainstem.queue[0],packet1), "Queue and Expected value do not match").to.be.true;

			expect(Brainstem.queue.length).to.equal(1);
		});
	});
});
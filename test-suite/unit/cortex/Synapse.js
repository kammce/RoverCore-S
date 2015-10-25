"use strict";

var Brainstem = require('../../../modules/Brainstem');
var Synapse = require('../../../modules/Synapse');

describe('Testing Brainstem Class', function () {
	
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

	describe('Testing write()', function () {
		it('After a successful write command, Brainstem.queue should have packet.', function () {
			Brainstem.queue = [];
			
			var test_unit = new Synapse(0x08, 2, 2);
			
			test_unit.write([0xAA], function() {
				return true;
			});

			var expected_packet = {
				net_address: 2, 
				i2c_address: 0x08, 
				priority: 2,
				buffer: new Buffer([0xAA]),
				callback: function() {}
			};

			expect(arePacketsEqual(Brainstem.queue[0], expected_packet), "Queue and Expected value do not match").to.be.true;
		});
	});

	describe('Testing read()', function () {
		it('After a successful write command, Brainstem.queue should have packet.', function () {
			Brainstem.queue = [];
			
			var test_unit = new Synapse(0x08, 2, 2);
			
			test_unit.read(4, function(buffer) {
				return true;
			});

			var expected_packet = {
				net_address: 2,
				i2c_address: 0x08,
				priority: 2,
				buffer: 4,
				callback: function() {}
			};

			expect(arePacketsEqual(Brainstem.queue[0], expected_packet), "Queue and Expected value do not match").to.be.true;
		});
	});
});
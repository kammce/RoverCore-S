"use strict";

var sinon = require('sinon');

describe('Testing BatteryManager Class', function () {
	// Loading Libraries
	var BatteryManager = require('../../../modules/BatteryManager/BatteryManager');
	var Log = require('../../../modules/Log');
	var Model = require('../../../modules/Model');
	var model = new Model(function() {});

	class SerialPort {
		constructor() {
			this.event_callback = function() {};
			this.counter = 0;
			this.sent = "";
		}
		on(event, callback) {
			this.event_callback = callback;
		}
		write(buffer, callback) {
			this.counter++;
			this.sent = buffer;
		}
	}
	function Serial() {}
	Serial.parsers = { readline: function() {} };
	Serial.SerialPort = SerialPort;

	var log = new Log();
	var upcalled = false;
	var signal = "";
	var upcall = function(SIGNAL) { upcalled = true; signal = SIGNAL; };
	var empty_funct = function(){};
	var unit = new BatteryManager("BatteryManager", empty_funct, log, 0, empty_funct, model, Serial, upcall);

	describe('Test serialport interval is sending data', function() {
		before(function() {
			unit.serialport.sent = "";
		});
		it('Test serialport interval is sending data', function (done) {
			this.timeout = 2000;
			setTimeout(function() {
				expect(unit.serialport.counter).to.be.above(0);
				expect(unit.serialport.sent).to.equal("\x06");
				unit.serialport.counter = 0;
				done();
			}, 1000);
		});
	});


	describe('Testing BatteryManager Updating model', function () {
		it('Test serialport.on is retrieving data is recieving data', function () {
			var payload = "t123S45C6789V24I5T223";
			unit.serialport.event_callback(payload);
			// t****S*C---*****V-***I****
			expect(model.get("Battery").time_passed).to.equal(123);
			expect(model.get("Battery").soc).to.equal(45);
			expect(model.get("Battery").capacity_left).to.equal(6789);
			expect(model.get("Battery").voltage).to.equal(24);
			expect(model.get("Battery").current).to.equal(5);   
			expect(model.get("Battery").temperature).to.equal(223);     
	    });
	});
	describe('Testing emergency and normal shutdown signals', function() {
		before(function() {
			upcalled = false;
			signal = "";
			unit.serialport.sent
		});
	    it('Should make sure emergency shutdown sends emergency shutdown signal', function () {
			unit._react("emergency-shutdown");
			expect(unit.serialport.sent).to.equal("\x02");
		});
	    it('Should make sure shutdown sends shutdown signal', function () {
			unit._react("shutdown");
			// 0111 1111 = 1111 = 15 seconds & 0x3 for shutdown
			expect(upcalled).to.be.true;
			expect(signal).to.equal("HALTALL");
			expect(unit.serialport.sent).to.equal("\x3F");
			//Upcall halt-all
			//Upcall shutdown
		});
	});
	describe('Testing Disable & Enable Reacts', function() {
		/*
		 *	0x4 - Disable specified power converter
		 *		The most significant two bits will specify which converter to disable.
		 *		The rest of the bits (bits 5-3) specify the delay in seconds before disabling the converter.
		 *		Visual bit format for sending the command:
		 *		CC TTT 100
		 *		CC - Converter to disable
		 *		TTT - Time delay
		 *		100 - 0x4 disable command
		 */
		it('Should send signal to disable then enable front drive servo rail', function() {
			// rail 0x0
			unit._react({
				action: "disable",
				rail: "5V"
			});
			//  00 000 100 = 0000 0100
			expect(unit.serialport.sent).to.equal("\x04");
			unit._react({
				action: "enable",
				rail: "5V"
			});
			//  00 000 101 = 0000 0101
			expect(unit.serialport.sent).to.equal("\x05");
		});
		it('Should send signal to disable then enable back drive servo rail', function() {
			// rail 0x1
			unit._react({
				action: "disable",
				rail: "steering"
			});
			//  01 000 100 = 1000 0100
			expect(unit.serialport.sent).to.equal("\x44");
			unit._react({
				action: "enable",
				rail: "steering"
			});
			expect(unit.serialport.sent).to.equal("\x45");
		});
		it('Should send signal to disable then enable fan firgelli 12V rail', function() {
			// rail 0x2
			unit._react({
				action: "disable",
				rail: "arm"
			});
			//  01 000 100 = 1000 0100
			expect(unit.serialport.sent).to.equal("\x84");
			unit._react({
				action: "enable",
				rail: "arm"
			});
			expect(unit.serialport.sent).to.equal("\x85");
		});
		it('Should send signal to disable then enable arm servo rail', function() {
			// rail 0x3
			unit._react({
				action: "disable",
				rail: "12V"
			});
			expect(unit.serialport.sent).to.equal("\xC4");
			unit._react({
				action: "enable",
				rail: "12V"
			});
			expect(unit.serialport.sent).to.equal("\xC5");
		});
	});
	describe('Testing Halting and Resuming Upcalls from battery manager', function() {
		beforeEach(function() {
			upcalled = false;
			signal = "";
		});
		it('Should upcall halt all', function() {
			unit._react("halt-all");
			expect(upcalled).to.equal(true);
			expect(signal).to.equal("HALTALL");
		});
		it('Should upcall halt all', function() {
			unit._react("resume-all");
			expect(upcalled).to.equal(true);
			expect(signal).to.equal("RESUMEALL");
		});
	});
});
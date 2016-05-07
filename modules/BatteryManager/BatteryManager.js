"use strict";

var Neuron = require('../Neuron');

class BatteryManager extends Neuron {
	constructor(util) {
        super(util);
        this.name = util.name;
        this.feedback = util.feedback;
        this.log = util.log;
        this.idle_time = util.idle_timeout;
        this.i2c = util.i2c;
        this.model = util.model;
        this.upcall = util.upcall;
		// Construct Class here
		this.serialport = new util.serial.SerialPort("/dev/ttyUSB-BATTERY0", {
			baudrate: 115200,
			parser: util.serial.parsers.readline('\n')
		}); // false = disable auto open

		var parent = this;
		// Continously request data from battery
		function request() {
			setTimeout(() => {
				parent.serialport.write("\x06");
			}, 1000);
		}

		// var serialOpenRoutine = (err) => {
		// 	if (err) { 
		// 		this.serialport.close();
		// 		setTimeout(() => {
		// 			this.serialport.open();
		// 		}, 1000);
		// 		return;
		// 	}
		// 	request();
		// };

		// this.serialport.open(serialOpenRoutine);
		
		// Register memory in model
		this.model.registerMemory("Battery");

		// Battery should respond with a request for all data,
		// This listener should parse it and store it in the model
		this.serialport.on("data", (data) => {
			//this.log.output(data);
			if(data[0] === 'e') {
				switch(data[1]) {
					case "I":
						this.log.output("overcurrent!");
						break;
					case "V":
						this.log.output("undervoltage!");
						break;
					case "C":
						this.log.output("low capacity!");
						break;
					case "T":
						this.log.output("overtemperature!");
						break;
				}
				return;
			}
			//this.log.output(this.model.get("Battery"));
			//"t\x01\x02S\x03C\x04\x05\x06\x07V\x08\x09I\x0A\x0B"
			var data_array 	= data.split(/[a-zA-Z]/g);
			// Convert String into a binary string (buffer)
			// Read binary string with an offset of 1 character to skip 
			// Identifier character.
			/*
			var time_passed 	= new Buffer(data_array[1]).readUInt16BE();
			var soc 			= new Buffer(data_array[2]).readUInt8();
			var capacity_left 	= new Buffer(data_array[3]).readUInt32BE();
			var voltage 		= new Buffer(data_array[4]).readUInt16BE();
			var current 		= new Buffer(data_array[5]).readUInt16BE();
			*/
			try {
				var time_passed 	= parseInt(data_array[1]); // seconds
				var soc 			= parseInt(data_array[2]); // %
				var capacity_left 	= parseInt(data_array[3]); // mAh
				var voltage 		= parseFloat(data_array[4]); // Volts
				var current 		= parseFloat(data_array[5]); // mA
				var temperature 	= parseFloat(data_array[6]); // Celcius

				this.model.set("Battery", {
					time_passed: time_passed,
					soc: soc,
					capacity_left: capacity_left,
					voltage: voltage,
					current: current,
					temperature: temperature
				});
			} catch(e) {
				this.log.output("Did not handle battery input ", e);
				this.feedback("Did not handle battery input ", e);
			}
			// Continously request data from battery
			request();
		});
		request();
	}
	react(input) {
		// this.log.output(`REACTING ${this.name}: `, input);
		// this.feedback(this.name ,`REACTING ${this.name}: `, input);
		if(typeof input === "string") {
			switch(input) {
				case "emergency-shutdown":
					this.serialport.write("\x02");
					break;
				case "shutdown":
					this.upcall("HALTALL");
					this.serialport.write("\x3F");
					break;
				case "halt-all":
					this.upcall("HALTALL");
					break;
				case "resume-all":
					this.upcall("RESUMEALL");
					break;
				default:
					this.log.output("Invalid command sent to battery manager", input);
					break;
			}
		} else if(typeof input === "object") {
			if(input.hasOwnProperty('action') && input.hasOwnProperty('rail')) {
				this.toggleRail(input);
			} else {
				this.log.output("Invalid command sent to battery manager", input);
			}

		}
	}
	toggleRail(rail) {
		var actions = {
			"disable": {
				"5V": '\x04',
				"steering": '\x44',
				"arm": '\x84',
				"12V": '\xC4'
			},
			"enable": {
				"5V": '\x05',
				"steering": '\x45',
				"arm": '\x85',
				"12V": '\xC5'
			}
		};
		try {
			this.serialport.write(actions[rail['action']][rail['rail']]);
		} catch(e) {
			this.log.output(e);
		}
	}
	halt() {
		this.log.output(`HALTING ${this.name}`);
		this.feedback(this.name ,`HALTING ${this.name}`);
	}
	resume() {
		this.log.output(`RESUMING ${this.name}`);
		this.feedback(this.name ,`RESUMING ${this.name}`);
	}
	idle() {
		this.log.output(`IDLING ${this.name}`);
		this.feedback(this.name ,`IDLING ${this.name}`);
	}
}

module.exports = BatteryManager;
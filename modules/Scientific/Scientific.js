"use strict";

var Neuron = require('../Neuron');
var fs = require('fs');

class Scientific extends Neuron {
	constructor(util) {
		super(util);
		this.name = util.name;
		this.feedback = util.feedback;
		this.log = util.log;
		this.idle_time = util.idle_timeout;
		this.i2c = util.i2c;
		this.model = util.model;

		const SENSOR_PATH = "/dev/ttySCIENCE";
		const LID_PATH = "/dev/ttyLID";

		this.model.registerMemory("SENSORS");

		this.model.set("SENSORS", {
			moisture: 0,
			temperature: 0,
		});

		// Name of stdout file
		var output_file = `${__dirname}/science-${Date().slice(0,-15)}.log`.replace(/[ :]/g, '-');
		// Generate the output file along with a write stream to it
		this.writeScience = fs.createWriteStream(output_file);

		this.sensor_port = new util.serial.SerialPort(SENSOR_PATH, {
			baudRate: 1200,
			parser: util.serial.parsers.readline("\r\n")
		}, false);
		this.lid_port = new util.serial.SerialPort(LID_PATH, { baudrate: 9600 }, false);

		this.sensor_port.open((err) => {});
		this.lid_port.open((err) => {});

		this.writeScience.write('datetime, temperature, moisture\n');

		this.sensor_port.on('data', (data) => {
			var current_memory = this.model.get("SENSORS");
			this.log.output(data.toString());
			if(/T[0-9\.]/g.test(data)) {
				var temp = parseFloat(data.substring(1));
				if(!isNaN(temp)) {
					current_memory['temperature'] = temp;
					this.model.set("SENSORS", current_memory);
					this.writeScience.write(`${Date().slice(0,-15)},${current_memory['temperature']}, ${current_memory['moisture']}\n`);
				}
			} else if(/M[0-9\.]/g.test(data)) {
				var temp = parseFloat(data.substring(1));
				if(!isNaN(temp)) {
					current_memory['moisture'] = temp;
					this.model.set("SENSORS", current_memory);
					this.writeScience.write(`${Date().slice(0,-15)},${current_memory['temperature']}, ${current_memory['moisture']}\n`);
				}
			}
		});
	}

	react(input) {
		switch(input)
		{
			case "LID_OPEN":
				if(this.lid_port.isOpen()) {
					this.lid_port.write("1\r\n");
				}
				break;
			case "LID_CLOSE":
				if(this.lid_port.isOpen()) {
					this.lid_port.write("0\r\n");
				}
				break;
			default:
				this.log.output("invalid lid command sent")
				break;
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

module.exports = Scientific;
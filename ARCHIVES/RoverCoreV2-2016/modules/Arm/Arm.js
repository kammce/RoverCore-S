"use strict";

var Neuron = require('../Neuron');

class Arm extends Neuron {
	constructor(util) {
		super(util);
		this.name = util.name;
		this.feedback = util.feedback;
		this.log = util.log;
		this.idle_time = util.idle_timeout;
		this.i2c = util.i2c;
		this.model = util.model;

		var parent = this;

		const RETRY_LIMIT = 50;
		const INTERVAL_TIME = 100;
		const SETUP_TIME = 5000;
		const ARM_PATH = "/dev/ttyARM";
		const SERVO_OFF = 5;
		var trys = 0;

        this.model.registerMemory('Arm');

		////////////////
		this.arm = {
			rotonda: 500,
			base: 500,
			elbow: 500,
			method: 0,
			pitch: 0,
			roll: 0,
			claw: 999,
			laser: 0,
		}
		/////////////////
		this.port = new util.serial.SerialPort(ARM_PATH, {
			baudrate: 9600,
			parser: util.serial.parsers.readline('\n')
		}, false); // false = disable auto open

		/* Serial Open Routine: will continously attempt to access the
		 * serialport until retry limit has been met. */
		var serialOpenRoutine = (err) => {
			if(trys >= RETRY_LIMIT) {
				return;
			} else if (err) {
				this.log.output(`Failed to open ${ARM_PATH}`, trys);
				this.feedback(`Failed to open ${ARM_PATH}`);
				trys++;
				setTimeout(() => {
					this.log.output(`Reattempting to open ${ARM_PATH}`, trys);
					this.feedback(`Reattempting to open ${ARM_PATH}`);
					this.port.open(serialOpenRoutine);
				}, 2000);
				return;
			} else {
				// Listen for data on the serial port
				this.port.on('data', (data) => {
					this.log.output("RECIEVED " + data.toString());
				});
				// Handle Error events by sending them back to mission control
				this.port.on("err", (err) => {
					this.log.output("Communication error with /dev/ArmMCU");
					this.feedback("Communication error with /dev/ArmMCU");
				});
			}
		};
		// Attempt to open Serial port
		this.port.open(serialOpenRoutine);
	}
	map(input, i_min, i_max, o_min, o_max) {
		var output = (input - i_min)*(o_max - o_min)/(i_max-i_min)+o_min;
		if(output > o_max) { return Math.round(o_max); }
		if(output < o_min) { return Math.round(o_min); }
		return Math.round(output);
	}
	react(input) {
		if(input.hasOwnProperty("mimic")) {
			this.arm.rotonda = this.map(input.rotonda, 1, 360, 1, 999);
			this.arm.base = this.map(input.base, 60, 190, 1, 999);
			this.arm.elbow = this.map(input.elbow, 70, 220, 1, 999);
			var pitch_angle = Math.abs(360-input.pitch);
			this.arm.pitch = this.map(pitch_angle, 120, 240, 1, 270);
		} else {
			//this.arm.rotonda = this.map(input.rotonda, -360, 360, 1, 999);
			//var base = Math.abs(360-input.base);
			//this.arm.base = base;
			//this.arm.elbow = this.map(input.elbow, 1, 360, 1, 999); // 0 is down, 999 is up
			//var pitch_angle = 270-(90-input.pitch); // [-90 (pitch up), 90, (pitch down)]
			//this.arm.pitch = this.map(pitch_angle, 1, 270, 1, 270);
			this.arm.method = input.method; // is what it is
			this.arm.roll = this.map(input.roll, 1, 360, 1, 360); // used to clamp
			this.arm.claw = this.map(input.claw, 1, 999, 1, 999); // used to clamp
			this.arm.laser = input.laser;
		}
		//C:500,500,500,180,1,180,500,1E
		var command = `C:${this.arm.rotonda},${this.arm.base},${this.arm.elbow},${this.arm.pitch},${this.arm.method},${this.arm.roll},${this.arm.claw},${this.arm.laser}E\n`;
		if(this.port.isOpen()) {
			//this.log.output("C:999,500,500,180,1,180,500,1E\n");
	 		// this.port.write("C:500,500,500,180,1,180,500,1E\n");
			this.log.output(command);
			this.port.write(command);
		}
		this.model.set('ArmPosition', command);
	}
	halt() {
		if(this.port.isOpen()) {
			//this.port.write('');
		}
		this.log.output(`HALTING ${this.name}`);
		this.feedback(this.name ,`HALTING ${this.name}`);
	}
	resume() {}
	idle() {}
}

module.exports = Arm;
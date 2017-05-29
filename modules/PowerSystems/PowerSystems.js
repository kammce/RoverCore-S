"use strict";

var Neuron = require('../Neuron');

class PowerSystems extends Neuron
{
	constructor(util)
	{
		// =====================================
		// Bootstrapping Section (DO NOT CHANGE)
		// =====================================
		//// Calls parent class constructor
		super(util);
		////Assigns class's name
		this.name = util.name;
		/**
		 * Feedback mechanism for sending information back to mission control.
		 * Usage:
		 *		this.feedback(msg_to_output, ...);
		 * 		this.feedback("HELLO WORLD", { foo: "bar" });
		 */
		this.feedback = util.feedback;
		/**
		 * Abstraction library for printing to standard out in color as well
		 * as writing debug information to file periodically.
		 * Usage:
		 *		this.log.output(msg_to_output, ...);
		 *		this.log.output("HELLO WORLD", { foo: "bar" });
		 */
		this.log = util.log;
		this.log.setColor("green");
		/**
		 * This variable specifies the amount of time between react() calls before the
		 * idle() routine is called and the module state is moved to IDLING
		 */
		this.idle_timeout = 2000;
		/**
		 * as writing debug information to file periodically.
		 *
		 *	Usage:
		 */
	 	// 	this.model.registerMemory("Proto");
			// this.model.set("Proto", {
	 	// 	    proto: 555
			// });
			// var proto = this.model.get("Proto");

		this.model = util.model;
		/**
		 * A method for making up calls to cortex to control the system
		 */
		this.upcall = util.upcall;
		/**
		 * Structure containing additional extended utilities
		 */
		this.extended = util.extended;
		// =====================================
		// Construct Class After This Points
		// =====================================

		this.model.registerMemory("Power");

		this.rfcomm = new util.extended.BluetoothSerial({
			mac: "00:21:13:00:3b:03",
			baud: 38400,
			log: this.log,
			device: 2
		});
		// this.rfcomm = new util.extended.BluetoothSerial({
		// 	mac: "98:d3:31:fc:50:00",
		// 	baud: 38400,
		// 	log: this.log,
		// 	device: 2
		// });

		var errors =   [
						"No Error",
						"DRIVE MODULE OVER-CURRENT.",
						"STEER MODULE OVER-CURRENT.",
						"ARM MODULE OVER-CURRENT.",
						"INTELLIGENCE MODULE OVER-CURRENT.",
						"MAST AND TRACKER MODULE OVER-CURRENT.",
						"BATTERY 1 APPROACHING CRITICAL TEMPERATURE",
						"BATTERY 2 APPROACHING CRITICAL TEMPERATURE",
						"BATTERY 3 APPROACHING CRITICAL TEMPERATURE",
						"BATTERY 1 TEMPERATURE CRITICAL",
						"BATTERY 2 TEMPERATURE CRITICAL",
						"BATTERY 3 TEMPERATURE CRITICAL"
					   ];

		this.locals = {
			realTimeVoltage: 0,
			mAhRemaining: 0,
			batteryPercentage: 0,
			currents: {
				Drive: 0,
				Steer: 0,
				Arm: 0,
				Intel: 0,
				Mast: 0
			},
			temperatures: {
				Battery1: 0,
				Battery2: 0,
				Battery3: 0
			}
		};

		this.rfcomm.attachListener('0', (value) => {
			this.locals.realTimeVoltage = value;
			this.log.debug3("WE RECIEVED 0!!!");
			this.model.set("Power", this.locals);
		});
		this.rfcomm.attachListener('1', (value) => {
			this.locals.mAhRemaining = value;
			this.locals.batteryPercentage = value/120; //mAhRemaining / (12000 / 100)
			this.log.debug3("WE RECIEVED 1!!!");
			this.model.set("Power", this.locals);
		});
		this.rfcomm.attachListener('2', (value) => {
			this.locals.currents.Drive = value;
			this.log.debug3("WE RECIEVED 2!!!");
			this.model.set("Power", this.locals);
		});
		this.rfcomm.attachListener('3', (value) => {
			this.locals.currents.Steer = value;
			this.log.debug3("WE RECIEVED 3!!!");
			this.model.set("Power", this.locals);
		});
		this.rfcomm.attachListener('4', (value) => {
			this.locals.currents.Arm = value;
			this.log.debug3("WE RECIEVED 4!!!");
			this.model.set("Power", this.locals);
		});
		this.rfcomm.attachListener('5', (value) => {
			this.locals.currents.Intel = value;
			this.log.debug3("WE RECIEVED 5!!!");
			this.model.set("Power", this.locals);
		});
		this.rfcomm.attachListener('6', (value) => {
			this.locals.currents.Mast = value;
			this.log.debug3("WE RECIEVED 6!!!");
			this.model.set("Power", this.locals);
		});
		this.rfcomm.attachListener('7', (value) => {
			this.locals.temperatures.Battery1 = value;
			this.log.debug3("WE RECIEVED 7!!!");
			this.model.set("Power", this.locals);
		});
		this.rfcomm.attachListener('8', (value) => {
			this.locals.temperatures.Battery2 = value;
			this.log.debug3("WE RECIEVED 8!!!");
			this.model.set("Power", this.locals);
		});
		this.rfcomm.attachListener('9', (value) => {
			this.locals.temperatures.Battery3 = value;
			this.log.debug3("WE RECIEVED 9!!!");
			this.model.set("Power", this.locals);
		});
		this.rfcomm.attachListener('A', (value) => {
			// this.locals.temperatures.Battery3 = value;
			this.log.debug3("WE RECIEVED A!!!");
			// this.model.set("Power", this.locals);
			if (value) {
				this.log.output(errors[value]);
			}
		});

		setInterval(() => {
			this.log.debug2(errors[9]);
		}, 1000);
	}



	/**
     * React method is called by Cortex when mission control sends a command to RoverCore and is targeting this lobe
     * @param {mixed} input - command from mission control.
     * @returns {boolean} returns true if react was successful, returns false if react failed.
     */
	react(input)
	{
		// var k = Object.keys(someJsonOrJSobj) = array of the keys of the object
		// k.forEach(function(currentkey, currentindex, returndArray){})

		var signal_sent_flag = false;

<<<<<<< HEAD
		if("batRelay1"  in input)
		{
		    this.rfcomm.sendCommand('a', input.batRelay1);
		    signal_sent_flag = true;
		}
		if("batRelay2"  in input)
		{
			this.rfcomm.sendCommand('b', input.batRelay2);
			signal_sent_flag = true;
		}
		if("batRelay3"  in input)
		{
			this.rfcomm.sendCommand('c', input.batRelay3);
			signal_sent_flag = true;
		}
		if("driveRelay" in input)
		{
			this.rfcomm.sendCommand('d', input.driveRelay);
			signal_sent_flag = true;
		}
		if("steerRelay" in input)
		{
			this.rfcomm.sendCommand('e', input.steerRelay);
			signal_sent_flag = true;
		}
		if("armRelay"   in input)
		{
			this.rfcomm.sendCommand('f', input.armRelay);
			signal_sent_flag = true;
		}
		if("intelRelay" in input)
		{
			this.rfcomm.sendCommand('g', input.intelRelay);
			signal_sent_flag = true;
		}
		if("mastRelay"  in input)
		{
			this.rfcomm.sendCommand('h', input.mastRelay);
			signal_sent_flag = true;
		}
		if("killAll"  in input)
		{
			this.rfcomm.sendCommand('i', input.killAll);
			signal_sent_flag = true;
		}

		return signal_sent_flag;
	}
	/**
     * Cortex will attempt to halt this lobe in the following situations:
	 *		1. If the Mission Control controller of a lobe disconnects from the rover server or server proxy.
	 *		2. If the Mission Control controller sends a manual halt signal to Cortex to halt the lobe.
	 *		3. If another lobe uses an UPCALL to trigger the halt of a specific lobe or all lobes.
     * @returns {boolean} returns true if successful, returns false if halt failed.
     */
	halt()
	{
		this.log.output(`HALTING ${this.name}`);
		this.feedback(`HALTING ${this.name}`);
		return true;
	}
	/**
     * Cortex will attempt to resume this lobe in the following situations:
	 *		1. If the Mission Control controller sends a manual resume signal to Cortex to resume a halted lobe.
	 *		2. If another lobe uses an UPCALL to trigger resume of a specific lobe or all lobes.
     * @returns {boolean} returns true if successful, returns false if resume failed.
     */
	resume()
	{
		this.log.output(`RESUMING ${this.name}`);
		this.feedback(`RESUMING ${this.name}`);
		this.upcall("CALL", this.name, "LOOPBACK-UPCALL");
		return true;
	}
	/**
     * Cortex will attempt to IDLE your lobes if this lobe does not receive a command from mission control in the specified amount defined in the this.idle_timeout. file. This is useful for lobes that need period commands from mission control. Lobes are put into IDLING state ~100ms after they are constructed.
     * @returns {boolean} returns true if successful, returns false if idle failed.
     */
	idle()
	{
		this.log.output(`IDLING ${this.name}`);
		this.feedback(`IDLING ${this.name}`);
		return true;
	}
}

module.exports = PowerSystems;

/*
MC struct
{
  "batRelay1": 1,
  "batRelay2": 1,
  "batRelay3": 1,
  "driveRelay": 1,
  "steerRelay": 1,
  "armRelay": 1,
  "intelRelay": 1,
  "mastRelay": 1,
  "allPower" : 1
}
*/

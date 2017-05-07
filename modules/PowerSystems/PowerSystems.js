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
			mac: "00:21:13:00:3b:03", //may not be correct MAC address
			baud: 38400,
			log: this.log,
			device: 2
		});	

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
			// this.log.output("WE RECIEVED 0!!!");
		});
		this.rfcomm.attachListener('1', (value) => {
			this.locals.mAhRemaining = value;
			this.locals.batteryPercentage = value/120; //mAhRemaining / (12000 / 100)
			// this.log.output("WE RECIEVED 1!!!");
		});
		this.rfcomm.attachListener('2', (value) => {
			this.locals.currents.Drive = value;
			// this.log.output("WE RECIEVED 2!!!");
		});
		this.rfcomm.attachListener('3', (value) => {
			this.locals.currents.Steer = value;
			// this.log.output("WE RECIEVED 3!!!");
		});
		this.rfcomm.attachListener('4', (value) => {
			this.locals.currents.Arm = value;
			// this.log.output("WE RECIEVED 4!!!");
		});
		this.rfcomm.attachListener('5', (value) => {
			this.locals.currents.Intel = value;
			// this.log.output("WE RECIEVED 5!!!");
		});
		this.rfcomm.attachListener('6', (value) => {
			this.locals.currents.Mast = value;
			// this.log.output("WE RECIEVED 6!!!");
		});
		this.rfcomm.attachListener('7', (value) => {
			this.locals.temperatures.Battery1 = value;
			// this.log.output("WE RECIEVED 7!!!");
		});
		this.rfcomm.attachListener('8', (value) => {
			this.locals.temperatures.Battery2 = value;
			// this.log.output("WE RECIEVED 8!!!");
		});
		this.rfcomm.attachListener('9', (value) => {
			this.locals.temperatures.Battery3 = value;
			// this.log.output("WE RECIEVED 9!!!");
		});

		//for testing model update
		setInterval(() => {
			this.model.set("Power", this.locals);
			// var power = this.model.get("Power");

			// if (power != this.locals) {
			// 	this.log.output("model not updated correctly.");
			// }
		}, 100);
		// setInterval(() => {
		// 	this.log.output(this.locals);
		// }, 1000);

	}

	/**
     * React method is called by Cortex when mission control sends a command to RoverCore and is targeting this lobe
     * @param {mixed} input - command from mission control.
     * @returns {boolean} returns true if react was successful, returns false if react failed.
     */
	react(input)
	{		// var k = Object.keys(someJsonOrJSobj) = array of the keys of the object
			// k.forEach(function(currentkey, currentindex, returndArray){
				
			// })
		if ("batRelay1"  in input &&
			"batRelay2"  in input &&
			"batRelay3"  in input &&
			"driveRelay" in input &&
			"steerRelay" in input &&
			"armRelay"   in input &&
			"intelRelay" in input &&
			"mastRelay"  in input)
		{
			this.rfcomm.sendCommand('a', input.batRelay1);
			setTimeout(() => { this.rfcomm.sendCommand('b', input.batRelay2); }, 20);
			setTimeout(() => { this.rfcomm.sendCommand('c', input.batRelay3); }, 40);
			setTimeout(() => { this.rfcomm.sendCommand('d', input.driveRelay); }, 60);
			setTimeout(() => { this.rfcomm.sendCommand('e', input.steerRelay); }, 80);
			setTimeout(() => { this.rfcomm.sendCommand('f', input.armRelay); }, 100);
			setTimeout(() => { this.rfcomm.sendCommand('g', input.intelRelay); }, 120);
			setTimeout(() => { this.rfcomm.sendCommand('h', input.mastRelay); }, 140);

		    this.log.output(`REACTING ${this.name}: `, input);
			this.feedback(`REACTING ${this.name}: `, input);
		}
		else
		{
			this.log.output(`NOT reacting ${this.name}; invalid inputs.`);
			this.feedback(`NOT reacting ${this.name}; invalid inputs.`);
			return false;
		}
		
		return true;
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
  "mastRelay": 1
}
*/
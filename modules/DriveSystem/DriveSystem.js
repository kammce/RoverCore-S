"use strict";

var Neuron = require('../Neuron');

class DriveSystem extends Neuron
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
		this.log.setColor("blue");
		/**
		 * This variable specifies the amount of time between react() calls before the
		 * idle() routine is called and the module state is moved to IDLING
		 */
		this.idle_timeout = 2000;
		/**
		 * as writing debug information to file periodically.
		 * Usage:
		 *		this.model.registerMemory("Proto");
		 *		this.model.set("Proto", {
		 *		    proto: 555
		 *		});
		 *		var proto = this.model.get("Proto");
		 */
		this.model = util.model;
		/**
		 * Structure containing additional extended utilities
		 */
		this.extended = util.extended;
		// =====================================
		// Construct Class After This Points
		// =====================================
		this.rfcomm = new util.extended.BluetoothSerial({
			mac: "00:21:13:00:6E:A7",
			baud: 38400,
			log: this.log,
			device: 1
		});

		// this.ai_interval = setInterval(() =>
		// {
		// 	this.rfcomm.send("M", 'Y'.charCodeAt(0));
		// 	var neo = this.model.get("NeoCortex");
		// 	if(this.state === "IDLING" && neo.ai_flag === true)
		// 	{
		// 		switch(neo.direction)
		// 		{
		// 			case "LEFT":
		// 				this.rfcomm.send("S", 15);
		// 				this.rfcomm.send("A", -90);
		// 				break;
		// 			case "RIGHT":
		// 				this.rfcomm.send("S", 15);
		// 				this.rfcomm.send("A", 90);
		// 				break;
		// 			case "LEFT-FORWARD":
		// 				this.rfcomm.send("S", 15);
		// 				this.rfcomm.send("A", -90);
		// 				break;
		// 			case "RIGHT-FORWARD":
		// 				this.rfcomm.send("S", 15);
		// 				this.rfcomm.send("A", 90);
		// 				break;
		// 			case "STOP":
		// 				this.rfcomm.send("S", 0);
		// 				this.rfcomm.send("A", 0);
		// 				break;
		// 			default:
		// 				break;
		// 		}
		// 	}
		// 	else
		// 	{
		// 	}
		// }, 100);
	}
	/**
     * React method is called by Cortex when mission control sends a command to RoverCore and is targeting this lobe
     * @param {mixed} input - command from mission control.
     * @returns {boolean} returns true if react was successful, returns false if react failed.
     */
	react(input)
	{
		if( "speed" in input &&
			"angle" in input &&
			"mode" 	in input)
		{
			this.rfcomm.sendCommand("S", input.speed);
			this.rfcomm.sendCommand("A", input.angle);
			this.rfcomm.send(`@M,${input.mode.charCodeAt(0)}\r\n`);
			this.log.output(`Sending `, input, `Over BluetoothSerial`);
			this.feedback(`Sending `, input, `Over BluetoothSerial`);
			return true;
		}
		else
		{
			this.log.output(`Invalid Input `, input);
			this.feedback(`Invalid Input `, input);
		}
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

module.exports = DriveSystem;
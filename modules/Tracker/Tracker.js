"use strict";

var Neuron = require('../Neuron');

class Tracker extends Neuron
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

		/*
		Personal Notes:
			MODEL: used as a way to communicate with MC
			BluetoothSerial.js: used as a way to communicate with Teensy
		*/
		/* Bluetooth Serial */
		this.comms = new BluetoothSerial(
			{
				mac: "21:13:710e",
				baud: 38400,	//recommended baud rate
				log: this.log,
				device: 3,		//tracker
				callback: (data) =>
				{
					this.log.output(data);
				}
			}
		);

		/* Memory registration */
		this.model.registerMemory("lidarState");// LIDAR activation
		this.model.registerMemory("ctlMode");	// Control Mode; SD: Speed/Direction Control, P: Position control
		this.model.registerMemory("preset");	// Preset (if any): for values, see MC/Tracker lobe comm. standards
		this.model.registerMemory("pitch");		// Pitch parameters
		this.model.registerMemory("yaw");		// Yaw parameters
		this.model.registerMemory("zoom");		// Zoom percentage

		/* Memory initialization */
		this.model.set("lidarState", {lidarState: false} );
		this.model.set("ctlMode", {ctlMode: "SD"} );	// Will support only SD control for now... 2/3/17
		this.model.set("preset", {preset: "Cancel"});	// No preset will be initiated at startup
		this.model.set("pitch", {speed: 0, direction: "up"});	// no movement in the beginning
		this.model.set("yaw", {speed: 0, direction: "left"});	// no movement in the beginning
		this.model.set("zoom", {zoom: 0});				// begin with no zooming
	}
	/**
     * React method is called by Cortex when mission control sends a command to RoverCore and is targeting this lobe
     * @param {mixed} input - command from mission control.
     * @returns {boolean} returns true if react was successful, returns false if react failed.
     */
	react(input)
	{
		// Determine Control Mode
		var tempCtlMode = getControlMode(input);
		if(tempCtlMode === false)
		{
			this.log.output("Error", "Ambiguous control mode");
			return false;
		}
		else
		{
			this.model.set("ctlMode", {ctlMode: tempCtlMode});
			/*Do I need to explicitly send the type of control mode?*/
		}

		// Determine Preset (if any)
		if((Object.keys(input)).indexOf("preset") !== -1)
		{
			this.model.set("preset", {preset: input.preset});
			this.comms.send(/*key for preset*/, /*value to represent input.preset*/);
		}

		// Send parameters to Teensy (BluetoothSerial) and Mission Control (Model)

		// Pitch/Yaw parameters
		switch(tempCtlMode)
		{
			case "SD":
			{
				// Pass SPEED/DIRECTIONAL Control Parameters
				this.model.set("pitch", {speed: input.pitch.speed, direction: input.pitch.direction});
				this.model.set("yaw", {speed: input.yaw.speed, direction: input.yaw.direction});
				// this.log.output(`speed = ${input.yaw.speed}`);	// an example of using ECMA script 6

				// Send to Teensy
				this.comms.send(/*key for pitch speed*/, /*value to represent input.pitch.speed*/);
				this.comms.send(/*key for p
					itch direction*/, /*value to represent input.pitch.direction*/);
				this.comms.send(/*key for yaw speed*/, /*value to represent input.yaw.speed*/);
				this.comms.send(/*key for yaw direction*/, /*value to represent input.yaw.direction*/);
				break;
			}
			case "P":
			{
				// Pass POSITIONAL Control Parameters
				this.model.set("pitch", {angle: input.pitch.angle});
				this.model.set("yaw", {angle: input.pitch.yaw});

				// Send to Teensy
				this.comms.send(/*key for pitch angle*/, input.pitch.angle);
				this.comms.send(/*key for yaw angle*/, input.yaw.angle);
				break;
			}
			default:
			{
				this.log.output("Default", "Doing Nothing...");
				break;
			}
		}

		// Zoom parameters
		this.model.set("zoom", {zoom: input.zoom});
		this.comms.send(/*key for zoom*/, input.zoom);

		this.log.output(`REACTING ${this.name}: `, input);
		this.feedback(`REACTING ${this.name}: `, input);
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

	// Utility Functions
	/* Determines if control mode is SD or P, or if received mode is invalid */
	getControlMode(missionControlObj)
	{
		// Store key lists
		var pitchList = Object.keys(missionControlObj.pitch);
		var yawList = Object.keys(missionControlObj.yaw);

		// Decide control mode
		if( (pitchList.indexOf("angle") !== -1) &&
			(yawList.indexOf("angle") !== -1) )
		{
			return "P";
		}
		else if( ((pitchList.indexOf("speed") !== -1) && (pitchList.indexOf("direction") !== -1)) &&
				 ((yawList.indexOf("speed") !== -1) && (yawList.indexOf("direction") !== -1)) )
		{
			return "SD";
		}
		else
		{
			return false;
		}
	}
}

module.exports = Tracker;

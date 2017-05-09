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
		this.log.setColor("yellow");
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
			BluetoothSerial.js: used as a way to communicate with Teensy, and to read from Teensy
		*/

		/* Constants/Definitions */
		// Teensy Keys for key:value pairs to/from bluetooth
		this.RELATIVE_ORIENTATION_X = 'a'; 	// "97";	// float roll ~0, relative to rover,
		this.RELATIVE_ORIENTATION_Y = 'b';	// "98";	// float pitch: relative to rover, +90 = straight up, -90 = straight down
		this.RELATIVE_ORIENTATION_Z = 'c'; 	// "99";	// float yaw: relative to rover, 0 = forward, +-360 = all the forward (- = left, + = right)  
		this.GLOBAL_ORIENTATION_X = 'd'; 	// "100";	// float roll: No on cares
		this.GLOBAL_ORIENTATION_Y = 'e';	// "101";	// float pitch: relative to the Earth's horizon
		this.GLOBAL_ORIENTATION_Z = 'f';	// "102";	// float heading (relative direction to Earth's Magnetic North)
		this.LIDAR_READING = 'g';			// "103";
		this.YAW_MOTOR_CURRENT = 'h';		// "104";
		this.PITCH_MOTOR_CURRENT = 'i';		// "105";
		// this.MOTION_CONTROL_MODE = 'A';		// "65"; key for specifying speed/dir control (val = 1) or position control (val = 2)
		this.MOTION_COMMAND_YAW = 'B';		// "66"; key for specifying angle to yaw motor (signed)
		this.MOTION_COMMAND_PITCH = 'C';	// "67"; key for specifying angle to pitch motor (signed)
		this.MOTION_COMMAND_YAW_SPEED = 'D';// "68";	// 0 - 255
		this.MOTION_COMMAND_PITCH_SPEED = 'E';// "69";	// 0 - 255
		this.ACTIVE_CAMERA = 'F';	// "?" key for selecting which analog camera to receive feed from
		this.BATTERY_VOLTAGE = 'G';

		/* Bluetooth Serial */
		this.comms = new util.extended.BluetoothSerial({
			mac: "00:21:13:00:71:0E",
			baud: 38400,
			log: this.log,
			device: 3
		});

		// /* USB Serial */
		// this.comms = new util.extended.Serial(
		// 	{
		// 		log: this.log,
		// 		path: "tty/ACM0",
		// 		baud: 38400
		// 	}
		// );

		/* Locals */
		this.local = {
			busy: false,		// prevents command bottle-necking
			relativeOr: {		// orientation relative to Rover
				X: 0,
				Y: 0,
				Z: 0
			},
			globalOr: {			// orientation relative to Earth
				X: 0,
				Y: 0,
				Z: 0
			},
			distance: 0,		// Lidar distance reading (cm)
			current: {			// current readings for the motors
				yaw: 0,
				pitch: 0
			},
			lidarState: false,	// LIDAR activation (currently not implemented; lidar is assumed always on)
			// ctlMode: "SD",		// Control Mode; SD: Speed/Direction Control, P: Position control
			// preset: "Cancel",	// Preset (if any): for values, see MC/Tracker lobe comm. standards
			pitch: {			// Pitch parameters
				speed: 0,
				angle: 0
			},
			yaw: {				// Yaw parameters
				speed: 0,
				angle: 0
			},
			zoom: 0			// Zoom percentage
		};

		/* Model Memory Registration */
		this.model.registerMemory("Tracker");	// Tracker Database
		this.model.set("Tracker", this.local);	// set "Tracker" to local

		/* Teensy Data Listeners (to read and asynchronously update vars) */
		this.comms.attachListener(this.RELATIVE_ORIENTATION_X, (val) => {
			this.local.relativeOr.X = val;
		});
		this.comms.attachListener(this.RELATIVE_ORIENTATION_Y, (val) => {
			this.local.relativeOr.Y = val;
		});
		this.comms.attachListener(this.RELATIVE_ORIENTATION_Z, (val) => {
			this.local.relativeOr.Z = val;
		});
		this.comms.attachListener(this.GLOBAL_ORIENTATION_X, (val) => {
			this.local.globalOr.X = val;
		});
		this.comms.attachListener(this.GLOBAL_ORIENTATION_Y, (val) => {
			this.local.globalOr.Y = val;
		});
		this.comms.attachListener(this.GLOBAL_ORIENTATION_Z, (val) => {
			this.local.globalOr.Z = val;
		});
		this.comms.attachListener(this.LIDAR_READING, (val) => {
			this.local.distance = val;
		});
		this.comms.attachListener(this.YAW_MOTOR_CURRENT, (val) => {
			this.local.current.yaw = val;
		});
		this.comms.attachListener(this.PITCH_MOTOR_CURRENT, (val) => {
			this.local.current.pitch = val;
		});
	}
	/**
     * React method is called by Cortex when mission control sends a command to RoverCore and is targeting this lobe
     * @param {mixed} input - command from mission control.
     * @returns {boolean} returns true if react was successful, returns false if react failed.
     */
	react(input)
	{
		if(!this.local.busy)
		{
			// Prevent bottle-neck
			this.local.busy = true;

			// Determine Control Mode
			// var tempCtlMode = this.getControlMode(input);
			// if(tempCtlMode === false)
			// {
			// 	this.log.output("Error", "Ambiguous control mode");
			// 	reset();
			// 	return false;
			// }
			// else
			// {
			// 	this.local.ctlMode = tempCtlMode;
			// }

			// Determine Preset (if any)
			if((Object.keys(input)).indexOf("preset") !== -1)
			{
				this.local.preset = input.preset;
				// this.comms.sendCommand(/*key for preset*/, /*value to represent input.preset*/);	// Presets are to be handled by lobe, NOT teensy, therefore NO preset variable is to be sent.
			}

			// Prepare parameters to Teensy (BluetoothSerial) and Mission Control (Model)

			// Pitch/Yaw parameters
			// Pass SPEED/DIRECTIONAL Control Parameters
			this.local.pitch = {
				speed: input.pitch.speed,
				angle: input.pitch.angle
			};
			this.local.yaw = {
				speed: input.yaw.speed,
				angle: input.yaw.angle
			};
			// this.log.output(`speed = ${input.yaw.speed}`);	// an example of using ECMA script 6

			// Send to Teensy (i.e. pitch -8.45 = CCW 8.45, yaw 12.4 = CW 12.4)
			this.comms.sendCommand(this.MOTION_COMMAND_PITCH, this.local.pitch.angle);
			this.comms.sendCommand(this.MOTION_COMMAND_PITCH_SPEED, this.local.pitch.speed);
			this.comms.sendCommand(this.MOTION_COMMAND_YAW, this.local.yaw.angle);
			this.comms.sendCommand(this.MOTION_COMMAND_YAW_SPEED, this.local.yaw.speed);

			// switch(tempCtlMode)
			// {
			// 	case "SD":
			// 	{
			// 		// Pass SPEED/DIRECTIONAL Control Parameters
			// 		this.local.pitch = {
			// 			speed: input.pitch.speed,
			// 			direction: input.pitch.direction
			// 		};
			// 		this.local.yaw = {
			// 			speed: input.yaw.speed,
			// 			direction: input.yaw.direction
			// 		};
			// 		// this.log.output(`speed = ${input.yaw.speed}`);	// an example of using ECMA script 6

			// 		// Send to Teensy (i.e. pitch -8.45 = CCW 8.45, yaw 12.4 = CW 12.4)
			// 		this.comms.sendCommand(this.MOTION_COMMAND_PITCH,
			// 			(this.local.pitch.direction === "up") ? this.local.pitch.speed : (this.local.pitch.speed * (-1))
			// 		);
			// 		this.comms.sendCommand(this.MOTION_COMMAND_YAW,
			// 			(this.local.yaw.direction === "right") ? this.local.yaw.speed: (this.local.yaw.speed * (-1))
			// 		);
			// 		break;
			// 	}
			// 	case "P":
			// 	{
			// 		// Pass POSITIONAL Control Parameters
			// 		this.local.pitch = {
			// 			angle: input.pitch.angle
			// 		};
			// 		this.local.yaw = {
			// 			angle: input.yaw.angle
			// 		};

			// 		// Send to Teensy
			// 		this.comms.sendCommand(this.MOTION_COMMAND_PITCH, input.pitch.angle);
			// 		this.comms.sendCommand(this.MOTION_COMMAND_YAW, input.yaw.angle);
			// 		break;
			// 	}
			// 	default:
			// 	{
			// 		this.log.output("Default", "Doing Nothing...");
			// 		break;
			// 	}
			// }

			// Zoom parameters
			this.local.zoom = input.zoom;
			// this.comms.sendCommand(/*key for zoom*/, input.zoom);

			this.log.output(`REACTING ${this.name}: `, input);
			this.feedback(`REACTING ${this.name}: `, input);

			// Send data to Mission Control and Reset for new input
			this.reset();
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
		reset();
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
		this.model.set("Tracker", this.local);
		return true;
	}

	/* Utility Functions */
	getControlMode(missionControlObj)	// Determines if control mode is SD or P, or if received mode is invalid
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

	panorama()
	{

	}

	reset()		// re-opens react() for command processing
	{
		this.local.busy = false;
		this.model.set("Tracker", this.local);
	}
}

module.exports = Tracker;

"use strict";

var Neuron = require('../Neuron');

//place holder in 0th element 

//original starting time in unix for when each pod starts. In milliseconds 
var initTimestamp = [0, 0, 0, 0, 0];
var podDataKey = ["","pod1_data", "pod2_data", "pod3_data", "pod4_data"];
var podTimestampKey = ["", "pod1_timestamp", "pod2_timestamp", "pod3_timestamp", "pod4_timestamp"];



class Pods extends Neuron
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
		this.log.setColor("red");
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
		
		//prob register memories for each unique pod (for MC use when parsing the 32 bit message for relevant values)
			this.model.registerMemory("pod1_data");
			this.model.registerMemory("pod1_timestamp");
			
			this.model.registerMemory("pod2_data");
			this.model.registerMemory("pod2_timestamp");	
			
			this.model.registerMemory("pod3_data");
			this.model.registerMemory("pod3_timestamp");
			
			this.model.registerMemory("pod4_data");
			this.model.registerMemory("pod4_timestamp");

		/**
		 * Structure containing additional extended utilities
		 */
		this.extended = util.extended;
		// =====================================
		// Construct Class After This Points
		// =====================================
		
	
		this.rfcomm_pod1 = new util.extended.BluetoothSerial({
			mac: "00:21:13:00:71:a1", //get relevant MAC address 
			baud: 38400,
			log: this.log,
			device: 2
		});
		
		this.rfcomm_pod2 = new util.extended.BluetoothSerial({
			mac: "00:21:13:00:71:a1", //get relevant MAC address 
			baud: 38400,
			log: this.log,
			device: 2
		});

		this.rfcomm_pod3 = new util.extended.BluetoothSerial({
			mac: "00:21:13:00:71:a1", //get relevant MAC address 
			baud: 38400,
			log: this.log,
			device: 2
		});
		
		this.rfcomm_pod4 = new util.extended.BluetoothSerial({
			mac: "00:21:13:00:71:a1", //get relevant MAC address 
			baud: 38400,
			log: this.log,
			device: 2
		});
		
		//then attach the 16 listeners to each of the bluetooth instantiations 
		attachListeners();	
		
		//prob call funct to split into data and timestamp
		
		// this.mc_text_field_interval = setInterval(() =>
		// {
		// 	this.feedback("Mission Control Text Area Log Test Overflow");
		// }, 50);
	}
	/**
     * React method is called by Cortex when mission control sends a command to RoverCore and is targeting this lobe
     * @param {mixed} input - command from mission control.
     * @returns {boolean} returns true if react was successful, returns false if react failed.
     */
	 
	 //work on this
	react(input)
	{
		if( "start_time" in input &&
			"start_stop_message" in input && 
			"message" in input)
		{
			this.rfcomm.sendCommand('a', input.start_time);
			this.rfcomm.sendCommand('b', input.start_stop_message); 
			this.rfcomm.sendCommand('c', input.message);
			
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
	parseMessage( var podNum, var messagebits)
	{
		var dataMask = 1099510579200; //1111 1111 1111 1111 1111 0000 0000 0000 0000 0000 
		var timestampMask = 1048575;  //0000 0000 0000 0000 0000 1111 1111 1111 1111 1111
		
		var data = messageBits & dataMask;
		this.model.set(podDataKey[podNum], data);
		
		var timestampOffsetInSec = messageBits & timestampMask;
		var timestampOffsetInMilliseconds = timestampOffsetInSec * 1000;
		
		var updatedTimestamp = initTimestamp[podNum] + timestampOffsetInMilliseconds;
		this.model.set(podTimestampKey[podNum], updatedTimestamp);
		
	}
	
	attachListeners()
	{
		//time sync/starting initialization 
		this.rfcomm_pod1.attachListener('a', (data) => 
		{
			this.set("message", input.message);
			parseMessage(1, input.message);
		});
		this.rfcomm_pod2.attachListener('a', (data) => 
		{
			this.set("message", input.message);
		});
		this.rfcomm_pod3.attachListener('a', (data) => 
		{
			this.set("message", input.message);
		});
		this.rfcomm_pod4.attachListener('a', (data) => 
		{
			this.set("message", input.message);
		});	
		
		
	}
}

module.exports = Pods;
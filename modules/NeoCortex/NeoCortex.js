"use strict";

var fs = require('fs');
var exec = require('child_process');
       

var Neuron = require('../Neuron');

class NeoCortex extends Neuron
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
		/**
		 * Structure containing additional extended utilities
		 */
		this.extended = util.extended;
		/**
		 * Output direction from computer vision program 
		 */
		this.vision_direction = '';
		/**
		 * Interval variable for reading from text file
		 */ 
		this.read_interval = 0;
		this.holder = "N";
		/** Setting Model Memory **/
		this.model.registerMemory("NeoCortex");
		this.model.set("NeoCortex", {
			ai_direction: 'stop'
		});
		/**Function Testing Section **/ 
		//this.openVision();
		this.readDirection();
		// =====================================
		// Construct Class After This Points
		// =====================================
	}
	/**
     * React method is called by Cortex when mission control sends a command to RoverCore and is targeting this lobe
     * @param {mixed} input - command from mission control.
     * @returns {boolean} returns true if react was successful, returns false if react failed.
     */
	react(input)
	{
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
	/*
	*Read direction from text file and input direction into execDrive();
	*/
	readDirection()
	{
		
	        var parent = this;
	        this.read_interval = setInterval(function(){
			//parent.log.output(data);
			//console.log("----");
			//parent.log.output(parent.vision_direction);
	   		  parent.openVision();
            	},3000);
	}
	/*
	* function to stop
	*/
	clearDirection()
	{
		if (clearInterval(this.read_interval)){
			return true;
		}
		else{
			return false;
		}
	}
	/*
	*Logic for executing traversing
	*input [string] direction, direction of tennis ball with respect to rover
	*/
	execDrive(direction){
	//this.log.output("direction: " + direction);
	   if(direction === 'L'){
	   //go Left
	    this.log.output("Go Left");
	    this.updateModel('left');
            this.holder = direction[0];
	   };

	   if(direction ==='R'){
	   //go Right
            this.log.output("Go Right");
	    this.updateModel('right');
	    this.holder = direction[0]; 
	   };
 
	   if(direction === 'C'){
	   //go Left or Right 
	    if(this.holder === 'L'){
	     this.log.output("Go Left Once Then Forward");
	     this.updateModel('left_forward');
	    }
	    if(this.holder === 'R'){
	     this.log.output("Go Right Once Then Forward");
	     this.updateModel('right_forward');
	    }
	    if(this.holder === 'C'){
	     this.log.output("Go Nowhere");
	     this.updateModel('stop');
	    }
	    this.holder = 'C';
	   };

	   if(direction === 'N'){
	    this.log.output("Go Nowhere");
	    this.updateModel('stop');
	   }; 
	}

	openVision()
	{
		
		var parent = this;
	     	//this.log.output("Opening Vision Program");
		exec.execFile('./modules/NeoCortex/Vision/main', function(error, stdout)
		{
			if(error){
				parent.log.output(error);
			}
			//parent.log.output(stdout[0]);
			//parent.log.output(direction);
			parent.execDrive(stdout[0]); //writing Driving Logic
			
		});
		
	}

	updateModel(direction_string)
	{
		this.model.set("NeoCortex", {
			ai_direction: direction_string
		});
	}
}

module.exports = NeoCortex;

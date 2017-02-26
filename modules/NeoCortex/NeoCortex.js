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
		//this.openVision();
		var parent = this;
		this.read_interval = setInterval(function(){
			
			fs.readFile('/home/pi/NeoCortex/rovercore-s/modules/NeoCortex/Vision/direction.txt', 'utf8', function (err,data) {
	  		  if (err) {
	   		    return parent.log.output(err);
	                  }
	        //parent.log.output(data);
		//console.log("----");
	        parent.vision_direction = data;
		//parent.log.output(parent.vision_direction);
		parent.execDrive(parent.vision_direction);
	        });
            	},100);
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
	
	
	   if(direction[0] === 'L'){
	   //go Left
	    this.log.output("Go Left");
            this.holder = direction[0];
	   };

	   if(direction[0] ==='R'){
	   //go Right
            this.log.output("Go Right");
	    this.holder = direction[0]; 
	   };
 
	   if(direction[0] === 'C'){
	   //go Left or Right 
	    if(this.holder === 'L'){
	     this.log.output("Go Left Once Then Forward");
	    }
	    if(this.holder === 'R'){
	     this.log.output("Go Right Once Then Forward");
	    }
	    if(this.holder === 'C'){
	     this.log.output("A glitch Go Nowhere");
	    }
	    this.holder = 'C';
	   };

	   if(direction[0] === 'N'){
	    this.log.output("Go Nowhere");
	   };

	
	 
	}
	
	//running exe file but doest execute detection
	openVision()
	{
	     exec.execFile('./modules/NeoCortex/Vision/main', function(error){ console.log(error)});
	}

}

module.exports = NeoCortex;
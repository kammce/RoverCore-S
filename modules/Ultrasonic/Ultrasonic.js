"use strict";

var Neuron = require('../Neuron');
var exec = require('child_process').exec;
var fs = require("fs");


class Ultrasonic extends Neuron
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
     * Use to execute shellscript command line.
     */
    puts(error, stdout, stderr){
    	console.log(stdout) 
    }
	/**
     * Use to expose GPIO pin for usage
     * @param {interger} input - set initially.
     */
    expose(pin){
    	exec("echo "+Trigger+ " > /sys/class/gpio/export" , puts);
    }
    /**
     * Set direction of a GPIO pin 
     * @param {interger} input - set initially.
     * @param {string} state - set initially.
     */
    direction(pin,state){
    	fs.writeFileSync(sysFsPath + "/gpio" + pin + "/direction", state);
    }
    /**
     * Use to measure Distance . Note : not tested with Mux yet. Intended for testing using Rovercore with single Ultrasonic only  
     * 
     */
    measureDistance(){
    	var Trigger = 20
    	var Echo = 21 
    	expose(Trigger);
    	expose(Echo);
    	direction(Trigger,"out");
    	direction(Echo,"in");

		setInterval(function(){
		  fs.writeFileSync(sysFsPath + "/gpio" + Trigger + "/value", 1, "utf8");
		  //console.log(fs.readFileSync(sysFsPath + "/gpio" + Echo + "/value","utf8"));
		  setTimeout(function(){
		      count=0;
		      fs.writeFileSync(sysFsPath + "/gpio" + Trigger + "/value", 0, "utf8");
		      //console.log(fs.readFileSync(sysFsPath + "/gpio" + Echo + "/value","utf8"));
		       while(fs.readFileSync(sysFsPath + "/gpio" + Echo + "/value","utf8")==0){
		        var hrTime1 = process.hrtime();
		        //start=now();
		        start=hrTime1[0] * 1000000000 + hrTime1[1] 
		        count++;
		        if(count>200){
		         break; 
		        }
		      }
		      while(fs.readFileSync(sysFsPath + "/gpio" + Echo + "/value","utf8")==1){
		        var hrTime2 = process.hrtime();
		        end=hrTime2[0] * 1000000000 + hrTime2[1] 
		        //end=now();
		      }
		      duration = end-start;
		      duration=duration*12.9967
		      this.log.output(`start: ${this.name}`, start);
		      this.log.output(`end: ${this.name}`, end);
		      this.log.output(`duration: ${this.name}`, duration);
		      //console.log("duration: " + duration*12.9967);
		      //console.log("duration: " + duration);
		      //if(distance>150){distance=0;}    
		  },.0020);
		}, 10);
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

module.exports = ProtoLobe;

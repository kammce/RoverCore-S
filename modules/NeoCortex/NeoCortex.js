"use strict";
var fs = require('fs');
var spawn = require('child_process').spawn;
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
		 * Function for calling other lobe
		 */
		this.upcall = util.upcall;
		/**
		 * Structure containing additional extended utilities
		 */
		this.extended = util.extended;
		/**
		 * Output direction from computer vision program 
		 */
		this.vision_process;
		/**
		 * variable to store GPS coordinate 
		 */
		this.GPS_ai = {
			longitude : 0,
			lattitude : 0
		};
		this.GPS_given = {
			longitude : 0,
			lattitude : 0
		};  
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
		switch(input)
		{
			case "AI_ON":
			this.openVision();
			break;

			case "AI_OFF":
			this.closeVision();
			break;

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
	*Logic for executing traversing
	*input [string] direction, direction of tennis ball with respect to rover
	*/
	execDrive(direction)
	{	
	   var parent = this;
	   switch(direction)
	   {
		   case 'L': //go left
			    parent.log.output("Go Left");
			    parent.updateModel('left');
			    parent.upcall('LEFT_AI');
		        //setTimeout(function(){ parent.upcall('STOP_AI')},500);
		        break;
		   case 'R' : // go right
		        parent.log.output("Go Right");
			    parent.updateModel('right');
			    parent.upcall('RIGHT_AI')
			    //setTimeout(function(){ parent.upcall('STOP_AI')},500);
			    break;
		   case 'C':   //go forward
				parent.log.output("Go Forwad");
				parent.updateModel('forward');
				parent.upcall('FORWARD_AI');
			    //setTimeout(function(){ parent.upcall('STOP_AI')},500);
			    break;
		   case 'N' : 
			    this.log.output("Go Nowhere");
			    this.updateModel('stop');
			    parent.upcall('STOP_AI');
				break;
			default: 
				this.log.output("Error Input");
				break;
	   } 
	}
	/*
	*Running computer Vision program 
	*/
	openVision()
	{
		var parent = this;
		this.vision_process = spawn('./modules/NeoCortex/Vision/main');
		this.vision_process.stdout.on('data', function(data) {
  			var direction = data.toString().replace(/[\n\r]/g, "") //take out hiddent char 
  			if(direction != 'N')
			{
				parent.execDrive(direction);	
			}
			else
			{
				parent.readGPS();
				parent.pathGPS();
			}
		});
	}
	/*
	*close computer Vision program
	*/
	closeVision()
	{
		this.vision_process.kill();
	}
	/*
	*Read in GPS data : lattitude and altitude
	*NOT TESTED
	*/
	readGPS()
	{
		var coordinate= this.model.get("Sensor");
		coordinate["lat"] = this.GPS_ai.lattitude;
		coordinate["lon"] = this.GPS_ai.longitude;
	}
	/*
	*Calculate path using GPS data
	*Operation go as follow : read GPS, find heading, spin rover to the calculated direction, spin to that direction.
	*NOT TESTED 
	*/
	pathGPS()
	{
		var heading_expected = heading_GPS(this.GPS_ai.lattitude,this.GPS_ai.longitude,
										   this.GPS_given.lattitude,this.GPS_given.longitude);
		var heading_actual = this.model.get("Tracker");
		var heading_differential = heading_expected - heading_actual["heading"];
		if (heading_differential < -10 )
		{
			this.execDrive("SR");
		} 
		else if (heading_differential > 10)
		{
			this.execDrive("SL");
		}
		else
		{
			this.execDrive("C");
		}
	}
	/*
	*calculate heading between initial and final GPS coordinate
	*/
	headingGPS(lat1,lng1,lat2,lng2)
	{
		 var dLon = this.toRad(lng2-lng1);
         var y = Math.sin(dLon) * Math.cos(this.toRad(lat2));
         var x = Math.cos(this.toRad(lat1))*Math.sin(this.toRad(lat2)) - 
         		 Math.sin(this.toRad(lat1))*Math.cos(this.toRad(lat2))*Math.cos(dLon);
         var heading = this.toDeg(Math.atan2(y, x));
         console.log((heading+360)%360);
         return ((heading + 360) % 360);
	}
	/*
	*calculate distance between initial and final GPS coordinate
	*/
	distanceGPS(lat1,lng1,lat2,lng2)
	{
		var E_radius = 6378137; //Earth radius in meter
		var dLat = this.toRad(lat2-lat1);
		var dLon = this.toRad(lng2-lng1);
		var a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);  
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
		var distance = E_radius * c;
		return distance;  
	}
	/*
	* conversion to radian
	*/
	toRad(deg)
	{
		return deg * Math.PI / 180;
	}
	/*
	* conversion to degree
	*/
	toDeg(rad)
	{
		return rad * 180 / Math.PI;
	}
	/*
	*function to update model
	*/
	updateModel(direction_string)
	{
		this.model.set("NeoCortex", {
			ai_direction: direction_string
		});
	}
}

module.exports = NeoCortex;
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
		this.GPS_current = {
			longitude : 0,
			lattitude : 0
		};
		this.GPS_gate = {
			longitude : 0,
			lattitude : 0
		};
		this.GPS_flag = 1;
		this.Sonic_flag = 1;  
		this.AI_direction = "Stop";
		this.Finish = "Invalid"
		/**
		 * Interval variable for reading from text file
		 */ 
		this.read_interval = 0;
		this.holder = "N";
		this.GPS_Heading =0;
		this.Tracker_Heading=0;
		this.SampleRate = 300; 
		/** Setting Model Memory **/
		this.model.registerMemory("NeoCortex");

		setInterval(() =>
		{
			this.readGPS();
			this.GPS_Heading = this.headingGPS(this.GPS_current.lattitude,this.GPS_current.longitude,
										   this.GPS_gate.lattitude,this.GPS_gate.longitude);
			this.model.set("NeoCortex", {
				Direction: this.AI_direction,
				Finish: this.Finish,
				Gate_lattitude: this.GPS_gate.lattitude,
				Gate_longitude: this.GPS_gate.longitude,
				GPS_Heading: this.GPS_Heading
			});
		},this.SampleRate);
		/**Function Testing Section **/ 
		//var parent = this;
		//setTimeout(function(){parent.react({mode: 'AI', flag: 1});},1000);
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
		var parent=this;
		switch(input.mode)
		{
			case "AI": // turn AI On/Off
			if(input.flag==1)
			{
				try{parent.openVision()}
				catch(err){parent.log.output(err)} 
			}
			else{parent.closeVision()}
			break;

			case "GPS": //turn GPS algo On/Off
			if(input.flag==1){parent.GPS_flag=1}
			else{parent.GPS_flag=0}
			break;

			case "SONIC": //turn Sonic algo On/Off
			if(input.flag==1){parent.Sonic_flag=1}
			else{parent.Sonic_flag=0}
			break;

			case "GATE": //write Gate GPS
			parent.GPS_gate.lattitude = input.lattitude;
			parent.GPS_gate.longitude = input.longitude;
			break;

		}
		return true;
	}
	/*
	*Running computer Vision program 
	*/
	openVision()
	{
		var parent = this;
		this.vision_process = spawn('./modules/NeoCortex/Vision/main');

		this.vision_process.stdout.on('data', function(data) {
	  		var output = data.toString().replace(/[\n\r]/g, ""); //take out hiddent char 
	  		var fields = output.split("-");
	  		var direction_vision = fields[0];
	  		var distance_vision = fields[1]*0.254;
	  		var distance_GPS = parent.distanceGPS(parent.GPS_current.lattitude,parent.GPS_current.longitude,
										    	   parent.GPS_gate.lattitude,parent.GPS_gate.longitude);
 
	  		parent.Finish = "No";

		  	if(distance_vision >= 1 && distance_vision != "undefined")
		  	{ 
		  		if(distance_GPS >= 1.5 && distance_GPS != -1 )
		  		{
			  		if(direction_vision != 'N')
					{
						parent.execDrive(direction_vision);	
					}
					else
					{
						parent.readGPS();
						parent.pathGPS();
					}
				}
				else
				{
					parent.execDrive("N");
					parent.closeVision();
					parent.Finish="Yes";
				}
			}
			else if (distance_vision < 1 && distance_vision >= 0 )
			{	
				parent.execDrive("N");
				parent.closeVision();
				parent.Finish="Yes";
			}

		});
	}
	/*
	*close computer Vision program
	*/
	closeVision()
	{
		try
		{
			this.vision_process.kill();
			return true;
		}
		catch(err){
			this.log.output("Killing OpenCV Error");
			return false;
		}
	}
	/**
    * function to drive rover 
    * @param {char} input - command for driving.
    */
	execDrive(direction)
	{	
	   var parent = this;
	   switch(direction)
	   {
		   case 'L': //go left
			    //parent.log.output("Go Left");
			    parent.AI_direction='Left';
			    parent.upcall("CALL", "DriveSystem",  {speed: 30, angle: -90, mode: "Y"}  );
		        //setTimeout(function(){ parent.upcall('STOP_AI')},500);
		        break;
		   case 'R' : // go right
		        //parent.log.output("Go Right");
			    parent.AI_direction='Right';
			    parent.upcall("CALL", "DriveSystem",  {speed: 30, angle: 90, mode: "Y"}  );
			    //setTimeout(function(){ parent.upcall('STOP_AI')},500);
			    break;
		   case 'C':   //go forward
				//parent.log.output("Go Forwad");
				parent.AI_direction='Forward';
			    parent.upcall("CALL", "DriveSystem",  {speed: 30, angle: 0, mode: "Y"}  );
			    //setTimeout(function(){ parent.upcall('STOP_AI')},500);
			    break;
		   case 'N' : 
			    //this.log.output("Go Nowhere");
			    parent.AI_direction='Stop';
			    parent.upcall("CALL", "DriveSystem",  {speed: 0, angle: 0, mode: "Y"}  );
				break;
			case 'SR' : 
			    //this.log.output("Go Nowhere");
			    parent.AI_direction='Spin_Right';
			    parent.upcall("CALL", "DriveSystem",  {speed: 30, angle: 0, mode: "O"}  );
				break;
			case 'SL' : 
			    //this.log.output("Go Nowhere");
			    parent.AI_direction='Spin_Left';
			    parent.upcall("CALL", "DriveSystem",  {speed: -30, angle: 0, mode: "O"}  );
				break;
			default: 
				this.log.output("Error Input");
				break;
	   } 
	}
	/*
	*Read in GPS data : lattitude and altitude
	*NOT TESTED
	*/
	readGPS()
	{
		var coordinate= this.model.get("GPS");
		try
		{
			coordinate["lat"] = this.GPS_current.lattitude;
			coordinate["lon"] = this.GPS_current.longitude;
			return true;
		}
		catch(err)
		{
			//this.log.output(err);
			return false;
		}
	}
	/*
	*Calculate path using GPS data
	*Operation go as follow : read GPS, find heading, spin rover to the calculated direction, spin to that direction.
	*NOT TESTED 
	*/
	pathGPS()
	{
		this.GPS_Heading = this.headingGPS(this.GPS_current.lattitude,this.GPS_current.longitude,
										   this.GPS_gate.lattitude,this.GPS_gate.longitude);

		this.Tracker_Heading = this.model.get("Tracker");

		var heading_differential = this.GPS_Heading - this.Tracker_Heading["heading"];
		
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
         heading = ((heading + 360) % 360);
         heading = Math.round(heading*1000)/1000;
         return heading;
	}
	/*
	*calculate distance between initial and final GPS coordinate
	*/
	distanceGPS(lat1,lng1,lat2,lng2)
	{
		try
		{
			var E_radius = 6378137; //Earth radius in meter
			var dLat = this.toRad(lat2-lat1);
			var dLon = this.toRad(lng2-lng1);
			var a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
	                Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
	                Math.sin(dLon/2) * Math.sin(dLon/2);  
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
			var distance = E_radius * c;
			distance = Math.round(distance*1000)/1000;
			return distance;
		}
		catch(err)
		{
			this.log.output(err);
			return false;
		}  
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
}

module.exports = NeoCortex;

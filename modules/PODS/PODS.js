"use strict";

var Neuron = require('../Neuron');

//place holder in 0th element 

//original starting time in unix for when each pod starts. Stored as a Date 
var placeholderDate = new Date();
var initTimestamp = [placeholderDate, placeholderDate, placeholderDate, placeholderDate, placeholderDate];
var lastSentTimestamp = [placeholderDate, placeholderDate, placeholderDate, placeholderDate, placeholderDate];

var listenerType = ["INIT_START", "BASELINE_TEMP", "BASELINE_HUM", "READY_FOR_DEPLOYMENT", "DRILL_START",
					"DRILL_COMPLETE", "READY_FOR_RETRIEVAL","SD_CARD_ERROR","DRILL_COMM_ERROR", "DRILL_DOWN_ERROR",
					"DRILL_UP_ERROR","REEL_COMM_ERROR","REEL_DOWN_ERROR","REEL_UP_ERROR","TEMPERATURE","HUMIDITY"];
/*
0    uint8_t INIT_START;              // a -- request start time from MC
1    uint32_t BASELINE_TEMP;          // b
2    uint32_t BASELINE_HUM;           // c
3    uint32_t READY_FOR_DEPLOYMENT;   // d
4    uint32_t DRILL_START;            // e
5    uint32_t DRILL_COMPLETE;         // f
6    uint32_t READY_FOR_RETRIEVAL;    // g
7    uint32_t SD_CARD_ERROR;          // h
8    uint32_t DRILL_COMM_ERROR;       // i
9    uint32_t DRILL_DOWN_ERROR;       // j
10    uint32_t DRILL_UP_ERROR;         // k
11    uint32_t REEL_COMM_ERROR;        // l
12    uint32_t REEL_DOWN_ERROR;        // m
13    uint32_t REEL_UP_ERROR;          // n
14    uint32_t TEMPERATURE;            // o
15    uint32_t HUMIDITY;               // p
*/

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
		//first element in locals is a placeholder so can call by pod num (1 - 4)
		this.locals = {
			TempData:  [0, 0, 0, 0, 0],
			MoistData: [0, 0, 0, 0, 0],
			timestamp: [0, 0, 0, 0, 0]
		};

		//this.locals.TempData === this.locals["TempData"][0]
		this.model.registerMemory("PODS");
		this.model.set("PODS", this.locals);
		/**
		 * Structure containing additional extended utilities
		 */
		this.extended = util.extended;
		// =====================================
		// Construct Class After This Points
		// =====================================
		
	
		this.rfcomm_pod1 = new util.extended.BluetoothSerial({
			mac: "00:21:13:00:6F:01", //pod 1 MAC address  
			baud: 38400,
			log: this.log,
			device: 2
		});
		
		this.rfcomm_pod2 = new util.extended.BluetoothSerial({
			mac: "00:21:13:00:71:a1", //get relevant MAC address 
			baud: 38400,
			log: this.log,
			device: 10
		});

		this.rfcomm_pod3 = new util.extended.BluetoothSerial({
			mac: "00:21:13:00:71:a2", //get relevant MAC address 
			baud: 38400,
			log: this.log,
			device: 11
		});
		
		this.rfcomm_pod4 = new util.extended.BluetoothSerial({
			mac: "00:21:13:00:71:a3", //get relevant MAC address 
			baud: 38400,
			log: this.log,
			device: 12
		});
		
		//then attach the 16 listeners to each of the bluetooth instantiations 
		this.rfcomm_pod1.attachListener('a', (data)=>
		{
			parseMessage(1, data, "init");
		});
		this.rfcomm_pod2.attachListener('a', (data)=>
		{
			parseMessage(2, data, "init");
		});
		this.rfcomm_pod3.attachListener('a', (data)=>
		{
			parseMessage(3, data, "init");
		});
		this.rfcomm_pod4.attachListener('a', (data)=>
		{
			parseMessage(4, data, "init");
		});

		//add listener for request start time. Immediately send back current timestamp - milliseconds specified in data.
				
		//add listeners for errors (i - n)
		this.attachAllListeners('g'); //ready for retrieval

		this.attachAllListeners('i');
		this.attachAllListeners('j');
		this.attachAllListeners('k');
		this.attachAllListeners('l');
		this.attachAllListeners('m');
		this.attachAllListeners('n');		
		
		//attach listeners for temp 
		this.attachDataListener('b', "temp");
		this.attachDataListener('o', "temp");

		//attach listeners for humidity
		this.attachDataListener('c', "moist");
		this.attachDataListener('p', "moist");
				
		//prob call funct to split into data and timestamp
		
		// this.mc_text_field_interval = setInterval(() =>
		// {
		// 	this.feedback("Mission Control Text Area Log Test Overflow");
		// }, 50);
		this.log.output("PODS class constructed");
		this.log.debug1("DEBUG 1");
		this.log.debug2("DEBUG 2");
		this.log.debug3("DEGUB 3");
	}
	/**
     * React method is called by Cortex when mission control sends a command to RoverCore and is targeting this lobe
     * @param {mixed} input - command from mission control.
     * @returns {boolean} returns true if react was successful, returns false if react failed.
     */
	 
	 //work on this
	react(input)
	{
		//MC user actually only send start_stop_message
		//start_time automatically sent in form of UNIX 32 bit timestamp when CS send's via 'a'
		if( //"start_time" in input &&
			"start_stop_message" in input && 
			"podNum" in input)
		{
			//TODO
			//how exactly do I specify which pod I want to send the command to?
			
			//TODO: 'q' sent automatically in response to 'a' sent by CS 
			if(input.podNum == 1)
			{
				//this.rfcomm_pod1.sendCommand('q', input.start_time);
				this.rfcomm_pod1.sendCommand('r', input.start_stop_message);
			}
			else if(input.podNum == 2)
			{
				//this.rfcomm_pod2.sendCommand('q', input.start_time);
				this.rfcomm_pod2.sendCommand('r', input.start_stop_message);
			}
			else if(input.podNum == 3)
			{
				//this.rfcomm_pod3.sendCommand('q', input.start_time);
				this.rfcomm_pod3.sendCommand('r', input.start_stop_message);
			}
			else 
			{
				//this.rfcomm_pod4.sendCommand('q', input.start_time);
				this.rfcomm_pod4.sendCommand('r', input.start_stop_message);
			}
		
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
	
	parseMessage(podNum, messagebits, type)
	{

		var dataMask = 4294901760; //1111 1111 1111 1111  0000 0000 0000 0000 
		var timestampMask = 65535;  //0000 0000 0000 0000  1111 1111 1111 1111
		
		var data = messageBits & dataMask;

		var timestampOffsetInSec = messageBits & timestampMask;
		var timestampOffsetInMilliseconds = timestampOffsetInSec * 1000;
		
		if(type == "init")
		{
			sendInitStartTime(podNum, timestampOffsetInMilliseconds);
		}
		else //already initialized start time, just update when we last got sent something 
		{
			//TODO 
			//Else, update lastSentTimestamp and send if needed for error 
			lastSentTimestamp = initTimestamp[podNum].getTime() + timestampOffsetInMilliseconds);
		}
		
		//put data into specific temp/moisture key for that pod 
		if(type == "temp")
		{
			convertToTemp(podNum, data);
		}
		else if(type == "moist")
		{
			convertToMoist(podNum, data);
		}
		//update milliseconds elapsed 
		//this.model.set(podTimestampKey[podNum], updatedTimestamp);

		var updatedTimestamp = new Date(lastSentTimestamp);
		this.locals.timestamp[podNum] = updatedTimestamp;
		
	}

	convertToTemp(podNum, data)
	{
		var degC = -66.875 + 218.75 * (data * (5/1023))/3.3;
		var tempRegisterKey = "pod" + podNum + "_TempData";
		//this.model.set(tempRegisterKey, degC);
		this.locals.TempData[podNum] = degC;
	}
	convertToMoist(podNum, data)
	{
		var relativeHumididty = -12.5 + 125 * (raw * (5/1023))/3.3;
		var moistRegisterKey = "pod" + podNum + "_MoistData";
		//this.model.set(moistRegisterKey, relativeHumidity);
		this.locals.MoistData[podNum] = relativeHumidity;
	}
	
	sendInitStartTime(podNum, timestampOffsetInMilliseconds)
	{
		//get current timestamp and subtract the timestampOffsetInMilliseconds from that 
		var currentTime = new Date();
		var currentTimeInMilli = currentTime.getTime();
		
		var timeStarted = currentTimeInMilli - timestampOffsetInMilliseconds;
		
		var initDate = new Date(timeStarted); //store this as the init start time of the rover 
		initTimestamp[podNum] = initDate;
		lastSentTimestamp[podNum] = initDate;
		
		var initDateInSec = Math.floor(initDate/1000); //what we send over 
		
		//send over to CS 
		if(input.podNum == 1)
		{
			this.rfcomm_pod1.sendCommand('q', initDateInSec);
		}
		else if(input.podNum == 2)
		{
			this.rfcomm_pod2.sendCommand('q', initDateInSec);
		}
		else if(input.podNum == 3)
		{
			this.rfcomm_pod3.sendCommand('q', initDateInSec);
		}
		else 
		{
			this.rfcomm_pod4.sendCommand('q', initDateInSec);
		}
	}

	
	attachDataListener(key, type)
	{

		//attach listener. Call data parsing function when message sent over key 
		this.rfcomm_pod1.attachListener(key, (data)=>
		{
			parseMessage(1, data, type);
		});
		this.rfcomm_pod2.attachListener(key, (data)=>
		{
			parseMessage(2, data, type);
		});
		this.rfcomm_pod3.attachListener(key, (data)=>
		{
			parseMessage(3, data, type);
		});
		this.rfcomm_pod4.attachListener(key, (data)=>
		{
			parseMessage(4, data, type);
		});


	}
	sendPickupLog(podNum)
	{
		this.log.output(`Pod  `, podNum, `ready for retrieval`);
		this.feedback(`Pod  `, podNum, `ready for retrieval`);
	}
	sendErrorLog(podNum, errorKey)
	{
		this.log.output(`Pod  `, podNum, `: error related to key `, errorKey);
		this.feedback(`Pod  `, podNum, `: error related to key `, errorKey);
	} 

	attachAllListeners(key)
	{
		if(key == "g")
		{
			this.rfcomm_pod1.attachListener(key, (data)=>
			{
				sendPickupLog(1);
			});
			this.rfcomm_pod2.attachListener(key, (data)=>
			{
				sendPickupLog(2);
			});
			this.rfcomm_pod3.attachListener(key, (data)=>
			{
				sendPickupLog(3);
			});
			this.rfcomm_pod4.attachListener(key, (data)=>
			{
				sendPickupLog(4);
			});
		}
		else
		{
			this.rfcomm_pod1.attachListener(key, (data)=>
			{
				sendErrorLog(1, key);
			});
			this.rfcomm_pod2.attachListener(key, (data)=>
			{
				sendErrorLog(2, key);
			});
			this.rfcomm_pod3.attachListener(key, (data)=>
			{
				sendErrorLog(3, key);
			});
			this.rfcomm_pod4.attachListener(key, (data)=>
			{
				sendErrorLog(4, key);
			});
		}
		
	}
	
}


module.exports = Pods;

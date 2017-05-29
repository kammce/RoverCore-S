const BAUD_RATE = 9600;
const ZERO = 0;
const DEVICE_PORT = '/dev/ttyGPS';
//const

"use strict";
//  /dev/cu.usbmodem1411

var Neuron = require('../Neuron');
var SerialPort = require("serialport");
var sysFsPath = "/sys/class/gpio";
var fs = require('fs')
var exec = require('child_process').exec;

class Sensors extends Neuron
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

		//this.port = new util.serial.SerialPort("/dev/tty.usbmodem1411", {
		//	baudrate: 9600,
		//	parser: util.serial.parsers.readline('\r\n')
		//}, false); // false = disable auto open
		
		this.feedback("Latitude:");
		this.feedback("latDir:");
		this.feedback("Longitude:");
		this.feedback("longDir:");
		this.CMP = 0;
		this.Dose = 0;
		this.VCC = 0;
		this.O2 = {	
			Pressure: 0,
			Oxygen : 0
		};
		this.device_num = 0;
		this.Control_GPIO = [209,210];
		this.MuxInterval = 0; 
		this.model.registerMemory("GPS");
		this.model.set("GPS", {
			lat: ZERO,
			latDir: ZERO,
			long: ZERO,
			longDir: ZERO,
			alt: ZERO,
			alt_unit: ZERO,
			horiz_confidence: ZERO,
			number_of_satellites: ZERO
			/**
		 	* More variables for:
		 	* IMU (each axis)
		 	* temp(outside)
		 	* magentometer (heading)
		 	* barometer (altitude)
		 	* UBNT RSSI
			*/
		});
		this.init();
		this.model.registerMemory("Science");
		this.model.set("Science", {
			Pressure: ZERO,
			Oxygen: ZERO,
			CMP:ZERO,
			Dose:ZERO,
			VCC:ZERO 
		});
		//initialize serialport
		var port = new SerialPort("/dev/ttySAC0", { //Odroid XU4 serial port 
			baudRate: BAUD_RATE,
			parser: SerialPort.parsers.readline('\n')
		});
		var self = this; //enables "self" to work like "this" inside of port.on('data')

		var serialOpenRoutine = (err) => {
			if(trys >= retryLimit) {
				return;
			} else if (err) {
				this.log.output("Failed to open /dev/ttyGPS", trys);
				this.feedback("Failed to open /dev/ttyGPS");
				trys++;
				setTimeout(() => {
					this.log.output("Reattempting to open /dev/ttyGPS", trys);
					this.feedback("Reattempting to open /dev/ttyGPS");
					this.port.open(serialOpenRoutine);
				}, 2000);
				return;
			}
		};
		//
		port.on('open', function() {
		  port.write('main screen turn on', function(err) {
		    if (err) {
		      return console.log('Error on write: ', err.message);
		    }
		    console.log('message written');
		  });
		});

		// open errors will be emitted as an error event
		port.on('error', function(err) {
		  console.log('Error: DEVICE_PORT ', err.message);
		})
		//
		port.on('data', function (data) {
			//this.log.output(data);
			//checks that correct NMEA sentence is used
			//$GPGGA,222351.00,3720.21369,N,12152.88007,W,1,05,2.86,17.9,M,-29.9,M,,*59
			if(data.substring(0,6) === "$GPGGA"){
				//this.log.output(data);
				var piece = data.split(",",14);
				if (piece[6] ==="0") {}
				else if(piece[6] ==="1" || piece[6] ==="2") {
					//checks for fix first (1=gps, 2=dgps)
					var data = data;
					var nmeaType = piece[0];
					//piece 0 = $GPRMC
					var satellites = piece[7];
					//number of satellites
					var utc = piece[1];
					//piece 1 = UTC time
					var fix = piece[6];
					//piece 2 = 1 or 2 (which is good)
					var lat = piece[2];
					//piece 2 = latitude number
					var alt = piece[9];
					//altitude in meters
					var alt_unit = piece[10];
					var horiz_confidence= piece[8];
					var firstLat = lat.slice(0,2);
					var secondLat = lat.slice(2,10);
					var delimiter = "Âº";
					var latResult = parseFloat(firstLat)+(parseFloat(secondLat)/60);
					lat = latResult;

					var latDir = piece[3];
					//piece 4 = latitude cardianl direction
					var long = piece[4];
					var firstLong = long.slice(0,3);
					var secondLong = long.slice(3,11);
					var longResult = parseInt(firstLong)+(parseFloat(secondLong)/60);
					long = longResult;
					//piece 5 = longitude number
					var longDir = piece[5];
					//piece 6 = longitude direction

					
					//Direction 
					if(latDir === "S" ){lat *= -1;}
					if(longDir === "W" ) {long *= -1;}

					self.model.set("GPS", {
						lat: lat,
						latDir: latDir,
						long: long,
						longDir: longDir,
						alt: alt,
						alt_unit: alt_unit,
						horiz_confidence: horiz_confidence,
						number_of_satellites: satellites
						/**
					 	* More variables for:
					 	* IMU (each axis)
					 	* temp(outside)
					 	* magentometer (heading)
					 	* barometer (altitude)
					 	* UBNT RSSI
						*/
					});
					//self.log.output(self.model.get('GPS'));
				}
			}
			//select 
			else{
				var flag = parseInt(data.substring(0,1));
				if(data.substring(0,1) === "O")
				{
					var object = data.split(" ");
					self.O2.Pressure = object[5];
					self.O2.Oxygen = object[7];
					//self.log.output(self.O2);			
				}
				//select
				else if(Number.isInteger(flag))
				{
					var geiger = data.split(",");
					self.CMP = geiger[0];
					self.Dose = geiger[1];
					self.VCC = geiger[2];

				}
				self.model.set("Science", {
					Oxygen: self.O2.Oxygen,
					Pressure: self.O2.Pressure,
					CMP: self.CMP,
					Dose: self.Dose,
					VCC: self.VCC
				});
				self.log.output(self.model.get('Science'));
			}
		});
		//
		//port.write('Hi Mom!'); //write string to port
		//port.write(new Buffer('Hi Mom!')); //write buffer to port
		//
		//this.log.output(this.model.get('Sensors')); //does nothing for some reason
	}
	/**
     * React method is called by Cortex when mission control sends a command to RoverCore and is targeting this lobe
     * @param {mixed} input - command from mission control.
     * @returns {boolean} returns true if react was successful, returns false if react failed.
     */
	react(input)
	{
		var parent = this;
		switch(input.mode){
			case "MUXON" : 
				parent.muxOn();
				break;
			case "MUXOFF" : 
				parent.muxOff();
				break;
			default: 
				parent.log.output("Error Mission Control Input");
				break;
		}
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
     * Cortex will attempt to IDLE your lobes if this lobe does not receive a command from mission control in the
     * specified amount defined in the this.idle_timeout. file. This is useful for lobes that need period commands
     * from mission control. Lobes are put into IDLING state ~100ms after they are constructed.
     * @returns {boolean} returns true if successful, returns false if idle failed.
     */
	idle()
	{
		this.log.output(`IDLINGG ${this.name}`);
		this.feedback(`IDLING ${this.name}`);
		this.feedback('test');
		return true;
	}

	
 	/******************************Science Stuff******************************************/
 	init(){
 		var sysFsPath = "/sys/class/gpio";
    	this.expose(this.Control_GPIO[0]);
    	this.expose(this.Control_GPIO[1]);
    	this.direction(this.Control_GPIO[0],"out");
    	this.direction(this.Control_GPIO[1],"out");
	    fs.writeFileSync(sysFsPath + "/gpio" + this.Control_GPIO[0] + "/value", 0, "utf8");
		fs.writeFileSync(sysFsPath + "/gpio" + this.Control_GPIO[1] + "/value", 0, "utf8");

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
    	exec("echo "+pin+ " > /sys/class/gpio/export" , this.puts);
    }
    /**
     * Set direction of a GPIO pin 
     * @param {interger} input - set initially.
     * @param {string} state - set initially.
     */
    direction(pin,state){
    	var sysFsPath = "/sys/class/gpio";
    	fs.writeFileSync(sysFsPath + "/gpio" + pin + "/direction", state);
    }
     /**
     * Write 1 or 0 to a single GPIO pin 
     * @param {interger} pin - GPIO pin number.
     * @param {string} value - value to be write to.
     */
    writeGPIO(pin, value) {
	    if (value === undefined) {
	        value = 0;
	    }
	    var sysFsPath = "/sys/class/gpio";
	    fs.writeFileSync(sysFsPath + "/gpio" + pin + "/value", value, "utf8");
	}
	 /**
     * Write 1 or 0 to four GPIO pin 
     * @param {interger array} pin_array - GPIOs pin nummber.
     * @param {string} value-x - value to be write to.
     */
	writeGPIO_MUX(value1, value0) {
		var sysFsPath = "/sys/class/gpio";

	    if (value1 === undefined && value2 === undefined && value3 === undefined && value4 === undefined) {
	        value0= 0;
	        value1 = 0;
	    }
	    fs.writeFileSync(sysFsPath + "/gpio" + this.Control_GPIO[0] + "/value", value0, "utf8");
	    fs.writeFileSync(sysFsPath + "/gpio" + this.Control_GPIO[1] + "/value", value1, "utf8");
	}
	 /**
     * Write 1 or 0 to four GPIO pin 
     * @param {interger } device_num - ultrasonic number.
     */
	muxSelect(device_num) {
		var parent=this;
	    switch (device_num) {
	        case 0:
	            parent.writeGPIO_MUX(0, 0);
	            parent.DeviceID=0;
	            break;
	        case 1:
	            parent.writeGPIO_MUX(0, 1);
	            parent.DeviceID=1;
	            break;
	        case 2:
	            parent.writeGPIO_MUX(1, 0);
	            parent.DeviceID=2;
	            break;
	        default:
	        	parent.log.output("Invalid Input");
	        	break;
	    	}
	}
	/**
	* turn on the mux  
	*/
	muxOn(){
		var parent = this; 
		this.MuxInterval = setInterval(function()
		{
			parent.muxSelect(parent.device_num); //0 , 1 , 2
			parent.device_num++; // 1 , 2 , 3
			if(parent.device_num ===  3)
			{
				parent.device_num = 0;
			}
		},5000);	
 	}
 	/**
 	* turn off the mux 
 	*/
 	muxOff(){
 		clearInterval(this.MuxInterval);
 		this.device_num=0;
 		this.muxSelect(this.device_num); 
 	}	
}

module.exports = Sensors;
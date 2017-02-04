"use strict";
//  /dev/cu.usbmodem1411

var Neuron = require('../Neuron');
var SerialPort = require("serialport");

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
		this.model.registerMemory("Sensors");
		this.model.set("Sensors", {
			lat: 0,
			latDir: 0,
			long: 0,
			longDir: 0,
			alt: 0,
			alt_unit: 0,
			horiz_confidence: 0,
			number_of_satellites: 0
			/**
		 	* More variables for:
		 	* IMU (each axis)
		 	* temp(outside)
		 	* magentometer (heading)
		 	* barometer (altitude)
		 	* UBNT RSSI
			*/
		});
		//initialize serialport
		var port = new SerialPort("/dev/cu.usbmodem1411", {
			baudRate: 9600,
			parser: SerialPort.parsers.readline('\n')
		});
		var self = this;
		//

		//

		//
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
		  console.log('Error: ', err.message);
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
					var delimiter = "º";
					var latResult = firstLat+delimiter+secondLat;
					var lat = latResult;

					var latDir = piece[3];
					//piece 4 = latitude cardianl direction
					var long = piece[4];
					var firstLong = long.slice(0,3);
					var secondLong = long.slice(3,11);
					var longResult = firstLong+delimiter+secondLong;
					var long = longResult;
					//piece 5 = longitude number
					var longDir = piece[5];
					//piece 6 = longitude direction
					self.model.set("Sensors", {
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
					self.log.output(self.model.get('Sensors'));
				}
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
}

module.exports = Sensors;
//GPS is currently set to update every 100ms (hardware)
//baud set to 9600 bps
//GPGGA
//$GPGGA,222351.00,3720.21369,N,12152.88007,W,1,05,2.86,17.9,M,-29.9,M,,*59
//
"use strict";

var Neuron = require('../Neuron');

class GPS extends Neuron {
	constructor(util) {
		super(util);
		this.name = util.name;
		this.feedback = util.feedback;
		this.log = util.log;
		this.idle_time = util.idle_timeout;
		this.i2c = util.i2c;
		this.model = util.model;
		
		const retryLimit = 50;
		const INTERVAL_TIME = 100;
		const SETUP_TIME = 5000;
		var trys = 0;
		// Construct Class here
		var parent = this;

		/////////////////
		this.model.registerMemory('GPS');
		this.model.set('GPS', {
			lat: 0,
			latDir: 0,
			long: 0,
			longDir: 0,
			alt: 0,
			alt_unit: 0,
			horiz_confidence: 0,
			number_of_satellites: 0
		});
		this.port = new util.serial.SerialPort("/dev/ttyGPS", {
			baudrate: 9600,
			parser: util.serial.parsers.readline('\r\n')
		}, false); // false = disable auto open

		/* Serial Open Routine: will continously attempt to access the 
		 * serialport until retry limit has been met. */
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
		// Attempt to open Serial port
		this.port.open(serialOpenRoutine);

		this.port.on('open', () => {
			var msg = "ttyGPS has opened";
			this.log.output(msg);
			this.feedback(this.name, msg);
		});
		this.port.on('close', () => {
			var msg = "ttyGPS closed";
			this.log.output(msg);
			this.feedback(this.name, msg);
		});

		this.port.on('err', (err) => {
			var msg = "Error occurred with ttyGPS";
			this.log.output(msg, err);
			this.feedback(msg, err);
		});
		this.port.on('data', (data) => {
			//this.log.output(data);
			//checks that correct NMEA sentence is used
<<<<<<< HEAD
			//$GPGGA,222351.00,3720.21369,N,12152.88007,W,1,05,2.86,17.9,M,-29.9,M,,*59
			if(data.substring(0,6) === "$GPGGA"){
				//this.log.output(data);
				var piece = data.split(",",14);
				if (piece[6] ==="0") {
					console.log("NO GPS FIX");
=======
			/*
			$GPRMC,003657.30,A,3720.23309,N,12152.89647,W,0.476,,220516,,,A*6D
			$GPRMC,003657.40,A,3720.23295,N,12152.89654,W,0.567,,220516,,,A*6D
			$GPRMC,003657.50,A,3720.23282,N,12152.89659,W,0.616,,220516,,,A*62
			*/
			this.log.output(data);
			if(data.substring(0,6) === "$GPRMC"){
				var piece = data.split(",",7);
				if (piece[2] !=="A") {
					this.log.output("NO GPS FIX");
>>>>>>> master
				}
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
					this.model.set('GPS', {
						 lat: lat,
						 latDir: latDir,
						 long: long,
						 longDir: longDir,
						 alt: alt,
						 alt_unit: alt_unit,
						 horiz_confidence: horiz_confidence,
						 number_of_satellites: satellites
					});
					//this.log.output(this.model.get('GPS'));

				}
			}
		});
	}
	react(input) {
		this.log.output(`REACTING ${this.name}: `, input);
		this.feedback(this.name ,`REACTING ${this.name}: `, input);
	}
	halt() {
		this.log.output(`HALTING ${this.name}`);
		this.feedback(this.name ,`HALTING ${this.name}`);
	}
	resume() {
		this.log.output(`RESUMING ${this.name}`);
		this.feedback(this.name ,`RESUMING ${this.name}`);
	}
	idle() {
		this.log.output(`IDLING ${this.name}`);
		this.feedback(this.name ,`IDLING ${this.name}`);
		//not sure why you'd idle the GPS..
	}
}

module.exports = GPS; 
// ssh root@192.168.7.2
"use strict"
var Skeleton = require("../skeleton.js");

Sensor.prototype = new Skeleton("SENSOR");
Sensor.prototype.constructor = Sensor;

function Sensor(model_ref, feedback, debug) {
	this.model = model_ref;
	this.feedback = feedback;
	this.debug = false;

	//interval
	this.intervals = {
		queues: {
			compass: undefined,
			gyro: undefined,
			accelero: undefined,
			temp: undefined,
			signal: undefined
		},
		periods: {
			compass: 250,
			gyro: 250,
			accelero: 250,
			temp: 1000,
			signal: 3000
		}
	}

	global.XAXIS = 0;
	global.YAXIS = 1;
	global.ZAXIS = 2;

	var SerialPort = SERIALPORT.SerialPort; // make a local instant
	this.AuxillaryPort = new SerialPort("/dev/ttyO2", { // <--Then you open the port us$
		baudRate: 9600,
		parser: SERIALPORT.parsers.readline("\r\n") // look for return and newl$
	});
	this.gpsPort = new SerialPort("/dev/ttyO1", { // <--Then you open the port using new() like so
			baudRate: 9600,
			parser: SERIALPORT.parsers.readline("\r\n") // look for return and newline at the end of each data packet
	});
	this.buffer = new Buffer(100);
	//initiate
	this.initGYRO();
	this.initACCELEROMETER();
	this.initCOMPASS();
	this.initGPS();
	// [power,voltage,potentiometer]
	this.initAUXPORT();    
	this.initSignalTracker();
	this.initTemp();
};

Sensor.prototype.handle = function(data) { // take command from user interface
	console.log(this.module + " Recieved ", data);
	//start command 
	switch(data) {
		case "START-ALL":
			this.initGYRO();
			this.initACCELEROMETER();
			this.initCOMPASS();
			this.initGPS();
			return "GATHERING SENSOR DATA";
		case "START-GRYO":
			this.initGYRO();
			return "STARTING GRYO";
		case "START-ACCELEROMETER":
			this.initACCELEROMETER();
			return "STARTING ACCELEROMETER";
		case "START-COMPASS":
			this.initCOMPASS();
			return "STARTING COMPASS";
		case "START-GPS":
			this.initGPS();
			return "STARTING GPS";
		case "STOP-ALL":
			clearInterval(this.intervals.queues.compass);
			clearInterval(this.intervals.queues.gyro);
			clearInterval(this.intervals.queues.accelero);
			clearInterval(this.intervals.queues.temp);
			clearInterval(this.intervals.queues.signal);
			return "STOPPING ALL SENSORS";
		case "STOP-GRYO":
			clearInterval(this.intervals.queues.gyro);
			return "STOPPING GRYO";
		case "STOP-ACCELEROMETER":
			clearInterval(this.intervals.queues.accelero);
			return "STOPPING ACCELEROMETER";
		case "STOP-COMPASS":
			clearInterval(this.intervals.queues.compass);
			return "STOPPING COMPASS";
		case "STOP-GPS":
			return "STOPPING GPS*";
		case "STOP-TEMP":
			clearInterval(this.intervals.queues.temp);
			return "STOPPING GPS*";
		case "STOP-SIGNAL":
			clearInterval(this.intervals.queues.signal);
			return "STOPPING GPS";
		case "MAST-UP":
			this.model.acuator.sent_position = "U";
			this.acuator();
			return "MAST GOING UP";
		case "MAST-DOWN":
			this.model.acuator.sent_position = "D";
			this.acuator();
			return "MAST GOING DOWN";
		default:
			return "INVALID SENSORS COMMAND GIVEN: " + data;
	}
};


Sensor.prototype.initCOMPASS = function() { // degrees refer to North
   clearInterval(this.intervals.queues.compass);
   try { 
		var address_compass = 0x1e; //address of compass
		var wire = new I2C(address_compass, {
			device: '/dev/i2c-2'
		});
	} catch(err){
		console.log("error", err);
		this.feedback(this.module, "COMPASS FAILED TO INITIALIZE!");
		return;
	}
	var parent = this;

	wire.writeBytes(0x00, [0x70], function(err) {});
	wire.writeBytes(0x01, [0xA0], function(err) {});
	//countinuous read mode
	wire.writeBytes(0x02, [0x00], function(err) {}); 

	this.intervals.queues.compass = setInterval(function() {
		wire.readBytes(0x03, 6, function(err, res) {
			var x = 0;
			var y = 0;
			var z = 0;
			if (!err) {
				// convert binary to signed decimal 
				x = new Int16Array([res[0] << 8 | res[1]])[0]; //put binary into an array and called back the first numer
				z = new Int16Array([res[2] << 8 | res[3]])[0];
				y = new Int16Array([res[4] << 8 | res[5]])[0];
			} else {
				console.log("Erro" + JSON.stringify(err));
			}
			var declinationAngle = 0.226; //use in compass functions, value needed checking with sensor
			var pi = 3.14;
			var heading = Math.atan2(y, x);
			// Once you have your heading, you must then add your 'Declination Angle', which is the 'Error' of the magnetic field in your location.
			//If you cannot find your Declination, comment out this lines, your compass will be slightly off.
			heading += declinationAngle;
			// Correct for when signs are reversed.
			if (heading < 0) {
				heading += 2 * pi;
			}
			// Check for wrap due to addition of declination.
			else if (heading > 2 * pi) {
				heading -= 2 * pi;
			}
			// Convert radians to degrees for readability.
			var mod_heading = ((heading * 180) / pi);
			if (mod_heading >= 0 && mod_heading <= 137) {
				mod_heading *= .6569;
			} else if (mod_heading > 137 && mod_heading <= 215) {
				mod_heading = ((mod_heading - 137) * 1.16883117 + 90);
			} else if (mod_heading > 215 && mod_heading <= 281) {
				mod_heading = ((mod_heading - 215) * 1.3636 + 180);
			} else if (heading > 281 && heading <= 0) {
				mod_heading = ((mod_heading - 281) * 1.3924 + 270);
			}
			if (mod_heading >= 180) {
				mod_heading -= 180;
			} 
			else if (mod_heading < 180 && mod_heading >= 0) {
				mod_heading += 180;
			}
			parent.model.compass.heading = -(mod_heading-360);
			if(parent.debug) {
				console.log('Heading: ' + parent.model.compass.heading + ' degrees');
			}
		});
	}, this.intervals.periods.compass);
};

Sensor.prototype.initGYRO = function() {
   clearInterval(this.intervals.queues.gyro);
   try { 
		var address_gyroscope = 0x68; //address of gyroscope
		var wire = new I2C(address_gyroscope, {
			device: '/dev/i2c-2'
		});
	} catch(err){
		console.log("error", err);
		this.feedback(this.module, "GYRO FAILED TO INITIALIZE!");
		return;
	}
	var x, y, z;
	var parent = this;

	wire.writeBytes(0x16, [1 << 3 | 1 << 4 | 1 << 0], function(err) {}); // set rate 2000
	wire.writeBytes(0x15, [0x09], function(err) {}); // set sample rate to 100hz

	this.intervals.queues.gyro = setInterval(function() {
		wire.readBytes(0x1D, 6, function(err, res) {
			if (!err) {
				// convert binary to signed decimal 
				x = new Int16Array([res[0] << 8 | res[1]])[0]; //put binary into an array and called back the first number
				z = new Int16Array([res[2] << 8 | res[3]])[0];
				y = new Int16Array([res[4] << 8 | res[5]])[0];
			} else {
				console.log("Error" + JSON.stringify(err));
			}
			parent.model.gyro.x = parent.model.gyro.x + ((x) / 14.375) * .1; //to get degrees 
			parent.model.gyro.y = parent.model.gyro.y + ((y) / 14.375) * .1; //
			parent.model.gyro.z = parent.model.gyro.z + ((z) / 14.375) * .1; //
			if (parent.model.gyro.x > 360) {
				parent.model.gyro.x = parent.model.gyro.x % 360;
			}
			if (parent.model.gyro.x < -360) {
				parent.model.gyro.x = parent.model.gyro.x % 360;
			}
			if (parent.model.gyro.y > 360) {
				parent.model.gyro.y = parent.model.gyro.y % 360;
			}
			if (parent.model.gyro.y < -360) {
				parent.model.gyro.y = parent.model.gyro.y % 360;
			}
			if (parent.model.gyro.z > 360) {
				parent.model.gyro.z = parent.model.gyro.z % 360;
			}
			if (parent.model.gyro.z < -360) {
				parent.model.gyro.z = parent.model.gyro.z % 360;
			}
			if (parent.debug){ 
				console.log("pitch: " + parent.model.gyro.x + " roll: " + parent.model.gyro.y + " yaw: " + parent.model.gyro.z + " degrees");
			}
		});
	}, this.intervals.periods.gyro);
};

Sensor.prototype.initACCELEROMETER = function() {
	clearInterval(this.intervals.queues.accelerometer);
	var ADXL345 = require('./ADXL345.js');
	var parent = this;
		
	var globalvar = {
		SAMPLECOUNT: 400,
		accelScaleFactor: [0.0, 0.0, 0.0],
		runTimeAccelBias: [0, 0, 0],
		accelOneG: 0.0,
		meterPerSecSec: [0.0, 0.0, 0.0],
		accelSample: [0, 0, 0],
		accelSampleCount: 0
	};
	var accel = new ADXL345(function(err) {
		accel.accelScaleFactor[XAXIS] = 0.0371299982;
		accel.accelScaleFactor[YAXIS] = -0.0374319982;
		accel.accelScaleFactor[ZAXIS] = -0.0385979986;
		if (!err) {
			parent.intervals.queues.accelerometer = setInterval(function() {
				accel.measureAccel(function(err) {
					if (!err) {
						//parent.model.accelero.x = (accel.meterPerSecSec[parent.XAXIS]) * (-8.85);
						//parent.model.accelero.y = (accel.meterPerSecSec[parent.YAXIS]) * (8.17);

						var x = (accel.meterPerSecSec[XAXIS]) ;
						var y = (accel.meterPerSecSec[YAXIS]) ;
						parent.model.accelero.z = accel.meterPerSecSec[ZAXIS];

						parent.model.accelero.y = -0.0583*y*y*y - 0.0471*y*y - 1.9784*y + 0.2597; 
						parent.model.accelero.x =  0.0475*x*x*x + 0.1038*x*x + 3.4858*x + 0.1205; 

						if (parent.debug){ 
							console.log("Roll: " + parent.model.accelero.x + " Pitch : " + parent.model.accelero.y + " Yaw : " + parent.model.accelero.z);
						}
					} else {
						console.log(err);
					}
				});
			}, parent.intervals.periods.accelerometer);
		} else {
			console.log(err);
		}
	});
};

Sensor.prototype.initGPS = function() {
	var parent = this;

	if(_.isUndefined(this.gpsPort)) {
		var SerialPort = SERIALPORT.SerialPort; // make a local instant
		this.gpsPort = new SerialPort("/dev/ttyO1", { // <--Then you open the port using new() like so
			baudRate: 9600,
			parser: SERIALPORT.parsers.readline("\r\n") // look for return and newline at the end of each data packet
		});
	}
	this.gpsPort.on('open', function() {
		console.log('[GPS] Port Open. Data Rate: ' + parent.gpsPort.options.baudRate);
		console.log("[GPS] begin initialization"); //begin initialization
		parent.gpsPort.write("$PMTK314,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0*29\r\n");
		parent.gpsPort.write("$PMTK220,200*2C\r\n"); //5hz update
		parent.gpsPort.write("$PMTK300,200,0,0,0,0*2F\r\n"); //    //5hz
		console.log("[GPS] initialization complete!"); //print out to terminal
		parent.feedback(parent.module,"[GPS] initialization complete!"); //print out to terminal
	});
	this.gpsPort.on('close', function() {
		console.log('port closed.');
	});
	this.gpsPort.on('error', function() {
		console.log('Serial port error: ' + error);
	});
	this.gpsPort.on('data', function(data) {
		var piece = data.split(",", 7);
		//making variables
		var lat = piece[3];
		var lat_dir = piece[4];
		var lng = piece[5];
		var lng_dir = piece[6];

		parent.model.GPS.longitude = lng;
		parent.model.GPS.latitude = lat;
		parent.model.GPS.longitude_dir = lng_dir;
		parent.model.GPS.latitude_dir = lat_dir;
		if (parent.debug){ 
			console.log("lat: " + parent.model.GPS.latitude + " long: " + parent.model.GPS.longitude);
		}
	});
};
Sensor.prototype.initAUXPORT = function() {
	var parent = this;

	if(_.isUndefined(this.gpsPort)) {
		var SerialPort = SERIALPORT.SerialPort; // make a local instant
		this.AuxillaryPort = new SerialPort("/dev/ttyO2", { // <--Then you open the port us$
			baudRate: 9600,
			parser: SERIALPORT.parsers.readline("\r\n") // look for return and newl$
		});
	}

	this.AuxillaryPort.open(function(error) {
		if (error) {
			console.log("AUXILLARY ARDUINO PORT FAILED TO OPENED!");
			parent.feedback(this.module, "AUXILLARY ARDUINO PORT FAILED TO OPENED!");
		} else {
			console.log("AUXILLARY ARDUINO PORT HAS BEEN OPENED");
			parent.feedback(parent.module, "AUXILLARY ARDUINO PORT HAS BEEN OPENED!");
			parent.AuxillaryPort.on('data', function(data) {
				var voltage_string = [""];      //initiate a string
				var current_string = [""];
				var potentiometer_string = [""];                  
				var end_bit = '#'; 

				parent.buffer = data;
				for (var i = 0; i < 20; i++) {
					//current evaluation 
					if (parent.buffer[i] == 'C' ) {
						while (parent.buffer[++i] != end_bit) {
							current_string += parent.buffer[i];   // populate string
							parent.model.power.current = parseFloat(current_string); // change string into float
						}
					}
					//voltage evaluation
					if (parent.buffer[i] == 'V') {
						while (parent.buffer[++i] != end_bit) {
							voltage_string += parent.buffer[i];  // populate string
							parent.model.power.voltage = parseFloat(voltage_string); // change string into float 
						}
					}
					//acuator evaluation 
					if (parent.buffer[i] == 'P') {
						while (parent.buffer[++i] <= end_bit) {
							potentiometer_string += parent.buffer[i];  // populate string
							parent.model.acuator.potentiometer = parseFloat(potentiometer_string); // change string into float 
						}
					}
				}
				if(parent.debug) {
					console.log("voltage: " + parent.model.power.voltage);
					console.log("current: " + parent.model.power.current);
					console.log("potentiometer: " + parent.model.acuator.potentiometer);
				}
			});
		}
   });                       
};

Sensor.prototype.acuator = function() {
	var parent = this;
	//write command to arduino
	this.AuxillaryPort.write(this.model.acuator.sent_position, function() {
		parent.feedback(this.module, "ACUATOR HAS BEEN SENT COMMAND"+this.model.acuator.sent_position);
	});
};

Sensor.prototype.initTemp = function() {    
  var parent = this;
  this.intervals.queues.temp = setInterval(function(){
	fs.readFile('/sys/class/hwmon/hwmon0/device/temp1_input', 'utf8', function (err,data) {
		if (err) { return console.log(err); }
		parent.model.temperature.cpu = data/1000;
		if(parent.debug) {
			console.log("temperature: " + parent.model.temperature.cpu  );	
		}
	});
   }, this.intervals.periods.temp);
};

Sensor.prototype.initSignalTracker = function() {
	var parent = this;
	clearInterval(this.intervals.queues.signal);
	console.log("INIT SIGNAL TRACKER!!");
	this.intervals.queues.signal = setInterval(function() {
		http.get("http://verizonbrv/srv/status?_="+Math.random(), function(res) {
			//console.log("RES status = "+res.statusCode);
			res.on("data", function(chunk) {
				try {
					var status = JSON.parse(chunk);
					parent.model.signal.strength = parseInt(status["statusData"]["statusBarRSSI"]);
					parent.model.signal.bars = parseInt(status["statusData"]["statusBarSignalBars"]);
					// console.log("RSSI = "+status["statusData"]["statusBarRSSI"]+"dBm");
					// console.log("BARS = "+status["statusData"]["statusBarSignalBars"]);
				} catch(e) {
					console.log("chunk error: ",e);
					parent.model.signal.strength = -1;
					parent.model.signal.bars = -1;
				}
				//console.log("BODY: " + chunk);
			});
		});
	}, this.intervals.periods.signal);
};
Sensor.prototype.resume = function() {};
Sensor.prototype.halt = function() {};
module.exports = exports = Sensor;

// ssh root@192.168.7.2
"use strict"
var Skeleton = require("../skeleton.js");

Sensor.prototype = new Skeleton("SENSOR");
Sensor.prototype.constructor = Sensor;

function Sensor(model_ref, feedback, debug) {
	this.model = model_ref;
	this.feedback = feedback;
	this.debug = debug;

	//interval
	this.interval_compass = 1000;
	this.interval_gyro = 1000;
	this.interval_accelero = 1000;

	this.interval_GPS = 5000;
	this.interval_Serialdata = 10000;

	this.XAXIS = 0;
	this.YAXIS = 1;
	this.ZAXIS = 2;
		
	this.buffer = new Buffer(100);

	//initiate 
	this.gyro();
	this.accelero();
	this.compass();
	this.GPS();
	this.Serialdata();    // [power,voltage,potentiometer]
};

Sensor.prototype.handle = function(data) { // take command from user interface
	console.log(this.module + " Recieved ", data);


	//start command 
	if (data.start == "all") {

		this.gyro();
		this.accelero();
		this.compass();
		this.GPS();
		return "gyro:  pitch:" + this.model.pitch_gyro + "  roll:" + this.model.roll_gyro + " yaw:" + this.model.yaw_gyro + "  accelero:  pitch:" + this.model.pitch_accelero + "  roll:" + this.model.roll_accelero + " yaw:" + this.model.yaw_accelero + " Heading: " + this.model.compass.heading + " degrees";
	}

	if (data.start == "gyro") {
		this.gyro();
		return "gyro:  pitch:" + this.model.pitch_gyro + "  roll:" + this.model.roll_gyro + " yaw:" + this.model.yaw_gyro;
	}

	if (data.start == "accelero") {
		this.accelero();
		return "accelero:  pitch:" + this.model.pitch_accelero +
			"  roll:" + this.model.roll_accelero + " yaw:" + this.model.yaw_accelero;
	}

	if (data.start == "compass") {
		this.compass();
		return " Heading: " + this.model.compass.heading + " degrees";
	}

	if (data.start == "GPS") {
		this.GPS();
		return " Lat: " + this.model.GPS.lattitude + " Lon: " + this.model.GPS.longitude;
	}


	//stop command 
	if (data.stop == "all") {
		clearInterval(this.compass_stop);
		clearInterval(this.gyro_stop);
		clearInterval(this.accelero_stop);
		clearInterval(this.GPS_stop)
		return "data stream has stopped";
	}

	if (data.stop == "compass") {
		clearInterval(this.compass_stop);
		return "compass stream has stopped";
	}

	if (data.stop == "gyro") {
		clearInterval(this.gyro_stop);
		return "gyro stream has stopped";
	}

	if (data.stop == "accelero") {
		clearInterval(this.accelero_stop);
		return "accelero stream has stopped";
	}

	if (data.stop == "GPS") {
		clearInterval(GPS_stop);
		return "GPS stream has stopped";
	}


	//set priority command 
	if (data.priority == "gyro high" | data.priority == "accelero high" | data.priority == "compass high" | data.priority == "GPS high") {
		this.interval_gyro = 1000;
		this.interval_compass = 1000;
		this.interval_accelero = 1000;
		this.interval_GPS = 10000;

	}

	if (data.priority == "gyro medium" | data.priority == "accelero medium" | data.priority == "compass medium" | data.priority == "GPS medium") {
		this.interval_gyro = 10000;
		this.interval_compass = 10000;
		this.interval_accelero = 10000;
		this.interval_GPS = 30000;

	}

	if (data.priority == "gyro low" | data.priority == "accelero low" | data.priority == "compass low" | data.priority == "GPS low") {
		this.interval_gyro = 30000;
		this.interval_compass = 30000;
		this.interval_accelero = 30000;
		this.interval_GPS = 10000;

	}


	//acuator command 

	if (data == "MAST-UP"){
		parent.model.acuator.sent_position = "U";
		this.acuator();
	}

	else if (data == "MAST-DOWN"){
		parent.model.acuator.sent_position = "D"
		this.acuator();
	}    

};


Sensor.prototype.compass = function() { // degrees refer to North
   try{ 
	var address_compass = 0x1e; //address of compass
	var wire = new I2C(address_compass, {
		device: '/dev/i2c-2'
	});

	}

	catch(err){
		console.log("error");
	}
	var parent = this;
	var x = 0;
	var y = 0;
	var z = 0;

	wire.writeBytes(0x00, [0x70], function(err) {});
	wire.writeBytes(0x01, [0xA0], function(err) {});
	wire.writeBytes(0x02, [0x00], function(err) {}); //countinuous read mode

	this.compass_stop = setInterval(function() {
		wire.readBytes(0x03, 6, function(err, res) {

			if (!err) {
				console.log("Res" + JSON.stringify(res));

				// convert binary to signed decimal 

				x = new Int16Array([res[0] << 8 | res[1]])[0]; //put binary into an array and called back the first numer
				z = new Int16Array([res[2] << 8 | res[3]])[0];
				y = new Int16Array([res[4] << 8 | res[5]])[0];
			} else {
				console.log("Erro" + JSON.stringify(err));
			}

			var declinationAngle = .226; //use in compass functions, value needed checking with sensor
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
			parent.model.compass.heading = ((heading * 180) / pi);

			if (parent.model.compass.heading >= 0 && parent.model.compass.heading <= 137) {
				parent.model.compass.heading *= .6569;

			} else if (parent.model.compass.heading > 137 && parent.model.compass.heading <= 215) {
				parent.model.compass.heading = ((parent.model.compass.heading - 137) * 1.16883117 + 90);

			} else if (parent.model.compass.heading > 215 && parent.model.compass.heading <= 281) {
				parent.model.compass.heading = ((parent.model.compass.heading - 215) * 1.3636 + 180);

			} else if (heading > 281 && heading <= 0) {
				parent.model.compass.heading = ((parent.model.compass.heading - 281) * 1.3924 + 270);
			}

			if (parent.model.compass.heading >= 180) {
				parent.model.compass.heading -= 180;
			} 
			else if (parent.model.compass.heading < 180 && parent.model.compass.heading >= 0) {
				parent.model.compass.heading += 180;
			}

			parent.model.compass.heading = -(parent.model.compass.heading-360)

		   if (parent.debug == 'true'){ 
			console.log('Heading: ' + parent.model.compass.heading + ' degrees');
			}

		});

	}, parent.interval_compass);

};

Sensor.prototype.gyro = function() {

	var address_gyroscope = 0x68; //address of gyroscope
	var wire = new I2C(address_gyroscope, {
		device: '/dev/i2c-2'
	});
	var x, y, z;
	var parent = this;

	wire.writeBytes(0x16, [1 << 3 | 1 << 4 | 1 << 0], function(err) {}); // set rate 2000
	wire.writeBytes(0x15, [0x09], function(err) {}); // set sample rate to 100hz

	this.gyro_stop = setInterval(function() {

		wire.readBytes(0x1D, 6, function(err, res) {

			console.log("Res" + JSON.stringify(res));

			if (!err) {
				// convert binary to signed decimal 
				x = new Int16Array([res[0] << 8 | res[1]])[0]; //put binary into an array and called back the first number
				z = new Int16Array([res[2] << 8 | res[3]])[0];
				y = new Int16Array([res[4] << 8 | res[5]])[0];

			}

			else {
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

			if (parent.debug == 'true'){ 
				console.log("pitch: " + parent.model.gyro.x + " roll: " + parent.model.gyro.y + " yaw: " + parent.model.gyro.z + " degrees");
			}

		});
	}, parent.interval_gyro);
};

Sensor.prototype.accelero = function() {
	var ADXL345 = require('./ADXL345.js');
	var parent = this;

	this.XAXIS = 0;
	this.YAXIS = 1;
	this.ZAXIS = 2;

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
			computeAccelBias();
		} else {
			console.log(err);
		}
	});

	function computeAccelBias() {
		accel.computeAccelBias(function() {
			measureAccel();
		});
	}

	function measureAccel() {
		parent.accelero_stop = setInterval(function() {
			accel.measureAccel(function(err) {
				if (!err) {

					//parent.model.accelero.x = (accel.meterPerSecSec[parent.XAXIS]) * (-8.85);
					//parent.model.accelero.y = (accel.meterPerSecSec[parent.YAXIS]) * (8.17);

					var x = (accel.meterPerSecSec[parent.XAXIS]) ;
					var y = (accel.meterPerSecSec[parent.YAXIS]) ;
					parent.model.accelero.z = accel.meterPerSecSec[parent.ZAXIS];

					parent.model.accelero.y = -0.0583*x*x*x - 0.0471*x*x - 1.9784*x + 0.2597 
					parent.model.accelero.x =  0.0475*x*x*x + 0.1038*x*x + 3.4858*x + 0.1205 

					if (parent.debug == 'true'){ 
					console.log("Roll: " + parent.model.accelero.x + " Pitch : " + parent.model.accelero.y + " Yaw : " + parent.model.accelero.z);
					}

				} else {
					console.log(err);
				}
			});
		}, parent.interval_accelero);
	}
};

Sensor.prototype.GPS = function() {
	var parent = this;
	var SerialPort = SERIALPORT.SerialPort; // make a local instant
	var myPort = new SerialPort("/dev/ttyO1", { // <--Then you open the port using new() like so
		baudRate: 9600,
		parser: SERIALPORT.parsers.readline("\r\n") // look for return and newline at the end of each data packet
	});

	myPort.on('open', showPortOpen);
	myPort.on('close', showPortClose);
	myPort.on('error', showError);

	setInterval(function() {
	  myPort.on('data', function(data) {
		console.log(' '); //adds line to separate
		console.log(data); // full unparsed data
		var piece = data.split(",", 7);
		console.log(piece[0], piece[2]); //$GPRMC, A/V
		console.log(piece[3], piece[4]); // LAT, dir
		console.log(piece[5], piece[6]); // LONG, dir
		//making variables
		var lat = piece[3];
		var lat_dir = piece[4];
		var lng = piece[5];
		var lng_dir = piece[6];

		parent.model.GPS.longitude = lng;
		parent.model.GPS.latitude = lat;
		parent.model.GPS.longitude_dir = lng_dir;
		parent.model.GPS.latitude_dir = lat_dir;

		if (parent.debug == 'true'){ 
			console.log("lat: " + parent.model.GPS.latitude + " long: " + parent.model.GPS.longitude);
		}
	  }); 
	}, parent.interval_GPS);   

	function showPortOpen() {
		console.log('[GPS] Port Open. Data Rate: ' + myPort.options.baudRate);
		console.log("[GPS] begin initialization"); //begin initialization
		myPort.write("$PMTK314,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0*29\r\n");
		myPort.write("$PMTK220,200*2C\r\n"); //5hz update
		myPort.write("$PMTK300,200,0,0,0,0*2F\r\n"); //    //5hz
		console.log("[GPS] initialization complete!"); //print out to terminal
	}

	function showPortClose() {
		console.log('port closed.');
	}

	function showError(error) {
		console.log('Serial port error: ' + error);
	}
};
Sensor.prototype.Serialdata = function() {
  var parent = this;
 
  var SerialPort = SERIALPORT.SerialPort; // make a local instant
  var PowerPort = new SerialPort("/dev/ttyO2", { // <--Then you open the port us$
	  baudRate: 9600,
	  parser: SERIALPORT.parsers.readline("\r\n") // look for return and newl$
  });

  PowerPort.open(function(error) {
	if (error) {
	  console.log('failed to open: ' + error);
	} else {
		console.log('open');
		setInterval(function() {
			PowerPort.on('data', function(data) {
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
					if (parent.debug == 'true') { 
						console.log("voltage: " + parent.model.power.voltage);
						console.log("current: " + parent.model.power.current);
						console.log("potentiometer: " + parent.model.acuator.potentiometer);
					} 
			});
		}, parent.interval_Serialdata); 
	  }
   });                       
};

Sensor.prototype.acuator = function() {

  var parent = this;
  var SerialPort = SERIALPORT.SerialPort; // make a local instant
  var AcuatorPort = new SerialPort("/dev/ttyO1", { // <--Then you open the port us$
	  baudRate: 9600,
	  parser: SERIALPORT.parsers.readline("\r\n") // look for return and new ln
  });

  AcuatorPort.open(function(error) {
	if (error) {
	  console.log('failed to open: ' + error);
		} 
	else {
	console.log('open');

	//write command to arduino 
	AcuatorPort.write(parent.model.acuator.sent_position, function() {
		console.log("command sended");   
		});
	  }
   });
};
Sensor.prototype.optical = function() {
	//TODO
};

Sensor.prototype.resume = function() {};
Sensor.prototype.halt = function() {};


module.exports = exports = Sensor;

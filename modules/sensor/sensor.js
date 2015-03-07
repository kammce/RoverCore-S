"use strict";

var Skeleton = require("../skeleton.js");
var ADXL345 = require('./index.js');

Sensor.prototype = new Skeleton("SENSOR");
Sensor.prototype.constructor = Sensor;
function Sensor(model_ref, feedback) {
	this.model = model_ref;
	this.feedback = feedback;
		
};	

Sensor.prototype.handle = function (data) {				// take command from user interface
	console.log(this.module+" Recieved ", data);
	if(data.start== "all"){

		this.gyro();
		this.accelero();
		this.compass();
		return "gyro:  pitch:" + this.model.pitch_gyro + "  roll:" + this.model.roll_gyro + " yaw:"  + this.model.yaw_gyro
		+ "  accelero:  pitch:" + this.model.pitch_accelero + "  roll:" + this.model.roll_accelero + " yaw:"  + this.model.yaw_accelero 
		+ " Heading: " + this.model.compass.heading + " degrees";
	}

	if(data.start == "gyro"){
		this.gyro();
		return "gyro:  pitch:" + this.model.pitch_gyro + "  roll:" + this.model.roll_gyro + " yaw:"  + this.model.yaw_gyro;
	}
		
	if(data.start == "accelero"){
		this.accelero();
	   	return "accelero:  pitch:" + this.model.pitch_accelero +
	   	 "  roll:" + this.model.roll_accelero + " yaw:"  + this.model.yaw_accelero; 
	}  	 

	if(data.start == "compass"){
		this.compass();
		return " Heading: " + this.model.compass.heading + " degrees" ;
	}

	if(data.stop == "all"){
		clearInterval();
		return "data stream has stopped";
	}

	if(data.stop == "compass" ){
		clearInterval(compass_stop);
		return "compass stream has stopped";
	}
};


Sensor.prototype.update = function() {
	//TODO
};

Sensor.prototype.compass = function() {                 // degrees refer to North

	var address_compass = 0x1e; //address of compass
   	var wire = new I2C(address_compass, {device: '/dev/i2c-2'});

   	wire.writeBytes( 0x00, [0x70], function(err){});
	wire.writeBytes( 0x01, [0xA0], function(err){});   	
   	wire.writeBytes( 0x02, [0x00], function(err){});   //countinuous read mode

  compass_stop = setInterval(function(){ 
		wire.readBytes(0x03, 6, function(err,res){

			if (!err){
			console.log("Res" + JSON.stringify(res));
			
			// convert binary to signed decimal 

			this.model.compass.x = new Int16Array([res[0] << 8 | res[1]])[0]; //put binary into an array and called back the first numer
			this.model.compass.z = new Int16Array([res[2] << 8 | res[3]])[0]; 
			this.model.compass.y = new Int16Array([res[4] << 8 | res[5]])[0];
   			}

   			else{
   			console.log("Erro" + JSON.stringify(err));
   			}	

    var declinationAngle = .226; //use in compass functions, value needed checking with sensor
    var pi = 3.14; 
    var heading = Math.atan2(this.model.compass.y,this.model.compass.x);

    // Once you have your heading, you must then add your 'Declination Angle', which is the 'Error' of the magnetic field in your location.
    //If you cannot find your Declination, comment out this lines, your compass will be slightly off.
    heading += declinationAngle;

    // Correct for when signs are reversed.
    if(heading < 0){
    heading += 2*pi;
    }
     // Check for wrap due to addition of declination.
    else if(heading > 2*pi ){
    heading -= 2*pi ;
	}

    // Convert radians to degrees for readability.
    heading = ((heading * 180)/pi); 

    if( heading >= 0 && heading <= 137){
    	this.model.compass.heading *= .6569 
    }

    else if ( heading > 137 && heading <= 215){
    	this.model.compass.heading = ((heading-137)*1.16883117 + 90)

    }

     else if ( heading > 215 && heading <= 281){
    	this.model.compass.heading = ((heading-215)*1.3636 + 180)

    }

    else if ( heading > 281 && heading <= 0){
    	this.model.compass.heading = ((heading-281)*1.3924 + 270)

    }

    if ( heading >= 180 ){
         	heading -= 180;
    }

    else if ( heading < 180 && heading >= 0){
            heading += 180;
    }


    console.log("x: " + this.model.compass.x + " y: " + this.model.compass.y + " z: " + this.model.compass.z + " uT");    // Display the results 
                                                                                                    //(magnetic vector values are in micro-Tesla (uT))
    console.log('Heading: ' + this.model.compass.heading + ' degrees' );


		});

	}, 1000);

};

Sensor.prototype.gyro= function(){

	var address_accelerometer = 0x53; //address of accelerometer
	var wire = new I2C (address_accelerometer, {device: '/dev/i2c-2'});

	wire.writeBytes(0x16, [1<<3 | 1<<4 | 1<<0 ], function(err) {}); // set rate 2000
	wire.writeBytes(0x15, [ 0x09 ], function(err) {}); // set sample rate to 100hz
	
	
	setInterval(function(){ 

		wire.readBytes(0x1D, 6, function(err,res){

			console.log("Res" + JSON.stringify(res));
			
			if(!err){

			// convert binary to signed decimal 

			var x = new Int16Array([res[0] << 8 | res[1]])[0]; //put binary into an array and called back the first number
			var z = new Int16Array([res[2] << 8 | res[3]])[0]; 
			var y = new Int16Array([res[4] << 8 | res[5]])[0];

			}

			else{

			console.log("Error" + JSON.stringify(err));

			}

 	this.model.gyro.x    =  (x)/14.375;    // 
    this.model.gyro.y    =  (y)/14.375;    //
    this.model.gyro.z    =  (z)/14.375;    //

    console.log("pitch: " + this.model.gyro.x + " roll: " + this.model.gyro.y + " yaw: " + this.model.gyro.z + " degrees");

		});

	}, 1000);


};

Sensor.prototype.accelero = function(){

var address_gyroscope = 0x68;    //address of gyroscope
this.model.accelero.x = 0;
this.model.accelero.y = 1;
this.model.accelero.z = 2;



var globalvar = {
	SAMPLECOUNT : 400,
	accelScaleFactor : [0.0, 0.0, 0.0],
	runTimeAccelBias : [0, 0, 0],
	accelOneG : 0.0,
	meterPerSecSec : [0.0, 0.0, 0.0],
	accelSample : [0, 0, 0],
	accelSampleCount : 0
}

var accel = new ADXL345(function(err) {
	accel.accelScaleFactor[this.model.accelero.x] = 0.0371299982;
	accel.accelScaleFactor[this.model.accelero.y] = -0.0374319982;
	accel.accelScaleFactor[this.model.accelero.z] = -0.0385979986;
	if (!err) {
		computeAccelBias();
	} else {
		console.log(err);
	}
})
function computeAccelBias() {
	accel.computeAccelBias(function() {
		measureAccel();
	});
}

function measureAccel() {
	setInterval(function() {
		accel.measureAccel(function(err) {
			if (!err) {
				console.log("Roll: " + accel.meterPerSecSec[this.model.accelero.x] + " Pitch : " + accel.meterPerSecSec[this.model.accelero.y] + " Yaw : " + accel.meterPerSecSec[this.model.accelero.z]);
			} else {
				console.log(err);
			}
		});
	}, 10);
}


};

Sensor.prototype.GPS = function(){
//TODO
};

Sensor.prototype.power = function(){
//TODO
};

Sensor.prototype.optical = function(){
//TODO
};	



Sensor.prototype.resume = function() {};
Sensor.prototype.halt = function() {};

module.exports = exports = Sensor;

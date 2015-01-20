"use strict";


var sensor_data = {

	gyro:{
		x:11,
		y:12,
		z:13
		},	

	accelero:{
		x:0,			
		y:0,
		z:0
		},

	compass:{							
		x:0,			
		y:0,
		z:0
		}, 
 	
 	GPS:{
		altitude:0,
		logitude:0,
		latitude:0
		},

	 Power:{
	 	voltage:0
		},

		wheel_speed:[0,0,0,0,0,0]	
};

var zeroOffset = 0.06957;		//constant for g-value
var conversionFactor = 0.4584;	//constant for g-value
var Lsb = 14.375; 	//constant use to get true rad/s
//var bone = require("rovercore/node_modules/bonescript/bonescript.js");
var Skeleton = require("../skeleton.js");


// getting raw data input from sensor

function callADC(){											
    bone.analogRead('P9_36', print_X_acclero); 	// acclerometer data
    bone.analogRead('P9_38', print_Y_acclero);
    bone.analogRead('P9_40', print_Z_acclero);
    bone.analogRead('some-pin', print_X_gyro);		//gyroscope data
    bone.analogRead('some-pin', print_Y_gyro);
    bone.analogRead('some-pin', print_Z_gyro);
    bone.analogRead('some-pin', print_X_compass);	//magnometer data
    bone.analogRead('some-pin', print_Y_compass);
    bone.analogRead('some-pin', print_Z_compass);
};

//acclerometer functions

function print_X_accelero(x) {								//convert raw data from accelerometer to get g-value
    sensor_data.accelero.x = (x.value - zeroOffset)/conversionFactor;                                     
    //console.log('Analog Read Value x: ' + sensor_data.accelero.x);    
    // when the 9D0F resting flat on a table or
    //board, then readings should be x:0
};
function print_Y_accelero(x) {								//convert raw data from accelerometer to get g-value
   sensor_data.accelero.y = (x.value - zeroOffset)/conversionFactor;  
    //console.log('Analog Read Value y: ' + sensor_data.accelero.y);
    // when the 9D0F resting flat on a table or
    //board, then readings should be y:0
};
function print_Z_accelero(x) {								//convert raw data from accelerometer to get g-value
    sensor_data.accelero.z = (x.value - zeroOffset)/conversionFactor;  
    //console.log('Analog Read Value z: ' + sensor_data.accelero.z);    
    // when the 9D0F resting flat on a table or
    //board, then readings should be z:0
    //console.log('');
};

//gyro functions

function print_X_gyro(x) {								//getting rad/s
    sensor_data.gyro.x = ((x.value)/Lsb);
    //console.log('Analog Read Value x: ' + sensor_data.gyro.x + ' rad/s'});    
};
function print_Y_gyro(x) {								//getting rad/s
    sensor_data.gyro.y = ((x.value)/Lsb);
    //console.log('Analog Read Value x: ' + sensor_data.gyro.y + ' rad/s'});    
};
function print_Z_gyro(x) {								//getting rad/s
    sensor_data.gyro.z = ((x.value)/Lsb);
    //console.log('Analog Read Value x: ' + sensor_data.gyro.z + ' rad/s'});    
};

// compass fuctions

function print_X_compass(x) {								
   sensor_data.compass.x = x.value;
};

function print_Y_compass(x) {								
    sensor_data.compass.y = x.value;
};

function print_Z_compass(x) {								
    rsensor_data.compass.z = x.value;
};


Sensor.prototype = new Skeleton("SENSOR");
Sensor.prototype.constructor = Sensor;
function Sensor(model_ref, feedback) {
	this.model = model_ref;
	this.feedback = feedback;
	this.data = {
			roll_gyro:0,
			pitch_gyro:0,
			yaw_gyro:0,
			roll_accelero:0,
			pitch_accelero:0,
			yaw_accelero:0,
			headingDegrees:0

	};

};	

Sensor.prototype.handle = function (data) {				// take command from user interface
	console.log(this.module+" Recieved ", data);
	
	if(data["request"] == "update"){
		this.update();

	}

	/*else if(data == "start"){
		switch(data["start"]){

		case all:
			this.gyro();
			this.accelero();
			this.compass();
			return "gyro:  pitch:" + this.data.pitch_gyro + "  roll:" + this.data.roll_gyro + " yaw:"  + this.data.yaw_gyro
			+ "  accelero:  pitch:" + this.data.pitch_accelero + "  roll:" + this.data.roll_accelero + " yaw:"  + this.data.yaw_accelero 
			+ " Heading: " + this.data.headingDegrees + " degrees";
			break;

		case gyro:
			this.gyro();
			return "gyro:  pitch:" + this.data.pitch_gyro + "  roll:" + this.data.roll_gyro + " yaw:"  + this.data.yaw_gyro;	
			break;

		case accelero:
			this.accelero();
	   		return "accelero:  pitch:" + this.data.pitch_accelero +
	   	 	"  roll:" + this.data.roll_accelero + " yaw:"  + this.data.yaw_accelero; 
	   	 	break;

	   	case compass:
	   		this.compass();
			return " Heading: " + this.data.headingDegrees + " degrees"; 
			break;

		default:
			console.log("commmand invalid, look at readme for valid commnad");	
		}
	}*/	

	else if(data.start== "all"){

		this.gyro();
		this.accelero();
		this.compass();
		return "gyro:  pitch:" + this.data.pitch_gyro + "  roll:" + this.data.roll_gyro + " yaw:"  + this.data.yaw_gyro
		+ "  accelero:  pitch:" + this.data.pitch_accelero + "  roll:" + this.data.roll_accelero + " yaw:"  + this.data.yaw_accelero 
		+ " Heading: " + this.data.headingDegrees + " degrees";
	}

	else if (data["start"] == "gyro"){
		this.gyro();
		return "gyro:  pitch:" + this.data.pitch_gyro + "  roll:" + this.data.roll_gyro + " yaw:"  + this.data.yaw_gyro;
	}
		
	else if (data["start"] == "accelero"){
		this.accelero();
	   	return "accelero:  pitch:" + this.data.pitch_accelero +
	   	 "  roll:" + this.data.roll_accelero + " yaw:"  + this.data.yaw_accelero; 
	}  	 

	else if (data["start"] == "compass"){
		this.compass();
		return " Heading: " + this.data.headingDegrees + " degrees";
	}	
};

Sensor.prototype.update = function() {
	sensor_data.gyro.x = (10/5);
	console.log(sensor_data.gyro.x);
};

Sensor.prototype.compass = function() {                 // degrees refer to North

    //print_X_compass();
    //print_Y_compass();
    //print_Z_compass(); 
    var declinationAngle = .226; //use in compass functions, value needed checking with sensor
    var pi = 3.14; 
    var heading = Math.atan2(sensor_data.compass.y,sensor_data.compass.x);

    // Once you have your heading, you must then add your 'Declination Angle', which is the 'Error' of the magnetic field in your location.
    //If you cannot find your Declination, comment out this lines, your compass will be slightly off.
    heading += declinationAngle;

    // Correct for when signs are reversed.
    if(heading < 0)
    heading += 2*pi;
    
     // Check for wrap due to addition of declination.
    else if(heading > 2*pi )
    heading -= 2*pi ;

    // Convert radians to degrees for readability.
    this.data.headingDegrees = ((heading * 180)/pi); 


    console.log("x: " + sensor_data.compass.x + " y: " + sensor_data.compass.y + " z: " + sensor_data.compass.z + " uT");    // Display the results 
                                                                                                    //(magnetic vector values are in micro-Tesla (uT))
    console.log('Heading: ' + this.data.headingDegrees + ' degrees' );
};

Sensor.prototype.gyro= function(){

	//print_X_gyro();
    //print_Y_gyro();
    //print_Z_gyro();
 	this.data.pitch_gyro    =  (sensor_data.gyro.x*10)/1000.0;    // k not sure if this equation is right 
    this.data.roll_gyro     =  (sensor_data.gyro.y*10)/1000.0;    //
    this.data.yaw_gyro      =  (sensor_data.gyro.z*10)/1000.0;    //

    console.log("pitch: " + this.data.pitch_gyro + " roll: " + this.data.roll_gyro + " yaw: " + this.data.yaw_gyro + " degrees");

};

Sensor.prototype.accelero = function(){

	//print_Z_accelero();
    //print_Z_accelero();
    //print_Z_accelero();

 	this.data.pitch_acclero =  Math.atan(sensor_data.accelero.x, Math.sqrt(Math.pow(sensor_data.accelero.y,2) + Math.pow(sensor_data.accelero.z,2)));
    this.data.roll_acclero  =  Math.atan(sensor_data.accelero.y, Math.sqrt(Math.pow(sensor_data.accelero.x,2) + Math.pow(sensor_data.accelero.z,2)));
    this.data.yaw_acclero   =  Math.atan(sensor_data.accelero.z, Math.sqrt(Math.pow(sensor_data.accelero.y,2) + Math.pow(sensor_data.accelero.x,2)));

     console.log("pitch: " + this.data.pitch_acclero + " roll: " + this.data.roll_acclero + " yaw: " + this.data.yaw_acclero + " degrees");

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
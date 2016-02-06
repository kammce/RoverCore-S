"use strict";

var Neuron = require('../Neuron');
var Model = require('../Model');

//Absolute constraint for yaw servo
const YAW_MIN = -630;
const YAW_MAX = 630;
//Safe constraint for yaw servo
const YAW_MIN_IDEAL = -540;        
const YAW_MAX_IDEAL = 540;
//Absolute constraint for pitch servo
const PITCH_MIN = -90;
const PITCH_MAX = 90;

//Length of pulse in uSeconds
const PWM_YAW_ZERO = 1500;
const PWM_YAW_MIN = 600;
const PWM_YAW_MAX = 2400;
const PWM_PITCH_ZERO = 1500;
const PWM_PITCH_MIN = 500;
const PWM_PITCH_MAX = 2500;
const PWM_LENGTH = 25000;

class Tracker extends Neuron {
    constructor(name, feedback, color_log, idle_timeout, i2c, model) {
        super(name, feedback, color_log, idle_timeout);
        this.name = name;
        this.feedback = feedback;
        this.log = color_log;
        this.idle_time = idle_timeout;
        this.i2c = i2c;
        this.model = model;
        // Construct Class here

		this.gimbalPosition = [0,0];
		this.defaultPosition = [0,0];
		this.lidarMeasurement = 0;

        this.model.registerMemory('LIDAR');
        this.model.registerMemory('CAMERA GIMBAL');
    }
    doStuff(input) {
    	var parent = this;
    	var promiseGetData = function(i) {
        	return new Promise(function(resolve,reject)
        	{

        		//Check if command needs sensor data, then retrieve sensor data
        		if(i.command === "moveInterval") {
        			//get data from sensors
        			//i.data.orientation = [0,0,0];
        		}
        		resolve(i);
        	});
        };

        var promiseInterpretCommand = function(i) {
        	return new Promise(function(resolve, reject)
        	{ 
        		
        		var output;      		
        		if(i.command === "moveAngleLocal") { 
        			//Command to send to next promise.
        			//Move servos        			
        			i.command = "servoWrite";
        			//Determines angle to move servos        			
        			output = parent.moveAngleLocal([i.value.yaw, i.value.pitch], parent.gimbalPosition);
        			//Updates gimbalPosition localvariables, and model
        			parent.gimbalPosition = output;
        			parent.updateModel();
        			//Converts output angle to PWM pulse length
        			output = parent.angleToPwm(output);
        			//Sends PWM pulse length to next promise
        			i.value.yaw = output[0];
        			i.value.pitch = output[1];
        			//delete i.data;
        			resolve(i);
        		} else if(i.command === "moveInterval") {
        			i.command = "servoWrite";        			
        			output = parent.moveInterval([i.value.yaw, i.value.pitch], parent.gimbalPosition, [0,0,0], [i.value.stabilizeYaw, i.value.stabilizePitch]);
        			parent.gimbalPosition = output;
        			parent.updateModel();
        			output = parent.angleToPwm(output);
        			i.value.yaw = output[0];
        			i.value.pitch = output[1];
        			//delete i.data;
        			resolve(i);
        		} else if(i.command === "defaultConfig") {
        			//Do nothing in the next promise
        			i.command = "";
        			parent.defaultConfig([i.value.yaw, i.value.pitch]);
        		} else if(i.command === "recalibrate" ) {        			
        			i.command = "servoWrite";        			
        			output = parent.recalibrate();        			
        			parent.gimbalPosition = output;
        			parent.updateModel();
        			output = parent.angleToPwm(output);
        			i.value.yaw = output[0];
        			i.value.pitch = output[1];
        			//delete i.data;
        			resolve(i);
        		} else if(i.command === "getDistance") {        			
        			resolve(i);
        		} else if(i.command === "shutDown") {
        			resolve(i);
        		}
        	});
        };

        var promiseSendI2C = function(i) {
        	return new Promise(function(resolve, reject)
        	{
        		if(i.command === "servoWrite") {
        			servoWrite(i.value.yaw, i.value.pitch, PWM_LENGTH);
        		} else if(i.command === "shutDown") {
        			//Write high to servos
        		} else if(i.command === "getDistance") {
        			//get data from lidar
        		}
        	});
        };

 	promiseGetData(input).then(promiseInterpretCommand).then(promiseSendI2C);
    }
    react(input) {
        this.log.output(`REACTING ${this.name}: `, input);
        this.feedback(`REACTING ${this.name}: `, input);
        this.doStuff(input);      
        
	}
    halt() {
        this.log.output(`HALTING ${this.name}`);
        this.feedback(`HALTING ${this.name}`);
        this.doStuff({
        	command : "moveAngleLocal",
        	value : {
        		yaw : 0,
        		pitch : -90
        	}
        });
        /*
        setTimeout(this.doStuff({
        	command : "shutDown"
        }), 3000);
*/
    }
    resume() {
        this.log.output(`RESUMING ${this.name}`);
        this.feedback(`RESUMING ${this.name}`);
        this.doStuff({
        	command : "recalibrate"
        });        
    }
    idle() {
        this.log.output(`IDLING ${this.name}`);
        this.feedback(`IDLING ${this.name}`);
        this.doStuff({
        	command : "recalibrate"
        });
    }
    recalibrate() {
    	this.feedback("Moving gimbal to default position");      	
    	return this.defaultPosition;
    }
    defaultConfig(value) {
    	if(value[0] > YAW_MAX_IDEAL || value[0] < YAW_MIN_IDEAL || 
    		value[1] > PITCH_MAX || value[1] < PITCH_MIN) {
    		return false;
    	} else {
    		this.defaultPosition = value;
    		return true;
    	}
    }
    moveAngleLocal(value, position) {
    	var targetAngle = [0,0];

    	//Constrains Pitch to bounds
    	if(value[1]>PITCH_MAX) {
    		targetAngle[1] = PITCH_MAX;
    	} else if(value[1] < PITCH_MIN) {
    		targetAngle[1] = PITCH_MIN;
    	} else {
    		targetAngle[1] = value[1];
    	}

    	//Determine whether going clockwise or anticlockwise is closer
    	targetAngle[0] = Math.floor((position[0])/360) * 360 + value[0];
    	if(((position[0]) - targetAngle[0]) > (position[0]) - (targetAngle[0] - 360)) {
    		targetAngle[0] = targetAngle[0] - 360;
    	}

    	//Prevents gimbal from exceeding the ideal bounds
    	if(targetAngle[0] <= YAW_MIN_IDEAL ) {
    		targetAngle[0] = targetAngle[0] + 360;
    	} else if(targetAngle[0] >= YAW_MAX_IDEAL) {
    		targetAngle[0] = targetAngle[0] - 360;
    	}    	

    	return targetAngle;
    	
    }
    moveInterval(value, position, orientation, groundReferenceFrame){
    	var targetAngle = [0,0];
    	if((position[0] + value[0]) <= YAW_MAX && (position[0] + value[0]) >= YAW_MIN) {
    		targetAngle[0] = position[0] + value[0];
    		if(targetAngle[0] >= YAW_MAX_IDEAL || targetAngle[0] <= YAW_MIN_IDEAL) {
    			this.feedback("WARNING: Tracker YAW is exceeding safe limits");
    		}
    	} else {    		
    		this.feedback("WARNING: Tracker YAW has exceeded limits");
    		if((position[0] + value[0]) > YAW_MAX) {
    			targetAngle[0] = YAW_MAX;
    		} else {
    			targetAngle[0] = YAW_MIN;
    		}
    	}

    	if((position[1] + value[1]) <= PITCH_MAX && (position[1] + value[1]) >= PITCH_MIN) {
    		targetAngle[1] = position[1] + value[1];
    	} else {
    		this.feedback("WARNING: Tracker PITCH has exceeded limits");
    		if((position[1] + value[1]) > PITCH_MAX) {
    			targetAngle[1] = PITCH_MAX;
    		} else {
    			targetAngle[1] = PITCH_MIN;
    		}
    	}

    	return targetAngle;
    }
    /*
    getGimbalPosition() {
    	return gimbalPosition;
    }
    */
    angleToPWM(value) {
    	
    	var yaw = (((value[0] - YAW_MIN) * (PWM_YAW_MAX - PWM_YAW_MIN)) / (YAW_MAX - YAW_MIN)) + PWM_YAW_MIN;
    	var pitch = (((value[1] - PITCH_MIN) * (PWM_PITCH_MAX - PWM_PITCH_MIN)) / (PITCH_MAX - PITCH_MIN)) + PWM_PITCH_MIN;

    	return [yaw, pitch];

    }
    servoWrite(yaw, pitch, length) {

    }
    getDistance() {
    	
    }
    updateModel() {    	
    	this.model.set('LIDAR' , this.lidarMeasurement);
    	this.model.set('CAMERA GIMBAL' , {
    		yaw: this.gimbalPosition[0],
    		pitch: this.gimbalPosition[1]
    	});

    }
}

module.exports = Tracker;
"use strict";

var Neuron = require('../Neuron');
var Model = require('../Model');
var PWMDriver = require('../PWMDriver');

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
//const PWM_LENGTH = 25000;

//Servo pins
const YAW_PIN = 0;
const PITCH_PIN = 1;

class Tracker extends Neuron {
    constructor(name, feedback, color_log, idle_timeout, i2c, model) {
        super(name, feedback, color_log, idle_timeout);
        this.name = name;
        this.feedback = feedback;
        this.log = color_log;
        this.idle_time = idle_timeout;
        this.i2c = i2c;
        this.model = model;
        this.pwm = new PWMDriver(0x40, 200, i2c);
        // Construct Class here

		this.gimbalPosition = [0,0];
		this.defaultPosition = [0,0];
		this.lidarMeasurement = 0;

        this.model.registerMemory('LIDAR');
        this.model.registerMemory('CAMERA GIMBAL');
    }
    parseCommand(input) {
    	var parent = this;
    	var promiseGetData = function(i) {
        	return new Promise(function(resolve,reject)
        	{
        		//Check if command needs sensor data, then retrieve sensor data
        		if(i.command === "moveInterval") {
        			//get data from sensors
        			i.data = {};
        			i.data.orientation = [0,0,0];
        		}
        		resolve(i);
        	});
        };

        var promiseInterpretCommand = function(i) {
        	return new Promise(function(resolve, reject)
        	{         		
        		var output;
        		var gimbalPosition;      		
        		if(i.command === "moveAngleLocal") {       			
        			//Determines angle to move servos        			
        			gimbalPosition = parent.moveAngleLocal([i.value.yaw, i.value.pitch], parent.gimbalPosition);        			
        			parent.gimbalPosition = gimbalPosition;        			
        			//Converts output angle to PWM pulse length
        			output = parent.angleToPwm(gimbalPosition);
        			//Writes to servo
        			servoWrite(output);       			
        		} else if(i.command === "moveInterval") {        			       			
        			gimbalPosition = parent.moveInterval([i.value.yaw, i.value.pitch], parent.gimbalPosition, [0,0,0], [i.value.stabilizeYaw, i.value.stabilizePitch]);
        			parent.gimbalPosition = gimbalPosition;        			
        			output = parent.angleToPwm(gimbalPosition);
        			servoWrite(output);       			
        		} else if(i.command === "defaultConfig") {
        			//Updates the default position       			
        			parent.defaultConfig([i.value.yaw, i.value.pitch]);
        		} else if(i.command === "recalibrate" ) {         			     			
        			gimbalPosition = parent.recalibrate();        			
        			parent.gimbalPosition = gimbalPosition;        			
        			output = parent.angleToPwm(gimbalPosition);
        			servoWrite(output);        			
        		} else if(i.command === "getDistance") {        			
        			
        		}
        		parent.updateModel();
        		resolve(1);
        	});
        };

 		promiseGetData(input).then(promiseInterpretCommand);
    }
    react(input) {
        this.log.output(`REACTING ${this.name}: `, input);
        this.feedback(`REACTING ${this.name}: `, input);
        this.parseCommand(input);       
	}
    halt() {
        this.log.output(`HALTING ${this.name}`);
        this.feedback(`HALTING ${this.name}`);
        this.parseCommand({
        	command : "moveAngleLocal",
        	value : {
        		yaw : 0,
        		pitch : -90
        	}
        });
        
        setTimeout(function {
        	pwm.setDUTY(0, 100);
        	pwm.setDUTY(1, 100); 
        }), 3000);

    }
    resume() {
        this.log.output(`RESUMING ${this.name}`);
        this.feedback(`RESUMING ${this.name}`);
        this.parseCommand({
        	command : "recalibrate"
        });        
    }
    idle() {
        this.log.output(`IDLING ${this.name}`);
        this.feedback(`IDLING ${this.name}`);
        this.parseCommand({
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

	angleToPWM(value) {
    	
    	var yaw = (((value[0] - YAW_MIN) * (PWM_YAW_MAX - PWM_YAW_MIN)) / (YAW_MAX - YAW_MIN)) + PWM_YAW_MIN;
    	var pitch = (((value[1] - PITCH_MIN) * (PWM_PITCH_MAX - PWM_PITCH_MIN)) / (PITCH_MAX - PITCH_MIN)) + PWM_PITCH_MIN;

    	return [yaw, pitch];

    }
    servoWrite(value) {
    	pwm.setMICRO(0, value[0]);
    	pwm.setMICRO(1, value[1]);

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
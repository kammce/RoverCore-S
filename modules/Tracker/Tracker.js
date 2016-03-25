"use strict";

var Neuron = require('../Neuron');
var PWMDriver = require('../PWMDriver');
var PWMDriverTest = require('./PWMDriverTest');

//Absolute constraint for yaw servo
const YAW_MIN                   = -630;
const YAW_MAX                   = 630;
//Safe constraint for yaw servo
const YAW_MIN_IDEAL             = -540;        
const YAW_MAX_IDEAL             = 540;
//Absolute constraint for pitch servo
const PITCH_MIN                 = -90;
const PITCH_MAX                 = 90;
//Length of pulse in uSeconds
const PWM_YAW_MIN = 600;
const PWM_YAW_MAX = 2400;
const PWM_PITCH_MIN = 500;
const PWM_PITCH_MAX = 2500;
//Lidar-I2C-Address
const Lidar_Address             = 0x62;
const Lidar_Control             = 0x00;
const Lidar_Status              = 0x01;
//const Lidar_Velocity            = 0x09;
const Lidar_Distance_HighByte   = 0x0f;
const Lidar_Distance_LowByte    = 0x10;
//Servo pins
const YAW_PIN = 0;
const PITCH_PIN = 1;

class Tracker extends Neuron {
    constructor(name, feedback, color_log, idle_timeout, i2c, model, debug) {
        super(name, feedback, color_log, idle_timeout);
        this.name = name;
        this.feedback = feedback;
        this.log = color_log;
        this.idle_time = idle_timeout;
        this.i2c = i2c;
        this.model = model;        
        //debug = true;
        if(debug === true) {        	
			this.pwm = new PWMDriverTest();
        } else {
        	this.pwm = new PWMDriver(0x5c, 200, i2c);            
        }               

	    this.gimbalPosition = [0,0];
	    this.defaultPosition = [0,0];        
	    this.lidarMeasurement = 0;
	    this.lidarHealth = true;

        this.model.registerMemory('LIDAR');
        this.model.registerMemory('CAMERA GIMBAL');
    }

    parseCommand(i) {    	  	  
    	var output;
        var gimbal;   
        var parent = this;           
        if(i.mode === 'moveAngleLocal') { 
            //Determines angle to move servos                                   
            gimbal = this.moveAngleLocal([i.yaw, i.pitch], this.gimbalPosition);                    
            this.gimbalPosition = gimbal;                                     
            //Converts output angle to PWM pulse length                 
            output = this.angleToPWM(gimbal);
            //Writes to servo
            this.servoWrite(output);
            this.updateModel();                       
        } else if(i.mode === "moveInterval") {                                  
            gimbal = this.moveInterval([i.yaw, i.pitch], this.gimbalPosition);
            this.gimbalPosition = gimbal;                 
            output = this.angleToPWM(gimbal);
            this.servoWrite(output);
            this.updateModel();                                   
        } else if(i.mode === "defaultConfig") {
            //Updates the default position                  
            this.defaultConfig([i.yaw, i.pitch]);                                     
        } else if(i.mode === "recalibrate" ) {                                  
            gimbal = this.recalibrate();                  
            this.gimbalPosition = gimbal;                 
            output = this.angleToPWM(gimbal);
            this.servoWrite(output);
            this.updateModel();                                   
        } else if(i.mode === "getDistance") { 
            //this.lidarMeasurement = this.getDistance();
            this.getDistance();                              
            setTimeout(function(){
                parent.updateModel();
                //parent.log.output("LIDAR Measurement: ", parent.lidarMeasurement);
                parent.feedback("LIDAR Measurement: ", parent.lidarMeasurement);
            }, 40);
        } else if(i.mode === "lidarHealth") {
            this.checkLidarHealth();            
            setTimeout(function(){
                //this.log.output("LIDAR HEALTH: ", this.lidarHealth);
                parent.feedback("LIDAR HEALTH: ", parent.lidarHealth);
            }, 10);
            
        }
    }
    react(input) {
        //this.log.output(`REACTING ${this.name}: `, input);
        //this.feedback(`REACTING ${this.name}: `, input); 
        
        this.parseCommand(input);       

	}
    halt() {
      //  this.log.output(`HALTING ${this.name}`);
       // this.feedback(`HALTING ${this.name}`);
        this.parseCommand({
        	mode : "moveAngleLocal",
        	yaw : 0,
        	pitch : -90
        	
        });

        var parent = this;
        setTimeout(function() {        	
        	parent.pwm.setDUTY(YAW_PIN, 100);
        	parent.pwm.setDUTY(PITCH_PIN, 100); 
        }, 1000);
    }
    resume() {
       // this.log.output(`RESUMING ${this.name}`);
       // this.feedback(`RESUMING ${this.name}`);
        this.parseCommand({
        	mode : "recalibrate"
        });        
    }
    idle() {

       // this.log.output(`IDLING ${this.name}`);
       //this.feedback(`IDLING ${this.name}`);
        this.parseCommand({
        	mode : "recalibrate"
        });

    }
    recalibrate() {
    	//this.feedback("Moving gimbal to default position");      	
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
        value[0] = value[0] % 360;


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
    moveInterval(value, position){
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
    	var yaw = Math.round((((value[0] - YAW_MIN) * (PWM_YAW_MAX - PWM_YAW_MIN)) / (YAW_MAX - YAW_MIN)) + PWM_YAW_MIN);
    	var pitch = Math.round((((value[1] - PITCH_MIN) * (PWM_PITCH_MAX - PWM_PITCH_MIN)) / (PITCH_MAX - PITCH_MIN)) + PWM_PITCH_MIN);
    	return [yaw, pitch];
    }
    servoWrite(value) {    	
    	this.pwm.setMICRO(YAW_PIN, value[0]);
    	this.pwm.setMICRO(PITCH_PIN, value[1]);

    }
    
    updateModel() {   

    	this.model.set('LIDAR' , this.lidarMeasurement);
    	this.model.set('CAMERA GIMBAL' , {
    		yaw: this.gimbalPosition[0],
    		pitch: this.gimbalPosition[1]
    	});

    }
    
    
    getDistance(){
        var Byte = new Uint8Array(2);
        var parent = this;
        var Distance = 0;
        this.i2c.writeByteSync(Lidar_Address,Lidar_Control,0x04);

        setTimeout(function(){
            Byte[0] = parent.i2c.readByteSync(Lidar_Address,Lidar_Distance_HighByte);
            Byte[1] = parent.i2c.readByteSync(Lidar_Address,Lidar_Distance_LowByte);
            Distance = new Int16Array([Byte[0] << 8 | Byte[1]])[0]; 
            //parent.log.output("Distance: "+Distance+" cm");
            parent.lidarMeasurement = Distance;            
           //return Distance;
        }, 20);        
    }
    checkLidarHealth(){
        var Byte = new Uint8Array(1);
        var Health = false;
        Byte[0] = this.i2c.readByteSync(Lidar_Address,Lidar_Status);
        Byte[0] = Byte[0] << 7;
        if (Byte[0] === 128){
            Health = true;
        }else{
            Health = false;
        }
        this.lidarHealth = Health;
    }
    
}

module.exports = Tracker;

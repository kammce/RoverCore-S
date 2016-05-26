"use strict";

var Neuron = require('../Neuron');
var PWMDriver = require('../PWMDriver');
var PWMDriverTest = require('./PWMDriverTest');
var pidController = require('./pid.js');

//Range of yaw servo
const YAW_SERVO_MIN                   = -630;
const YAW_SERVO_MAX                   = 630;
//Safe constraint for yaw servo
const YAW_MIN             = -540;        
const YAW_MAX             = 540;
//Range of yaw servo
const PITCH_SERVO_MIN                 = -90;
const PITCH_SERVO_MAX                 = 90;
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

const PANORAMA_TIME = 1000;
const PANORAMA_ANGLE = 45;

class Tracker extends Neuron {

    constructor(util) {
        super(util);
        this.name = util.name;
        this.feedback = util.feedback;
        this.log = util.color_log;
        this.idle_time = util.idle_timeout;
        this.i2c = util.i2c;
        this.model = util.model;
        this.debug = util.debug;        

        //debug = true;
        if(this.debug === true) {        	
			this.pwm = new PWMDriverTest();
        } else {
        	this.pwm = new PWMDriver(0x5c, 60, this.i2c);            
        }   


	           
	    this.lidarMeasurement = 0;
	    this.lidarHealth = true;

        this.model.registerMemory('LIDAR');
        this.model.registerMemory('CAMERA GIMBAL');

        this.busy = false;
        this.stopped = false;

        //Target 
        this.target = {
            yaw: 0,
            pitch: 0
        };

        //Accelerometer data
        this.orientation = {
            roll: 0,
            pitch: 0            
        };

        //Angles servos will move to
        this.output = {
            yaw: 0,
            pitch: 0
        };

        this.defaultPosition = {
            yaw: 0,
            pitch: 0
        };



        this.loop(); //Start main loop
    }


    loop() {
        var relativePitch = 0;       
        var parent = this;
        var PWMOutput;      
        var weight = .02;

        if(parent.debug !== true) { 
            setInterval(function(){                 
                var MPU = parent.model.get('MPU');
                if(typeof MPU !== 'undefined') {
                    parent.orientation.pitch = MPU.xAngle;
                    parent.orientation.roll = MPU.yAngle;
                }
                 
                relativePitch = Math.cos((parent.output.yaw % 360)*Math.PI/180)*parent.orientation.pitch + Math.sin((parent.output.yaw % 360)*Math.PI/180)*parent.orientation.roll;

                parent.output.yaw = weight*parent.target.yaw+(1-weight)*parent.output.yaw; 
                parent.output.pitch = weight*(parent.target.pitch - relativePitch)+(1-weight)*parent.output.pitch;      
                              

              
                if(parent.stopped === false){
                    PWMOutput = parent.angleToPWM(parent.output);
                    parent.servoWrite(PWMOutput);
                    parent.updateModel();
                }

            }, 10); 
        } else {
            parent.output = parent.target;
            PWMOutput = parent.angleToPWM(parent.output);
            parent.servoWrite(PWMOutput);
            parent.updateModel();
        }



    }
    parseCommand(i) {    	  	  
    	  
        var parent = this;           
        if(i.mode === 'moveAngle') {                                               
            this.target = this.moveAngleLocal(i, this.output);                                 
        } else if(i.mode === "moveInterval") {                                  
            this.target = this.moveInterval(i, this.output);                                              
        } else if(i.mode === "setHome") {                             
            this.defaultConfig(i);                                     
        } else if(i.mode === "moveHome" ) {                                  
            parent.target = this.recalibrate();                                                 
        } else if(i.mode === "getDistance") {             
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
        } else if(i.mode === "panorama") {
            this.panorama();
        } else if(i.mode === "setPID") {
            this.yawPID.setPID(i.yaw.Kp, i.yaw.Ki, i.yaw.Kd);
            this.pitchPID.setPID(i.pitch.Kp, i.pitch.Ki, i.pitch.Kd);           
        }
    }
    react(input) {
        //this.log.output(`REACTING ${this.name}: `, input);
        //this.feedback(`REACTING ${this.name}: `, input); 
        if(this.busy === false){
            this.parseCommand(input);    
        } else if(input.mode === "abort") {
            this.busy = false;
        }
           

	}
    panorama() {
        this.busy = true;
        var parent = this;

        var startPanorama = function(i) {
            return new Promise(function(resolve, reject){
                if( parent.busy === false) {
                    reject("aborted");
                }
                parent.parseCommand({
                    mode: "moveAngle",
                    yaw: -180,
                    pitch: 0
                });
                setTimeout(resolve(--i), PANORAMA_TIME);
            });
        };

        var movePanorama = function (i) {
            return new Promise(function(resolve, reject){
                if( parent.busy === false) {
                    reject("aborted");
                }
                parent.parseCommand({
                    mode: "moveInterval",
                    yaw: PANORAMA_ANGLE,
                    pitch: 0
                });
                if(i <= 1) {
                    parent.busy = false;
                }
                setTimeout(resolve(--i), PANORAMA_TIME);
            });
        };
        startPanorama(8).then(movePanorama).then(movePanorama).then(movePanorama).then(movePanorama).then(movePanorama).then(movePanorama).then(movePanorama);
    }
    halt() {
      //  this.log.output(`HALTING ${this.name}`);
       // this.feedback(`HALTING ${this.name}`);
        this.stopped = true;
        var PWMOutput = this.angleToPWM({
            yaw: 0,
            pitch: 90
        });
        this.target = {
            yaw: 0,
            pitch: 90
        };
        this.output = {
            yaw: 0,
            pitch: 90
        };
        this.servoWrite(PWMOutput);
        this.updateModel();

        var parent = this;
        setTimeout(function() {        	
        	parent.pwm.setDUTY(YAW_PIN, 100);
        	parent.pwm.setDUTY(PITCH_PIN, 100); 
        }, 1000);
    }
    resume() {
       // this.log.output(`RESUMING ${this.name}`);
       // this.feedback(`RESUMING ${this.name}`);
       this.stopped = false;
        this.parseCommand({
        	mode : "moveHome"
        });        
    }
    idle() {

       // this.log.output(`IDLING ${this.name}`);
       //this.feedback(`IDLING ${this.name}`);
        this.parseCommand({
        	mode : "moveHome"
        });

    }
    recalibrate() {
    	//this.feedback("Moving gimbal to default position");      	
    	return this.defaultPosition;
    }
    defaultConfig(value) {
    	if(value.yaw > YAW_MAX || value.yaw < YAW_MIN || 
    		value.pitch > PITCH_SERVO_MAX || value.pitch < PITCH_SERVO_MIN) {
    		return false;
    	} else {
    		this.defaultPosition.yaw = value.yaw;
            this.defaultPosition.pitch = value.pitch;
    		return true;
    	}
    }

    moveAngleLocal(value) {
    	var targetAngle = {
            pitch: 0,
            yaw: 0
        };        
    	
        targetAngle.pitch = value.pitch;
    	targetAngle.yaw = value.yaw;   	 
        
    	return targetAngle;
    	
    }
    moveInterval(value, position){
    	var targetAngle = {
            pitch: 0,
            yaw: 0
        };
    	
    	if((position.yaw + value.yaw) <= YAW_SERVO_MAX && (position.yaw + value.yaw) >= YAW_SERVO_MIN) {
    		targetAngle.yaw = position.yaw + value.yaw;    		
    	} else {    		
    		//this.feedback("WARNING: Tracker YAW has exceeded limits");
    		if((position.yaw + value.yaw) > YAW_SERVO_MAX) {
    			targetAngle.yaw = YAW_SERVO_MAX;
    		} else {
    			targetAngle.yaw = YAW_SERVO_MIN;
    		}
    	}
    	
        if((position.pitch + value.pitch) <= PITCH_SERVO_MAX && (position.pitch + value.pitch) >= PITCH_SERVO_MIN) {
            targetAngle.pitch = position.pitch + value.pitch; 
        } else {
            if((position.pitch + value.pitch) > PITCH_SERVO_MAX) {
                targetAngle.pitch = PITCH_SERVO_MAX;
            } else {
                targetAngle.pitch = PITCH_SERVO_MIN;
            }
        }

    	
    	

    	return targetAngle;
    }



	angleToPWM(value) {
        if(value.yaw <= YAW_SERVO_MIN) {
            value.yaw = YAW_SERVO_MIN;
        } else if (value.yaw >= YAW_SERVO_MAX) {
            value.yaw = YAW_SERVO_MAX;
        }

        if(value.pitch <= PITCH_SERVO_MIN) {
            value.pitch = PITCH_SERVO_MIN;
        } else if (value.pitch >= PITCH_SERVO_MAX) {
            value.pitch = PITCH_SERVO_MAX;
        }       

    	var yaw = Math.round((((value.yaw - YAW_SERVO_MIN) * (PWM_YAW_MAX - PWM_YAW_MIN)) / (YAW_SERVO_MAX - YAW_SERVO_MIN)) + PWM_YAW_MIN);
    	var pitch = Math.round((((value.pitch - PITCH_SERVO_MIN) * (PWM_PITCH_MAX - PWM_PITCH_MIN)) / (PITCH_SERVO_MAX - PITCH_SERVO_MIN)) + PWM_PITCH_MIN);
    	return [yaw, pitch];
    }
    servoWrite(value) {    	
    	this.pwm.setMICRO(YAW_PIN, value[0]);
    	this.pwm.setMICRO(PITCH_PIN, value[1]);

    }
    
    updateModel() {   

    	this.model.set('LIDAR' , this.lidarMeasurement);
    	this.model.set('CAMERA GIMBAL' , {
    		yaw: this.output.yaw,
    		pitch: this.output.pitch
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

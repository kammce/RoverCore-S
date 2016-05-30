"use strict";

var Neuron = require('../Neuron');
var PWMDriver = require('../PWMDriver');
var PWMDriverTest = require('./PWMDriverTest');

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
const WEIGHT = .5;

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

		this.pwm = new PWMDriver(0x5c, 60, this.i2c);

		this.lidarMeasurement = 0;
		this.lidarHealth = true;

		this.model.registerMemory('LIDAR');
		this.model.registerMemory('CAMERA GIMBAL');

		//Target
		this.target = {
			yaw: 0,
			pitch: 0
		};

		//Angles servos will move to
		this.output = {
			yaw: 0,
			pitch: 0
		};

		setInterval(() => {
			this.output.yaw = (WEIGHT)*this.target.yaw+(1-WEIGHT)*this.output.yaw;
			this.output.pitch = (WEIGHT)*this.target.pitch+(1-WEIGHT)*this.output.pitch;
			var pwm_output = this.angleToPWM(this.output);
			this.servoWrite(pwm_output);
			this.updateModel();
		}, 50);
	}
	react(input) {
		switch(input.mode) {
			case 'moveAngle':
				this.target.pitch = input.pitch;
				this.target.yaw = input.yaw;
				break;
			case "getDistance":
				this.getDistance();
				setTimeout(() => {
					this.updateModel();
					this.log.output("LIDAR Measurement: ", this.lidarMeasurement);
					this.feedback("LIDAR Measurement: ", this.lidarMeasurement);
				}, 40);
				break;
			case "lidarHealth":
				this.checkLidarHealth();
				setTimeout(() => {
					this.feedback("LIDAR HEALTH: ", this.lidarHealth);
				}, 10);
				break;
			default:
				this.log.output("Invalid input mode");
				this.feedback.output("Invalid input mode");
				break;
		}
	}
	halt() {
		var PWMOutput = this.angleToPWM({
			yaw: 0,
			pitch: 90
		});

		this.servoWrite(PWMOutput);

		var parent = this;
		setTimeout(function() {
			parent.pwm.setDUTY(YAW_PIN, 100);
			parent.pwm.setDUTY(PITCH_PIN, 100);
		}, 1000);
	}
	resume() {}
	idle() {}

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

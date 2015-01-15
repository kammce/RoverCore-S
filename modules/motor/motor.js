"use strict";

var Skeleton = require("../skeleton.js");
Motor.prototype = new Skeleton("Motor");
Motor.prototype.constructor = Motor;

function Motor(model_ref, feedback) {
	this.model = model_ref;
	this.feedback = feedback;
	//Direction Pins
	BONE.pinMode('P8_11', BONE.OUTPUT);
	BONE.pinMode('P8_15', BONE.OUTPUT);
	BONE.pinMode('P8_12', BONE.OUTPUT);
	BONE.pinMode('P8_14', BONE.OUTPUT);
	BONE.pinMode('P8_16', BONE.OUTPUT);
	BONE.pinMode('P8_18', BONE.OUTPUT);
	//PWM Pins
	BONE.pinMode('P9_14', BONE.OUTPUT);
	BONE.pinMode('P9_16', BONE.OUTPUT);
	BONE.pinMode('P8_13', BONE.OUTPUT);
	BONE.pinMode('P8_19', BONE.OUTPUT);
	BONE.pinMode('P8_34', BONE.OUTPUT);
	BONE.pinMode('P8_36', BONE.OUTPUT);

}
Motor.prototype.setDirection=function(left, Right){ //Sets Motors Forward or Directon 
		if(left==(1)) {
			BONE.digitalWrite('P8_11', BONE.HIGH);
			BONE.digitalWrite('P8_15', BONE.HIGH);
			BONE.digitalWrite('P8_12', BONE.HIGH);
		}
		else if(left==(-1)){
			BONE.digitalWrite('P8_14', BONE.LOW);
			BONE.digitalWrite('P8_16', BONE.LOW);
			BONE.digitalWrite('P8_18', BONE.LOW);
		}
		if(Right==(1)){
			BONE.digitalWrite('P8_13', BONE.HIGH);
			BONE.digitalWrite('P8_15', BONE.HIGH);
			BONE.digitalWrite('P8_12', BONE.HIGH);
		}
		else if(Right==(-1)){
			BONE.digitalWrite('P8_14', BONE.LOW);
			BONE.digitalWrite('P8_16', BONE.LOW);
			BONE.digitalWrite('P8_18', BONE.LOW);
		}
	}
Motor.prototype.setSpeed=function(Left, Right){
	BONE.analogWrite('P9_14', Left/100, 2000, console.log);
	BONE.analogWrite('P9_16', Left/100, 2000, console.log);
	BONE.analogWrite('P8_13', Left/100, 2000, console.log);
	BONE.analogWrite('P8_19', Right/100, 2000, console.log);
	BONE.analogWrite('P8_34', Right/100, 2000, console.log);
	BONE.analogWrite('P8_36', Right/100, 2000, console.log);
	this.feedback = "Left speed" + Left + "Right speed" + Right;
}
Motor.prototype.set=function( angle, speed){
		if(angle==0 || angle==360){ // checks for angle 0
			this.setSpeed(speed,0);
			this.setDirection( 1,1);
		}
		else if(angle<=90 && angle>0){ // checks for angles 1-90
			this.setSpeed(speed,(angle/90)*speed);
			this.setDirection( 1, 1);
		}
		else if(angle>90 && angle<180){ // checks for angles 91-179
			this.setSpeed(((-1*(angle-180))/90)*speed,speed);
			this.setDirection( 1, 1);
		}
		else if(angle==180){ // checks for angle 180
			this.setSpeed(0,speed);
			this.setDirection( 1, 1);
		}
		else if (angle>180 && angle <=270){
			this.setSpeed(((angle-180)/90)*speed,speed);
			this.setDirection( -1, -1);
		}
		else if (angle>270 && angle <360){
			this.setSpeed(speed,((-1*(angle-360))/90)*speed);
			this.setDirection( -1, -1);
		}
		else{
			this.setSpeed(0,0);
			this.feedback = "Could Not Interpret Command, Rover was STOPPED";
		}
	}
Motor.prototype.handle = function(data) {
	console.log(this.module+" Recieved ", data);
	this.set(data.angle,data.speed);
	return this.feedback;
};
Motor.prototype.resume = function() {};
Motor.prototype.halt = function() {};


module.exports = exports = Motor;

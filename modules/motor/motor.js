"use strict";

var Skeleton = require("../skeleton.js");
Motor.prototype = new Skeleton("Motor");
Motor.prototype.constructor = Motor;

function Motor(model_ref, feedback) {
	this.model = model_ref;
	this.feedback = feedback;
}
Motor.prototype.setDirection=function(left, Right, Dir){ //Sets Motors Forward or Directon 
		if(left==(1*Dir)) {
			Bone.digitalWrite('P9_13', Bone.HIGH);
			Bone.digitalWrite('P9_15', Bone.HIGH);
			Bone.digitalWrite('P9_12', Bone.HIGH);
		}
		else if(left==(-1*Dir)){
			Bone.digitalWrite('P9_14', Bone.LOW);
			Bone.digitalWrite('P9_16', Bone.LOW);
			Bone.digitalWrite('P9_18', Bone.LOW);
		}
		if(Right==(1*Dir)){
			Bone.digitalWrite('P9_13', Bone.HIGH);
			Bone.digitalWrite('P9_15', Bone.HIGH);
			Bone.digitalWrite('P9_12', Bone.HIGH);
		}
		else if(Right==(-1*Dir)){
			Bone.digitalWrite('P9_14', Bone.LOW);
			Bone.digitalWrite('P9_16', Bone.LOW);
			Bone.digitalWrite('P9_18', Bone.LOW);
		}
	}
Motor.prototype.setSpeed=function(Left, Right){
	Bone.analogWrite('P8_14', Left/100, 2000, printJSON);
	Bone.analogWrite('P8_16', Left/100, 2000, printJSON);
	Bone.analogWrite('P9_13', Left/100, 2000, printJSON);
	Bone.analogWrite('P9_19', Right/100, 2000, printJSON);
	Bone.analogWrite('P9_34', Right/100, 2000, printJSON);
	Bone.analogWrite('P9_36', Right/100, 2000, printJSON);
}
Motor.prototype.set=function( angle, speed){
		var setSpeedLeft, setSpeedRight;
		var Direction=1;
		if(speed<0) {Direction=-1; speed=speed*-1}; //puts the rover in reverse
		if(angle==0){ // checks for angle 0
			this.setSpeed(speed,speed);
			this.setDirection( 1,-1, Direction);
			this.feedback = "Left speed" + speed + "Right speed" + speed;
		}
		else if(angle<=90 && angle>0){ // checks for angles 1-90
			this.setSpeed(speed,(angle/90)*speed);
			this.setDirection( 1, 1, Direction);
			this.feedback = "Left speed" + ((angle/90)*speed) + "Right speed" + speed;
		}
		else if(angle>90 && angle<180){ // checks for angles 91-179
			this.setSpeed(((-1*(angle-180))/90)*speed,speed);
			this.setDirection( 1, 1, Direction);
			this.feedback = "Left speed" + speed + "Right speed" + ((-1*(angle-180))/90)*speed ;
		}
		else if(angle==180){ // checks for angle 180
			this.setSpeed(speed,speed);
			this.setDirection( -1, 1, Direction);
			this.feedback = "Left speed" + speed + "Right speed" + speed;
		}
		else{
			this.feedback = "Could Not Interpret Command";
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

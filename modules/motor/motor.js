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
			//b.digitalWrite('USR0', b.HIGH);
			//b.digitalWrite('USR0', b.HIGH);
		}
		else if(left==(-1*Dir)){
			//b.digitalWrite('USR0', b.LOW);
			//b.digitalWrite('USR0', b.LOW);
		}
		if(Right==(1*Dir)){
			//b.digitalWrite('USR0', b.HIGH);
			//b.digitalWrite('USR0', b.HIGH);
		}
		else if(Right==(-1*Dir)){
			//b.digitalWrite('USR0', b.LOW);
			//b.digitalWrite('USR0', b.LOW);
		}
	}
Motor.prototype.setSpeed=function(Left, Right){
	//b.analogWrite('P9_14', Left/100, 2000, printJSON);
	//b.analogWrite('P9_14', Left/100, 2000, printJSON);
	//b.analogWrite('P9_14', Right/100, 2000, printJSON);
	//b.analogWrite('P9_14', Right/100, 2000, printJSON);
}
Motor.prototype.set=function( angle, speed){
		var setSpeedLeft, setSpeedRight;
		var Direction=1;
		if(speed<0) Direction=-1; speed=speed*-1; //puts the rover in reverse
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

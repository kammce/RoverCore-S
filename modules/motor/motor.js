"use strict";
//make feedback optional
//


var Skeleton = require("../skeleton.js");
Motor.prototype = new Skeleton("Motor");
Motor.prototype.constructor = Motor;

function Motor(model_ref, feedback) {
	this.model = model_ref;
	this.feedback = feedback;
	//For Smart Controller
	this.timeout;
	this.controlAngle;
	this.controlSpeed;
	this.controlRate;
	this.tranAngle;
	this.transSpeed;
	this.angleRate;
	this.compOld;
	//For pin sets
	this.motors={
		m1: { //Left Side
			pwmPin:'P8_36', // doesnt work
			dirPin:'P8_39',
		},
		m2: { //Left Side
			pwmPin:'P9_28',
			dirPin:'P8_40',
		},
		m3: { //Left Side
			pwmPin:'P9_29',
			dirPin:'P8_41',
		},
		m4: { //Right Side
			pwmPin:'P8_13',
			dirPin:'P8_42',
		},
		m5: { //Right Side
			pwmPin:'P8_19',// doesnt work
			dirPin:'P8_43',
		},
		m6: { // Right Side
			pwmPin:'P8_34',// doesnt work
			dirPin:'P8_44',
		}
	}
	this.spine = new SPINE();
	this.spine.expose(this.motors.m1.dirPin, "OUTPUT");
	this.spine.expose(this.motors.m2.dirPin, "OUTPUT");
	this.spine.expose(this.motors.m3.dirPin, "OUTPUT");
	this.spine.expose(this.motors.m4.dirPin, "OUTPUT");
	this.spine.expose(this.motors.m5.dirPin, "OUTPUT");
	this.spine.expose(this.motors.m6.dirPin, "OUTPUT");
}

Motor.prototype.handle = function(data) {
	console.log(this.module+" Recieved ", data);
	if(data.signaltype=='man'){
		this.setIndividualMotors(data.motor);
	}
	if(data.signaltype=='fullAuto'){
		this.setAllMotors(data.angle, data.speed);
	}
	if(data.signaltype=='auto'){
		this.setAllMotors(data.angle, data.speed);
		this.setIndividualMotors(data.motor);
		this.feedback=data;
	}
	if(data.signaltype=='temp'){
		this.setAllMotorsTemp(data.angle, data.speed);
	}

	return this.feedback;
};
Motor.prototype.resume = function() {};
Motor.prototype.halt = function() {
	this.setAllMotors(90, 0);
	clearInterval(this.timeout);
};
// =========================Smart Controller==========================
Motor.prototype.smartController= function(angle, speed){
	this.controlAngle=angle;
	this.controlSpeed=speed;
	this.controlRate=this.createRate(angle,speed);
	this.compOld=this.getComp();
	clearInterval(this.timeout);
	this.timeout=setInterval(this.smartControllerAdjust(), 100);
};
Motor.prototype.smartControllerAdjust = function(){
	var compNew=this.getComp();
	var compRate=compNew-this.compOld;
	if(compRate>this.controlRate){
		this.controlAngle++;
	}
	else if(compRate<this.controlRate){

	}
	else{
		console.log("Angle is Equlized")
	}
}
Motor.prototype.createRate=function(controlAngle,controlSpeed){
	var output=0;	
	else if(controlAngle<=90 && controlAngle>=0){ // checks for angles 1-90
		output=90-controlAngle;
	}
	else if(controlAngle>90 && controlAngle<180){ // checks for angles 91-179
		output=(-1*(controlAngle-90));
	}
	else if (controlAngle>=180 && controlAngle <=270){
		output=(270-controlAngle);
	}
	else if (controlAngle>270 && controlAngle <=360){
		output=(-1*(controlAngle-270));
	}
	else if (controlAngle==361 || controlAngle==362){
		output=180;
	}
	else{
		output=0;
		console.log("Incorrect angle is being inserted into createRate function");
	}
	return (output*(controlSpeed/100));
};
Motor.prototype.getComp=function(){

};
//==========================Individual motor controller==================================
Motor.prototype.setIndividualMotors=function(motor){
	if(motor.m1.state=="on"){
		this.setMotor(1, motor.m1.direction, motor.m1.speed/100);
	}
	else{
		this.setMotor(1, motor.m1.direction, 0);
	}
	if(motor.m2.state=="on"){
		this.setMotor(2, motor.m2.direction, motor.m2.speed/100);
	}
	else{
		this.setMotor(2, motor.m2.direction, 0);
	}
	if(motor.m3.state=="on"){
		this.setMotor(3, motor.m3.direction, motor.m3.speed/100);
	}
	else{
		this.setMotor(3, motor.m3.direction, 0);
	}
	if(motor.m4.state=="on"){
		this.setMotor(4, motor.m4.direction, motor.m4.speed/100);
	}
	else{
		this.setMotor(4, motor.m4.direction, 0);
	}
	if(motor.m5.state=="on"){
		this.setMotor(5, motor.m5.direction, motor.m5.speed/100);
	}
	else{
		this.setMotor(5, motor.m5.direction, 0);
	}
	if(motor.m6.state=="on"){
		this.setMotor(6, motor.m6.direction, motor.m6.speed/100);
	}
	else{
		this.setMotor(6, motor.m6.direction, 0);
	}
	this.feedback=motor;
}
Motor.prototype.setMotor = function(motorSelect, direction, speed){
	if(motorSelect==1){
		this.spine.setPWM(this.motors.m1.pwmPin, speed);
		if(direction=='forward'){
			this.spine.digitalWrite(this.motors.m1.dirPin, 1);
		}
		else if(direction=='reverse'){
			this.spine.digitalWrite(this.motors.m1.dirPin, 0);
		}
	}
	else if(motorSelect==2){
		this.spine.setPWM(this.motors.m2.pwmPin, speed);
		if(direction=='forward'){
			this.spine.digitalWrite(this.motors.m2.dirPin, 1);
		}
		else if(direction=='reverse'){
			this.spine.digitalWrite(this.motors.m2.dirPin, 0);
		}
	}
	else if(motorSelect==3){
		this.spine.setPWM(this.motors.m3.pwmPin, speed);
		if(direction=='forward'){
			this.spine.digitalWrite(this.motors.m3.dirPin, 1);
		}
		else if(direction=='reverse'){
			this.spine.digitalWrite(this.motors.m3.dirPin, 0);
		}
	}
	else if(motorSelect==4){
		this.spine.setPWM(this.motors.m4.pwmPin, speed);
		if(direction=='forward'){
			this.spine.digitalWrite(this.motors.m4.dirPin, 0);
		}
		else if(direction=='reverse'){
			this.spine.digitalWrite(this.motors.m4.dirPin, 1);
		}
	}
	else if(motorSelect==5){
		this.spine.setPWM(this.motors.m5.pwmPin, speed);
		if(direction=='forward'){
			this.spine.digitalWrite(this.motors.m5.dirPin, 0);
		}
		else if(direction=='reverse'){
			this.spine.digitalWrite(this.motors.m5.dirPin, 1);
		}
	}
	else if(motorSelect==6){
		this.spine.setPWM(this.motors.m6.pwmPin, speed);
		if(direction=='forward'){
			this.spine.digitalWrite(this.motors.m6.dirPin, 0);
		}
		else if(direction=='reverse'){
			this.spine.digitalWrite(this.motors.m6.dirPin, 1);
		}
	}
	else{
		console.log(' ERROR: Motor could not be selected in the setMotor function');
	}
};
//============================Set all motors///////////////////////////////
Motor.prototype.setAllMotors=function(angle, speed){
	if(angle==0 || angle==360){ // checks for angle 0
		this.setAllSpeed(speed,0);
		this.setAllDirection(1,1);
	}
	else if(angle<=90 && angle>0){ // checks for angles 1-90
		this.setAllSpeed(speed,(angle/90)*speed);
		this.setAllDirection( 1, 1);
	}
	else if(angle>90 && angle<180){ // checks for angles 91-179
		this.setAllSpeed(((-1*(angle-180))/90)*speed,speed);
		this.setAllDirection( 1, 1);
	}
	else if(angle==180){ // checks for angle 180
		this.setAllSpeed(0,speed);
		this.setAllDirection(1, 1);
	}
	else if (angle>180 && angle <=270){
		this.setAllSpeed(((angle-180)/90)*speed,speed);
		this.setAllDirection( -1, -1);
	}
	else if (angle>270 && angle <360){
		this.setAllSpeed(speed,((-1*(angle-360))/90)*speed);
		this.setAllDirection( -1, -1);
	}
	else if (angle==361){
		this.setAllSpeed(speed,speed);
		this.setAllDirection( 1,-1);
	}
	else if (angle==362){
		this.setAllSpeed(speed,speed);
		this.setAllDirection( -1,1);
	}
	else{
		this.setAllSpeed(0,0);
		this.feedback = "Could Not Interpret Command, Rover was STOPPED";
	}
}
Motor.prototype.setAllMotorsTemp=function(angle, speed){
	if(angle==0 || angle==360){ // checks for angle 0
		this.setAllSpeed(speed,0);
		this.setAllDirectionTemp(1,1);
	}
	else if(angle<=90 && angle>0){ // checks for angles 1-90
		this.setAllSpeed(speed,(angle/90)*speed);
		this.setAllDirectionTemp(1,1);
	}
	else if(angle>90 && angle<180){ // checks for angles 91-179
		this.setAllSpeed(((-1*(angle-180))/90)*speed,speed);
		this.setAllDirectionTemp(1,1);
	}
	else if(angle==180){ // checks for angle 180
		this.setAllSpeed(0,speed);
		this.setAllDirectionTemp(1,1);
	}
	else if (angle>180 && angle <=270){
		this.setAllSpeed(((angle-180)/90)*speed,speed);
		this.setAllDirectionTemp(-1,-1);
	}
	else if (angle>270 && angle <360){
		this.setAllSpeed(speed,((-1*(angle-360))/90)*speed);
		this.setAllDirectionTemp(-1,-1);
	}
	else if (angle==361){
		this.setAllSpeed(speed,speed);
		this.setAllDirectionTemp(1,-1);
	}
	else if (angle==362){
		this.setAllSpeed(speed,speed);
		this.setAllDirectionTemp(-1,1);
	}
	else{
		this.setAllSpeed(0,0);
		this.feedback = "Could Not Interpret Command, Rover was STOPPED";
	}
}
Motor.prototype.setAllSpeed=function(Left, Right){
	this.spine.setPWM(this.motors.m1.pwmPin, Left/100);
	this.spine.setPWM(this.motors.m2.pwmPin, Left/100);
	this.spine.setPWM(this.motors.m3.pwmPin, Left/100);
	this.spine.setPWM(this.motors.m4.pwmPin, Right/100);
	this.spine.setPWM(this.motors.m5.pwmPin, Right/100);
	this.spine.setPWM(this.motors.m6.pwmPin, Right/100);
	this.feedback = "|------------->Left speed " + Left + "  Right speed " + Right;
	console.log("Left speed " + Left + "Right speed " + Right);
}
Motor.prototype.setAllDirection=function(left, Right){ //Sets Motors Forward or Directon 
	if(left==(1)) {
		this.spine.digitalWrite(this.motors.m1.dirPin, 0);
		this.spine.digitalWrite(this.motors.m2.dirPin, 0);
		this.spine.digitalWrite(this.motors.m3.dirPin, 0);
	}
	else if(left==(-1)){
		this.spine.digitalWrite(this.motors.m1.dirPin, 1);
		this.spine.digitalWrite(this.motors.m2.dirPin, 1);
		this.spine.digitalWrite(this.motors.m3.dirPin, 1);
	}
	if(Right==(1)){
		this.spine.digitalWrite(this.motors.m4.dirPin, 1);
		this.spine.digitalWrite(this.motors.m5.dirPin, 1);
		this.spine.digitalWrite(this.motors.m6.dirPin, 1);
		}
	else if(Right==(-1)){
		this.spine.digitalWrite(this.motors.m4.dirPin, 0);
		this.spine.digitalWrite(this.motors.m5.dirPin, 0);
		this.spine.digitalWrite(this.motors.m6.dirPin, 0);
	}
}
//========================direction control for aruinos=====================================
Motor.prototype.setAllDirectionTemp=function(Left, Right){
	if(Left==(1)) {
		this.spine.digitalWrite(this.motors.m1.dirPin, 1);
		this.spine.digitalWrite(this.motors.m2.dirPin, 0);
	}
	else if(Left==(-1)){
		this.spine.digitalWrite(this.motors.m1.dirPin, 0);
		this.spine.digitalWrite(this.motors.m2.dirPin, 1);
	}
	if(Right==(1)){
		this.spine.digitalWrite(this.motors.m3.dirPin, 1);
		this.spine.digitalWrite(this.motors.m4.dirPin, 0);
	}
	else if(Right==(-1)){
		this.spine.digitalWrite(this.motors.m3.dirPin, 0);
		this.spine.digitalWrite(this.motors.m4.dirPin, 1);
	}
}
module.exports = exports = Motor;

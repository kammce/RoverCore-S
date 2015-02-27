"use strict";
//make feedback optional
//


var Skeleton = require("../skeleton.js");
Motor.prototype = new Skeleton("Motor");
Motor.prototype.constructor = Motor;

function Motor(model_ref, feedback) {
	this.model = model_ref;
	this.feedback = feedback;
	this.motors={
		m1: { //Left Side
			pwmPin:'P8_13', // doesnt work
			dirPin:'P8_39',
		},
		m2: { // Right Side
			pwmPin:'P8_19',
			dirPin:'P8_40',
		},
		m3: { //Left Side
			pwmPin:'P8_34',
			dirPin:'P8_41',
		},
		m4: { // Right Side
			pwmPin:'P8_36',
			dirPin:'P8_42',
		},
		m5: { //Left Side
			pwmPin:'P9_28',// doesnt work
			dirPin:'P8_43',
		},
		m6: { // Right Side
			pwmPin:'P9_29',// doesnt work
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
	//BONE.pinMode(this.motors.m1.dirPin, BONE.OUTPUT);
	//BONE.pinMode(this.motors.m2.pwmPin, BONE.OUTPUT);
	//BONE.pinMode(this.motors.m2.dirPin, BONE.OUTPUT);
	//BONE.pinMode(this.motors.m3.pwmPin, BONE.OUTPUT);
	//BONE.pinMode(this.motors.m3.dirPin, BONE.OUTPUT);
	//BONE.pinMode(this.motors.m4.pwmPin, BONE.OUTPUT);
	//BONE.pinMode(this.motors.m4.dirPin, BONE.OUTPUT);
	//BONE.pinMode(this.motors.m5.pwmPin, BONE.OUTPUT);
	//BONE.pinMode(this.motors.m5.dirPin, BONE.OUTPUT);
	//BONE.pinMode(this.motors.m6.pwmPin, BONE.OUTPUT);
	//BONE.pinMode(this.motors.m6.dirPin, BONE.OUTPUT);
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
};
/*
Motor.prototype.smartController= function(angle, speed){
	var comp_val=this.getComp();
	setTimeout(this.smartControllerAdjust(), 100);
};
Motor.prototype.smartControllerAdjust = function(){

}
Motor.prototype.getComp=function(){

};
*/
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
		//BONE.analogWrite(this.motors.m1.pwmPin, speed, 2000, console.log);
		if(direction=='forward'){
			this.spine.digitalWrite(this.motors.m1.dirPin, 1);
		//	BONE.digitalWrite(this.motors.m1.dirPin, BONE.HIGH);
		}
		else if(direction=='reverse'){
			this.spine.digitalWrite(this.motors.m1.dirPin, 0);
		//	BONE.digitalWrite(this.motors.m1.dirPin, BONE.LOW);
		}
	}
	else if(motorSelect==2){
		this.spine.setPWM(this.motors.m2.pwmPin, speed);
		//BONE.analogWrite(this.motors.m2.pwmPin, speed, 2000, console.log);
		if(direction=='forward'){
			this.spine.digitalWrite(this.motors.m2.dirPin, 1);
		//	BONE.digitalWrite(this.motors.m2.dirPin, BONE.HIGH);
		}
		else if(direction=='reverse'){
			this.spine.digitalWrite(this.motors.m2.dirPin, 0);
		//	BONE.digitalWrite(this.motors.m2.dirPin, BONE.LOW);
		}
	}
	else if(motorSelect==3){
		this.spine.setPWM(this.motors.m3.pwmPin, speed);
		//BONE.analogWrite(this.motors.m3.pwmPin, speed, 2000, console.log);
		if(direction=='forward'){
			this.spine.digitalWrite(this.motors.m3.dirPin, 1);
		//	BONE.digitalWrite(this.motors.m3.dirPin, BONE.HIGH);
		}
		else if(direction=='reverse'){
			this.spine.digitalWrite(this.motors.m3.dirPin, 0);
		//	BONE.digitalWrite(this.motors.m3.dirPin, BONE.LOW);
		}
	}
	else if(motorSelect==4){
		this.spine.setPWM(this.motors.m4.pwmPin, speed);
		//BONE.analogWrite(this.motors.m4.pwmPin, speed, 2000, console.log);
		if(direction=='forward'){
			this.spine.digitalWrite(this.motors.m4.dirPin, 1);
		//	BONE.digitalWrite(this.motors.m4.dirPin, BONE.HIGH);
		}
		else if(direction=='reverse'){
			this.spine.digitalWrite(this.motors.m4.dirPin, 0);
		//	BONE.digitalWrite(this.motors.m4.dirPin, BONE.LOW);
		}
	}
	else if(motorSelect==5){
		this.spine.setPWM(this.motors.m5.pwmPin, speed);
		//BONE.analogWrite(this.motors.m5.pwmPin, speed, 2000, console.log);
		if(direction=='forward'){
			this.spine.digitalWrite(this.motors.m5.dirPin, 1);
			//BONE.digitalWrite(this.motors.m5.dirPin, BONE.HIGH);
		}
		else if(direction=='reverse'){
			this.spine.digitalWrite(this.motors.m5.dirPin, 0);
		//	BONE.digitalWrite(this.motors.m5.dirPin, BONE.LOW);
		}
	}
	else if(motorSelect==6){
		this.spine.setPWM(this.motors.m6.pwmPin, speed);
		//BONE.analogWrite(this.motors.m6.pwmPin, speed, 2000, console.log);
		if(direction=='forward'){
			this.spine.digitalWrite(this.motors.m6.dirPin, 1);
		//	BONE.digitalWrite(this.motors.m6.dirPin, BONE.HIGH);
		}
		else if(direction=='reverse'){
			this.spine.digitalWrite(this.motors.m6.dirPin, 0);
		//	BONE.digitalWrite(this.motors.m6.dirPin, BONE.LOW);
		}
	}
	else{
		console.log(' ERROR: Motor could not be selected in the setMotor function');
	}
};
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
	//BONE.analogWrite(this.motor1.pwmPin, Left/100, 2000, console.log);
	//BONE.analogWrite(this.motor2.pwmPin, Left/100, 2000, console.log);
	//BONE.analogWrite(this.motor3.pwmPin, Left/100, 2000, console.log);
	//BONE.analogWrite(this.motor4.pwmPin, Right/100, 2000, console.log);
	//BONE.analogWrite(this.motor5.pwmPin, Right/100, 2000, console.log);
	//BONE.analogWrite(this.motor6.pwmPin, Right/100, 2000, console.log);		
	this.feedback = "Left speed " + Left + "Right speed " + Right;
	console.log("Left speed " + Left + "Right speed " + Right);
}
Motor.prototype.setAllDirection=function(left, Right){ //Sets Motors Forward or Directon 
	if(left==(1)) {
		this.spine.digitalWrite(this.motors.m1.dirPin, 1);
		this.spine.digitalWrite(this.motors.m3.dirPin, 1);
		this.spine.digitalWrite(this.motors.m5.dirPin, 1);
	//	BONE.digitalWrite(this.motors.m1.dirPin, BONE.HIGH);
		//BONE.digitalWrite(this.motors.m3.dirPin, BONE.HIGH);
		//BONE.digitalWrite(this.motors.m5.dirPin, BONE.HIGH);
	}
	else if(left==(-1)){
		this.spine.digitalWrite(this.motors.m1.dirPin, 0);
		this.spine.digitalWrite(this.motors.m3.dirPin, 0);
		this.spine.digitalWrite(this.motors.m5.dirPin, 0);
		//BONE.digitalWrite(this.motors.m1.dirPin, BONE.LOW);
		//BONE.digitalWrite(this.motors.m3.dirPin, BONE.LOW);
		//BONE.digitalWrite(this.motors.m5.dirPin, BONE.LOW);
	}
	if(Right==(1)){
		this.spine.digitalWrite(this.motors.m2.dirPin, 1);
		this.spine.digitalWrite(this.motors.m4.dirPin, 1);
		this.spine.digitalWrite(this.motors.m6.dirPin, 1);
	//	BONE.digitalWrite(this.motors.m2.dirPi, BONE.HIGH);
	//	BONE.digitalWrite(this.motors.m4.dirPi, BONE.HIGH);
	//	BONE.digitalWrite(this.motors.m6.dirPi, BONE.HIGH);
		}
	else if(Right==(-1)){
		this.spine.digitalWrite(this.motors.m2.dirPin, 0);
		this.spine.digitalWrite(this.motors.m4.dirPin, 0);
		this.spine.digitalWrite(this.motors.m6.dirPin, 0);
		//BONE.digitalWrite(this.motors.m2.dirPi, BONE.LOW);
		//BONE.digitalWrite(this.motors.m4.dirPi, BONE.LOW);
		//BONE.digitalWrite(this.motors.m6.dirPi, BONE.LOW);
	}
}
Motor.prototype.setAllDirectionTemp=function(Left, Right){
	if(Left==(1)) {
		//BONE.digitalWrite('P8_11', BONE.HIGH);
		//BONE.digitalWrite('P8_15', BONE.LOW);
		this.spine.digitalWrite(this.motors.m1.dirPin, 1);
		this.spine.digitalWrite(this.motors.m2.dirPin, 0);
	}
	else if(Left==(-1)){
		//BONE.digitalWrite('P8_11', BONE.LOW);
		//BONE.digitalWrite('P8_15', BONE.HIGH);
		this.spine.digitalWrite(this.motors.m1.dirPin, 0);
		this.spine.digitalWrite(this.motors.m2.dirPin, 1);
	}
	if(Right==(1)){
		//BONE.digitalWrite('P8_14', BONE.HIGH);
		//BONE.digitalWrite('P8_16', BONE.LOW);
		this.spine.digitalWrite(this.motors.m3.dirPin, 1);
		this.spine.digitalWrite(this.motors.m4.dirPin, 0);
	}
	else if(Right==(-1)){
		//BONE.digitalWrite('P8_14', BONE.LOW);
		//BONE.digitalWrite('P8_16', BONE.HIGH);
		this.spine.digitalWrite(this.motors.m3.dirPin, 0);
		this.spine.digitalWrite(this.motors.m4.dirPin, 1);
	}
}
module.exports = exports = Motor;

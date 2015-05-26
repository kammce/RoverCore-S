"use strict";
//make feedback optional
//


var Skeleton = require("../skeleton.js");
Motor.prototype = new Skeleton("Motor");
Motor.prototype.constructor = Motor;

function Motor(model_ref, feedback, spine, debug) {
	this.spine = spine;
	this.model = model_ref;
	this.feedback = feedback;
	//For Command
	this.timeout;
	//For pin sets
	this.motors={
		control: {
			signaltype: 'auto',
			smartControl: 'ON',
			motorDebug: 'OFF',
		},
		allMotors: {
			controlAngle: 90,
			controlSpeed: 0,
			transAngle: 90,
			transSpeed: 0,
		},
		m1: { //Left Side
			pwmPin:'P8_34',
			dirPin:'P8_41',
			state:'OFF',
			speed: 0,
			direction: 'forward',
		},
		m2: { //Left Side
			pwmPin:'P8_13',
			dirPin:'P8_39',
			state:'OFF',
			speed: 0,
			direction: 'forward',
		},
		m3: { //Left Side
			pwmPin:'P8_19',
			dirPin:'P8_40',
			state: 'OFF',
			speed: 0,
			direction: 'forward',
		},
		m4: { //Right Side
			pwmPin:'P8_36', 
			dirPin:'P8_42',
			state: 'OFF',
			speed: 0,
			direction: 'forward',
		},
		m5: { //Right Side
			pwmPin:'P9_29',
			dirPin:'P8_44',
			state: 'OFF',
			speed: 0,
			direction: 'forward',
		},
		m6: { // Right Side
			pwmPin:'P9_28',
			dirPin:'P8_43',
			state: 'OFF',
			speed: 0,
			direction: 'forward',
		}
	};
	this.spine.expose(this.motors.m1.dirPin, "OUTPUT");
	this.spine.expose(this.motors.m2.dirPin, "OUTPUT");
	this.spine.expose(this.motors.m3.dirPin, "OUTPUT");
	this.spine.expose(this.motors.m4.dirPin, "OUTPUT");
	this.spine.expose(this.motors.m5.dirPin, "OUTPUT");
	this.spine.expose(this.motors.m6.dirPin, "OUTPUT");
	var parent = this;
	var Command = function(){
		var signaltype = parent.motors.control.signaltype;
		if(signaltype=='auto'){
			parent.setAllMotors();
			parent.smartController();
		}
		else if(signaltype=='man'){
			this.motors.allMotors.controlSpeed=0;
			parent.setIndividualMotors();
			parent.smartController();
		}
		else {
			parent.setAllSpeed(0,0);
			console.log("Command Function singaltype coud not be interpreted MOTORS ARE STOPPED");
		}
	}
	this.timeout=setInterval(Command, 100);
};
Motor.prototype.handle = function(data) {
	this.motors.control.signaltype=data.signaltype;
	this.motors.control.motorDebug=data.motorDebug;
	this.motors.control.smartController = data.smartController;
	var signaltype =this.motors.control.signaltype;
	if(signaltype=="auto"){
		this.motors.allMotors.controlSpeed=data.speed;
		this.motors.allMotors.controlAngle=data.angle;
	}
	if(signaltype=="man"){
	this.motors.m1.state= data.motor.m1.state;
	this.motors.m2.state= data.motor.m2.state;
	this.motors.m3.state= data.motor.m3.state;
	this.motors.m4.state= data.motor.m4.state;
	this.motors.m5.state= data.motor.m5.state;
	this.motors.m6.state= data.motor.m6.state;
	this.motors.m1.speed= data.motor.m1.speed;
	this.motors.m2.speed= data.motor.m2.speed;
	this.motors.m3.speed= data.motor.m3.speed;
	this.motors.m4.speed= data.motor.m4.speed;
	this.motors.m5.speed= data.motor.m5.speed;
	this.motors.m6.speed= data.motor.m6.speed;
	this.motors.m1.direction= data.motor.m1.direction;
	this.motors.m2.direction= data.motor.m2.direction;
	this.motors.m3.direction= data.motor.m3.direction;
	this.motors.m4.direction= data.motor.m4.direction;
	this.motors.m5.direction= data.motor.m5.direction;
	this.motors.m6.direction= data.motor.m6.direction;
	}
	if (this.motors.control.motorDebug=='ON'){
		this.feedback=this.motors;
		console.log(this.feedback);
		return this.feedback;
	}
	else return 0;
};
  
  
Motor.prototype.resume = function() {
	this.setAllMotors(90, 0);
	var parent = this;
	var Command = function(){
		var signaltype = parent.motors.control.signaltype;
		if(signaltype=='auto'){
			parent.setAllMotors();
			parent.smartController();
		}
		else if(signaltype=='man'){
			parent.setIndividualMotors();
			parent.smartController();
		}
		else {
			parent.setAllSpeed(0,0);
			console.log("Command Function singaltype coud not be interpreted MOTORS ARE STOPPED");
		}
	}
	this.timeout=setInterval(Command, 100);
};
Motor.prototype.halt = function() {
	clearInterval(this.timeout);
	this.setAllMotors(90, 0);
};

// =========================Smart Controller==========================
Motor.prototype.smartController= function(){
		var smartController = this.motors.control.smartController;
		if(smartController == "ON"){
			var motorDebug = this.motors.control.motorDebug;
			var controlAngle = this.motors.allMotors.controlAngle;
			var controlSpeed = this.motors.allMotors.controlSpeed;
			var transAngle = this.motors.allMotors.transAngle;
			var transSpeed = this.motors.allMotors.transSpeed;
			var acceleroNew=this.model.accelero.x;
			if(acceleroNew < (-3) && controlSpeed == 0){
				transAngle=90;
				transSpeed=acceleroNew*3.5; 
				this.setAllMotors(transAngle, transSpeed);
			}
			else if(acceleroNew>3 && controlSpeed == 0){
				transAngle=270;
				transSpeed=acceleroNew*2.8; 
				this.setAllMotors(transAngle, transSpeed);
			}
			if(motorDebug=='ON'){
				console.log("SMART CONTROLLER SD--" + transSpeed + " AG--" + transAngle);
			}
		}
		
};
//==========================Individual motor controller==================================
Motor.prototype.setIndividualMotors=function(motor){
	var motorDebug = this.motors.control.motorDebug;
	var motorM1State = this.motors.m1.state;
	var motorM2State = this.motors.m2.state;
	var motorM3State = this.motors.m3.state;
	var motorM4State = this.motors.m4.state;
	var motorM5State = this.motors.m5.state;
	var motorM6State = this.motors.m6.state;
	var motorM1Speed = this.motors.m1.speed;
	var motorM2Speed = this.motors.m2.speed;
	var motorM3Speed = this.motors.m3.speed;
	var motorM4Speed = this.motors.m4.speed;
	var motorM5Speed = this.motors.m5.speed;
	var motorM6Speed = this.motors.m6.speed;
	var motorM1Direction = this.motors.m1.direction;
	var motorM2Direction = this.motors.m2.direction;
	var motorM3Direction = this.motors.m3.direction;
	var motorM4Direction = this.motors.m4.direction;
	var motorM5Direction = this.motors.m5.direction;
	var motorM6Direction = this.motors.m6.direction;
	if(motorM1State=="ON"){
		this.setMotor(1, motorM1Direction, motorM1Speed/100);
		if(motorDebug=='ON'){
			console.log("Motor 1 :" + motorM1State);
		}
	}
	if(motorM2State=="ON"){
		this.setMotor(2, motorM2Direction, motorM2Speed/100);
		if(motorDebug=='ON'){
			console.log("Motor 2 :" + motorM2State);
		}
	}
	if(motorM3State=="ON"){
		this.setMotor(3, motorM3Direction, motorM3Speed/100);
		if(motorDebug=='ON'){
			console.log("Motor 3 :" + motorM3State);
		}
	}
	if(motorM4State=="ON"){
		this.setMotor(4, motorM4Direction, motorM4Speed/100);
		if(motorDebug=='ON'){
			console.log("Motor 4 :" + motorM4State);
		}
	}
	if(motorM5State=="ON"){
		this.setMotor(5, motorM5Direction, motorM5Speed/100);
		if(motorDebug=='ON'){
			console.log("Motor 5 :" + motorM5State);
		}
	}	
	if(motorM6State=="ON"){
		this.setMotor(6, motorM6Direction, motorM6Speed/100);
		if(motorDebug=='ON'){
			console.log("Motor 6 :" + motorM6State);
		}
	}
	this.feedback=motor;
};
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
		this.feedback = " ERROR: Motor could not be selected in the setMotor function";
		console.log('ERROR: Motor could not be selected in the setMotor function');
	}
};
//============================Set all motors///////////////////////////////
Motor.prototype.setAllMotors=function(){
	var motorDebug = this.motors.control.motorDebug;
	var speed = this.motors.allMotors.controlSpeed;
	var angle = this.motors.allMotors.controlAngle;
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
		console.log("Could Not Interpret Command in setAllMotors function, Rover was STOPPED")
		this.feedback = "Could Not Interpret Command in setAllMotors function, Rover was STOPPED";
	}
};
Motor.prototype.setAllMotorsDirectionOnly=function(angle){
	if(angle==0 || angle==360){ // checks for angle 0
		this.setAllDirection(1,1);
	}
	else if(angle<=90 && angle>0){ // checks for angles 1-90
		this.setAllDirection( 1, 1);
	}
	else if(angle>90 && angle<180){ // checks for angles 91-179
		this.setAllDirection( 1, 1);
	}
	else if(angle==180){ // checks for angle 180
		this.setAllDirection(1, 1);
	}
	else if (angle>180 && angle <=270){
		this.setAllDirection( -1, -1);
	}
	else if (angle>270 && angle <360){
		this.setAllDirection( -1, -1);
	}
	else if (angle==361){
		this.setAllDirection( 1,-1);
	}
	else if (angle==362){
		this.setAllDirection( -1,1);
	}
	else{
		this.feedback = "Could Not Interpret Command in setAllMotorsDirectionOnly function, Rover was STOPPED";
		console.log("Could Not Interpret Command in setAllMotorsDirectionOnly function, Rover was STOPPED")
	}
};
Motor.prototype.setAllSpeed=function(Left, Right){
	this.spine.setPWM(this.motors.m1.pwmPin, Left/100);
	this.spine.setPWM(this.motors.m2.pwmPin, Left/100);
	this.spine.setPWM(this.motors.m3.pwmPin, Left/100);
	this.spine.setPWM(this.motors.m4.pwmPin, Right/100);
	this.spine.setPWM(this.motors.m5.pwmPin, Right/100);
	this.spine.setPWM(this.motors.m6.pwmPin, Right/100);
	if(this.motors.control.motorDebug == "ON"){
		console.log("Left speed " + Left + "Right speed " + Right);
	}
};
Motor.prototype.setAllDirection=function(left, Right){ //Sets Motors Forward or Directon 
	if(left==(1)) {
		this.spine.digitalWrite(this.motors.m1.dirPin, 1);
		this.spine.digitalWrite(this.motors.m2.dirPin, 1);
		this.spine.digitalWrite(this.motors.m3.dirPin, 1);
	}
	else if(left==(-1)){
		this.spine.digitalWrite(this.motors.m1.dirPin, 0);
		this.spine.digitalWrite(this.motors.m2.dirPin, 0);
		this.spine.digitalWrite(this.motors.m3.dirPin, 0);
	}
	if(Right==(1)){
		this.spine.digitalWrite(this.motors.m4.dirPin, 0);
		this.spine.digitalWrite(this.motors.m5.dirPin, 0);
		this.spine.digitalWrite(this.motors.m6.dirPin, 0);
		}
	else if(Right==(-1)){
		this.spine.digitalWrite(this.motors.m4.dirPin, 1);
		this.spine.digitalWrite(this.motors.m5.dirPin, 1);
		this.spine.digitalWrite(this.motors.m6.dirPin, 1);
	}
};
module.exports = exports = Motor;

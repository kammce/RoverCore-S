"use strict";

var Model = {
	

	gyro:{
		x:0,
		y:0,
		z:0
		},	

	accelero:{
		x:0,			
		y:0,
		z:0
		},

	compass:{							
		x:0,			
		y:0,
		z:0
		}, 
 	
 	GPS:{
		altitude:0,
		logitude:0,
		latitude:0
		},

	 Power:{
	 	voltage:0
		},

		wheel_speed:[0,0,0,0,0,0]

	heading:0,

	pitch_gyro:0,
	yaw_gyro:0,
	roll_gyro:0,

	pitch_accelero:0,
	yaw_accelero:0,
	roll_accelero:0		

}

module.exports = exports = Model;

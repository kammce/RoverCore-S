"use strict";

var Model = {
	test: 0.0,
	tracker: {
		pitch:0,
		yaw:0,
		zoom: 1
	},
	gyro : {
		x:0,					
		y:0,
		z:0
	},
	accelero: { 
		x:0,			
		y:0,
		z:0
	},

	compass:{
		heading:0
		}, 
 	
 	GPS:{
		longitude:0,      
		latitude:0, 
		longitude_dir:0, //dir = direction
		latitude_dir:0
	},
	power: {
	 	voltage:0,
	 	current:0,
	},
	wheel_speed:[0,0,0,0,0,0]
}

module.exports = exports = Model;
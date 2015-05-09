"use strict";

var Model = {
	
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
		current:0,
	 	voltage:0
	},
	acuator: {
		sent_position: "I",  //idle mode 
		potentiometer:0
		
	}

}

module.exports = exports = Model;

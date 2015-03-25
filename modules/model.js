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
		heading:0
		}, 
 	
 	GPS:{	
		longitude:0,      
		latitude:0, 
		longitude_dir:0, //dir = direction
		latitude_dir:0
		},

	 Power:{
	 	voltage:0
		},

		wheel_speed:[0,0,0,0,0,0]

}

module.exports = exports = Model;
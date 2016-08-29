##Tracker System README

#Description
The input is to be a JSON object with the following definition
	
		var Tracker_Object = {
			command: [object],
			
		}
#List of commands

Points camera at desired angle, using rover as reference frame

		
		mode: "moveAngleLocal",		
		yaw: [Integer],
		pitch: [Integer]
			
		
		
Moves camera by specified amount

		
		mode: "moveInterval",		
		yaw: [Integer],
		pitch: [Integer]			
			
		
Sets default position of camera

		
		mode: "defaultConfig",		
		yaw: [Integer],
		pitch: [Integer]
			
		
Moves to default position

		
		mode: "recalibrate"
		
Reads data from LIDAR

		
		mode: "getDistance"
		

Returns health status of LIDAR

		
		mode: "lidarHealth"
		
		
